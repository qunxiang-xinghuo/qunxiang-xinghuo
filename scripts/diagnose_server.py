#!/usr/bin/env python3
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=')

print('=== PM2 Logs (last 30) ===')
stdin, stdout, stderr = ssh.exec_command('pm2 logs qunxiang-xinghuo --lines 30 --nostream')
print(stdout.read().decode())

print('=== Brainholes count ===')
stdin, stdout, stderr = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Brainhole;"')
print('Count:', stdout.read().decode().strip())

print('=== MatchRequests status ===')
stdin, stdout, stderr = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM MatchRequest GROUP BY status;"')
print(stdout.read().decode().strip())

print('=== Rooms type ===')
stdin, stdout, stderr = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT type, COUNT(*) FROM Room GROUP BY type;"')
print(stdout.read().decode().strip())

print('=== Latest MatchRequests ===')
stdin, stdout, stderr = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT id, userId, brainholeId, status, createdAt FROM MatchRequest ORDER BY createdAt DESC LIMIT 5;"')
print(stdout.read().decode().strip())

ssh.close()
