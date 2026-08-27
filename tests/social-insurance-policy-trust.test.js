const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const policy = require('../social-policy-data.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('政策数据记录最近复核日期', () => {
  assert.match(policy.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test('官方核验地区均保留可追溯来源', () => {
  Object.entries(policy.regionGroups).forEach(([province, group]) => {
    group.regions.filter(region => region.status === 'verified').forEach(region => {
      assert.match(region.source, /^https:\/\//, `${province}-${region.label}缺少官方来源`);
    });
  });
});

test('可信度卡片区分实测、部分官方核验和省级参考', () => {
  assert.match(html, /安徽实测/);
  assert.match(html, /部分官方核验/);
  assert.match(html, /省级参考/);
  assert.match(html, /参考项：/);
  assert.match(html, /最近复核：/);
  assert.match(html, /适用期：/);
  assert.match(html, /官方来源/);
});

test('社保页加载独立计算引擎并提供三种测算模式', () => {
  assert.match(html, /<script src="social-calculation-engine\.js"><\/script>/);
  assert.match(html, /data-mode="gross"/);
  assert.match(html, /data-mode="take-home"/);
  assert.match(html, /data-mode="company-budget"/);
  assert.match(html, />算社保公积金<\/button>/);
  assert.match(html, />反算工资<\/button>/);
  assert.match(html, />按预算算工资<\/button>/);
  assert.match(html, /label: '员工目标工资（社保后）'/);
  assert.match(html, /label: '企业每人月预算'/);
  assert.match(html, /未扣个人所得税/);
});

test('税前工资输入提示随参保地区最低基数变化', () => {
  assert.match(html, /function updateSalaryPlaceholder\(\)/);
  assert.match(html, /rates\.baseLimits\.pension\.min/);
  assert.match(html, /例如算最低基数请输入/);
  assert.match(html, /provSel\.addEventListener\('change',[\s\S]*?updateSalaryPlaceholder\(\)/);
  assert.match(html, /regionSel\.addEventListener\('change',[\s\S]*?updateSalaryPlaceholder\(\)/);
});
