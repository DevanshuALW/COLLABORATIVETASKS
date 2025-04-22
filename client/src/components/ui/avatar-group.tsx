import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    name: string;
    image?: string;
  }[];
  limit?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({
  items,
  limit = items.length,
  size = "md",
  className,
  ...props
}: AvatarGroupProps) {
  const displayItems = items.slice(0, limit);
  const overflowCount = items.length - limit;

  const sizeClasses = {
    sm: "h-6 w-6 text-xs", 
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={cn("flex -space-x-2 overflow-hidden", className)} {...props}>
      {displayItems.map((item, i) => (
        <Avatar
          key={i}
          className={cn(
            sizeClasses[size],
            "ring-2 ring-white dark:ring-gray-900"
          )}
        >
          <AvatarImage src={item.image} alt={item.name} />
          <AvatarFallback>
            {getInitials(item.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {overflowCount > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            "flex items-center justify-center rounded-full bg-gray-200 ring-2 ring-white dark:ring-gray-900 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium"
          )}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
