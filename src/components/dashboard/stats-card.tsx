import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  onClick?: () => void;
  isActive?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default', 
  onClick, 
  isActive 
}: StatsCardProps) {
  const cardClasses = cn(
    "shadow-sm transition-all",
    onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
    isActive && "ring-2 shadow-lg",
    {
      'ring-primary': isActive && variant === 'default',
      'bg-destructive/10 border-destructive/30 text-destructive': variant === 'destructive',
      'ring-destructive': isActive && variant === 'destructive',
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-600': variant === 'success',
      'ring-emerald-500': isActive && variant === 'success',
      'bg-amber-500/10 border-amber-500/30 text-amber-600': variant === 'warning',
      'ring-amber-500': isActive && variant === 'warning',
    }
  );
  
  const iconClasses = cn("h-4 w-4", {
    'text-destructive': variant === 'destructive',
    'text-emerald-500': variant === 'success',
    'text-amber-500': variant === 'warning',
    'text-muted-foreground': variant === 'default',
  });

  const valueClasses = cn("font-headline font-bold", {
    'text-destructive': variant === 'destructive',
    'text-emerald-600': variant === 'success',
    'text-amber-600': variant === 'warning',
  });

  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardContent className='p-3'>
        <div className="flex items-center justify-between">
          {/* Left side: Title */}
          <div className="text-xs font-medium text-muted-foreground">
            {title}
          </div>
          
          {/* Right side: Value and Icon */}
          <div className="flex items-center gap-2">
            <span className={valueClasses}>{value}</span>
            <Icon className={iconClasses} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}