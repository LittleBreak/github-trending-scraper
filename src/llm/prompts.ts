import type { TrendingRepo } from '../types';
import { readFile } from 'fs/promises';
import { join } from 'path';
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

export async function buildSystemPrompt(): Promise<string> {
  const content = await readFile(
    join(__dirname, 'system-prompt.md'),
    'utf-8'
  )
  return content
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

  return `请根据以下GitHub Trending数据，生成一篇小红书风格的技术文案,：

━━━━━━━━━━ GitHub Trending Top ${repos.length} ━━━━━━━━━━

${repoList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请生成符合要求的文案，确保：
1. 标题吸引眼球，包含数字和emoji，且标题总长度不超过20个字符（含emoji和标点）
2. 每个项目都有独特的亮点描述
3. 趋势洞察要有深度和见解
4. 标签要覆盖技术领域和热点话题`;
}
