---
title: Silo-and-Piclist
date: 2026-08-19T23:49:42+08:00
draft: false
tags:
  - 图床
  - 经验
  - 复盘
---
  # 本地 SILO 图床 + Cloudflare Tunnel + PicList 踩坑全记录：从 URL 404 到 DNS 解析失败的完整排错指南

> **环境**：本地部署 SILO（MinIO 分支）+ Cloudflare Tunnel 穿透 + PicList 作为上传客户端  
> **核心问题**：上传成功但返回链接无法访问、公网 endpoint 报 `getaddrinfo ENOTFOUND`、Path-Style 与 Virtual Hosted-Style 的隐秘陷阱

---

## 一、前言：为什么这件事值得写

如果你和我一样，在本地 NAS/服务器上部署了 **SILO**（Pigsty 社区维护的 MinIO 分支），想通过 **Cloudflare Tunnel** 把它变成公网图床，再用 **PicList** 一键上传并获取直链，那么你大概率会踩到以下几个连环坑：

1. 上传成功，但返回的 URL 是 `http://100.100.1.14:9001/xxx.webp`，**缺少 bucket 名**，公网无法访问
2. 给 Cloudflare Tunnel 配置了域名，结果**暴露的是 Web Console 端口（9001）**，PicList 上传报错或返回的链接打不开
3. 把 PicList 的 `endpoint` 改成公网域名后，直接报 `Error: getaddrinfo ENOTFOUND awang.1111.confused.hidns.co`
4. 手动在 `urlPrefix` 里加上 `/awang`，结果链接变成了 `/awang/awang/xxx.webp`

这篇文章会把这些坑**按时间线还原**，并讲清楚背后的原理（S3 API 端口 vs Console 端口、Path-Style vs Virtual Hosted-Style、`endpoint` 与 `urlPrefix` 的本质区别），最后给出一份**可直接复制使用的最终配置**。

---

## 二、环境背景

### 2.1 服务端：本地 SILO

- **内网地址**：`100.100.1.14`
- **S3 API 端口**：`9000`（对象上传、下载、直链访问）
- **Web Console 端口**：`9001`（管理后台，浏览器访问的 UI）
- **Bucket 名称**：`awang`
- **访问策略**：已设置为 `public-read`

### 2.2 网络层：Cloudflare Tunnel

在 Cloudflare Zero Trust 的 **Public Hostname** 中配置了以下路由：

| 序号 | 公网域名 | 目标服务 | 实际用途 |
|------|---------|---------|---------|
| 3 | `silo.confused.hidns.co` | `http://0.0.0.0:9001` | **Web Console**（管理后台） |
| 4 | `1111.confused.hidns.co` | `http://0.0.0.0:9000` | **S3 API**（上传 + 直链） |

### 2.3 客户端：PicList

使用 `aws-s3-plist` 插件对接 SILO。

---

## 三、踩坑时间线：四个阶段的完整复盘

### 阶段一：上传成功，但返回的 URL 缺少 Bucket 名

**初始配置（有问题的）：**

```json
{
  "endpoint": "http://100.100.1.14:9001",
  "urlPrefix": "https://silo.confused.hidns.co",
  "pathStyleAccess": false,
  "bucketName": "awang"
}
```

**现象**：PicList 提示上传成功，返回的链接是：

```
http://100.100.1.14:9001/20260819224846616.webp
```

**问题**：
- 链接里**没有 bucket 名 `awang`**，导致直链 404
- 原因：`pathStyleAccess` 为 `false`（Virtual Hosted-Style），但 SDK 面对 IP:Port 的 endpoint 时行为异常，没有正确拼接路径

**当时误以为的"正确URL"**：
```
http://100.100.1.14:9001/api/v1/buckets/awang/objects/download?preview=true&prefix=...
```
> ⚠️ **注意**：这是 MinIO/SILO **Web Console 的内部 REST API**，不是标准的 S3 对象访问链接。它需要 Session Cookie 认证，外部直接访问会 401，**绝对不能当图床直链用**。

---

### 阶段二：Cloudflare Tunnel 暴露错了端口

发现 `silo.confused.hidns.co` 映射的是 `9001`（Web Console），而 PicList 上传需要的是 `9000`（S3 API）。

**Tunnel 的正确映射应该是**：

| 公网域名 | 内网目标 | 用途 |
|---------|---------|------|
| `1111.confused.hidns.co` | `http://0.0.0.0:9000` | **S3 API 入口**（上传+直链） |
| `silo.confused.hidns.co` | `http://0.0.0.0:9001` | Web Console（仅管理，可选） |

---

### 阶段三：endpoint 改成公网域名后，上传报错 ENOTFOUND

**修改后的配置（仍有问题的）：**

