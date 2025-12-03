import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function StatsCard({ title, value, icon: Icon, variant = 'default', onClick, isActive }: StatsCardProps) {
  const cardClasses = cn(
    "shadow-md transition-all",
    onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
    isActive && "ring-2 shadow-lg",
    {
      'ring-primary': isActive && variant === 'default',
      'bg-destructive/10 border-destructive/30': variant === 'destructive',
      'ring-destructive': isActive && variant === 'destructive',
      'bg-emerald-500/10 border-emerald-500/30': variant === 'success',
      'ring-emerald-500': isActive && variant === 'success',
      'bg-amber-500/10 border-amber-500/30': variant === 'warning',
      'ring-amber-500': isActive && variant === 'warning',
    }
  );
  
  const iconClasses = cn("h-5 w-5 text-muted-foreground", {
    'text-destructive': variant === 'destructive',
    'text-emerald-500': variant === 'success',
    'text-amber-500': variant === 'warning',
  });

  return (
    <Card className={cardClasses} onClick={onClick} >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={iconClasses} />
      </CardHeader>
      <CardContent  className='p-1'>
        <div className="font-headline text-1xl font-bold  px-4 py-0">{value}</div>
      </CardContent>
    </Card>
  );
}
