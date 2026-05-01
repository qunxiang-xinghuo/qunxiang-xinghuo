#!/usr/bin/env python3
"""Deploy v3: upload layout + build + restart"""
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST, PORT, USER, PASS = "81.70.59.228", 22, "root", "F!D)7n_mc8Mq}bx="
REMOTE = "/www/wwwroot/qunxiang-xinghuo"

def run(ssh, cmd, t=300):
    print(f'\n>>> {cmd}')
    _, out, err = ssh.exec_command(cmd, timeout=t)
    for line in iter(out.readline, ''):
        if line: print(line, end='')
    e = err.read().decode()
    if e: print(f'[STDERR] {e}')
    c = out.channel.recv_exit_status()
    print(f'[EXIT: {c}]')
    return c

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        sftp = ssh.open_sftp()
        sftp.put("src/app/layout.tsx", f"{REMOTE}/src/app/layout.tsx")
        sftp.close()
        print("[OK] layout.tsx uploaded")

        code = run(ssh, f"cd {REMOTE} && npm run build", 300)
        if code != 0:
            print("[ERROR] Build failed")
            return 1

        run(ssh, f"cd {REMOTE} && cp -r .next/static .next/standalone/.next/")
        run(ssh, f"cd {REMOTE} && pm2 restart qunxiang-xinghuo")
        run(ssh, "pm2 list", 10)
        print("\n[OK] Deploy complete")
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
