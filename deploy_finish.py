import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

# 1. Check build success
stdin, stdout, stderr = client.exec_command("grep 'Build worker exited with code: 1' /tmp/build_v4.log")
error = stdout.read().decode().strip()
if error:
    print('BUILD FAILED!')
    stdin, stdout, stderr = client.exec_command('tail -50 /tmp/build_v4.log')
    print(stdout.read().decode())
    client.close()
    sys.exit(1)

print('BUILD SUCCESS!')

# 2. Copy static
stdin, stdout, stderr = client.exec_command(
    'cd /www/wwwroot/qunxiang-xinghuo && rm -rf .next/standalone/.next/static && cp -r .next/static .next/standalone/.next/ && echo STATIC_OK'
)
print('STATIC:', stdout.read().decode())

# 3. PM2 list and restart
stdin, stdout, stderr = client.exec_command('/usr/bin/pm2 list')
print('PM2 LIST:')
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && /usr/bin/pm2 restart all')
print('PM2 RESTART:')
print(stdout.read().decode())
print('PM2 ERR:', stderr.read().decode())

client.close()
print('DEPLOYMENT COMPLETE!')
