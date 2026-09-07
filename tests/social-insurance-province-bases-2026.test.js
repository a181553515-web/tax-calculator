const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const policy = require('../social-policy-data.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('2026年正式发布统一主基数的省级地区使用最新上下限', () => {
  const expected = {
    '北京': [7270, 36348],
    '天津': [5180, 25902],
    '河北': [4076, 20382],
    '山西': [4244, 21219],
    '内蒙古': [5058, 25290],
    '辽宁': [4533, 22665],
    '上海': [7546, 37731],
    '湖南': [4106, 20529],
    '云南': [4403, 22017],
    '甘肃': [4526, 22626],
    '宁夏': [5023, 25113]
  };

  Object.entries(expected).forEach(([province, limits]) => {
    assert.deepEqual(
      [policy.provinceBases[province].min, policy.provinceBases[province].max],
      limits,
      `${province}主基数不符合2026年正式标准`
    );
  });
});

test('只更新正式文件明确覆盖的险种，不把主基数误套到医保', () => {
  assert.deepEqual(
    [policy.provinceBases['河北'].medicalMin, policy.provinceBases['河北'].medicalMax],
    [4311, 21556]
  );
  assert.deepEqual(
    [policy.provinceBases['辽宁'].medicalMin, policy.provinceBases['辽宁'].medicalMax],
    [4359, 21792]
  );
  assert.deepEqual(
    [policy.provinceBases['辽宁'].unemploymentMin, policy.provinceBases['辽宁'].unemploymentMax],
    [4359, 21792]
  );
  assert.deepEqual(
    [policy.provinceBases['辽宁'].injuryMin, policy.provinceBases['辽宁'].injuryMax],
    [4359, 21792]
  );
  assert.deepEqual(
    [policy.provinceBases['湖南'].medicalMin, policy.provinceBases['湖南'].medicalMax],
    [4480, 22400]
  );
  assert.deepEqual(
    [policy.provinceBases['甘肃'].medicalMin, policy.provinceBases['甘肃'].medicalMax],
    [4610, 22014]
  );
});

test('内蒙古医保和福建工伤使用独立的2026年正式上下限', () => {
  assert.deepEqual(
    [policy.provinceBases['内蒙古'].medicalMin, policy.provinceBases['内蒙古'].medicalMax],
    [6744, 25290]
  );
  assert.deepEqual(
    [policy.provinceBases['福建'].injuryMin, policy.provinceBases['福建'].injuryMax],
    [4579, 22893]
  );
  assert.equal(policy.provinceBases['福建'].medicalMin, undefined);
  assert.equal(policy.provinceBases['福建'].medicalMax, undefined);
});

test('正式基数政策记录险种范围、生效期和可追溯来源', () => {
  const policies = policy.provinceBasePolicies;
  assert.equal(Object.keys(policies).length, 12);

  Object.entries(policies).forEach(([province, item]) => {
    assert.match(item.reviewedAt, /^2026-\d{2}-\d{2}$/, `${province}缺少复核日期`);
    assert.ok(item.effectiveFrom || item.effectivePeriod, `${province}缺少生效期`);
    assert.ok(item.verifiedInsurances.length > 0, `${province}缺少已核验险种`);
    assert.ok(item.sources.length > 0, `${province}缺少政策来源`);
    item.sources.forEach(source => {
      assert.match(source.url, /^https:\/\//, `${province}来源不是HTTPS链接`);
    });
  });
});

test('页面把省级正式基数标为部分核验并显示相应来源', () => {
  assert.match(html, /SOCIAL_POLICY_DATA\.provinceBasePolicies/);
  assert.match(html, /rates\.regionBaseVerifiedLabel/);
  assert.match(html, /rates\.regionHasPartialBases/);
  assert.match(html, /rates\.regionBaseSources\.forEach/);
  assert.match(html, /其他险种基数/);
  assert.doesNotMatch(html, /badgeClass = ''/);
});
