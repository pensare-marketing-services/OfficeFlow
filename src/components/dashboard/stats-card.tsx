import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
}

export function StatsCard({ title, value, icon: Icon, variant = 'default' }: StatsCardProps) {
  return (
    <Card className={cn("shadow-md transition-all hover:shadow-lg", variant === 'destructive' && "bg-destructive/10 border-destructive/30")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-5 w-5 text-muted-foreground", variant === 'destructive' && "text-destructive")} />
      </CardHeader>
      <CardContent>
        <div className="font-headline text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
