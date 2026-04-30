import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

# Fix the TypeScript error by modifying the file directly
stdin, stdout, stderr = client.exec_command(
    "sed -i \"s/const orderBy = mode === 'bubble'/const orderBy: any = mode === 'bubble'/\" "
    "/www/wwwroot/qunxiang-xinghuo/src/app/api/brainholes/route.ts"
)
print('FIX:', stdout.read().decode())
print('FIX ERR:', stderr.read().decode())

# Verify the fix
stdin, stdout, stderr = client.exec_command(
    "grep -n 'orderBy' /www/wwwroot/qunxiang-xinghuo/src/app/api/brainholes/route.ts | head -3"
)
print('VERIFY:', stdout.read().decode())

client.close()
print('FIX APPLIED')
