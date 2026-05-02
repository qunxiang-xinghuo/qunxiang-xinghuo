import paramiko, json

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=')

# 1. 直接curl泡泡API，看完整返回
print("=== 1. 泡泡API完整返回 ===")
stdin, stdout, stderr = client.exec_command('curl -s "http://localhost:3000/api/brainholes/bubble?limit=5" 2>&1')
raw = stdout.read().decode('utf-8', errors='replace')
try:
    data = json.loads(raw)
    print(f"success: {data.get('success')}")
    print(f"brainholes count: {len(data.get('data', {}).get('brainholes', []))}")
    for i, b in enumerate(data.get('data', {}).get('brainholes', [])[:3]):
        print(f"  [{i}] id={b.get('id')}, title={b.get('title')}, category={b.get('category')}, hotScore={b.get('hotScore')}")
except Exception as e:
    print(f"Parse error: {e}")
    print(f"Raw (first 500 chars): {raw[:500]}")

# 2. 检查数据库中是否有approved脑洞
print("\n=== 2. 数据库approved脑洞数量 ===")
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && npx prisma db execute --stdin 2>/dev/null <<< "SELECT COUNT(*) FROM Brainhole WHERE status=\'approved\';"')
print(stdout.read().decode('utf-8', errors='replace').strip())

# 3. 检查API limit参数
print("\n=== 3. 检查API代码中的limit ===")
stdin, stdout, stderr = client.exec_command("grep -n 'Math.min.*Math.max.*limit' /www/wwwroot/qunxiang-xinghuo/src/app/api/brainholes/bubble/route.ts")
print(stdout.read().decode().strip())

# 4. 检查前端调用
print("\n=== 4. 检查前端BubbleCloud fetch ===")
stdin, stdout, stderr = client.exec_command("grep -n 'brainholes/bubble' /www/wwwroot/qunxiang-xinghuo/src/components/bubble-cloud/BubbleCloud.tsx")
print(stdout.read().decode().strip())

# 5. 检查home page中泡泡容器
print("\n=== 5. 检查home page泡泡容器 ===")
stdin, stdout, stderr = client.exec_command("grep -n -A 3 'BubbleCloud' /www/wwwroot/qunxiang-xinghuo/src/app/home/page.tsx")
print(stdout.read().decode().strip())

client.close()
