# 在线备忘录 (Online Memo)

Web 程序设计实践课程项目 —— 基于 PHP + MySQL 的轻量级在线备忘录应用。

## 功能特性

- 用户注册与登录（bcrypt 密码加密、Session 会话管理）
- 备忘录增删改查（CRUD）
- 富文本编辑（加粗、斜体、下划线、删除线、标题、列表、表格）
- 图片附件上传（JPG/PNG/GIF/WebP，最大 5MB）
- 分类标签管理（手动添加/删除，侧边栏筛选）
- 全文搜索（实时过滤标题和内容）
- 暗色模式切换（localStorage 记忆偏好）
- 备忘录置顶（置顶项排最前）
- 截止日期提醒（过期红色标记）
- 回收站（软删除 + 恢复 + 永久删除）
- 键盘快捷键（Ctrl+N 新建、Ctrl+S 保存、Ctrl+F 搜索）
- 响应式设计（手机/平板/桌面三端适配）
- 安全防护（SQL 注入、XSS、CSRF、会话固定）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5、CSS3（Grid + Flexbox + CSS Variables）、原生 JavaScript（IIFE + Fetch API） |
| 后端 | PHP 7.4+（原生，PDO 预处理） |
| 数据库 | MySQL / MariaDB（InnoDB、utf8mb4） |
| 服务器 | Apache（XAMPP） |

## 本地运行步骤

### 1. 安装 XAMPP

下载并安装 [XAMPP](https://www.apachefriends.org/)，包含 Apache + MySQL + PHP。

### 2. 部署项目

将整个项目文件夹复制到 XAMPP 的网站根目录：

- 默认路径：`C:\xampp\htdocs\web\`

### 3. 导入数据库

方式一：命令行
```bash
mysql -u root -p < sql/schema.sql
```

方式二：phpMyAdmin
1. 打开 http://localhost/phpmyadmin/
2. 点击「新建」，数据库名填 `online_memo`，字符集选 `utf8mb4_unicode_ci`，点「创建」
3. 点击顶部「导入」，选择 `sql/schema.sql`，点「执行」

### 4. 配置数据库连接

编辑 `config/database.php`：

```php
$host = '127.0.0.1';   // 数据库地址
$port = '3306';         // 端口，默认 3306
$dbname = 'online_memo';
$username = 'root';     // 数据库用户名
$password = '';         // 数据库密码
```

### 5. 启动服务

在 XAMPP Control Panel 中启动 Apache 和 MySQL，浏览器访问：

```
http://localhost/web/
```

### 6. 开始使用

1. 打开页面 → 自动跳转到登录页
2. 点击「注册」创建新账号
3. 登录后左侧点击「+ 新建备忘录」或 Ctrl+N 创建
4. 点击左侧列表项编辑，Ctrl+S 保存

## 项目结构

```
web/
├── index.php              # 主页面（双栏布局：侧边栏 + 编辑器）
├── login.php              # 登录页
├── register.php           # 注册页
├── logout.php             # 退出登录
├── config/
│   └── database.php       # PDO 数据库连接（SQLite/MySQL 自动适配）
├── includes/
│   ├── session.php        # Session 管理 + CSRF Token
│   ├── auth.php           # 认证函数
│   ├── header.php         # 公共 HTML 头部
│   └── footer.php         # 公共 HTML 尾部
├── api/
│   ├── memos.php          # 备忘录 CRUD API（9 个 action）
│   └── upload.php         # 图片上传接口
├── css/
│   └── style.css          # 完整样式（含暗色模式 CSS Variables）
├── js/
│   └── app.js             # 前端全逻辑（IIFE 封装）
├── sql/
│   └── schema.sql         # 数据库结构导出文件
├── uploads/               # 用户上传图片存储目录
└── README.md              # 本文件
```

## 数据库表结构

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK, AUTO_INCREMENT) | 用户 ID |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password | VARCHAR(255) | bcrypt 加密密码 |
| created_at | TIMESTAMP | 注册时间 |

### memos 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT (PK, AUTO_INCREMENT) | 备忘录 ID |
| user_id | INT (FK → users) | 所属用户 |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 内容（支持 HTML） |
| category | VARCHAR(30) | 分类标签 |
| is_html | TINYINT(1) | 是否 HTML 内容 |
| is_completed | TINYINT(1) | 是否完成 |
| is_pinned | TINYINT(1) | 是否置顶 |
| is_deleted | TINYINT(1) | 软删除标记 |
| deleted_at | TIMESTAMP NULL | 删除时间 |
| due_date | DATETIME NULL | 截止日期 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 最后更新时间 |
