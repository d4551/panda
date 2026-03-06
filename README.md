```text

         ⬛⬛⬛                 ⬛⬛⬛
       ⬛⬛⬛⬛⬛             ⬛⬛⬛⬛⬛
       ⬛⬛⬛⬛⬛             ⬛⬛⬛⬛⬛
        ⬛⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜⬛⬛⬛⬛
          ⬛⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬛
          ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
        ⬜⬜⬜⬛⬛⬛⬜⬜⬜⬛⬛⬛⬜⬜⬜
        ⬜⬜⬛⬛⬛⬛⬛⬜⬛⬛⬛⬛⬛⬜⬜
        ⬜⬜⬛⬛⬜⬛⬛⬜⬛⬛⬜⬛⬛⬜⬜
        ⬜⬜⬜⬛⬛⬛⬜⬜⬜⬛⬛⬛⬜⬜⬜
        ⬜⬜⬜⬜⬜⬜⬛⬛⬛⬜⬜⬜⬜⬜⬜
         ⬜⬜⬜⬜⬜⬜⬛⬛⬛⬜⬜⬜⬜⬜
          ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
            ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

```

<h1 align="center">🐼 Panda Professor · 熊猫教授</h1>

<p align="center">
  <strong>Private, scholar-led tours of Chengdu — fully static, zero-build, bilingual.</strong><br/>
  <strong>学者带队的成都私人定制旅行 — 纯静态、零构建、双语支持。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-static_CDN-brightgreen?style=flat-square" alt="Build: Static CDN" />
  <img src="https://img.shields.io/badge/i18n-EN_%7C_中文-blue?style=flat-square" alt="i18n: EN | 中文" />
  <img src="https://img.shields.io/badge/UI-DaisyUI_5-blueviolet?style=flat-square" alt="UI: DaisyUI 5" />
  <img src="https://img.shields.io/badge/CSS-Tailwind_4-06B6D4?style=flat-square" alt="CSS: Tailwind 4" />
  <img src="https://img.shields.io/badge/storage-IndexedDB-orange?style=flat-square" alt="Storage: IndexedDB" />
  <img src="https://img.shields.io/badge/WCAG-AA-green?style=flat-square" alt="WCAG: AA" />
</p>

---

# English

## Overview

**Panda Professor** is a production-ready, fully static tourism website for booking private, expert-guided tours of Chengdu, Sichuan Province, China. The entire application runs in the browser with zero server dependencies — no Node.js backend, no build tools, no external database. All data persistence is handled by IndexedDB through localForage, and all UI components are delivered via CDN-hosted libraries.

The site is designed for a real-world use case: a local Chengdu scholar who offers curated, private tours covering giant panda conservation, Sichuan cuisine, ancient history (Sanxingdui), Taoist mountain culture, Sichuan opera, and more. Every piece of text — from button labels to ARIA accessibility attributes — is fully translated into both English and Simplified Chinese, switchable with a single click.

## Features in Detail

### 🎯 Curated Tour Listings

The heart of the site is a responsive grid of tour cards, each representing a unique Chengdu experience. The system ships with **10 pre-loaded tours** spanning five categories:

- **Pandas** — Dawn conservation expeditions, private research base access
- **Food** — Night market journeys, Sichuan cooking masterclasses
- **History** — Sanxingdui bronze age mysteries, Dufu literary walks
- **Culture** — Sichuan opera backstage access, tea ceremonies
- **Nature** — Qingcheng Mountain trails, Wolong bamboo groves

Each tour card displays:
- Bilingual title and description (EN/ZH)
- Price in CNY (¥) and duration in hours
- Category tags for filtering
- "Popular" badge for featured tours
- Favourite/heart toggle (persisted in localStorage)
- "Add to Day Plan" action

**Filtering & Search**: A joined button strip filters by `All`, `Pandas`, `Food`, `History`, `Culture`. A real-time text search field filters tours by title in the active language. Both controls work in combination.

**Detail Modal**: Clicking "View" on any card opens a modal with extended information including inclusions, exclusions, and itinerary highlights — all bilingual.

### 📅 Day Builder (Itinerary Planner)

Visitors can compose a custom day itinerary by adding tours to their plan. The Day Builder provides:

