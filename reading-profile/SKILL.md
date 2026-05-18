---
name: reading-profile
description: 生成读书画像网页 — 基于微信读书数据，生成包含阅读统计、偏好分析、书架墙的静态 HTML 页面
version: 1.1.0
---

# reading-profile — 读书画像生成器

基于微信读书书架数据 + 阅读统计，生成一个好看的静态 HTML 读书画像页面。

## 前置条件

需要先安装 [微信读书 skill](https://cdn.weread.qq.com/skills/weread-skills.zip) 并配置好 API Key。

## Agent 工作流

当用户请求"生成读书画像"时，按以下步骤执行：

### Step 1: 拉取书架数据

调用微信读书 skill 的 `/shelf/sync` 接口，将完整回包保存为 `my-shelf-cache.json`：

```bash
curl -X POST "https://i.weread.qq.com/api/agent/gateway" \
  -H "Authorization: Bearer $WEREAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api_name": "/shelf/sync", "skill_version": "1.0.3"}'
```

保存到 `reading-profile/my-shelf-cache.json`。

### Step 2: 拉取阅读统计

调用 `/readdata/detail` 接口（mode=overall），将完整回包保存为 `my-readdata-cache.json`：

```bash
curl -X POST "https://i.weread.qq.com/api/agent/gateway" \
  -H "Authorization: Bearer $WEREAD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api_name": "/readdata/detail", "mode": "overall", "skill_version": "1.0.3"}'
```

保存到 `reading-profile/my-readdata-cache.json`。

### Step 3: LLM 生成画像标签

根据 Step 1 和 Step 2 的数据，由 LLM 分析用户的阅读偏好，生成 `my-profile-cache.json`：

```json
{
  "tags": ["标签1", "标签2", "标签3", ...],
  "oneLiner": "一句话总结用户的阅读风格和特点"
}
```

**生成规则：**
- `tags`：5-8 个标签，概括阅读风格（如"深度阅读者"、"经典主义"、"硬核科幻"等），基于分类偏好、阅读时长、读完率、偏爱作者等综合判断
- `oneLiner`：一句话（30-60字），描述用户阅读体系的核心特征，需具体到分类和作者倾向

保存到 `reading-profile/my-profile-cache.json`。

### Step 4: 生成 HTML

```bash
node generate-profile.js
```

生成 `reading-profile.html`，直接在浏览器打开即可。

## 数据文件说明

| 文件 | 来源 | 内容 |
|------|------|------|
| `my-shelf-cache.json` | `/shelf/sync` API 回包 | 书架完整列表，含 bookId、书名、作者、封面、分类、阅读时间等 |
| `my-readdata-cache.json` | `/readdata/detail?mode=overall` API 回包 | 总阅读时长、天数、读过/读完本数、偏好作者、偏好分类等 |
| `my-profile-cache.json` | LLM 生成 | 画像标签(tags)和一句话总结(oneLiner) |

## 页面功能

- **读书画像**：总时长、读过/读完本数、阅读天数、画像标签、分类偏好条形图、偏爱作者列表
- **书架墙**：所有书籍的封面瀑布流，支持按时间/分类/作者排序

## 技术特点

- 纯静态 HTML，零依赖，零后端
- 数据来自本地 JSON，隐私安全
- 可直接部署到 GitHub Pages 或任何静态托管
