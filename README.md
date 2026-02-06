# Hugo 博客模板 - YuFen 主题

一个简洁优雅的 Hugo 博客主题，使用 Tailwind CSS 和 Font Awesome 构建。

## 特性

- 🎨 简洁优雅的设计风格
- 📱 响应式布局，支持移动端
- 🌙 深色模式支持（待实现）
- 📝 支持分类和标签
- 🔍 SEO 友好
- ⚡ 快速加载

## 快速开始

### 1. 安装 Hugo

确保已安装 Hugo (版本 0.80+):

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
│   └── posts/          # 博客文章
├── themes/
│   └── YuFen/          # 主题文件
├── public/             # 生成的静态文件
├── config.toml         # 配置文件
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
date: 2024-01-01T10:00:00+08:00
draft: false
categories: ["技术"]
tags: ["Hugo", "博客"]
---
```

## 自定义

### 修改主题颜色

编辑 `themes/YuFen/layouts/_default/baseof.html` 中的 Tailwind 配置。

### 添加新页面

在 `content/` 目录下创建新文件，例如 `about.md`。

## 部署

### 部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 构建站点: `hugo`
3. 将 `public/` 目录推送到 `gh-pages` 分支

### 部署到 Netlify

1. 连接 GitHub 仓库
2. 构建命令: `hugo`
3. 发布目录: `public`

## 许可证

MIT License

## 感谢

- [Hugo](https://gohugo.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Font Awesome](https://fontawesome.com/)