<p align="center">
  <img src="logo.webp" alt="Panda Professor" width="140" />
</p>

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

## English

### What is this?

**Panda Professor** is a fully static tourism website for booking private, expert-guided tours of Chengdu, Sichuan. It runs entirely in the browser — no server, no build step, no database. Everything is powered by CDN-hosted libraries and client-side IndexedDB.

### Features

| Feature | Description |
|---|---|
| 🎯 **Curated Tours** | Filterable & searchable tour cards with detail modals, tags, pricing, and favourites |
| 📅 **Day Builder** | Drag-and-drop itinerary planner with time slots, duration, participant count, notes, and shareable URLs |
| ⭐ **Reviews** | Horizontally scrolling traveller testimonial carousel |
| ❓ **FAQ** | Accordion-style frequently asked questions |
| 💬 **Chat Widget** | Interactive panda-themed chat assistant with keyword-matched responses and fun panda facts |
| 🌐 **Bilingual i18n** | Full English ↔ 中文 toggle — every string, ARIA label, and placeholder is translated |
| 🎨 **Multi-Theme** | 10+ DaisyUI themes selectable at runtime (Emerald, Dark, Cyberpunk, etc.) |
| 🔒 **Admin Dashboard** | PIN-protected panel to manage tours, FAQs, reviews, panda facts, images, bookings, site settings, and chatbot responses |
| 💾 **Offline-First** | All data persisted in IndexedDB via localForage — works without a network after first load |
| ♿ **Accessible** | Skip links, ARIA roles, focus management, keyboard navigation, and screen-reader support |

### Tech Stack

| Layer | Technology |
|---|---|
| Structure | Semantic HTML5 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) (CDN) + custom `style.css` |
| Components | [DaisyUI 5](https://daisyui.com/) (CDN) |
| Icons | [Lucide](https://lucide.dev/) (local bundle) |
| Persistence | [localForage](https://localforage.github.io/localForage/) → IndexedDB |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

### Project Structure

```
panda/
├── index.html          # Public-facing tour website
├── admin.html          # Admin dashboard (PIN-protected)
├── manual.html         # Admin user manual
├── style.css           # Custom styles & animations
├── logo.png / .webp    # Brand logo
├── js/
│   ├── data.js         # Translations (EN/ZH), tour seed data, FAQs, reviews
│   ├── db.js           # PandaDB — IndexedDB adapter (localForage)
│   ├── app.js          # Main app logic — rendering, i18n, theming, chat
│   ├── admin.js        # Admin dashboard logic
│   └── lucide.min.js   # Lucide icon library (local)
├── images/             # Tour & panda photos
└── icons/              # Social media SVG icons
```

### Run Locally

Open `index.html` directly in your browser, or start any static file server:

```bash
# Python
python3 -m http.server

# Node
npx serve .

# Bun
bunx http-server .
```

### Admin Access

1. Open `admin.html`
2. Default PIN: `1234` (change immediately in Settings)
3. Manage tours, FAQs, reviews, images, bookings, and site branding

### Screenshots

> Open the site and toggle between themes and languages to see the full experience.

---

## 中文说明

### 这是什么？

**熊猫教授** 是一个纯静态的成都旅游预订网站，提供由当地学者带队的私人定制旅行。整个网站完全在浏览器中运行 — 无需服务器、无需构建工具、无需数据库。所有功能均由 CDN 托管的库和客户端 IndexedDB 驱动。

### 功能特性

| 功能 | 说明 |
|---|---|
| 🎯 **精选路线** | 可筛选、可搜索的旅行卡片，支持详情弹窗、标签分类、价格展示和收藏功能 |
| 📅 **行程规划器** | 拖放式行程编排，支持时间段、时长、人数、备注和分享链接 |
| ⭐ **游客评价** | 横向滚动的游客评价轮播组件 |
| ❓ **常见问题** | 手风琴折叠式常见问题解答 |
| 💬 **聊天助手** | 熊猫主题互动聊天组件，支持关键词匹配回复和趣味熊猫知识 |
| 🌐 **双语支持** | 英文 ↔ 中文一键切换 — 所有文本、ARIA 标签、占位符均已翻译 |
| 🎨 **多主题** | 10+ 个 DaisyUI 主题可供实时切换（Emerald、Dark、Cyberpunk 等） |
| 🔒 **管理后台** | PIN 码保护的管理面板，可管理路线、FAQ、评价、熊猫趣闻、图片库、预约和站点设置 |
| 💾 **离线优先** | 所有数据通过 localForage 持久化到 IndexedDB — 首次加载后可离线使用 |
| ♿ **无障碍** | 跳转链接、ARIA 角色、焦点管理、键盘导航和屏幕阅读器支持 |

### 技术栈

| 层级 | 技术 |
|---|---|
| 结构 | 语义化 HTML5 |
| 样式 | [Tailwind CSS 4](https://tailwindcss.com/)（CDN）+ 自定义 `style.css` |
| 组件 | [DaisyUI 5](https://daisyui.com/)（CDN） |
| 图标 | [Lucide](https://lucide.dev/)（本地打包） |
| 持久化 | [localForage](https://localforage.github.io/localForage/) → IndexedDB |
| 字体 | [Inter](https://fonts.google.com/specimen/Inter)（Google Fonts） |

### 项目结构

```
panda/
├── index.html          # 面向用户的旅游网站
├── admin.html          # 管理后台（PIN 码保护）
├── manual.html         # 管理员使用手册
├── style.css           # 自定义样式和动画
├── logo.png / .webp    # 品牌标识
├── js/
│   ├── data.js         # 翻译文件（中/英）、路线种子数据、FAQ、评价
│   ├── db.js           # PandaDB — IndexedDB 数据适配器（localForage）
│   ├── app.js          # 主程序逻辑 — 渲染、国际化、主题、聊天
│   ├── admin.js        # 管理后台逻辑
│   └── lucide.min.js   # Lucide 图标库（本地）
├── images/             # 旅行和熊猫照片
└── icons/              # 社交媒体 SVG 图标
```

### 本地运行

直接在浏览器中打开 `index.html`，或启动任意静态文件服务器：

```bash
# Python
python3 -m http.server

# Node
npx serve .

# Bun
bunx http-server .
```

### 管理后台

1. 打开 `admin.html`
2. 默认 PIN 码：`1234`（请在设置中立即更改）
3. 可管理路线、FAQ、评价、图片、预约和品牌设置

---

## License · 许可证

MIT

