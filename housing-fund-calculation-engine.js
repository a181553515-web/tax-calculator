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

function calculateContribution(inputBase, employerRatio, employeeRatio, limits) {
  requirePositive(inputBase, 'inputBase');
  requirePositive(employerRatio, 'employerRatio');
  requirePositive(employeeRatio, 'employeeRatio');
  if (!limits || !Number.isFinite(limits.min) || !Number.isFinite(limits.max)) {
    throw new RangeError('valid contribution limits are required');
  }

  var base = clamp(inputBase, limits);
  var employeeMonthly = round2(base * employeeRatio / 100);
  var employerMonthly = round2(base * employerRatio / 100);
  var monthlyTotal = round2(employeeMonthly + employerMonthly);

  return {
    inputBase: inputBase,
    base: base,
    baseState: getBaseState(inputBase, limits),
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

var engine = {
  calculateContribution: calculateContribution,
  reverseContributionBase: reverseContributionBase,
  resolveAnnualLoanRate: resolveAnnualLoanRate,
  calculateLoanSchedule: calculateLoanSchedule,
  resolveReferenceLoanCap: resolveReferenceLoanCap
};

root.HOUSING_FUND_CALCULATION_ENGINE = engine;
if (typeof module !== 'undefined' && module.exports) module.exports = engine;

})(typeof window !== 'undefined' ? window : globalThis);
