#!/usr/bin/env python3
"""Test match API to find the error"""
import urllib.request
import json

BASE = 'http://81.70.59.228'

# Test 1: POST /api/match without auth
print('=== Test 1: POST /api/match (no auth) ===')
try:
    req = urllib.request.Request(f'{BASE}/api/match', method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    body = json.dumps({
        'identity': '测试身份',
        'preferDifferent': True,
        'timeoutMinutes': 1,
        'mode': 'quick',
    }).encode()
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        print(f'Status: {resp.status}')
        print(f'Body: {json.loads(resp.read().decode())}')
except urllib.error.HTTPError as e:
    print(f'Status: {e.code}')
    try:
        print(f'Body: {json.loads(e.read().decode())}')
    except:
        print(f'Body: {e.read().decode()}')
except Exception as e:
    print(f'Error: {e}')

# Test 2: POST /api/match with invalid mode
print('\n=== Test 2: POST /api/match (invalid mode) ===')
try:
    req = urllib.request.Request(f'{BASE}/api/match', method='POST')
    req.add_header('Content-Type', 'application/json')
    body = json.dumps({
        'identity': '测试',
        'mode': 'invalid',
    }).encode()
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        print(f'Status: {resp.status}')
    print('Unexpected success')
except urllib.error.HTTPError as e:
    print(f'Status: {e.code}')
    try:
        print(f'Body: {json.loads(e.read().decode())}')
    except:
        print(f'Body: {e.read().decode()[:200]}')
except Exception as e:
    print(f'Error: {e}')

# Test 3: GET /api/brainholes?mode=bubble
print('\n=== Test 3: GET /api/brainholes ===')
try:
    req = urllib.request.Request(f'{BASE}/api/brainholes?mode=bubble&limit=3')
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        print(f'Status: {resp.status}, bubbles: {len(data.get("data", {}).get("brainholes", []))}')
except Exception as e:
    print(f'Error: {e}')
