---
title: Cloudflare Tunnel + Nginx Proxy Manager 部署方案
date: 2026-05-21T00:02:41+08:00
draft: false
tags:
  -
---

# Cloudflare Tunnel + Nginx Proxy Manager 部署方案

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare 边缘                        │
│    *.example.com ──► Cloudflare Tunnel ──► SSL 自动终结        │
│         │                                                    │
│         └────────────────────────────────────────────────────┘
│                              │
│                    cloudflared 隧道连接
│                              │
┌──────────────────────────────┼──────────────────────────────┐
│         Docker 网络 (bridge) │                              │
│  ┌───────────────────────────┼───────────────────────────┐ │
│  │    Nginx Proxy Manager    │                           │ │
│  │  ┌─────────────────────┐  │  ┌─────────────────────┐  │ │
│  │  │  80: 接收隧道流量    │  │  81: Web 管理界面     │  │ │
│  │  │  (Host 头路由分发)   │◄─┘  │  (远程可访问)        │  │ │
│  │  └─────────────────────┘     └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘
│                              │
│              ┌───────────────┼───────────────┐
│              ▼               ▼               ▼
│        ┌─────────┐   ┌─────────┐   ┌─────────┐
│        │  NAS:5000│   │qB:8080  │   │Emby:8096│
│        └─────────┘   └─────────┘   └─────────┘
└─────────────────────────────────────────────────────────────┘
```

**核心原则**：Cloudflare 负责 SSL 和泛域名解析，cloudflared 负责建立隧道，NPM 负责所有路由逻辑。三者职责分离，互不侵入。

---

## 二、部署方案

### 方案一：一体化部署（推荐）

cloudflared 与 NPM 在同一 Compose 网络内，通过容器名通信，**无宿主机端口暴露**。

```yaml
# docker-compose.yml (方案一：一体化)
version: "3.8"

services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: npm
    restart: always
    mem_limit: 512m
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      # 81 映射到所有接口，方便内网直接访问；生产环境建议配合 NPM Access List 限制
      - "81:81"
    environment:
      # 关闭 NPM 的 SSL 功能，内部纯 HTTP
      DISABLE_IPV6: "true"
    volumes:
      - ./data/npm-data:/data
      - ./data/npm-letsencrypt:/etc/letsencrypt
    networks:
      - proxy-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:81/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: always
    mem_limit: 128m
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # 直接填入隧道 Token，无需额外 .env 文件
    command: tunnel --no-autoupdate run --token eyJhIjoi...
    environment:
      - TUNNEL_TOKEN=eyJhIjoi...  # 替换为你的 Cloudflare Tunnel Token
    networks:
      - proxy-net
    depends_on:
      npm:
        condition: service_healthy
    # 无端口映射，纯内网通信

networks:
  proxy-net:
    driver: bridge
```

---

### 方案二：分离部署

NPM 独立容器，cloudflared 作为宿主机原生服务运行。

```yaml
# docker-compose.yml (方案二：分离)
version: "3.8"

services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: npm
    restart: always
    mem_limit: 512m
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      # 80 仅绑定 127.0.0.1，供宿主机 cloudflared 连接；81 全接口开放
      - "127.0.0.1:80:80"
      - "81:81"
    environment:
      DISABLE_IPV6: "true"
    volumes:
      - ./data/npm-data:/data
      - ./data/npm-letsencrypt:/etc/letsencrypt
    networks:
      - proxy-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:81/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  proxy-net:
    driver: bridge
```

**宿主机 cloudflared 配置**（方案二专用）：

```bash
# 安装 cloudflared（以 Debian/Ubuntu 为例）
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 登录并授权
sudo cloudflared tunnel login

# 创建隧道
sudo cloudflared tunnel create my-tunnel

# 配置隧道（/root/.cloudflared/config.yml）
```

```yaml
# /root/.cloudflared/config.yml
tunnel: <TUNNEL_UUID>
credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

