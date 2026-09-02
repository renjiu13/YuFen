---
title: NAS部署Hugo博客方案
date: 2026-09-03T00:07:31+08:00
draft: false
tags:
  - 博客
  - 方案
  - 杂乱
---

# YuFen Hugo 博客：GitHub → NAS 自动部署完整方案

## 一、目标

博客仓库：

```text
https://github.com/renjiu13/YuFen
```

实现以下工作流：

```text
Windows 写文章
    ↓
Git commit
    ↓
Git push
    ↓
GitHub 保存完整历史
    ↓
NAS 自动检测 GitHub 更新
    ↓
Git pull
    ↓
Hugo 自动构建
    ↓
生成 public/
    ↓
Nginx 提供静态网页
    ↓
Cloudflare Tunnel
    ↓
博客域名
```

Cloudflare Tunnel 单独部署、单独维护，不放入本 Compose。

---

# 二、最终架构

```text
                         GitHub
                    renjiu13/YuFen
                           │
                           │ git fetch
                           ▼
┌───────────────────────────────────────────┐
│                    NAS                    │
│                                           │
│  Docker Compose                           │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ yufen-builder                       │  │
│  │                                     │  │
│  │ GitHub 自动检测                     │  │
│  │ Git pull / reset                    │  │
│  │ Hugo build                          │  │
│  │              ↓                      │  │
│  │          /public                    │  │
│  └─────────────────────────────────────┘  │
│                     │                     │
│                     ▼                     │
│  ┌─────────────────────────────────────┐  │
│  │ yufen-web                           │  │
│  │                                     │  │
│  │ Nginx                               │  │
│  │ /public → HTTP                      │  │
│  │              :5266                  │  │
│  └─────────────────────────────────────┘  │
│                     │                     │
└─────────────────────┼─────────────────────┘
                      │
              http://NAS-IP:5266
                      │
                      ├──────── 局域网访问
                      │
                      ▼
             Cloudflare Tunnel
                      │
                      ▼
                博客公网域名
```

---

# 三、为什么选择两个容器

只使用两个容器：

```text
yufen-builder
```

负责：

```text
GitHub
+
Git
+
Hugo
+
自动部署
```

以及：

```text
yufen-web
```

负责：

```text
Nginx
+
静态网页
```

不单独创建：

```text
Git 容器
Hugo 容器
Nginx 配置容器
Webhook 服务
数据库
```

尽量减少组件数量。

---

# 四、NAS目录

建议使用：

```text
/vol1/1000/Docker/YuFen/
```

创建：

```text
/vol1/1000/Docker/YuFen/
├── docker-compose.yml
├── repo/
├── public/
└── build/
```

含义：

```text
repo/
    GitHub 仓库源码

public/
    Hugo 最终生成的网站

build/
    Hugo 临时构建目录
```

---

# 五、创建目录

进入 NAS：

```bash
mkdir -p /vol1/1000/Docker/YuFen/repo
mkdir -p /vol1/1000/Docker/YuFen/public
mkdir -p /vol1/1000/Docker/YuFen/build

cd /vol1/1000/Docker/YuFen
```

---

# 六、docker-compose.yml

文件：

```text
/vol1/1000/Docker/YuFen/docker-compose.yml
```

完整内容：

