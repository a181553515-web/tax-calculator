const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('安徽社保实测参数保持不变，公积金按2026年度合肥六安区域匹配', () => {
  assert.match(html, /'安徽':\s*\{ min: 4311,\s*max: 21556, fundMin: 2320,\s*fundMax: 31564 \}/);
  assert.match(html, /'安徽':\s*\{ pension:\[16,8\], medical:\[6\.4,2\], unemployment:\[0\.5,0\.5\] \}/);
  assert.match(html, /'合肥市区': \{ min: 2320, max: 31564 \}/);
  assert.match(html, /'合肥县市': \{ min: 2100, max: 31564 \}/);
  assert.match(html, /'六安市区': \{ min: 2170, max: 25945 \}/);
  assert.match(html, /'六安县区': \{ min: 2100, max: 25945 \}/);
  assert.match(html, /rates\.fundMin = area\.min;/);
  assert.match(html, /rates\.fundMax = area\.max;/);
  assert.match(html, /2026年社保基数暂按现行4311～21556元测算/);
  assert.match(html, /<option value="安徽" selected>安徽<\/option>/);
});

test('已核验的天津辽宁浙江社保基数更新为当前公开口径', () => {
  assert.match(html, /'天津':\s*\{ min: 5124,\s*max: 25620/);
  assert.match(html, /'辽宁':\s*\{ min: 4359,\s*max: 21792/);
  assert.match(html, /'浙江':\s*\{ min: 4986,\s*max: 25299/);
});

test('大病医疗救助金只允许安徽地区按实测开关测算', () => {
  assert.match(html, /medicalAidCheck\.checked && prov === '安徽' \? 12 : 0/);
  assert.match(html, /medicalAidCheck\.disabled = !isAnhui/);
});

test('保留选地区即测算，并区分安徽实测与其他地区参考说明', () => {
  assert.match(html, /安徽合肥、六安地区按实测口径测算/);
  assert.match(html, /rates\.province === '安徽'/);
  assert.match(html, /isMunicipality/);
  assert.match(html, /provSel\.addEventListener\('change', function\(\) \{/);
  assert.match(html, /syncRegionalControls\(\)/);
  assert.doesNotMatch(html, /手工录入当地政策参数|SocialPolicyEngine|social-insurance-app\.js/);
});

test('社保页在窄屏下与个税页采用一致的内容宽度并将双列表单改为单列', () => {
  const mobileStyles = html.slice(
    html.indexOf('@media (max-width: 600px) {'),
    html.indexOf('\n}\n\n.calculator-notice')
  );
  assert.match(mobileStyles, /\.app \{\s*padding-left: 0;\s*padding-right: 0;/);
  assert.match(mobileStyles, /\.card \{\s*padding: var\(--space-5\);/);
  assert.match(mobileStyles, /\.form-row \{\s*grid-template-columns: 1fr;/);
});
