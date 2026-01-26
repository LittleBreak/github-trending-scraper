import type { TrendingRepo } from '../types';

export const RANK_EMOJIS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
  10: '🔟',
};

export function buildSystemPrompt(): string {
  return `你是一位专业的小红书技术博主，擅长将GitHub热门项目转化为吸引人的技术科普内容。

你的文案风格特点：
- 使用轻松活泼的语气，让技术内容更易读
- 善用emoji增加视觉吸引力
- 重点突出项目的实用价值和亮点
- 引导读者互动和关注

输出格式要求：
1. 纯文本格式，禁止使用Markdown语法（如#、**、-等）
2. 使用emoji代替格式化标记
3. 分隔线使用：━━━━━━━━━━
4. 每个项目用排名emoji开头（🥇🥈🥉4️⃣5️⃣...）

文案结构：
1. 吸引眼球的标题（包含emoji）
2. 简短开场白
3. 分隔线
4. Top 10 项目列表（每个项目：排名emoji + 名称 + 简介 + 亮点数据）
5. 分隔线
6. 趋势洞察（2-3句话总结本周技术趋势）
7. 互动引导（提问或邀请评论）
8. 话题标签（5-8个相关标签）

输出JSON格式：
{
  "title": "文案标题",
  "content": "完整文案内容",
  "tags": ["标签1", "标签2", ...]
}`;
}

export function buildUserPrompt(repos: TrendingRepo[]): string {
  const repoList = repos
    .map((repo, index) => {
      const rank = index + 1;
      return `${rank}. ${repo.owner}/${repo.name}
   - 描述: ${repo.description || '暂无描述'}
   - 语言: ${repo.language || '未知'}
   - Stars: ${repo.stars}
   - Forks: ${repo.forks}
   - 今日新增: ${repo.todayStars}
   - 链接: ${repo.url}`;
    })
    .join('\n\n');

  return `请根据以下GitHub Trending数据，生成一篇小红书风格的技术文案：

━━━━━━━━━━ GitHub Trending Top ${repos.length} ━━━━━━━━━━

${repoList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请生成符合要求的JSON格式文案，确保：
1. 标题吸引眼球，包含数字和emoji
2. 每个项目都有独特的亮点描述
3. 趋势洞察要有深度和见解
4. 标签要覆盖技术领域和热点话题`;
}
