#!/usr/bin/env python3
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

checks = []

def check(name, cmd, expect):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    ok = expect in out
    checks.append(ok)
    status = "OK" if ok else "FAIL"
    print(f"[{status}] {name}: {out[:60]}")

print("=" * 60)
print("v5.5 最终线上验证")
print("=" * 60)

print("\n【静态资源】")
check("chunks JS 200", "JS=$(ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 | sed 's|.*/chunks/||') && curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/_next/static/chunks/$JS", "200")
check("刘看山图片 200", "curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/liukanshan.jpg", "200")

print("\n【页面内容】")
check("首页 /home", "curl -s http://81.70.59.228:3000/home | grep -c '群像' || echo 0", "1")
check("故事大厅 /story-hall", "curl -s http://81.70.59.228:3000/story-hall | grep -c '群像共创' || echo 0", "1")
check("双人匹配 /duo-match", "curl -s http://81.70.59.228:3000/duo-match | grep -c '身份选择' || echo 0", "1")
check("个人中心 /profile", "curl -s http://81.70.59.228:3000/profile | grep -c '我的' || echo 0", "1")

print("\n【新颜色体系验证】")
check("home含slate", "curl -s http://81.70.59.228:3000/home | grep -c 'slate' || echo 0", "1")
check("story-hall含slate", "curl -s http://81.70.59.228:3000/story-hall | grep -c 'slate' || echo 0", "1")

print("\n【API】")
check("故事列表API", "curl -s http://81.70.59.228:3000/api/stories | grep -c 'success' || echo 0", "1")
check("泡泡API", "curl -s http://81.70.59.228:3000/api/brainholes/bubble | grep -c 'success' || echo 0", "1")

print("\n【PM2】")
check("PM2 online", "pm2 status qunxiang-xinghuo | grep -c 'online' || echo 0", "1")

client.close()

passed = sum(checks)
total = len(checks)
print(f"\n{'=' * 60}")
print(f"结果: {passed}/{total} 通过")
if passed == total:
    print("v5.5 UI全面重设计 部署成功！")
else:
    print("部分检查未通过")
print('=' * 60)
