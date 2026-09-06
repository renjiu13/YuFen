# 人久 - YuFen 主题

「人久」是神仙阿旺的个人官网，取人之长久之意。基于 Hugo 与自研的 YuFen 主题构建，使用 Tailwind CSS、Font Awesome，并集成 Giscus 评论系统。这里记录技术实践与生活感悟，涉猎 Cloudflare、自建服务、内网穿透、备份方案，以及节气随笔、读书笔记等。

> 站点座右铭：我为人人，人人为我~

## 特性

- 🎨 极简风格设计，留白克制
- 📱 响应式布局，移动端友好
- 🌙 深色模式，跟随系统配色
- 💬 Giscus 评论系统（基于 GitHub Discussions）
- 🏷️ 分类与标签聚合
- 📡 RSS 订阅
- 💻 代码高亮（GitHub 风格）与一键复制
- 🔍 SEO 友好，加载迅速
- 🏠 NAS 自建部署（Docker + Nginx），推送到 GitHub 后自动构建上线
- 🌐 Cloudflare Tunnel 内网穿透，无需公网 IP、无需开放端口

## 快速开始

### 1. 安装 Hugo

需安装 Hugo extended 版本（版本 ≥ 0.120.0）：

```bash
# Windows (使用 Chocolatey)
choco install hugo-extended

# macOS (使用 Homebrew)
brew install hugo

# Ubuntu/Debian
sudo apt install hugo
```

### 2. 启动开发服务器

```bash
hugo server -D
```

访问 http://localhost:1313 查看博客。

### 3. 构建静态文件

```bash
hugo
```

生成的文件位于 `public/` 目录。

## 项目结构

```
.
├── content/
│   ├── about.md                # 关于页
│   └── posts/                  # 博客文章（技术 + 随笔）
│       └── 部署Hugo博客方案.md  # NAS 自动部署完整方案文档
├── static/
│   └── images/                 # 头像与文章配图
├── themes/
│   └── YuFen/                  # 主题文件
│       ├── layouts/            # 页面模板
│       └── static/             # 主题静态资源（css/js）
├── config.toml                 # 站点与主题配置
├── CONFIGURATION.md            # 配置项说明
├── wrangler.jsonc              # 【备选】Cloudflare Pages 部署配置（主流程已迁移 NAS）
└── README.md
```

## 写作

### 创建新文章

```bash
hugo new posts/文章标题.md
```

### 文章 Front Matter 示例

```yaml
---
title: "文章标题"
date: 2026-01-01T10:00:00+08:00
draft: false
categories: ["技术"]
tags: ["Hugo", "博客"]
---
```

> 文章日期统一使用 `YYYY年MM月DD日` 格式展示，详见 `CONFIGURATION.md`。

## 配置

所有配置集中在 `config.toml`，包含站点信息、菜单、Giscus 评论、Markdown 渲染等。详细字段说明见 [CONFIGURATION.md](CONFIGURATION.md)。

### 站点与作者信息

```toml
[params]
  blog_title = "人久"
  author_name = "神仙阿旺"
  author_avatar = "/images/20260126_203153.webp"
  author_description = "为人方方正，证心，证我，证自己！"
```

### Giscus 评论系统

本博客已集成 Giscus，配置位于 `config.toml` 的 `[params.giscus]` 段。当前仓库（`renjiu13/YuFen`）已启用 GitHub Discussions 并完成映射，开箱即用。

如需迁移到自己的仓库，请：

