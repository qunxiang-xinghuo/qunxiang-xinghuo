# 多产品统一登录架构设计

## 概述
设计一个支持多产品的统一登录系统（SSO - Single Sign-On），让用户只需登录一次即可访问所有产品。

## 架构设计

### 1. OAuth2.0 + OIDC 协议
- 使用 OAuth2.0 授权框架
- 基于 OIDC (OpenID Connect) 实现身份认证
- 支持 Authorization Code Flow

### 2. 核心组件

#### 认证中心 (Auth Center)
- 独立部署的认证服务
- 统一管理用户账号
- 颁发 JWT Token
- 处理登录/注册/登出

#### 产品客户端 (Product Clients)
- 群像·星火 (当前产品)
- 未来产品 A
- 未来产品 B
- 每个产品作为 OAuth2 Client

#### Token 管理
- Access Token: 短期有效（15 分钟）
- Refresh Token: 长期有效（7 天）
- Token 存储：HttpOnly Cookie

### 3. 数据模型

```prisma
// 统一用户表
model UnifiedUser {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // 关联产品账号
  productAccounts ProductAccount[]
}

// 产品账号关联表
model ProductAccount {
  id            String    @id @default(cuid())
  userId        String
  productId     String    // 产品标识：xinghuo, product-a, product-b
  productUserId String    // 产品内的用户 ID
  permissions   Json      // 产品特定权限
  
  user          UnifiedUser @relation(fields: [userId], references: [id])
  
  @@unique([productId, productUserId])
}

// OAuth2 客户端表
model OAuthClient {
  id            String    @id @default(cuid())
  clientId      String    @unique
  clientSecret  String
  productName   String
  redirectUris  String[]  // 允许的回调 URL
  createdAt     DateTime  @default(now())
}

// Token 表
model Token {
  id            String    @id @default(cuid())
  accessToken   String    @unique
  refreshToken  String    @unique
  userId        String
  clientId      String
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  
  @@index([accessToken])
  @@index([refreshToken])
}
```

### 4. 登录流程

```
1. 用户访问产品 A → 未登录
2. 产品 A 重定向到认证中心
3. 用户在认证中心登录
4. 认证中心颁发 Authorization Code
5. 产品 A 用 Code 换取 Token
6. 产品 A 创建本地会话
7. 用户访问产品 B → 已登录（共享 Cookie）
```

### 5. 实现步骤

#### 阶段 1：准备（当前）
- [x] 单产品登录系统
- [ ] 抽象认证逻辑
- [ ] 设计统一用户模型

#### 阶段 2：认证中心（未来）
- [ ] 独立部署认证服务
- [ ] 实现 OAuth2.0 协议
- [ ] 支持多客户端注册

#### 阶段 3：产品接入（未来）
- [ ] 群像·星火接入
- [ ] 新产品接入
- [ ] Token 共享机制

### 6. 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 认证协议 | OAuth2.0 + OIDC | 行业标准 |
| Token 格式 | JWT | 无状态，可扩展 |
| 存储 | Redis | Token 缓存，快速验证 |
| 数据库 | PostgreSQL | 统一用户存储 |
| 部署 | Docker | 独立部署认证中心 |

### 7. 安全考虑

- HTTPS 强制
- Token 加密存储
- 定期轮换 Client Secret
- 支持 MFA（多因素认证）
- 异常登录检测
- 设备管理

### 8. 迁移策略

1. 保持现有登录系统运行
2. 逐步迁移用户到统一账号
3. 双系统并行运行
4. 完全切换后下线旧系统

---

## 当前状态
**阶段 1 - 准备中**

当前只有群像·星火一个产品，暂不需要实现多产品登录。
此文档为远期架构设计，待产品规模化后再实施。
