'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  className?: string;
}> = ({ value, onSave, className }) => {
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
    />
  );
};

export default function WebsiteListingPage() {
  const [websites, setWebsites] = useState<WebsiteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'websiteDirectory'), orderBy('createdAt', 'asc'));
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
        dbName: '',
        dbUser: '',
        dbPassword: '',
        wpUser: '',
        wpPassword: '',
        webmailUser: '',
        webmailPassword: '',
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
    <div className="space-y-4 h-[calc(100vh-6rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="p-2 shrink-0">
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
                  placeholder="Search websites..."
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
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div 
            ref={tableContainerRef}
            className="overflow-auto h-full border-t relative scrollbar-thin scrollbar-thumb-muted-foreground/20"
          >
            <table className="w-max min-w-full text-[10px] border-collapse table-fixed">
              <thead>
                {/* First header row - Sticky at top-0 */}
                <tr className="h-8">
                  <th rowSpan={2} className="sticky top-0 z-40 w-[40px] text-center border-r border-b bg-muted px-2 font-medium">Sl.</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Client</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[150px] border-r border-b bg-muted px-2 font-medium text-left">Address</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[80px] border-r border-b bg-muted px-2 font-medium text-left">Contact</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[80px] border-r border-b bg-muted px-2 font-medium text-left">Contact No</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[120px] border-r border-b bg-muted px-2 font-medium text-left">Domain Name</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Domain A/c</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[150px] border-r border-b bg-muted px-2 font-medium text-left">Domain E-mail</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Purchased By</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Domain Expiry</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Hosting Expiry</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[120px] border-r border-b bg-muted px-2 font-medium text-left">Hosting Co</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[200px] border-r border-b bg-muted px-2 font-medium text-left">Host Remarks</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[100px] border-r border-b bg-muted px-2 font-medium text-left">Platform</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[150px] border-r border-b bg-muted px-2 font-medium text-left">Theme Link</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[150px] border-r border-b bg-muted px-2 font-medium text-left">Admin panel link</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[120px] border-r border-b bg-muted px-2 font-medium text-left">Admin Panel Name</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[120px] border-r border-b bg-muted px-2 font-medium text-left">Panel Password</th>
                  <th rowSpan={2} className="sticky top-0 z-40 w-[120px] border-r border-b bg-muted px-2 font-medium text-left">Work Done By</th>
                  
                  <th colSpan={3} className="sticky top-0 z-30 text-center border-r border-b bg-yellow-100 text-yellow-900 h-8 px-2 font-semibold">DB Credentials</th>
                  <th colSpan={2} className="sticky top-0 z-30 text-center border-r border-b bg-blue-100 text-blue-900 h-8 px-2 font-semibold">WordPress</th>
                  <th colSpan={2} className="sticky top-0 z-30 text-center border-r border-b bg-green-100 text-green-900 h-8 px-2 font-semibold">Webmail</th>
                  
                  <th rowSpan={2} className="sticky top-0 z-40 w-[40px] text-center border-b bg-muted px-2 font-medium">Actions</th>
                </tr>
                {/* Second header row - Sticky at top-8 (32px) */}
                <tr className="h-8">
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-yellow-50 text-yellow-800 px-2 font-medium text-left">DB Name</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-yellow-50 text-yellow-800 px-2 font-medium text-left">DB User</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-yellow-50 text-yellow-800 px-2 font-medium text-left">Password</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-blue-50 text-blue-800 px-2 font-medium text-left">Username</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-blue-50 text-blue-800 px-2 font-medium text-left">Password</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-green-50 text-green-800 px-2 font-medium text-left">Mail</th>
                  <th className="sticky top-8 z-30 w-[120px] border-r border-b bg-green-50 text-green-800 px-2 font-medium text-left">Password</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={27} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredWebsites.map((site, index) => (
                  <tr key={site.id} className="hover:bg-muted/30 h-8 border-b">
                    <td className="text-center font-medium text-muted-foreground border-r bg-background px-2">
                      {index + 1}
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.clientName} onSave={(v) => handleUpdate(site.id, 'clientName', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.address} onSave={(v) => handleUpdate(site.id, 'address', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.contactPerson} onSave={(v) => handleUpdate(site.id, 'contactPerson', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.contactNo} onSave={(v) => handleUpdate(site.id, 'contactNo', v)}  />
                    </td>
                    <td className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell 
                          value={site.domainName}
                          onSave={(v) => handleUpdate(site.id, 'domainName', v)} 
                          className="flex-1"
                        />
                        {site.domainName && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={() => openLink(site.domainName)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.domainAccount} onSave={(v) => handleUpdate(site.id, 'domainAccount', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.domainEmail} onSave={(v) => handleUpdate(site.id, 'domainEmail', v)} />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.purchasedBy} onSave={(v) => handleUpdate(site.id, 'purchasedBy', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.domainExpiry} onSave={(v) => handleUpdate(site.id, 'domainExpiry', v)} />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.hostingExpiry} onSave={(v) => handleUpdate(site.id, 'hostingExpiry', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.hostingCompany} onSave={(v) => handleUpdate(site.id, 'hostingCompany', v)} />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.hostRemarks} onSave={(v) => handleUpdate(site.id, 'hostRemarks', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.platform} onSave={(v) => handleUpdate(site.id, 'platform', v)} />
                    </td>
                    <td className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell value={site.themeLink} onSave={(v) => handleUpdate(site.id, 'themeLink', v)} className="flex-1" />
                        {site.themeLink && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => openLink(site.themeLink)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-0 border-r relative group">
                      <div className="flex items-center">
                        <EditableCell value={site.adminPanelLink} onSave={(v) => handleUpdate(site.id, 'adminPanelLink', v)} className="flex-1" />
                        {site.adminPanelLink && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => openLink(site.adminPanelLink)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.adminPanelName} onSave={(v) => handleUpdate(site.id, 'adminPanelName', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.panelPassword} onSave={(v) => handleUpdate(site.id, 'panelPassword', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.workDoneBy} onSave={(v) => handleUpdate(site.id, 'workDoneBy', v)}  />
                    </td>
                    
                    {/* DB Cells */}
                    <td className="p-0 border-r">
                      <EditableCell value={site.dbName} onSave={(v) => handleUpdate(site.id, 'dbName', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.dbUser} onSave={(v) => handleUpdate(site.id, 'dbUser', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.dbPassword} onSave={(v) => handleUpdate(site.id, 'dbPassword', v)} />
                    </td>
                    
                    {/* WP Cells */}
                    <td className="p-0 border-r">
                      <EditableCell value={site.wpUser} onSave={(v) => handleUpdate(site.id, 'wpUser', v)} />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.wpPassword} onSave={(v) => handleUpdate(site.id, 'wpPassword', v)}  />
                    </td>
                    
                    {/* Webmail Cells */}
                    <td className="p-0 border-r">
                      <EditableCell value={site.webmailUser} onSave={(v) => handleUpdate(site.id, 'webmailUser', v)}  />
                    </td>
                    <td className="p-0 border-r">
                      <EditableCell value={site.webmailPassword} onSave={(v) => handleUpdate(site.id, 'webmailPassword', v)}  />
                    </td>

                    <td className="p-0 text-center bg-background">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(site.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredWebsites.length === 0 && (
                  <tr>
                    <td colSpan={27} className="h-24 text-center text-muted-foreground">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
