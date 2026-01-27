
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { Loader2, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const billItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.string().min(1, "Amount is required").refine(val => !isNaN(parseFloat(val)), {
    message: "Must be a valid number."
  }),
});

const billSchema = z.object({
  duration: z.string().min(1, "Duration is required."),
  balance: z.preprocess(
    (val) => val === '' ? 0 : parseFloat(String(val)),
    z.number().min(0, "Balance cannot be negative.")
  ),
  items: z.array(billItemSchema).min(1, "At least one item is required."),
  issuedDate: z.date({
    required_error: "A date of issue is required.",
  }),
});

type BillFormValues = z.infer<typeof billSchema>;

interface IssueBillDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  client: Client;
  existingBill: (Bill & { id: string }) | null;
  billCount: number;
}

export const IssueBillDialog: React.FC<IssueBillDialogProps> = ({ isOpen, setIsOpen, client, existingBill, billCount }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      duration: '',
      balance: 0,
      items: [{ description: '', amount: '' }],
      issuedDate: new Date(),
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  const totalAmount = useMemo(() => {
    if (!watchedItems || !Array.isArray(watchedItems)) return 0;
    
    return watchedItems.reduce((acc, item) => {
      const amount = parseFloat(item?.amount || '0') || 0;
      return acc + amount;
    }, 0);
  }, [watchedItems]);

  useEffect(() => {
    if (isOpen) {
      if (existingBill) {
        form.reset({
          duration: existingBill.duration,
          balance: existingBill.balance,
          items: existingBill.items && existingBill.items.length > 0 
            ? existingBill.items.map(item => ({ 
                description: item.description || '', 
                amount: String(item.amount || '') 
              })) 
            : [{ description: '', amount: '' }],
          issuedDate: new Date(existingBill.issuedDate),
        });
      } else {
        form.reset({
          duration: '',
          balance: 0,
          items: [{ description: '', amount: '' }],
          issuedDate: new Date(),
        });
      }
    }
  }, [existingBill, isOpen, form]);

  const onSubmit = async (data: BillFormValues) => {
    setLoading(true);
    try {
      const itemsWithNumbers = data.items.map(item => ({
        description: item.description,
        amount: parseFloat(item.amount) || 0,
      }));

      const calculatedMonth = format(data.issuedDate, "MMMM yyyy");

      if (existingBill) {
        const billRef = doc(db, `clients/${client.id}/bills`, existingBill.id);
        const updatePayload = {
          ...data,
          items: itemsWithNumbers,
          issuedDate: data.issuedDate.toISOString(),
          billAmount: totalAmount,
          month: calculatedMonth,
        };
        await updateDoc(billRef, updatePayload as any);
        toast({ title: "Bill Updated", description: "The bill details have been successfully updated." });

      } else {
        const newBillData = {
          ...data,
          items: itemsWithNumbers,
          issuedDate: data.issuedDate.toISOString(),
          billAmount: totalAmount,
          status: 'Issued',
          slNo: billCount + 1,
          clientId: client.id,
          month: calculatedMonth,
          view: '', 
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
      <DialogContent className="sm:max-w-3xl p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div className='pt-2'>
                    <AppLogoBlack />
                  </div>
                  <div className="text-right">
                    <DialogTitle className="text-2xl font-bold tracking-tight">INVOICE #{existingBill ? existingBill.slNo : billCount + 1}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-xs text-muted-foreground mt-1">
                            <p className="font-bold text-sm text-foreground">PENSARE MARKETING</p>
                            <p>First Floor, #1301, TK Tower</p>
                            <p>Above Chicking Koduvally</p>
                            <p>Calicut, Kerala-673572</p>
                        </div>
                    </DialogDescription>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">BILL TO:</h3>
                    <p className="text-muted-foreground">{client.name}</p>
                    {client.address && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{client.address}</p>
                    )}
                  </div>
                   <div className="flex items-start gap-4">
                        <FormField control={form.control} name="duration" render={({ field }) => (
                          <FormItem className="flex flex-col items-start gap-1">
                            <FormLabel className='text-[10px]'>Duration</FormLabel>
                            <FormControl><Input placeholder="e.g., Aug 2024" {...field} className='w-[140px] h-8 text-[10px]' /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="issuedDate" render={({ field }) => (
                          <FormItem className="flex flex-col items-start gap-1">
                            <FormLabel className='text-[10px]'>Date of Issue</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[140px] pl-3 text-left font-normal h-8 text-[10px]",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "MMM dd, yyyy")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                  </div>
                </div>
              </DialogHeader>

              <div className='border rounded-lg overflow-hidden mt-6'>
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
                                <FormControl>
                                  <Input 
                                    placeholder="Service description" 
                                    {...field} 
                                  />
                                </FormControl>
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
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00" 
                                    className="text-right" 
                                    {...field}
                                  />
                                </FormControl>
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
                      <TableCell className="text-right font-bold pr-8">
                        {totalAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">Balance Due</TableCell>
                      <TableCell className="p-1 text-right pr-2">
                        <FormField control={form.control} name="balance" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00" 
                                className="text-right h-8" 
                                {...field} 
                                value={field.value}
                              />
                            </FormControl>
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
                onClick={() => append({ description: "", amount: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            <DialogFooter className='bg-muted p-6 pt-4 sm:justify-between sm:items-end'>
              <div className='text-left'>
                <h4 className="text-xs font-bold mb-1">Bank Details:</h4>
                <p className='text-[10px] text-muted-foreground'>PENSARE MARKETING</p>
                <p className='text-[10px] text-muted-foreground'>State Bank of India, Koduvally Branch</p>
                <p className='text-[10px] text-muted-foreground'>A/C No: 39003560642</p>
                <p className='text-[10px] text-muted-foreground'>IFSC Code: SBIN0001442</p>
                <p className='text-[10px] text-muted-foreground'>GPay: 9745600523</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <p className='text-sm font-bold'>Thank you for your business!</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingBill ? "Save Changes" : "Issue Bill"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
