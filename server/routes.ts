import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertHealthDataSchema, insertBedMovementDataSchema, insertAlertSchema, insertRehabilitationDataSchema } from "@shared/schema";
import { z } from 'zod';

// ─── Sensor Integration ────────────────────────────────────────────────────
// Configurable via environment variables for AWS / other deployments.
//   SENSOR_API_URL        - full URL of the sensor readings endpoint
//   SENSOR_POLL_INTERVAL  - polling interval in milliseconds
const SENSOR_API_URL = process.env.SENSOR_API_URL || "https://SensorDeviceSvr.replit.app/api/readings";

// Parse poll interval safely: must be a positive integer >= 1000ms, otherwise fall back to 30s.
const DEFAULT_SENSOR_POLL_INTERVAL_MS = 30_000; // 30 seconds
const parsedPollInterval = parseInt(process.env.SENSOR_POLL_INTERVAL || "", 10);
const SENSOR_POLL_INTERVAL_MS =
  Number.isFinite(parsedPollInterval) && parsedPollInterval >= 1000
    ? parsedPollInterval
    : DEFAULT_SENSOR_POLL_INTERVAL_MS;
if (process.env.SENSOR_POLL_INTERVAL && SENSOR_POLL_INTERVAL_MS === DEFAULT_SENSOR_POLL_INTERVAL_MS && String(parsedPollInterval) !== process.env.SENSOR_POLL_INTERVAL) {
  console.warn(`[Sensor] Invalid SENSOR_POLL_INTERVAL="${process.env.SENSOR_POLL_INTERVAL}" (must be an integer >= 1000ms). Falling back to ${DEFAULT_SENSOR_POLL_INTERVAL_MS}ms.`);
}

// Map sensor MAC addresses → system user IDs
const MAC_TO_USER_ID: Record<string, number> = {
  "8CBFEAAE4A64": 1,
  "E4B323065F54": 2,
  "8CBFEAA77777": 3,
};

// Map sensor MAC addresses → friendly device names
const MAC_TO_DEVICE_NAME: Record<string, string> = {
  "8CBFEAAE4A64": "침대센서-A",
  "E4B323065F54": "침대센서-B",
  "8CBFEAA77777": "침대센서-C",
};

// Sensor position code → Korean position label
const POS_MAP: Record<string, string> = {
  "0": "누움",
  "1": "누움",
  "2": "앉음",
  "3": "서있음",
  "4": "서있음",
  "5": "서있음",
};

interface SensorReading {
  id: number;
  mac: string;
  pos: string;
  br: string;
  hr: string;
  en1: string; en2: string; en3: string;
  en4: string; en5: string; en6: string; en7: string;
  err: string;
  createdAt: string;
}

interface SensorStatus {
  connected: boolean;
  lastSync: Date | null;
  lastError: string | null;
  deviceCount: number;
  latestReadings: SensorReading[];
}

const sensorStatus: SensorStatus = {
  connected: false,
  lastSync: null,
  lastError: null,
  deviceCount: 0,
  latestReadings: [],
};

function computeMovementIntensity(reading: SensorReading): number {
  const vals = [reading.en1, reading.en2, reading.en3, reading.en4, reading.en5, reading.en6]
    .map(v => parseFloat(v) || 0);
  const total = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Normalize to 20–80 range
  const normalized = Math.min(80, Math.max(20, Math.round((total / 500) * 60 + 20)));
  return normalized;
}

function computeMobilityScore(pos: string, intensity: number): number {
  const posScore = pos === "3" || pos === "4" || pos === "5" ? 90 : pos === "2" ? 80 : 70;
  return Math.min(100, Math.max(60, Math.round((posScore + intensity) / 2)));
}