```yaml
services:

  yufen-builder:
    image: ghcr.io/gohugoio/hugo:v0.164.0
    container_name: yufen-builder
    restart: unless-stopped

    environment:
      TZ: Asia/Tokyo

      GIT_REPO: https://github.com/renjiu13/YuFen.git

      GIT_BRANCH: main

      # 300 秒 = 5 分钟检查一次
      CHECK_INTERVAL: 300

    volumes:
      - ./repo:/src
      - ./public:/public
      - ./build:/build

    working_dir: /src

    entrypoint:
      - /bin/sh
      - -c

    command:
      - |
        set -u

        echo "======================================"
        echo " YuFen 自动部署启动"
        echo "======================================"

        echo "安装 Git..."
        apk add --no-cache git

        # ==================================
        # 首次启动：克隆 GitHub
        # ==================================

        while [ ! -d "/src/.git" ]; do

          echo "首次运行，正在克隆 GitHub 仓库..."

          rm -rf /src/* /src/.[!.]* /src/..?* 2>/dev/null || true

          if git clone \
            --branch "$$GIT_BRANCH" \
            "$$GIT_REPO" \
            /tmp/YuFen; then

            cp -a /tmp/YuFen/. /src/

            rm -rf /tmp/YuFen

            echo "GitHub 仓库克隆完成"

          else

            echo "GitHub 连接失败，5 秒后重试..."

            sleep 5

          fi

        done


        cd /src


        # ==================================
        # 获取当前版本
        # ==================================

        CURRENT_COMMIT=$$(git rev-parse HEAD)

        echo "当前 Commit：$$CURRENT_COMMIT"


        # ==================================
        # 首次构建
        # ==================================

        echo "开始首次 Hugo 构建..."

        rm -rf /build/*

        if hugo \
          --gc \
          --minify \
          --destination /build; then

          echo "Hugo 首次构建成功"

          rm -rf /public/*

          cp -a /build/. /public/

          echo "网站首次发布成功"

        else

          echo "Hugo 首次构建失败"

        fi


        # ==================================
        # 自动检测 GitHub
        # ==================================

        while true; do

          echo
          echo "--------------------------------------"
          echo "检查 GitHub 更新..."
          echo "时间：$$(date)"


          if git fetch origin "$$GIT_BRANCH"; then

            LOCAL_COMMIT=$$(git rev-parse HEAD)

            REMOTE_COMMIT=$$(git rev-parse "origin/$$GIT_BRANCH")


            echo "本地 Commit：$$LOCAL_COMMIT"

            echo "远程 Commit：$$REMOTE_COMMIT"


            # ==============================
            # 判断是否有更新
            # ==============================

            if [ "$$LOCAL_COMMIT" != "$$REMOTE_COMMIT" ]; then

              echo "检测到 GitHub 新版本"

              echo "开始更新源码..."


              # 更新到远程最新版本
              git reset --hard "origin/$$GIT_BRANCH"


              echo "开始 Hugo 构建..."


              # 清理临时构建目录
              rm -rf /build/*


              # ==============================
              # Hugo 构建
              # ==============================

              if hugo \
                --gc \
                --minify \
                --destination /build; then


                echo "Hugo 构建成功"


                # ==============================
                # 构建成功后再替换网站
                # ==============================

                rm -rf /public/*

                cp -a /build/. /public/


                echo "======================================"

                echo " YuFen 部署成功"

                echo " Commit：$$(git rev-parse --short HEAD)"

                echo "======================================"


              else

                echo "======================================"

                echo " Hugo 构建失败"

                echo " 保留当前线上版本"

                echo "======================================"

              fi


            else

              echo "没有发现更新"

            fi


          else

            echo "GitHub 检查失败"

            echo "保留当前线上版本"

          fi


          echo

          echo "下次检查：$$CHECK_INTERVAL 秒后"

          sleep "$$CHECK_INTERVAL"

        done


  yufen-web:
    image: nginx:1.29-alpine
    container_name: yufen-web
    restart: unless-stopped

    ports:
      - "5266:80"

    volumes:
      - ./public:/usr/share/nginx/html:ro
```

---

# 七、启动

进入目录：

```bash
cd /vol1/1000/Docker/YuFen
```

启动：

```bash
docker compose up -d
```

查看：

```bash
docker compose ps
```

正常应该看到：

```text
yufen-builder
yufen-web
```

状态应该是：

```text
Up
```

---

# 八、第一次部署

查看 Builder：

```bash
docker logs -f yufen-builder
```

正常过程大致：

```text
YuFen 自动部署启动
安装 Git...
首次运行，正在克隆 GitHub 仓库...
GitHub 仓库克隆完成
当前 Commit：xxxxxxxx
开始首次 Hugo 构建...
Hugo 首次构建成功
网站首次发布成功
检查 GitHub 更新...
没有发现更新
```

看到：

```text
Hugo 首次构建成功
```

基本说明 Hugo 已经正常工作。

---

# 九、局域网访问

因为 Web 容器设置：

```yaml
ports:
  - "5266:80"
```

所以 NAS 本机：

```text
http://127.0.0.1:5266
```

可以访问。

