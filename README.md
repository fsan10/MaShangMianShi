# 马上面试 - 面试题库系统

面试题库系统，带后端的完整题库管理平台。支持 AI 智能识别、在线 SQL 练习、学习进度追踪、巩固练习、错题本等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Ant Design 5 + ECharts |
| 后端 | Python FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 部署 | Docker Compose + Nginx |

## 功能模块

### 统计大盘
- 真题总量、收录知识点、高频考点统计
- 高频知识点 TOP 15 排行榜（排名徽章、学科标签、年份分布方块）
- 技术栈分布饼图、难度分级饼图

### 问题管理
- 面试题 / 笔试题 CRUD
- JSON 批量导入
- 按题型 / 难度 / 来源 / 关键词 / 标签筛选

### AI 智能识别
- **面试题识别**：上传文件 → AI 提取面试题 → JSON 预览 → 一键入库
- **笔试题识别**：上传文件 → AI 提取笔试题 → JSON 预览 → 一键入库
- **项目识别**：上传简历 → AI 提取项目经历 → JSON 预览 → 一键入库
- 支持 PDF / Word / Excel / TXT / Markdown 格式

### 项目关联
- 项目经历管理（名称、描述、技术栈、职责）
- 根据技术栈自动匹配相关面试 / 笔试问题
- 手动关联 / 取消关联题目

### 在线 OJ
- SQL 在线编辑器
- 实时运行验证
- 查看参考答案
- 提交记录追踪

### 学习进度
- 已做题数、正确率、连续打卡、已掌握统计
- 能力雷达图
- 365 天打卡日历
- 章节进度条

### 巩固功能
- 按学科分类的知识点卡片
- 掌握进度追踪
- 薄弱项分析

### 错题本
- 本地存储，无需登录即可使用
- 答对 / 答错记录
- 连续答对 3 次自动出本
- 收藏、移除、重新加入

### 微信登录 & 云端同步
- 微信公众号扫码登录
- 登录后可云端同步本地数据
- 所有功能无需登录即可使用

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 1. 启动数据库

```bash
docker-compose up postgres redis -d
```

### 2. 后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接、微信配置、AI 配置等

# 数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

### 3. 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 访问

- 前端页面：http://localhost:5173
- 后端 API 文档：http://localhost:8000/api/docs

### Docker 一键部署

```bash
docker-compose up --build
```

## 项目结构

```
MaShangMianShi/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/          # 数据库迁移脚本
│   └── app/
│       ├── main.py            # FastAPI 入口
│       ├── core/
│       │   ├── config.py      # 配置管理
│       │   ├── database.py    # 数据库连接
│       │   └── security.py    # JWT 认证
│       ├── models/
│       │   └── models.py      # 17 张数据表模型
│       ├── schemas/           # Pydantic 请求/响应模型
│       └── routers/           # API 路由
│           ├── auth.py        # 微信登录
│           ├── questions.py   # 问题管理 + 搜索筛选
│           ├── ai.py          # AI 智能识别
│           ├── projects.py    # 项目关联
│           ├── stats.py       # 统计大盘
│           ├── oj.py          # 在线 OJ
│           ├── progress.py    # 学习进度
│           ├── review.py      # 巩固功能
│           ├── mistakes.py    # 错题本
│           ├── wechat.py      # 微信回调
│           └── sync.py        # 云端同步
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx            # 路由配置
        ├── main.tsx
        ├── api/               # API 客户端
        ├── contexts/          # Auth 上下文
        ├── utils/             # 本地存储工具
        ├── styles/            # 全局主题
        ├── layouts/           # 侧边栏布局
        └── pages/             # 页面组件
            ├── Dashboard/     # 统计大盘
            ├── Questions/     # 问题管理
            ├── AIRecognize/   # AI 识别
            ├── Projects/      # 项目关联
            ├── OJ/            # 在线 OJ
            ├── Progress/      # 学习进度
            ├── Review/        # 巩固功能
            ├── Mistakes/      # 错题本
            └── Login/         # 微信扫码登录
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 异步连接 | `postgresql+asyncpg://postgres:postgres@localhost:5432/mashangmianshi` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT 密钥 | 需修改 |
| `WECHAT_APP_ID` | 微信公众号 AppID | - |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | - |
| `AI_API_URL` | AI API 地址 | - |
| `AI_API_KEY` | AI API Key | - |
| `AI_MODEL_NAME` | AI 模型名称 | - |
| `CORS_ORIGINS` | 允许的前端域名 | `["http://localhost:3000","http://localhost:5173"]` |

## License

MIT
