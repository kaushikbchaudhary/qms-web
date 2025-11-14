import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";
import {ApiErrorResponse} from "@/lib/api/types/errors";
import {toast} from "sonner";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const showApiErrorToast = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const errData = error.response.data as ApiErrorResponse;
    const defaultMessage = errData.message || 'Something went wrong';

    if (errData.errors && typeof errData.errors === 'object') {
      Object.keys(errData.errors).forEach((key) => {
        toast.error(errData.errors[key].message);
      });
    } else {
      toast.error(defaultMessage);
    }
  } else {
    toast.error('Something went wrong. Please try again.');
  }
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
