const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function loadCalculationEngine() {
  const start = html.indexOf('const COMPREHENSIVE_TAX_BRACKETS');
  const end = html.indexOf('// ===== UI STATE =====');
  assert.ok(start >= 0 && end > start, '应能从页面中提取个税计算引擎');

  const exports = `
    globalThis.__taxApi = {
      calcAnnualComprehensiveTax,
      calcBusinessIncomeByAudit,
      calcEquityIncentiveTax,
      calcIndividualBusinessHalfReduction,
      calcLaborServiceWithholding,
      calcNonResidentTax,
      calcSpecialWorkerWithholding,
      repeatPerOccurrenceResult
    };
  `;
  const sandbox = { setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(html.slice(start, end) + exports, sandbox);
  return sandbox.__taxApi;
}

const tax = loadCalculationEngine();

test('劳务报酬多次取得时按每次分别计税后汇总', () => {
  const once = tax.calcLaborServiceWithholding({ income: 30000 });
  const twice = tax.repeatPerOccurrenceResult(once, 2, '劳务报酬');
  assert.equal(once.tax, 5200);
  assert.equal(twice.tax, 10400);
  assert.equal(twice.taxableIncome, 48000);
});

test('非居民个人四项所得分别适用月度税率表且工资只减5000元', () => {
  const result = tax.calcNonResidentTax({
    monthlySalary: 30000,
    monthlyLabor: 10000,
    monthlyRoyalty: 0,
    monthlyAuthorization: 0
  });
  assert.equal(result.categoryTaxes.salary, 3590);
  assert.equal(result.categoryTaxes.labor, 590);
  assert.equal(result.tax, 4180);
});

test('个体工商户超过200万元时仍对前200万元部分计算减半优惠', () => {
  assert.equal(tax.calcIndividualBusinessHalfReduction(2400000, 6000), 314750);
  const result = tax.calcBusinessIncomeByAudit({
    totalRevenue: 2400000,
    otherRelief: 6000,
    hasComprehensiveIncome: true,
    isSolePropOrIndividual: true
  });
  assert.equal(result.halfReduction, 314750);
  assert.equal(result.tax, 453750);
});

test('符合条件的上市公司股权激励直接按年度综合所得税率表单独计税', () => {
  const result = tax.calcEquityIncentiveTax({ equityIncome: 100000 });
  assert.equal(result.tax, 7480);
  assert.match(html, /本年度股权激励收入合计/);
  assert.doesNotMatch(html, /eq_otherIncome|eq_totalDeductions/);
});

test('年度汇算自动限制商业健康保险、个人养老金和一般捐赠扣除额', () => {
  const result = tax.calcAnnualComprehensiveTax({
    comprehensiveIncomeAmount: 100000,
    otherDeductions: {
      commercialHealth: 3000,
      pensionContribution: 20000,
      charitableDonation: 10000
    }
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.deductionDetails)),
    { commercialHealth: 2400, pensionContribution: 12000, charitableDonation: 7680 }
  );
  assert.equal(result.taxableIncome, 17920);
  assert.equal(result.tax, 537.6);
});

test('保险营销员累计预扣可扣除三险一金、专项附加及其他合规扣除', () => {
  const result = tax.calcSpecialWorkerWithholding({
    type: 'insurance',
    income: 20000,
    month: 1,
    monthSpecial: 1000,
    monthSpecialAdd: 1000,
    monthOther: 1000
  });
  assert.equal(result.taxableIncome, 4000);
  assert.equal(result.tax, 120);
});
