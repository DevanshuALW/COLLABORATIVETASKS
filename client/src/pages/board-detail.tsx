import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/lib/contexts/auth-context';
import { Board, TodoWithAssignee, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import { TodoItem } from '@/components/todos/todo-item';
import { InviteDialog } from '@/components/invite/invite-dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import {
  ArrowLeft,
  Pencil,
  UserPlus,
  Plus,
  MoreHorizontal,
  Download,
  Copy,
  Archive,
  Trash2,
  Search,
  ChevronDown
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Skeleton } from '@/components/ui/skeleton';
import { AvatarGroup } from '@/components/ui/avatar-group';

export default function BoardDetail() {
  const [, params] = useRoute('/boards/:id');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTodoOpen, setIsCreateTodoOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  
  const boardId = params?.id ? parseInt(params.id) : 0;

  // Fetch board details
  const { 
    data: board,
    isLoading: isBoardLoading,
    error: boardError
  } = useQuery({
    queryKey: [`/api/boards/${boardId}`],
    queryFn: async () => {
      if (!boardId) return null;
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error('Failed to fetch board details');
      return res.json();
    },
    enabled: !!boardId && !!user
  });

  // Fetch todos for this board
  const { 
    data: todos = [],
    isLoading: isTodosLoading,
    error: todosError
  } = useQuery({
    queryKey: [`/api/boards/${boardId}/todos`],
    queryFn: async () => {
      if (!boardId) return [];
      const res = await fetch(`/api/boards/${boardId}/todos`);
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json();
    },
    enabled: !!boardId && !!user
  });

  // Update board title/description
  const updateBoardMutation = useMutation({
    mutationFn: async (updates: Partial<Board>) => {
      const response = await apiRequest('PUT', `/api/boards/${boardId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${boardId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards', user?.id] });
      toast({
        title: 'Board updated',
        description: 'The board has been updated successfully.'
      });
    },
    onError: (error) => {
      console.error('Error updating board:', error);
      toast({
        title: 'Update failed',
        description: 'There was a problem updating the board.',
        variant: 'destructive',
      });
    }
  });

  // Delete board
  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/boards/${boardId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards', user?.id] });
      toast({
        title: 'Board deleted',
        description: 'The board has been deleted successfully.'
      });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error deleting board:', error);
      toast({
        title: 'Delete failed',
        description: 'There was a problem deleting the board.',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (board) {
      setEditTitle(board.title);
      setEditDescription(board.description || '');
    }
  }, [board]);

  if (boardError || todosError) {
    toast({
      title: 'Error',
      description: 'Failed to load board data. Please try again.',
      variant: 'destructive',
    });
  }

  const handleSaveTitle = () => {
    if (editTitle.trim() === '') {
      toast({
        title: 'Invalid title',
        description: 'Board title cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    updateBoardMutation.mutate({ title: editTitle });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    updateBoardMutation.mutate({ description: editDescription });
    setIsEditingDescription(false);
  };

  const handleDeleteBoard = () => {
    if (window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      deleteBoardMutation.mutate();
    }
  };

  // Apply filters and sorting to todos
  const filteredTodos = todos.filter((todo: TodoWithAssignee) => {
    // Apply status filter
    if (statusFilter !== 'all' && todo.status !== statusFilter) {
      return false;
    }
    
    // Apply assignee filter
    if (assigneeFilter === 'me' && (!todo.assignedTo || todo.assignedTo !== user?.id)) {
      return false;
    } else if (assigneeFilter === 'unassigned' && todo.assignedTo) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        todo.title.toLowerCase().includes(query) || 
        (todo.description && todo.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Sort filtered todos
  const sortedTodos = [...filteredTodos].sort((a: TodoWithAssignee, b: TodoWithAssignee) => {
    switch (sortOption) {
      case 'due-date':
        // Handle null dates
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  // Prepare board members for display
  const boardMembers = board?.members || [];
  const avatarItems = boardMembers.map((member: User) => ({
    name: member.displayName || member.username,
    image: member.photoURL
  }));

  const renderBoardHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
          className="mr-3 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {isEditingTitle ? (
          <div className="flex items-center">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold mr-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
            />
            <Button onClick={handleSaveTitle} size="sm">
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isBoardLoading ? <Skeleton className="h-8 w-44" /> : board?.title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditingTitle(true)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-3 sm:mt-0 flex items-center space-x-3">
        <Button
          variant="outline"
          className="inline-flex items-center"
          onClick={() => setIsInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
        
        <Button
          className="inline-flex items-center"
          onClick={() => setIsCreateTodoOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Todo
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2 text-gray-500" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2 text-gray-500" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="h-4 w-4 mr-2 text-gray-500" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={handleDeleteBoard}
            >
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderBoardDescription = () => (
    <div className="bg-white rounded-md p-4 mb-6">
      {isEditingDescription ? (
        <div className="flex flex-col space-y-2">
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveDescription();
              if (e.key === 'Escape') setIsEditingDescription(false);
            }}
          />
          <div className="flex justify-end space-x-2">
            <Button 
              onClick={() => setIsEditingDescription(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDescription} size="sm">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          {isBoardLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p className="text-sm text-gray-600">
              {board?.description || "No description provided. Click edit to add one."}
            </p>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingDescription(true)}
            className="ml-2 text-gray-400 hover:text-gray-600 -mt-1"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderTodoFilters = () => (
    <div className="bg-white rounded-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="flex flex-wrap items-center gap-4 mb-3 sm:mb-0">
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 min-w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-8 min-w-[130px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="me">Assigned to me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search todos..."
            className="pl-8 h-8 min-w-[200px]"
          />
        </div>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="h-8 min-w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Updated</SelectItem>
            <SelectItem value="due-date">Due Date</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTodoList = () => {
    if (isTodosLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-md border border-gray-200 shadow-sm p-4">
              <div className="flex items-start">
                <Skeleton className="h-5 w-5 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (sortedTodos.length === 0) {
      return (
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No todos found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all'
              ? "No todos match your current filters. Try adjusting your search or filters."
              : "This board doesn't have any todos yet."}
          </p>
          <Button onClick={() => setIsCreateTodoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Todo
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedTodos.map((todo: TodoWithAssignee) => (
          <TodoItem key={todo.id} todo={todo} boardId={boardId} />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onCreateBoard={() => {
            navigate('/');
            setTimeout(() => {
              document.getElementById('create-board-button')?.click();
            }, 100);
          }}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            {renderBoardHeader()}
            {renderBoardDescription()}
            
            <div className="space-y-4">
              {renderTodoFilters()}
              {renderTodoList()}
            </div>
          </div>
        </main>
      </div>
      
      <CreateTodoDialog
        open={isCreateTodoOpen}
        onOpenChange={setIsCreateTodoOpen}
        boardId={boardId}
        boardMembers={boardMembers}
      />
      
      <InviteDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        boardId={boardId}
        existingMembers={boardMembers}
      />
    </div>
  );
}
