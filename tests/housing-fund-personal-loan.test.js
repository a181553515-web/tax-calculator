const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../housing-fund-calculation-engine.js');
const data = require('../housing-fund-policy-data.js');
const hefei = data.loanPolicies['anhui-hefei'];
const luan = data.loanPolicies['anhui-luan'];
const hf = () => ({contributors:[{base:5000,balance:10000,months:24}],years:30,propertyPrice:1200000,downPayment:300000});
const la = () => ({contributors:[{monthlyTotal:500,months:12}],years:30,propertyPrice:1200000,downPayment:300000,familyIncome:8000,otherMonthlyDebt:0,annualRate:2.6,method:'equal-payment'});

test('贷款万元输入严格校验，疑似元输入必须确认转换', () => {
  for (const value of ['', '0', '-80', '80元', '80abc', '1e5', '1,00']) assert.equal(engine.validateLoanAmount(value).ok,false);
  assert.equal(engine.validateLoanAmount('800000').reason,'suspected-yuan');
  assert.equal(engine.validateLoanAmount('80').principal,800000);
  assert.equal(engine.validateLoanAmount('9.9915').principal,99915);
  assert.equal(engine.validateLoanAmount('1,000.00').ok,true);
});

test('合肥余额不足三万元按三万元，24月及25月分别15和20倍', () => {
  const input = hf();
  assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',input).amount,450000);
  input.contributors[0].months = 25;
  assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',input).amount,600000);
  input.years = 5;
  assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',input).amount,180000);
});

test('合肥夫妻分别计算缴存时间，额度取所有限制最小值', () => {
  const input = hf();
  input.propertyPrice = 2000000; input.downPayment = 400000;
  input.contributors = [{base:5000,balance:20000,months:25},{base:5000,balance:10000,months:24}];
  const result = engine.estimatePersonalLoan(hefei,'family','standard',input);
  assert.equal(result.amount,1050000);
  for (const limit of result.limits) assert.ok(result.amount <= limit.amount);
});

test('不足缴存时间和无效年限阻断，不需要购房金额', () => {
  const input = hf(); input.contributors[0].months = 5;
  assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',input).reason,'contribution-months');
  for (const years of [0,31,3.5,NaN]) assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',{...hf(),years}).ok,false);
  assert.equal(engine.estimatePersonalLoan(hefei,'single','standard',{contributors:hf().contributors,years:30}).amount,450000);
  assert.equal(engine.estimatePersonalLoan({},'single','standard',hf()).reason,'unsupported');
});

test('六安双边缴存额20倍与18万元公式下限，不覆盖还款能力限制', () => {
  const input = la();
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',input).amount,180000);
  input.contributors[0].monthlyTotal = 2000;
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',input).amount,480000);
  input.familyIncome = 1000; input.otherMonthlyDebt = 200;
  input.checkRepaymentCapacity = true;
  const annuity = engine.estimatePersonalLoan(luan,'single','newHome',input);
  assert.ok(annuity.amount < 180000);
  assert.ok(engine.calculateLoanSchedule(annuity.amount,2.6,360,'equal-payment').firstPayment <= 400);
  input.method = 'equal-principal';
  const principal = engine.estimatePersonalLoan(luan,'single','newHome',input);
  assert.ok(principal.amount < annuity.amount);
  assert.ok(engine.calculateLoanSchedule(principal.amount,2.6,360,'equal-principal').firstPayment <= 400);
  input.otherMonthlyDebt = 1000;
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',input).amount,0);
});

test('六安二手房房龄和年限限制，保障性住房不要求输入房价', () => {
  const input = {...la(),propertyAge:20};
  assert.equal(engine.estimatePersonalLoan(luan,'single','usedOrAffordableHome',input).reason,'property-age');
  input.years = 20;
  assert.equal(engine.estimatePersonalLoan(luan,'single','usedOrAffordableHome',input).ok,true);
  input.propertyAge = 21;
  assert.equal(engine.estimatePersonalLoan(luan,'single','usedOrAffordableHome',input).ok,false);
  const affordable = {...la(),propertyPrice:1000000,downPayment:150000};
  assert.equal(engine.estimatePersonalLoan(luan,'single','affordableHome',affordable).ok,true);
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',affordable).ok,true);
});

test('六安默认只按缴存条件测算，收入校验由用户选择', () => {
  const input = la(); delete input.familyIncome; delete input.otherMonthlyDebt;
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',input).amount,180000);
  input.checkRepaymentCapacity = true;
  assert.equal(engine.estimatePersonalLoan(luan,'single','newHome',input).ok,false);
});

test('苏州2026年6月起最高额度更新为单人150万、家庭200万', () => {
  const policy = data.loanPolicies['jiangsu-suzhou'];
  assert.equal(policy.effectiveFrom,'2026-06-01');
  assert.equal(policy.caps.standard.single,1500000);
  assert.equal(policy.caps.standard.family,2000000);
});
