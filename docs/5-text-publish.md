# GitHub Trending 小红书文案生成

基于 [GitHub Trending](../data/current_trending.json) 数据生成小红书分享文案。

## 输出位置

```
output/
```

## 文案结构

| 序号 | 模块 | 说明 |
|------|------|------|
| 1 | 项目列表 | Top10 项目表格（排名、项目名、语言、Stars、简介） |
| 2 | 趋势总结 | 3-4 条精炼的技术趋势洞察，分析最近的技术发展和趋势 |
| 3 | 互动引导 | 点赞、关注引导语 |

## 关键发现（来自数据分析）

- AI Coding Agent 主导榜单（6/10 与 Claude Code 生态相关）
- 核心项目：opencode, vibe-kanban, superpowers, skills, claude-code
- 字节跳动 UI-TARS 入榜
- memos 代表自托管/隐私优先趋势

## 验证清单

- [ ] 确认文件已创建在 `output/` 目录
- [ ] 检查内容格式正确
- [ ] 检查数据准确
