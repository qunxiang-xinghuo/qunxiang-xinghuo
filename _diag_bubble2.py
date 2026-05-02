import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=')

# 1. 检查服务器git状态
print("=== 1. Git状态 ===")
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -3')
print(stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git status --short')
print('Status:', stdout.read().decode().strip() or 'clean')

# 2. 检查服务器上API文件是否已更新
print("\n=== 2. API文件第245行 ===")
stdin, stdout, stderr = client.exec_command("sed -n '245p' /www/wwwroot/qunxiang-xinghuo/src/app/api/brainholes/bubble/route.ts")
print(stdout.read().decode().strip())

# 3. curl首页HTML，搜索BubbleCloud相关内容
print("\n=== 3. 首页HTML包含BubbleCloud? ===")
stdin, stdout, stderr = client.exec_command('curl -s http://localhost:3000/home | grep -i "bubble\|泡泡\|暂无热门" | head -5')
print(stdout.read().decode().strip() or '(无匹配)')

# 4. 检查浏览器控制台可能看不到的错误 - 看JS是否有语法错误
print("\n=== 4. 检查chunk文件是否存在 ===")
stdin, stdout, stderr = client.exec_command('ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/ | head -5')
print(stdout.read().decode().strip())

# 5. 直接测试带_next前缀的静态文件
print("\n=== 5. 静态文件测试 ===")
stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/chunks/0_6nlzvo5ngx0.js')
print('chunk JS:', stdout.read().decode().strip())

# 6. 检查home page中泡泡容器高度
print("\n=== 6. Home page泡泡区域 ===")
stdin, stdout, stderr = client.exec_command("grep -n -B 2 -A 5 'BubbleCloud' /www/wwwroot/qunxiang-xinghuo/src/app/home/page.tsx")
print(stdout.read().decode().strip())

# 7. 检查服务器上BubbleCloud代码
print("\n=== 7. 服务器BubbleCloud loaded状态 ===")
stdin, stdout, stderr = client.exec_command("grep -n 'loaded\|bubbles.length' /www/wwwroot/qunxiang-xinghuo/src/components/bubble-cloud/BubbleCloud.tsx | head -10")
print(stdout.read().decode().strip())

client.close()