```json
{
  "endpoint": "https://1111.confused.hidns.co",
  "urlPrefix": "https://1111.confused.hidns.co/awang",
  "pathStyleAccess": false,
  "bucketName": "awang"
}
```

**报错信息**：

```
Error: getaddrinfo ENOTFOUND awang.1111.confused.hidns.co
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
```

**原因剖析**：

这是整个排错过程中**最关键的一个知识点**。

S3 协议有两种 URL 构造方式：

| 模式 | 格式 | 适用场景 |
|------|------|---------|
| **Virtual Hosted-Style** | `https://bucket-name.domain.com/object-key` | 标准 AWS S3，需要 DNS 泛解析 |
| **Path-Style** | `https://domain.com/bucket-name/object-key` | 兼容 MinIO、IP:Port 部署、自定义域名 |

当 `pathStyleAccess: false` 时，PicList 底层的 AWS SDK 会尝试使用 **Virtual Hosted-Style**，把 `bucketName` 拼到域名前面：

```
awang.1111.confused.hidns.co
```

但你的 Cloudflare Tunnel 只配置了 `1111.confused.hidns.co`，并没有 `*.1111.confused.hidns.co` 的泛解析，所以 DNS 解析直接失败。

**为什么之前填内网 IP `100.100.1.14:9000` 不会报错？**

因为 AWS SDK 内部有一个兜底逻辑：**当 endpoint 是纯 IP 地址时，强制回退到 Path-Style**。所以填 IP 时即使 `pathStyleAccess: false` 也能工作（或部分工作），但填域名时就暴露了问题。

---

### 阶段四：urlPrefix 里手动加 /awang，导致路径重复

在尝试修复时，有人（比如我）可能会把 `urlPrefix` 写成：

```json
"urlPrefix": "https://1111.confused.hidns.co/awang"
```

同时保持 `disableBucketPrefixToURL: false`。

**后果**：

PicList 生成最终链接时，会这样拼接：

```
urlPrefix + "/" + bucketName + "/" + fileName
```

于是变成了：

```
https://1111.confused.hidns.co/awang/awang/20260819224846616.webp
```

**路径里 bucket 名重复了**，直链 404。

---

## 四、核心原理：四个关键概念的澄清

### 4.1 SILO/MinIO 的双端口架构

| 端口 | 协议/服务 | 能否做图床直链 |
|------|----------|--------------|
| **9000** | S3 API（RESTful 对象存储接口） | ✅ **可以**，这是标准对象访问入口 |
| **9001** | Web Console（管理 UI + 内部 API） | ❌ **不可以**，`/api/v1/...` 是内部接口，需要认证 |

**Cloudflare Tunnel 必须暴露 9000，而不是 9001。**

### 4.2 endpoint 与 urlPrefix 的本质区别

| 字段 | 作用 | 推荐填写 |
|------|------|---------|
| **`endpoint`** | PicList **上传文件**时直连的地址 | **内网地址**（如 `http://100.100.1.14:9000`），上传不走公网，速度快且稳定 |
| **`urlPrefix`** | 上传完成后，**返回给用户的公开访问链接前缀** | **公网域名**（如 `https://1111.confused.hidns.co`）|

**为什么 endpoint 推荐填内网？**

```
PicList 本机 ──内网直连──→ SILO:9000  （上传，延迟 1ms，不占 Tunnel 带宽）
用户浏览器 ──公网──→ Cloudflare ──Tunnel──→ SILO:9000  （下载图片）
```

如果 endpoint 填公网，上传也要绕一圈走 Cloudflare，**延迟高、不稳定、浪费 Tunnel 带宽**。只有当 PicList 和 SILO 不在同一网络时才需要填公网。

### 4.3 Path-Style Access 的强制必要性

只要你的 endpoint 是 **IP:Port** 或 **非 S3 官方域名**，**必须开启 `pathStyleAccess: true`**。

这是 MinIO 兼容 S3 SDK 的硬性要求。官方文档和社区经验都反复提到这一点。

### 4.4 disableBucketPrefixToURL 与 urlPrefix 的配合

| 组合 | urlPrefix 写法 | 最终链接效果 |
|------|---------------|-------------|
| `disableBucketPrefixToURL: false` | `https://domain.com` | `https://domain.com/bucket/file.webp` ✅ |
| `disableBucketPrefixToURL: true` | `https://domain.com/bucket` | `https://domain.com/bucket/file.webp` ✅ |
| `disableBucketPrefixToURL: false` | `https://domain.com/bucket` | `https://domain.com/bucket/bucket/file.webp` ❌ |

---

## 五、最终正确配置

### 5.1 PicList 配置（aws-s3-plist）

