(function(root) {
'use strict';

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function requirePositive(value, field) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(field + ' must be a positive number');
}

function clamp(value, limits) {
  return Math.max(limits.min, Math.min(value, limits.max));
}

function getBaseState(value, limits) {
  return value < limits.min ? 'floor' : (value > limits.max ? 'ceiling' : 'normal');
}

function resolveContributionBase(inputBase, limits) {
  if (!Number.isFinite(inputBase) || inputBase < 0 || !limits ||
      !Number.isFinite(limits.min) || limits.min <= 0 ||
      !Number.isFinite(limits.max) || limits.max < limits.min) {
    throw new RangeError('valid contribution base and limits are required');
  }
  return { base: clamp(inputBase, limits), baseState: getBaseState(inputBase, limits) };
}

function validateLoanAmount(value) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return { ok:false, reason:'empty' };
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,6})?$/.test(text)) {
    return { ok:false, reason:'invalid-number' };
  }
  var amountWan = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(amountWan) || amountWan <= 0) return { ok:false, reason:'invalid-number' };
  // 输入防错阈值，不是当地政策最高额度。
  if (amountWan > 1000) return { ok:false, reason:'suspected-yuan', amountWan:amountWan };
  return { ok:true, amountWan:amountWan, principal:amountWan * 10000 };
}

function calculateContribution(inputBase, employerRatio, employeeRatio, limits) {
  requirePositive(inputBase, 'inputBase');
  requirePositive(employerRatio, 'employerRatio');
  requirePositive(employeeRatio, 'employeeRatio');
  if (!limits || !Number.isFinite(limits.min) || !Number.isFinite(limits.max)) {
    throw new RangeError('valid contribution limits are required');
  }

  var resolved = resolveContributionBase(inputBase, limits);
  var base = resolved.base;
  var employeeMonthly = round2(base * employeeRatio / 100);
  var employerMonthly = round2(base * employerRatio / 100);
  var monthlyTotal = round2(employeeMonthly + employerMonthly);

  return {
    inputBase: inputBase,
    base: base,
    baseState: resolved.baseState,
    employerRatio: employerRatio,
    employeeRatio: employeeRatio,
    employeeMonthly: employeeMonthly,
    employerMonthly: employerMonthly,
    monthlyTotal: monthlyTotal,
    annualEmployee: round2(employeeMonthly * 12),
    annualEmployer: round2(employerMonthly * 12),
    annualTotal: round2(monthlyTotal * 12)
  };
}

function reverseContributionBase(employeeMonthly, employeeRatio, limits) {
  requirePositive(employeeMonthly, 'employeeMonthly');
  requirePositive(employeeRatio, 'employeeRatio');
  if (!limits || !Number.isFinite(limits.min) || !Number.isFinite(limits.max)) {
    throw new RangeError('valid contribution limits are required');
  }

  var rawBase = round2(employeeMonthly / (employeeRatio / 100));
  return {
    employeeMonthly: employeeMonthly,
    employeeRatio: employeeRatio,
    rawBase: rawBase,
    allowedBase: clamp(rawBase, limits),
    baseState: getBaseState(rawBase, limits)
  };
}

function resolveAnnualLoanRate(rates, homeType, months, customRate) {
  if (Number.isFinite(customRate) && customRate > 0) return customRate;
  var rateGroup = rates && rates[homeType];
  if (!rateGroup) throw new RangeError('unknown home type');
  if (!Number.isInteger(months) || months <= 0) throw new RangeError('months must be a positive integer');
  return months <= 60 ? rateGroup.upTo5Years : rateGroup.over5Years;
}

