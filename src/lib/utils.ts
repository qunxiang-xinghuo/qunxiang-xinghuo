import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function apiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function apiError(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: { code, message },
  };
}

export function validateEnvVars(requiredVars: string[]) {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}