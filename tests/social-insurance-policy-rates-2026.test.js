const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const policy = require(path.join(__dirname, '..', 'social-policy-data.js'));
const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');
const engineSource = fs.readFileSync(path.join(__dirname, '..', 'social-calculation-engine.js'), 'utf8');

function findRegion(province, id) {
  return policy.regionGroups[province].regions.find(region => region.id === id);
}

test('2026年已核验基础费率更新且安徽实测口径不变', () => {
  assert.deepEqual(policy.provinceRates['上海'].medical, [9, 2]);
  assert.deepEqual(policy.provinceRates['浙江'].pension, [16, 8]);
  assert.deepEqual(policy.provinceRates['江西'].medical, [6.8, 2]);
  assert.deepEqual(policy.provinceRates['山东'].medical, [8, 2]);
  assert.deepEqual(policy.provinceRates['安徽'], {
    pension:[16,8], medical:[6.4,2], unemployment:[0.5,0.5]
  });
});

test('医保可以使用独立于养老失业工伤的缴费基数', () => {
  assert.deepEqual(
    [policy.provinceBases['福建'].medicalMin, policy.provinceBases['福建'].medicalMax],
    [4579, 22893]
  );
  assert.match(engineSource, /var medicalBase = clampBase\(socialBaseInputs\.medical, rates\.baseLimits\.medical\)/);
  assert.match(engineSource, /medicalBase: medicalBase/);
  assert.match(html, /医保基数/);
});

test('广东按省级统筹八档工伤基准费率计算', () => {
  assert.deepEqual(policy.defaultInjuryRates, [0.2, 0.4, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9]);
  assert.deepEqual(policy.provinceRates['广东'].injuryRates, [0.2, 0.4, 0.6, 0.8, 0.9, 1, 1.2, 1.4]);
  assert.match(policy.defaultInjurySource, /^https:\/\//);
  assert.match(policy.provinceRates['广东'].injurySource, /^https:\/\//);
  assert.match(html, /rates\.injuryRates\[rates\.injuryCategory - 1\]/);
  assert.doesNotMatch(html, /rates\.injury = parseFloat\(industrySel\.value\)/);
});

test('每个省都能回退到完整的八类工伤费率，地区基数覆盖结构有效', () => {
  Object.entries(policy.provinceRates).forEach(([province, rates]) => {
    const injuryRates = rates.injuryRates || policy.defaultInjuryRates;
    assert.equal(injuryRates.length, 8, `${province}工伤费率应为八档`);
    injuryRates.forEach(rate => assert.ok(rate > 0));
  });

  Object.values(policy.regionGroups).forEach(group => {
    group.regions.forEach(region => {
      if (!region.bases) return;
      Object.values(region.bases).forEach(limits => {
        assert.ok(limits.min > 0);
        assert.ok(limits.max >= limits.min);
      });
    });
  });
});

test('工伤行业选项使用正确的国家八类行业示例', () => {
  assert.match(html, /value="1">一类[^<]*软件\/金融/);
  assert.match(html, /value="2">二类[^<]*批发零售[^<]*商务服务/);
  assert.match(html, /value="4">四类[^<]*农业[^<]*医药制造/);
  assert.match(html, /value="5">五类[^<]*建筑安装[^<]*道路运输/);
  assert.match(html, /value="6">六类[^<]*化工[^<]*房屋建筑/);
  assert.match(html, /value="8">八类[^<]*煤炭[^<]*金属矿/);
});

test('苏州固定医疗费用和南昌补充工伤进入地区覆盖', () => {
  const suzhou = findRegion('江苏', 'suzhou');
  assert.deepEqual(suzhou.rates.medical, [7, 2]);
  assert.equal(suzhou.rates.maternityEmployer, 0.8);
  assert.equal(suzhou.rates.medicalFixed, 5);

  const nanchang = findRegion('江西', 'nanchang');
  assert.equal(nanchang.rates.injurySupplementEmployerFactor, 0.3);
  assert.match(html, /补充工伤保险/);
  assert.match(html, /injurySupplementEmp/);
});

test('工伤结果明确为基准估算并排除工程项目参保', () => {
  assert.match(html, /未考虑参保单位实际浮动费率/);
  assert.match(html, /不适用于按工程项目参保/);
});

test('长期护理险不再按全国统一的单位个人各0.15%硬算', () => {
  assert.doesNotMatch(html, /rates\.longTermCare = longTermCheck\.checked \? 0\.15 : 0/);
  assert.match(html, /longTermCarePolicy/);
  assert.match(html, /longTermCheck\.disabled = !longTermPolicy/);
});

test('个人医保固定金额在明细行和合计中保持一致', () => {
  assert.match(html, /round2\(r\.medicalPer \+ r\.medicalFixedPer\)/);
});
