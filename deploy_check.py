import sys
import paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

stdin, stdout, stderr = client.exec_command("ps aux | grep -E 'npm|node' | grep -v grep")
print("PROCESSES:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("tail -30 /tmp/build2.log 2>/dev/null || echo no_log")
print("BUILD LOG:")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -3")
print("GIT:")
print(stdout.read().decode())

client.close()
