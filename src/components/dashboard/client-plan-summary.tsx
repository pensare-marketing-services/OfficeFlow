'use client';
import type { Client } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';

interface ClientPlanSummaryProps {
    client: Client & { id: string };
    onUpdate: (clientId: string, updatedData: Partial<Client>) => void;
}


const EditableField: React.FC<{ value: string; onSave: (value: string) => void }> = ({ value, onSave }) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        onSave(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSave(e.currentTarget.value);
            e.currentTarget.blur();
        }
    };
    
    return <Input defaultValue={value} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-white dark:bg-muted/50 border-0 focus-visible:ring-1 h-8 px-1 text-sm text-foreground" />;
};


export function ClientPlanSummary({ client, onUpdate }: ClientPlanSummaryProps) {
    
    const handleSave = (field: keyof Client, value: string) => {
        onUpdate(client.id, { [field]: value });
    };

    return (
        <Card className="shadow-md">
            <CardContent className="p-0">
                <Table>
                    <TableBody>
                        <TableRow className="bg-emerald-50 hover:bg-emerald-100/60 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30">
                             <TableCell className="font-bold w-32">PLAN</TableCell>
                            <TableCell>
                                <EditableField value={client.plan || ''} onSave={(value) => handleSave('plan', value)} />
                            </TableCell>
                             <TableCell className="font-bold w-32">Bill Duration</TableCell>
                            <TableCell className="w-48">
                                <EditableField value={client.billDuration || ''} onSave={(value) => handleSave('billDuration', value)} />
                            </TableCell>
                        </TableRow>
                        <TableRow className="bg-emerald-50 hover:bg-emerald-100/60 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30">
                            <TableCell className="font-bold">Social Platforms</TableCell>
                            <TableCell>
                                <EditableField value={client.socialPlatforms || ''} onSave={(value) => handleSave('socialPlatforms', value)} />
                            </TableCell>
                            <TableCell className="font-bold">Monthly Reach</TableCell>
                            <TableCell>
                                 <EditableField value={client.monthlyReach || ''} onSave={(value) => handleSave('monthlyReach', value)} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
