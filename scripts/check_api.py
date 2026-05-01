#!/usr/bin/env python3
import urllib.request
import json

BASE = 'http://81.70.59.228'

def get(path, params=None):
    url = BASE + path
    if params:
        url += '?' + '&'.join(f'{k}={v}' for k, v in params.items())
    req = urllib.request.Request(url)
    req.add_header('Accept', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()) if e.read() else {}
    except Exception as e:
        return -1, str(e)

# 1. 泡泡API
print('=== GET /api/brainholes?mode=bubble&limit=3 ===')
code, data = get('/api/brainholes', {'mode': 'bubble', 'limit': '3'})
print(f'  Status: {code}')
if data.get('success'):
    bh = data.get('data', {}).get('brainholes', [])
    print(f'  Bubbles: {len(bh)}')
    for b in bh:
        print(f'    {b.get("id", "?")[:8]}... {b.get("title", "?")[:20]}')
else:
    print(f'  Error: {data}')

# 2. 匹配API（未登录）
print('\n=== POST /api/match (no auth) ===')
try:
    req = urllib.request.Request(f'{BASE}/api/match', method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    body = json.dumps({
        'brainholeId': 'cl123456789012345678901234',
        'identity': '测试身份',
        'preferDifferent': True,
        'timeoutMinutes': 1,
        'mode': 'duo'
    }).encode()
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        print(f'  Status: {resp.status}')
        print(f'  Body: {json.loads(resp.read().decode())}')
except urllib.error.HTTPError as e:
    print(f'  Status: {e.code}')
    print(f'  Body: {json.loads(e.read().decode()) if e.read() else "empty"}')
except Exception as e:
    print(f'  Error: {e}')

# 3. AI房间API（未登录）
print('\n=== POST /api/rooms/ai (no auth) ===')
try:
    req = urllib.request.Request(f'{BASE}/api/rooms/ai', method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    body = json.dumps({
        'brainholeId': 'cl123456789012345678901234',
        'identity': '测试身份'
    }).encode()
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        print(f'  Status: {resp.status}')
        print(f'  Body: {json.loads(resp.read().decode())}')
except urllib.error.HTTPError as e:
    print(f'  Status: {e.code}')
    print(f'  Body: {json.loads(e.read().decode()) if e.read() else "empty"}')
except Exception as e:
    print(f'  Error: {e}')

# 4. 检查一个brainhole的ID格式
print('\n=== Brainhole IDs format ===')
code, data = get('/api/brainholes', {'mode': 'bubble', 'limit': '2'})
if data.get('success'):
    for b in data.get('data', {}).get('brainholes', []):
        print(f'  ID: {b.get("id", "?")} (len={len(b.get("id", ""))})')
