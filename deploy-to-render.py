#!/usr/bin/env python3
"""
群像·星火 - 自动部署脚本
功能：
1. 将代码推送到 GitHub
2. 通过 Render API 创建 Web Service 并部署

环境变量要求：
- GH_TOKEN: GitHub Personal Access Token (classic, 需勾选 repo 权限)
- RENDER_API_KEY: Render API Key
"""

import os
import sys
import subprocess
import json
import urllib.request
import urllib.error

GITHUB_USERNAME = "qunxiang-xinghuo"
REPO_NAME = "qunxiang-xinghuo"
BRANCH = "master"


def get_env(name):
    value = os.environ.get(name)
    if not value:
        print(f"[错误] 环境变量 {name} 未设置")
        sys.exit(1)
    return value


def github_api(method, path, data=None):
    """调用 GitHub API"""
    token = get_env("GH_TOKEN")
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "QX-Xinghuo-Deploy",
        "Content-Type": "application/json"
    }

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def verify_github_token():
    print("[1/6] 验证 GitHub Token...")
    status, resp = github_api("GET", "/user")
    if status != 200:
        print(f"[错误] GitHub Token 无效: {resp.get('message', 'Unknown error')}")
        print("请前往 https://github.com/settings/tokens 重新生成 classic token，并勾选 repo 权限")
        return False
    print(f"[成功] 已验证用户: {resp['login']}")
    return True


def create_github_repo():
    print("[2/6] 检查/创建 GitHub 仓库...")
    status, resp = github_api("GET", f"/repos/{GITHUB_USERNAME}/{REPO_NAME}")
    if status == 200:
        print(f"[成功] 仓库已存在: {resp['html_url']}")
        return True
    if status == 404:
        status, resp = github_api("POST", "/user/repos", {
            "name": REPO_NAME,
            "private": False,
            "description": "群像·星火 - 实时对戏协作平台"
        })
        if status == 201:
            print(f"[成功] 仓库已创建: {resp['html_url']}")
            return True
    print(f"[错误] 创建仓库失败: {resp.get('message', 'Unknown error')}")
    return False


def push_to_github():
    print("[3/6] 推送代码到 GitHub...")
    token = get_env("GH_TOKEN")
    remote_url = f"https://x-access-token:{token}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"

    # 配置远程仓库
    subprocess.run(["git", "remote", "remove", "origin"], capture_output=True)
    result = subprocess.run(["git", "remote", "add", "origin", remote_url], capture_output=True, text=True)
    if result.returncode != 0 and "already exists" not in result.stderr:
        print(f"[警告] 添加远程仓库: {result.stderr}")

    # 推送
    result = subprocess.run(
        ["git", "push", "-u", "origin", BRANCH],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[错误] 推送失败: {result.stderr}")
        print("注意：GitHub 已禁用密码认证，请确保使用有效的 Personal Access Token (classic)")
        return False
    print("[成功] 代码已推送到 GitHub")
    return True


def render_api(method, path, data=None):
    """调用 Render API"""
    token = get_env("RENDER_API_KEY")
    url = f"https://api.render.com/v1{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def deploy_to_render():
    print("[4/6] 检查 Render 部署...")
    repo_url = f"https://github.com/{GITHUB_USERNAME}/{REPO_NAME}"

    # 查找是否已有同名服务
    status, services = render_api("GET", "/services?limit=20&type=web_service")
    if status == 200:
        for svc in services:
            if svc.get("service", {}).get("name") == REPO_NAME:
                service_id = svc["service"]["id"]
                print(f"[成功] 找到已有服务，正在触发重新部署...")
                # 触发部署
                deploy_status, deploy_resp = render_api(
                    "POST", f"/services/{service_id}/deploys",
                    {"clearCache": "do_not_clear"}
                )
                if deploy_status in (200, 201):
                    print(f"[成功] 部署已触发")
                    return service_id
                print(f"[错误] 触发部署失败: {deploy_resp}")
                return None

    print("[5/6] 创建新的 Render Web Service...")
    status, resp = render_api("POST", "/services", {
        "type": "web_service",
        "name": REPO_NAME,
        "ownerId": None,  # 使用默认 owner
        "repo": repo_url,
        "branch": BRANCH,
        "buildFilter": None,
        "envVars": [
            {"key": "NODE_ENV", "value": "production"}
        ],
        "serviceDetails": {
            "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && npm install",
            "startCommand": "cd backend && node server.js",
            "publishPath": None,
            "pullRequestPreviewsEnabled": "no",
            "runtime": "node"
        }
    })

    if status not in (200, 201, 202):
        print(f"[错误] 创建服务失败: {resp}")
        return None

    service_id = resp.get("service", {}).get("id")
    print(f"[成功] 服务已创建，ID: {service_id}")
    return service_id


def get_service_url(service_id):
    print("[6/6] 获取公网地址...")
    if not service_id:
        return None

    # 等待服务创建完成并获取 URL
    import time
    for i in range(10):
        status, resp = render_api("GET", f"/services/{service_id}")
        if status == 200:
            url = resp.get("service", {}).get("url")
            if url:
                print(f"[成功] 公网地址: {url}")
                return url
        time.sleep(3)

    print("[提示] 服务正在启动中，请稍后到 Render Dashboard 查看地址")
    return None


def main():
    print("=" * 50)
    print("  群像·星火 - 自动部署脚本")
    print("=" * 50)
    print()

    # 验证 token
    if not verify_github_token():
        sys.exit(1)

    if not create_github_repo():
        sys.exit(1)

    if not push_to_github():
        sys.exit(1)

    service_id = deploy_to_render()
    url = get_service_url(service_id)

    print()
    print("=" * 50)
    if url:
        print(f"  部署成功！")
        print(f"  公网地址: {url}")
        print(f"  对戏入口: {url}/live")
    else:
        print("  部署已提交，正在云端构建中...")
        print("  请前往 https://dashboard.render.com 查看进度")
    print("=" * 50)


if __name__ == "__main__":
    main()
