import { 
  users, 
  healthData, 
  bedMovementData, 
  alerts,
  locationData,
  rehabilitationData,
  type User, 
  type InsertUser,
  type HealthData,
  type InsertHealthData,
  type BedMovementData,
  type InsertBedMovementData,
  type Alert,
  type InsertAlert,
  type LocationData,
  type InsertLocationData,
  type RehabilitationData,
  type InsertRehabilitationData
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Health data
  getLatestHealthData(userId: number): Promise<HealthData | undefined>;
  getHealthDataHistory(userId: number, limit?: number): Promise<HealthData[]>;
  createHealthData(data: InsertHealthData): Promise<HealthData>;
  getWeeklyHealthStats(userId: number): Promise<any>;

  // Bed movement data
  getLatestBedMovementData(userId: number): Promise<BedMovementData | undefined>;
  getBedMovementDataHistory(userId: number, limit?: number): Promise<BedMovementData[]>;
  createBedMovementData(data: InsertBedMovementData): Promise<BedMovementData>;
  getWeeklyBedMovementStats(userId: number): Promise<any>;

  // Alerts
  getAlerts(userId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<void>;
  getUnreadAlertCount(userId?: number): Promise<number>;

  // Location data
  getLocationHistory(userId: number, date?: string): Promise<LocationData[]>;
  createLocationData(data: InsertLocationData): Promise<LocationData>;

  // Rehabilitation data
  getRehabilitationHistory(userId: number): Promise<RehabilitationData[]>;
  createRehabilitationData(data: InsertRehabilitationData): Promise<RehabilitationData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private healthData: Map<number, HealthData>;
  private bedMovementData: Map<number, BedMovementData>;
  private alerts: Map<number, Alert>;
  private locationData: Map<number, LocationData>;
  private rehabilitationData: Map<number, RehabilitationData>;
  private currentUserId: number;
  private currentHealthId: number;
  private currentBedMovementId: number;
  private currentAlertId: number;
  private currentLocationId: number;
  private currentRehabilitationId: number;

  constructor() {
    this.users = new Map();
    this.healthData = new Map();
    this.bedMovementData = new Map();
    this.alerts = new Map();
    this.locationData = new Map();
    this.rehabilitationData = new Map();
    this.currentUserId = 1;
    this.currentHealthId = 1;
    this.currentBedMovementId = 1;
    this.currentAlertId = 1;
    this.currentLocationId = 1;
    this.currentRehabilitationId = 1;

    // Initialize with sample data
    this.initializeSampleData();
    this.initializeLocationData();
    this.initializeRehabilitationData();
  }

  private initializeSampleData() {
    // Create sample users for multiple floors and rooms
    const sampleUsers: InsertUser[] = [
      // 1층 (101호-110호)
      {
        username: "kimmy",
        password: "password123",
        name: "김미영",
        age: 75,
        gender: "여성",
        height: 162.5,
        weight: 58.2,
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b151084c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-1234-5678",
        doctorContact: "02-1234-5678",
        medicalConditions: ["고혈압", "고지혈증"],
        surgicalHistory: ["맹장 수술 (2018년)", "담낭 제거술 (2020년)"],
        allergies: ["페니실린", "새우"],
        medications: ["아스피린 (매일)", "혈압약 (매일)"],
        bedLocation: "101호"
      },
      {
        username: "leejh",
        password: "password123",
        name: "이준호",
        age: 68,
        gender: "남성",
        height: 175.0,
        weight: 72.3,
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-2345-6789",
        doctorContact: "02-2345-6789",
        medicalConditions: ["당뇨"],
        surgicalHistory: [],
        allergies: [],
        medications: ["메트포르민 (매일)"],
        bedLocation: "102호"
      },
      {
        username: "parksy",
        password: "password123",
        name: "박서영",
        age: 82,
        gender: "여성",
        height: 158.0,
        weight: 52.1,
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-3456-7890",
        doctorContact: "02-3456-7890",
        medicalConditions: ["관절염"],
        surgicalHistory: [],
        allergies: [],
        medications: ["소염제 (매일)"],
        bedLocation: "103호"
      },
      {
        username: "choidw",
        password: "password123",
        name: "최동원",
        age: 71,
        gender: "남성",
        height: 168.0,
        weight: 65.8,
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-4567-8901",
        doctorContact: "02-4567-8901",
        medicalConditions: ["고혈압"],
        surgicalHistory: [],
        allergies: [],
        medications: ["혈압약 (매일)"],
        bedLocation: "104호"
      },
      {
        username: "yoonhj",
        password: "password123",
        name: "윤혜진",
        age: 79,
        gender: "여성",
        height: 155.0,
        weight: 48.5,
        profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-5678-9012",
        doctorContact: "02-5678-9012",
        medicalConditions: ["당뇨", "골다공증"],
        surgicalHistory: [],
        allergies: [],
        medications: ["인슐린 (매일)", "칼슘제 (매일)"],
        bedLocation: "105호"
      },
      // 2층 (201호-210호)
      {
        username: "kangms",
        password: "password123",
        name: "강민수",
        age: 73,
        gender: "남성",
        height: 172.0,
        weight: 68.4,
        profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-6789-0123",
        doctorContact: "02-6789-0123",
        medicalConditions: ["고지혈증"],
        surgicalHistory: [],
        allergies: [],
        medications: ["스타틴 (매일)"],
        bedLocation: "201호"
      },
      {
        username: "leegh",
        password: "password123",
        name: "이금희",
        age: 77,
        gender: "여성",
        height: 160.0,
        weight: 55.2,
        profileImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-7890-1234",
        doctorContact: "02-7890-1234",
        medicalConditions: ["치매 초기"],
        surgicalHistory: [],
        allergies: [],
        medications: ["도네페질 (매일)"],
        bedLocation: "202호"
      },
      // 3층 (301호-310호)
      {
        username: "parkjk",
        password: "password123",
        name: "박정규",
        age: 85,
        gender: "남성",
        height: 165.0,
        weight: 62.1,
        profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64",
        emergencyContact: "010-8901-2345",
        doctorContact: "02-8901-2345",
        medicalConditions: ["심부전"],
        surgicalHistory: [],
        allergies: [],
        medications: ["이뇨제 (매일)"],
        bedLocation: "301호"
      }
    ];

    sampleUsers.forEach(user => this.createUser(user));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  // Get user by credentials
  getUserByCredentials(username: string, password: string): User | undefined {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.username === username && user.password === password) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      height: insertUser.height || null,
      weight: insertUser.weight || null,
      profileImage: insertUser.profileImage || null,
      emergencyContact: insertUser.emergencyContact || null,
      doctorContact: insertUser.doctorContact || null,
      medicalConditions: insertUser.medicalConditions || null,
      surgicalHistory: insertUser.surgicalHistory || null,
      allergies: insertUser.allergies || null,
      medications: insertUser.medications || null,
      bedLocation: insertUser.bedLocation || null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getLatestHealthData(userId: number): Promise<HealthData | undefined> {
    const userHealthData = Array.from(this.healthData.values())
      .filter(data => data.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
    
    return userHealthData[0];
  }

  async getHealthDataHistory(userId: number, limit = 10): Promise<HealthData[]> {
    return Array.from(this.healthData.values())
      .filter(data => data.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const id = this.currentHealthId++;
    const healthRecord: HealthData = {
      ...data,
      id,
      timestamp: new Date()
    };
    this.healthData.set(id, healthRecord);
    return healthRecord;
  }

  async getWeeklyHealthStats(userId: number): Promise<any> {
    const weekData = Array.from(this.healthData.values())
      .filter(data => data.userId === userId)
      .filter(data => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return data.timestamp! > weekAgo;
      });

    if (weekData.length === 0) return null;

    const avgHeartRate = weekData.reduce((sum, data) => sum + data.heartRate, 0) / weekData.length;
    const avgSystolic = weekData.reduce((sum, data) => sum + data.bloodPressureSystolic, 0) / weekData.length;
    const avgDiastolic = weekData.reduce((sum, data) => sum + data.bloodPressureDiastolic, 0) / weekData.length;
    const avgBodyTemperature = weekData.reduce((sum, data) => sum + data.bodyTemperature, 0) / weekData.length;
    const avgRespiratoryRate = weekData.reduce((sum, data) => sum + data.respiratoryRate, 0) / weekData.length;
    const avgSteps = weekData.reduce((sum, data) => sum + data.steps, 0) / weekData.length;

    return {
      avgHeartRate: Math.round(avgHeartRate),
      avgBloodPressure: `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)}`,
      avgBodyTemperature: Number(avgBodyTemperature.toFixed(1)),
      avgRespiratoryRate: Math.round(avgRespiratoryRate),
      avgSteps: Math.round(avgSteps),
      stressLevel: "낮음"
    };
  }

  async getLatestBedMovementData(userId: number): Promise<BedMovementData | undefined> {
    const userBedMovementData = Array.from(this.bedMovementData.values())
      .filter(data => data.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
    
    return userBedMovementData[0];
  }

  async getBedMovementDataHistory(userId: number, limit = 10): Promise<BedMovementData[]> {
    return Array.from(this.bedMovementData.values())
      .filter(data => data.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createBedMovementData(data: InsertBedMovementData): Promise<BedMovementData> {
    const id = this.currentBedMovementId++;
    const bedMovementRecord: BedMovementData = {
      ...data,
      id,
      timestamp: new Date()
    };
    this.bedMovementData.set(id, bedMovementRecord);
    return bedMovementRecord;
  }

  async getWeeklyBedMovementStats(userId: number): Promise<any> {
    const weekData = Array.from(this.bedMovementData.values())
      .filter(data => data.userId === userId)
      .filter(data => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return data.timestamp! > weekAgo;
      });

    if (weekData.length === 0) return null;

    const avgMovementIntensity = weekData.reduce((sum, data) => sum + data.movementIntensity, 0) / weekData.length;
    const avgHeartRateVariability = weekData.reduce((sum, data) => sum + data.heartRateVariability, 0) / weekData.length;
    const avgMobilityScore = weekData.reduce((sum, data) => sum + data.mobilityScore, 0) / weekData.length;

    return {
      avgMovementIntensity: Math.round(avgMovementIntensity),
      avgHeartRateVariability: parseFloat(avgHeartRateVariability.toFixed(1)),
      avgMobilityScore: Math.round(avgMobilityScore),
      sleepQuality: "양호"
    };
  }

  async getAlerts(userId?: number): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    if (userId) {
      alerts = alerts.filter(alert => alert.userId === userId);
    }
    return alerts.sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
    const alertRecord: Alert = {
      ...alert,
      id,
      timestamp: new Date(),
      data: alert.data || null,
      isRead: alert.isRead || false
    };
    this.alerts.set(id, alertRecord);
    return alertRecord;
  }

  async markAlertAsRead(id: number): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isRead = true;
      this.alerts.set(id, alert);
    }
  }

  async getUnreadAlertCount(userId?: number): Promise<number> {
    let alerts = Array.from(this.alerts.values()).filter(alert => !alert.isRead);
    if (userId) {
      alerts = alerts.filter(alert => alert.userId === userId);
    }
    return alerts.length;
  }

  // Location data methods
  async getLocationHistory(userId: number, date?: string): Promise<LocationData[]> {
    const locationArray = Array.from(this.locationData.values());
    let userLocations = locationArray.filter(location => location.userId === userId);
    
    if (date) {
      const targetDate = new Date(date);
      userLocations = userLocations.filter(location => {
        const locationDate = location.timestamp ? new Date(location.timestamp) : new Date();
        return locationDate.toDateString() === targetDate.toDateString();
      });
    }
    
    return userLocations.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  }

  async createLocationData(data: InsertLocationData): Promise<LocationData> {
    const id = this.currentLocationId++;
    const locationData: LocationData = {
      id,
      timestamp: new Date(),
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || null,
      locationName: data.locationName || null,
      isDriving: data.isDriving || null,
      speed: data.speed || null,
      isInBed: data.isInBed || null,
      lastMovement: data.lastMovement || null,
    };
    
    this.locationData.set(id, locationData);
    return locationData;
  }

  private initializeLocationData() {
    // Generate sample location data for the last 7 days
    const userIds = [1, 2, 3]; // kimmy, leejh, parksy
    const locations = [
      { name: "집", lat: 37.5665, lng: 126.978, address: "서울특별시 중구 명동" },
      { name: "회사", lat: 37.5651, lng: 126.9895, address: "서울특별시 중구 을지로" },
      { name: "마트", lat: 37.5601, lng: 126.9742, address: "서울특별시 중구 소공동" },
      { name: "병원", lat: 37.5635, lng: 126.9826, address: "서울특별시 중구 장교동" },
      { name: "카페", lat: 37.5668, lng: 126.9779, address: "서울특별시 중구 명동1가" },
    ];

    userIds.forEach(userId => {
      for (let day = 6; day >= 0; day--) {
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - day);
        
        // Morning: leaving home
        const morningTime = new Date(baseDate);
        morningTime.setHours(8, 0, 0, 0);
        const morningLocationId = this.currentLocationId++;
        this.locationData.set(morningLocationId, {
          id: morningLocationId,
          userId,
          latitude: locations[0].lat + (Math.random() - 0.5) * 0.001,
          longitude: locations[0].lng + (Math.random() - 0.5) * 0.001,
          address: locations[0].address,
          locationName: locations[0].name,
          isDriving: false,
          speed: 0,
          isInBed: true,
          lastMovement: null,
          timestamp: morningTime,
        });

        // Commute to work
        for (let i = 1; i <= 3; i++) {
          const transitTime = new Date(baseDate);
          transitTime.setHours(8, 30 + i * 10, 0, 0);
          
          const transitLocationId = this.currentLocationId++;
          this.locationData.set(transitLocationId, {
            id: transitLocationId,
            userId,
            latitude: locations[0].lat + (locations[1].lat - locations[0].lat) * (i / 3) + (Math.random() - 0.5) * 0.001,
            longitude: locations[0].lng + (locations[1].lng - locations[0].lng) * (i / 3) + (Math.random() - 0.5) * 0.001,
            address: `이동 중 ${i}`,
            locationName: "이동 중",
            isDriving: true,
            speed: Math.round(20 + Math.random() * 30),
            isInBed: false,
            lastMovement: transitTime,
            timestamp: transitTime,
          });
        }

        // At work
        const workTime = new Date(baseDate);
        workTime.setHours(9, 0, 0, 0);
        const workLocationId = this.currentLocationId++;
        this.locationData.set(workLocationId, {
          id: workLocationId,
          userId,
          latitude: locations[1].lat + (Math.random() - 0.5) * 0.001,
          longitude: locations[1].lng + (Math.random() - 0.5) * 0.001,
          address: locations[1].address,
          locationName: locations[1].name,
          isDriving: false,
          speed: 0,
          isInBed: false,
          lastMovement: workTime,
          timestamp: workTime,
        });

        // Evening commute home
        const eveningTime = new Date(baseDate);
        eveningTime.setHours(18, 30, 0, 0);
        const eveningLocationId = this.currentLocationId++;
        this.locationData.set(eveningLocationId, {
          id: eveningLocationId,
          userId,
          latitude: locations[0].lat + (Math.random() - 0.5) * 0.001,
          longitude: locations[0].lng + (Math.random() - 0.5) * 0.001,
          address: locations[0].address,
          locationName: locations[0].name,
          isDriving: false,
          speed: 0,
          isInBed: true,
          lastMovement: null,
          timestamp: eveningTime,
        });
      }
    });
  }

  private initializeRehabilitationData() {
    const userIds = [1, 2, 3, 4, 5, 6, 7, 8];
    const categories = [
      { name: "물리치료", treatments: ["온열치료", "전기치료", "순환치료"] },
      { name: "운동치료", treatments: ["관절운동치료", "근력운동치료", "균형운동치료", "보행운동치료"] },
      { name: "침상치료", treatments: ["관절구축예방운동", "ADL유지"] },
      { name: "기능회복훈련", treatments: ["신체기능회복훈련", "기본동작훈련", "일상생활동작훈련"] },
      { name: "직원교육", treatments: ["근골격계질환예방교육"] }
    ];
    const therapists = ["김물리치료사", "이운동치료사", "박재활치료사", "최작업치료사", "정언어치료사"];
    const statuses = ["completed", "scheduled", "cancelled"];

    userIds.forEach(userId => {
      for (let week = 4; week >= 0; week--) {
        categories.forEach(category => {
          category.treatments.forEach(treatment => {
            // Generate 1-2 sessions per treatment per week
            const sessionsCount = Math.floor(Math.random() * 2) + 1;
            
            for (let session = 0; session < sessionsCount; session++) {
              const baseDate = new Date();
              baseDate.setDate(baseDate.getDate() - (week * 7) + Math.floor(Math.random() * 7));
              
              const sessionDate = new Date(baseDate);
              sessionDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);
              
              const rehabId = this.currentRehabilitationId++;
              const status = Math.random() > 0.1 ? "completed" : (Math.random() > 0.5 ? "scheduled" : "cancelled");
              
              this.rehabilitationData.set(rehabId, {
                id: rehabId,
                userId,
                category: category.name,
                treatment,
                duration: 30 + Math.floor(Math.random() * 31), // 30-60분
                therapist: therapists[Math.floor(Math.random() * therapists.length)],
                notes: status === "completed" ? 
                  ["환자 협조적", "진전 보임", "지속적인 관리 필요", "컨디션 양호", "추가 운동 권장"][Math.floor(Math.random() * 5)] : 
                  status === "cancelled" ? "환자 컨디션 난조" : null,
                status,
                sessionDate,
                timestamp: sessionDate,
              });
            }
          });
        });
      }
    });
  }

  async getRehabilitationHistory(userId: number): Promise<RehabilitationData[]> {
    const userRehabilitation = Array.from(this.rehabilitationData.values())
      .filter(rehab => rehab.userId === userId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    
    return userRehabilitation;
  }

  async createRehabilitationData(data: InsertRehabilitationData): Promise<RehabilitationData> {
    const id = this.currentRehabilitationId++;
    const rehabilitationRecord: RehabilitationData = {
      id,
      ...data,
      notes: data.notes ?? null,
      timestamp: new Date(),
    };
    
    this.rehabilitationData.set(id, rehabilitationRecord);
    return rehabilitationRecord;
  }
}

export const storage = new MemStorage();
