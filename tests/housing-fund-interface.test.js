const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('页面提供公积金缴存、公积金贷款和社保用工成本三个主入口', () => {
  assert.match(html, /id="mainTaskSwitch"/);
  assert.match(html, />公积金缴存</);
  assert.match(html, />公积金贷款</);
  assert.match(html, />社保用工成本</);
});

test('公积金缴存包含缴存额和反推基数两种模式', () => {
  assert.match(html, /id="fundContributionPanel"/);
  assert.match(html, /data-fund-mode="forward"/);
  assert.match(html, /data-fund-mode="reverse"/);
  assert.match(html, /id="fundContributionResult"/);
  assert.match(html, /id="fundContributionRatio"/);
  assert.match(html, /按单位与个人同比例测算；个别地区允许个人自愿提高/);
  assert.doesNotMatch(html, /id="fundEmployerRatio"/);
  assert.doesNotMatch(html, /id="fundEmployeeRatio"/);
});

test('公积金贷款包含月供测算和当地最高额度查询', () => {
  assert.match(html, /id="fundLoanPanel"/);
  assert.match(html, /data-loan-mode="payment"/);
  assert.match(html, /data-loan-mode="cap"/);
  assert.match(html, /id="loanPaymentResult"/);
  assert.match(html, /id="loanCapResult"/);
  assert.match(html, /id="loanYears"[\s\S]*min="1" max="30"/);
  assert.match(html, /5年（含）以内适用短期利率/);
  assert.match(html, /请输入1—30年的整数期限/);
});

test('公积金金额输入在失焦后显示千分位和两位小数', () => {
  assert.match(html, /fundAmountInput\.addEventListener\('focus'/);
  assert.match(html, /fundAmountInput\.addEventListener\('blur'/);
  assert.match(html, /fundAmountInput\.value = amount > 0 \? money\(amount\) : ''/);
});

test('页面使用原有工具名称且不再显示功能副标题', () => {
  assert.match(html, />社保公积金计算器<\/h1>/);
  assert.doesNotMatch(html, /缴存 · 贷款 · 用工成本/);
});

test('页面加载统一公积金政策解析和计算引擎', () => {
  assert.match(html, /<script src="housing-fund-policy-data\.js"><\/script>/);
  assert.match(html, /<script src="housing-fund-policy-resolver\.js"><\/script>/);
  assert.match(html, /<script src="housing-fund-calculation-engine\.js"><\/script>/);
});

test('原社保三种模式和计算结果容器保持存在', () => {
  assert.match(html, /data-mode="gross"/);
  assert.match(html, /data-mode="take-home"/);
  assert.match(html, /data-mode="company-budget"/);
  assert.match(html, /id="siResult"/);
});
