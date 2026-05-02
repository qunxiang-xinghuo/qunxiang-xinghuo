# 问题记录与修复日志

## v5.6 UI重设计部署 (2026-05-02)

### 修改内容
- **全局样式**: 页面收窄（桌面端max-width:430px居中）+ 新设计Token + 泡泡CSS升级
- **泡泡美化**: 蜂窝式布局、更大更饱满(32-56px)、丰富分类色、更强玻璃质感
- **首页**: 大气标题区+Flame图标、更大泡泡区(320px)、模式卡片左侧色带装饰
- **故事大厅广场**: 卡片顶部色带、核心冲突预览、更大进度条、时间戳
- **故事详情**: 金色顶部装饰条、导演皇冠标识、角色首字母头像、更清晰信息层次
- **个人中心**: 大幅渐变背景、24px头像+金色边框、独立统计卡片、彩色图标菜单

### 部署过程
1. ✅ 本地build通过 (47/47)
2. ✅ git commit & push (dev -> dev)
3. ⚠️ GitHub fetch超时，启用SFTP上传备选
4. ✅ 文件上传成功
5. ✅ 服务器build通过 (47/47)
6. ✅ PM2重启成功
7. ✅ 静态资源验证200 OK (JS+CSS+首页)

### 经验教训
- **SFTP上传后必须确认文件已更新**: 首次build失败因为服务器上文件仍是旧版本，原因是upload_files.py上传了文件但build时可能git pull覆盖了。解决：直接用SFTP覆盖后build。
- **Turbopack静态文件名是随机hash**: `main-app.js`不存在是正常的，实际文件名如`03~yq9q893hmn.js`。验证时应查找任意存在的JS文件。
- **服务器node/npm已全局安装**: 无需nvm，直接用`/usr/bin/node`和`/usr/bin/npm`即可。

---

## v5.5-fix 页面空白复发 (2026-04-29)

### 根因
`server.ts`中`path.join(cwd, '.next', req.url)`导致`.next/_next/static/`错误路径。

### 修复
改为`req.url.replace('/_next/', '')`，去掉多余`_next`层级。

---

## v5.5 UI重设计 (2026-04-29)

### 根因
统一slate色彩体系，全面更新TopBar/BottomNav/home/story-hall/duo-match/library/profile。

### 验证
Build 47/47通过，部署成功。

---

## v5.4 故事大厅MVP (2026-04-29)

### 根因
新增Prisma字段(minActors/claimStatus等)，新增审核和启动API。

### 验证
Build+Git+Deploy通过。
