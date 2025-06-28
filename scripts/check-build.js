#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkBuild() {
  console.log('🔍 Vercelと同じビルドチェックを実行中...\n');

  const checks = [
    {
      name: 'TypeScript型チェック',
      command: 'npx tsc --noEmit --skipLibCheck',
      critical: true
    },
    {
      name: 'ESLint',
      command: 'npm run lint',
      critical: false
    },
    {
      name: 'Prisma生成',
      command: 'npx prisma generate',
      critical: true
    },
    {
      name: 'Next.jsビルド',
      command: 'npm run build',
      critical: true
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      console.log(`⏳ ${check.name}を実行中...`);
      const { stdout, stderr } = await execAsync(check.command);
      
      if (stderr && check.critical) {
        console.log(`❌ ${check.name} エラー:`);
        console.log(stderr);
        allPassed = false;
      } else {
        console.log(`✅ ${check.name} 成功`);
      }
    } catch (error) {
      console.log(`❌ ${check.name} 失敗:`);
      console.log(error.stdout || error.message);
      if (check.critical) {
        allPassed = false;
      }
    }
    console.log('---');
  }

  if (allPassed) {
    console.log('🎉 全チェック成功！Vercelデプロイ準備完了です');
  } else {
    console.log('⚠️  エラーがあります。修正してから再実行してください');
    process.exit(1);
  }
}

checkBuild().catch(console.error);