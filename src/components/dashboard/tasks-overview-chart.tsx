'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { tasks } from '@/lib/data';
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: 'Count',
  },
  'To Do': {
    label: 'To Do',
    color: 'hsl(var(--chart-2))',
  },
  'In Progress': {
    label: 'In Progress',
    color: 'hsl(var(--chart-1))',
  },
  'Done': {
    label: 'Done',
    color: 'hsl(var(--chart-3))',
  },
  'Overdue': {
    label: 'Overdue',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export default function TasksOverviewChart() {
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { status: 'To Do', count: statusCounts['To Do'] || 0 },
    { status: 'In Progress', count: statusCounts['In Progress'] || 0 },
    { status: 'Done', count: statusCounts['Done'] || 0 },
    { status: 'Overdue', count: statusCounts['Overdue'] || 0 },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Tasks Overview</CardTitle>
        <CardDescription>A summary of all task statuses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="status"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <YAxis />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="count" radius={8}>
                    {chartData.map((entry) => (
                        <Bar
                        key={entry.status}
                        dataKey="count"
                        fill={chartConfig[entry.status as keyof typeof chartConfig]?.color}
                        />
                    ))}
                    </Bar>
                </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
