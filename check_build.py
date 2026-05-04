import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

stdin, stdout, stderr = client.exec_command('cat /tmp/xh_build.log')
out = stdout.read().decode()
print(out[-3000:] if len(out) > 3000 else out)

client.close()
