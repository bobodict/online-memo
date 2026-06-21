# 📝 在线备忘录 (Online Memo)

Web 程序设计实践课程项目 —— 基于 PHP + MySQL 的轻量级在线备忘录应用。

## 功能特性

- 🔐 用户注册与登录（bcrypt 密码加密、Session 会话管理）
- 📝 备忘录增删改查（CRUD）
- ✅ 一键标记完成 / 恢复未完成
- ✏️ 行内编辑（无需跳转，页内直接修改）
- 🎨 响应式设计（手机 / 平板 / 桌面三端适配）
- 🛡️ 安全防护（SQL 注入、XSS、CSRF、会话固定）
- ✅ 前后端双重表单校验
- 💾 本地运行，部署到 WAMP/XWAMP 即可使用

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5（语义化标签）、CSS3（Grid + Flexbox + 媒体查询）、原生 JavaScript（IIFE + Fetch API） |
| 后端 | PHP 7.4+（原生，PDO 预处理） |
| 数据库 | MySQL / MariaDB（InnoDB、utf8mb4） |
| 服务器 | Apache（WAMP / XWAMP） |

## 项目结构

```
web/
├── index.php              # 主页面（备忘录仪表盘，需登录）
├── login.php              # 登录页
├── register.php           # 注册页
├── logout.php             # 退出登录
├── config/
│   └── database.php       # PDO 数据库连接配置
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
│   └── schema.sql         # 数据库初始化脚本
└── README.md              # 本文件
```

## 本地运行步骤

### 1. 环境准备

安装 XAMPP（Apache + MySQL + PHP 集成环境）。

- [XAMPP](https://www.apachefriends.org/) (Windows / macOS / Linux)

### 2. 部署项目

将整个 `web` 文件夹复制到 XAMPP 的网站根目录：

- **XAMPP**: `C:\xampp\htdocs\web\`

### 3. 配置数据库连接

编辑 `config/database.php`，确保连接信息正确：

```php
$host = '127.0.0.1';
$port = '3306';   // 默认 MySQL 端口，根据实际情况修改
$dbname = 'online_memo';
$username = 'root';
$password = '';
```

### 4. 导入数据库

方式一：命令行
```bash
mysql -u root -p < sql/schema.sql
```

方式二：phpMyAdmin
1. 打开 http://localhost/phpmyadmin/
2. 点击「导入」→ 选择 `sql/schema.sql` → 执行

### 5. 启动服务

启动 XAMPP 的 Apache 和 MySQL，访问：

```
http://localhost/web/
```

### 6. 开始使用

1. 打开页面 → 自动跳转到登录页
2. 点击「注册」创建账号
3. 登录后即可创建、编辑、删除、标记完成备忘录

## 数据库表结构

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 用户 ID |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password | VARCHAR(255) | bcrypt 加密密码 |
| created_at | TIMESTAMP | 注册时间 |

### memos 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK) | 备忘录 ID |
| user_id | INT (FK → users) | 所属用户 |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 内容 |
| is_completed | TINYINT(1) | 是否完成（0/1） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 最后更新时间 |
