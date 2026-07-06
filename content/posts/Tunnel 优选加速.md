---
title: Tunnel 优选加速
date: 2026-07-06T22:14:59+08:00
draft: false
tags:
  - Cloudflare
  - 优选加速
  - 网络
---
现在**一个**域名即可优选加速了，非常棒。

注意需要打开多个页面，切换下一步骤最好**复**制标签页，更为方便。

### 先创建两个tunnel的穿透网址

例如：

<img src="https://img.confused.hidns.co/img/2026/07/20260706221907_d724.webp" alt="20260706221907500" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:800px;">

<mark style="background:#f38181">localhost:8080</mark>为我的服务器的服务端口


### DNS记录常见Saas回退源

例如：
<img src="https://img.confused.hidns.co/img/2026/07/20260706222127_4b9d.webp" alt="20260706222127789" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">
内容我填写了`7.7.7.7`。为什么填写这个我也不清楚，反正我也是找别人教程写的，实践没有问题。
不过我看有的视频说是填写**服务器**的IP地址，但是我是无公网环境，就按照实际来了。


<mark style="background:#f38181">记录创建，先了解，一步一步来后续在操作或者创建：</mark>


-  `saas.confused.hidns.co`         回退源
-  `cdn.confused.hidns.co`           加速，内容`2x.nz`
-  `imgcdn.confused.hidns.co`      Tunnel地址之一，自定义源服务器
-  `img.confused.hidns.co`            Tunnel地址之一，用户实际访问地址，内容`cdn.confused.hidns.co`

### SSL证书设置为灵活

<img src="https://img.confused.hidns.co/img/2026/07/20260706222449_b39f.webp" alt="20260706222449008" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">


设置为严格可能出问题

### 回退源设置


<img src="https://img.confused.hidns.co/img/2026/07/20260706222623_1dc5.webp" alt="20260706222623444" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">

注意我的步骤，保存页面再次**DNS记录**，删除你要用户实际访问的`URL`网站。

### 自定义主机名

<img src="https://img.confused.hidns.co/img/2026/07/20260706223538_78f0.webp" alt="20260706223538461" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">

按照我的来，更安全更稳定。

### 证书

<img src="https://img.confused.hidns.co/img/2026/07/20260706223629_d4e6.webp" alt="20260706223629536" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">

下图找的，看红字即可，我的不想改了

<img src="https://img.confused.hidns.co/img/2026/07/20260706224155_b555.webp" alt="20260706224155411" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">

点击刷新. 如果两个待定均变为有效, 代表你的所有设置均是正确的! **至此本篇教程已经结束.**
