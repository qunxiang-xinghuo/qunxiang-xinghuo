import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

print("=== 1. 首页200验证 ===")
stdin, stdout, stderr = client.exec_command("curl -sI http://localhost:3000/home | head -2")
print(stdout.read().decode().strip())

print("\n=== 2. 故事大厅200验证 ===")
stdin, stdout, stderr = client.exec_command("curl -sI http://localhost:3000/story-hall | head -2")
print(stdout.read().decode().strip())

print("\n=== 3. 静态JS资源验证 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next/static -name "*.js" | head -1')
js_file = stdout.read().decode().strip()
if js_file:
    url_path = js_file.replace('/www/wwwroot/qunxiang-xinghuo/.next/static/', '/_next/static/')
    stdin, stdout, stderr = client.exec_command(f"curl -sI http://localhost:3000{url_path} | head -2")
    print(f"{url_path}:")
    print(stdout.read().decode().strip())

print("\n=== 4. 静态CSS资源验证 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next/static -name "*.css" | head -1')
css_file = stdout.read().decode().strip()
if css_file:
    url_path = css_file.replace('/www/wwwroot/qunxiang-xinghuo/.next/static/', '/_next/static/')
    stdin, stdout, stderr = client.exec_command(f"curl -sI http://localhost:3000{url_path} | head -2")
    print(f"{url_path}:")
    print(stdout.read().decode().strip())
else:
    print("(无CSS文件，Turbopack可能内联CSS)")

print("\n=== 5. 泡泡API验证 ===")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/brainholes/bubble?limit=5 | python3 -c \"import sys,json; d=json.load(sys.stdin); print('success:', d.get('success')); print('brainholes count:', len(d.get('data',{}).get('brainholes',[])))\"")
print(stdout.read().decode().strip())

client.close()
