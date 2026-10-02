# 我的英语课 · My English Course

一个基于 6 份课件（`courseware/*.docx`）制作、适合小朋友使用的英语学习网站：单词卡片、拼写挑战、句子读听默、英汉互译、课件对话与扩展问答。答对题目可以收集星星 ⭐。纯静态网站（HTML/CSS/JS），不需要后端、不需要构建工具，可以直接部署到 GitHub Pages。

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

## 用本地 Ollama 扩充例句（可选）

`tools/ollama_generate.py` 调用你电脑上的 Ollama 模型，给还没有例句的单词造简单句子，自动过滤超纲词和重复句。需要在装了 Ollama 的电脑上运行，只用 Python 自带的库：

```bash
python3 tools/ollama_generate.py generate --lesson 1 --limit 20   # 生成草稿到 tools/generated/
# 打开草稿文件，删掉不满意的句子、改掉别扭的中文
python3 tools/ollama_generate.py merge tools/generated/<文件名>.json   # 合并进 data/sentences.json
python3 tools/check_data.py
```

默认模型是 `qwen3.5:9b-mlx`，可以用 `--model` 换；合并进翻译练习用 `--into translations`。

## 添加新课件（比如以后的 Part 7）

1. 把新的 .docx 放进 `courseware/`。
2. 用 `tools/extract_docx_text.py` 导出文字，整理出新单词、例句、翻译句、对话。
3. 照着现有格式加进 `data/*.json`（记得给新的一课分配下一个 `lesson` 编号），并在 `data/lessons.json` 里加一条课程说明。
4. 跑一遍 `python3 tools/scope_check.py build && python3 tools/check_data.py`，确认没有超纲词。

## 拼写挑战（难度自动调整）

"单词 → 拼写挑战"会根据每个单词自己的拼写进度调整难度：拼对一次升一级，拼错降一级。

| 级别 | 显示方式 |
| --- | --- |
| ⭐ 热身 | 只挖掉约 30% 的字母（首字母保留） |
| ⭐⭐ 进阶 | 挖掉约一半字母 |
| ⭐⭐⭐ 挑战 | 挖掉约 70% 字母 |
| ⭐⭐⭐⭐ 高手 | 只给每个词的首字母 |
| ⭐⭐⭐⭐⭐ 大师 | 完整听写，不给任何字母 |

前四级会同时显示中文意思作为提示。

## 发音 / 音频

全站统一使用美式英语（en-US）发音。默认用浏览器自带的美式英语语音朗读（Web Speech API），免费、零配置；设置里可以换成设备上其他的美式音色。如果想要更自然的真人发音，把音频文件放进 `audio/words/` 或 `audio/sentences/`（命名规则见 `audio/README.md`），网站会自动优先播放这些文件，没有文件的词句照常用浏览器朗读兜底。

## 部署到 GitHub Pages

`.github/workflows/deploy-pages.yml` 已经配置好：每次 push 到 `main`，会自动把网站文件（`index.html`、`css/`、`js/`、`data/`、`audio/`）发布到 GitHub Pages —— **不会**发布 `courseware/` 原始课件文件和 `tools/` 脚本。

唯一需要手动做一次的事：去仓库的 **Settings → Pages**，把 Source 改成 **GitHub Actions**（这一步无法通过代码完成，需要在网页上点一下）。设置好之后，以后每次改动 push 上去都会自动重新发布。
