const assert = require('node:assert/strict');
const test = require('node:test');

const engine = require('../housing-fund-calculation-engine.js');

const limits = { min: 2320, max: 31564 };

test('同条件商贷比较支持等额本息、等额本金和二套利息反转', () => {
  const fund = engine.calculateLoanSchedule(800000,2.6,360,'equal-payment');
  const commercial = engine.calculateLoanSchedule(800000,3.05,360,'equal-payment');
  assert.equal(fund.firstPayment,3202.72);
  assert.equal(commercial.firstPayment,3394.44);
  assert.equal(Math.round((commercial.totalInterest-fund.totalInterest)*100)/100,69021.30);
  const second = engine.calculateLoanSchedule(800000,3.075,360,'equal-principal');
  const secondCommercial = engine.calculateLoanSchedule(800000,3.05,360,'equal-principal');
  assert.equal(second.firstPayment,4272.22);
  assert.equal(secondCommercial.firstPayment,4255.56);
  assert.equal(Math.round((secondCommercial.totalInterest-second.totalInterest)*100)/100,-3008.33);
});

test('公积金缴存额按当地上下限计算', () => {
  const below = engine.calculateContribution(2000, 8, 8, limits);
  assert.equal(below.base, 2320);
  assert.equal(below.baseState, 'floor');
  assert.equal(below.employeeMonthly, 185.6);
  assert.equal(below.employerMonthly, 185.6);
  assert.equal(below.monthlyTotal, 371.2);
  assert.equal(below.annualTotal, 4454.4);

  const normal = engine.calculateContribution(5000, 8, 8, limits);
  assert.equal(normal.base, 5000);
  assert.equal(normal.baseState, 'normal');
  assert.equal(normal.employeeMonthly, 400);
});

test('按个人实缴额反推缴存基数并识别超范围结果', () => {
  const normal = engine.reverseContributionBase(400, 8, limits);
  assert.equal(normal.rawBase, 5000);
  assert.equal(normal.baseState, 'normal');
  assert.equal(normal.allowedBase, 5000);

  const above = engine.reverseContributionBase(3000, 8, limits);
  assert.equal(above.rawBase, 37500);
  assert.equal(above.baseState, 'ceiling');
  assert.equal(above.allowedBase, 31564);
});

test('贷款期限自动匹配全国首套和二套利率', () => {
  const rates = {
    first: { upTo5Years: 2.1, over5Years: 2.6 },
    second: { upTo5Years: 2.525, over5Years: 3.075 }
  };
  assert.equal(engine.resolveAnnualLoanRate(rates, 'first', 60), 2.1);
  assert.equal(engine.resolveAnnualLoanRate(rates, 'first', 61), 2.6);
  assert.equal(engine.resolveAnnualLoanRate(rates, 'second', 360), 3.075);
  assert.equal(engine.resolveAnnualLoanRate(rates, 'first', 360, 2.8), 2.8);
});

test('等额本息计算30年100万元首套贷款', () => {
  const result = engine.calculateLoanSchedule(1000000, 2.6, 360, 'equal-payment');
  assert.equal(result.method, 'equal-payment');
  assert.equal(result.schedule.length, 360);
  assert.ok(Math.abs(result.firstPayment - 4003.4) < 0.02);
  assert.equal(result.firstPayment, result.lastPayment);
  assert.ok(result.totalInterest > 440000 && result.totalInterest < 442000);
  assert.equal(result.totalRepayment, Number((1000000 + result.totalInterest).toFixed(2)));
});

test('等额本金输出首月、递减额和末月月供', () => {
  const result = engine.calculateLoanSchedule(1000000, 2.6, 360, 'equal-principal');
  assert.equal(result.method, 'equal-principal');
  assert.equal(result.schedule.length, 360);
  assert.ok(Math.abs(result.firstPayment - 4944.44) < 0.02);
  assert.ok(Math.abs(result.monthlyDecrease - 6.02) < 0.02);
  assert.ok(result.lastPayment < result.firstPayment);
  assert.ok(result.totalInterest < 400000);
});

test('手动上限仅作为参考封顶，不伪造自动审批额度', () => {
  const result = engine.resolveReferenceLoanCap(null, 'single', 800000);
  assert.equal(result.amount, 800000);
  assert.equal(result.source, 'manual');
  assert.equal(result.verified, false);
});
