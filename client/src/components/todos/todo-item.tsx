import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TodoWithAssignee } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  LoaderPinwheel, 
  CheckCircle, 
  Hourglass, 
  Paperclip, 
  MessageSquare, 
  MoreHorizontal,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: TodoWithAssignee;
  boardId: number;
}

export function TodoItem({ todo, boardId }: TodoItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTodoMutation = useMutation({
    mutationFn: async (updates: Partial<TodoWithAssignee>) => {
      const response = await apiRequest('PUT', `/api/todos/${todo.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/boards/${boardId}/todos`] });
      toast({
        title: 'Todo updated',
        description: 'The todo has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating todo:', error);
      toast({
        title: 'Update failed',
        description: 'There was a problem updating the todo.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const toggleStatus = () => {
    setIsUpdating(true);
    const newStatus = todo.status === 'completed' ? 'todo' : 'completed';
    updateTodoMutation.mutate({ status: newStatus });
  };

  const isCompleted = todo.status === 'completed';
  const isOverdue = todo.dueDate && !isCompleted && isAfter(new Date(), new Date(todo.dueDate));

  // Get priority styling
  const getPriorityBadge = () => {
    switch (todo.priority) {
      case 'low':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Low
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
            Medium
          </span>
        );
      case 'high':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
            High
          </span>
        );
      case 'critical':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive bg-opacity-10 text-destructive">
            Critical
          </span>
        );
      default:
        return null;
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (todo.status) {
      case 'todo':
        return <Hourglass className="mr-1 h-3 w-3" />;
      case 'in-progress':
        return <LoaderPinwheel className="mr-1 h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="mr-1 h-3 w-3" />;
      default:
        return <Hourglass className="mr-1 h-3 w-3" />;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (todo.status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'To Do';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format due date
  const formatDueDate = () => {
    if (!todo.dueDate) return 'No due date';
    
    return format(new Date(todo.dueDate), 'MMM d, yyyy');
  };

  return (
    <div className={cn(
      "bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow",
      isCompleted && "opacity-70"
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-1">
            <button 
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center focus:outline-none",
                isCompleted 
                  ? "border-green-500 bg-green-500" 
                  : "border-gray-300 hover:border-primary"
              )}
              onClick={toggleStatus}
              disabled={isUpdating}
            >
              {isCompleted && <Check className="text-white h-3 w-3" />}
            </button>
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "text-base font-medium",
                isCompleted 
                  ? "text-gray-700 line-through" 
                  : "text-gray-900"
              )}>
                {todo.title}
              </h3>
              <div className="ml-2 flex-shrink-0 flex">
                {getPriorityBadge()}
              </div>
            </div>
            
            <div className={cn(
              "mt-1 text-sm",
              isCompleted 
                ? "text-gray-500 line-through" 
                : "text-gray-600"
            )}>
              <p>{todo.description || "No description"}</p>
            </div>
            
            <div className="mt-3 flex items-center justify-between flex-wrap">
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                <span className={cn(
                  "flex items-center",
                  isOverdue && "text-destructive"
                )}>
                  <Calendar className="mr-1 h-3 w-3" />
                  Due: {formatDueDate()}
                  {isOverdue && " (Overdue)"}
                </span>
                
                <span className={cn(
                  "flex items-center",
                  todo.status === 'completed' && "text-green-500"
                )}>
                  {getStatusIcon()}
                  {getStatusText()}
                </span>
              </div>
              
              <div className="flex items-center mt-2 sm:mt-0">
                {todo.assignee && (
                  <div className="flex -space-x-1 overflow-hidden mr-3">
                    <Avatar className="h-6 w-6 ring-2 ring-white">
                      <AvatarImage 
                        src={todo.assignee.photoURL || undefined} 
                        alt={todo.assignee.displayName || todo.assignee.username} 
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(todo.assignee.displayName || todo.assignee.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
