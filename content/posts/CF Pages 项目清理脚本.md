---
title: CF Pages 项目清理脚本
date: 2026-07-09T23:54:22+08:00
draft: false
tags:
  - 杂乱
  - 随笔
---
#  Cloudflare Pages 项目清理脚本教程

需要删除一个部署在 Cloudflare Pages 上的项目，但总是提示错误，错误信息是

`Your project has too many deployments to be deleted, follow this guide to delete them: https://cfl.re/3CXesln。`

## 原因

因为部署太多，导致无法删除，我测试得知，基本超过 100 次部署就会有这个问题。


## 特性

| 特性 | 说明 |
|------|------|
| **依赖检查** | 自动检查 curl 和 jq 是否已安装 |
| **帮助文档** | 运行 `./cleanup.sh --help` 查看详细说明 |
| **详细注释** | 每个参数和函数都有中文注释说明 |
| **交互式菜单** | 无需提前配置，运行时输入凭证 |
| **演练模式** | 可安全预览，不执行实际删除 |
| **错误恢复** | 完整的错误处理和提示 |
| **步骤跟踪** | 清晰显示每个步骤的进度 |
| **日志输出** | 彩色输出便于快速定位问题 |

## 使用方法

```bash
# 1. 赋予执行权限
chmod +x cleanup.sh

# 2. 查看帮助
./cleanup.sh --help

# 3. 运行脚本
./cleanup.sh

# 选择操作模式：
# 1) 交互式删除（实际删除）
# 2) 演练模式（模拟删除，推荐先用这个测试）
# 3) 退出
```