- **Drag-and-drop reordering** between tour cards and the plan list
- **Per-stop customization**: start time, duration override, participant count (1–20), and free-text notes
- **Live cost calculation**: total estimated price and duration update as stops are added/removed/modified
- **Shareable URLs**: the "Share" button serializes the plan into a URL query parameter, allowing visitors to share their itinerary via link
- **Plan persistence**: the itinerary is saved to localStorage and restored on page load
- **Clear plan**: one-click reset

### 💬 Interactive Chat Widget

A floating panda-themed chat widget in the bottom-right corner provides a conversational interface:

- **Welcome message** with quick-reply chips for common questions
- **Keyword-matched responses** for tours, food, panda facts, and a fallback response
- **Random panda facts** — 7 bilingual fun facts served on demand
- **Typing indicator** with animated dots for a natural feel
- **Slide-in/out animation** with glassmorphic panel styling
- **All chat copy is admin-configurable** — welcome messages, quick-ask labels, and response text can be edited per-language from the admin dashboard

### ⭐ Traveller Reviews

A horizontal-scrolling **carousel** component showcases 8 pre-loaded traveller testimonials. Each review includes:

- Traveller name and country of origin
- Star rating (1–5, rendered as filled/empty stars)
- Bilingual review text
- Avatar image

Reviews are manageable from the admin dashboard (create, edit, delete).

### ❓ FAQ Section

A responsive grid of collapsible **accordion** panels presents 6 pre-loaded FAQs covering booking, transport, group size, payment, cancellation, and accessibility. The layout adapts from 1 column (mobile) to 2 columns (tablet) to 3 columns (desktop). All questions and answers are bilingual and admin-editable.

### 🌐 Full Bilingual i18n

The internationalization system covers **every user-visible string** in the application:

- Page titles and meta descriptions
- Navigation labels and ARIA attributes
- Button text, placeholder text, and input labels
- Tour data (titles, descriptions, inclusions, exclusions)
- FAQ questions and answers
- Review text
- Chat messages and quick-reply labels
- Footer text, copyright, social media labels
- Admin dashboard labels

**Implementation**: A `translations` object in `data.js` maps every string key to `en` and `zh` values. The `t(key)` function resolves the active locale with a deterministic fallback to English. The `applyTranslations()` function walks the DOM for `data-i18n` and `data-i18n-attr` attributes and updates content/attributes in place. Language preference is persisted in localStorage.

### 🎨 Multi-Theme Support

The site supports live theme switching via DaisyUI's theme system:

- **Emerald** (default) — clean, modern green
- **Forest** — dark nature-inspired
- **Bamboo** — custom-defined warm earth tones with full CSS custom property overrides
- Plus all other built-in DaisyUI 5 themes

Theme selection is persisted in localStorage and applied on page load. The custom `Bamboo` theme defines a full colour palette including base, primary, secondary, accent, neutral, info, success, warning, and error tokens.

### 🔒 Admin Dashboard

A complete administration interface at `admin.html` provides:

**Authentication**:
- PIN-based login (SHA-256 hashed, stored in IndexedDB)
- Default PIN: `admin` (change in Settings)
- Session managed via sessionStorage
- Bilingual login UI

**Dashboard Tabs**:

| Tab | Capabilities |
|---|---|
| **Booking Requests** | View all submitted booking requests in a table with date, name, email, guests, tours, and status. Update status (Pending → Contacted → Resolved). Email guests directly. |
| **Tour Offerings** | Full CRUD for tours. Bilingual title/description, price in ¥, duration, image URL (paste from Gallery), comma-separated tags, active/hidden status toggle, popular flag. |
| **Image Gallery** | Upload images (converted to Base64 and stored in IndexedDB). Copy image URLs for use in tour cards. Delete unused images. |
| **Settings** | Site name, contact email, contact phone, brand logo URL. Six social media links (Instagram, Facebook, Twitter/X, WeChat, Weibo, Xiaohongshu). Full chatbot copy configuration — welcome messages, quick-ask labels, response text, and fallback responses, all per-language. |
| **Reviews** | CRUD for traveller reviews. Name, country, bilingual review text. |
| **FAQs** | CRUD for FAQ entries. Bilingual question and answer fields. |

**Stats Bar**: Live counts of active tours, pending requests, and resolved requests.

### 📖 Admin Manual

A comprehensive HTML manual (`manual.html`) with screenshots provides step-by-step documentation for non-technical administrators covering login, tour management, booking workflow, chat configuration, and settings.

