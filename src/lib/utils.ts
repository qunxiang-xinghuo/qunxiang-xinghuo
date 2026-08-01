/**
 * @fileoverview 工具函数
 * 提供通用的工具函数，如 className 合并等
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
