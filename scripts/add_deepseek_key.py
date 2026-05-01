import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('81.70.59.228', 22, 'root', 'F!D)7n_mc8Mq}bx=')

# 检查当前.env中是否已有DEEPSEEK_API_KEY
_, out, _ = ssh.exec_command('grep DEEPSEEK_API_KEY /www/wwwroot/qunxiang-xinghuo/.env')
existing = out.read().decode().strip()
print('[Check] 现有DEEPSEEK配置:', repr(existing))

if not existing:
    # 添加key
    cmd = 'echo DEEPSEEK_API_KEY=\"sk-181c8aa2e8f1469d9a60698f6d79d71d\" >> /www/wwwroot/qunxiang-xinghuo/.env'
    _, out2, err2 = ssh.exec_command(cmd)
    err_text = err2.read().decode().strip()
    if err_text:
        print('[Error]', err_text)
    else:
        print('[OK] DEEPSEEK_API_KEY 已添加')
    
    # 验证
    _, out3, _ = ssh.exec_command('grep DEEPSEEK_API_KEY /www/wwwroot/qunxiang-xinghuo/.env')
    verified = out3.read().decode().strip()
    print('[Verify]', verified)
    
    # 重启服务
    _, out4, _ = ssh.exec_command('cd /www/wwwroot/qunxiang-xinghuo && pm2 restart qunxiang-xinghuo')
    restart_result = out4.read().decode().strip()
    print('[Restart]', restart_result)
else:
    print('[Skip] DEEPSEEK_API_KEY 已存在')

ssh.close()
