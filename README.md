# 风言风语 - YuFen 主题

「风言风语」是神仙阿旺的个人博客，基于 Hugo 与自研的 YuFen 主题构建，使用 Tailwind CSS、Font Awesome，并集成 Giscus 评论系统。这里记录技术实践与生活感悟，涉猎 Cloudflare、自建服务、内网穿透、备份方案，以及节气随笔、读书笔记等。

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
- ⚡ Cloudflare Pages 部署

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
├── static/
│   └── images/                 # 头像与文章配图
├── themes/
│   └── YuFen/                  # 主题文件
│       ├── layouts/            # 页面模板
│       └── static/             # 主题静态资源（css/js）
├── config.toml                 # 站点与主题配置
├── CONFIGURATION.md            # 配置项说明
├── wrangler.jsonc              # Cloudflare Pages 部署配置
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
  blog_title = "风言风语"
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

本项目通过 Cloudflare Pages 部署，配置见 `wrangler.jsonc`：

```jsonc
{
  "name": "yufen",
  "compatibility_date": "2026-07-09",
  "assets": {
    "directory": "./public",
    "not_found_handling": "404-page"
  }
}
```

### 部署步骤

1. 本地构建：`hugo`
2. 登录 Cloudflare：`npx wrangler login`
3. 部署：`npx wrangler deploy`

也可在 Cloudflare 控制台连接 GitHub 仓库，设置构建命令为 `hugo`、输出目录为 `public`，实现推送自动部署。

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
- [Cloudflare Pages](https://pages.cloudflare.com/)
