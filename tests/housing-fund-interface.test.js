const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('护理险入口暂时隐藏，保留底层开关供恢复', () => {
  assert.match(html, /id="siLongTermCareRow" hidden/);
  assert.match(html, /\.toggle-row\[hidden\] \{ display: none !important; \}/);
  assert.match(html, /id="siLongTermCare"/);
});

test('商贷对比默认关闭，仅增加利率，共用贷款条件', () => {
  assert.match(html, /id="loanCompareEnabled" aria-label="与商贷对比"/);
  assert.match(html, /class="toggle-row loan-compare-switch" for="loanCompareEnabled"/);
  assert.match(html, /id="loanCommercialFields" hidden/);
  assert.match(html, /engine\.calculateLoanSchedule\(amountCheck\.principal, commercialRate, months, loanMethod\.value\)/);
  assert.match(html, /当前贷款（自定义）/);
  assert.match(html, /按全程利率不变/);
});

test('贷款优惠表述清晰，单一情形隐藏，基数与扣款区分', () => {
  const policies = require('../housing-fund-policy-data.js').loanPolicies;
  for (const policy of Object.values(policies)) {
    if (policy.capLabels.standard) assert.equal(policy.capLabels.standard,'无额外优惠');
  }
  assert.match(html, />优惠情形</);
  assert.match(html, /var showCategory = categories.length > 1/);
  assert.match(html, /不是每月扣款金额/);
  assert.match(html, /'住房类型'/);
});

test('额度入口精简，不要求房价首付，可选校验默认折叠', () => {
  assert.match(html, />算贷款额度</);
  assert.doesNotMatch(html, /id="estimatePropertyPrice"|id="estimateDownPayment"|算算我能贷多少/);
  assert.match(html, /<details[^>]*id="estimateIncomeFields"[^>]*hidden>/);
  assert.match(html, /还款能力校验（可选）/);
  assert.match(html, /id="estimateCheckIncome"/);
  assert.match(html, /缴存条件测算上限（参考）/);
});

test('贷款金额防错与明确转换入口保留', () => {
  assert.match(html, /id="loanAmountConvert"/);
  assert.match(html, /engine\.validateLoanAmount/);
  assert.match(html, /id="useEstimateForPayment"/);
});

test('页面按社保公积金、公积金缴存、公积金贷款顺序提供三个主入口', () => {
  assert.match(html, /id="mainTaskSwitch"/);
  assert.match(html, />公积金缴存</);
  assert.match(html, />公积金贷款</);
  const switchHtml = html.match(/id="mainTaskSwitch"[\s\S]*?<\/div>/)[0];
  assert.match(switchHtml, /data-task="social"[\s\S]*?>社保公积金<[\s\S]*data-task="contribution"[\s\S]*?>公积金缴存<[\s\S]*data-task="loan"[\s\S]*?>公积金贷款</);
  assert.match(switchHtml, /class="main-task-btn active" data-task="social"/);
  assert.match(html, /setMainTask\(requestedTask === 'loan' \|\| requestedTask === 'contribution' \? requestedTask : 'social'\)/);
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

test('贷款政策选项根据城市差异自动精简', () => {
  assert.match(html, /id="loanApplicantGroup"/);
  assert.match(html, /id="loanCapCategoryGroup"/);
  assert.match(html, /policy\.applicantMode !== 'shared'/);
  assert.match(html, /categories\.length > 1/);
  assert.match(html, /policy\.capLabels/);
  assert.match(html, /不区分缴存人数/);
  assert.doesNotMatch(html, /普通缴存家庭/);
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
  assert.match(html, /<script src="housing-fund-policy-data\.js\?v=20260916-estimate"><\/script>/);
  assert.match(html, /<script src="housing-fund-policy-resolver\.js"><\/script>/);
  assert.match(html, /<script src="housing-fund-calculation-engine\.js\?v=20260916-estimate"><\/script>/);
});

test('原社保三种模式和计算结果容器保持存在', () => {
  assert.match(html, /data-mode="gross"/);
  assert.match(html, /data-mode="take-home"/);
  assert.match(html, /data-mode="company-budget"/);
  assert.match(html, /id="siResult"/);
});