```json
{
  "aws-s3-plist": {
    "_configName": "minlo-awang",
    "_id": "116e927f-47f7-44ed-9099-562c15945be5",
    "_createdAt": 1780673128723,
    "_updatedAt": 1787153827848,
    "accessKeyID": "0rWDk77YfJSotBNCN1eA",
    "secretAccessKey": "TJnbLYU2uSwpv0oFBHtGYIT9oshFzHdMCUZBOdmH",
    "bucketName": "awang",
    "uploadPath": "/",
    "region": "auto",
    "endpoint": "http://100.100.1.14:9000",
    "proxy": "",
    "urlPrefix": "https://1111.confused.hidns.co",
    "options": "",
    "pathStyleAccess": true,
    "rejectUnauthorized": false,
    "acl": "public-read",
    "disableBucketPrefixToURL": false
  }
}
```

**关键字段说明**：

- **`endpoint`**: `http://100.100.1.14:9000` —— 内网 S3 API 端口，上传直连
- **`urlPrefix`**: `https://1111.confused.hidns.co` —— 公网域名，不含 `/awang`
- **`pathStyleAccess`**: `true` —— **必须**，否则报 `ENOTFOUND`
- **`disableBucketPrefixToURL`**: `false` —— 让 PicList 自动在 urlPrefix 后追加 `awang`
- **`proxy`**: 空字符串 —— 不走代理，避免干扰

### 5.2 Cloudflare Tunnel 路由配置

在你的 Cloudflare Zero Trust → Networks → Tunnels → Public Hostname 中：

| 公网域名 | 服务（Service） | 说明 |
|---------|----------------|------|
| `1111.confused.hidns.co` | `http://0.0.0.0:9000` | **图床主入口**（S3 API） |
| `silo.confused.hidns.co` | `http://0.0.0.0:9001` | 可选，Web Console 管理后台 |

> 💡 **安全建议**：Web Console 建议通过 Cloudflare Access 加身份验证，或干脆不暴露到公网，只在本地 `http://100.100.1.14:9001` 访问。

### 5.3 SILO 服务端设置

确保 bucket 公开可读：

```bash
# 使用 mc 命令行
mc anonymous set download silo-local/awang

# 或在 SILO Web Console 中：
# Buckets → awang → Access Policy → Public
```

---

## 六、验证流程

### 步骤 1：测试内网 S3 API 连通性

```bash
curl -I http://100.100.1.14:9000/awang/test.webp
# 期望：HTTP/1.1 200 OK
```

### 步骤 2：测试公网直链

浏览器访问：

```
https://1111.confused.hidns.co/awang/已有的图片.webp
```

期望：图片正常显示，不是 404 或 403。

### 步骤 3：PicList 上传测试

拖拽一张图片到 PicList，上传成功后检查剪贴板中的链接格式：

```
https://1111.confused.hidns.co/awang/20260819224846616.webp
```

确认：
- ✅ 协议是 `https://`
- ✅ 域名是 `1111.confused.hidns.co`
- ✅ 路径包含 `/awang/`
- ✅ **没有** `/awang/awang/` 重复
- ✅ **没有** `awang.1111.confused.hidns.co` 子域名

---

## 七、常见问题速查

| 现象 | 原因 | 解决 |
|------|------|------|
| 上传成功但链接 404，缺少 bucket 名 | `pathStyleAccess: false` | 改为 `true` |
| `getaddrinfo ENOTFOUND awang.xxx.com` | Virtual Hosted-Style 域名不存在 | `pathStyleAccess: true` |
| 链接里有 `/awang/awang/` | `urlPrefix` 里手动加了 `/awang` 且 `disableBucketPrefixToURL: false` | urlPrefix 去掉 `/awang`，或 `disableBucketPrefixToURL: true` |
| 公网能看 Console 但不能上传 | Tunnel 暴露的是 9001 而非 9000 | 添加 9000 的路由，PicList 走 9000 |
| 上传慢/失败 | endpoint 填了公网域名 | endpoint 改回内网 IP:9000 |

---

## 八、总结

搭建本地 SILO/MinIO 图床并通过 Cloudflare Tunnel 暴露到公网，核心记住以下几点：

1. **9000 是 S3 API，9001 是 Console**，Tunnel 暴露图床必须走 9000
2. **`endpoint` 填内网，`urlPrefix` 填公网**，分工明确，上传快且稳定
3. **`pathStyleAccess: true` 是必选项**，只要 endpoint 不是 AWS 官方域名就必须开
4. **`urlPrefix` 不要带 bucket 名**，让 `disableBucketPrefixToURL: false` 自动拼接，避免路径重复
5. **Console API（`/api/v1/...`）不是图床直链**，不要试图用它来做图片访问

希望这篇复盘能帮你少走几小时弯路。如果有其他 PicList + MinIO/SILO 的奇怪问题，欢迎在评论区继续讨论。