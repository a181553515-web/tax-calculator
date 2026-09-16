(function(root) {
'use strict';

var data = {
  version: '2026-09-16',
  reviewedAt: '2026-09-16',

  // 全国统一的公积金贷款利率。二套利率按当前各地普遍执行值测算。
  nationalLoanRates: {
    effectiveFrom: '2025-05-08',
    reviewedAt: '2026-09-16',
    first: { upTo5Years: 2.1, over5Years: 2.6 },
    second: { upTo5Years: 2.525, over5Years: 3.075 },
    source: 'https://app.www.gov.cn/govdata/gov/202505/07/528461/article.html',
    note: '人民银行规定二套房利率不低于该值；计算器按当前各地普遍执行值测算'
  },

  // 这里只保存贷款政策，不复制 social-policy-data.js 中的公积金缴存上下限。
  loanPolicies: {
    'anhui-hefei': {
      province: '安徽',
      city: '合肥市',
      label: '安徽合肥',
      status: 'verified',
      effectiveFrom: '2025-09-08',
      effectiveTo: '2030-09-07',
      reviewedAt: '2026-09-16',
      caps: {
        standard: { single: 900000, family: 1200000 },
        multiChildFirstHome: { single: 1080000, family: 1440000 }
      },
      note: '实际额度还受缴存基数、账户余额、可贷年限和还款能力等因素限制',
      source: 'https://gjjzx.hefei.gov.cn/zcfg/gjjzc/18878349.html'
    },
    'anhui-luan': {
      province: '安徽',
      city: '六安市',
      label: '安徽六安',
      status: 'verified',
      effectiveFrom: '2025-01-01',
      reviewedAt: '2026-09-16',
      caps: {
        newHome: { single: 600000, family: 800000 },
        usedOrAffordableHome: { single: 400000, family: 600000 }
      },
      formula: { type: 'monthly-contribution-multiple', annualMultiple: 20 },
      note: '可贷额度还需按借款人及配偶最近一次月缴存额×12×20测算，并受还款能力及房价限制',
      source: 'https://zfgjj.luan.gov.cn/public/6608511/10701396.html'
    },
    'shanghai': {
      province: '上海',
      city: '上海市',
      label: '上海',
      status: 'verified',
      effectiveFrom: '2026-02-26',
      reviewedAt: '2026-09-16',
      caps: {
        firstHome: { single: 1000000, family: 2000000 },
        secondHome: { single: 800000, family: 1600000 }
      },
      supplementalCaps: {
        firstHome: { single: 200000, family: 400000 },
        secondHome: { single: 200000, family: 400000 }
      },
      note: '缴交补充公积金及多子女、绿色建筑等情形可按当地政策上浮',
      source: 'https://www.shanghai.gov.cn/xbhygq/20260228/87e93e4c373c4bfe81af5557a77d2e70.html'
    },
    'zhejiang-hangzhou': {
      province: '浙江',
      city: '杭州市',
      label: '浙江杭州',
      status: 'verified',
      effectiveFrom: '2026-03-30',
      reviewedAt: '2026-09-16',
      caps: {
        standard: { single: 900000, family: 1800000 }
      },
      formula: { type: 'balance-multiple', multiple: 20 },
      note: '个人可贷额度按账户月均余额倍数计算，家庭额度为两人可贷额度合计并受最高限额约束',
      source: 'https://zfgb.hangzhou.gov.cn/upload/default/bigfile/2026/03/30/20260330_199a2ba4e8beb05bb90bd66a9c658de3.pdf'
    },
    'guangdong-shenzhen': {
      province: '广东',
      city: '深圳市',
      label: '广东深圳',
      status: 'verified',
      effectiveFrom: '2026-04-30',
      reviewedAt: '2026-09-16',
      caps: {
        standard: { single: 700000, family: 1300000 }
      },
      formula: { type: 'balance-multiple', multiple: 16 },
      note: '可贷额度按账户余额16倍计算，同时受月还款额不超过缴存基数合计50%等条件限制',
      source: 'https://zjj.sz.gov.cn/hdjl/ywzs/gjj/content/post_12798776.html'
    }
  }
};

root.HOUSING_FUND_POLICY_DATA = data;
if (typeof module !== 'undefined' && module.exports) module.exports = data;

})(typeof window !== 'undefined' ? window : globalThis);
