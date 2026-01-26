
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { Bill, BillStatus, Client, BillItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';

const billItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.preprocess(
    (val) => val === '' ? 0 : parseFloat(String(val)),
    z.number().min(0, "Amount must be a positive number.")
  ),
});

const billSchema = z.object({
  duration: z.string().min(1, "Duration is required."),
  status: z.enum(["Issued", "Paid", "Overdue", "Cancelled"]),
  balance: z.preprocess(
    (val) => val === '' ? 0 : parseFloat(String(val)),
    z.number().min(0, "Balance cannot be negative.")
  ),
  items: z.array(billItemSchema).min(1, "At least one item is required."),
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
      status: 'Issued',
      balance: 0,
      items: [{ description: '', amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen) {
      if (existingBill) {
        form.reset({
          duration: existingBill.duration,
          status: existingBill.status,
          balance: existingBill.balance,
          items: existingBill.items && existingBill.items.length > 0 ? existingBill.items : [{ description: '', amount: 0 }],
        });
      } else {
        form.reset({
          duration: '',
          status: 'Issued',
          balance: 0,
          items: [{ description: '', amount: 0 }],
        });
      }
    }
  }, [existingBill, isOpen, form]);

  const watchedItems = form.watch('items');
  const totalAmount = useMemo(() => {
    return watchedItems?.reduce((acc, item) => acc + (Number(item.amount) || 0), 0) || 0;
  }, [watchedItems]);


  const onSubmit = async (data: BillFormValues) => {
    setLoading(true);
    try {
      const billDataPayload = {
        ...data,
        billAmount: totalAmount,
      };

      if (existingBill) {
        const billRef = doc(db, `clients/${client.id}/bills`, existingBill.id);
        await updateDoc(billRef, billDataPayload);
        toast({ title: "Bill Updated", description: "The bill has been successfully updated." });
      } else {
        const newBillData = {
          ...billDataPayload,
          slNo: billCount + 1,
          clientId: client.id,
          month: activeMonth,
          issuedDate: new Date().toISOString(),
          view: '', // Not in the new form
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <AppLogoBlack />
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-bold text-sm text-foreground">OfficeFlow</p>
              <p>First Floor, #1301, TK Tower</p>
              <p>Above Chicking Koduvally</p>
              <p>Calicut, Kerala-673572</p>
            </div>
          </div>
          <Separator className="my-4" />
          <DialogTitle>{existingBill ? `Edit Bill #${existingBill.slNo}` : "Issue New Bill"}</DialogTitle>
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
            </div>
            
            <Separator />

            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px] text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="p-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input placeholder="Service description" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input type="number" placeholder="0.00" className="text-right" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">{totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ description: "", amount: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
                <div />
                <FormField control={form.control} name="balance" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Balance Due</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
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
