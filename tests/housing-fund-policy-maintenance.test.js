const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const socialData = require('../social-policy-data.js');
const fundData = require('../housing-fund-policy-data.js');
const resolver = require('../housing-fund-policy-resolver.js');

test('贷款政策都包含核验状态、生效日、复核日和官方来源', () => {
  for (const [id, policy] of Object.entries(fundData.loanPolicies)) {
    assert.equal(policy.status, 'verified', `${id} 应标记为已核验`);
    assert.match(policy.effectiveFrom, /^\d{4}-\d{2}-\d{2}$/, `${id} 缺少生效日期`);
    assert.match(policy.reviewedAt, /^\d{4}-\d{2}-\d{2}$/, `${id} 缺少复核日期`);
    assert.match(policy.source, /^https:\/\//, `${id} 缺少官方来源链接`);
    assert.ok(policy.capLabels && Object.keys(policy.capLabels).length > 0, `${id} 缺少用户可读的政策情形名称`);
    assert.deepEqual(
      Object.keys(policy.capLabels).sort(),
      Object.keys(policy.caps).sort(),
      `${id} 的政策情形名称与额度数据不一致`
    );
  }
});

test('贷款政策文件不重复保存公积金缴存上下限', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'housing-fund-policy-data.js'),
    'utf8'
  );

  assert.doesNotMatch(source, /\bfundMin\b/);
  assert.doesNotMatch(source, /\bfundMax\b/);
  assert.doesNotMatch(source, /\bcontributionLimits?\b/);
});

test('所有省份都能从社保政策单一数据源解析公积金缴存范围', () => {
  for (const province of Object.keys(socialData.provinceBases)) {
    const regions = resolver.listContributionRegions(socialData, province);
    assert.ok(regions.length > 0, `${province} 缺少可选缴存地区`);

    for (const region of regions) {
      const policy = resolver.resolveContributionPolicy(socialData, province, region.id);
      assert.ok(policy, `${province}/${region.id} 无法解析`);
      assert.ok(Number.isFinite(policy.min) && policy.min > 0, `${province}/${region.id} 下限无效`);
      assert.ok(Number.isFinite(policy.max) && policy.max >= policy.min, `${province}/${region.id} 上限无效`);
    }
  }
});

test('贷款地区列表只由贷款政策单一数据源生成', () => {
  const policies = resolver.listLoanPolicies(fundData);
  assert.deepEqual(
    policies.map((policy) => policy.id).sort(),
    Object.keys(fundData.loanPolicies).sort()
  );
  assert.ok(policies.every((policy) => policy.label && policy.caps));
});
