import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

# 验证首页
print("=== 首页验证 ===")
stdin, stdout, stderr = client.exec_command("curl -sI http://localhost:3000/home | head -3")
print(stdout.read().decode().strip())

# 验证JS静态资源
print("\n=== JS静态资源验证 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next/static -name "*.js" | head -1')
js_file = stdout.read().decode().strip()
if js_file:
    url_path = js_file.replace('/www/wwwroot/qunxiang-xinghuo/.next/static/', '/_next/static/')
    stdin, stdout, stderr = client.exec_command(f"curl -sI http://localhost:3000{url_path} | head -2")
    print(stdout.read().decode().strip())

# 验证CSS静态资源
print("\n=== CSS静态资源验证 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next/static -name "*.css" | head -1')
css_file = stdout.read().decode().strip()
if css_file:
    url_path = css_file.replace('/www/wwwroot/qunxiang-xinghuo/.next/static/', '/_next/static/')
    stdin, stdout, stderr = client.exec_command(f"curl -sI http://localhost:3000{url_path} | head -2")
    print(stdout.read().decode().strip())
else:
    print("(无CSS文件)")

client.close()