ingress:
  # 所有泛域名流量转发到本地 NPM 的 80 端口
  - hostname: "*.example.com"
    service: http://127.0.0.1:80
  - service: http_status:404
```

```bash
# 安装为系统服务并启动
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

---

## 三、目录结构与初始化

```bash
mkdir -p ~/npm-proxy/{data/npm-data,data/npm-letsencrypt}
cd ~/npm-proxy

# 创建 docker-compose.yml 后启动
docker compose up -d
```

---

## 四、Cloudflare 控制台配置步骤

### 步骤 1：创建隧道

1. 登录 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. 进入 **Networks** → **Tunnels** → **Create a tunnel**
3. 选择 **Cloudflared** → 命名隧道（如 `home-npm-tunnel`）
4. 复制隧道 Token（形如 `eyJhIjoi...`），替换 `docker-compose.yml` 中的 `eyJhIjoi...`

### 步骤 2：配置泛域名路由

在隧道配置页面添加 **Public Hostname**：

| Type | URL | Service |
|------|-----|---------|
| HTTP | `*.example.com` | `http://npm:80`（方案一）或 `http://127.0.0.1:80`（方案二）|

> **关键**：此处仅配置一条泛域名规则，后续所有子域名均在 NPM 侧管理。

### 步骤 3：DNS 配置

进入 Cloudflare DNS 管理，添加一条 **CNAME**：

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | `*` | `<TUNNEL_ID>.cfargotunnel.com` | 🟡 Proxied |

> 无需为每个子域名单独添加 DNS 记录，`*` 泛解析已覆盖全部。

### 步骤 4：SSL/TLS 模式

进入 **SSL/TLS** → **Overview**，选择模式：

```
Full (strict)  ──►  推荐（Cloudflare 到源站也验证证书）
Full           ──►  可选（如果源站使用自签证书）
```

> 由于内部使用纯 HTTP，实际等效于 **Full** 模式。Cloudflare 边缘会自动为 `*.example.com` 提供泛域名证书。

---

## 五、NPM 图形界面配置

访问 `http://宿主机IP:81` 或远程通过 `https://npm.example.com`（见 5.4 节），默认账户：
- 邮箱：`admin@example.com`
- 密码：`changeme`

### 5.1 添加反向代理（Proxy Hosts）

点击 **Hosts** → **Proxy Hosts** → **Add Proxy Host**

| 字段 | 填写示例 |
|------|---------|
| Domain Names | `nas.example.com` |
| Scheme | `http` |
| Forward Hostname / IP | `192.168.1.100`（或容器名如 `nas`） |
| Forward Port | `5000` |
| Cache Assets | 按需勾选 |
| Block Common Exploits | ✅ 建议开启 |

> 重复此操作添加 `qb.example.com`、`emby.example.com`、`alist.example.com` 等，**无需重启任何服务**，实时生效。

### 5.2 高级配置（Advanced）

在 Proxy Host 编辑页点击 **Advanced** 标签，可配置：

```nginx
# 自定义 Header 注入
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# 缓存控制
proxy_cache_bypass $http_pragma;
proxy_cache_bypass $http_authorization;
add_header Cache-Control "no-store, no-cache, must-revalidate";

# WebSocket 支持（NPM 默认已开启，如需显式配置）
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

> **注意**：NPM 开源版 GUI 中 **Rate Limiting** 和 **Cache Control** 并非原生按钮功能，需通过 **Advanced** 自定义 Nginx 指令实现。若需原生 GUI 支持，可考虑升级到 **NPM Plus** 或配合 **Authentik/Authelia** 做访问控制。

### 5.3 安全选项

在 Proxy Host 编辑页：
- ✅ **Block Common Exploits**：阻止常见 SQL 注入、XSS 攻击
- ✅ **Websockets Support**：WebSocket 代理支持
- **Access List**：IP 白名单/黑名单控制

### 5.4 远程访问 NPM 管理界面

由于您不在 NAS 附近，需通过公网访问管理界面。最符合架构的做法是：

在 NPM 中新增一条 **Proxy Host**：

| 字段 | 值 |
|------|-----|
| Domain Names | `npm.example.com` |
| Scheme | `http` |
| Forward Hostname / IP | `127.0.0.1` |
| Forward Port | `81` |

> 这样 `https://npm.example.com` 会先到达 NPM 的 80 端口，再由 NPM 自身路由到 81 端口管理界面，**不绕过 NPM**，完全满足需求 1.3。

