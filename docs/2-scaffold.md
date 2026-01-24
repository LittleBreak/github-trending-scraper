
你只需要搭建一个 **“TypeScript 命令行工具 (CLI) 环境”**。

作为“第一步”，你的核心目标是：**搭建一个能够支持 TDD（测试驱动开发）的 TypeScript 运行环境。**

请直接按照以下 4 个步骤操作，这将是你项目的坚实地基：

### 第一步：初始化项目与安装核心依赖

打开你的终端，创建一个新文件夹并初始化。

```bash
pnpm init

```

接着，安装**TypeScript** 和 **执行工具**（`tsx` 是一个可以直接运行 TypeScript 文件的现代工具，比传统的 `ts-node` 更快）：

```bash
pnpm add -D typescript tsx @types/node

```

### 第二步：配置 TypeScript (tsconfig.json)

这是 TS 项目的灵魂。运行以下命令生成配置文件，或者直接创建 `tsconfig.json`：

```bash
npx tsc --init

```

建议将内容修改为适合 Node.js 脚本的配置（我帮你精简过了）：

```json
{
  "compilerOptions": {
    "target": "ES2022",            // 现代 Node 版本支持的语法
    "module": "NodeNext",          // 使用现代模块标准
    "moduleResolution": "NodeNext",
    "outDir": "./dist",            // 编译输出目录
    "rootDir": "./src",            // 源码目录
    "strict": true,                // 开启严格模式 (TS 的精髓)
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "tests/**/*"]
}

```

### 第三步：搭建 TDD 环境 (Vitest) 🎯

既然你在学习 TDD，这一步至关重要。你需要一个测试框架。我强烈推荐 **Vitest**，它配置极简，速度极快，且 API 和 Jest 几乎兼容。

1. **安装 Vitest：**
```bash
pnpm add -D vitest

```


2. **配置 pnpm 脚本 (`package.json`)：**
这样你就可以通过 `pnpm test` 来运行测试，通过 `pnpm start` 来运行脚本。
```json
"scripts": {
  "start": "tsx src/index.ts",
  "test": "vitest",           // 运行一次
  "test:watch": "vitest watch" // 监听模式，TDD 必备
}

```



### 第四步：规划目录结构

一个清晰的结构能让你写代码时心里不慌。建议按以下结构创建文件：

```text
github-trending-weekly/
├── src/
│   ├── index.ts           # 入口文件
│   ├── scraper.ts         # 爬虫逻辑 (核心)
│   ├── types.ts           # 类型定义
│   └── utils.ts           # 工具函数 (如日期处理)
├── tests/
│   ├── scraper.test.ts    # 爬虫测试文件
│   └── mock_data.html     # 本地保存的 HTML 样本 (用于 Mock)
├── data/                  # 存放生成的 json 结果
├── package.json
└── tsconfig.json

```

---
