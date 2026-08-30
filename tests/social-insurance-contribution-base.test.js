const assert = require('node:assert/strict');
const test = require('node:test');

const engine = require('../social-calculation-engine.js');

function buildRates(overrides = {}) {
  return Object.assign({
    province: '安徽',
    pension: [16, 8],
    medical: [6.4, 2],
    unemployment: [0.5, 0.5],
    injury: 0.2,
    injurySupplementRate: 0,
    maternityEmployer: 0,
    medicalFixed: 0,
    medicalAidFixed: 0,
    longTermCareEnabled: false,
    longTermCarePolicy: null,
    siMin: 4311,
    siMax: 21556,
    fundMin: 2320,
    fundMax: 31564,
    fundEnabled: false,
    fundRatio: 8,
    baseLimits: {
      pension: { min:4311, max:21556 },
      medical: { min:4311, max:21556 },
      unemployment: { min:4311, max:21556 },
      injury: { min:4311, max:21556 }
    }
  }, overrides);
}

test('未指定基数方式时保持原有按工资测算结果', () => {
  const result = engine.calculate(buildRates(), 5000);
  assert.equal(result.socialBaseMode, 'salary');
  assert.equal(result.pensionBase, 5000);
  assert.equal(result.takeHome, 4475);
  assert.equal(result.companyCost, 6155);
});

test('安徽可以按当地下限测算工资与社保基数倒挂', () => {
  const result = engine.calculate(buildRates(), 5000, { socialBaseMode:'minimum' });
  assert.equal(result.socialBaseMode, 'minimum');
  assert.equal(result.salary, 5000);
  assert.equal(result.pensionBase, 4311);
  assert.equal(result.medicalBase, 4311);
  assert.equal(result.siPerTotal, 452.66);
  assert.equal(result.siEmpTotal, 995.84);
  assert.equal(result.takeHome, 4547.34);
  assert.equal(result.companyCost, 5995.84);
});

test('按当地下限时分别采用各险种自己的下限', () => {
  const rates = buildRates({
    province: '广东',
    baseLimits: {
      pension: { min:4775, max:23875 },
      medical: { min:6727, max:33633 },
      unemployment: { min:4775, max:23875 },
      injury: { min:4775, max:23875 }
    }
  });
  const result = engine.calculate(rates, 8000, { socialBaseMode:'minimum' });
  assert.equal(result.pensionBase, 4775);
  assert.equal(result.medicalBase, 6727);
  assert.equal(result.unemploymentBase, 4775);
  assert.equal(result.injuryBase, 4775);
});

test('自定义社保基数会分别套用各险种上下限', () => {
  const rates = buildRates({
    baseLimits: {
      pension: { min:4311, max:21556 },
      medical: { min:5000, max:20000 },
      unemployment: { min:4311, max:21556 },
      injury: { min:4311, max:21556 }
    }
  });
  const below = engine.calculate(rates, 8000, {
    socialBaseMode: 'custom',
    socialBaseAmount: 4500
  });
  assert.equal(below.pensionBase, 4500);
  assert.equal(below.medicalBase, 5000);
  assert.equal(below.socialBaseInputs.medical, 4500);

  const above = engine.calculate(rates, 8000, {
    socialBaseMode: 'custom',
    socialBaseAmount: 30000
  });
  assert.equal(above.pensionBase, 21556);
  assert.equal(above.medicalBase, 20000);
});

test('最低基数设置同时适用于员工目标工资和企业预算反算', () => {
  const rates = buildRates();
  const options = { socialBaseMode:'minimum' };
  const forward = engine.calculate(rates, 5000, options);

  const takeHome = engine.solveGrossSalary(rates, forward.takeHome, 'take-home', options);
  assert.equal(takeHome.ok, true);
  assert.equal(takeHome.grossSalary, 5000);
  assert.equal(takeHome.result.pensionBase, 4311);

  const budget = engine.solveGrossSalary(rates, forward.companyCost, 'company-budget', options);
  assert.equal(budget.ok, true);
  assert.equal(budget.grossSalary, 5000);
  assert.equal(budget.result.pensionBase, 4311);
});

test('社保按下限时公积金仍按工资及公积金上下限测算', () => {
  const rates = buildRates({ fundEnabled:true });
  const result = engine.calculate(rates, 5000, { socialBaseMode:'minimum' });
  assert.equal(result.pensionBase, 4311);
  assert.equal(result.fundBase, 5000);
});
