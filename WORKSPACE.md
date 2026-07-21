# 🏛️ Codex Workspace — 全局工作台

> 最后更新：2026-06-28  
> 维护者：wenhailu  
> 定位：所有 Codex 项目的知识中枢、经验复利库、标准化操作台

---

## 📂 目录结构总览

```
Workspace/
├── WORKSPACE.md          ← 你正在读的这个文件（全局工作台）
├── REPLOG.md             ← 全局复利日志（经验、偏好、沟通风格、开发规范）
├── KNOWLEDGE_BASE.md     ← 踩坑日志（常见错误、解决方案、技术决策）
├── SOP.md                ← 标准操作流程（新项目启动、开发、复盘流程）
├── _templates/           ← 项目模板（新项目从这里复制）
│   └── project-template/
│       ├── README.md           ← 项目说明模板
│       ├── REQUIREMENTS.md     ← 需求文档模板
│       ├── TECH_STACK.md       ← 技术栈决策模板
│       ├── DEV_LOG.md          ← 开发记录模板
│       ├── KNOWN_ISSUES.md     ← 已知问题/踩坑记录模板
│       ├── PROJECT_SOP.md      ← 项目级 SOP 模板
│       └── RETROSPECTIVE.md    ← 复盘文档模板
└── projects/             ← 所有项目文件夹（按项目名命名）
    └── <project-name>/
        ├── README.md
        ├── REQUIREMENTS.md
        ├── TECH_STACK.md
        ├── DEV_LOG.md
        ├── KNOWN_ISSUES.md
        ├── PROJECT_SOP.md
        └── RETROSPECTIVE.md
```

---

## 📄 各文档用途说明

### 全局级文档（跨项目通用）

| 文档 | 用途 | 何时查阅 |
|------|------|----------|
| `WORKSPACE.md` | 工作台索引，了解整体结构 | 每次新建 Workspace 会话时 |
| `REPLOG.md` | 个人偏好、沟通风格、开发习惯、通用规则 | 每次启动新项目前必读 |
| `KNOWLEDGE_BASE.md` | 踩过的坑、解决方案、技术选型决策、常见错误 | 遇到类似问题时检索 |
| `SOP.md` | 标准操作流程（项目启动→开发→交付→复盘） | 启动新项目时按步骤执行 |

### 项目级文档（每个项目独立）

| 文档 | 用途 | 何时更新 |
|------|------|----------|
| `README.md` | 项目概述、快速上手、核心功能 | 项目启动时创建，迭代时更新 |
| `REQUIREMENTS.md` | 需求清单、用户故事、验收标准 | 需求变更时更新 |
| `TECH_STACK.md` | 技术选型及理由、版本约束 | 技术决策时创建/更新 |
| `DEV_LOG.md` | 每日开发记录、里程碑、进度 | 每天开发后追加 |
| `KNOWN_ISSUES.md` | 已知问题、临时方案、待修复项 | 发现新问题时追加 |
| `PROJECT_SOP.md` | 本项目特定的操作流程和规范 | 发现项目特有模式时更新 |
| `RETROSPECTIVE.md` | 项目复盘：做得好的、改进点、下次建议 | 项目阶段性完成时撰写 |

---

## 🏷️ 命名规则

### 文件夹命名
- **项目文件夹**：小写英文 + 连字符，如 `my-app`、`data-pipeline`、`admin-panel`
- **不要使用**：空格、中文、大写字母、特殊符号

### 文件命名
- 全部使用大写 + 下划线：`README.md`、`DEV_LOG.md`、`TECH_STACK.md`
- 保持全局统一，不随意创造新文件名

### 日志条目格式（DEV_LOG.md / REPLOG.md / KNOWLEDGE_BASE.md）
```
## YYYY-MM-DD HH:MM
### [标签] 标题
内容描述...
```
常用标签：`#偏好` `#规范` `#踩坑` `#解决` `#决策` `#工具` `#沟通` `#复盘`

---

## 📋 使用规则

### 对 Codex 的要求

1. **新项目启动前必读**：每次处理新项目前，必须先阅读以下文档：
   - `WORKSPACE.md`（了解结构）
   - `REPLOG.md`（了解偏好和规范）
   - `KNOWLEDGE_BASE.md`（避免重复踩坑）
   - `SOP.md`（按流程执行）
   - 对应项目文件夹内的已有文档

2. **主动沉淀**：执行过程中发现的：
   - 新的经验/偏好 → 写入 `REPLOG.md`
   - 踩坑及解决方案 → 写入 `KNOWLEDGE_BASE.md`
   - 新的操作规范 → 更新 `SOP.md` 或项目 SOP
   - 项目特定知识 → 写入项目级对应文档

3. **保持一致性**：所有文档更新必须遵循命名规则和格式规范

4. **复盘驱动改进**：每个项目阶段完成后，必须撰写复盘，提炼可复用的经验

### 对你的建议

1. 每个新项目开始时，从 `_templates/project-template/` 复制文件夹结构
2. 先花 5 分钟填写 README 和 REQUIREMENTS，再动手写代码
3. 每天开发结束前，花 2 分钟记录 DEV_LOG
4. 遇到问题先查 `KNOWLEDGE_BASE.md`，再决定是否需要记录
5. 项目完成后务必写 RETROSPECTIVE，这是复利的关键

---

## 🔄 工作流程

```
新项目启动
    ↓
1. 阅读全局文档（WORKSPACE + REPLOG + KNOWLEDGE_BASE + SOP）
    ↓
2. 从模板创建项目文件夹
    ↓
3. 填写项目级基础文档（README + REQUIREMENTS + TECH_STACK）
    ↓
4. 按 SOP 执行开发
    ↓
5. 开发中实时更新 DEV_LOG + KNOWN_ISSUES
    ↓
6. 阶段完成 → 写 RETROSPECTIVE
    ↓
7. 提炼通用经验 → 更新全局 REPLOG / KNOWLEDGE_BASE
    ↓
循环
```
