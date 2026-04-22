# ai-reading-mate

> 你读过的每一本书，都值得被好好对待。
> A warm, mobile-friendly home for your reading life.

![status](https://img.shields.io/badge/status-personal%20use%20%E2%9C%85-success)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## 读完的书都去哪儿了？

你在微信读书、Kindle、纸质书、豆瓣上读过的每一本书，数据散落各处。app 推荐都是商业化内容；没有一个地方能让你**一眼看到自己**——读了多少、读了什么、这一年哪本书最打动你。

**ai-reading-mate** 是一个放在自己电脑/手机上的小应用，用你自己的阅读数据，给你：

🗂️ **一面整齐的书架** —— 每本书一个封面，搜索、按主题筛选，一秒定位

📅 **一年一张海报** —— Spotify Wrapped 风格的年度回顾，"我今年读了 76 本 / 340 小时"

🌆 **一面封面墙** —— 纯封面网格，刷下来一片看自己这些年读过的书

📊 **一张雷达图** —— 中国文学 · 科幻 · 历史 · 社科…… 你在每个领域多深、打到"几段"

🧑‍🎨 **一张作者 treemap** —— 谁占了你最多的时间？卡尔维诺？余华？陀思妥耶夫斯基？

🤖 **一位懂你的推书朋友** —— 把你全部的阅读史丢给 AI，问它"下一本读什么"

---

## 这是给谁的

- 喜欢读书、一年读个几十本以上的人
- 数据散在好几个平台，想要一个"自己的阅读博物馆"
- 不想把 API key / 阅读数据交给某个不认识的 SaaS
- 有开发背景，或者至少愿意跑一下 `npm install`

不是给谁的：想要一个上架 app 的普通用户（这是个自部署小工具，不是成品 SaaS）。

---

## 先跑起来看看

```bash
git clone https://github.com/frankliu20/ai-reading-mate.git
cd ai-reading-mate/ui
npm install
npm run dev    # 打开 http://localhost:3001
```

默认跑起来用的是示例数据（8 本经典书 / 3 个书单），所有页面都能点开，能感受到它长什么样。

想看**自己的**数据？见 [`data/README.md`](./data/README.md)——你只需要给它一个 `booklists.json`，怎么来的它不管。作者自己的做法是用独立的 private repo + 微信读书 MCP 同步，你也可以写个 Goodreads 导出脚本、甚至手写 JSON——都行。

想让 **AI 推荐**也能用？打开 `/settings` 页面，粘贴一个豆包（火山方舟）API key。只存在你浏览器的 localStorage 里，不会上传任何地方——AI 请求是从你的浏览器直接打到豆包，**没有任何中间服务器**。

---

## 设计心思

- 🫖 **米色暖调** · 适合晚上端杯茶慢慢翻的氛围，不是冷冰冰的 dashboard
- 📱 **手机友好** · 所有页面在手机上都好看好用，封面墙在地铁上刷起来很爽
- 🔒 **零后端** · 你的数据、你的 API key，全部留在你自己机器上
- 👓 **只读** · 是一个"看"的工具，不是"录"的工具。记录还是去你喜欢的原平台

---

## 数据从哪来？

UI 只认一个文件：`data/private/booklists.json`（找不到就 fallback 到 `data/sample/`）。

这个文件怎么生成是你自己的事。本仓自带两条路：

- 🧠 **Claude Code skill**（最省心）—— [`.claude/skills/sync-weread-meta/`](./.claude/skills/sync-weread-meta/SKILL.md)。你说一句"同步读书数据"，它会：
  - 调微信读书 MCP（[`frankliu20/mcp-server-weread`](https://github.com/frankliu20/mcp-server-weread)）拉你的书架和书单
  - 看你有没有按年份/主题整理书单；**如果没有，就用 LLM 根据作者和书名帮你自动分类**
  - 生成 `config.json`，跑 build 脚本，完成
- 🐍 **Python 脚本** —— [`data/build_booklists.py`](./data/build_booklists.py)。零依赖，接受一个 bookshelf 快照 + 可选 config，输出 `booklists.json`。skill 底层就是调它；你也可以自己造一份 bookshelf 数据（比如从 Goodreads 导出）直接调。

schema 在 [`data/README.md`](./data/README.md)，照着造一个合法的 `booklists.json` 塞进 `data/private/` 也行。

---

MIT licensed — see [LICENSE](./LICENSE).

---

# English

A warm beige, mobile-friendly home for your reading life. Takes **one JSON file**
of your reading history and gives you:

- 📚 **A tidy shelf** — searchable, theme-filterable grid
- 🗓️ **A year in review** — Spotify-Wrapped-style, one page per year
- 📷 **A cover wall** — pure grid, scroll through the books that shaped you
- 📊 **A reading map** — radar chart per topic, see where you're deep
- ✍️ **An author map** — treemap of who got the most of your time
- 🤖 **An AI reading buddy** — suggests your next book, based on everything you've read

### Who's this for

Readers who get through a few dozen books a year, have data scattered across
platforms, don't want to hand their reading history to a SaaS, and are fine
running `npm install`.

### Try it

```bash
git clone https://github.com/frankliu20/ai-reading-mate.git
cd ai-reading-mate/ui
npm install
npm run dev    # http://localhost:3001
```

Ships with sample data so every page works out of the box.
To use your own, see [`data/README.md`](./data/README.md).

For AI recommendations, paste a Doubao (Volcengine, OpenAI-compatible) API
key in `/settings`. It stays in your browser's localStorage; requests go
browser → Doubao, no middleman server.

MIT licensed — see [LICENSE](./LICENSE).
