const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

test('robots 声明的 sitemap 在本地存在且包含两个公开工具入口', () => {
  assert.match(robots, /^Sitemap: https:\/\/xiaobo-tax\.cn\/sitemap\.xml$/m);
  assert.match(sitemap, /<loc>https:\/\/xiaobo-tax\.cn\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/xiaobo-tax\.cn\/social-insurance\.html<\/loc>/);
});

test('个税页具备搜索与分享所需的基础元信息', () => {
  assert.match(index, /<meta name="description" content="[^"]+">/);
  assert.match(index, /<link rel="canonical" href="https:\/\/xiaobo-tax\.cn\/">/);
  assert.match(index, /<meta property="og:image" content="https:\/\/xiaobo-tax\.cn\/assets\/xiaobo-tax-share-v1\.png">/);
  assert.match(index, /<meta name="twitter:card" content="summary_large_image">/);
  assert.ok(fs.statSync(path.join(root, 'assets', 'xiaobo-tax-share-v1.png')).size > 0);
});
