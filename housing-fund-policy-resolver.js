(function(root) {
'use strict';

function findRegion(group, regionId) {
  if (!group || !Array.isArray(group.regions)) return null;
  var targetId = regionId || group.defaultRegion;
  return group.regions.filter(function(region) { return region.id === targetId; })[0] || null;
}

function listContributionRegions(socialData, province) {
  var group = socialData && socialData.regionGroups && socialData.regionGroups[province];
  if (!group || !Array.isArray(group.regions)) {
    return [{ id:'province-reference', label:province + '省级常见口径（参考）', status:'reference' }];
  }
  return group.regions.slice();
}

function resolveContributionPolicy(socialData, province, regionId) {
  if (!socialData || !socialData.provinceBases) return null;
  var provinceBase = socialData.provinceBases[province];
  if (!provinceBase) return null;

  var group = socialData.regionGroups && socialData.regionGroups[province];
  var region = findRegion(group, regionId);
  var fund = region && region.fund ? region.fund : null;
  var provinceRates = socialData.provinceRates && socialData.provinceRates[province];

  return {
    province: province,
    regionId: region ? region.id : 'province-reference',
    label: region ? region.label : province + '省级常见口径（参考）',
    status: region ? (region.status || 'reference') : 'reference',
    min: fund && Number.isFinite(fund.min) ? fund.min : provinceBase.fundMin,
    max: fund && Number.isFinite(fund.max) ? fund.max : provinceBase.fundMax,
    ratioMin: 5,
    ratioMax: provinceRates && provinceRates.fundMaxRatio ? provinceRates.fundMaxRatio : 12,
    effectiveFrom: region && region.effectiveFrom ? region.effectiveFrom : (group && group.effectiveFrom) || null,
    effectiveTo: region && region.effectiveTo ? region.effectiveTo : (group && group.effectiveTo) || null,
    effectivePeriod: region && region.effectivePeriod ? region.effectivePeriod : null,
    reviewedAt: region && region.reviewedAt ? region.reviewedAt : (group && group.reviewedAt) || socialData.reviewedAt || null,
    source: region && region.source ? region.source : (group && group.baseSource) || null,
    note: region && region.note ? region.note : null
  };
}

function listLoanPolicies(loanData) {
  if (!loanData || !loanData.loanPolicies) return [];
  return Object.keys(loanData.loanPolicies).map(function(id) {
    var policy = loanData.loanPolicies[id];
    return Object.assign({ id:id }, policy);
  });
}

function resolveLoanPolicy(loanData, policyId) {
  if (!loanData || !loanData.loanPolicies || !loanData.loanPolicies[policyId]) return null;
  return Object.assign({ id:policyId }, loanData.loanPolicies[policyId]);
}

var resolver = {
  listContributionRegions: listContributionRegions,
  resolveContributionPolicy: resolveContributionPolicy,
  listLoanPolicies: listLoanPolicies,
  resolveLoanPolicy: resolveLoanPolicy
};

root.HOUSING_FUND_POLICY_RESOLVER = resolver;
if (typeof module !== 'undefined' && module.exports) module.exports = resolver;

})(typeof window !== 'undefined' ? window : globalThis);
