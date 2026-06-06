---
title: Tailscale开机自动内网穿透
date: 2026-06-01T00:18:30+08:00
draft: false
tags:
  -
---
以下是你需要的完整存档文档，可直接保存为 `.md` 文件或打印备用。

---

# Tailscale 无人值守开机自启动配置文档

## 📌 目标
让 Windows 电脑**开机后停留在登录界面（未输入密码、未进入桌面）** 时，已自动连入 Tailscale 内网，可被远程桌面、Ping 等访问。

## 🔧 实现方式
利用 Windows 任务计划程序的“不管用户是否登录都要运行”特性，在系统启动时以最高权限静默执行 Tailscale 后台连接命令，完成设备认证入网。

## 📋 前提条件
- 已安装 Tailscale 客户端（默认路径 `C:\Program Files\Tailscale\`）
- 拥有 Tailscale 账号，并能登录管理后台
- 当前 Windows 账户有管理员权限

---

## 1️⃣ 生成 Tailscale Auth Key（一次性密钥）
1. 浏览器打开：`https://login.tailscale.com/admin/settings/keys`
2. 点击 **Generate auth key…**
3. 按下图设置（**严格遵守**）：
   - 描述（Description）：`Windows无人值守`
   - ✅ 勾选 **Reusable**（如果要一次性密钥则**不勾选**，本次推荐不勾选）
   - ❌ **取消** Ephemeral（不要临时设备）
   - ✅ 勾选 **Pre-approved**（自动批准，免手动同意）
4. 点击生成，立即复制出现的密钥（格式 `tskey-auth-xxxxxx`），**保存到安全地方**。
5. 如果生成时未勾选 Reusable（推荐），则该密钥使用一次后即作废，后续无需担心泄露。

> ⚠️ 本文档演示中使用的密钥为：
> `tskey-auth-kkrc3aw3Ti11CNTRL-BCCc3kfoWF6JhM4vLauF6RzK1QYWMuBG`
> **该密钥已实际使用，若为你个人存档，请换成你新生成的密钥，并妥善保管此文档。**

---

## 2️⃣ 获取当前 Windows 用户的 SID
1. 以管理员身份打开 PowerShell，执行：
   ```powershell
   whoami /user
   ```
2. 记录输出的 SID，本文档示例：
   ```
   用户名: desktop-k6ejoe9\file
   SID:    S-1-5-21-1620133075-873503934-2889428347-1001
   ```

---

## 3️⃣ 创建计划任务（导入 XML）
### 完整任务 XML
以下为经过验证的完整任务配置，已包含正确的程序路径、账户 SID、启动参数和无限制运行策略。

```xml
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Author>DESKTOP-K6EJOE9\File</Author>
    <URI>\Tailscale-AutoConnect</URI>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT30S</Delay>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-21-1620133075-873503934-2889428347-1001</UserId>
      <LogonType>Password</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>5</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\Program Files\Tailscale\tailscale.exe</Command>
      <Arguments>up --unattended --authkey=tskey-auth-kkrc3aw3Ti11CNTRL-BCCc3kfoWF6JhM4vLauF6RzK1QYWMuBG</Arguments>
    </Exec>
  </Actions>
</Task>
```

### 导入步骤
1. 将以上 XML 内容复制到文本编辑器，保存为 `Tailscale-AutoConnect.xml`（编码 `UTF-16` 或 `Unicode`）。
2. 按 `Win+R`，输入 `taskschd.msc` 打开任务计划程序。
3. 右侧点击 **导入任务…**，选择刚保存的 XML 文件，确定。
4. 系统会弹出密码输入框（因为任务设置“不管用户是否登录”），**输入你 Windows 账户的登录密码**，确定。
5. 导入完成后，可在任务计划库中看到名为 `Tailscale-AutoConnect` 的任务。

### 关键配置说明
- **安全选项**：`不管用户是否登录都要运行` + `以最高权限运行`，确保在登录界面也能执行。
- **程序路径**：**必须使用 `tailscale.exe`**（非 `tailscale-ipn.exe`），后者是图形界面程序，不接受命令行参数。
- **触发器**：系统启动后延迟 30 秒执行，等待网卡初始化。
- **条件**：所有条件均已清空，不会因电池、空闲状态而停止。
- **设置**：运行时间无限制（`PT0S`），失败后 1 分钟自动重试（最多 5 次）。

---

## 4️⃣ 设置密钥永久有效
1. 进入 Tailscale 管理后台 `Settings → Keys`。
2. 找到本次使用的 Auth Key（`tskey-auth-kkrc...`）。
3. 点击右侧 `…` → **Disable key expiry**。
4. 确认后，该设备使用此密钥认证后将永久在线，不会因密钥过期掉线。

---

## 5️⃣ 验证
1. **重启电脑**，停留在登录界面（不输入密码进入桌面）。
2. 在另一台设备（手机或其他电脑）上打开 Tailscale 客户端，查看设备列表中是否出现该机器（名称可能为 `desktop-k6ejoe9`），并已获得 `100.x.x.x` 的 IP。
3. 使用命令行或远程桌面工具通过该 IP 访问，若能 Ping 通或远程桌面连接成功，则配置完成。

---

## 6️⃣ 维护与管理
### 🔇 临时禁用
进入任务计划程序 → 找到 `Tailscale-AutoConnect` → 右键 → **禁用**。重启后不再自动连接。

### 🔇 再次启用
右键 → **启用**。

### 🔄 更换密钥
1. 在 Tailscale 后台吊销旧密钥，生成新 Auth Key。
2. 编辑任务属性 → 操作 → 编辑，将 **添加参数** 中的密钥替换为新值，确定。

### 🗑 完全删除
任务计划程序中右键删除任务，同时在 Tailscale 后台 Machines 页面将该设备移除。

---

## 7️⃣ 常见问题排查
| 现象 | 可能原因 | 解决方法 |
|------|----------|----------|
| 任务上次运行结果显示 `0x1` | 程序路径错误（用了 `tailscale-ipn.exe`） | 改为 `tailscale.exe` |
| 手动运行命令无报错但设备未上线 | 密钥已使用过（一次性密钥）或未批准 | 检查后台密钥状态，必要时重新生成 |
| 任务未触发（从未运行） | 触发器未设置或任务未启用 | 检查触发器为“启动时”，任务已启用 |
| 笔记本拔电后掉线 | 条件中“如果切换到电池电源则停止”未取消 | 确保条件页全部清空 |
| 运行72小时后自动停止 | 超时限制为 PT72H | 在设置页取消运行时间限制，或设为 `PT0S` |

---

## 8️⃣ 安全提醒
- 本文档包含 **Auth Key** 和 **Windows SID**，请将其视为敏感信息，妥善保存，勿公开分享。
- 如果是一次性密钥，认证成功后密钥自动作废，即使文档泄露也无法再用于添加新设备。
- 建议定期检查 Tailscale 后台设备列表，移除不认识的主机。

---

**配置完成日期**：2026年5月11日  
**验证状态**：✅ 已验证可用