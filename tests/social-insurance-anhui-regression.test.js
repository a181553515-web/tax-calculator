const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'social-insurance.html'), 'utf8');
const policy = require(path.join(__dirname, '..', 'social-policy-data.js'));

test('安徽社保使用2026年度最新上下限，公积金仍按合肥六安区域匹配', () => {
  assert.deepEqual(policy.provinceBases['安徽'], { min:4354, max:21772, fundMin:2320, fundMax:31564 });
  assert.deepEqual(policy.provinceRates['安徽'], { pension:[16,8], medical:[6.4,2], unemployment:[0.5,0.5] });
  assert.equal(policy.regionGroups['安徽'].defaultRegion, 'hefei-urban');
  assert.deepEqual(policy.regionGroups['安徽'].regions.map(region => [region.label, region.fund.min, region.fund.max]), [
    ['合肥市区', 2320, 31564],
    ['合肥县市（肥东、肥西、长丰、庐江、巢湖）', 2100, 31564],
    ['六安市区', 2170, 25945],
    ['六安县区（霍邱、金寨、霍山、舒城、叶集）', 2100, 25945]
  ]);
  assert.match(html, /HOUSING_FUND_POLICY_RESOLVER\.resolveContributionPolicy\(SOCIAL_POLICY_DATA, prov, region\.id\)/);
  assert.match(html, /rates\.fundMin = fundPolicy\.min;/);
  assert.match(html, /rates\.fundMax = fundPolicy\.max;/);
  assert.equal(policy.regionGroups['安徽'].reviewedAt, '2026-09-04');
  assert.equal(policy.regionGroups['安徽'].effectiveFrom, '2026-01-01');
  assert.equal(policy.regionGroups['安徽'].effectiveTo, '2026-12-31');
  assert.match(policy.regionGroups['安徽'].baseSource, /^https:\/\/hrss\.ah\.gov\.cn\//);
  assert.match(html, /2026年社保基数按4354～21772元测算/);
  assert.match(html, /社保基数官方来源/);
  assert.match(html, /<option value="安徽" selected>安徽<\/option>/);
});

test('已核验的天津辽宁浙江社保基数更新为当前公开口径', () => {
  assert.deepEqual([policy.provinceBases['天津'].min, policy.provinceBases['天津'].max], [5180, 25902]);
  assert.deepEqual([policy.provinceBases['辽宁'].min, policy.provinceBases['辽宁'].max], [4533, 22665]);
  assert.deepEqual([policy.provinceBases['浙江'].min, policy.provinceBases['浙江'].max], [4986, 25299]);
});

test('大病医疗救助金只允许安徽地区按实测开关测算', () => {
  assert.equal(policy.regionGroups['安徽'].medicalAidAllowed, true);
  assert.match(html, /medicalAidCheck\.checked && regionConfig\.medicalAidAllowed \? 12 : 0/);
  assert.match(html, /medicalAidCheck\.disabled = !medicalAidAllowed/);
});

test('保留选地区即测算，并区分安徽实测与其他地区参考说明', () => {
  assert.match(html, /安徽合肥、六安地区按实测口径测算/);
  assert.match(html, /rates\.regionStatus === 'measured'/);
  assert.match(html, /rates\.regionStatus === 'verified'/);
  assert.match(html, /label: prov \+ '常见参考口径'/);
  assert.match(html, /provSel\.addEventListener\('change', function\(\) \{/);
  assert.match(html, /syncRegionOptions\(\)/);
  assert.match(html, /syncRegionalControls\(\)/);
  assert.doesNotMatch(html, /手工录入当地政策参数|SocialPolicyEngine|social-insurance-app\.js/);
});

test('全国省份统一显示二级地区选择，未核验省份使用常见参考口径兜底', () => {
  assert.match(html, /id="siRegionGroup"/);
  assert.match(html, /id="siRegion"/);
  assert.match(html, /function getReferenceRegion\(prov\)/);
  assert.match(html, /REGION_GROUPS\[prov\] \|\|/);
  assert.match(html, /常见参考口径/);
  assert.match(html, /regionGroup\.style\.display = 'block'/);
});

test('南京苏州济南青岛首批地市公积金参数来自2026年度公开口径', () => {
  const jiangsu = policy.regionGroups['江苏'].regions;
  const shandong = policy.regionGroups['山东'].regions;
  const find = (regions, id) => regions.find(region => region.id === id);

  assert.deepEqual(find(jiangsu, 'nanjing').fund, { min:2660, max:42400 });
  assert.deepEqual(find(jiangsu, 'suzhou').fund, { min:4952, max:40600 });
  assert.deepEqual(find(shandong, 'jinan-urban').fund, { min:2400, max:33902 });
  assert.deepEqual(find(shandong, 'jinan-counties').fund, { min:2210, max:33902 });
  assert.deepEqual(find(shandong, 'qingdao-urban').fund, { min:2400, max:34342.75 });
  assert.deepEqual(find(shandong, 'qingdao-counties').fund, { min:2210, max:34342.75 });
  ['nanjing', 'suzhou'].map(id => find(jiangsu, id)).concat(
    ['jinan-urban', 'jinan-counties', 'qingdao-urban', 'qingdao-counties'].map(id => find(shandong, id))
  ).forEach(region => {
    assert.equal(region.effectiveFrom, '2026-07-01');
    assert.equal(region.effectiveTo, '2027-06-30');
    assert.match(region.source, /^https:\/\//);
  });
});

test('社保政策参数已从页面逻辑拆分为独立配置文件', () => {
  assert.match(html, /<script src="social-policy-data\.js"><\/script>/);
  assert.match(html, /SOCIAL_POLICY_DATA\.provinceBases/);
  assert.equal(Object.keys(policy.provinceBases).length, 31);
  assert.equal(policy.version, '2026-09-07');
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