```
#!/bin/bash

# ==========================================
# Cloudflare Pages 项目删除脚本
# 安全版本 - 带交互确认
# ==========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==========================================
# 默认值
# ==========================================
# ACCOUNT_ID: Cloudflare 账户 ID
#   - 在 Cloudflare 仪表板右下角可以找到
#   - 格式：32 位十六进制字符串（如 cb21865b274fa7dd58f1bb1dc8c10236）
#   - 可以通过脚本交互式输入，或硬编码在此处
ACCOUNT_ID=""

# PROJECT_NAME: Cloudflare Pages 项目名称
#   - 你想要删除的项目的名称
#   - 示例：yufen-tingyong, my-blog, portfolio 等
#   - 与 Cloudflare 仪表板中显示的名称必须完全一致
PROJECT_NAME=""

# API_TOKEN: Cloudflare API Token（用于身份验证）
#   - 在 https://dash.cloudflare.com/profile/api-tokens 生成
#   - 必须拥有以下权限：
#     - Account.Pages:Edit (编辑 Pages 项目)
#     - Account.User:Read (读取用户信息，用于 Token 验证)
#   - ⚠️ 安全提示：不要在公开代码中硬编码，应该通过环境变量或交互式输入
#   - 示例：cfut_9bCuG9C8u8uLFc6LLRZslPNoVhdXMicN4GQ2sdu28d5979ee
API_TOKEN=""

# KEEP_COUNT: 保留的最新部署数量
#   - 0：删除所有部署（删除项目前必须删除所有部署）
#   - 1-10：保留最新的 N 个部署，删除其他的
#   - 示例：如果有 25 个部署，设为 5 会保留最新 5 个，删除 20 个
#   - 注意：此脚本的主要功能是删除项目，所以通常设为 0
KEEP_COUNT=0

# DRY_RUN: 演练/模拟模式（安全测试）
#   - false：实际执行删除操作（默认值，真实删除）
#   - true：仅显示将要执行的操作，不实际删除任何内容
#   - 建议：第一次运行时设为 true，预览后再改为 false 实际执行
#   - 通常通过脚本菜单选择，不需要手动修改
DRY_RUN=true

# ==========================================
# 函数定义
# ==========================================

print_header() {
  echo -e "${BLUE}"
  echo "╔═══════════════════════════════════════════════════╗"
  echo "║     Cloudflare Pages 项目删除工具                 ║"
  echo "║     (Safe Deletion Script)                       ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

confirm() {
  local prompt=$1
  local response
  
  while true; do
    echo -n -e "${YELLOW}$prompt (yes/no): ${NC}"
    read -r response
    case "$response" in
      [yY][eE][sS]|[yY])
        return 0
        ;;
      [nN][oO]|[nN])
        return 1
        ;;
      *)
        echo -e "${RED}请输入 yes 或 no${NC}"
        ;;
    esac
  done
}

# 输入 API 凭证
input_credentials() {
  print_section "步骤 1: 配置 API 凭证"
  
  echo -e "${YELLOW}请输入以下信息（从 Cloudflare 控制面板获取）：${NC}"
  echo ""
  
  # 输入 Account ID
  echo -n "Account ID: "
  read -r ACCOUNT_ID
  [ -z "$ACCOUNT_ID" ] && echo -e "${RED}✗ Account ID 不能为空${NC}" && return 1
  
  # 输入项目名称
  echo -n "Project Name: "
  read -r PROJECT_NAME
  [ -z "$PROJECT_NAME" ] && echo -e "${RED}✗ Project Name 不能为空${NC}" && return 1
  
  # 输入 API Token（隐藏输入）
  echo -n "API Token: "
  read -rs API_TOKEN  # -s 选项隐藏输入
  echo ""
  [ -z "$API_TOKEN" ] && echo -e "${RED}✗ API Token 不能为空${NC}" && return 1
  
  echo ""
  echo -e "${GREEN}✓ 凭证已输入${NC}"
  return 0
}

# 验证 API Token 有效性
verify_token() {
  print_section "步骤 2: 验证 API 凭证"
  
  echo -e "${YELLOW}→ 正在验证 Token...${NC}"
  
  # 调用 Cloudflare API 验证 Token
  local verify_result
  verify_result=$(curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer $API_TOKEN" \
    -w "\n%{http_code}")
  
  local http_code=$(echo "$verify_result" | tail -n1)
  local response=$(echo "$verify_result" | sed '$d')
  
  if [ "$http_code" != "200" ]; then
    echo -e "${RED}✗ Token 验证失败 (HTTP $http_code)${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    return 1
  fi
  
  local verify_success=$(echo "$response" | jq -r '.success // false')
  if [ "$verify_success" != "true" ]; then
    echo -e "${RED}✗ Token 无效${NC}"
    echo "$response" | jq '.errors'
    return 1
  fi
  
  echo -e "${GREEN}✓ Token 有效${NC}"
  return 0
}

# 获取项目部署列表
get_deployments() {
  print_section "步骤 3: 获取部署列表"
  
  local api_base="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME"
  
  echo -e "${YELLOW}→ 正在获取部署列表...${NC}"
  
  # 调用 API 获取所有部署
  local deployments_result
  deployments_result=$(curl -s "$api_base/deployments" \
    -H "Authorization: Bearer $API_TOKEN" \
    -w "\n%{http_code}")
  
  local http_code=$(echo "$deployments_result" | tail -n1)
  local deployments=$(echo "$deployments_result" | sed '$d')
  
  if [ "$http_code" != "200" ]; then
    echo -e "${RED}✗ 获取部署列表失败 (HTTP $http_code)${NC}"
    echo "$deployments" | jq '.' 2>/dev/null || echo "$deployments"
    return 1
  fi
  
  local api_success=$(echo "$deployments" | jq -r '.success // false')
  if [ "$api_success" != "true" ]; then
    echo -e "${RED}✗ API 返回错误${NC}"
    echo "$deployments" | jq '.errors'
    return 1
  fi
  
  # 统计总部署数
  TOTAL=$(echo "$deployments" | jq -r '.result | length')
  echo -e "${GREEN}✓ 当前项目共有 $TOTAL 个部署${NC}"
  echo ""
  
  if [ "$TOTAL" -eq 0 ]; then
    return 0
  fi
  
  # 显示最近的 10 个部署
  echo -e "${YELLOW}最近的 10 个部署：${NC}"
  echo "$deployments" | jq -r '.result[0:10][] | 
    "  • \(.id | .[0:8])... - \(.created_on) - Status: \(.status)"'
  
  if [ "$TOTAL" -gt 10 ]; then
    echo -e "${YELLOW}  ... 还有 $((TOTAL - 10)) 个部署 ...${NC}"
  fi
  
  echo ""
  # 保存部署列表供后续使用
  echo "$deployments" > /tmp/deployments.json
  return 0
}

# 预览将要删除的内容
preview_deletion() {
  print_section "步骤 4: 预览将要删除的内容"
  
  if [ "$TOTAL" -eq 0 ]; then
    echo -e "${YELLOW}→ 没有部署需要删除${NC}"
    echo -e "${GREEN}→ 项目将被直接删除${NC}"
    return
  fi
  
  local skip_count=$KEEP_COUNT
  local delete_count=$((TOTAL - skip_count))
  
  # 显示警告信息
  echo -e "${RED}将要删除的内容：${NC}"
  echo -e "${RED}  • 删除 $delete_count 个部署${NC}"
  echo -e "${RED}  • 删除项目: $PROJECT_NAME${NC}"
  echo -e "${RED}  • Account ID: $ACCOUNT_ID${NC}"
  echo ""
  echo -e "${YELLOW}保留的部署：${NC}"
  echo -e "${YELLOW}  • 最新的 $KEEP_COUNT 个部署${NC}"
  
  if [ "$KEEP_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}  • （无，将删除所有部署）${NC}"
  fi
  
  echo ""
}

# 删除所有部署
delete_deployments() {
  print_section "步骤 5: 删除部署"
  
  if [ "$TOTAL" -eq 0 ]; then
    echo -e "${YELLOW}→ 没有部署需要删除，跳过此步骤${NC}"
    return 0
  fi
  
  if ! confirm "是否开始删除部署？"; then
    echo -e "${RED}✗ 已取消操作${NC}"
    return 1
  fi
  
  local api_base="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME"
  local skip_count=$KEEP_COUNT
  local delete_ids=$(cat /tmp/deployments.json | jq -r '.result[].id' | tail -n +$((skip_count + 1)))
  
  local total_delete=$(echo "$delete_ids" | grep -c .)
  local current=0
  local success_count=0
  local fail_count=0
  
  echo ""
  echo -e "${YELLOW}开始删除部署...${NC}"
  
  # 逐个删除部署
  echo "$delete_ids" | while read -r id; do
    [ -z "$id" ] && continue
    current=$((current + 1))
    
    echo -n -e "${YELLOW}  [$current/$total_delete] 删除 ${id:0:8}... ${NC}"
    
    # 演练模式：仅显示，不实际执行
    if [ "$DRY_RUN" = true ]; then
      echo -e "${GREEN}[DRY RUN]${NC}"
      sleep 0.3
      continue
    fi
    
    # 实际删除：调用 API 删除部署
    local delete_resp
    delete_resp=$(curl -s -X DELETE "$api_base/deployments/$id" \
      -H "Authorization: Bearer $API_TOKEN" \
      -w "\n%{http_code}")
    
    local http_code=$(echo "$delete_resp" | tail -n1)
    local response=$(echo "$delete_resp" | sed '$d')
    local delete_success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$delete_success" == "true" ] && [ "$http_code" = "200" ]; then
      echo -e "${GREEN}✓${NC}"
      success_count=$((success_count + 1))
    else
      echo -e "${RED}✗${NC}"
      echo "$response" | jq -r '.errors[0].message // "未知错误"' | sed 's/^/    /'
      fail_count=$((fail_count + 1))
    fi
    
    # 延迟 0.8 秒，避免 API 限流
    sleep 0.8
  done
  
  echo ""
  echo -e "${GREEN}✓ 成功删除: $success_count${NC}"
  [ "$fail_count" -gt 0 ] && echo -e "${RED}✗ 删除失败: $fail_count${NC}"
  
  # 等待后再检查，确保 API 已处理
  echo -e "${YELLOW}→ 等待 3 秒后重新检查...${NC}"
  sleep 3
  
  return 0
}

# 删除项目本身
delete_project() {
  print_section "步骤 6: 删除项目"
  
  if ! confirm "确定删除项目 \"$PROJECT_NAME\" 吗？此操作不可撤销！"; then
    echo -e "${RED}✗ 已取消删除项目${NC}"
    return 1
  fi
  
  local api_base="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME"
  
  echo -e "${YELLOW}→ 正在删除项目...${NC}"
  
  # 演练模式：不实际执行
  if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}[DRY RUN] 项目删除请求已准备，但未实际执行${NC}"
    return 0
  fi
  
  # 实际删除：调用 API 删除项目
  local delete_result
  delete_result=$(curl -s -X DELETE "$api_base" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}")
  
  local http_code=$(echo "$delete_result" | tail -n1)
  local response=$(echo "$delete_result" | sed '$d')
  local delete_success=$(echo "$response" | jq -r '.success // false')
  
  if [ "$delete_success" ==
  if [ "$delete_success" == "true" ] && [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 项目已成功删除${NC}"
    return 0
  else
    echo -e "${RED}✗ 项目删除失败${NC}"
    echo "HTTP Code: $http_code"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    echo -e "${YELLOW}常见原因：${NC}"
    echo -e "${YELLOW}  1. 项目中仍有部署（请确保上面已成功删除所有部署）${NC}"
    echo -e "${YELLOW}  2. Token 权限不足（需要 Pages:Edit 权限）${NC}"
    echo -e "${YELLOW}  3. 项目 ID 或账户 ID 错误${NC}"
    
    return 1
  fi
}

# 显示删除完成总结
show_summary() {
  print_section "删除总结"
  
  echo -e "${GREEN}✓ 项目 \"$PROJECT_NAME\" 已成功删除！${NC}"
  echo ""
  echo -e "${BLUE}删除的内容：${NC}"
  echo -e "  • Account: $ACCOUNT_ID"
  echo -e "  • Project: $PROJECT_NAME"
  echo -e "  • Deployments: $TOTAL 个"
  echo ""
}

# 显示操作模式菜单
show_menu() {
  print_header
  echo ""
  echo -e "${YELLOW}选择操作模式：${NC}"
  echo "  1) 交互式删除（推荐）"
  echo "  2) 演练模式（模拟删除，不实际执行）"
  echo "  3) 退出"
  echo ""
  echo -n "请选择 [1-3]: "
}

# ==========================================
# 主程序入口
# ==========================================

# 主函数：控制整个流程
main() {
  # 显示菜单并让用户选择操作模式
  while true; do
    show_menu
    read -r choice
    
    case "$choice" in
      1)
        # 实际删除模式
        DRY_RUN=false
        break
        ;;
      2)
        # 演练模式（模拟删除）
        DRY_RUN=true
        echo -e "${BLUE}[DRY RUN] 模式已启用，所有操作都不会真实执行${NC}"
        break
        ;;
      3)
        # 用户选择退出
        echo -e "${YELLOW}已退出${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}✗ 无效选择，请重试${NC}"
        ;;
    esac
  done
  
  # ========== 开始执行删除流程 ==========
  
  # 步骤 1：输入 API 凭证
  input_credentials || exit 1
  echo ""
  
  # 步骤 2：验证 Token 有效性
  verify_token || exit 1
  echo ""
  
  # 步骤 3：获取部署列表
  get_deployments || exit 1
  echo ""
  
  # 步骤 4：预览将要删除的内容
  preview_deletion
  echo ""
  
  # 步骤 4.5：最终确认
  if ! confirm "确认上述操作？"; then
    echo -e "${RED}✗ 已取消操作${NC}"
    exit 0
  fi
  
  echo ""
  
  # 步骤 5：删除所有部署
  delete_deployments || exit 1
  echo ""
  
  # 步骤 6：删除项目
  delete_project || exit 1
  echo ""
  
  # 显示删除完成总结
  show_summary
}

# ==========================================
# 脚本执行入口
# ==========================================

# 检查依赖工具
check_dependencies() {
  echo -e "${YELLOW}→ 检查依赖工具...${NC}"
  
  # 检查 curl
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ 未找到 curl，请先安装${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install curl"
    echo "  macOS: brew install curl"
    exit 1
  fi
  
  # 检查 jq (JSON 处理工具)
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ 未找到 jq，请先安装${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    exit 1
  fi
  
  echo -e "${GREEN}✓ 所有依赖工具已安装${NC}"
}

# 显示脚本使用说明
show_usage() {
  cat << EOF
${BLUE}使用说明：${NC}

${YELLOW}环境要求：${NC}
  - bash 4.0+
  - curl
  - jq (JSON 命令行处理工具)

${YELLOW}安装依赖：${NC}
  Ubuntu/Debian:
    sudo apt-get install curl jq

  macOS:
    brew install curl jq

${YELLOW}快速开始：${NC}
  1. 赋予脚本执行权限：
     chmod +x cleanup.sh

  2. 运行脚本：
     ./cleanup.sh

  3. 按照提示输入信息即可

${YELLOW}API Token 获取方式：${NC}
  1. 访问：https://dash.cloudflare.com/profile/api-tokens
  2. 点击 "Create Token"
  3. 选择模板 "Edit Cloudflare Workers"
  4. 修改权限：确保包含 "Account.Pages:Edit"
  5. 设置 TTL（可选）
  6. 创建并复制 Token

${YELLOW}Account ID 获取方式：${NC}
  1. 登录 Cloudflare 控制面板
  2. 进入任意网站或账户
  3. 在右下角可以看到 "Account ID"
  4. 或者访问：https://dash.cloudflare.com/

${YELLOW}支持的操作：${NC}
  • 删除单个或多个部署
  • 保留最新的 N 个部署
  • 删除整个 Pages 项目
  • 演练模式（安全预览）
  • 完整的错误处理和日志

${YELLOW}安全提示：${NC}
  ⚠️  不要在公开代码仓库中包含 API Token
  ⚠️  首次运行建议使用"演练模式"预览
  ⚠️  删除项目后无法恢复，请谨慎操作
  ⚠️  建议为 Token 设置 IP 白名单和 TTL

EOF
}

# 如果传递了 --help 或 -h 参数，显示帮助信息
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  show_usage
  exit 0
fi

# 检查依赖工具
check_dependencies
echo ""

# 运行主程序
main

```


