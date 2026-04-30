import sys
import paramiko
import time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

# 1. git pull
print('=== GIT PULL ===')
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git pull origin dev')
print(stdout.read().decode())
print(stderr.read().decode())

# 2. build in background, log to file
print('=== STARTING BUILD (background) ===')
stdin, stdout, stderr = client.exec_command(
    'cd /www/wwwroot/qunxiang-xinghuo && nohup /usr/bin/npm run build > /tmp/build_v4.log 2>&1 &'
)
print(stdout.read().decode())

# 3. wait for build to complete (poll log file)
print('=== WAITING FOR BUILD ===')
for i in range(60):  # max 10 minutes
    time.sleep(10)
    stdin, stdout, stderr = client.exec_command('tail -5 /tmp/build_v4.log')
    log = stdout.read().decode()
    if 'Compiled successfully' in log or 'Build worker exited' in log or 'error' in log.lower():
        print(f'Build status after {(i+1)*10}s:')
        print(log)
        break
    if i % 3 == 0:
        print(f'  ... {(i+1)*10}s elapsed')

# Check final build result
stdin, stdout, stderr = client.exec_command('tail -30 /tmp/build_v4.log')
build_log = stdout.read().decode()
print('BUILD FINAL LOG:')
print(build_log)

if 'error' in build_log.lower() and 'Build worker exited with code: 1' in build_log:
    print('BUILD FAILED!')
    client.close()
    sys.exit(1)

# 4. copy static
print('=== COPY STATIC ===')
stdin, stdout, stderr = client.exec_command(
    'cd /www/wwwroot/qunxiang-xinghuo && rm -rf .next/standalone/.next/static && cp -r .next/static .next/standalone/.next/ && echo STATIC_OK'
)
print(stdout.read().decode())

# 5. pm2 restart
print('=== PM2 RESTART ===')
stdin, stdout, stderr = client.exec_command('/usr/bin/pm2 list')
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && /usr/bin/pm2 restart all || /usr/bin/pm2 start server.ts --name xinghuo')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
print('DEPLOYMENT DONE')
