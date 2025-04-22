import {
  users, boards, boardMembers, todos,
  type User, type InsertUser,
  type Board, type InsertBoard,
  type BoardMember, type InsertBoardMember,
  type Todo, type InsertTodo,
  type BoardWithMemberCount,
  type TodoWithAssignee,
  type BoardWithMembers
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Board operations
  getBoards(): Promise<BoardWithMemberCount[]>;
  getBoardsByUser(userId: number): Promise<BoardWithMemberCount[]>;
  getBoard(id: number): Promise<Board | undefined>;
  getBoardWithMembers(id: number): Promise<BoardWithMembers | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: number, updates: Partial<Board>): Promise<Board | undefined>;
  deleteBoard(id: number): Promise<boolean>;

  // Board member operations
  getBoardMembers(boardId: number): Promise<BoardMember[]>;
  addBoardMember(member: InsertBoardMember): Promise<BoardMember>;
  removeBoardMember(boardId: number, userId: number): Promise<boolean>;
  updateBoardMemberRole(boardId: number, userId: number, role: string): Promise<BoardMember | undefined>;

  // Todo operations
  getTodos(boardId: number): Promise<TodoWithAssignee[]>;
  getTodo(id: number): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private boards: Map<number, Board>;
  private boardMembers: Map<number, BoardMember>;
  private todos: Map<number, Todo>;

  private currentUserId: number;
  private currentBoardId: number;
  private currentBoardMemberId: number;
  private currentTodoId: number;

  constructor() {
    this.users = new Map();
    this.boards = new Map();
    this.boardMembers = new Map();
    this.todos = new Map();

    this.currentUserId = 1;
    this.currentBoardId = 1;
    this.currentBoardMemberId = 1;
    this.currentTodoId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Ensure all required fields are present with proper types
    const user: User = {
      ...insertUser,
      id,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null
    };
    this.users.set(id, user);
    return user;
  }

  // Board operations
  async getBoards(): Promise<BoardWithMemberCount[]> {
    return Array.from(this.boards.values()).map(board => {
      const todoCount = Array.from(this.todos.values()).filter(
        todo => todo.boardId === board.id
      ).length;

      const memberCount = Array.from(this.boardMembers.values()).filter(
        member => member.boardId === board.id
      ).length;

      return { ...board, todoCount, memberCount };
    });
  }

  async getBoardsByUser(userId: number): Promise<BoardWithMemberCount[]> {
    // Get boards created by user or boards where user is a member
    const boardIds = new Set<number>();

    // Add boards created by the user
    Array.from(this.boards.values())
      .filter(board => board.createdBy === userId)
      .forEach(board => boardIds.add(board.id));

    // Add boards where the user is a member
    Array.from(this.boardMembers.values())
      .filter(member => member.userId === userId)
      .forEach(member => boardIds.add(member.boardId));

    // Get boards with member and todo counts
    return Array.from(boardIds).map(boardId => {
      const board = this.boards.get(boardId)!;

      const todoCount = Array.from(this.todos.values()).filter(
        todo => todo.boardId === boardId
      ).length;

      const memberCount = Array.from(this.boardMembers.values()).filter(
        member => member.boardId === boardId
      ).length;

      return { ...board, todoCount, memberCount };
    });
  }

  async getBoard(id: number): Promise<Board | undefined> {
    return this.boards.get(id);
  }

  async getBoardWithMembers(id: number): Promise<BoardWithMembers | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;

    const memberIds = Array.from(this.boardMembers.values())
      .filter(member => member.boardId === id)
      .map(member => member.userId);

    const members = memberIds.map(userId => this.users.get(userId)!);

    return { ...board, members };
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = this.currentBoardId++;
    const now = new Date();
    const board: Board = {
      ...insertBoard,
      id,
      createdAt: now,
      color: insertBoard.color || 'primary',
      description: insertBoard.description || null
    };
    this.boards.set(id, board);

    // Automatically add the creator as an admin member
    await this.addBoardMember({
      boardId: id,
      userId: insertBoard.createdBy,
      role: 'admin'
    });

    return board;
  }

  async updateBoard(id: number, updates: Partial<Board>): Promise<Board | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;

    const updatedBoard = { ...board, ...updates };
    this.boards.set(id, updatedBoard);
    return updatedBoard;
  }

  async deleteBoard(id: number): Promise<boolean> {
    const deleted = this.boards.delete(id);

    if (deleted) {
      // Delete all associated board members
      for (const [memberId, member] of this.boardMembers.entries()) {
        if (member.boardId === id) {
          this.boardMembers.delete(memberId);
        }
      }

      // Delete all associated todos
      for (const [todoId, todo] of this.todos.entries()) {
        if (todo.boardId === id) {
          this.todos.delete(todoId);
        }
      }
    }

    return deleted;
  }

  // Board member operations
  async getBoardMembers(boardId: number): Promise<BoardMember[]> {
    return Array.from(this.boardMembers.values()).filter(
      member => member.boardId === boardId
    );
  }

  async addBoardMember(insertMember: InsertBoardMember): Promise<BoardMember> {
    // Check if user is already a member
    const existingMember = Array.from(this.boardMembers.values()).find(
      member => member.boardId === insertMember.boardId && member.userId === insertMember.userId
    );

    if (existingMember) {
      return existingMember;
    }

    const id = this.currentBoardMemberId++;
    const member: BoardMember = {
      ...insertMember,
      id,
      role: insertMember.role || 'editor'
    };
    this.boardMembers.set(id, member);
    return member;
  }

  async removeBoardMember(boardId: number, userId: number): Promise<boolean> {
    let removed = false;

    for (const [memberId, member] of this.boardMembers.entries()) {
      if (member.boardId === boardId && member.userId === userId) {
        this.boardMembers.delete(memberId);
        removed = true;
        break;
      }
    }

    return removed;
  }

  async updateBoardMemberRole(boardId: number, userId: number, role: string): Promise<BoardMember | undefined> {
    for (const [memberId, member] of this.boardMembers.entries()) {
      if (member.boardId === boardId && member.userId === userId) {
        const updatedMember = { ...member, role };
        this.boardMembers.set(memberId, updatedMember);
        return updatedMember;
      }
    }

    return undefined;
  }

  // Todo operations
  async getTodos(boardId: number): Promise<TodoWithAssignee[]> {
    return Array.from(this.todos.values())
      .filter(todo => todo.boardId === boardId)
      .map(todo => {
        if (todo.assignedTo) {
          const assignee = this.users.get(todo.assignedTo);
          return { ...todo, assignee };
        }
        return todo as TodoWithAssignee;
      });
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    return this.todos.get(id);
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const id = this.currentTodoId++;
    const now = new Date();
    const todo: Todo = {
      ...insertTodo,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertTodo.status || 'todo',
      priority: insertTodo.priority || 'medium',
      description: insertTodo.description || null,
      dueDate: insertTodo.dueDate || null,
      assignedTo: insertTodo.assignedTo || null
    };
    this.todos.set(id, todo);
    return todo;
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | undefined> {
    const todo = this.todos.get(id);
    if (!todo) return undefined;

    const updatedTodo = { ...todo, ...updates, updatedAt: new Date() };
    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  async deleteTodo(id: number): Promise<boolean> {
    return this.todos.delete(id);
  }
}

export const storage = new MemStorage();
