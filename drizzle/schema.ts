import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const venues = mysqlTable("venues", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  capacity: int("capacity").notNull(),
  pricePaise: int("pricePaise").notNull(),
  availabilityMode: mysqlEnum("availabilityMode", ["instant", "partner", "manual"]).default("partner").notNull(),
  status: mysqlEnum("status", ["draft", "published", "paused"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const artistsTable = mysqlTable("artists", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  lineup: varchar("lineup", { length: 160 }).notNull(),
  pricePaise: int("pricePaise").notNull(),
  status: mysqlEnum("status", ["draft", "published", "paused"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const eventPlans = mysqlTable("eventPlans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId"),
  occasion: varchar("occasion", { length: 100 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  eventDate: varchar("eventDate", { length: 32 }).notNull(),
  guestCount: int("guestCount").notNull(),
  budgetPaise: int("budgetPaise").notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  selectedVenueId: varchar("selectedVenueId", { length: 64 }),
  selectedArtistId: varchar("selectedArtistId", { length: 64 }),
  status: mysqlEnum("status", ["draft", "requested", "quoted", "confirmed", "cancelled"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const availabilityRequests = mysqlTable("availabilityRequests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventPlanId: varchar("eventPlanId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "pending", "available", "unavailable", "expired", "error"]).default("draft").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventPlanId: varchar("eventPlanId", { length: 64 }).notNull(),
  venueFeePaise: int("venueFeePaise").notNull(),
  artistFeePaise: int("artistFeePaise").notNull(),
  productionFeePaise: int("productionFeePaise").notNull(),
  platformFeePaise: int("platformFeePaise").notNull(),
  taxPaise: int("taxPaise").notNull(),
  depositPaise: int("depositPaise").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "expired", "rejected"]).default("sent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  quoteId: varchar("quoteId", { length: 64 }).notNull(),
  amountPaise: int("amountPaise").notNull(),
  mode: mysqlEnum("mode", ["sandbox", "production"]).default("sandbox").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled", "refunded"]).default("pending").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventPlanId: varchar("eventPlanId", { length: 64 }).notNull(),
  quoteId: varchar("quoteId", { length: 64 }).notNull(),
  paymentId: varchar("paymentId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "cancel_requested", "cancelled", "completed"]).default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
