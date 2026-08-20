const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const policy = require(path.join(__dirname, '..', 'social-policy-data.js'));

function findRegion(province, id) {
  return policy.regionGroups[province].regions.find(region => region.id === id);
}

test('安徽四个实测区域在华东扩充中保持原值', () => {
  assert.deepEqual(policy.regionGroups['安徽'].regions.map(region => [region.id, region.fund.min, region.fund.max]), [
    ['hefei-urban', 2320, 31564],
    ['hefei-counties', 2100, 31564],
    ['luan-urban', 2170, 25945],
    ['luan-counties', 2100, 25945]
  ]);
});

test('江苏新增2026年已核验地市公积金上下限', () => {
  const expected = {
    changzhou: [2660, 34080],
    lianyungang: [2260, 31545],
    'taizhou-urban': [2660, 30258],
    'taizhou-counties': [2430, 30258],
    'yancheng-main': [2260, 31314],
    'yancheng-counties': [2010, 31314]
  };
  Object.entries(expected).forEach(([id, values]) => {
    const region = findRegion('江苏', id);
    assert.deepEqual([region.fund.min, region.fund.max], values);
    assert.equal(region.status, 'verified');
    assert.match(region.source, /^https:\/\//);
  });
});

test('浙江宁波明确保留官方临时上限提示', () => {
  assert.deepEqual(findRegion('浙江', 'ningbo-urban').fund, { min:2660, max:38907 });
  assert.deepEqual(findRegion('浙江', 'ningbo-counties').fund, { min:2430, max:38907 });
  assert.match(findRegion('浙江', 'ningbo-urban').note, /暂按2025年度38907元执行/);
});

test('福建和江西新增地市均使用官方2026年度上下限', () => {
  const expected = [
    ['福建', 'fuzhou', 2195, 32430],
    ['福建', 'quanzhou-main', 2195, 24795],
    ['福建', 'quanzhou-counties', 2045, 24795],
    ['福建', 'sanming', 1895, 26810],
    ['江西', 'ganzhou', 1950, 24304]
  ];
  expected.forEach(([province, id, min, max]) => {
    const region = findRegion(province, id);
    assert.deepEqual(region.fund, { min, max });
    assert.equal(region.effectiveFrom, '2026-07-01');
    assert.equal(region.effectiveTo, '2027-06-30');
  });
});

test('山东新增五市分区参数并保留小数上限', () => {
  const expected = {
    'zibo-tier-one': [2400, 26736.5],
    'zibo-tier-two': [2210, 26736.5],
    'zibo-tier-three': [2020, 26736.5],
    'yantai-main': [2400, 28692],
    'yantai-counties': [2210, 28692],
    'taian-tier-one': [2210, 23809],
    'taian-tier-two': [2020, 23809],
    weihai: [2400, 24950],
    'linyi-urban': [2210, 25484],
    'linyi-counties': [2020, 25484]
  };
  Object.entries(expected).forEach(([id, values]) => {
    const region = findRegion('山东', id);
    assert.deepEqual([region.fund.min, region.fund.max], values);
    assert.equal(region.status, 'verified');
  });
});

test('北京上海保持直辖市口径，广东新增广州深圳已核验费率', () => {
  assert.equal(policy.regionGroups['北京'], undefined);
  assert.equal(policy.regionGroups['上海'], undefined);
  const guangdong = policy.regionGroups['广东'];
  assert.equal(guangdong.defaultRegion, 'province-reference');
  assert.deepEqual(findRegion('广东', 'guangzhou').rates.medical, [6, 2]);
  assert.equal(findRegion('广东', 'guangzhou').rates.maternityEmployer, 0.85);
  assert.deepEqual(findRegion('广东', 'shenzhen').rates.medical, [6, 2]);
  assert.equal(findRegion('广东', 'shenzhen').rates.maternityEmployer, 0.5);
  assert.deepEqual(findRegion('广东', 'shenzhen').bases.medical, { min:6727, max:33633 });
});
