import { Link } from 'wouter';
import { BoardWithMemberCount } from '@shared/schema';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BoardCardProps {
  board: BoardWithMemberCount;
  members: Array<{ name: string; image?: string }>;
}

export function BoardCard({ board, members }: BoardCardProps) {
  const getBoardColorClasses = (color: string) => {
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
    <Link href={`/boards/${board.id}`}>
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-150 overflow-hidden cursor-pointer">
        <div className={cn("h-2", getBoardColorClasses(board.color))}></div>
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{board.title}</h3>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {board.description || "No description"}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center text-sm text-gray-500">
              <ClipboardList className="mr-1.5 h-4 w-4" />
              <span>{board.todoCount} {board.todoCount === 1 ? 'todo' : 'todos'}</span>
            </div>
            
            <AvatarGroup 
              items={members} 
              limit={3} 
              size="sm" 
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
