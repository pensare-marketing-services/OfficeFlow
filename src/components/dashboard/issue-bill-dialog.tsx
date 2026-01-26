
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppLogoBlack } from '../shared/app-logo';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Bill, BillStatus, Client } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const billSchema = z.object({
  duration: z.string().min(1, "Duration is required."),
  view: z.string().optional(),
  status: z.enum(["Issued", "Paid", "Overdue", "Cancelled"]),
  billAmount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Amount must be positive.")
  ),
  balance: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Balance cannot be negative.")
  ),
});

type BillFormValues = z.infer<typeof billSchema>;

interface IssueBillDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  client: Client;
  activeMonth: string;
  existingBill: (Bill & { id: string }) | null;
  billCount: number;
}

export const IssueBillDialog: React.FC<IssueBillDialogProps> = ({ isOpen, setIsOpen, client, activeMonth, existingBill, billCount }) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      duration: '',
      view: '',
      status: 'Issued',
      billAmount: 0,
      balance: 0,
    },
  });

  useEffect(() => {
    if (existingBill) {
      form.reset({
        duration: existingBill.duration,
        view: existingBill.view || '',
        status: existingBill.status,
        billAmount: existingBill.billAmount,
        balance: existingBill.balance,
      });
    } else {
      form.reset({
        duration: '',
        view: '',
        status: 'Issued',
        billAmount: 0,
        balance: 0,
      });
    }
  }, [existingBill, isOpen, form]);

  const onSubmit = async (data: BillFormValues) => {
    setLoading(true);
    try {
      if (existingBill) {
        // Update existing bill
        const billRef = doc(db, `clients/${client.id}/bills`, existingBill.id);
        await updateDoc(billRef, data);
        toast({ title: "Bill Updated", description: "The bill has been successfully updated." });
      } else {
        // Create new bill
        const newBillData = {
          ...data,
          slNo: billCount + 1,
          clientId: client.id,
          month: activeMonth,
          issuedDate: new Date().toISOString(),
        };
        await addDoc(collection(db, `clients/${client.id}/bills`), newBillData);
        toast({ title: "Bill Issued", description: "The new bill has been successfully created." });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save bill:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to save the bill." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <AppLogoBlack />
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-bold text-sm text-foreground">Your Company Name</p>
              <p>123 Business Rd.</p>
              <p>Business City, BC 12345</p>
              <p>contact@yourcompany.com</p>
            </div>
          </div>
          <Separator className="my-4" />
          <DialogTitle>{existingBill ? `Edit Bill #${existingBill.slNo}`: "Issue New Bill"}</DialogTitle>
          <DialogDescription>
            Fill in the details below to {existingBill ? 'update the' : 'create a new'} bill for {client.name}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., Aug 2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {(["Issued", "Paid", "Overdue", "Cancelled"] as BillStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="billAmount" render={({ field }) => (
                    <FormItem><FormLabel>Bill Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="balance" render={({ field }) => (
                    <FormItem><FormLabel>Balance</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="col-span-2">
                    <FormField control={form.control} name="view" render={({ field }) => (
                        <FormItem><FormLabel>View (Note/Link)</FormLabel><FormControl><Input placeholder="Add a short note or a link..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingBill ? "Save Changes" : "Issue Bill"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
