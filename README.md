# reading-mate

> 用微信读书数据，生成一张属于你的读书画像网页。

**[👀 在线示例](https://frankliu20.github.io/ai-reading-mate/)**

---

## 使用方法

这是一个 [Claude Code](https://claude.ai/code) skill，让你的 agent 帮你跑就行。

### 第一步：安装微信读书 Skill

复制以下命令给你的 agent：

```
/install-skill https://cdn.weread.qq.com/skills/weread-skills.zip
```

然后设置 API Key：

```
export WEREAD_API_KEY=wrk-xxxxxxxxxx
```

### 第二步：安装本 Skill

```
/install-skill https://github.com/frankliu20/ai-reading-mate/tree/main/reading-profile
```

### 第三步：生成

```
帮我生成读书画像网页
```

它会自动拉取你的书架数据、阅读统计，生成标签和总结，输出一个 `reading-profile.html`。

---

## 效果

单页两个视图：

- **读书画像** — 时长、读过/读完、阅读天数、画像标签、分类偏好、偏爱作者
- **书架墙** — 封面网格，支持按时间/分类/作者排序

零依赖，零后端，一个 HTML 文件。

---

MIT licensed — see [LICENSE](./LICENSE).
