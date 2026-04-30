# 知乎直答 API 集成说明

## 一、API 接口说明

基于知乎数据开放平台（`https://developer.zhihu.com/api/v1` 及 `https://developer.zhihu.com/v1`）封装，提供搜索、热榜、直答三类能力。

> **注意**：所有接口共用相同的鉴权方式，Access Secret 在开放平台控制台获取，注册后免费赠送 1000 次/天调用额度。

---

### 通用鉴权

请求头需携带：

```
Authorization: Bearer <your_access_secret>
X-Request-Timestamp: <秒级Unix时间戳>
Content-Type: application/json
```

---

### 1. 知乎站内搜索

```
GET https://developer.zhihu.com/api/v1/content/zhihu_search
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Query | String | ✅ | 搜索关键词 |
| Count | Int32 | ❌ | 返回数量，默认10，最大10 |

**响应字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| HasMore | Bool | 是否有更多（当前固定 false） |
| SearchHashId | String | 搜索请求标识 |
| Items | Array[Item] | 搜索结果列表 |
| EmptyReason | String | 无结果原因 |

**Item 字段：**

| 字段 | 说明 |
|------|------|
| Title | 内容标题 |
| ContentType | 内容类型（Article/Answer/Question） |
| ContentID | 内容标识 |
| ContentText | 内容摘要 |
| Url | 带 utm 溯源链接 |
| CommentCount | 评论数 |
| VoteUpCount | 赞同数 |
| AuthorName | 作者昵称 |
| AuthorAvatar | 作者头像 URL |
| AuthorityLevel | 权威等级 |

**调用示例：**

```typescript
import { zhihuSearch } from '@/lib/zhihu-dev-api';

const result = await zhihuSearch('量子计算', 10);
// result.Data.Items[0].Title → 内容标题
```

---

### 2. 全网搜索

```
GET https://developer.zhihu.com/api/v1/content/global_search
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Query | String | ✅ | 搜索关键词 |
| Count | Int32 | ❌ | 返回数量，默认10，最大20 |

**响应字段：** 与站内搜索结构相同，但支持翻页（HasMore 实际有效）。

**调用示例：**

```typescript
import { globalSearch } from '@/lib/zhihu-dev-api';

const result = await globalSearch('AI大模型训练', 20);
// result.Data.Items[0].ContentType → 'Article'
```

---

### 3. 知乎热榜

```
GET https://developer.zhihu.com/api/v1/content/hot_list
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Limit | Int32 | ❌ | 返回数量，默认30，最大30 |

**响应字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| Total | Int64 | 实际返回热榜条数 |
| Items | Array[Item] | 热榜内容列表 |

**Item 字段：**

| 字段 | 说明 |
|------|------|
| Title | 热榜标题 |
| Url | 知乎链接 |
| ThumbnailUrl | 缩略图 URL（无图为空串） |
| Summary | 内容摘要（无摘要为空串） |

**调用示例：**

```typescript
import { getHotList } from '@/lib/zhihu-dev-api';

const result = await getHotList(10);
// result.Data.Items[0].Title → 热榜标题
```

**错误码：**

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 20001 | 鉴权失败 |
| 30001 | 频率限制 |
| 90001 | 内部错误 |

---

### 4. 知乎直答（Chat Completions）

```
POST https://developer.zhihu.com/v1/chat/completions
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | String | ✅ | 模型档位 |
| messages | Array[Message] | ✅ | 对话消息列表 |
| stream | Bool | ❌ | 是否流式，默认 false |

**model 可选值：**

| 模型 | 说明 |
|------|------|
| `zhida-fast-1p5` | 快速回答，响应快但深度有限 |
| `zhida-thinking-1p5` | 深度思考，包含推理过程 |
| `zhida-agent` | 智能思考（Agent模式），综合能力最强 |

**Message 结构：**

```typescript
{ role: "user" | "assistant", content: "问题内容" }
```

**响应字段：**

| 字段 | 说明 |
|------|------|
| reasoning_content | 思考过程（仅 thinking/agent 模型有） |
| content | 最终回答内容 |

**调用示例：**

```typescript
import { zhidaChat } from '@/lib/zhihu-dev-api';

const result = await zhidaChat(
  [{ role: 'user', content: '解释量子计算' }],
  'zhida-thinking-1p5'
);
// result.choices[0].message.content → 最终回答
// result.choices[0].message.reasoning_content → 思考过程
```

---

## 二、Next.js API 路由

项目已在 App Router 中封装为标准 REST 路由，统一使用 `apiResponse()` / `apiError()` 响应格式。

### 响应格式

**成功：**

```json
{
  "success": true,
  "data": { ... }
}
```

