#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=')

commands = [
    ('Brainholes count', 'cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Brainhole;"'),
    ('MatchRequests count', 'cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT COUNT(*) FROM MatchRequest;"'),
    ('MatchRequest status', 'cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM MatchRequest GROUP BY status;"'),
    ('Rooms count', 'cd /www/wwwroot/qunxiang-xinghuo && sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Room;"'),
]

for label, cmd in commands:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f'{label}: {out}')
    if err:
        print(f'  [ERR] {err}')

ssh.close()