### 💾 Offline-First Data Layer

The `PandaDB` module (`js/db.js`) provides a zero-cost client-side database built on localForage (IndexedDB):

- **Isolated stores** for tours, FAQs, reviews, panda facts, images, requests, settings, and auth
- **Auto-seeding**: on first load, seed data from `data.js` populates all stores
- **Full CRUD**: `fetchTours()`, `saveTour()`, `deleteTour()`, etc. for every entity
- **SHA-256 PIN hashing** via Web Crypto API
- **Deep-merge settings** with sensible defaults for chatbot copy

After the first page load, the entire site works offline — all data is in IndexedDB.

### ♿ Accessibility (WCAG AA)

The site follows WCAG AA accessibility standards:

- **Skip link**: "Skip to content" link visible on focus
- **ARIA attributes**: Every interactive element has descriptive `aria-label`, `role`, and `aria-expanded` attributes
- **Focus management**: Visible focus rings (`outline: 3px solid`) on all focusable elements
- **Keyboard navigation**: Full tab order through navigation, tour cards, modals, and chat
- **Screen reader support**: Semantic HTML5 elements, `aria-live="polite"` on chat messages, `role="log"` on chat container
- **Bilingual ARIA**: All ARIA labels are translated alongside visible text

### 🎭 Design System

The custom stylesheet (`style.css`, 666 lines) implements a rich visual design:

- **Glassmorphism**: frosted-glass panels with `backdrop-filter: blur()` and semi-transparent borders
- **Custom colour tokens**: `--panda-green`, `--panda-gold`, `--panda-coral`, `--panda-cream`
- **Animations**: fade-in-up, float, pulse-glow, slide-in/out, bounce-in, typing dots, wiggle
- **Scroll reveal**: intersection-observer-based progressive disclosure
- **Responsive breakpoints**: mobile (≤640px), tablet (641–1023px), desktop (1024px+), wide (1280px+)
- **Print styles**: hide navigation, chat widget, and drawer for clean printing

## Tech Stack

