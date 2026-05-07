#!/bin/bash
# =============================================================================
# 登录页消失问题 — 部署后三项检查脚本
# v8.0-roadmap: 每次部署后必须执行
# =============================================================================

SERVER_URL="${1:-http://localhost}"
PASS=0
FAIL=0

pass() {
  echo "✅ $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "❌ $1"
  FAIL=$((FAIL + 1))
}

echo "====== 登录页消失问题专项检查 ======"
echo "检查目标: $SERVER_URL"
echo ""

# ---- 检查一：HTML源码验证 ----
echo "【检查一】HTML源码验证..."
LOGIN_HTML=$(curl -s "$SERVER_URL/login" | head -c 3000)

# 1a. 包含表单标签
if echo "$LOGIN_HTML" | grep -q "<form"; then
  pass "包含 <form> 标签"
else
  fail "未找到 <form> 标签"
fi

# 1b. 包含输入框
if echo "$LOGIN_HTML" | grep -q '<input.*type="text"'; then
  pass "包含用户名输入框"
else
  fail "未找到用户名输入框"
fi

# 1c. 不包含透明度隐藏属性
if echo "$LOGIN_HTML" | grep -oi 'opacity.*0\|opacity: *0' | head -1 | grep -q 'opacity'; then
  fail "发现 opacity:0 隐藏属性"
else
  pass "未发现 opacity:0 隐藏属性"
fi

# 1d. 不包含无限加载状态
if echo "$LOGIN_HTML" | grep -oi 'animate-spin' | head -1 | grep -q 'spin'; then
  warn="发现 animate-spin 加载动画（仅在 fallback 中可接受）"
  echo "⚠️ $warn"
else
  pass "未发现无限加载动画"
fi

# ---- 检查二：页面可见性验证 ----
echo ""
echo "【检查二】页面可见性验证..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/login")
if [ "$LOGIN_STATUS" = "200" ]; then
  pass "登录页返回 200"
else
  fail "登录页返回 $LOGIN_STATUS"
fi

# ---- 检查三：控制台错误检查（模拟）----
echo ""
echo "【检查三】服务端错误检查..."
# 检查响应体中是否包含已知错误关键词
if echo "$LOGIN_HTML" | grep -qi "error\|exception\|failed"; then
  fail "响应体包含错误关键词"
else
  pass "响应体无错误关键词"
fi

# ---- 检查四：登录守卫验证 ----
echo ""
echo "【检查四】登录守卫验证..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --cookie "" "$SERVER_URL/home")
if [ "$HOME_STATUS" = "307" ] || [ "$HOME_STATUS" = "302" ]; then
  pass "未登录访问 /home 被重定向 ($HOME_STATUS)"
else
  fail "未登录访问 /home 未被重定向 ($HOME_STATUS)"
fi

echo ""
echo "====== 检查结果 ======"
echo "通过: $PASS"
echo "失败: $FAIL"

if [ $FAIL -gt 0 ]; then
  echo "⚠️  发现 $FAIL 项未通过，请检查！"
  exit 1
else
  echo "✅ 所有检查通过"
  exit 0
fi
