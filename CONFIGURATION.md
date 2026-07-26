# 博客配置说明

## 配置文件位置

所有博客配置都在 `config.toml` 文件中进行管理。

## 核心配置项

### 基本信息配置
```toml
[params]
  # 博客标题（显示在首页）
  blog_title = "我的博客"

  # 作者姓名
  author_name = "作者姓名"

  # 作者头像路径（相对于 static 目录）
  author_avatar = "/images/avatar.jpg"

  # 作者简介/博客描述
  author_description = "分享我的技术思考与生活感悟"
```

### 站点基本信息
```toml
# 站点标题（备用，优先使用 blog_title）
title = "我的博客"

# 站点描述（备用，优先使用 author_description）
description = "分享我的技术思考与生活感悟"
```

## 头像设置说明

1. 将头像图片放置在 `static/images/` 目录下
2. 在 `config.toml` 中设置 `author_avatar` 为图片路径
3. 支持常见图片格式（jpg, png, gif等）
4. 建议尺寸：128x128 像素或更大

## 日期格式说明

所有文章日期统一使用 `YYYY年MM月DD日` 格式：
- 原格式：`2006年1月2日` → `2026年2月7日`
- 新格式：`2006年01月02日` → `2026年02月07日`

## 导航菜单配置

导航项在 `[menu.main]` 段配置，增删改只需改配置文件，模板自动遍历：

```toml
[[menu.main]]
  name = "首页"
  url = "/"
  weight = 1

[[menu.main]]
  name = "文章"
  url = "/posts/"
  weight = 2
```

规则：
- `name`：导航显示文字
- `url`：链接地址，必须用正斜杠 `/`，末尾加 `/`（如 `/posts/`）
- `weight`：排序权重，数字越小越靠左

高亮规则：首页仅在 `/` 时高亮，其余项按 URL 前缀匹配自动高亮当前页。

## 配置生效方式

修改配置后，需要重新构建站点：
```bash
hugo server
```

## 配置优先级

1. `blog_title` 优先于 `title`
2. `author_description` 优先于 `description`
3. 如未设置头像，显示默认用户图标
