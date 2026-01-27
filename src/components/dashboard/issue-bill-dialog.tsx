
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppLogoBlack } from '../shared/app-logo';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/client';
import type { Bill, BillStatus, Client, BillItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';

const billItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.preprocess(
    (val) => val === '' ? 0 : parseFloat(String(val)),
    z.number().min(0, "Amount must be a positive number.")
  ),
});

const billSchema = z.object({
  duration: z.string().min(1, "Duration is required."),
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
      balance: 0,
      items: [{ description: '', amount: '' as any }],
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
          balance: existingBill.balance,
          items: existingBill.items && existingBill.items.length > 0 ? existingBill.items : [{ description: '', amount: '' as any }],
        });
      } else {
        form.reset({
          duration: '',
          balance: 0,
          items: [{ description: '', amount: '' as any }],
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
        status: existingBill ? existingBill.status : 'Issued'
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
           <DialogTitle className="sr-only">{existingBill ? "Edit Bill" : "Issue New Bill"}</DialogTitle>
          <DialogDescription className="sr-only">
            {existingBill ? `Update the details for bill #${existingBill.slNo}.` : 'Create a new bill for this client.'}
          </DialogDescription>
          <div className="flex justify-between items-start">
            <div className='pt-2'>
              <AppLogoBlack />
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-bold text-sm text-foreground">PENSARE MARKETING</p>
              <p>First Floor, #1301, TK Tower</p>
              <p>Above Chicking Koduvally</p>
              <p>Calicut, Kerala-673572</p>
            </div>
          </div>
          <Separator className="my-4" />
           <div className="flex justify-between items-end">
              <div>
                  <h3 className="font-bold">BILL TO:</h3>
                  <p className="text-muted-foreground">{client.name}</p>
                  {client.address && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{client.address}</p>
                  )}
              </div>
              <div className='text-right'>
                  <h2 className="text-2xl font-bold tracking-tight">INVOICE #{existingBill ? existingBill.slNo : billCount + 1}</h2>
                  {existingBill && (
                     <p className="text-sm text-muted-foreground">Status: <span className='font-medium text-foreground'>{existingBill.status}</span></p>
                  )}
              </div>
           </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-4 p-3 border rounded-md">
                <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., Aug 2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormItem>
                    <FormLabel>Date of Issue</FormLabel>
                    <Input value={format(new Date(existingBill?.issuedDate || Date.now()), "MMM dd, yyyy")} disabled />
                </FormItem>
            </div>
            
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800 hover:bg-gray-800">
                    <TableHead className="text-white">Description</TableHead>
                    <TableHead className="w-[150px] text-right text-white">Amount</TableHead>
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
                        <TableCell colSpan={2} className="text-right font-bold">Total Amount</TableCell>
                        <TableCell className="text-right font-bold pr-8">{totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell colSpan={2} className="text-right font-bold">Balance Due</TableCell>
                        <TableCell className="p-1 text-right pr-2">
                           <FormField control={form.control} name="balance" render={({ field }) => (
                                <FormItem>
                                    <FormControl><Input type="number" placeholder="0.00" className="text-right h-8" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </div>
             <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ description: "", amount: "" as any })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            
            <DialogFooter className='pt-4 sm:justify-between sm:items-end'>
                <div className='text-left'>
                    <p className='text-sm font-bold mb-2'>Thank you for your business!</p>
                    <h4 className="text-xs font-bold mb-1">Bank Details:</h4>
                    <p className='text-[10px] text-muted-foreground'>PENSARE MARKETING</p>
                    <p className='text-[10px] text-muted-foreground'>State Bank of India, Koduvally Branch</p>
                    <p className='text-[10px] text-muted-foreground'>A/C No: 39003560642</p>
                    <p className='text-[10px] text-muted-foreground'>IFSC Code: SBIN0001442</p>
                    <p className='text-[10px] text-muted-foreground'>GPay: 9745600523</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {existingBill ? "Save Changes" : "Issue Bill"}
                  </Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
