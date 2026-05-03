import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import paramiko

HOST = '81.70.59.228'
USER = 'root'
PASS = 'F!D)7n_mc8Mq}bx='

def run(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    return stdout.read().decode('utf-8', errors='replace').strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)

print('=== v6.0-fix 部署验证 ===')

out = run(ssh, "bash -c 'JS=$(ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 | sed \"s|.*/chunks/||\") && curl -sI -o /dev/null -w \"%{http_code}\" http://localhost:3000/_next/static/chunks/$JS'")
print(f'[1] 静态JS: {out}')

out = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/home")
print(f'[2] 首页: {out}')

out = run(ssh, "curl -s http://localhost:3000/api/brainholes/bubble?limit=5 | python3 -c 'import sys,json; d=json.load(sys.stdin); ids=[b[\"id\"] for b in d[\"data\"][\"brainholes\"][:3]]; print(\" \".join(ids))' 2>/dev/null")
print(f'[3] 泡泡API前3个id: {out}')

out = run(ssh, "curl -s http://localhost:3000/api/brainholes/bubble?limit=5 | python3 -c 'import sys,json; d=json.load(sys.stdin); b=d[\"data\"][\"brainholes\"][0]; print(b[\"id\"][:8])' 2>/dev/null")
print(f'[4] 第一个泡泡id前缀: {out}')

out = run(ssh, "grep -c 'getEngagedBrainholes' /www/wwwroot/qunxiang-xinghuo/src/server/match-engine.ts")
print(f'[5] getEngagedBrainholes: {out}')

out = run(ssh, "grep -c 'engagedCount' /www/wwwroot/qunxiang-xinghuo/src/components/bubble-cloud/Bubble.tsx")
print(f'[6] Bubble无engagedCount: {out}')

out = run(ssh, "grep -c 'duo-match' /www/wwwroot/qunxiang-xinghuo/src/components/bubble-cloud/BubbleCloud.tsx")
print(f'[7] BubbleCloud直接匹配: {out}')

out = run(ssh, "grep -c 'collected' /www/wwwroot/qunxiang-xinghuo/src/app/library/page.tsx")
print(f'[8] 素材库收藏标签: {out}')

out = run(ssh, "pm2 status qunxiang-xinghuo | grep online")
print(f'[9] PM2: {out}')

ssh.close()
print('=== 验证完成 ===')
