const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 データベース初期化を開始します...');

try {
  // 1. Prismaクライアントを生成
  console.log('📦 Prismaクライアントを生成中...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. 既存のデータベースファイルを削除（もしあれば）
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  if (fs.existsSync(dbPath)) {
    console.log('🗑️ 既存のデータベースファイルを削除中...');
    fs.unlinkSync(dbPath);
  }

  // 3. データベースをプッシュ（マイグレーションを適用）
  console.log('🏗️ データベーススキーマを適用中...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // 4. テストデータをシード
  console.log('🌱 テストデータを投入中...');
  execSync('npx tsx prisma/seed-test.ts', { stdio: 'inherit' });

  console.log('✅ データベース初期化が完了しました！');
  console.log('');
  console.log('📋 作成されたデータ:');
  console.log('   - 2025年7月の口火ライブ 10回分');
  console.log('   - 各ライブ定員: 10組');
  console.log('');
  console.log('🚀 サーバーを起動してテストを開始できます:');
  console.log('   npm run dev');

} catch (error) {
  console.error('❌ データベース初期化に失敗しました:', error.message);
  process.exit(1);
}