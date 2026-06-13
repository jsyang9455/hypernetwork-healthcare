import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  height: real("height"), // in cm
  weight: real("weight"), // in kg
  profileImage: text("profile_image"),
  emergencyContact: text("emergency_contact"),
  doctorContact: text("doctor_contact"),
  medicalConditions: text("medical_conditions").array(),
  surgicalHistory: text("surgical_history").array(),
  allergies: text("allergies").array(),
  medications: text("medications").array(),
  bedLocation: text("bed_location"), // room number or location
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  heartRate: integer("heart_rate").notNull(),
  bloodPressureSystolic: integer("blood_pressure_systolic").notNull(),
  bloodPressureDiastolic: integer("blood_pressure_diastolic").notNull(),
  bodyTemperature: real("body_temperature").notNull(), // in Celsius
  respiratoryRate: integer("respiratory_rate").notNull(), // breaths per minute
  steps: integer("steps").notNull(),
  stressLevel: text("stress_level").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const bedMovementData = pgTable("bed_movement_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  position: text("position").notNull(), // 'lying', 'sitting', 'standing'
  movementIntensity: real("movement_intensity").notNull(), // 0-100 scale
  heartRateVariability: real("heart_rate_variability").notNull(),
  sleepQuality: text("sleep_quality").notNull(), // 'poor', 'fair', 'good', 'excellent'
  bedPressure: real("bed_pressure").notNull(), // pressure sensor reading
  mobilityScore: integer("mobility_score").notNull(), // 0-100 mobility assessment
  isInBed: boolean("is_in_bed").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'health' or 'movement'
  severity: text("severity").notNull(), // 'normal', 'warning', 'critical'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string for additional data
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const locationData = pgTable("location_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  locationName: text("location_name"),
  isDriving: boolean("is_driving").default(false),
  speed: real("speed").default(0), // km/h
  isInBed: boolean("is_in_bed").default(true),
  lastMovement: timestamp("last_movement"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const rehabilitationData = pgTable("rehabilitation_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(), // 물리치료, 운동치료, 침상치료, 기능회복훈련, 직원교육
  treatment: text("treatment").notNull(), // 세부 치료 내용
  duration: integer("duration").notNull(), // 치료 시간 (분)
  therapist: text("therapist").notNull(), // 치료사/담당자
  notes: text("notes"), // 특이사항
  status: text("status").notNull(), // completed, scheduled, cancelled
  sessionDate: timestamp("session_date").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  timestamp: true,
});

export const insertBedMovementDataSchema = createInsertSchema(bedMovementData).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertLocationDataSchema = createInsertSchema(locationData).omit({
  id: true,
  timestamp: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type HealthData = typeof healthData.$inferSelect;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type BedMovementData = typeof bedMovementData.$inferSelect;
export type InsertBedMovementData = z.infer<typeof insertBedMovementDataSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type LocationData = typeof locationData.$inferSelect;
export type InsertLocationData = z.infer<typeof insertLocationDataSchema>;

// Rehabilitation Data
export const insertRehabilitationDataSchema = createInsertSchema(rehabilitationData);
export type RehabilitationData = typeof rehabilitationData.$inferSelect;
export type InsertRehabilitationData = z.infer<typeof insertRehabilitationDataSchema>;