1. 在目标仓库 Settings 中启用 Discussions
2. 访问 [https://giscus.app/zh-CN](https://giscus.app/zh-CN) 获取 `repo_id` 与 `category_id`
3. 替换 `config.toml` 中对应字段

```toml
[params.giscus]
  enable = true
  repo = "renjiu13/YuFen"
  # 以下两项从 Giscus 生成
  repo_id = "R_kgDORKLlrA"
  category = "General"
  category_id = "DIC_kwDORKLlrM4C2JSz"
  mapping = "pathname"
  theme = "preferred_color_scheme"
  lang = "zh-CN"
  loading = "lazy"
```

> 评论数据存储在 GitHub Discussions，需 GitHub 账号登录后评论。

## 部署

本项目采用 **GitHub 源码仓库 + NAS 自建构建 + Cloudflare Tunnel 内网穿透** 的自动化部署方案。本地写完文章只需 `git push`，NAS 会自动拉取、构建并发布，无需在本地构建，也不依赖任何静态托管平台。

> 完整方案（含 Docker Compose、Nginx 配置、自动同步脚本与踩坑记录）见站内文章《NAS部署Hugo博客方案》，源码位于 `content/posts/部署Hugo博客方案.md`。

### 架构总览

```text
┌─────────────────────┐
│   Windows 本地       │
│   VS Code + Hugo    │
│   写文章 / 改主题     │
└─────────┬───────────┘
          │ git push
          ▼
┌─────────────────────┐
│   GitHub 源码仓库    │
│   renjiu13/YuFen    │
│   （保存完整 Git 历史）│
└─────────┬───────────┘
          │ 每 5 分钟自动 git fetch 检测更新
          ▼
┌───────────────────────────────────────────┐
│                    NAS                     │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ yufen-builder（构建容器）             │ │
│  │ git pull/reset → hugo → /public      │ │
│  └──────────────────┬───────────────────┘ │
│                     ▼                      │
│  ┌──────────────────────────────────────┐ │
│  │ yufen-web（Web 容器）                 │ │
│  │ Nginx 托管 /public，监听 :5266        │ │
│  └──────────────────┬───────────────────┘ │
└─────────────────────┼──────────────────────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
   局域网访问               Cloudflare Tunnel
  http://NAS-IP:5266                │
                                    ▼
                            https://1.122915.xyz
```

### 工作流程

1. **本地写作**：在 Windows 上用 VS Code 写文章、调试主题，`hugo server -D` 本地预览。
2. **推送源码**：`git push` 到 GitHub 仓库（仓库只存 Hugo 源码，不存 `public/`）。
3. **NAS 自动构建**：`yufen-builder` 容器每 300 秒（5 分钟）检测一次 GitHub 更新，有新提交则自动 `git pull` 并执行 `hugo` 构建，产物输出到共享的 `/public` 目录。
4. **Nginx 提供服务**：`yufen-web` 容器以只读方式挂载 `/public`，通过 Nginx 在 5266 端口提供静态网页。
5. **公网访问**：Cloudflare Tunnel 将 NAS 的 5266 端口安全暴露到公网域名，无需公网 IP、无需在路由器开端口。

### 关键约定

- **构建在 NAS 完成**：本地无需提交 `public/`，该目录已在 `.gitignore` 中忽略。
- **两个容器分工**：`yufen-builder` 负责 Git + Hugo 构建，`yufen-web` 负责 Nginx 托管，通过共享 `/public` 卷解耦。
- **同步间隔**：`CHECK_INTERVAL=300`（秒），即推送后最长约 5 分钟内自动上线。
- **Cloudflare Tunnel 独立维护**：隧道单独部署、单独升级，不放入博客的 Compose 文件。

> 旧版曾使用 Cloudflare Pages 部署（配置见 `wrangler.jsonc`，已保留作为备选方案）。当前主流程已迁移至 NAS 自建。

## 分支说明

| 分支 | 作用 |
| --- | --- |
| `main` | 主开发分支，NAS 从此分支自动拉取构建 |
| `backup/pre-nas-readme` | 归档：更新 NAS 部署 README 前的 main 快照 |
| `backup/cloudflare-pages` | 归档：Cloudflare Pages 时代版本快照 |
| `backup-bug1` | 归档：移动端排版修复、目录功能、Tailwind 降级样式等实验性改动 |
| `nas-deploy` | 过渡分支（README 更新曾在此进行），已合并回 main，可删除 |

## 自定义

- **修改主题样式**：编辑 `themes/YuFen/static/css/` 下的样式文件
- **添加新页面**：在 `content/` 目录下创建 Markdown 文件（如 `about.md`）
- **调整菜单**：修改 `config.toml` 中的 `[menu]` 段

## 许可证

MIT License

## 感谢

- [Hugo](https://gohugo.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Font Awesome](https://fontawesome.com/)
- [Giscus](https://giscus.app/)
- [Nginx](https://nginx.org/)
- [Docker](https://www.docker.com/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
