
'use client';

import React, { useState, useRef, RefObject } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Check } from 'lucide-react';

interface InsertLinkPopoverProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  onValueChange: (value: string) => void;
  onSend: (message: string) => void;
}

export const InsertLinkPopover: React.FC<InsertLinkPopoverProps> = ({ textareaRef, onValueChange, onSend }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const handleApply = () => {
    if (!url) return;
    const linkText = text || url;
    const markdownLink = `[${linkText}](${url})`;

    onSend(markdownLink);
    
    setOpen(false);
    setText('');
    setUrl('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && textareaRef.current) {
        const { selectionStart, selectionEnd, value } = textareaRef.current;
        const selectedText = value.substring(selectionStart, selectionEnd);
        setText(selectedText);
        // Clear url field when opening
        setUrl('');
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label="Insert link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" side="top" align="start">
        <div className="grid gap-2">
          <Input
            placeholder="Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-8 text-[10px]"
          />
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search or paste a link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-[10px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="h-8 w-8"
              onClick={handleApply}
              disabled={!url}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Apply</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
