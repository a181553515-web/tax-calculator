const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const Engine = require('../js/social-policy-engine.js');

const verifiedPolicy = {
  id: 'test-city-2026',
  label: '测试统筹区（仅测试）',
  region: { province: '测试省', city: '测试市', poolingArea: '测试统筹区' },
  status: 'verified',
  scope: '企业职工',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  sources: [{ title: '测试政策来源', url: 'https://example.com/policy' }],
  reviewedAt: '2026-07-23',
  reviewedBy: '测试人员',
  calculation: {
    siBase: { min: 4000, max: 20000 },
    fundBase: { min: 4000, max: 20000 },
    rates: {
      pension: { employer: 16, personal: 8 },
      medical: { employer: 7, personal: 2 },
      unemployment: { employer: 0.5, personal: 0.5 },
      injury: { employer: 0.2 },
      maternity: { employer: 0 },
      longTermCare: { employer: 0, personal: 0 },
      medicalFixed: { employer: 0, personal: 0 },
    },
    fund: { minRatio: 5, maxRatio: 12, defaultRatio: 8 },
  },
};

test('已核验且在有效期内的政策可计算，并保留来源元数据', () => {
  const result = Engine.calculateSocialInsurance(verifiedPolicy, 10000, {
    fundEnabled: true,
    fundRatio: 8,
    injuryEmployerRate: 0.2,
  });

  assert.equal(result.personalTotal, 1850);
  assert.equal(result.employerTotal, 3170);
  assert.equal(result.afterSocialInsuranceSalary, 8150);
  assert.equal(result.afterSocialInsuranceLabel, '扣五险一金后工资（未扣个税）');
  assert.equal(result.policy.sourceTitle, '测试政策来源');
});

test('工资高于上限时，社保和公积金基数各自封顶', () => {
  const result = Engine.calculateSocialInsurance(verifiedPolicy, 30000, {
    fundEnabled: true,
    fundRatio: 12,
    injuryEmployerRate: 0.2,
  });

  assert.equal(result.siBase, 20000);
  assert.equal(result.fundBase, 20000);
  assert.equal(result.personalTotal, 4500);
});

test('非已核验的地区政策不得进入计算引擎', () => {
  const referencePolicy = { ...verifiedPolicy, status: 'reference', calculation: null };
  assert.throws(
    () => Engine.calculateSocialInsurance(referencePolicy, 10000, { fundEnabled: false }),
    /暂不能计算/,
  );
});

test('手工模式的结果明确标识为未核验且不含个税', () => {
  const manualPolicy = Engine.createManualPolicy({
    siBaseMin: 4000, siBaseMax: 20000, fundBaseMin: 4000, fundBaseMax: 20000,
    pensionEmployerRate: 16, pensionPersonalRate: 8,
    medicalEmployerRate: 7, medicalPersonalRate: 2,
    unemploymentEmployerRate: 0.5, unemploymentPersonalRate: 0.5,
    injuryEmployerRate: 0.2,
  });
  const result = Engine.calculateSocialInsurance(manualPolicy, 10000, { fundEnabled: false });
  assert.equal(result.personalTotal, 1050);
  assert.equal(result.afterSocialInsuranceLabel, '扣五险一金后工资（未扣个税）');
  assert.equal(result.policy.sourceUrl, '');
});

test('页面通过 sessionStorage 传递到个税工具，不把金额写入 URL', () => {
  const socialApp = fs.readFileSync('js/social-insurance-app.js', 'utf8');
  const incomeTaxPage = fs.readFileSync('index.html', 'utf8');
  assert.match(socialApp, /sessionStorage\.setItem\('xiaoboTax\.socialToIncomeTax'/);
  assert.match(socialApp, /window\.location\.href = '\.\/'/);
  assert.doesNotMatch(socialApp, /location\.href\s*=\s*['"][^'"]*salary=/);
  assert.match(incomeTaxPage, /function applySocialToTaxHandoff/);
  assert.match(incomeTaxPage, /所有计算仅在当前浏览器完成/);
});
