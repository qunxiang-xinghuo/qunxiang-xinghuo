/**
 * 审计日志模块
 * 记录敏感操作，用于安全审计和问题追踪
 */

import fs from 'fs';
import path from 'path';

/**
 * 审计日志级别
 */
export enum AuditLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  timestamp: string;
  level: AuditLevel;
  action: string;
  userId?: string;
  roomId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

/**
 * 日志文件路径
 */
const LOG_DIR = '/app/work/logs/bypass';
const AUDIT_LOG_FILE = path.join(LOG_DIR, 'audit.log');

/**
 * 确保日志目录存在
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * 写入审计日志
 */
export function writeAuditLog(entry: AuditLogEntry): void {
  try {
    ensureLogDir();
    
    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    }) + '\n';
    
    fs.appendFileSync(AUDIT_LOG_FILE, logLine, 'utf-8');
  } catch (error) {
    // 审计日志写入失败不应影响主流程
    console.error('审计日志写入失败:', error);
  }
}

/**
 * 记录用户登录
 */
export function auditLogin(
  userId: string,
  success: boolean,
  ip?: string,
  userAgent?: string,
  error?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    action: 'USER_LOGIN',
    userId,
    ip,
    userAgent,
    success,
    error,
  });
}

/**
 * 记录用户注册
 */
export function auditRegister(
  userId: string,
  success: boolean,
  ip?: string,
  error?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    action: 'USER_REGISTER',
    userId,
    ip,
    success,
    error,
  });
}

/**
 * 记录房间创建
 */
export function auditCreateRoom(
  userId: string | undefined,
  roomId: string,
  success: boolean,
  ip?: string,
  error?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: success ? AuditLevel.INFO : AuditLevel.ERROR,
    action: 'ROOM_CREATE',
    userId,
    roomId,
    ip,
    success,
    error,
  });
}

/**
 * 记录房间加入
 */
export function auditJoinRoom(
  userId: string | undefined,
  roomId: string,
  role: string,
  success: boolean,
  ip?: string,
  error?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    action: 'ROOM_JOIN',
    userId,
    roomId,
    ip,
    details: { role },
    success,
    error,
  });
}

/**
 * 记录消息发送
 */
export function auditSendMessage(
  userId: string | undefined,
  roomId: string,
  role: string,
  contentLength: number,
  success: boolean,
  ip?: string,
  error?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: success ? AuditLevel.INFO : AuditLevel.WARNING,
    action: 'MESSAGE_SEND',
    userId,
    roomId,
    ip,
    details: { role, contentLength },
    success,
    error,
  });
}

/**
 * 记录敏感词拦截
 */
export function auditContentFilter(
  userId: string | undefined,
  roomId: string | undefined,
  content: string,
  matchedWords: string[],
  level: 'level1' | 'level2' | 'level3'
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: level === 'level1' ? AuditLevel.WARNING : AuditLevel.INFO,
    action: 'CONTENT_FILTER',
    userId,
    roomId,
    details: {
      contentPreview: content.substring(0, 50) + '...',
      matchedWords,
      filterLevel: level,
    },
    success: false,
  });
}

/**
 * 记录 API 调用
 */
export function auditApiCall(
  method: string,
  path: string,
  statusCode: number,
  ip?: string,
  userId?: string,
  duration?: number
): void {
  const level = statusCode >= 500 ? AuditLevel.ERROR : 
                statusCode >= 400 ? AuditLevel.WARNING : 
                AuditLevel.INFO;
  
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level,
    action: 'API_CALL',
    userId,
    ip,
    details: {
      method,
      path,
      statusCode,
      duration,
    },
    success: statusCode < 400,
  });
}

/**
 * 记录安全事件
 */
export function auditSecurityEvent(
  eventType: string,
  details: Record<string, unknown>,
  ip?: string,
  userId?: string
): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    level: AuditLevel.CRITICAL,
    action: `SECURITY_${eventType}`,
    userId,
    ip,
    details,
    success: false,
  });
}

/**
 * 读取审计日志（用于管理后台）
 */
export function readAuditLogs(
  limit: number = 100,
  offset: number = 0
): AuditLogEntry[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const entries = lines.map(line => JSON.parse(line) as AuditLogEntry);
    
    // 按时间倒序排列
    entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return entries.slice(offset, offset + limit);
  } catch (error) {
    console.error('读取审计日志失败:', error);
    return [];
  }
}
