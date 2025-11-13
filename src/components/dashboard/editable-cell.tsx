'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task, User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface EditableCellProps {
  task: Task | undefined;
  users: User[];
  onAssign: (userId: string) => void;
  onAddNote: (note: string) => void;
}

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

export default function EditableCell({ task, users, onAssign, onAddNote }: EditableCellProps) {
  const [note, setNote] = useState('');
  const [isNotesOpen, setNotesOpen] = useState(false);
  const assignedUser = task ? users.find((u) => u.id === task.assigneeId) : undefined;

  const handleAssign = (userId: string) => {
    onAssign(userId);
  };

  const handleSaveNote = () => {
    if (note.trim()) {
      onAddNote(note);
      setNote('');
      setNotesOpen(false);
    }
  };

  if (!task || !assignedUser) {
    return (
      <Select onValueChange={handleAssign}>
        <SelectTrigger className="h-8 text-xs focus:ring-0 focus:ring-offset-0 border-0 shadow-none">
          <SelectValue placeholder="Assign to..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Popover open={isNotesOpen} onOpenChange={setNotesOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full h-full justify-start p-1 text-xs">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignedUser.avatar} />
              <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{assignedUser.name}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Add Note</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Note for ${assignedUser.name}...`}
            className="text-xs"
            rows={3}
          />
           <div className="max-h-24 overflow-y-auto space-y-1">
            {task.progressNotes.slice().reverse().map((n, i) => (
              <div key={i} className="text-xs text-muted-foreground bg-secondary/50 p-1 rounded-sm">"{n.note}"</div>
            ))}
          </div>
          <Button size="sm" onClick={handleSaveNote} className="w-full">
            Save Note
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
