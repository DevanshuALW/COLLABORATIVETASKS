import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertBoardSchema,
  insertBoardMemberSchema,
  insertTodoSchema,
  insertUserSchema
} from "@shared/schema";
import { hashPassword, comparePassword } from "./utils/password";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user with phone number already exists
      const existingUser = await storage.getUserByPhoneNumber(userData.phoneNumber);
      if (existingUser) {
        return res.status(409).json({ message: "User with this phone number already exists" });
      }

      // Hash the password before storing it
      const hashedPassword = await hashPassword(userData.password);

      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error('Error registering user:', error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/verify-phone", async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const user = await storage.getUserByPhoneNumber(phoneNumber);
      res.json({ exists: !!user });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify phone number" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, password } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you would create a session here
      // For this prototype, we'll just return the user without password
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Board routes
  app.get("/api/boards", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const boards = await storage.getBoardsByUser(userId);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const board = await storage.getBoardWithMembers(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      res.json(board);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  app.post("/api/boards", async (req: Request, res: Response) => {
    try {
      const boardData = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(boardData);
      res.status(201).json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  app.put("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const { title, description, color } = req.body;
      const updates = { title, description, color };

      const updatedBoard = await storage.updateBoard(boardId, updates);
      if (!updatedBoard) {
        return res.status(404).json({ message: "Board not found" });
      }

      res.json(updatedBoard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const deleted = await storage.deleteBoard(boardId);
      if (!deleted) {
        return res.status(404).json({ message: "Board not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // Board members routes
  app.get("/api/boards/:id/members", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const members = await storage.getBoardMembers(boardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch board members" });
    }
  });

  app.post("/api/boards/:id/members", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const memberData = insertBoardMemberSchema.parse({
        ...req.body,
        boardId
      });

      const member = await storage.addBoardMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add board member" });
    }
  });

  app.delete("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "Valid board ID and user ID are required" });
      }

      const deleted = await storage.removeBoardMember(boardId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Board member not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove board member" });
    }
  });

  app.patch("/api/boards/:boardId/members/:userId", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.boardId);
      const userId = parseInt(req.params.userId);

      if (isNaN(boardId) || isNaN(userId)) {
        return res.status(400).json({ message: "Valid board ID and user ID are required" });
      }

      const { role } = req.body;
      if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedMember = await storage.updateBoardMemberRole(boardId, userId, role);
      if (!updatedMember) {
        return res.status(404).json({ message: "Board member not found" });
      }

      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update board member role" });
    }
  });

  // Todo routes
  app.get("/api/boards/:id/todos", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const todos = await storage.getTodos(boardId);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch todos" });
    }
  });

  app.post("/api/boards/:id/todos", async (req: Request, res: Response) => {
    try {
      const boardId = parseInt(req.params.id);
      if (isNaN(boardId)) {
        return res.status(400).json({ message: "Valid board ID is required" });
      }

      const todoData = insertTodoSchema.parse({
        ...req.body,
        boardId
      });

      const todo = await storage.createTodo(todoData);
      res.status(201).json(todo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create todo" });
    }
  });

  app.put("/api/todos/:id", async (req: Request, res: Response) => {
    try {
      const todoId = parseInt(req.params.id);
      if (isNaN(todoId)) {
        return res.status(400).json({ message: "Valid todo ID is required" });
      }

      const updates = req.body;
      const updatedTodo = await storage.updateTodo(todoId, updates);

      if (!updatedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      res.json(updatedTodo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", async (req: Request, res: Response) => {
    try {
      const todoId = parseInt(req.params.id);
      if (isNaN(todoId)) {
        return res.status(400).json({ message: "Valid todo ID is required" });
      }

      const deleted = await storage.deleteTodo(todoId);
      if (!deleted) {
        return res.status(404).json({ message: "Todo not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete todo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