async function fetchAndStoreSensorData(wss: WebSocketServer): Promise<void> {
  try {
    const res = await fetch(SENSOR_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const readings: SensorReading[] = await res.json();

    sensorStatus.connected = true;
    sensorStatus.lastSync = new Date();
    sensorStatus.lastError = null;
    sensorStatus.latestReadings = readings;

    // Get unique MACs from this fetch to count devices
    const knownMacs = readings.map(r => r.mac).filter(m => MAC_TO_USER_ID[m]);
    sensorStatus.deviceCount = new Set(knownMacs).size;

    // Group by MAC, take latest reading per device
    const latestByMac = new Map<string, SensorReading>();
    for (const reading of readings) {
      if (!latestByMac.has(reading.mac)) {
        latestByMac.set(reading.mac, reading);
      }
    }

    for (const [mac, reading] of latestByMac) {
      const userId = MAC_TO_USER_ID[mac];
      if (!userId) continue;

      const hr = parseInt(reading.hr, 10);
      const br = parseInt(reading.br, 10);
      const pos = reading.pos;
      const hasValidVitals = hr > 0 || br > 0;

      // Store health data only when sensor has valid readings
      if (hasValidVitals) {
        const healthData = {
          userId,
          heartRate: hr > 0 ? hr : 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          bodyTemperature: 36.5,
          respiratoryRate: br > 0 ? br : 16,
          steps: 0,
          stressLevel: "보통",
        };
        await storage.createHealthData(healthData);

        // Alert on abnormal vitals
        if (hr > 100 || hr < 50) {
          await storage.createAlert({
            userId,
            type: "health",
            severity: "critical",
            title: "센서 이상 감지",
            message: `[${MAC_TO_DEVICE_NAME[mac] || mac}] 심박수 이상: ${hr}bpm`,
            data: JSON.stringify(reading),
          });
        }
      }

      // Always store bed movement data from position sensor
      const intensity = computeMovementIntensity(reading);
      const mobilityScore = computeMobilityScore(pos, intensity);
      const bedMovementData = {
        userId,
        position: POS_MAP[pos] || "누움",
        movementIntensity: intensity,
        heartRateVariability: parseFloat((Math.random() * 10 + 35).toFixed(1)),
        sleepQuality: intensity < 30 ? "poor" : intensity < 50 ? "fair" : "good",
        bedPressure: parseFloat((parseFloat(reading.en4) / 10).toFixed(1)) || 35.0,
        mobilityScore,
        isInBed: pos === "0" || pos === "1",
      };
      await storage.createBedMovementData(bedMovementData);

      // Broadcast sensor update via WebSocket
      const wsPayload = JSON.stringify({
        type: "sensor-update",
        source: "sensor",
        deviceName: MAC_TO_DEVICE_NAME[mac] || mac,
        userId,
        mac,
        healthData: hasValidVitals ? {
          heartRate: parseInt(reading.hr, 10) || 72,
          respiratoryRate: parseInt(reading.br, 10) || 16,
        } : null,
        bedMovementData,
        rawReading: reading,
      });
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(wsPayload);
      });
    }

    console.log(`[Sensor] Synced ${latestByMac.size} devices at ${new Date().toISOString()}`);
  } catch (err: any) {
    sensorStatus.connected = false;
    sensorStatus.lastError = err.message || "Unknown error";
    console.error("[Sensor] Fetch error:", err.message);
  }
}
// ──────────────────────────────────────────────────────────────────────────

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get latest health data for user
  app.get("/api/users/:id/health/latest", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const healthData = await storage.getLatestHealthData(userId);
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health data" });
    }
  });

  // Get health data history for user
  app.get("/api/users/:id/health/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const history = await storage.getHealthDataHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health history" });
    }
  });

  // Get weekly health stats for user
  app.get("/api/users/:id/health/weekly", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const stats = await storage.getWeeklyHealthStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly health stats" });
    }
  });

  // Get latest bed movement data for user
  app.get("/api/users/:id/bedmovement/latest", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const bedMovementData = await storage.getLatestBedMovementData(userId);
      res.json(bedMovementData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed movement data" });
    }
  });

  // Get location history for user
  app.get("/api/users/:id/location/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const date = req.query.date as string;
      const locationHistory = await storage.getLocationHistory(userId, date);
      res.json(locationHistory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  // Get latest health data for user
  app.get("/api/users/:id/health/latest", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const healthData = await storage.getLatestHealthData(userId);
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health data" });
    }
  });

  // Get bed movement data history for user
  app.get("/api/users/:id/bedmovement/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const history = await storage.getBedMovementDataHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bed movement history" });
    }
  });

  // Get weekly bed movement stats for user
  app.get("/api/users/:id/bedmovement/weekly", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const stats = await storage.getWeeklyBedMovementStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly bed movement stats" });
    }
  });

  // Get alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const alerts = await storage.getAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Mark alert as read
  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // Get unread alert count
  app.get("/api/alerts/unread/count", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const count = await storage.getUnreadAlertCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread alert count" });
    }
  });

  // Get location history for user
  app.get("/api/users/:id/location/:date?", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const date = req.params.date;
      const locationHistory = await storage.getLocationHistory(userId, date);
      res.json(locationHistory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    
    // Admin login
    if (id === 'test' && password === 'test123') {
      const user = { id: 'test', name: 'Admin User', isAdmin: true };
      res.json({ success: true, user });
      return;
    }
    
    // Member login
    const user = storage.getUserByCredentials(id, password);
    if (user) {
      const sessionUser = { 
        id: user.id.toString(), 
        name: user.name, 
        username: user.username,
        isAdmin: false,
        memberData: user
      };
      res.json({ success: true, user: sessionUser });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Sensor status endpoint
  app.get("/api/sensor/status", (_req, res) => {
    res.json({
      connected: sensorStatus.connected,
      lastSync: sensorStatus.lastSync,
      lastError: sensorStatus.lastError,
      deviceCount: sensorStatus.deviceCount,
      deviceNames: Object.values(MAC_TO_DEVICE_NAME),
      macMapping: Object.entries(MAC_TO_USER_ID).map(([mac, userId]) => ({
        mac,
        deviceName: MAC_TO_DEVICE_NAME[mac] || mac,
        userId,
      })),
    });
  });

  // Latest raw sensor readings proxy endpoint
  app.get("/api/sensor/readings", (_req, res) => {
    res.json(sensorStatus.latestReadings);
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          // Client wants to subscribe to real-time updates
          ws.send(JSON.stringify({ type: 'subscribed', message: 'Successfully subscribed to real-time updates' }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Simulate real-time data generation
  setInterval(() => {
    const users = Array.from(storage['users'].values());
    
    users.forEach(async (user) => {
      // Generate random health data
      const healthData = {
        userId: user.id,
        heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
        bloodPressureSystolic: Math.floor(Math.random() * 40) + 110, // 110-150
        bloodPressureDiastolic: Math.floor(Math.random() * 20) + 70, // 70-90
        bodyTemperature: Number((Math.random() * 2 + 36.0).toFixed(1)), // 36.0-38.0°C
        respiratoryRate: Math.floor(Math.random() * 8) + 12, // 12-20 breaths per minute
        steps: Math.floor(Math.random() * 500) + 7000, // 7000-7500
        stressLevel: ['낮음', '보통', '높음'][Math.floor(Math.random() * 3)]
      };

      // Generate random bed movement data
      const bedMovementData = {
        userId: user.id,
        position: ['누움', '앉음', '서있음'][Math.floor(Math.random() * 3)],
        movementIntensity: Math.floor(Math.random() * 30) + 20, // 20-50 scale
        heartRateVariability: parseFloat((Math.random() * 20 + 30).toFixed(1)), // 30-50 ms
        sleepQuality: ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)],
        bedPressure: parseFloat((Math.random() * 50 + 20).toFixed(1)), // 20-70 pressure units
        mobilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        isInBed: Math.random() > 0.2 // 80% chance of being in bed
      };

      await storage.createHealthData(healthData);
      await storage.createBedMovementData(bedMovementData);

      // Check for alerts
      if (healthData.heartRate > 100 || healthData.bloodPressureSystolic > 140) {
        await storage.createAlert({
          userId: user.id,
          type: 'health',
          severity: 'critical',
          title: '건강 이상 감지',
          message: `${healthData.heartRate > 100 ? '심박수 이상' : '고혈압'} 감지됨`,
          data: JSON.stringify(healthData)
        });
      }

      if (bedMovementData.movementIntensity < 25 || bedMovementData.mobilityScore < 75) {
        await storage.createAlert({
          userId: user.id,
          type: 'movement',
          severity: 'warning',
          title: '움직임 이상 감지',
          message: `${bedMovementData.movementIntensity < 25 ? '움직임 부족' : '낮은 활동성'} 감지됨`,
          data: JSON.stringify(bedMovementData)
        });
      }

      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'real-time-update',
            userId: user.id,
            healthData,
            bedMovementData
          }));
        }
      });
    });
  }, 2000); // Update every 2 seconds

  // ─── Start sensor polling ──────────────────────────────────────────────────
  // Initial fetch immediately on startup, then poll every 30 seconds
  fetchAndStoreSensorData(wss);
  setInterval(() => fetchAndStoreSensorData(wss), SENSOR_POLL_INTERVAL_MS);
  // ──────────────────────────────────────────────────────────────────────────

  // Rehabilitation data routes
  app.get('/api/users/:userId/rehabilitation/history', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
      const rehabilitationHistory = await storage.getRehabilitationHistory(userId);
      res.json(rehabilitationHistory);
    } catch (error) {
      console.error('Error fetching rehabilitation history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users/:userId/rehabilitation', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
      const rehabilitationData = insertRehabilitationDataSchema.parse({
        ...req.body,
        userId
      });
      
      const result = await storage.createRehabilitationData(rehabilitationData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating rehabilitation data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return httpServer;
}
