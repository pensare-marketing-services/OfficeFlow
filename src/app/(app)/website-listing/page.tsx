'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Trash2, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { WebsiteEntry } from '@/lib/data';

const EditableCell: React.FC<{
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onSave, placeholder, className }) => {
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  const handleBlur = () => {
    if (val !== (value || '')) {
      onSave(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      className={cn(
        "h-7 text-[10px] p-1 border-transparent hover:border-border focus:border-ring bg-transparent transition-colors",
        className
      )}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
};

export default function WebsiteListingPage() {
  const [websites, setWebsites] = useState<WebsiteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'websiteDirectory'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WebsiteEntry));
      setWebsites(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddWebsite = async () => {
    try {
      await addDoc(collection(db, 'websiteDirectory'), {
        clientName: '',
        address: '',
        contactPerson: '',
        contactNo: '',
        domainName: '',
        domainAccount: '',
        domainEmail: '',
        purchasedBy: '',
        domainExpiry: '',
        hostingExpiry: '',
        hostingCompany: '',
        hostRemarks: '',
        platform: '',
        themeLink: '',
        adminPanelLink: '',
        adminPanelName: '',
        panelPassword: '',
        workDoneBy: '',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error adding entry' });
    }
  };

  const handleUpdate = async (id: string, field: keyof WebsiteEntry, value: string) => {
    try {
      const ref = doc(db, 'websiteDirectory', id);
      await updateDoc(ref, { [field]: value });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating entry' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'websiteDirectory', id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting entry' });
    }
  };

  const filteredWebsites = useMemo(() => {
    return websites.filter(site => 
      site.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      site.domainName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [websites, search]);

  const openLink = (url: string) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(formattedUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-headline">Website Directory</CardTitle>
                <CardDescription className="text-[10px]">Manage all client web properties and credentials.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input 
                  placeholder="Search client or domain..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-[10px]"
                />
              </div>
              <Button onClick={handleAddWebsite} size="sm" className="h-8 gap-1">
                <Plus className="h-3 w-3" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-12rem)] border-t">
            <Table className="w-max min-w-full text-[10px]">
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="w-[40px] text-center border-r">Sl.</TableHead>
                  <TableHead className="w-[150px] border-r">Client</TableHead>
                  <TableHead className="w-[200px] border-r">Address</TableHead>
                  <TableHead className="w-[120px] border-r">Contact Person</TableHead>
                  <TableHead className="w-[120px] border-r">Contact No</TableHead>
                  <TableHead className="w-[180px] border-r">Domain Name</TableHead>
                  <TableHead className="w-[120px] border-r">Domain A/c</TableHead>
                  <TableHead className="w-[150px] border-r">Domain E-mail</TableHead>
                  <TableHead className="w-[100px] border-r">Purchased By</TableHead>
                  <TableHead className="w-[100px] border-r">Domain Expiry</TableHead>
                  <TableHead className="w-[100px] border-r">Hosting Expiry</TableHead>
                  <TableHead className="w-[120px] border-r">Hosting Co</TableHead>
                  <TableHead className="w-[200px] border-r">Host Remarks</TableHead>
                  <TableHead className="w-[100px] border-r">Platform</TableHead>
                  <TableHead className="w-[150px] border-r">Theme Link</TableHead>
                  <TableHead className="w-[150px] border-r">Admin panel link</TableHead>
                  <TableHead className="w-[120px] border-r">Admin Panel Name</TableHead>
                  <TableHead className="w-[120px] border-r">Panel Password</TableHead>
                  <TableHead className="w-[120px] border-r">Work Done By</TableHead>
                  <TableHead className="w-[40px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={20} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading directory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredWebsites.map((site, index) => (
                  <TableRow key={site.id} className="hover:bg-muted/30">
                    <TableCell className="text-center font-medium text-muted-foreground border-r">
                      {websites.length - index}
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.clientName} onSave={(v) => handleUpdate(site.id, 'clientName', v)} placeholder="Client..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.address} onSave={(v) => handleUpdate(site.id, 'address', v)} placeholder="Address..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.contactPerson} onSave={(v) => handleUpdate(site.id, 'contactPerson', v)} placeholder="Person..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.contactNo} onSave={(v) => handleUpdate(site.id, 'contactNo', v)} placeholder="Number..." />
                    </TableCell>
                    <TableCell className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell 
                          value={site.domainName} 
                          onSave={(v) => handleUpdate(site.id, 'domainName', v)} 
                          placeholder="domain.com"
                          className="flex-1"
                        />
                        {site.domainName && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => openLink(site.domainName)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.domainAccount} onSave={(v) => handleUpdate(site.id, 'domainAccount', v)} placeholder="A/c..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.domainEmail} onSave={(v) => handleUpdate(site.id, 'domainEmail', v)} placeholder="Email..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.purchasedBy} onSave={(v) => handleUpdate(site.id, 'purchasedBy', v)} placeholder="Who..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.domainExpiry} onSave={(v) => handleUpdate(site.id, 'domainExpiry', v)} placeholder="Expiry..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.hostingExpiry} onSave={(v) => handleUpdate(site.id, 'hostingExpiry', v)} placeholder="Expiry..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.hostingCompany} onSave={(v) => handleUpdate(site.id, 'hostingCompany', v)} placeholder="Co..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.hostRemarks} onSave={(v) => handleUpdate(site.id, 'hostRemarks', v)} placeholder="Remarks..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.platform} onSave={(v) => handleUpdate(site.id, 'platform', v)} placeholder="Platform..." />
                    </TableCell>
                    <TableCell className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell value={site.themeLink} onSave={(v) => handleUpdate(site.id, 'themeLink', v)} placeholder="Link..." className="flex-1" />
                        {site.themeLink && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => openLink(site.themeLink)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell value={site.adminPanelLink} onSave={(v) => handleUpdate(site.id, 'adminPanelLink', v)} placeholder="Link..." className="flex-1" />
                        {site.adminPanelLink && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => openLink(site.adminPanelLink)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.adminPanelName} onSave={(v) => handleUpdate(site.id, 'adminPanelName', v)} placeholder="User..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.panelPassword} onSave={(v) => handleUpdate(site.id, 'panelPassword', v)} placeholder="Pass..." />
                    </TableCell>
                    <TableCell className="p-0 border-r">
                      <EditableCell value={site.workDoneBy} onSave={(v) => handleUpdate(site.id, 'workDoneBy', v)} placeholder="Assignee..." />
                    </TableCell>
                    <TableCell className="p-0 text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(site.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredWebsites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={20} className="h-24 text-center text-muted-foreground">
                      No matching records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
