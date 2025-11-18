import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";
import {ApiErrorResponse} from "@/lib/api/types/errors";
import {toast} from "sonner";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const normalizeErrorMessages = (errors: unknown): string[] => {
  if (!errors) return [];

  if (Array.isArray(errors)) {
    return errors
      .map((err) => {
        if (!err) return null;
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
          const value = (err as Record<string, unknown>).message;
          return typeof value === 'string' ? value : null;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value));
  }

  if (typeof errors === 'object') {
    return Object.values(errors as Record<string, unknown>)
      .map((value) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
          const msg = (value as Record<string, unknown>).message;
          return typeof msg === 'string' ? msg : null;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value));
  }

  return [];
};

export const showApiErrorToast = (error: unknown) => {
  const fallbackMessage = 'Something went wrong. Please try again.';

  if (!axios.isAxiosError(error)) {
    toast.error(fallbackMessage);
    return;
  }

  const errData = error.response?.data as ApiErrorResponse | undefined;
  const messages: string[] = [];

  if (errData) {
    const normalizedErrors = normalizeErrorMessages(errData.errors);
    if (normalizedErrors.length) {
      messages.push(...normalizedErrors);
    }

    if (!normalizedErrors.length && errData.message) {
      messages.push(errData.message);
    }
  }

  if (!messages.length && typeof error.message === 'string' && error.message.trim().length) {
    messages.push(error.message);
  }

  if (!messages.length) {
    messages.push(fallbackMessage);
  }

  messages.forEach((message) => toast.error(message));
};

export const getFileType = (path: string) => {
  const extension = path.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  } else if (extension === 'pdf') {
    return 'pdf';
  } else if (['mp4', 'webm', 'mov'].includes(extension || '')) {
    return 'video';
  }
  return 'other';
};

export const formatDate = (dateString:any) => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString:any) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
};
