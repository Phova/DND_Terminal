# Dragontail Terminal

> 🐉 越过龙脊山脉，踏入未知领域 —— 一款为 DND 5e 跑团而生的奇幻终端

Dragontail Terminal 是一个实时同步的桌面/Web 应用，让地下城主（DM）和玩家在同一个奇幻终端生态中协作。GM 通过「地下城主帷幕」管理角色、怪物、法术、遭遇和游戏时间；玩家通过「冒险者终端」查看角色卡、法术位、装备并与 DM 实时互动。

## 截图

*（待补充 — 可通过 http://localhost:5173 和 http://localhost:5174 预览）*

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Express 5 + Socket.IO 4 + SQLite (sql.js) + TypeScript |
| GM 客户端 | Vite 7 + React 19 + TypeScript |
| 玩家客户端 | Vite 7 + React 19 + Sass + TypeScript |
| 启动器 | Electron (计划中) |

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 1. 克隆仓库
git clone <repo-url>
cd dragontail

# 2. 安装所有依赖
cd backend && npm install && cd ../gm-client && npm install && cd ../player-client && npm install && cd ..

# 3. 启动后端（端口 3100）
cd backend && npm run dev

# 4. 新开终端，启动 GM 帷幕（端口 5173）
cd gm-client && npm run dev

# 5. 新开终端，启动玩家终端（端口 5174）
cd player-client && npm run dev
```

> 也可以使用根目录的 `npm run dev` 一键启动三服务（需要 concurrently）。

### 访问

- **GM 帷幕**: http://localhost:5173
- **玩家终端**: http://localhost:5174
- **后端健康检查**: http://localhost:3100/api/health

### 预设登录

| 用户名 | 密码 | 角色 |
|---|---|---|
| `gandalf` | `greyhame` | 甘道夫·灰袍 (Lv.5 人类法师) |

## 功能

### 地下城主帷幕 (GM Client)

- **队伍面板** — 左侧角色列表，HP 条实时变化，点击查看完整角色卡
- **角色卡** — 六维属性(力量/敏捷/体质/智力/感知/魅力)、18 项技能(点击直接掷检定)、HP/AC/先攻/速度/感知、法术位、状态标记、背景故事
- **骰子投掷** — d4~d100 快速按钮、优势/劣势 d20、自定义表达式(如 `2d6+3`)、关联角色自动叠加属性修正
- **怪物图鉴** — 搜索 + 挑战等级(CR)筛选、快速查看 AC/HP/类型
- **法术书** — 搜索 + 环阶/学派筛选、详情面板
- **先攻追踪器** — 选择角色+怪物 → 一键投先攻自动排序 → 回合推进(▶指针高亮当前行动者) → 结束战斗
- **游戏时间** — 被遗忘国度 12 月奇幻日历，暂停/恢复/快进
- **实时同步** — Socket.IO 推送 HP 变化、先攻推进、骰子结果到 GM 和玩家客户端

### 冒险者终端 (Player Client)

- **登录界面** — 符文风格，输入冒险者之名和暗号
- **角色卡** — 六维属性面板、种族/职业/等级/头衔、语言
- **法术位** — ●已用/○剩余可视化显示
- **装备** — 背包物品列表
- **冒险日志** — 背景故事与个性展示

### 后端 API

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/characters` | CRUD | 角色卡管理 |
| `/api/characters/login` | POST | 玩家登录 |
| `/api/characters/:id/hp` | PATCH | HP 伤害/治疗 |
| `/api/party` | CRUD | 队伍管理 |
| `/api/monsters` | GET | 怪物图鉴（支持搜索/CR筛选） |
| `/api/spells` | GET | 法术查询（搜索/环阶/学派/职业） |
| `/api/encounters` | CRUD | 遭遇管理 |
| `/api/encounters/:id/start` | POST | 投先攻开始战斗 |
| `/api/encounters/:id/next-turn` | POST | 下一回合 |
| `/api/encounters/:id/end` | POST | 结束战斗 |
| `/api/dice/roll` | POST | 掷骰（支持优劣势/技能修正） |
| `/api/game-time` | GET/PUT | 奇幻日历管理 |
| `/api/apps` | CRUD | 卷轴/预兆/编年史等 App |
| `/api/settings` | GET/PUT | 系统设置 |
| `/api/health` | GET | 健康检查 |

## 项目结构

```
dragontail/
├── backend/               # Express + Socket.IO + SQLite
│   └── src/
│       ├── server.ts       # 服务入口
│       ├── db/database.ts  # sql.js 初始化 + 9 张表
│       ├── routes/         # API 路由 (9 个文件)
│       ├── services/       # 日历/玩家活动/Socket 服务
│       ├── repositories/   # 数据持久层
│       ├── types/          # TypeScript 类型定义
│       └── config/         # 运行时配置
├── gm-client/             # Vite + React DM 面板
│   └── src/
│       ├── App.tsx         # 主布局 + 六视图导航
│       ├── components/     # 7 个核心组件
│       ├── hooks/          # useGameClock 等
│       └── styles/         # 羊皮纸主题 CSS
├── player-client/         # Vite + React 玩家终端
│   └── src/
│       ├── App.tsx         # 登录 + 四标签终端
│       └── styles/         # 暗色魔法主题 CSS
└── package.json           # monorepo 根
```

## 主题预设

| 预设 | 风格 | 适用场景 |
|---|---|---|
| Parchment (羊皮纸) | 暖棕底色/金边/Cinzel 衬线体 | GM 帷幕默认 |
| Candlelight (烛光) | 黑底金字/橙焰辉光/手写体 | 玩家终端默认 |
| Arcane (奥术) | 蓝紫辉光/符文风格 | 法师角色 |
| Dragonfire (龙焰) | 红焰/哥特体 | 战斗场景 |

## 开发路线图

- [x] 后端核心 API + 数据库
- [x] GM 帷幕 (角色卡/怪物/法术/骰子/先攻追踪器)
- [x] 玩家终端 (登录/角色视图)
- [ ] 传讯石系统 (消息通信)
- [ ] 广播系统 (全屏警报)
- [ ] 玩家视觉特效 (奥术辉光/暗影腐蚀)
- [ ] BattleMap 战术地图
- [ ] 游戏存档导出/导入
- [ ] Electron 启动器
- [ ] 预置冒险模组

## 许可

MIT License

## 致谢

- 灵感来源: [Phosphorite](https://github.com/keelhauler95/phosphorite)
- DND 5e 参考资料: [5eTools 中文站](https://5e.kiwee.top/)
