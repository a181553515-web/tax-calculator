const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');

test('安徽本地实测参数保持线上原值', () => {
  assert.match(html, /'安徽':\s*\{ min: 4311,\s*max: 21556, fundMin: 2100,\s*fundMax: 21556 \}/);
  assert.match(html, /'安徽':\s*\{ pension:\[16,8\], medical:\[6\.4,2\], unemployment:\[0\.5,0\.5\] \}/);
  assert.match(html, /<option value="安徽" selected>安徽<\/option>/);
});

test('保留选地区即测算，并区分安徽实测与其他地区参考说明', () => {
  assert.match(html, /安徽合肥、六安地区按实测口径测算/);
  assert.match(html, /rates\.province === '安徽'/);
  assert.match(html, /isMunicipality/);
  assert.match(html, /provSel\.addEventListener\('change', runCalc\)/);
  assert.doesNotMatch(html, /手工录入当地政策参数|SocialPolicyEngine|social-insurance-app\.js/);
});

test('社保页在窄屏下将双列表单改为单列', () => {
  assert.match(html, /@media \(max-width: 600px\) \{\s*\.form-row \{\s*grid-template-columns: 1fr;/);
});
