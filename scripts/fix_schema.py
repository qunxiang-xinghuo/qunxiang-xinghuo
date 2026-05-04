#!/usr/bin/env python3
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD')

def run(cmd, timeout=60):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    for line in iter(stdout.readline, ''):
        if line:
            print(line, end='')
    err = stderr.read().decode()
    if err:
        print(f'[STDERR] {err}')
    code = stdout.channel.recv_exit_status()
    print(f'[EXIT: {code}]')
    return code

# 1. Check Prisma schema on server
print('=== Checking server schema ===')
run('cat /path/to/remote/project/prisma/schema.prisma | grep -A 5 "hotScore"')

# 2. Run prisma db push
print('\n=== Running prisma db push ===')
run('cd /path/to/remote/project && npx prisma db push --accept-data-loss', timeout=120)

# 3. Rebuild
print('\n=== Rebuilding ===')
run('cd /path/to/remote/project && npm run build', timeout=300)

# 4. Copy static
print('\n=== Copying static ===')
run('cd /path/to/remote/project && cp -r .next/static .next/standalone/.next/')

# 5. Restart PM2
print('\n=== Restarting PM2 ===')
run('cd /path/to/remote/project && pm2 restart qunxiang-xinghuo')

ssh.close()
print('\nDone!')
