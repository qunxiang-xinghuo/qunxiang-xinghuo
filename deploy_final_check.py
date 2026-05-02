#!/usr/bin/env python3
"""v5.4 最终全面验证"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

def ssh_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode("utf-8", errors="replace").strip()

def check(name, cmd, expect_contains=None, expect_code=None):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    out = ssh_cmd(client, cmd)
    client.close()

    ok = True
    if expect_code is not None:
        ok = ok and (expect_code in out)
    if expect_contains is not None:
        ok = ok and (expect_contains in out)

    status = "✅" if ok else "❌"
    print(f"{status} {name}: {out[:80]}")
    return ok

def main():
    print("=" * 60)
    print("v5.4 最终全面验证")
    print("=" * 60)

    results = []

    # 1. 基础连通
    print("\n【基础连通】")
    results.append(check("首页HTTP状态", "curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/home", expect_code="200"))
    results.append(check("故事大厅HTTP状态", "curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/story-hall", expect_code="200"))

    # 2. 静态资源
    print("\n【静态资源】")
    results.append(check("chunks JS", "JS=$(ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 | sed 's|.*/chunks/||') && curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/_next/static/chunks/$JS", expect_code="200"))
    results.append(check("刘看山图片", "curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/liukanshan.jpg", expect_code="200"))

    # 3. 页面内容
    print("\n【页面内容】")
    results.append(check("首页含bubble", "curl -s http://81.70.59.228:3000/home | grep -c 'bubble' || echo 0", expect_contains="1"))
    results.append(check("首页含刘看山", "curl -s http://81.70.59.228:3000/home | grep -c 'liukanshan' || echo 0", expect_contains="1"))
    results.append(check("故事大厅页面", "curl -s http://81.70.59.228:3000/story-hall | grep -c '群像共创' || echo 0", expect_contains="1"))

    # 4. API
    print("\n【API接口】")
    results.append(check("故事列表API", "curl -s http://81.70.59.228:3000/api/stories | grep -c 'success' || echo 0", expect_contains="1"))
    results.append(check("泡泡API", "curl -s http://81.70.59.228:3000/api/brainholes/bubble | grep -c 'success' || echo 0", expect_contains="1"))

    # 5. 新API路由存在
    print("\n【v5.4新增API】")
    results.append(check("审核API存在", "ls /www/wwwroot/qunxiang-xinghuo/src/app/api/stories/[storyId]/roles/[roleId]/review/route.ts | wc -l", expect_contains="1"))
    results.append(check("启动API存在", "ls /www/wwwroot/qunxiang-xinghuo/src/app/api/stories/[storyId]/start/route.ts | wc -l", expect_contains="1"))

    # 6. PM2状态
    print("\n【PM2状态】")
    results.append(check("PM2 online", "pm2 status qunxiang-xinghuo | grep -c 'online' || echo 0", expect_contains="1"))

    # 7. Build信息
    print("\n【Build信息】")
    results.append(check("BUILD_ID", "cat /www/wwwroot/qunxiang-xinghuo/.next/BUILD_ID | wc -c", expect_contains="22"))

    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"验证结果：{passed}/{total} 通过")
    if passed == total:
        print("🎉 全部通过！v5.4 部署成功。")
    else:
        print("⚠️ 有项目未通过，请检查上方 ❌ 标记。")
    print("=" * 60)

if __name__ == "__main__":
    main()
