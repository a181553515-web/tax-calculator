const assert = require('node:assert/strict');
const test = require('node:test');

const socialData = require('../social-policy-data.js');
const loanData = require('../housing-fund-policy-data.js');
const resolver = require('../housing-fund-policy-resolver.js');

test('省级公积金上下限直接读取现有社保政策数据', () => {
  const policy = resolver.resolveContributionPolicy(socialData, '江苏', 'province-reference');
  assert.equal(policy.min, socialData.provinceBases['江苏'].fundMin);
  assert.equal(policy.max, socialData.provinceBases['江苏'].fundMax);
  assert.equal(policy.status, 'reference');
});

test('合肥和六安读取现有地市覆盖值而不是复制数据', () => {
  const hefei = resolver.resolveContributionPolicy(socialData, '安徽', 'hefei-urban');
  assert.equal(hefei.min, 2320);
  assert.equal(hefei.max, 31564);
  assert.equal(hefei.status, 'measured');

  const luan = resolver.resolveContributionPolicy(socialData, '安徽', 'luan-urban');
  assert.equal(luan.min, 2170);
  assert.equal(luan.max, 25945);
  assert.equal(luan.status, 'measured');
});

test('没有地市覆盖时回退到省级公积金上下限', () => {
  const policy = resolver.resolveContributionPolicy(socialData, '河北', 'province-reference');
  assert.equal(policy.min, 2200);
  assert.equal(policy.max, 21556);
  assert.equal(policy.regionId, 'province-reference');
});

test('参考地区统一使用无行政层级歧义的名称', () => {
  assert.equal(resolver.listContributionRegions(socialData, '北京')[0].label, '北京常见参考口径');
  assert.equal(resolver.listContributionRegions(socialData, '江苏')[0].label, '江苏常见参考口径');
});

test('全国贷款利率带有效期和正式来源', () => {
  assert.equal(loanData.nationalLoanRates.first.over5Years, 2.6);
  assert.equal(loanData.nationalLoanRates.second.over5Years, 3.075);
  assert.equal(loanData.nationalLoanRates.effectiveFrom, '2025-05-08');
  assert.match(loanData.nationalLoanRates.source, /^https:\/\//);
});

test('已核验城市返回政策上限，其他地区要求手动填写', () => {
  const hefei = resolver.resolveLoanPolicy(loanData, 'anhui-hefei');
  assert.equal(hefei.status, 'verified');
  assert.equal(hefei.caps.standard.single, 900000);
  assert.equal(hefei.caps.standard.family, 1200000);

  const missing = resolver.resolveLoanPolicy(loanData, 'unknown-city');
  assert.equal(missing, null);
});
