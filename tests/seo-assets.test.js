const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(root, 'social-insurance.html'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const pagesConfig = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
const shareImageUrl = 'https://xiaobo-tax.cn/assets/xiaobo-tax-share-v2.jpg';

test('robots 声明的 sitemap 在本地存在且包含两个公开工具入口', () => {
  assert.match(robots, /^Sitemap: https:\/\/xiaobo-tax\.cn\/sitemap\.xml$/m);
  assert.match(sitemap, /<loc>https:\/\/xiaobo-tax\.cn\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/xiaobo-tax\.cn\/social-insurance\.html<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-08-19<\/lastmod>/);
  assert.match(sitemap, /<lastmod>2026-10-13<\/lastmod>/);
});

test('GitHub Pages 不发布内部部署说明和政策维护记录', () => {
  assert.match(pagesConfig, /- 部署说明\.md/);
  assert.match(pagesConfig, /- docs\/policy-sources/);
  assert.equal(fs.existsSync(path.join(root, 'docs', 'plans')), false);
});

test('两个工具页具备搜索与分享所需的压缩图片元信息', () => {
  assert.match(index, /<meta name="description" content="[^"]+">/);
  assert.match(index, /<link rel="canonical" href="https:\/\/xiaobo-tax\.cn\/">/);
  assert.match(social, /<link rel="canonical" href="https:\/\/xiaobo-tax\.cn\/social-insurance\.html">/);
  [index, social].forEach((page) => {
    assert.ok(page.includes(`<meta property="og:image" content="${shareImageUrl}">`));
    assert.ok(page.includes(`<meta property="og:image:url" content="${shareImageUrl}">`));
    assert.ok(page.includes(`<meta property="og:image:secure_url" content="${shareImageUrl}">`));
    assert.ok(page.includes(`<meta name="twitter:image" content="${shareImageUrl}">`));
    assert.ok(page.includes(`<meta itemprop="image" content="${shareImageUrl}">`));
  });
  const image = fs.statSync(path.join(root, 'assets', 'xiaobo-tax-share-v2.jpg'));
  assert.ok(image.size > 0 && image.size < 300 * 1024, '分享图应小于 300KB，降低微信抓取超时风险');
});
