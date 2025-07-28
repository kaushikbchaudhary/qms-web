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
    toast.error('Unexpected error occurred.');
  }
};
