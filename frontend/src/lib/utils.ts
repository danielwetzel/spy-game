import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSessionCode(code: string): string {
  return code.toUpperCase()
}

export function formatTimeRemaining(endTime: number): string {
  const remaining = Math.max(0, endTime - Date.now())
  const seconds = Math.ceil(remaining / 1000)
  
  if (seconds <= 0) return "0:00"
  
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  return `${mins}:${secs.toString().padStart(2, '0')}`
}