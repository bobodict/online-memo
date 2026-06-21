# 📝 在线备忘录 (Online Memo)

Web 程序设计实践课程项目 —— 基于 PHP + MySQL 的轻量级在线备忘录应用。

| 项目信息 | |
|---------|----|
| 作者 | 林城俊 |
| 学号 | 102301329 |
| 选题 | 在线备忘录 |
| 技术方案 | PHP 后端进阶版（HTML + CSS + JS + PHP + SQLite） |
| 提交文件名 | `102301329_林城俊_在线备忘录.zip` |

## 功能特性

- 🔐 用户注册与登录（bcrypt 密码加密、Session 会话管理）
- 📝 备忘录增删改查（CRUD）
- ✅ 一键标记完成 / 恢复未完成
- ✏️ 行内编辑（无需跳转，页内直接修改）
- 🎨 响应式设计（手机 / 平板 / 桌面三端适配）
- 🛡️ 安全防护（SQL 注入、XSS、CSRF、会话固定）
- ✅ 前后端双重表单校验
- 💾 SQLite 数据库，零配置，复制即用

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5（语义化标签）、CSS3（Grid + Flexbox + 媒体查询）、原生 JavaScript（IIFE + Fetch API） |
| 后端 | PHP 7.4+（原生，无框架） |
| 数据库 | SQLite 3（通过 PDO，数据库文件自动创建） |
| 服务器 | Apache（WAMP / XWAMP） |

## 项目结构

```
web/
├── index.php              # 主页面（备忘录仪表盘，需登录）
├── login.php              # 登录页
├── register.php           # 注册页
├── logout.php             # 退出登录
├── config/
│   └── database.php       # PDO 数据库连接 & 自动建表
├── data/
│   └── memo.db            # SQLite 数据库文件（自动生成）
├── includes/
│   ├── session.php        # 会话管理 & CSRF Token
│   ├── auth.php           # 认证函数（注册/登录/权限检查）
│   ├── header.php         # 公共 HTML 头部 & 导航栏
│   └── footer.php         # 公共 HTML 尾部
├── api/
│   └── memos.php          # 备忘录 CRUD API（返回 JSON）
├── css/
│   └── style.css          # 响应式样式表
├── js/
│   └── app.js             # 前端交互逻辑
├── sql/
│   └── schema.sql         # 数据库结构参考（表由 PHP 自动创建）
└── README.md              # 本文件
```

## 本地运行步骤

### 1. 安装 XAMPP

下载并安装 [XAMPP](https://www.apachefriends.org/)（需要 Apache + PHP 组件）。

### 2. 部署项目

将整个 `web` 文件夹复制到 XAMPP 的网站根目录：
- 默认路径：`C:\xampp\htdocs\web\`（如装在 D 盘则为 `D:\xampp\htdocs\web\`）

### 3. 启动 Apache

在 XAMPP Control Panel 中点击 Apache 的 **Start** 按钮。

> 💡 **无需启动 MySQL** —— 本项目使用 SQLite，数据库文件会自动创建在 `data/memo.db`。

### 4. 访问

浏览器打开：**http://localhost/web/**

→ 自动跳转登录页 → 点击「注册」创建账号 → 开始使用！

## 数据库表结构

数据库文件 `data/memo.db` 由 PHP 在首次访问时自动创建，无需手动导入。

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 用户 ID |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| password | TEXT | bcrypt 加密密码 |
| created_at | DATETIME | 注册时间 |

### memos 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 备忘录 ID |
| user_id | INTEGER (FK → users) | 所属用户 |
| title | TEXT | 标题 |
| content | TEXT | 内容 |
| is_completed | INTEGER | 是否完成（0/1） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 最后更新时间 |

---

> 📧 项目提交邮箱：jiechen202@fzu.edu.cn  
> 📅 截止日期：2026.6.25
