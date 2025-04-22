import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/auth-context';
import { BoardWithMemberCount } from '@shared/schema';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BoardCard } from '@/components/boards/board-card';
import { CreateBoardDialog } from '@/components/boards/create-board-dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, Grid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function Boards() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [sortOption, setSortOption] = useState('recent');

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['/api/boards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/boards?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch boards');
      return res.json();
    },
    enabled: !!user
  });
  
  // Sort boards based on selected option
  const sortedBoards = [...boards].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'recent':
      default:
        // For this prototype we'll just sort by ID as a proxy for "recently updated"
        return b.id - a.id;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Generate mock members for the board cards
  // In a real application, this would be fetched from the API
  const getMembersForBoard = (board: BoardWithMemberCount) => {
    const members = [{ name: user?.displayName || user?.username || 'You' }];
    
    // Add some placeholder members based on member count
    if (board.memberCount > 1) {
      for (let i = 1; i < Math.min(board.memberCount, 5); i++) {
        members.push({ name: `Member ${i}` });
      }
    }
    
    return members;
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onCreateBoard={() => setIsCreateBoardOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Boards</h2>
              
              <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                <div className="relative">
                  <Select 
                    defaultValue={sortOption} 
                    onValueChange={setSortOption}
                  >
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Updated</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="icon">
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <Skeleton className="h-2 w-full" />
                    <div className="p-5 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Boards grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedBoards.map((board: BoardWithMemberCount) => (
                  <BoardCard 
                    key={board.id} 
                    board={board} 
                    members={getMembersForBoard(board)}
                  />
                ))}
                
                {/* New Board Card */}
                <Button
                  onClick={() => setIsCreateBoardOpen(true)}
                  variant="outline"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-full"
                >
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">Create New Board</h3>
                  <p className="text-sm text-gray-500 mt-1">Add a new project or task list</p>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <CreateBoardDialog
        open={isCreateBoardOpen}
        onOpenChange={setIsCreateBoardOpen}
      />
    </div>
  );
}
