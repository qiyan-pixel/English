# 我的英语课 · My English Course

一个基于 6 份课件（`courseware/*.docx`）制作的英语自学网站：单词卡片、听写拼写、句子读听默、英汉互译、课件对话与扩展问答，外加一个可选的 AI 自由对话模式。纯静态网站（HTML/CSS/JS），不需要后端、不需要构建工具，可以直接部署到 GitHub Pages。

## 本地预览

浏览器的安全限制不允许直接双击打开 `index.html`（`fetch` 加载不了 `data/*.json`），需要起一个本地服务器：

```bash
python3 -m http.server 8000
# 然后打开 http://127.0.0.1:8000/
```

## 内容是怎么来的

- `courseware/` 是原始的 6 份课件（.docx），**不会**被发布到公开网站上（见下方"部署"）。
- `tools/extract_docx_text.py` 把课件的文字和表格导出成纯文本，方便整理内容。
- `tools/scope_check.py` 和 `tools/check_data.py` 会读取全部 6 份课件，生成一份"课件里出现过的所有单词"的清单（`tools/corpus_words.json`），然后检查 `data/*.json` 里的每一句英文，确保没有用到课件之外的生词。改完 `data/` 下任何文件后，运行一遍：

  ```bash
  python3 tools/check_data.py
  ```

  如果提示有超纲单词，会列出具体是哪个词、在哪个文件里。

- `data/vocabulary.json` 是去重后的核心词汇表（465 个），按课整理，每个词有中文释义、词性和例句。
- `data/sentences.json`、`data/translations.json`、`data/dialogues.json`、`data/questions.json` 分别是句子练习、英汉互译、对话、扩展问答的内容。

## 添加新课件（比如以后的 Part 7）

1. 把新的 .docx 放进 `courseware/`。
2. 用 `tools/extract_docx_text.py` 导出文字，整理出新单词、例句、翻译句、对话。
3. 照着现有格式加进 `data/*.json`（记得给新的一课分配下一个 `lesson` 编号），并在 `data/lessons.json` 里加一条课程说明。
4. 跑一遍 `python3 tools/scope_check.py build && python3 tools/check_data.py`，确认没有超纲词。

## 发音 / 音频

默认用浏览器自带的语音朗读（Web Speech API），免费、零配置。如果想要更自然的真人发音，把音频文件放进 `audio/words/` 或 `audio/sentences/`（命名规则见 `audio/README.md`），网站会自动优先播放这些文件，没有文件的词句照常用浏览器朗读兜底。

## AI 自由对话（可选）

"AI 自由对话"页面需要你自己的 API Key（在设置里填写，只保存在你自己浏览器的 localStorage，不会上传到任何服务器或代码仓库）。支持两种服务商：

- **Anthropic Claude**（推荐，官方支持网页直接调用）
- **OpenAI 兼容接口**：填接口地址 + API Key + 模型名称，可以接 OpenAI 本身，也可以接 DeepSeek、Moonshot/Kimi、通义千问、智谱GLM 等国内服务商的"兼容模式"接口——只要它是 OpenAI 格式的 `/chat/completions` 接口就能用。设置里填的地址页面上有各家常见地址；在服务商自己的文档里要选 **OpenAI 兼容 / OpenAI Compatible** 那一项，不是 Anthropic 兼容（有的服务商比如 Kimi 两种都提供，但本站目前只接了 OpenAI 格式）。注意 Moonshot/Kimi 按量付费的开发者 API 和按月付费的 Kimi Code Plan 是两个不同产品，地址也不同，以你自己账号实际用的产品为准。

不是所有服务商都允许网页直接调用（CORS）——测试连接如果提示 "Load failed" / "Failed to fetch"，多半是这个原因，不是配置错了。想确认可以打开浏览器开发者工具的 Network 面板重新测试一次，看失败请求是不是连响应状态码都没有（典型 CORS 特征）。这种情况下换一个支持网页直连的服务商（Anthropic）最简单；如果就是想用这个不支持 CORS 的服务商，可以照着 [`cloudflare-worker/`](./cloudflare-worker/) 里的步骤搭一个免费的小型反向代理，把真实 API Key 放在代理服务器那一侧，网站这边填代理地址即可，依然是纯静态网站，不需要装任何软件。

AI 会在系统提示里拿到完整的课件词表，并被要求尽量只用这些词——但这是"尽量"，不是 100% 保证。如果想要保证绝不超纲的练习，用"对话 & 问答"页面（纯课件内容，没有 AI）。

## 部署到 GitHub Pages

`.github/workflows/deploy-pages.yml` 已经配置好：每次 push 到 `main`，会自动把网站文件（`index.html`、`css/`、`js/`、`data/`、`audio/`）发布到 GitHub Pages —— **不会**发布 `courseware/` 原始课件文件和 `tools/` 脚本。

唯一需要手动做一次的事：去仓库的 **Settings → Pages**，把 Source 改成 **GitHub Actions**（这一步无法通过代码完成，需要在网页上点一下）。设置好之后，以后每次改动 push 上去都会自动重新发布。
