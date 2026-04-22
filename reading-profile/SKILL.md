---
name: reading-profile
description: 生成读书画像网页 — 基于微信读书数据，生成包含阅读统计、偏好分析、书架墙的静态 HTML 页面
version: 1.0.0
---

# reading-profile — 读书画像生成器

基于微信读书书架数据 + 阅读统计，生成一个好看的静态 HTML 读书画像页面。

## 前置条件

需要先安装 [微信读书 skill](https://cdn.weread.qq.com/skills/weread-skills.zip) 并配置好 API Key。

## 使用流程

### 1. 拉取书架数据

使用微信读书 skill 的 `/shelf/sync` 接口拉取完整书架（含封面、分类、阅读时间），保存为 `my-shelf-cache.json`：

```bash
# 通过 Claude Code 的微信读书 skill 拉取并缓存
# 确保 my-shelf-cache.json 在本目录下，格式包含：
# { books: [{ bookId, title, author, cover, category, finishReading, secret, readUpdateTime }] }
```

### 2. 配置阅读统计

编辑 `generate-profile.js` 中的 `stats` 对象，填入你的阅读统计数据（可通过微信读书 skill 的 `/readdata/detail?mode=overall` 获取）。

### 3. 生成页面

```bash
node generate-profile.js
```

生成 `reading-profile.html`，直接在浏览器打开即可。

## 页面功能

- **读书画像**：总时长、读过/读完本数、阅读天数、画像标签、分类偏好条形图、偏爱作者列表
- **书架墙**：所有书籍的封面瀑布流，支持按时间/分类/作者排序

## 技术特点

- 纯静态 HTML，零依赖，零后端
- 数据来自本地 JSON，隐私安全
- 可直接部署到 GitHub Pages 或任何静态托管
