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

test('安徽原有正算金额保持不变', () => {
  const result = engine.calculate(buildRates(), 10000);
  assert.equal(result.siEmpTotal, 2310);
  assert.equal(result.siPerTotal, 1050);
  assert.equal(result.takeHome, 8950);
  assert.equal(result.companyCost, 12310);
});

test('按目标社保后工资反算税前工资', () => {
  const solved = engine.solveGrossSalary(buildRates(), 8950, 'take-home');
  assert.equal(solved.ok, true);
  assert.equal(solved.grossSalary, 10000);
  assert.equal(solved.actualAmount, 8950);
  assert.equal(solved.difference, 0);
});

test('按企业总预算反算税前工资', () => {
  const solved = engine.solveGrossSalary(buildRates(), 12310, 'company-budget');
  assert.equal(solved.ok, true);
  assert.equal(solved.grossSalary, 10000);
  assert.equal(solved.actualAmount, 12310);
  assert.equal(solved.difference, 0);
});

test('反算正确处理深圳医保独立下限', () => {
  const rates = buildRates({
    province: '广东',
    medical: [6, 2],
    maternityEmployer: 0.5,
    unemployment: [0.8, 0.2],
    siMin: 4775,
    siMax: 23875,
    fundMin: 2500,
    fundMax: 39828,
    baseLimits: {
      pension: { min:4775, max:23875 },
      medical: { min:6727, max:33633 },
      unemployment: { min:4775, max:23875 },
      injury: { min:4775, max:23875 }
    }
  });
  const target = engine.calculate(rates, 5000).takeHome;
  const solved = engine.solveGrossSalary(rates, target, 'take-home');
  assert.equal(solved.ok, true);
  assert.equal(solved.grossSalary, 5000);
  assert.equal(solved.result.medicalBase, 6727);
});

test('企业预算低于最低缴费成本时返回可识别的错误', () => {
  const solved = engine.solveGrossSalary(buildRates(), 100, 'company-budget');
  assert.equal(solved.ok, false);
  assert.equal(solved.reason, 'below-minimum');
  assert.ok(solved.minimumAmount > 100);
});
