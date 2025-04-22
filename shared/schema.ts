import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
});

export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").notNull().default("primary"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const boardMembers = pgTable("board_members", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("editor"), // viewer, editor, admin
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("todo"), // todo, in-progress, completed
  assignedTo: integer("assigned_to"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  phoneNumber: true,
  displayName: true,
  photoURL: true,
});

export const insertBoardSchema = createInsertSchema(boards).pick({
  title: true,
  description: true,
  color: true,
  createdBy: true,
});

export const insertBoardMemberSchema = createInsertSchema(boardMembers).pick({
  boardId: true,
  userId: true,
  role: true,
});

export const insertTodoSchema = createInsertSchema(todos).pick({
  boardId: true,
  title: true,
  description: true,
  dueDate: true,
  priority: true,
  status: true,
  assignedTo: true,
  createdBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;

export type BoardMember = typeof boardMembers.$inferSelect;
export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;

export type Todo = typeof todos.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;

// Extended types with additional info
export type BoardWithMemberCount = Board & { todoCount: number; memberCount: number };
export type TodoWithAssignee = Todo & { assignee?: User };
export type BoardWithMembers = Board & { members: User[] };
