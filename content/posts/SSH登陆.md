---
title: Linux SSH配置
date: 2026-02-22T23:20:00+08:00
draft: false
tags:
  - Linux
  - SSH
  - 服务器配置
  - 密码登录
  - 密钥登录
---

### 1. 配置文件内容

```
# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.
# This sshd was compiled with PATH=/usr/local/bin:/usr/bin:/bin:/usr/games
# 策略说明：默认配置尽可能保留注释，取消注释的选项表示覆盖默认值
# 包含额外配置文件（通常用于细分配置）
Include /etc/ssh/sshd_config.d/*.conf
# SSH服务监听端口（默认22，取消注释明确指定）
Port 22
# 地址族限制（any=同时支持IPv4和IPv6，可改为inet仅IPv4或inet6仅IPv6）
AddressFamily any
# 监听地址（0.0.0.0=监听所有IPv4地址；::=监听所有IPv6地址）
ListenAddress 0.0.0.0
ListenAddress ::
# 主机密钥文件路径（默认自动生成，无需修改）
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
# 密钥重协商限制（默认值，无需修改）
#RekeyLimit default none
# 日志配置（开启详细日志，便于排查登录问题）
SyslogFacility AUTH
LogLevel VERBOSE        # 详细日志，排查问题更方便
# 认证相关配置
# 登录宽限时间（用户输入密码的超时时间，默认2分钟）
LoginGraceTime 2m
# 允许root用户直接登录
PermitRootLogin yes
# 严格模式（检查用户主目录和密钥文件权限）
StrictModes yes
# 最大认证尝试次数（降低为3次，减少暴力破解风险）
MaxAuthTries 3
# 每个网络连接的最大会话数（默认10）
MaxSessions 10
# 禁用公钥认证【核心修改：取消密钥登录】
PubkeyAuthentication no
# 公钥认证的密钥文件路径（禁用后此配置不生效，保留注释）
AuthorizedKeysFile      .ssh/authorized_keys .ssh/authorized_keys2
#AuthorizedPrincipalsFile none
#AuthorizedKeysCommand none
#AuthorizedKeysCommandUser nobody
# 基于主机的认证（默认关闭，安全性低）
#HostbasedAuthentication no
#IgnoreUserKnownHosts no
#IgnoreRhosts yes
# 启用密码认证【核心修改：恢复密码登录】
PasswordAuthentication yes
# 禁止空密码登录（安全项，必须设为no）
PermitEmptyPasswords no
# 挑战响应认证（如PAM认证，默认关闭）
KbdInteractiveAuthentication no
# Kerberos相关配置（无需使用则保持默认）
#KerberosAuthentication no
#KerberosOrLocalPasswd yes
#KerberosTicketCleanup yes
#KerberosGetAFSToken no
# GSSAPI相关配置（无需使用则保持默认）
#GSSAPIAuthentication no
#GSSAPICleanupCredentials yes
#GSSAPIStrictAcceptorCheck yes
#GSSAPIKeyExchange no
# 启用PAM认证（与密码认证配合使用，需开启）
UsePAM yes
# 允许代理转发（默认开启）
#AllowAgentForwarding yes
# 允许TCP转发（默认开启）
#AllowTcpForwarding yes
# 允许远程主机连接本地转发端口（默认关闭，安全项）
#GatewayPorts no
# 启用X11转发（图形界面转发，默认开启）
X11Forwarding yes
#X11DisplayOffset 10
#X11UseLocalhost yes
# 允许TTY终端（默认开启）
#PermitTTY yes
# 登录时不显示motd信息（关闭欢迎信息）
PrintMotd no
#PrintLastLog yes
#TCPKeepAlive yes
#PermitUserEnvironment no
#Compression delayed
# 客户端存活检测（提升连接稳定性）
ClientAliveInterval 300
ClientAliveCountMax 3
# 禁用DNS反向解析（加速SSH连接）
UseDNS no
#PidFile /run/sshd.pid
#MaxStartups 10:30:100
#PermitTunnel no
#ChrootDirectory none
#VersionAddendum none
# 登录横幅（可自定义提示信息，默认关闭）
#Banner none
# 允许客户端传递locale环境变量
AcceptEnv LANG LC_*
# SFTP子系统配置（默认路径，无需修改）
Subsystem       sftp    /usr/lib/openssh/sftp-server
# 按用户自定义配置示例（无需则注释）
#Match User anoncvs
#       X11Forwarding no
#       AllowTcpForwarding no
#       PermitTTY no
#       ForceCommand cvs server
```


### 2. 核心配置逻辑拆解

这份文件与默认配置相比，主要的变动点如下：

| 配置项 | 设定值 | 影响说明 |
| --- | --- | --- |
| `PasswordAuthentication` | **yes** | **核心修改**：允许使用账号密码登录。 |
| `PubkeyAuthentication` | **no** | **核心修改**：禁用了 SSH 密钥登录（如果你想两者并存，请设为 `yes`）。 |
| `PermitRootLogin` | **yes** | 允许直接以 root 身份登录（方便但有风险）。 |
| `MaxAuthTries` | **3** | 安全增强：密码输错 3 次即断开，防止暴力破解。 |
| `UseDNS` | **no** | 性能优化：禁用 DNS 反向解析，极大提升连接速度，避免登录时的“卡顿感”。 |
| `LogLevel` | **VERBOSE** | 调试利器：记录更详细的日志，谁在尝试登录一目了然。 |

---

### 3. 如何应用此配置

如果你打算在服务器上启用这份配置，请按以下步骤操作：

#### 第一步：备份配置

在修改任何系统配置前，先给自己留好退路：

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

```

#### 第二步：写入配置

将你提供的文本覆盖写入 `/etc/ssh/sshd_config`。你可以使用 `vim` 或 `nano`：

```bash
sudo nano /etc/ssh/sshd_config

```

#### 第三步：语法检查

在重启服务前，检查配置文件是否有语法错误。如果没有输出，说明配置格式正确：

```bash
sudo sshd -t

```

#### 第四步：重启服务

应用更改：

```bash
sudo systemctl restart ssh
# 或者在某些系统上：
sudo systemctl restart sshd

```
