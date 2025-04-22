import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  Star, 
  Users, 
  Archive,
  Plus
} from 'lucide-react';
import { BoardWithMemberCount } from '@shared/schema';
import { useAuth } from '@/lib/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: () => void;
}

export function Sidebar({ isOpen, onClose, onCreateBoard }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const { data: boards = [] } = useQuery({
    queryKey: ['/api/boards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/boards?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch boards');
      return res.json();
    },
    enabled: !!user
  });

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [location, onClose]);

  const getBoardColor = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary-500';
      case 'accent': return 'bg-accent-500'; 
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  return (
    <aside 
      className={cn(
        "w-64 bg-white border-r border-gray-200 overflow-y-auto h-full flex-shrink-0 transition-all duration-300 ease-in-out",
        isOpen ? "block" : "hidden md:block"
      )}
    >
      <div className="p-4">
        {/* Create new board button */}
        <Button 
          className="w-full flex items-center justify-center space-x-2"
          onClick={onCreateBoard}
        >
          <Plus className="h-4 w-4" />
          <span>New Board</span>
        </Button>
        
        {/* Navigation menu */}
        <nav className="mt-6 space-y-1">
          <Link href="/">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/" 
                ? "text-primary-700 bg-primary-50 hover:bg-primary-100" 
                : "text-gray-600 hover:bg-gray-50"
            )}>
              <LayoutGrid className="w-5 h-5 mr-3 text-primary-500" />
              All Boards
            </a>
          </Link>
          <a className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
            <Star className="w-5 h-5 mr-3 text-gray-400" />
            Favorites
          </a>
          <a className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
            <Users className="w-5 h-5 mr-3 text-gray-400" />
            Shared with me
          </a>
          <a className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
            <Archive className="w-5 h-5 mr-3 text-gray-400" />
            Archived
          </a>
        </nav>
        
        {/* My Boards List */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            My Boards
          </h3>
          <div className="mt-2 space-y-1">
            {boards.map((board: BoardWithMemberCount) => (
              <Link key={board.id} href={`/boards/${board.id}`}>
                <a className={cn(
                  "group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50",
                  location === `/boards/${board.id}` ? "bg-gray-50" : ""
                )}>
                  <div className="flex items-center">
                    <span className={cn("w-2 h-2 rounded-full mr-3", getBoardColor(board.color))}></span>
                    <span className="text-gray-700">{board.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{board.todoCount}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
