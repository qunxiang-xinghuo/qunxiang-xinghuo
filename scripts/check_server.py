#!/usr/bin/env python3
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=')

print('=== Git Log ===')
_, out, _ = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -5')
print(out.read().decode())

print('=== PM2 List ===')
_, out, _ = ssh.exec_command('pm2 list')
print(out.read().decode())

print('=== Page.tsx first line ===')
_, out, _ = ssh.exec_command('head -1 /www/wwwroot/qunxiang-xinghuo/src/app/page.tsx')
print(out.read().decode())

print('=== Duo-match first line ===')
_, out, _ = ssh.exec_command('head -1 /www/wwwroot/qunxiang-xinghuo/src/app/duo-match/page.tsx')
print(out.read().decode())

ssh.close()
