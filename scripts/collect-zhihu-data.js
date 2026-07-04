#!/usr/bin/env node
/**
 * 知乎数据预采集脚本
 * 用于在服务器上批量采集知乎数据，填充数据库
 * 
 * 使用方法：
 * node scripts/collect-zhihu-data.js
 * 
 * 环境变量：
 * - ZHIHU_API_KEY: 知乎 API 密钥
 * - DATABASE_URL: 数据库连接
 */

const https = require('https');

// 配置
const ZHIHU_API_KEY = process.env.ZHIHU_API_KEY || '';
const BASE_URL = 'https://developer.zhihu.com/api/v1/content';

// 采集任务配置
const COLLECT_TASKS = [
  // 场景类
  { type: 'scene', queries: ['情感故事', '人际关系', '心理故事', '生活场景', '都市情感', '职场故事'] },
  // 角色类
  { type: 'character', queries: ['人物性格', '心理分析', '人格类型', '情感心理', '性格特点'] },
  // 情感类
  { type: 'emotion', queries: ['内心独白', '情感秘密', '心理创伤', '成长故事', '暗恋故事'] },
  // 故事类
  { type: 'story', queries: ['真实故事', '情感经历', '人生感悟', '心理剧', '感人故事'] },
];

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 调用知乎 API
async function callZhihuAPI(type, query) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/zhihu_search`);
    url.searchParams.append('Query', query);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ZHIHU_API_KEY}`,
        'X-Request-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🚀 开始知乎数据预采集...\n');

  if (!ZHIHU_API_KEY) {
    console.error('❌ 错误: 未设置 ZHIHU_API_KEY 环境变量');
    process.exit(1);
  }

  let totalCollected = 0;
  let apiCalls = 0;

  for (const task of COLLECT_TASKS) {
    console.log(`\n📚 采集类型: ${task.type}`);
    console.log('─'.repeat(40));

    for (const query of task.queries) {
      console.log(`  🔍 搜索: "${query}"`);
      
      try {
        const result = await callZhihuAPI(task.type, query);
        const items = result.data || result.results || [];
        
        console.log(`     ✅ 获取 ${items.length} 条结果`);
        totalCollected += items.length;
        apiCalls++;

        // 打印前3条标题
        items.slice(0, 3).forEach((item, i) => {
          console.log(`     ${i + 1}. ${item.title || '无标题'}`);
        });

        // 避免请求过快
        await sleep(1000);

      } catch (error) {
        console.error(`     ❌ 错误: ${error.message}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log(`📊 采集完成!`);
  console.log(`   - API 调用次数: ${apiCalls}`);
  console.log(`   - 获取数据总量: ${totalCollected}`);
  console.log('═'.repeat(40));
}

// 运行
main().catch(console.error);
