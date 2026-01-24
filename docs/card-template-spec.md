# 卡片模板转换规范

本文档描述如何将自定义 HTML 转换为符合系统要求的卡片模板。

---

## 1. 必要结构要求

### 1.1 卡片容器（必须）

```html
<div id="card">
  <!-- 你的内容 -->
</div>
```

- **必须**有 `id="card"` 属性
- 推荐尺寸：小红书竖版图片比例 3:4

### 1.2 基础 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- 可选：中文字体 -->
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body class="m-0 p-0">
  <div id="card">...</div>
</body>
</html>
```

---

## 2. 可用变量列表

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{{rank}}` | 排名 | `1` |
| `{{owner}}` | 仓库所有者 | `microsoft` |
| `{{name}}` | 项目名称 | `vscode` |
| `{{description}}` | 项目描述 | `Visual Studio Code` |
| `{{language}}` | 编程语言 | `TypeScript` |
| `{{languageColor}}` | 语言对应颜色 | `#3178c6` |
| `{{stars}}` | 总星数 | `150,234` |
| `{{todayStars}}` | 今日新增星数 | `+234 stars today` |

---

## 3. 变量使用示例

```html
<!-- 文本内容 -->
<h1>{{name}}</h1>
<p>{{description}}</p>

<!-- 属性中使用（如颜色） -->
<span style="background-color: {{languageColor}}"></span>
```

---

## 4. 转换清单

将你的自定义 HTML 转换为模板时，按以下步骤检查：

- [ ] 主容器添加 `id="card"`
- [ ] 引入 Tailwind CSS CDN
- [ ] 将动态内容替换为对应的 `{{变量名}}`

---
