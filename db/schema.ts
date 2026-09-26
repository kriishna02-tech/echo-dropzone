import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(), deviceKey: text("device_key").notNull(), name: text("name").notNull(),
  totalScore: integer("total_score").notNull().default(0), bestLevel: integer("best_level").notNull().default(1), matches: integer("matches").notNull().default(0),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, table => [uniqueIndex("idx_profiles_device_key").on(table.deviceKey), index("idx_profiles_score").on(table.totalScore)]);

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(), code: text("code").notNull(), status: text("status").notNull().default("waiting"), hostPlayerId: text("host_player_id").notNull(),
  level: integer("level").notNull().default(1), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(), startedAt: integer("started_at"),
}, table => [uniqueIndex("idx_rooms_code").on(table.code)]);

export const players = sqliteTable("players", {
  id: text("id").primaryKey(), roomId: text("room_id").notNull(), profileId: text("profile_id").notNull(), token: text("token").notNull(), name: text("name").notNull(), slot: integer("slot").notNull(),
  x: real("x").notNull().default(0), z: real("z").notNull().default(8), heading: real("heading").notNull().default(0), score: integer("score").notNull().default(0), hits: integer("hits").notNull().default(0), shots: integer("shots").notNull().default(0),
  weapon: text("weapon").notNull().default("PULSE_SIDEARM"), perk: text("perk").notNull().default("NONE"), lastShotAt: integer("last_shot_at").notNull().default(0), joinedAt: integer("joined_at").notNull(), lastSeenAt: integer("last_seen_at").notNull(),
}, table => [uniqueIndex("idx_players_token").on(table.token), uniqueIndex("idx_players_room_name").on(table.roomId, table.name), index("idx_players_room").on(table.roomId)]);

export const targets = sqliteTable("targets", {
  id: text("id").primaryKey(), roomId: text("room_id").notNull(), level: integer("level").notNull(), targetIndex: integer("target_index").notNull(),
  x: real("x").notNull(), z: real("z").notNull(), hp: integer("hp").notNull(), maxHp: integer("max_hp").notNull(), kind: text("kind").notNull(), updatedAt: integer("updated_at").notNull(),
}, table => [uniqueIndex("idx_targets_room_index").on(table.roomId, table.targetIndex), index("idx_targets_room_level").on(table.roomId, table.level)]);
