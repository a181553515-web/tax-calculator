(function initSocialPolicyEngine(root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.SocialPolicyEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSocialPolicyEngine() {
  'use strict';

  const ALLOWED_STATUSES = new Set(['verified', 'reference', 'expired', 'manual']);
  const REQUIRED_RATE_KEYS = ['pension', 'medical', 'unemployment', 'injury', 'maternity', 'longTermCare', 'medicalFixed'];

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function toNumber(value) {
    if (value === '' || value === null || value === undefined) return NaN;
    return Number(String(value).replace(/,/g, '').trim());
  }

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function isValidDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00'));
  }

  function hasCompleteCalculation(calculation) {
    if (!calculation || typeof calculation !== 'object') return false;
    const bases = [calculation.siBase, calculation.fundBase];
    if (bases.some((base) => !base || !isFiniteNumber(base.min) || !isFiniteNumber(base.max) || base.min < 0 || base.max < base.min)) return false;
    if (!calculation.rates || !calculation.fund) return false;
    if (!isFiniteNumber(calculation.fund.minRatio) || !isFiniteNumber(calculation.fund.maxRatio) || !isFiniteNumber(calculation.fund.defaultRatio)) return false;
    if (calculation.fund.minRatio < 0 || calculation.fund.maxRatio < calculation.fund.minRatio || calculation.fund.defaultRatio < calculation.fund.minRatio || calculation.fund.defaultRatio > calculation.fund.maxRatio) return false;

    return REQUIRED_RATE_KEYS.every((key) => {
      const rate = calculation.rates[key];
      if (!rate || typeof rate !== 'object') return false;
      if (!isFiniteNumber(rate.employer) || rate.employer < 0) return false;
      return key === 'injury' || key === 'maternity' || isFiniteNumber(rate.personal) && rate.personal >= 0;
    });
  }

  function validatePolicy(policy) {
    const errors = [];
    if (!policy || typeof policy !== 'object') return { valid: false, errors: ['政策记录必须是对象'] };
    ['id', 'label', 'scope', 'effectiveFrom', 'effectiveTo', 'reviewedAt', 'reviewedBy'].forEach((key) => {
      if (typeof policy[key] !== 'string' || !policy[key].trim()) errors.push(`缺少 ${key}`);
    });
    if (!ALLOWED_STATUSES.has(policy.status)) errors.push('status 不合法');
    if (!policy.region || typeof policy.region.province !== 'string' || !policy.region.province.trim()) errors.push('缺少 region.province');
    if (!isValidDate(policy.effectiveFrom) || !isValidDate(policy.effectiveTo) || policy.effectiveFrom > policy.effectiveTo) errors.push('有效期不合法');
    if (!Array.isArray(policy.sources)) errors.push('sources 必须是数组');
    if (policy.status !== 'manual' && (!Array.isArray(policy.sources) || policy.sources.length === 0)) errors.push('非手工政策必须至少有一个来源');
    if (Array.isArray(policy.sources)) {
      policy.sources.forEach((source, index) => {
        if (!source || typeof source.title !== 'string' || !source.title.trim() || typeof source.url !== 'string' || !/^https:\/\//.test(source.url)) errors.push(`来源 ${index + 1} 不合法`);
      });
    }
    if (policy.status === 'verified' && !hasCompleteCalculation(policy.calculation)) errors.push('已核验政策缺少完整计算参数');
    if ((policy.status === 'reference' || policy.status === 'expired') && policy.calculation !== null) errors.push('参考或失效政策不得携带计算参数');
    if (policy.status === 'manual' && policy.calculation !== null && !hasCompleteCalculation(policy.calculation)) errors.push('手工政策参数不完整');
    return { valid: errors.length === 0, errors };
  }

  function getPolicyAvailability(policy, now) {
    const validation = validatePolicy(policy);
    if (!validation.valid) return { canCalculate: false, reason: validation.errors[0] || '政策数据不完整', validation };
    if (policy.status === 'reference') return { canCalculate: false, reason: '该地区政策仅作资料参考，尚未完成计算参数核验。', validation };
    if (policy.status === 'expired') return { canCalculate: false, reason: '该地区政策已过有效期，等待更新后才可计算。', validation };
    if (policy.status === 'manual') {
      return hasCompleteCalculation(policy.calculation)
        ? { canCalculate: true, reason: '按手工录入参数测算，未经小波财税核验。', validation, mode: 'manual' }
        : { canCalculate: false, reason: '请先完整录入当地政策参数，再进行手工测算。', validation, mode: 'manual' };
    }
    const today = now instanceof Date ? now : new Date();
    const day = today.toISOString().slice(0, 10);
    if (day < policy.effectiveFrom || day > policy.effectiveTo) return { canCalculate: false, reason: '该地区政策不在当前有效期内，等待更新后才可计算。', validation };
    return { canCalculate: true, reason: '', validation, mode: 'verified' };
  }

  function createManualPolicy(input) {
    const read = (key) => toNumber(input[key]);
    const optional = (key) => {
      const value = read(key);
      return Number.isNaN(value) ? 0 : value;
    };
    return {
      id: 'manual-local-policy',
      label: '手工录入当地政策参数',
      region: { province: '手工录入', city: null, poolingArea: '用户自行确认' },
      status: 'manual',
      scope: '仅按用户录入的当地政策参数测算，不代表小波财税核验结论。',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2099-12-31',
      sources: [],
      reviewedAt: '2026-07-23',
      reviewedBy: '浏览器本地用户',
      calculation: {
        siBase: { min: read('siBaseMin'), max: read('siBaseMax') },
        fundBase: { min: read('fundBaseMin'), max: read('fundBaseMax') },
        rates: {
          pension: { employer: read('pensionEmployerRate'), personal: read('pensionPersonalRate') },
          medical: { employer: read('medicalEmployerRate'), personal: read('medicalPersonalRate') },
          unemployment: { employer: read('unemploymentEmployerRate'), personal: read('unemploymentPersonalRate') },
          injury: { employer: read('injuryEmployerRate') },
          maternity: { employer: optional('maternityEmployerRate'), personal: 0 },
          longTermCare: { employer: optional('longTermCareEmployerRate'), personal: optional('longTermCarePersonalRate') },
          medicalFixed: { employer: optional('medicalFixedEmployer'), personal: optional('medicalFixedPersonal') },
        },
        fund: { minRatio: 0, maxRatio: 100, defaultRatio: Number.isNaN(read('fundRatio')) ? 0 : read('fundRatio') },
      },
    };
  }

  function calculateSocialInsurance(policy, salary, options) {
    const availability = getPolicyAvailability(policy, options && options.now);
    if (!availability.canCalculate) throw new Error(`该地区政策暂不能计算：${availability.reason}`);
    const monthlySalary = toNumber(salary);
    if (!isFiniteNumber(monthlySalary) || monthlySalary <= 0) throw new Error('请填写大于 0 的月工资。');
    const calculation = policy.calculation;
    const rates = calculation.rates;
    const normalizedOptions = options || {};
    const siBase = clamp(monthlySalary, calculation.siBase.min, calculation.siBase.max);
    const fundBase = clamp(monthlySalary, calculation.fundBase.min, calculation.fundBase.max);
    const fundEnabled = Boolean(normalizedOptions.fundEnabled);
    const requestedFundRatio = isFiniteNumber(toNumber(normalizedOptions.fundRatio)) ? toNumber(normalizedOptions.fundRatio) : calculation.fund.defaultRatio;
    const fundRatio = fundEnabled ? clamp(requestedFundRatio, calculation.fund.minRatio, calculation.fund.maxRatio) : 0;
    const injuryEmployerRate = isFiniteNumber(toNumber(normalizedOptions.injuryEmployerRate)) ? toNumber(normalizedOptions.injuryEmployerRate) : rates.injury.employer;
    const longTermCareEnabled = Boolean(normalizedOptions.longTermCareEnabled);

    const pensionEmployer = round2(siBase * rates.pension.employer / 100);
    const pensionPersonal = round2(siBase * rates.pension.personal / 100);
    const medicalEmployer = round2(siBase * rates.medical.employer / 100);
    const medicalPersonal = round2(siBase * rates.medical.personal / 100);
    const unemploymentEmployer = round2(siBase * rates.unemployment.employer / 100);
    const unemploymentPersonal = round2(siBase * rates.unemployment.personal / 100);
    const injuryEmployer = round2(siBase * injuryEmployerRate / 100);
    const maternityEmployer = round2(siBase * rates.maternity.employer / 100);
    const longTermCareEmployer = longTermCareEnabled ? round2(siBase * rates.longTermCare.employer / 100) : 0;
    const longTermCarePersonal = longTermCareEnabled ? round2(siBase * rates.longTermCare.personal / 100) : 0;
    const medicalFixedEmployer = rates.medicalFixed.employer;
    const medicalFixedPersonal = rates.medicalFixed.personal;
    const fundEmployer = fundEnabled ? round2(fundBase * fundRatio / 100) : 0;
    const fundPersonal = fundEnabled ? round2(fundBase * fundRatio / 100) : 0;

    const employerSocialTotal = round2(pensionEmployer + medicalEmployer + unemploymentEmployer + injuryEmployer + maternityEmployer + longTermCareEmployer + medicalFixedEmployer);
    const personalSocialTotal = round2(pensionPersonal + medicalPersonal + unemploymentPersonal + longTermCarePersonal + medicalFixedPersonal);
    const employerTotal = round2(employerSocialTotal + fundEmployer);
    const personalTotal = round2(personalSocialTotal + fundPersonal);

    return {
      policy: {
        id: policy.id,
        label: policy.label,
        status: policy.status,
        scope: policy.scope,
        effectiveFrom: policy.effectiveFrom,
        effectiveTo: policy.effectiveTo,
        reviewedAt: policy.reviewedAt,
        reviewedBy: policy.reviewedBy,
        sourceTitle: policy.sources[0] ? policy.sources[0].title : '用户手工录入',
        sourceUrl: policy.sources[0] ? policy.sources[0].url : '',
      },
      salary: monthlySalary,
      siBase,
      fundBase,
      fundRatio,
      injuryEmployerRate,
      fundEnabled,
      longTermCareEnabled,
      rates: {
        pension: rates.pension,
        medical: rates.medical,
        unemployment: rates.unemployment,
        injury: { employer: injuryEmployerRate },
        maternity: rates.maternity,
        longTermCare: rates.longTermCare,
        medicalFixed: rates.medicalFixed,
      },
      pensionEmployer,
      pensionPersonal,
      medicalEmployer,
      medicalPersonal,
      unemploymentEmployer,
      unemploymentPersonal,
      injuryEmployer,
      maternityEmployer,
      longTermCareEmployer,
      longTermCarePersonal,
      medicalFixedEmployer,
      medicalFixedPersonal,
      fundEmployer,
      fundPersonal,
      employerSocialTotal,
      personalSocialTotal,
      employerTotal,
      personalTotal,
      afterSocialInsuranceSalary: round2(monthlySalary - personalTotal),
      companyCost: round2(monthlySalary + employerTotal),
      afterSocialInsuranceLabel: '扣五险一金后工资（未扣个税）',
    };
  }

  return {
    calculateSocialInsurance,
    createManualPolicy,
    getPolicyAvailability,
    hasCompleteCalculation,
    round2,
    validatePolicy,
  };
});