function calculateEqualPayment(principal, monthlyRate, months) {
  var factor = Math.pow(1 + monthlyRate, months);
  var payment = monthlyRate === 0 ? principal / months : principal * monthlyRate * factor / (factor - 1);
  var schedule = [];
  var remaining = principal;

  for (var period = 1; period <= months; period++) {
    var interest = remaining * monthlyRate;
    var principalPart = payment - interest;
    if (period === months) principalPart = remaining;
    var currentPayment = principalPart + interest;
    remaining = Math.max(0, remaining - principalPart);
    schedule.push({
      period: period,
      payment: round2(currentPayment),
      principal: round2(principalPart),
      interest: round2(interest),
      remaining: round2(remaining)
    });
  }

  var totalRepayment = round2(payment * months);
  return {
    schedule: schedule,
    firstPayment: round2(payment),
    lastPayment: round2(payment),
    monthlyDecrease: 0,
    totalRepayment: totalRepayment,
    totalInterest: round2(totalRepayment - principal)
  };
}

function calculateEqualPrincipal(principal, monthlyRate, months) {
  var principalPerMonth = principal / months;
  var schedule = [];
  var remaining = principal;
  var totalRepayment = 0;

  for (var period = 1; period <= months; period++) {
    var interest = remaining * monthlyRate;
    var principalPart = period === months ? remaining : principalPerMonth;
    var payment = principalPart + interest;
    remaining = Math.max(0, remaining - principalPart);
    totalRepayment += payment;
    schedule.push({
      period: period,
      payment: round2(payment),
      principal: round2(principalPart),
      interest: round2(interest),
      remaining: round2(remaining)
    });
  }

  totalRepayment = round2(totalRepayment);
  return {
    schedule: schedule,
    firstPayment: schedule[0].payment,
    lastPayment: schedule[schedule.length - 1].payment,
    monthlyDecrease: round2(principalPerMonth * monthlyRate),
    totalRepayment: totalRepayment,
    totalInterest: round2(totalRepayment - principal)
  };
}

function calculateLoanSchedule(principal, annualRate, months, method) {
  requirePositive(principal, 'principal');
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new RangeError('annualRate must not be negative');
  if (!Number.isInteger(months) || months <= 0 || months > 600) {
    throw new RangeError('months must be an integer between 1 and 600');
  }
  if (method !== 'equal-payment' && method !== 'equal-principal') {
    throw new RangeError('unknown repayment method');
  }

  var monthlyRate = annualRate / 100 / 12;
  var result = method === 'equal-payment'
    ? calculateEqualPayment(principal, monthlyRate, months)
    : calculateEqualPrincipal(principal, monthlyRate, months);

  result.method = method;
  result.principal = principal;
  result.annualRate = annualRate;
  result.months = months;
  return result;
}

function selectCapGroup(policy, category) {
  if (!policy || !policy.caps) return null;
  if (category && policy.caps[category]) return policy.caps[category];
  return policy.caps.standard || policy.caps.firstHome || policy.caps.newHome || null;
}

function resolveReferenceLoanCap(policy, applicantType, manualCap, category) {
  var capGroup = selectCapGroup(policy, category);
  if (capGroup && Number.isFinite(capGroup[applicantType])) {
    return {
      amount: capGroup[applicantType],
      source: 'policy',
      verified: policy.status === 'verified',
      policyId: policy.id || null,
      note: policy.note || null
    };
  }
  if (Number.isFinite(manualCap) && manualCap > 0) {
    return { amount:manualCap, source:'manual', verified:false, policyId:null, note:null };
  }
  return { amount:null, source:'unavailable', verified:false, policyId:null, note:null };
}

