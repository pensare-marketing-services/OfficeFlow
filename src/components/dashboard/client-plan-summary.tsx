'use client';
import type { Client } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '../ui/input';
import { useState, useEffect } from 'react';

interface ClientPlanSummaryProps {
    client: Client & { id: string };
    onUpdate: (clientId: string, updatedData: Partial<Client>) => void;
}


const EditableField: React.FC<{ value: string; onSave: (value: string) => void }> = ({ value, onSave }) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        if(currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSave(e.currentTarget.value);
            e.currentTarget.blur();
        }
    };
    
    return <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className="border-0 focus-visible:ring-1 h-7 px-1 text-xs text-foreground bg-transparent" />;
};


export function ClientPlanSummary({ client, onUpdate }: ClientPlanSummaryProps) {
    
    const handleSave = (field: keyof Client, value: string) => {
        onUpdate(client.id, { [field]: value });
    };

    return (
        <Card className="shadow-none border bg-card flex-grow">
            <CardContent className="p-0">
                <Table>
                    <TableBody>
                        <TableRow>
                             <TableCell className="font-bold text-xs p-2 bg-muted/50 w-[120px]">PLAN</TableCell>
                            <TableCell className="p-1">
                                <EditableField value={client.plan || ''} onSave={(value) => handleSave('plan', value)} />
                            </TableCell>
                             <TableCell className="font-bold text-xs p-2 bg-muted/50 w-[120px]">Bill Duration</TableCell>
                            <TableCell className="p-1">
                                <EditableField value={client.billDuration || ''} onSave={(value) => handleSave('billDuration', value)} />
                            </TableCell>
                             <TableCell className="font-bold text-xs p-2 bg-muted/50 w-[120px]">Social Platforms</TableCell>
                            <TableCell className="p-1">
                                <EditableField value={client.socialPlatforms || ''} onSave={(value) => handleSave('socialPlatforms', value)} />
                            </TableCell>
                            <TableCell className="font-bold text-xs p-2 bg-muted/50 w-[120px]">Monthly Reach</TableCell>
                            <TableCell className="p-1">
                                 <EditableField value={client.monthlyReach || ''} onSave={(value) => handleSave('monthlyReach', value)} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
