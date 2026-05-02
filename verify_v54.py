#!/usr/bin/env python3
import paramiko

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# 方法1: 检查JS bundle中是否包含v5.4特有的代码
print("=== 方法1: JS Bundle中搜索v5.4代码 ===")
stdin, stdout, stderr = client.exec_command(
    "grep -rl 'claimStatus' /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/ | head -3"
)
print("claimStatus in chunks:", stdout.read().decode() or "NOT FOUND")

stdin, stdout, stderr = client.exec_command(
    "grep -rl 'performanceDirection' /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/ | head -3"
)
print("performanceDirection in chunks:", stdout.read().decode() or "NOT FOUND")

stdin, stdout, stderr = client.exec_command(
    "grep -rl 'identityTag' /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/ | head -3"
)
print("identityTag in chunks:", stdout.read().decode() or "NOT FOUND")

# 方法2: 检查HTML中的静态文本
print("\n=== 方法2: story-hall静态HTML内容 ===")
stdin, stdout, stderr = client.exec_command(
    "curl -s http://localhost:3000/story-hall | grep -oE '(approvedRoles|minActors|发起群像|群像共创|个人广场|公共招募)' | sort | uniq -c | sort -rn"
)
print(stdout.read().decode() or "(no matches)")

# 方法3: 检查story-detail页面（动态路由，但SSR会渲染）
print("\n=== 方法3: 故事详情页HTML（直接curl）===")
# 由于没有故事数据，可能会404。检查HTML本身是否有v5.4特征
stdin, stdout, stderr = client.exec_command(
    "curl -s http://localhost:3000/story-hall/test-id | grep -oE '(审核中|已通过|待认领|启动故事|进入对白室|角色列表)' | sort | uniq -c | sort -rn"
)
print(stdout.read().decode() or "(no matches)")

# 方法4: 直接查看server app目录下的page.js
print("\n=== 方法4: 检查server编译输出 ===")
stdin, stdout, stderr = client.exec_command(
    "grep -c 'claimStatus' /www/wwwroot/qunxiang-xinghuo/.next/server/app/story-hall/\[storyId\]/page.js"
)
print("claimStatus in server page.js:", stdout.read().decode())

stdin, stdout, stderr = client.exec_command(
    "grep -c '启动故事' /www/wwwroot/qunxiang-xinghuo/.next/server/app/story-hall/\[storyId\]/page.js"
)
print("启动故事 in server page.js:", stdout.read().decode())

client.close()
