'use client';

import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Or a message indicating no user found
  }

  return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