同一局域网电脑：

```text
http://NAS-IP:5266
```

例如：

```text
http://192.168.1.100:5266
```

也可以访问。

---

# 十、5266 的意义

5266 是宿主机端口：

```text
NAS:5266
    ↓
Docker
    ↓
Nginx:80
```

所以：

```text
http://NAS-IP:5266
```

访问到的是：

```text
/public
```

也就是 Hugo 生成的网站。

---

# 十一、Cloudflare Tunnel

Cloudflare Tunnel 保持你现有的独立部署。

不要把 `cloudflared` 放进这个 Compose。

Cloudflare Tunnel 的 Origin 指向：

```text
http://NAS-IP:5266
```

或者根据你的 `cloudflared` 部署方式使用：

```text
http://127.0.0.1:5266
```

如果 `cloudflared` 运行在 NAS 宿主机：

```text
127.0.0.1:5266
```

即可。

如果 `cloudflared` 自己也是 Docker 容器，则不要直接使用：

```text
127.0.0.1:5266
```

因为容器中的 `127.0.0.1` 指向的是 cloudflared 容器自己。

这种情况使用：

```text
http://NAS-IP:5266
```

或者根据你的 Docker 网络配置调整。

---

# 十二、Windows 写文章

Windows 安装：

```text
Git
VS Code
Hugo Extended
```

例如：

```text
D:\Blog\YuFen
```

第一次：

```bash
git clone https://github.com/renjiu13/YuFen.git
cd YuFen
```

本地预览：

```bash
hugo server -D
```

然后浏览器：

```text
http://localhost:1313
```

---

# 十三、发布文章

正常写文章：

```text
content/posts/
```

修改完成以后：

```bash
git add .
```

然后：

```bash
git commit -m "新增文章"
```

最后：

```bash
git push
```

---

# 十四、自动部署过程

Windows：

```text
写文章
   ↓
git push
```

GitHub：

```text
产生新的 Commit
```

NAS：

```text
每 5 分钟检查
   ↓
git fetch
   ↓
比较 Commit
```

发现不同：

```text
git reset --hard origin/main
   ↓
Hugo build
   ↓
构建成功
   ↓
替换 /public
```

网站：

```text
Nginx
   ↓
立即提供新版本
```

---

# 十五、为什么使用 Commit 比较

不是每次都无脑重新构建。

NAS 会比较：

```text
LOCAL_COMMIT
```

和：

```text
REMOTE_COMMIT
```

例如：

```text
本地：
abc123

GitHub：
abc123
```

说明：

```text
没有更新
```

如果：

```text
本地：
abc123

GitHub：
def456
```

说明：

```text
GitHub 有新提交
```

才会：

```text
pull
+
Hugo build
```

减少不必要的构建。

---

# 十六、为什么不是 git pull

部署的时候使用：

```bash
git reset --hard origin/main
```

而不是简单：

```bash
git pull
```

原因是 NAS 这个仓库属于：

```text
生产副本
```

它不应该在 NAS 上编辑代码。

所以原则是：

```text
Windows
    ↓
GitHub
    ↓
NAS
```

NAS 永远以 GitHub 为准。

这样可以避免 NAS 本地残留修改导致：

```text
merge conflict
```

---

# 十七、安全的发布机制

这个方案非常重要的一点：

不是：

```text
删除 public
↓
Hugo
```

而是：

```text
GitHub更新
↓
Hugo构建到 /build
↓
构建成功
↓
删除旧 public
↓
复制新的 public
```

所以如果 Hugo 出错：

```text
GitHub更新
↓
Hugo构建失败
↓
不替换 public
```

网站继续使用：

```text
旧版本
```

这样生产环境更安全。

---

# 十八、检查 GitHub 是否同步

查看本地 Commit：

```bash
docker exec yufen-builder \
  sh -c 'cd /src && git rev-parse --short HEAD'
```

查看 GitHub：

```bash
docker exec yufen-builder \
  sh -c 'cd /src && git fetch origin main && git rev-parse --short origin/main'
```

两个一致：

```text
同步完成
```

---

# 十九、手动立即部署

如果不想等 5 分钟，可以：

```bash
docker restart yufen-builder
```

容器启动后会：