**失败：**

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "错误信息" }
}
```

### 路由列表

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/zhihu/search` | GET | 站内搜索，参数：`query`（必填）、`count`（默认10） |
| `/api/zhihu/global-search` | GET | 全网搜索，参数：`query`（必填）、`count`（默认10） |
| `/api/zhihu/hot-list` | GET | 热榜，参数：`limit`（默认30，最大30） |
| `/api/zhihu/zhida` | POST | 知乎直答，Body：`{ messages, model }` |

---

## 三、测试页面

### 页面 1：知乎直答 `/zhihu-zhida`

聊天式问答界面，支持三种模型实时切换。

**功能：**

- 模型选择器（顶部三个按钮）：
  - 🟢 **快速回答**（`zhida-fast-1p5`）— 红色按钮，适合快速查询
  - 🟡 **深度思考**（`zhida-thinking-1p5`）— 金色按钮，显示 AI 推理过程
  - 🟣 **智能思考**（`zhida-agent`）— 紫色按钮，Agent 模式，综合能力最强
- 消息历史：用户问题右对齐（红色背景），AI 回复左对齐（深色背景）
- 思考过程：AI 回复中以 💭 前缀展示 `reasoning_content`
- 加载状态：发送后显示「思考中...」动画
- 错误处理：网络或 API 错误显示红色提示框
- 空状态：首次打开显示引导文字「向知乎直答提问，开启深度探索」

**UI 配色：**

- 背景：`bg-xh-primary`（深海军蓝 #1a1a2e）
- 快速按钮激活：`bg-xh-accent`（红色）
- 深度按钮激活：`bg-xh-gold`（金色）
- 智能按钮激活：`bg-purple-600`（紫色）
- 消息气泡：用户 `bg-xh-accent`，AI `bg-white/5`

**截图预览：**

```
┌─────────────────────────────────┐
│  ← 返回          知乎直答        │
├─────────────────────────────────┤
│  [快速回答] [深度思考] [智能思考]  │
├─────────────────────────────────┤
│                                 │
│    💭 思考过程内容...             │
│    最终回答内容...               │
│                                 │
│                    [用户问题]    │
│                                 │
├─────────────────────────────────┤
│ [输入问题...              ] [➤] │
└─────────────────────────────────┘
```

---

### 页面 2：知乎搜索与热榜 `/zhihu-search`

三标签页设计，整合站内搜索、全网搜索、热榜三大功能。

**功能：**

- **站内搜索** — 调用 `/api/zhihu/search`，适合在知乎站内内容中精确查找
- **全网搜索** — 调用 `/api/zhihu/global-search`，覆盖全网相关内容
- **热榜** — 调用 `/api/zhihu/hot-list`，展示知乎实时热点内容

**标签页切换：**

- 三个标签按钮，当前激活项：`text-xh-gold` + `border-b-2 border-xh-gold`
- 非激活项：`text-white/30`，hover 时变亮
- 切换标签自动清空结果列表

**搜索标签（站内/全网）：**

- 顶部输入框 + 搜索按钮
- 回车或点击按钮触发搜索
- 结果卡片展示：标题、摘要（2行截断）、作者、👍点赞数、💬评论数

**热榜标签：**

- 无搜索框，进入即加载
- 结果卡片展示：标题、缩略图（如有）、摘要
- 每个卡片可点击跳转原文链接

**加载与空状态：**

- 加载中：3 个骨架卡片动画占位
- 空结果：「暂无结果」居中提示
- 错误：红色提示框显示错误信息

**截图预览：**

```
┌─────────────────────────────────┐
│  ← 返回          知乎搜索        │
├─────────────────────────────────┤
│  [站内搜索] [全网搜索] [🔥 热榜]  │
├─────────────────────────────────┤
│  [搜索知乎内容...    ] [搜索]    │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐  │
│ │ 文章标题                    │  │
│ │ 摘要内容（最多显示2行）...    │  │
│ │ 作者名  👍 120  💬 45       │  │
│ └─────────────────────────────┘  │
│ ┌─────────────────────────────┐  │
│ │ 热榜第2条                    │  │
│ │ [缩略图]                     │  │
│ │ 摘要内容...                  │  │
│ └─────────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 四、环境变量配置

确保 `.env.local` 中配置了正确的 Key：

```bash
# 知乎开发者平台 Access Secret（直答、搜索、热榜共用）
ZHIHU_API_KEY=your_access_secret_here
```

> 获取方式：登录知乎开放平台控制台 → 访问凭证 → 获取 Access Secret

---

## 五、测试

```bash
# 运行新增页面测试
npm test -- src/test/pages/

# 运行全部测试
npm test

# 类型检查
npm run type-check

# 代码规范检查
npm run lint
```
