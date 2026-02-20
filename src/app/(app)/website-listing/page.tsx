'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 1. Define dummy data for the list
const dummyWebsites = [
  { id: '1', name: 'Acme Corp Portal', url: 'https://acme-corp.com', status: 'Live', type: 'Website' },
  { id: '2', name: 'Global Logistics', url: 'https://global-log.net', status: 'Maintenance', type: 'SEO' },
  { id: '3', name: 'Sunny Days Resort', url: 'https://sunny-days.com', status: 'Live', type: 'Website' },
  { id: '4', name: 'Tech Innovations', url: 'https://tech-inn.io', status: 'Pending', type: 'SEO' },
];

export default function WebsiteListingPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-headline">Website Directory</CardTitle>
              <CardDescription>Manage and monitor all client web properties.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">No</TableHead>
                <TableHead>Website Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyWebsites.map((site, index) => (
                <TableRow key={site.id}>
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {site.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal uppercase text-[10px]">
                      {site.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "text-[10px]",
                        site.status === 'Live' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                        site.status === 'Maintenance' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      )}
                    >
                      {site.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {site.url}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={site.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple helper for conditional classes (if not already imported)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
