# 岗位监测助手 — 部署指南

## 方式一：Docker 部署（推荐，支持爬虫）

### 前置条件
- 安装 Docker（https://www.docker.com/products/docker-desktop）
- 一个 DeepSeek API Key（https://platform.deepseek.com/）

### 部署步骤

```bash
# 1. 进入项目目录
cd job-monitor

# 2. 构建镜像
docker build -t job-monitor .

# 3. 启动容器
docker run -d \
  --name job-monitor \
  -p 3000:3000 \
  -v job-monitor-data:/app/data \
  -e OPENAI_API_KEY=sk-your-deepseek-key \
  -e OPENAI_BASE_URL=https://api.deepseek.com/v1 \
  -e OPENAI_MODEL=deepseek-chat \
  --restart unless-stopped \
  job-monitor

# 4. 查看日志
docker logs -f job-monitor

# 5. 访问 http://localhost:3000
```

### 使用 docker-compose（推荐）

```bash
# 创建 .env 文件
cat > .env << EOF
OPENAI_API_KEY=sk-your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 方式二：部署到 Railway

1. Fork 项目到 GitHub
2. 在 Railway（https://railway.app）导入仓库
3. 设置环境变量：
   - `OPENAI_API_KEY=sk-xxx`
   - `OPENAI_BASE_URL=https://api.deepseek.com/v1`
   - `OPENAI_MODEL=deepseek-chat`
   - `DATABASE_URL=file:/app/data/dev.db`
   - `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
4. Railway 会自动检测 Dockerfile 并部署

---

## 方式三：部署到自己的 VPS

```bash
# SSH 到服务器后
git clone <your-repo> job-monitor
cd job-monitor

# 安装 Docker（如果没有）
curl -fsSL https://get.docker.com | sh

# 部署
docker-compose up -d

# 配置 Nginx 反向代理（可选）
# 将域名指向 http://localhost:3000
```

---

## APK 连接配置

部署完成后，你会得到一个服务器地址，例如：
- `http://你的服务器IP:3000`
- `https://你的域名`

在 APK 中填入这个地址即可连接。

---

## 环境变量参考

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `file:/app/data/dev.db` |
| `OPENAI_API_KEY` | AI API Key（OpenAI/DeepSeek） | - |
| `OPENAI_BASE_URL` | AI API 地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | AI 模型名称 | `gpt-4o-mini` |
| `SMTP_HOST` | 邮件服务器 | - |
| `SMTP_PORT` | 邮件服务器端口 | `587` |
| `SMTP_USER` | 邮箱用户名 | - |
| `SMTP_PASS` | 邮箱密码/授权码 | - |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium 路径 | `/usr/bin/chromium-browser` |

## DeepSeek 配置

如果使用 DeepSeek API：
```
OPENAI_API_KEY=sk-你的deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

OpenAI 兼容接口也支持，修改 `OPENAI_BASE_URL` 即可。