```text
GitHub检查
↓
发现新 Commit
↓
自动构建
```

---

# 二十、查看网站容器

```bash
docker logs yufen-web
```

查看端口：

```bash
docker ps
```

应该类似：

```text
0.0.0.0:5266->80/tcp
```

---

# 二十一、查看 Hugo 构建结果

NAS：

```bash
ls -lah /vol1/1000/Docker/YuFen/public
```

正常应该看到：

```text
index.html
404.html
posts/
css/
js/
images/
```

---

# 二十二、更新 Hugo 版本

现在 Compose 固定：

```yaml
image: ghcr.io/gohugoio/hugo:v0.164.0
```

这是为了稳定。

不要直接：

```text
latest
```

否则 Hugo 自动升级后，可能出现主题兼容性变化。

需要升级时：

```text
修改版本
↓
docker compose pull
↓
docker compose up -d
```

升级之前建议先确认博客本地构建正常。

---

# 二十三、停止

```bash
cd /vol1/1000/Docker/YuFen

docker compose down
```

不会删除：

```text
repo/
public/
build/
```

重新启动：

```bash
docker compose up -d
```

---

# 二十四、重建容器

例如升级镜像：

```bash
docker compose pull
docker compose up -d
```

如果需要强制重新创建：

```bash
docker compose up -d --force-recreate
```

---

# 二十五、完整备份

至少备份：

```text
/vol1/1000/Docker/YuFen/
```

因为这里包含：

```text
docker-compose.yml
repo/
public/
build/
```

其中真正最重要的是：

```text
docker-compose.yml
repo/
```

因为：

```text
public/
```

可以重新 Hugo 生成。

---

# 二十六、Restic 建议

你的现有 Restic 可以把：

```text
/vol1/1000/Docker/YuFen
```

纳入备份。

建议备份：

```text
docker-compose.yml
repo/
```

也可以直接备份整个：

```text
/vol1/1000/Docker/YuFen
```

这样恢复时：

```text
恢复目录
↓
docker compose up -d
↓
博客恢复
```

---

# 二十七、故障排查

## 1. 网站打不开

先检查：

```bash
docker compose ps
```

然后：

```bash
curl http://127.0.0.1:5266
```

如果这里都打不开：

```text
Cloudflare 没有问题
```

问题在：

```text
Nginx / Docker
```

---

## 2. 5266 能打开，但网站不是最新

查看：

```bash
docker logs yufen-builder
```

重点看：

```text
检测到 GitHub 新版本
```

有没有出现。

然后查看：

```bash
docker exec yufen-builder \
  sh -c 'cd /src && git log -1 --oneline'
```

---

## 3. Hugo 构建失败

查看：

```bash
docker logs yufen-builder
```

重点关注 Hugo 报错。

因为本方案：

```text
构建失败
↓
不替换 public
```

所以旧博客仍然可用。

---

## 4. GitHub 无法连接

检查：

```bash
docker exec yufen-builder \
  git ls-remote https://github.com/renjiu13/YuFen.git
```

如果失败，通常是：

```text
NAS网络
DNS
GitHub连接
```

---

# 二十八、最终推荐配置

你的生产环境最终固定成：

```text
Windows
    │
    │ Git Push
    ▼
GitHub
renjiu13/YuFen
    │
    │ 自动检查
    ▼
NAS
/vol1/1000/Docker/YuFen
    │
    ├── yufen-builder
    │      │
    │      ├── Git
    │      └── Hugo
    │
    │      ↓
    │    public/
    │
    └── yufen-web
           │
           └── Nginx
                │
                ▼
              :5266
                │
                ├── 局域网
                │
                ▼
        Cloudflare Tunnel
                │
                ▼
          博客公网域名
```

核心职责：

```text
Windows
= 写文章

GitHub
= 源码 + 文章 + Git 历史

yufen-builder
= 自动同步 + Hugo 构建

Nginx
= 静态文件服务器

5266
= NAS 本地博客访问端口

Cloudflare Tunnel
= 公网访问

Restic
= NAS 本地进一步备份
```

最终你写文章时只需要：

```bash
git add .
git commit -m "新增文章"
git push
```

之后 NAS 自动完成剩余工作。