**安全提醒**：
- 首次登录后立即修改默认密码
- 在 `npm.example.com` 这条 Proxy Host 中开启 **Block Common Exploits**
- 建议在 **Access List** 中限制允许访问的 IP 段，或配合 **Cloudflare Access**（Zero Trust）做二次身份验证

---

## 六、后端服务接入示例

所有后端服务仅需确保是 **HTTP 服务** 且可被 NPM 容器访问：

| 服务 | 内网地址 | NPM 配置 |
|------|---------|---------|
| NAS (群晖 DSM) | `http://192.168.1.100:5000` | `nas.example.com` → `192.168.1.100:5000` |
| qBittorrent | `http://192.168.1.100:8080` | `qb.example.com` → `192.168.1.100:8080` |
| AList | `http://192.168.1.100:5244` | `alist.example.com` → `192.168.1.100:5244` |
| Emby | `http://192.168.1.100:8096` | `emby.example.com` → `192.168.1.100:8096` |
| 图床 (Chevereto) | `http://192.168.1.100:80` | `img.example.com` → `192.168.1.100:80` |

**未来新增服务**：在 NPM UI 新增一条 Proxy Host 即可，零架构改动。

---

## 七、监控集成（Uptime Kuma）

在 NPM 同一网络或独立部署 Uptime Kuma：

```yaml
# docker-compose.override.yml（追加到方案一）
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: always
    ports:
      - "3001:3001"
    volumes:
      - ./data/uptime-kuma:/app/data
    networks:
      - proxy-net
```

**监控配置**：
- 添加监控项类型：**HTTP(s)**
- URL：`https://nas.example.com` / `https://qb.example.com`
- 通过 NPM 反向代理暴露 Uptime Kuma 自身：`status.example.com` → `uptime-kuma:3001`

---

## 八、故障排查速查表

| 现象 | 排查方向 |
|------|---------|
| `*.example.com` 无法访问 | 1. 检查 Cloudflare DNS 的 CNAME 是否生效<br>2. 检查隧道状态是否 Healthy<br>3. 检查 NPM 容器是否运行 |
| 502 Bad Gateway | 1. 检查 NPM 中 Forward IP/Port 是否正确<br>2. 确认后端服务是否运行<br>3. 检查 Docker 网络连通性 (`docker exec -it npm ping 后端IP`) |
| 证书错误 | 确认 Cloudflare SSL/TLS 模式为 Full 或 Full (strict)，内部无需证书 |
| NPM 管理界面无法访问 | 检查 `81` 端口映射，确认容器运行状态；远程访问确认 `npm.example.com` Proxy Host 已配置 |
| 子域名新增后不生效 | NPM 配置实时生效，检查域名拼写和 DNS 缓存 |
| WebSocket 断开 | 确认 NPM 中已勾选 **Websockets Support** |

---

## 九、交付清单

- [x] `docker-compose.yml`（方案一 + 方案二）
- [x] Cloudflare 控制台配置步骤
- [x] NPM 图形界面操作指南（含远程管理界面配置）
- [x] 数据持久化与目录结构
- [x] 监控集成思路
- [x] 故障排查手册

**架构优势**：Cloudflare 处理 SSL 和 DDoS 防护，cloudflared 提供零端口暴露的内网穿透，NPM 提供可视化的灵活路由。三者解耦，任意组件可独立替换或升级。