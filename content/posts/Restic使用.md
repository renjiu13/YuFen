---
title: Restic使用
date: 2026-06-29T22:34:16+08:00
draft: false
tags:
  - 备份
  - 常用
  - Linux
  - 关注
---
<img src="https://66.122915.xyz/i/2026/06/29/20260629234607891-0.webp" alt="20260629234607891" loading="lazy" style="width:100%;max-width:var(--size);height:auto;display:block;--size:600px;">

<mark style="background:#f38181">借鉴或引用的文章：</mark>
-  [Home | AList文档](https://alistgo.com/zh/)
- [对象存储 - OpenList 文档](https://doc.oplist.org/guide/advanced/s3)
- [低成本的数据备份方案 | 唐玥璨](https://www.tangyuecan.com/2024/12/26/%E4%BD%8E%E6%88%90%E6%9C%AC%E7%9A%84%E6%95%B0%E6%8D%AE%E5%A4%87%E4%BB%BD%E6%96%B9%E6%A1%88#%E5%AE%89%E8%A3%85restic)
- [Vim是最强代码编辑器 | 唐玥璨](https://www.tangyuecan.com/2025/03/03/vim%E6%98%AF%E6%9C%80%E5%BC%BA%E4%BB%A3%E7%A0%81%E7%BC%96%E8%BE%91%E5%99%A8)

[Restic](https://restic.net/)工具是一个自带快照的备份工具，不仅仅可以实现增量备份、取消存储冗余、压缩备份，同时在备份过程中可以实现对文件权限、软连接等等属性的全量保存，最关键的是对海量小文件在备份时候会被整合为固定大小的块进行存储，所以无论原始文件是什么样子，最终备份后的文件是一堆特定大小的块的文件。

这样的特性使得这个东西非常适合云备份和迁移海量小文件的，一方面特定大小的块包装最终输出的文件的数量既不会特别大，也不会特别多；

具体的操作方案如下：

## 安装Restic

<mark style="background:rgba(240, 200, 0, 0.2)">以Debian的系统为例：</mark>


```
# 更新并安装 restic
apt update && apt install restic -y

# 验证安装是否成功
restic version
```


## 初始化仓库

我喜欢直接创建一个`config`文件，方便加载变量。

```
# 创建存储变量目录
mkdir -p /opt/restic

# 创建专门负责图床对象存储的config
vim /opt/restic/restic_tuchuang.sh
```

`VIM`使用教程[点击直达](https://www.cnblogs.com/clnchanpin/p/19316690#%E7%A4%BA%E4%BE%8B%202%EF%BC%9A%E5%88%9B%E5%BB%BA%E5%B9%B6%E6%89%93%E5%BC%80%E6%96%B0%E6%96%87%E4%BB%B6)

<mark style="background:#f38181">下入如下内容：</mark>

```
# S3 访问密钥 ID
export AWS_ACCESS_KEY_ID="JsZgU0XkYY8QgnbY4utC"

# S3 访问密钥
export AWS_SECRET_ACCESS_KEY="beNK/clOe/Bomg8Fb+7rbssL9fLgC2b7Oe01gs+"

# Restic 客户端数据加密密码
export RESTIC_PASSWORD="123456789"

# 备份存储库路径（桶名是 openlist，后面接中文测试文件夹）
export RESTIC_REPOSITORY="s3:http://100.100.1.8:5246/openlist/玩客云备份/图床"
```


<mark style="background:#f38181">配置文件创建好后，必须分别引入并初始化一次：</mark>


```
# 初始化图床数据仓库
source /opt/restic/restic_tuchuang.sh && restic init
```

## 备份

<mark style="background:#f38181">注意，重要的事情说三遍！！！</mark>
备份前需要加载`创建专门负责图床对象存储的config`，告知系统你的操作是面向那个存储目的地的。

```
# 必须先引入一次环境变量
source /opt/restic/restic_tuchuang.sh


# 备份图床数据，并打上“图床”标签
restic backup /opt/Pic --tag "图床数据"
```

## 常用命令

### 查看

每一次成功执行了一个备份之后都会形成一个快照，后续的备份就是对前一个快照的**增量备份**


```
# 查询所有快照
restic snapshots

# 查询具体tag、host、path的快照
restic snapshots --tag xxx --host xxx --path="/data"
```

### 删除

```
# 移除快照
restic forget 快照ID

# 仅仅移除快照后原始的文件其实还在，执行prune清除没有被引用的文件
restic prune

# 或者同时清除与移除
restic forget 快照ID -prune

# 可以使用规则批量删除快照，保留最近10次快照
restic forget --keep-last 10 --prune

# 当然也可以通过tag、host、path制定删除的范围
restic forget --keep-last 10 --prune --tag xxx --host xxx --path="/data"
```

### 恢复

<mark style="background:#f38181">恢复数据需要用快照ID进行恢复：</mark>


```
# 恢复文件至指定的路径，注意：如果你的快照是/data,最终恢复的路径应该是：/tmp/restore-work/data
restic restore 快照ID --target /tmp/tuchuang
```


当然也可以使用最新的快照进行恢复


```
# 同时也可以用path和tag进行过滤
restic restore latest --target /tmp/restore-work --path "/data" --host xxx
```


### 验证


<mark style="background:#f38181">定期验证备份库的完整性和一致性是确保备份可靠性的关键：</mark>

#### 检查完整性

```bash
# 日常检查（速度快）
restic check

# 检查备份库中的所有文件和元数据 每月一次完整验证（确保万无一失）
restic check --read-data

# 只检查数据结构，不读取实际数据（速度快）
restic check --read-data-subset=10%
```

**参数说明：**
- `--read-data`：读取所有数据块验证完整性，最全面但耗时最长
- `--read-data-subset=X%`：只随机检查 X% 的数据块，平衡速度和准确性
- 不加参数：只检查元数据和索引，最快但不检查实际数据

#### 查看统计信息

```bash
# 查看备份库中的快照统计
restic snapshots

# 查看备份库占用空间和数据统计
restic stats

# 查看特定快照的详细信息
restic snapshots --json
```

#### 恢复测试验证

```bash
# 定期恢复一个快照到临时目录进行验证
restic restore latest --target /tmp/verify-backup --host xxx

# 验证恢复的文件完整性
diff -r /data /tmp/verify-backup/data

# 清理临时验证数据
rm -rf /tmp/verify-backup
```



**错误信息处理：** 如果 `restic check` 发现错误，通常需要：
1. 检查存储后端的网络连接
2. 确认存储空间充足
3. 查看日志获取具体错误信息
4. 必要时联系云存储供应商

**性能优化：** 对于大型备份库，建议：
- 在非工作时间执行验证
- 使用 `--read-data-subset` 而不是完整 `--read-data`
- 定期增量验证而非一次性全量检查


### 场景

<mark style="background:#f38181">场景 A：</mark>我想保留最近的 10 次备份，更早的自动删掉（最常用）

```
restic forget --keep-last 10 --prune
```


- `--keep-last 10`：帮我数数，最新的 10 个账本（快照）留下，10 个以前的全部抹去。
- `--prune`：抹去之后，顺便把那些老账本专属的数据块直接从 OpenList 里抠出来删掉，腾出空间。


<mark style="background:#f38181">场景 B：</mark>我就想干掉某一次特定的备份
先运行 `restic snapshots` 查看你想删的快照 ID（比如是 `a1b2c3d4`）：

```
# 同时抹去记录并清理空间
restic forget a1b2c3d4 --prune
```

<mark style="background:#f38181">场景 C：</mark>玩客云上的图床不小心被误删了，我要还原最新的备份

```
# 将最新一次的备份，还原到本地的 /tmp/tuchuang 目录下
restic restore latest --target /tmp/tuchuang
```


- `latest`：代表“最新的一次备份账本”，你不需要去查复杂的 ID。
- `--target /tmp/tuchuang`：把文件全部解压到这个临时地方。去这里面找找，你的图床文件（`opt/Pic`）就完好无损地回来了。

<mark style="background:#f38181">场景D ：</mark>我想还原很久以前的某一次备份
先用 `restic snapshots` 查到那次备份的快照 ID（比如是 `e5f6g7h8`）：

```
# 用特定的快照 ID 进行恢复
restic restore e5f6g7h8 --target /tmp/tuchuang
```





## 定时备份

为了让定时任务执行时结构更清晰，并能完整记录备份日志，建议先创建一个专门用于自动执行的 Shell 脚本。

先创建一个专门存储脚本的地方：

```
# 专门存储脚本
mkdir -p /opt/shell

# 打开不存在的脚本文件（退出自动保存）
vim /opt/shell/crontab_restic_tuchuang.sh
```

按`i`键开始编辑 写入：

```
#!/bin/bash

# 引入图床环境配置文件中的变量
source /opt/restic/restic_tuchuang.sh

# 执行备份：指定目录，打上“图床数据”标签
restic backup /opt/Pic --tag "图床数据"
```

写入完成后，按下 `Esc` 键，输入 `:wq` 回车保存并退出。

<mark style="background:#f38181">开始写入什么时间执行：</mark>

```bash
# 赋予脚本可执行权限
chmod +x /opt/shell/crontab_restic_tuchuang.sh

# 打开当前 root 用户的定时任务编辑器
crontab -e

# 每天凌晨 2:30 自动运行图床备份脚本，并把标准输出和错误日志追加到指定的日志文件中
30 2 * * * /opt/shell/crontab_restic_tuchuang.sh >> /var/log/restic_tuchuang_cron.log 2>&1

```

不懂请看[crontab命令教程](https://www.runoob.com/linux/linux-comm-crontab.html)

---

## 查看日志

日志重定向（`>> /var/log/...`），当定时任务触发后，通过以下命令检查备份是否成功执行

```bash
# 查看定时任务的执行日志
cat /var/log/restic_tuchuang_cron.log
```



## 杂乱

### 查看大小

在执行命令前，请记得先引入你的环境变量（告诉 Restic 你要看哪个仓库）：

```bash
# 1. 引入图床仓库的环境变量
source /opt/restic/restic_tuchuang.sh

# 2. 查看仓库统计大小
restic stats
```
- **`restore-size` 模式**：这是默认模式，它算的是**虚拟堆积总量**。
    
- **大白话含义**：它告诉你，你目前一共备份了 `2` 次（2 个快照），里面总共包含了 `70` 个文件。**如果你现在把这两个快照分别恢复到两个不同的文件夹里，它们在你的玩客云硬盘上总共会吃掉 `26.448 MiB` 的空间。**
    
- **为什么这么大**：因为如果同一个文件在两次备份中都没有变，它在这里会被重复计算两次。

查看原始文件的总大小（未去重、未压缩前的总堆积大小）：

```bash
# 3. 原本该有多大
restic stats --mode raw-data
```

- **`raw-data` 模式**：这才是算账的**物理真实总量**，代表 OpenList 桶里到底堆了多少物理积木。
    
- **`Total Blob Count: 45`**：你的 70 个文件经过 Restic 去重、切块后，在底层其实被拆成了 45 个唯一的“数据数据块（Blobs）”。
    
- **`Total Uncompressed Size: 13.239 MiB`**：这 45 个唯一的积木块，在没有压缩前的内容总大小是 13.239 MiB（这就是去重后的真实文件体积）。
    
- **`Total Size: 8.152 MiB` ⭐ 最核心指标**：**这就是你的 OpenList 对象存储桶目前实际被占用的物理空间！**



<mark style="background:#f38181">示例：</mark>

```bash
root@onecloud:~# source /opt/restic/restic_tuchuang.sh
root@onecloud:~# restic stats
repository 7ce1369d opened (version 2, compression level auto)
[0:00] 100.00%  2 / 2 index files loaded
scanning...
Stats in restore-size mode:
     Snapshots processed:  2
        Total File Count:  70
              Total Size:  26.448 MiB
root@onecloud:~# restic stats --mode raw-data
repository 7ce1369d opened (version 2, compression level auto)
[0:00] 100.00%  2 / 2 index files loaded
scanning...
Stats in raw-data mode:
     Snapshots processed:  2
        Total Blob Count:  45
 Total Uncompressed Size:  13.239 MiB
              Total Size:  8.152 MiB
    Compression Progress:  100.00%
       Compression Ratio:  1.62x
Compression Space Saving:  38.42%

```



