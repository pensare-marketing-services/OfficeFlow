import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeSentences(text: string): string {
  if (!text) return '';
  // This regex finds the first letter of the string and the first letter after a sentence-ending punctuation mark followed by a space.
  return text.replace(/(^\w|\.\s+\w)/g, char => char.toUpperCase());
}
