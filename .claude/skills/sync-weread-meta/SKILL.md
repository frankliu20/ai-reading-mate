---
name: sync-weread-meta
description: 把用户的微信读书阅读数据同步成 ai-reading-mate UI 需要的 data/private/booklists.json。自适应用户的书单习惯：有完整的年份+主题书单就直接用；只有书架、没有书单也能用 LLM 自动按年份切分 + 按作者/类别分主题。当用户说"同步读书数据"、"更新书单"、"刷新 metadata"、"我又读完一本书"、"从零导入微信读书"等场景时触发。
---

# Sync WeRead → booklists.json

本 skill 的目标：让用户（无论有没有精心维护微信读书"打卡书单"）都能一键把自己的阅读数据导入 ai-reading-mate。

## 输出契约

最终产物：**`data/private/booklists.json`**（schema 见 repo 根目录 `data/README.md`）。

中间产物全部放在 `data/private/` 下，该目录在根 `.gitignore` 里。

## 依赖

MCP 源：[`frankliu20/mcp-server-weread`](https://github.com/frankliu20/mcp-server-weread)（加了 `get_booklists` / `get_booklist_detail`，upstream 没有）。

| Tool | 入参 | 用途 |
|---|---|---|
| `weread-get_bookshelf` | — | 拉全书架（progress/finishReading/readingTime/updateTime/noteCount）。**必调。** |
| `weread-get_booklists` | （可选 user_vid） | 列出用户自己建的所有书单 |
| `weread-get_booklist_detail` | booklist_id | 某个书单的完整书目（含丰富 bookInfo：categories/newRating/publishTime） |
| `weread-search_books` | keyword | 按关键字搜架内书，按需用 |
| `weread-get_book_notes_and_highlights` | book_id | 单本书划线/笔记，按需懒加载，**不要批量** |
| `weread-get_book_best_reviews` | book_id | 单本书热门评论，按需 |

> ⚠️ MCP 输出 >25 KB 会写到 `$env:TEMP\<callId>-copilot-tool-output-*.txt`；≤25 KB inline 返回。

## 流程

### Step 1 · 探路

1. 调 `weread-get_bookshelf`，把 temp 文件 `Copy-Item` 到 `data/private/raw/_bookshelf.json`（下划线前缀，build 脚本把它当书架数据）。
2. 调 `weread-get_booklists`，记下返回里所有 `booklistId / name / totalCount`。

### Step 2 · 判断用户属于哪一档

看一眼 `get_booklists` 返回的 name，问用户（或自己推断）：

- **Tier A — 用户有完整的"年份 + 主题"双维度书单**（比如名字是 `2025阅读打卡` / `科幻` / `日韩文学` 这种）
  - 典型人群：把微信读书当主力读书 app、手动分门别类整理书单的深度用户
  - 处理：按 Tier A 走
- **Tier B — 只有部分维度**（只有年份、或只有主题、或只有随意收藏夹）
  - 处理：拉能用的 → 其余让 LLM 补
- **Tier C — 完全没有书单 / 书单名看不出意图**
  - 典型人群：只用微信读书读书、没在里面整理
  - 处理：纯书架 + LLM 全自动分主题

推断不出来就直接问用户一句："我看到你有 N 个书单：[列 name]。想**按这些书单归类**（Tier A/B），还是**忽略书单、让我根据作者和书名帮你自动分主题**（Tier C）？"

### Step 3 · 拉 booklist 明细（Tier A / B only）

对每一个用户打算用的 booklist：

```powershell
# in Claude Code, after weread-get_booklist_detail returns:
Copy-Item $env:TEMP\<callId>-...-*.txt data/private/raw/<booklistId>.json
# (inline responses <25 KB: write the JSON directly via Out-File)
```

`<booklistId>` 保持 MCP 原样（通常形如 `<userVid>_<slug>`）。

### Step 4 · 写 `config.json`

在 `data/private/config.json` 里告诉 build 脚本每个 raw 文件是什么，以及是否需要 LLM 自动分主题/年份。

**Tier A（有完整年份+主题书单）：**

```json
{
  "user_vid": "<userVid from get_bookshelf or get_booklists>",
  "source": "weread MCP",
  "booklists": {
    "<userVid>_<slug1>": { "kind": "year",  "label": "2025" },
    "<userVid>_<slug2>": { "kind": "year",  "label": "2024" },
    "<userVid>_<slug3>": { "kind": "theme", "label": "科幻" },
    "<userVid>_<slug4>": { "kind": "theme", "label": "历史" }
  },
  "auto_years_from_shelf": false,
  "theme_overrides": {}
}
```

`label` 是 UI 显示的名字（脚本不会从 booklist name 里猜），所以你（LLM）要根据 `name` 字段写一个干净的 label，比如 `2025阅读打卡` → `"label": "2025"`，`日韩文学打卡` → `"label": "日韩文学"`。

**Tier B — 只有年份书单（缺主题）：**

1. `booklists` 里只放年份那些
2. `auto_years_from_shelf: false`
3. `theme_overrides`：LLM 给每本书打 1–3 个主题 tag。用书架上的 `author` / `title` / `categories` + 自己的常识（作家国别、题材流派、学科领域等）来分：
   ```json
   "theme_overrides": {
     "538128": ["Sci-Fi"],
     "728510": ["Mystery", "Classics"],
     "934374": ["Latin American Literature"]
   }
   ```
4. 主题标签的粒度：中文书推荐走"中国文学 / 日韩文学 / 英美文学 / 科幻 / 历史 / 社科 / ..."这类大分类；英文书走"Sci-Fi / Classics / History / Philosophy / ..."；**保持 5–15 个主题**总数，太散不好看。

**Tier B — 只有主题书单（缺年份）：**

1. `booklists` 里放主题那些
2. `auto_years_from_shelf: true` ← 脚本根据每本书的 `finishReading + updateTime` 年份自动切成年份 booklist
3. 不用写 `theme_overrides`

**Tier C — 啥书单都没有 / 都忽略：**

```json
{
  "user_vid": "...",
  "booklists": {},
  "auto_years_from_shelf": true,
  "theme_overrides": { "<bookId>": [...], ... }
}
```

LLM 遍历 `_bookshelf.json` 里每本书，按同样规则分 5–15 个主题 tag。

### Step 5 · build

```powershell
cd <repo root>
python data/build_booklists.py
```

检查 `data/private/booklists.md` 里的统计（总书数、年份分布、主题分布）是否合理，不合理就 iterate 一下 config.json / theme_overrides。

## 增量

日常用法：读完几本、加了笔记、动了书单。

- **Case A · 只是读完状态/笔记数变了**：重拉 bookshelf 覆盖 `_bookshelf.json` → build。
- **Case B · 某个 Tier A 书单里加了新书**：重拉那个 booklist 的 detail → build。
- **Case C · Tier B/C 买/读了新书**：重拉 bookshelf → 让 LLM 给新 bookId 追加到 `theme_overrides` → build。
- **Case D · 新建了一个年份/主题书单**：重拉 `get_booklists` + 这个书单的 detail → 把它加到 `config.booklists` → build。

判断哪些需要重拉：`get_booklists` 里每个 booklist 的 `updateTime` 和本地 `raw/<id>.json` 里的 `updateTime` 比对。懒得判断就全量重拉（十来次 MCP 调用，可接受）。

## Tips

- **别预先批量调** `get_book_notes_and_highlights` / `get_book_best_reviews`（N 本 = N 次调用），按需再调。
- build 脚本幂等，随便跑。
- `data/private/raw/_bookshelf.json` 永远是最新快照，旧数据会被覆盖；想留档自行重命名。
- 用户问"我读完 N 本了吗"、"还有多少没读"之类需要最新状态的问题，**先** Case A 一下再回答。
- 写 `theme_overrides` 时如果拿不准，可以让用户确认一小批（比如 20 本）你的分类是否合理，再批量推。
