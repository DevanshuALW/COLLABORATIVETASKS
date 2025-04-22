import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/contexts/auth-context';
import { UserDropdown } from './user-dropdown';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSidebar}
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">TaskHub</h1>
          </Link>
          <span className="hidden sm:inline-block bg-gray-100 text-xs font-medium px-2 py-1 rounded-full text-gray-600">Beta</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSearch(!showSearch)}
          className="text-gray-500 hover:text-gray-700 rounded-full"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        {/* Notifications button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-gray-700 rounded-full relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive transform translate-x-1/2 -translate-y-1/2"></span>
        </Button>
        
        {/* User profile */}
        {user && (
          <UserDropdown 
            user={{
              name: user.displayName || user.username,
              email: user.phoneNumber,
              imageUrl: user.photoURL
            }} 
          />
        )}
      </div>
    </header>
  );
}
