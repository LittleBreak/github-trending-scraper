/**
 * 测试小红书发布功能
 * 使用已有的 output/post.txt 和 output/cards/ 作为数据源
 */
import { publishFromOutput } from './src/publisher';

async function main() {
  try {
    await publishFromOutput();
    console.log('\n✅ Publish test completed successfully!');
  } catch (error) {
    console.error('\n❌ Publish test failed:', (error as Error).message);
    process.exit(1);
  }
}

main();
