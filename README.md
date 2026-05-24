# 马上面试 - 面试题库系统（MVP）

面试题库管理平台，支持 AI 智能导入、艾宾浩斯遗忘曲线学习巩固、微信扫码登录。后台管理独立部署，与用户端完全分离。

## 技术栈

| 层级 | 技术 |
|------|------|
| 用户端 | React 18 + TypeScript + Ant Design 5 + ECharts |
| 管理端 | React 18 + TypeScript + Ant Design 5（独立部署） |
| 后端 | Python FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 部署 | Docker Compose + Nginx |

## 功能模块

### 用户端（frontend）

**题目列表**
- 面试题 / 笔试题双 Tab 切换
- 按关键词、公司、难度筛选
- 卡片式布局，左侧色条标识难度，hover 动效

**统计大盘**
- 真题总量、收录知识点、高频考点统计卡片（大数字 + 标题 + 副标题 + 左侧色条）
- 面试高频知识点排行榜
- 技术栈分布饼图、难度分级饼图

**学习巩固**
- 艾宾浩斯遗忘曲线：1天 → 3天 → 7天 → 15天间隔复习
- 5 次全部通过 = 已掌握，答错重置回第 1 阶段
- 已学习 / 已掌握 / 今日待复习 / 连续打卡统计
- 365 天打卡日历

**登录**
- 弹窗模式（微信扫码 + 验证码）
- 未登录可浏览题目，登录后同步学习进度

### 管理端（admin）

- 独立部署，端口 5174，与用户端完全分离
- 管理员账号密码登录
- **题目管理**：CRUD + 搜索筛选 + 前端序号
- **新增/编辑**：弹窗模式，表单分基本信息 / 答案信息 / 考察公司三区
- **AI 批量导入**：弹窗模式，3 步向导（上传 → AI 识别 → 确认入库）
- 考察次数 = 公司出现数（QuestionCompany 关联表）

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+（或使用 Docker）
- Redis 7+（或使用 Docker）

### 一键启动

```bash
# 1. 安装根目录依赖（仅需一次）
npm install

# 2. 启动数据库
npm run db:up

# 3. 安装前后端依赖
npm run setup

# 4. 一键启动 🚀
npm run dev
```

启动后控制台同时显示三个服务日志：

| 标签 | 颜色 | 服务 | 地址 |
|------|------|------|------|
| `[backend]` | 蓝色 | FastAPI 后端 | http://localhost:8000 |
| `[frontend]` | 绿色 | 用户端前端 | http://localhost:5173 |
| `[admin]` | 品红色 | 管理端前端 | http://localhost:5174 |

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动后端 + 用户端 + 管理端 |
| `npm run dev:backend` | 只启动后端 |
| `npm run dev:frontend` | 只启动用户端 |
| `npm run dev:admin` | 只启动管理端 |
| `npm run db:up` | 启动 Docker 数据库 |
| `npm run db:down` | 停止 Docker 数据库 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run setup` | 一键安装所有依赖 |
| `npm run build` | 构建前端生产版本 |

### 分步启动

<details>
<summary>点击展开</summary>

**1. 启动数据库**

```bash
docker-compose up postgres redis -d
```

**2. 后端**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入数据库连接、微信配置、AI 配置等
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**3. 用户端**

```bash
cd frontend
npm install
npm run dev
```

**4. 管理端**

```bash
cd admin
npm install
npm run dev
```

</details>

### 默认管理员账号

- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
MaShangMianShi/
├── package.json                  # 根目录 npm 配置（一键启动）
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   └── app/
│       ├── main.py               # FastAPI 入口
│       ├── core/
│       │   ├── config.py         # 配置管理（pydantic-settings）
│       │   ├── database.py       # 异步数据库连接
│       │   └── security.py       # JWT 认证
│       ├── models/
│       │   └── models.py         # 11 张数据表
│       ├── schemas/              # Pydantic 请求/响应模型
│       │   ├── admin.py
│       │   ├── question.py
│       │   ├── stats.py
│       │   └── study.py
│       └── routers/              # API 路由
│           ├── admin.py          # 管理员登录 + 题目 CRUD
│           ├── ai.py             # AI 智能识别
│           ├── auth.py           # 微信扫码登录
│           ├── questions.py      # 题目列表 + 详情
│           ├── stats.py          # 统计大盘
│           ├── study.py          # 学习巩固（艾宾浩斯）
│           └── wechat.py         # 微信回调
├── frontend/                     # 用户端（端口 5173）
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx               # 路由配置
│       ├── api/                  # API 客户端（token 认证）
│       ├── contexts/             # AuthContext
│       ├── layouts/              # AppLayout（侧边栏 + 登录弹窗）
│       └── pages/
│           ├── Home/             # 题目列表（卡片式）
│           ├── Dashboard/        # 统计大盘
│           ├── Study/            # 学习巩固
│           ├── QuestionDetail/   # 题目详情
│           └── Login/            # 登录弹窗
└── admin/                        # 管理端（端口 5174）
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx               # 路由配置
        ├── api/                  # API 客户端（admin_token 认证）
        ├── layouts/              # AdminLayout（独立侧边栏）
        └── pages/
            ├── Login.tsx         # 管理员登录页
            └── Questions.tsx     # 题目管理（含弹窗：新增/编辑/AI导入）
```

## 数据库模型

| 表名 | 说明 |
|------|------|
| `users` | 用户表（微信登录） |
| `admins` | 管理员表 |
| `login_codes` | 登录验证码 |
| `categories` | 分类 |
| `knowledge_points` | 知识点 |
| `questions` | 题目（面试/笔试） |
| `knowledge_point_questions` | 知识点-题目关联 |
| `question_companies` | 题目-公司关联（考察次数 = 公司数） |
| `company_knowledge_stats` | 公司知识点统计 |
| `study_records` | 学习记录（艾宾浩斯阶段） |
| `checkins` | 打卡记录 |
| `import_logs` | 导入日志 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 异步连接 | `postgresql+asyncpg://postgres:postgres@localhost:5432/mashangmianshi` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT 密钥 | 需修改 |
| `DEBUG` | 调试模式 | `False` |
| `WECHAT_APP_ID` | 微信公众号 AppID | - |
| `WECHAT_APP_SECRET` | 微信公众号 AppSecret | - |
| `AI_API_URL` | AI API 地址 | - |
| `AI_API_KEY` | AI API Key | - |
| `AI_MODEL_NAME` | AI 模型名称 | - |
| `CORS_ORIGINS` | 允许的前端域名 | `["http://localhost:5173","http://localhost:5174"]` |

## License

MIT