| Layer | Technology | Version | Delivery |
|---|---|---|---|
| Structure | Semantic HTML5 | — | Local |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.0.14 | CDN (`@tailwindcss/browser`) |
| Components | [DaisyUI](https://daisyui.com/) | 5.3.10 | CDN |
| Icons | [Lucide](https://lucide.dev/) | latest | Local bundle (`js/lucide.min.js`) |
| Typography | [Inter](https://fonts.google.com/specimen/Inter) | 400–800 | Google Fonts CDN |
| Persistence | [localForage](https://localforage.github.io/localForage/) | 1.10.0 | CDN → IndexedDB |
| Logic | Vanilla JavaScript (ES Modules) | — | Local |

**Zero dependencies to install** — `package.json` exists solely as a project descriptor.

## Project Structure

```
panda/
├── index.html              # Public tourism website (440 lines)
│                            #   Hero → Tours → Day Builder → Reviews → FAQ → Footer
│                            #   Chat widget, booking modal, success modal
│
├── admin.html              # Admin dashboard (660 lines)
│                            #   Login → Stats → Tabs: Requests, Tours, Gallery,
│                            #   Settings, Reviews, FAQs
│                            #   Modals: Tour form, Review form, FAQ form
│
├── manual.html             # Admin user manual with screenshots
│
├── style.css               # Design system (666 lines)
│                            #   Custom properties, glassmorphism, animations,
│                            #   responsive layouts, print styles
│
├── logo.png                # Brand logo (full resolution)
├── logo.webp               # Brand logo (optimized WebP)
│
├── js/
│   ├── data.js             # i18n translations (EN + ZH, ~570 keys)
│   │                        # Seed data: 10 tours, 8 reviews, 6 FAQs, 7 panda facts
│   ├── db.js               # PandaDB: IndexedDB adapter via localForage
│   │                        # 8 isolated stores, full CRUD, SHA-256 auth
│   ├── app.js              # Main app logic (1784 lines)
│   │                        # Rendering, i18n, theming, chat, day builder,
│   │                        # favourites, search, filtering, drag-and-drop,
│   │                        # booking flow, scroll reveal, keyboard handling
│   ├── admin.js            # Admin dashboard logic (31K)
│   │                        # Tab switching, CRUD forms, image upload,
│   │                        # settings persistence, request management
│   └── lucide.min.js       # Lucide icon library (local bundle)
│
├── images/
│   ├── panda[1-10].jpg     # Tour and panda photos
│   ├── chengdu[1-4].jpg    # City photography
│   ├── food1.jpg           # Cuisine photography
│   ├── nature1.jpg         # Landscape photography
│   └── manual/             # Admin manual screenshots
│       ├── admin_dashboard.png
│       ├── admin_login.png
│       ├── chat.png
│       ├── daybuilder.png
│       ├── hero_en.png
│       ├── hero_zh.png
│       └── tours.png
│
├── icons/                  # Social media SVG icons
│   ├── instagram.svg
│   ├── facebook.svg
│   ├── twitter.svg
│   ├── wechat.svg
│   ├── weibo.svg
│   └── xiaohongshu.svg
│
├── package.json            # Project descriptor (no dependencies)
├── CLAUDE.md               # Bun/IDE conventions
└── README.md               # This file
```

## Run Locally

No install step. Just serve the files:

```bash
# Python (built-in)
python3 -m http.server 8000

# Node.js
npx serve .

# Bun
bunx http-server .
```

Then open [http://localhost:8000](http://localhost:8000).

> **Note**: Opening `index.html` directly via `file://` may not work due to browser security restrictions on IndexedDB and ES module loading. Use a local server.

## Admin Access

1. Navigate to `admin.html` (or append `/admin.html` to the server URL)
2. Enter PIN: `admin` (default — **change immediately in Settings**)
3. Manage all content from the tabbed dashboard

### Admin Workflow

```
Visitor submits booking ──→ Request appears in "Booking Requests" tab
                           ├─ Status: Pending
                           ├─ Click "Email" to reply via mailto:
                           ├─ Click "Contact" to mark as contacted
                           └─ Click "Resolve" to mark as completed
```

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                    Browser Runtime                     │
│                                                       │
│  index.html ◄──── style.css                          │
│      │                                                │
│      ├── data.js ──── translations{en,zh}            │
│      │                tours[], reviews[], faqs[],     │
│      │                pandaFacts[]                     │
│      │                                                │
│      ├── db.js ────── PandaDB (localForage)          │
│      │                ├── toursStore                  │
│      │                ├── faqsStore                   │
│      │                ├── reviewsStore                │
│      │                ├── factsStore                  │
│      │                ├── imagesStore                 │
│      │                ├── requestsStore               │
│      │                ├── settingsStore               │
│      │                └── authStore                   │
│      │                                                │
│      └── app.js ───── Rendering, i18n, Theming,      │
│                       Chat, Day Builder, Search,      │
│                       Favourites, Drag-and-Drop,      │
│                       Booking Flow, Scroll Reveal     │
│                                                       │
│  admin.html ◄─── data.js + db.js + admin.js          │
│                  CRUD, Settings, Image Upload          │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │              CDN Dependencies                │     │
│  │  Tailwind CSS 4  ·  DaisyUI 5  ·  Inter     │     │
│  │  localForage 1.10  ·  Lucide (local)         │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │              IndexedDB (Browser)             │     │
│  │  8 object stores  ·  Auto-seeded on first    │     │
│  │  page load  ·  Full offline support          │     │
│  └─────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

## Deployment

This is a fully static site. Deploy to any static hosting provider:

| Provider | Command / Method |
|---|---|
| **GitHub Pages** | Push to `main`, enable Pages in repo settings |
| **Netlify** | Connect repo, publish directory: `/` (root) |
| **Vercel** | Import project, framework preset: `Other` |
| **Cloudflare Pages** | Connect repo, build command: _(none)_ |
| **S3 + CloudFront** | Upload all files to an S3 bucket |
| **Any web server** | Copy files to document root |

No build step is required. No environment variables. No server configuration.

---

# 中文说明

## 概述

**熊猫教授** 是一个可直接部署的纯静态旅游预订网站，提供由当地学者带队的成都私人定制旅行。整个应用完全在浏览器中运行，无需 Node.js 后端、构建工具或外部数据库。所有数据持久化通过 localForage 写入 IndexedDB，所有 UI 组件通过 CDN 加载。

本站面向真实使用场景：一位成都本地学者提供精选私人导游服务，涵盖大熊猫保护、四川美食、古代历史（三星堆）、道教山岳文化、川剧变脸等领域。从按钮文本到 ARIA 无障碍属性，每一段文字均完整翻译为英文和简体中文，一键切换。

## 功能详解

### 🎯 精选路线卡片

网站核心是响应式路线卡片网格，内置 **10 条预加载路线**，涵盖五大类别：

- **大熊猫** — 清晨保护基地探秘、科研基地优先入园
- **美食** — 夜市美食之旅、川菜私房烹饪工作坊
- **历史** — 三星堆考古解码、杜甫文学讲坛
- **文化** — 川剧后台观演、茶道体验
- **自然** — 青城山道教气息之旅、卧龙茶乡竹林慢旅

每张卡片展示双语标题与描述、人民币定价（¥）与时长、分类标签、"热门"徽章、收藏切换和"加入行程"按钮。

**筛选与搜索**：分类按钮组支持 `全部`、`大熊猫`、`美食`、`历史`、`文化` 筛选。实时搜索框按当前语言的标题过滤。两者可同时使用。

**详情弹窗**：点击"查看"可打开包含行程包含项、不含项和亮点的双语详情弹窗。

### 📅 行程规划器

访客可以将路线添加到自定义日程中：

- **拖放排序** — 在卡片和规划列表之间拖放调整顺序
- **逐站定制** — 开始时间、时长覆盖、参与人数（1–20 人）、文字备注
- **实时计算** — 总预估价格和总时长随添加/删除/修改实时更新
- **分享链接** — 一键生成可分享的 URL，将行程发给朋友
- **行程持久化** — 保存到 localStorage，刷新页面自动恢复
- **一键清空** — 快速重置行程

### 💬 互动聊天助手

右下角悬浮的熊猫主题聊天组件：

- 带快捷回复按钮的欢迎消息
- 关键词匹配的自动回复（路线、美食、熊猫知识、兜底回复）
- **7 条双语趣味熊猫知识**，随机推送
- 打字指示器动画，营造自然对话感
- 滑入/滑出动画，毛玻璃面板设计
- 所有聊天文案均可在管理后台按语言配置

### ⭐ 游客评价轮播

横向滚动的轮播组件展示 **8 条预加载游客评价**，包含姓名、国籍、星级评分（1–5）、双语评价文本和头像。可在管理后台增删改。

### ❓ 常见问题折叠区

响应式网格布局的手风琴折叠面板，预加载 **6 条 FAQ**，涵盖预订、交通、团队规模、支付、取消和无障碍。布局自动适配：手机 1 列、平板 2 列、电脑 3 列。全部双语且可在后台编辑。

### 🌐 完整双语国际化

国际化系统覆盖应用中 **每一段可见文字**（约 570 个翻译键），包括：

- 页面标题和 meta 描述
- 导航标签和 ARIA 属性
- 按钮文本、占位符和输入标签
- 路线数据（标题、描述、包含项、不含项）
- FAQ 问答、评价内容
- 聊天消息和快捷回复标签
- 页脚文字、版权声明、社交媒体标签
- 管理后台全部标签

语言偏好保存在 localStorage，英文 ↔ 中文一键切换。

### 🎨 多主题切换

支持实时主题切换（DaisyUI 主题系统）：

- **Emerald**（默认）— 清新现代绿
- **Forest** — 深色自然风
- **Bamboo** — 自定义暖色调，完整 CSS 自定义属性覆盖（16 个色彩令牌）
- 以及所有 DaisyUI 5 内置主题

主题选择保存在 localStorage，页面加载时自动应用。

### 🔒 管理后台

`admin.html` 提供完整的管理界面：

- **PIN 码认证** — SHA-256 哈希存储，支持修改
- **6 个功能标签页** — 预订请求管理、路线 CRUD、图片库上传、站点设置（含 6 个社交媒体链接和完整聊天文案配置）、评价管理、FAQ 管理
- **实时统计** — 在售路线数、待处理请求数、已完成请求数
- **全界面双语** — 管理后台也支持中英文切换

### 💾 离线优先数据层

`PandaDB` 模块基于 localForage（IndexedDB）实现零成本客户端数据库：

- **8 个隔离存储空间** — 路线、FAQ、评价、趣闻、图片、请求、设置、认证
- **首次加载自动填充** — 从 `data.js` 种子数据初始化
- **完整 CRUD API** — 每个实体均有增删改查方法
- **首次加载后完全可离线运行**

### ♿ 无障碍支持（WCAG AA）

- 跳转链接（"Skip to content"）
- 所有交互元素标注 ARIA 属性（`aria-label`、`role`、`aria-expanded`）
- 可见焦点环（`3px solid` 轮廓）
- 完整键盘导航
- 屏幕阅读器支持（语义化 HTML5、`aria-live="polite"`、`role="log"`）
- ARIA 标签双语翻译

### 🎭 视觉设计系统

自定义样式表（`style.css`，666 行）实现丰富视觉效果：

- **毛玻璃效果** — `backdrop-filter: blur()` 半透明面板
- **自定义色彩令牌** — `--panda-green`、`--panda-gold`、`--panda-coral`、`--panda-cream`
- **7 种动画** — 淡入上移、浮动、脉冲发光、滑入/滑出、弹入、打字圆点、摇摆
- **滚动渐显** — 基于 Intersection Observer 的渐进展示
- **4 档响应式断点** — 手机 / 平板 / 桌面 / 宽屏
- **打印样式** — 隐藏导航栏、聊天和抽屉

## 技术栈

| 层级 | 技术 | 版本 | 交付方式 |
|---|---|---|---|
| 结构 | 语义化 HTML5 | — | 本地 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) | 4.0.14 | CDN |
| 组件 | [DaisyUI](https://daisyui.com/) | 5.3.10 | CDN |
| 图标 | [Lucide](https://lucide.dev/) | 最新 | 本地打包 |
| 字体 | [Inter](https://fonts.google.com/specimen/Inter) | 400–800 | Google Fonts CDN |
| 持久化 | [localForage](https://localforage.github.io/localForage/) | 1.10.0 | CDN → IndexedDB |
| 逻辑 | 原生 JavaScript (ES Modules) | — | 本地 |

**无需安装任何依赖** — `package.json` 仅作为项目描述符。

## 项目结构

```
panda/
├── index.html              # 面向用户的旅游网站（440 行）
│                            #   英雄区 → 路线 → 行程规划 → 评价 → FAQ → 页脚
│                            #   聊天组件、预订弹窗、成功弹窗
│
├── admin.html              # 管理后台（660 行）
│                            #   登录 → 统计 → 标签页：请求、路线、图库、
│                            #   设置、评价、FAQ
│                            #   弹窗：路线表单、评价表单、FAQ 表单
│
├── manual.html             # 管理员使用手册（含截图）
├── style.css               # 设计系统（666 行）
├── logo.png / .webp        # 品牌标识
│
├── js/
│   ├── data.js             # 翻译文件（中/英，约 570 个键）+ 种子数据
│   ├── db.js               # PandaDB — IndexedDB 数据适配器
│   ├── app.js              # 主程序逻辑（1784 行）
│   ├── admin.js            # 管理后台逻辑
│   └── lucide.min.js       # Lucide 图标库（本地）
│
├── images/                 # 旅行和熊猫照片（16 张）+ 手册截图（7 张）
├── icons/                  # 社交媒体 SVG 图标（6 个）
├── package.json            # 项目描述符（无依赖）
└── README.md               # 本文件
```

## 本地运行

无需安装步骤。直接托管文件即可：

```bash
# Python（内置）
python3 -m http.server 8000

# Node.js
npx serve .

# Bun
bunx http-server .
```

然后打开 [http://localhost:8000](http://localhost:8000)。

> **提示**：直接以 `file://` 协议打开 `index.html` 可能因浏览器安全限制导致 IndexedDB 和 ES 模块加载失败。请使用本地服务器。

## 管理后台

1. 打开 `admin.html`
2. 输入 PIN 码：`admin`（默认 — **请在设置中立即更改**）
3. 从标签式仪表板管理所有内容

## 部署

纯静态网站，可部署到任何静态托管服务：

| 平台 | 方法 |
|---|---|
| **GitHub Pages** | 推送到 `main`，在仓库设置中启用 Pages |
| **Netlify** | 连接仓库，发布目录：`/`（根目录） |
| **Vercel** | 导入项目，框架预设：`Other` |
| **Cloudflare Pages** | 连接仓库，构建命令：_（无）_ |
| **S3 + CloudFront** | 上传所有文件到 S3 存储桶 |
| **任何 Web 服务器** | 复制文件到文档根目录 |

无需构建步骤。无需环境变量。无需服务器配置。

---

## License · 许可证

MIT
