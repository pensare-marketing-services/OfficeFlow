'use client';
import type { Client } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';


interface ClientPlanSummaryProps {
    client: Client;
}

export function ClientPlanSummary({ client }: ClientPlanSummaryProps) {
    const socialPlatforms = client.socialPlatforms || 'Not specified';
    const plan = client.plan || 'Not specified';
    const billDuration = client.billDuration || 'Not specified';
    const monthlyReach = client.monthlyReach || 'Not specified';

    return (
        <Card className="shadow-md">
            <CardContent className="p-0">
                <Table>
                    <TableBody>
                        <TableRow className="bg-green-100/50 hover:bg-green-100/60">
                            <TableCell className="font-bold w-32">CLIENT</TableCell>
                            <TableCell>{client.name} ({socialPlatforms})</TableCell>
                            <TableCell className="font-bold w-32">Bill Duration</TableCell>
                            <TableCell className="w-48">{billDuration}</TableCell>
                        </TableRow>
                        <TableRow className="bg-green-100/50 hover:bg-green-100/60">
                             <TableCell className="font-bold">PLAN</TableCell>
                            <TableCell>{plan}</TableCell>
                            <TableCell className="font-bold">Monthly Reach</TableCell>
                            <TableCell>{monthlyReach}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
