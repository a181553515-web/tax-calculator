const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const policy = require('../social-policy-data.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('政策数据记录最近复核日期', () => {
  assert.match(policy.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test('官方核验地区均保留可追溯来源', () => {
  Object.entries(policy.regionGroups).forEach(([province, group]) => {
    group.regions.filter(region => region.status === 'verified').forEach(region => {
      assert.match(region.source, /^https:\/\//, `${province}-${region.label}缺少官方来源`);
    });
  });
});

test('折叠参数说明区分实测、部分官方核验和省级参考', () => {
  assert.match(html, /安徽实测/);
  assert.match(html, /部分官方核验/);
  assert.match(html, /省级参考/);
  assert.match(html, /参考项：/);
  assert.match(html, /最近复核：/);
  assert.match(html, /适用期：/);
  assert.match(html, /官方来源/);
});

test('计算结果默认只显示紧凑口径，完整参数与注意事项按需展开', () => {
  assert.match(html, /<details class="policy-trust__details">/);
  assert.doesNotMatch(html, /<details class="policy-trust__details" open>/);
  assert.match(html, /<strong>计算口径：<\/strong>/);
  assert.match(html, /查看参数说明/);
  assert.match(html, /policy-trust__notices/);
  assert.match(html, /renderPolicyTrust\(r, notes\)/);
  assert.doesNotMatch(html, /result-notes/);
});

test('移动端计算口径使用单行精简表述', () => {
  assert.match(html, /policy-trust__summary-mobile/);
  assert.match(html, /<strong>口径：<\/strong>' \+ mobileSummaryText/);
  assert.match(html, /mobileRegionLabel = String\(rates\.regionLabel \|\| ''\)\.replace/);
  assert.match(html, /text-overflow: ellipsis/);
  assert.match(html, /policy-trust__action::before \{ content: '参数'; \}/);
});

test('页首测算提示保留必要免责声明且不重复结果说明', () => {
  assert.match(html, /<strong>测算提示：<\/strong>安徽按实测口径/);
  assert.match(html, /其他地区按官方核验或常见参数估算/);
  assert.match(html, /不作为申报或结算依据/);
  assert.doesNotMatch(html, /适合招聘预算、用工成本沟通和员工薪酬测算/);
  assert.doesNotMatch(html, /地市、统筹区、工伤行业及公积金可能不同/);
});

test('社保页加载独立计算引擎并提供三种测算模式', () => {
  assert.match(html, /<script src="social-calculation-engine\.js"><\/script>/);
  assert.match(html, /data-mode="gross"/);
  assert.match(html, /data-mode="take-home"/);
  assert.match(html, /data-mode="company-budget"/);
  assert.match(html, />算社保公积金<\/button>/);
  assert.match(html, />反算工资<\/button>/);
  assert.match(html, />按预算算工资<\/button>/);
  assert.match(html, /label: '员工目标工资（社保后）'/);
  assert.match(html, /label: '企业每人月预算'/);
  assert.match(html, /未扣个人所得税/);
});

test('移动端缴费明细压缩为四列并保留单位个人费率', () => {
  assert.match(html, /手机端将费率并入金额列，六列压缩为四列/);
  assert.match(html, /\.table th:nth-child\(2\)[\s\S]*display: none/);
  assert.match(html, /<span class="si-head-mobile">单位缴纳<\/span>/);
  assert.match(html, /<span class="si-head-mobile">个人缴纳<\/span>/);
  assert.match(html, /<span class="si-rate-mobile">' \+ empRate/);
  assert.match(html, /<span class="si-rate-mobile">' \+ perRate/);
});

test('三个模块共用轻量社保缴费基数设置', () => {
  assert.match(html, /id="siSocialBaseMode"/);
  assert.match(html, /data-base-mode="salary"/);
  assert.match(html, /data-base-mode="minimum"/);
  assert.match(html, /data-base-mode="custom"/);
  assert.match(html, />按最低基数<\/button>/);
  assert.match(html, /id="siCustomBaseGroup"/);
  assert.match(html, /function getMinimumBaseSummary\(rates\)/);
  assert.match(html, /solveGrossSalary\(rates, inputAmount, currentCalcMode, baseOptions\)/);
  assert.doesNotMatch(html, /例如算最低基数请输入/);
});

test('社保计算器显示当前正式版本号', () => {
  assert.match(html, /社保公积金计算器 v1\.3\.0<\/p>/);
});
