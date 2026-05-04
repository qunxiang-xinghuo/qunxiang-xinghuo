import paramiko, sys, io, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

print('=== 杀掉旧build进程 ===')
client.exec_command("pkill -f 'npm run build' || true")
client.exec_command("pkill -f 'next build' || true")
time.sleep(1)

print('=== 清理 .next ===')
stdin, stdout, stderr = client.exec_command('cd /path/to/remote/project && rm -rf .next')
print(stdout.read().decode().strip())
print(stderr.read().decode().strip())

print('=== 开始 build（可能需要5-10分钟）===')
# 使用nohup让build在后台运行
stdin, stdout, stderr = client.exec_command(
    "cd /path/to/remote/project && export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && NODE_ENV=production npm run build > /tmp/xh_build.log 2>&1 && echo 'BUILD_SUCCESS' || echo 'BUILD_FAILED'",
    get_pty=True,
    timeout=600
)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
print('build输出:', out[-500:] if len(out) > 500 else out)
if err:
    print('build错误:', err[-500:] if len(err) > 500 else err)

if 'BUILD_SUCCESS' in out:
    print('=== Build 成功，重启 PM2 ===')
    client.exec_command('cd /path/to/remote/project && pm2 restart qunxiang-xinghuo && pm2 save')
    time.sleep(2)
    # 验证静态资源
    stdin, stdout, stderr = client.exec_command(
        "curl -sI http://localhost:3000/_next/static/chunks/main-app.js | head -1"
    )
    curl_out = stdout.read().decode().strip()
    print('静态资源验证:', curl_out)
else:
    print('=== Build 失败，查看日志 ===')
    stdin, stdout, stderr = client.exec_command('tail -50 /tmp/xh_build.log')
    print(stdout.read().decode().strip())

client.close()
