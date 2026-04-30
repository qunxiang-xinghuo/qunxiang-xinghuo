import sys
import paramiko
import time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

print('Monitoring build progress...')
for i in range(30):
    time.sleep(10)
    stdin, stdout, stderr = client.exec_command('tail -5 /tmp/build_v4.log')
    log = stdout.read().decode()
    if log.strip():
        print(f'--- {(i+1)*10}s ---')
        print(log)
    
    stdin, stdout, stderr = client.exec_command("grep -c 'Build worker exited' /tmp/build_v4.log")
    count = stdout.read().decode().strip()
    if count == '1':
        print('BUILD FINISHED!')
        break
    
    stdin, stdout, stderr = client.exec_command("ps aux | grep 'next build' | grep -v grep")
    if not stdout.read().decode().strip():
        print('No build process found')
        break

stdin, stdout, stderr = client.exec_command('tail -20 /tmp/build_v4.log')
print('FINAL LOG:')
print(stdout.read().decode())

client.close()