function estimatePersonalLoan(policy, applicantType, category, input) {
  var rule = policy && policy.estimation;
  if (!rule || !rule.categories || !rule.categories[category]) return { ok:false, reason:'unsupported' };
  input = input || {};
  var years = input.years;
  var count = applicantType === 'family' ? 2 : 1;
  var persons = input.contributors || [];
  if (!Number.isInteger(years) || years < 1 || years > 30 || persons.length !== count) {
    return { ok:false, reason:'invalid-input' };
  }
  var categoryRule = rule.categories[category];
  if (categoryRule.maxPropertyAge != null) {
    if (!Number.isInteger(input.propertyAge) || input.propertyAge < 0) return { ok:false, reason:'invalid-input' };
    if (input.propertyAge > categoryRule.maxPropertyAge || input.propertyAge + years > categoryRule.agePlusYears) {
      return { ok:false, reason:'property-age' };
    }
  }
  for (var i = 0; i < persons.length; i++) {
    if (!Number.isInteger(persons[i].months) || persons[i].months < rule.minimumMonths) return { ok:false, reason:'contribution-months' };
  }
  var cap = resolveReferenceLoanCap(policy, applicantType, 0, category).amount;
  if (!cap) return { ok:false, reason:'unsupported' };
  var limits = [{ label:'政策最高额度', amount:cap }];
  if (rule.type === 'base-and-balance') {
    var baseSum = 0;
    var balanceAmount = 0;
    for (var j = 0; j < persons.length; j++) {
      var person = persons[j];
      if (!Number.isFinite(person.base) || person.base <= 0 || !Number.isFinite(person.balance) || person.balance < 0) {
        return { ok:false, reason:'invalid-input' };
      }
      baseSum += person.base;
      var multiple = person.months <= rule.monthThreshold ? rule.shortMultiple : rule.longMultiple;
      balanceAmount += Math.max(person.balance, rule.minimumBalance) * multiple;
    }
    limits.push({ label:'缴存基数及年限', amount:baseSum * rule.baseRatio * 12 * years });
    limits.push({ label:'账户余额及缴存时间', amount:balanceAmount });
  } else if (rule.type === 'monthly-contribution') {
    var total = 0;
    for (var k = 0; k < persons.length; k++) {
      if (!Number.isFinite(persons[k].monthlyTotal) || persons[k].monthlyTotal <= 0) return { ok:false, reason:'invalid-input' };
      total += persons[k].monthlyTotal;
    }
    limits.push({ label:'月缴存额公式', amount:Math.max(total * 12 * rule.annualMultiple, rule.minimumFormulaAmount) });
    if (input.checkRepaymentCapacity) {
    if (!Number.isFinite(input.familyIncome) || input.familyIncome <= 0 ||
        !Number.isFinite(input.otherMonthlyDebt) || input.otherMonthlyDebt < 0 ||
        !Number.isFinite(input.annualRate) || input.annualRate <= 0 ||
        (input.method !== 'equal-payment' && input.method !== 'equal-principal')) return { ok:false, reason:'invalid-input' };
    var monthlyBudget = Math.max(0, (input.familyIncome - input.otherMonthlyDebt) * rule.repaymentRatio);
    var months = years * 12;
    var r = input.annualRate / 100 / 12;
    var factor = input.method === 'equal-principal' ? 1 / months + r : r / (1 - Math.pow(1 + r, -months));
    limits.push({ label:'家庭还款能力', amount:monthlyBudget / factor });
    }
  } else return { ok:false, reason:'unsupported' };
  var amount = Math.min.apply(null, limits.map(function(item) { return item.amount; }));
  // 展示到元，向下取整避免显示超过任一约束的金额。
  return { ok:true, amount:Math.floor(amount), cap:cap, limits:limits,
    limitingFactors:limits.filter(function(item) { return Math.abs(item.amount - amount) < 0.01; }).map(function(item) { return item.label; }) };
}

var engine = {
  resolveContributionBase: resolveContributionBase,
  validateLoanAmount: validateLoanAmount,
  estimatePersonalLoan: estimatePersonalLoan,
  calculateContribution: calculateContribution,
  reverseContributionBase: reverseContributionBase,
  resolveAnnualLoanRate: resolveAnnualLoanRate,
  calculateLoanSchedule: calculateLoanSchedule,
  resolveReferenceLoanCap: resolveReferenceLoanCap
};

root.HOUSING_FUND_CALCULATION_ENGINE = engine;
if (typeof module !== 'undefined' && module.exports) module.exports = engine;

})(typeof window !== 'undefined' ? window : globalThis);
