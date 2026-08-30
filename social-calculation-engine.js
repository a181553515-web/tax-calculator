(function(root) {
'use strict';

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clampBase(salary, limits) {
  return Math.max(limits.min, Math.min(salary, limits.max));
}

function getSocialBaseMode(options) {
  var mode = options && options.socialBaseMode;
  return mode === 'minimum' || mode === 'custom' ? mode : 'salary';
}

function getSocialBaseInput(salary, limits, mode, customAmount) {
  if (mode === 'minimum') return limits.min;
  if (mode === 'custom' && Number.isFinite(customAmount) && customAmount > 0) return customAmount;
  return salary;
}

function getBaseState(value, limits) {
  return value < limits.min ? 'floor' : (value > limits.max ? 'ceiling' : 'normal');
}

function calculate(rates, salary, options) {
  var socialBaseMode = getSocialBaseMode(options);
  var socialBaseAmount = Number(options && options.socialBaseAmount);
  var socialBaseInputs = {
    pension: getSocialBaseInput(salary, rates.baseLimits.pension, socialBaseMode, socialBaseAmount),
    medical: getSocialBaseInput(salary, rates.baseLimits.medical, socialBaseMode, socialBaseAmount),
    unemployment: getSocialBaseInput(salary, rates.baseLimits.unemployment, socialBaseMode, socialBaseAmount),
    injury: getSocialBaseInput(salary, rates.baseLimits.injury, socialBaseMode, socialBaseAmount)
  };
  var pensionBase = clampBase(socialBaseInputs.pension, rates.baseLimits.pension);
  var medicalBase = clampBase(socialBaseInputs.medical, rates.baseLimits.medical);
  var unemploymentBase = clampBase(socialBaseInputs.unemployment, rates.baseLimits.unemployment);
  var injuryBase = clampBase(socialBaseInputs.injury, rates.baseLimits.injury);
  var siBase = pensionBase;
  var fundBase = Math.max(rates.fundMin, Math.min(salary, rates.fundMax));

  var isCapped = getBaseState(socialBaseInputs.pension, rates.baseLimits.pension);
  var isFundCapped = salary < rates.fundMin ? 'floor' : (salary > rates.fundMax ? 'ceiling' : 'normal');

  var pensionEmp = round2(pensionBase * rates.pension[0] / 100);
  var pensionPer = round2(pensionBase * rates.pension[1] / 100);

  var medicalEmp = round2(medicalBase * rates.medical[0] / 100);
  var medicalPer = round2(medicalBase * rates.medical[1] / 100);
  var maternityEmp = rates.maternityEmployer ? round2(medicalBase * rates.maternityEmployer / 100) : 0;
  var medicalFixedPer = rates.medicalFixed || 0;

  var unempEmp = round2(unemploymentBase * rates.unemployment[0] / 100);
  var unempPer = round2(unemploymentBase * rates.unemployment[1] / 100);

  var injuryEmp = round2(injuryBase * rates.injury / 100);
  var injurySupplementEmp = round2(injuryBase * rates.injurySupplementRate / 100);

  var ltcPolicy = rates.longTermCareEnabled ? rates.longTermCarePolicy : null;
  var ltcEmpRate = ltcPolicy ? (ltcPolicy.employerCostRate || 0) : 0;
  var ltcPerRate = ltcPolicy ? (ltcPolicy.employeePayrollRate || 0) : 0;
  var ltcEmp = round2(medicalBase * ltcEmpRate / 100);
  var ltcPer = round2(medicalBase * ltcPerRate / 100);

  var medicalAidEmp = rates.medicalAidFixed || 0;
  var medicalAidPer = 0;

  var fundEmp = 0;
  var fundPer = 0;
  if (rates.fundEnabled) {
    fundEmp = round2(fundBase * rates.fundRatio / 100);
    fundPer = round2(fundBase * rates.fundRatio / 100);
  }

  var siEmpTotal = round2(pensionEmp + medicalEmp + maternityEmp + medicalAidEmp + unempEmp + injuryEmp + injurySupplementEmp + ltcEmp);
  var siPerTotal = round2(pensionPer + medicalPer + medicalFixedPer + medicalAidPer + unempPer + ltcPer);
  var grandEmpTotal = round2(siEmpTotal + fundEmp);
  var grandPerTotal = round2(siPerTotal + fundPer);
  var takeHome = round2(salary - grandPerTotal);
  var companyCost = round2(salary + grandEmpTotal);

  return {
    rates: rates,
    salary: salary,
    socialBaseMode: socialBaseMode,
    socialBaseAmount: socialBaseMode === 'custom' ? socialBaseAmount : null,
    socialBaseInputs: socialBaseInputs,
    siBase: siBase,
    pensionBase: pensionBase,
    medicalBase: medicalBase,
    unemploymentBase: unemploymentBase,
    injuryBase: injuryBase,
    fundBase: fundBase,
    isCapped: isCapped,
    isFundCapped: isFundCapped,
    pensionEmp: pensionEmp,
    pensionPer: pensionPer,
    medicalEmp: medicalEmp,
    medicalPer: medicalPer,
    maternityEmp: maternityEmp,
    medicalFixedPer: medicalFixedPer,
    unempEmp: unempEmp,
    unempPer: unempPer,
    injuryEmp: injuryEmp,
    injurySupplementEmp: injurySupplementEmp,
    ltcEmpRate: ltcEmpRate,
    ltcPerRate: ltcPerRate,
    ltcEmp: ltcEmp,
    ltcPer: ltcPer,
    medicalAidEmp: medicalAidEmp,
    fundEmp: fundEmp,
    fundPer: fundPer,
    siEmpTotal: siEmpTotal,
    siPerTotal: siPerTotal,
    grandEmpTotal: grandEmpTotal,
    grandPerTotal: grandPerTotal,
    takeHome: takeHome,
    companyCost: companyCost
  };
}

function solveGrossSalary(rates, targetAmount, mode, options) {
  var metric = mode === 'company-budget' ? 'companyCost' : 'takeHome';
  var targetCents = Math.round(targetAmount * 100);
  if (!Number.isFinite(targetCents) || targetCents <= 0) {
    return { ok:false, reason:'invalid-target' };
  }

  function resultAt(grossCents) {
    return calculate(rates, grossCents / 100, options);
  }

  function metricCents(result) {
    return Math.round(result[metric] * 100);
  }

  var low = 0;
  var lowResult = resultAt(low);
  var minimumMetricCents = metricCents(lowResult);
  if (minimumMetricCents > targetCents) {
    return {
      ok: false,
      reason: 'below-minimum',
      minimumAmount: minimumMetricCents / 100
    };
  }

  var high = Math.max(targetCents, 100);
  var highResult = resultAt(high);
  var maximumGrossCents = 10000000000;
  while (metricCents(highResult) < targetCents && high < maximumGrossCents) {
    high = Math.min(high * 2, maximumGrossCents);
    highResult = resultAt(high);
  }
  if (metricCents(highResult) < targetCents) {
    return { ok:false, reason:'target-too-large' };
  }

  while (low < high) {
    var mid = Math.floor((low + high) / 2);
    var midResult = resultAt(mid);
    if (metricCents(midResult) >= targetCents) high = mid;
    else low = mid + 1;
  }

  var candidates = [];
  for (var offset = -2; offset <= 2; offset++) {
    var grossCents = Math.max(0, low + offset);
    var result = resultAt(grossCents);
    candidates.push({
      grossCents: grossCents,
      result: result,
      differenceCents: metricCents(result) - targetCents
    });
  }
  candidates.sort(function(a, b) {
    var diff = Math.abs(a.differenceCents) - Math.abs(b.differenceCents);
    return diff || a.grossCents - b.grossCents;
  });

  var best = candidates[0];
  return {
    ok: true,
    mode: mode,
    metric: metric,
    targetAmount: targetCents / 100,
    grossSalary: best.grossCents / 100,
    actualAmount: best.result[metric],
    difference: best.differenceCents / 100,
    result: best.result
  };
}

var engine = {
  calculate: calculate,
  solveGrossSalary: solveGrossSalary
};

root.SOCIAL_CALCULATION_ENGINE = engine;
if (typeof module !== 'undefined' && module.exports) module.exports = engine;

})(typeof window !== 'undefined' ? window : globalThis);
