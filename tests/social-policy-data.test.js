const test = require('node:test');
const assert = require('node:assert/strict');

const policyData = require('../data/social-insurance/policies.v1.js');
const Engine = require('../js/social-policy-engine.js');

test('所有政策记录都具有可审计的来源和状态字段', () => {
  assert.equal(policyData.schemaVersion, '1.0.0');
  assert.ok(policyData.policies.length >= 3);

  for (const policy of policyData.policies) {
    assert.deepEqual(Engine.validatePolicy(policy), { valid: true, errors: [] }, policy.id);
  }
});

test('参考资料不会生成看似精确的缴费金额', () => {
  const reference = policyData.policies.find((policy) => policy.status === 'reference');
  assert.ok(reference);
  assert.equal(Engine.getPolicyAvailability(reference, new Date('2026-07-23')).canCalculate, false);
});

test('手工模式必须录入完整参数后才可计算', () => {
  const incomplete = Engine.createManualPolicy({
    siBaseMin: 4000,
    siBaseMax: 20000,
  });
  assert.equal(Engine.getPolicyAvailability(incomplete, new Date('2026-07-23')).canCalculate, false);

  const complete = Engine.createManualPolicy({
    siBaseMin: 4000,
    siBaseMax: 20000,
    fundBaseMin: 4000,
    fundBaseMax: 20000,
    pensionEmployerRate: 16,
    pensionPersonalRate: 8,
    medicalEmployerRate: 7,
    medicalPersonalRate: 2,
    unemploymentEmployerRate: 0.5,
    unemploymentPersonalRate: 0.5,
    injuryEmployerRate: 0.2,
  });
  assert.equal(Engine.getPolicyAvailability(complete, new Date('2026-07-23')).canCalculate, true);
});
