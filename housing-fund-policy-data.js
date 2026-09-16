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
      capLabels: {
        standard: '普通家庭',
        multiChildFirstHome: '多子女家庭购买首套房'
      },
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
      capLabels: {
        newHome: '新建商品住房',
        usedOrAffordableHome: '二手房/保障房/政府存量房'
      },
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
      capLabels: {
        firstHome: '首套住房（未缴补充公积金）',
        firstHomeSupplemental: '首套住房（缴补充公积金）',
        secondHome: '第二套住房（未缴补充公积金）',
        secondHomeSupplemental: '第二套住房（缴补充公积金）'
      },
      caps: {
        firstHome: { single: 1000000, family: 2000000 },
        firstHomeSupplemental: { single: 1200000, family: 2400000 },
        secondHome: { single: 800000, family: 1600000 },
        secondHomeSupplemental: { single: 1000000, family: 2000000 }
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
      capLabels: { standard: '普通家庭' },
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
      capLabels: { standard: '普通家庭' },
      caps: {
        standard: { single: 700000, family: 1300000 }
      },
      formula: { type: 'balance-multiple', multiple: 16 },
      note: '可贷额度按账户余额16倍计算，同时受月还款额不超过缴存基数合计50%等条件限制',
      source: 'https://zjj.sz.gov.cn/hdjl/ywzs/gjj/content/post_12798776.html'
    },
    'beijing': {
      province: '北京',
      city: '北京市',
      label: '北京',
      status: 'verified',
      effectiveFrom: '2026-08-08',
      reviewedAt: '2026-09-16',
      capLabels: {
        firstHome: '首套住房',
        secondHome: '第二套住房'
      },
      caps: {
        firstHome: { single: 1200000, family: 2400000 },
        secondHome: { single: 1000000, family: 2000000 }
      },
      note: '部分绿色建筑、多子女家庭等情形可按政策上浮；实际额度还受缴存年限、账户余额及还款能力限制',
      source: 'https://gjj.beijing.gov.cn/web/zwgk61/2024zcwj/436433464/436433467/744089355/index.html'
    },
    'tianjin': {
      province: '天津',
      city: '天津市',
      label: '天津',
      status: 'verified',
      effectiveFrom: '2026-02-01',
      reviewedAt: '2026-09-16',
      applicantMode: 'shared',
      capLabels: {
        firstHome: '首套住房',
        secondHome: '第二套住房',
        multiChildFirstHome: '多子女家庭购买首套房',
        multiChildSecondHome: '多子女家庭购买第二套房'
      },
      caps: {
        firstHome: { single: 1200000, family: 1200000 },
        secondHome: { single: 1000000, family: 1000000 },
        multiChildFirstHome: { single: 1440000, family: 1440000 },
        multiChildSecondHome: { single: 1200000, family: 1200000 }
      },
      note: '天津公布的是每笔住房公积金贷款最高限额，不按单人或夫妻缴存区分',
      source: 'https://www.zfgjj.cn/tjgjjcms/mainSiteApp/content/app_zwgk/app_zcwj/app_zcjd/app_zcjd/376730.html'
    },
    'chongqing': {
      province: '重庆',
      city: '重庆市',
      label: '重庆',
      status: 'verified',
      effectiveFrom: '2024-10-14',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        multiChild: '多子女家庭'
      },
      caps: {
        standard: { single: 800000, family: 1200000 },
        multiChild: { single: 1000000, family: 1600000 }
      },
      formula: { type: 'balance-multiple', multiple: 25 },
      note: '个人可贷额度按住房公积金账户余额25倍计算，并受最高限额、还款能力等条件限制',
      source: 'https://zfcxjw.cq.gov.cn/zwxx_166/bmdt/bmdt_23631/202410/t20241015_13710727.html'
    },
    'guangdong-guangzhou': {
      province: '广东',
      city: '广州市',
      label: '广东广州',
      status: 'verified',
      effectiveFrom: '2025-09-03',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        greenOneStar: '一星级绿色建筑',
        greenTwoStar: '二星级及以上绿色建筑',
        multiChildFirstHome: '多子女家庭购买首套房'
      },
      caps: {
        standard: { single: 800000, family: 1600000 },
        greenOneStar: { single: 880000, family: 1760000 },
        greenTwoStar: { single: 960000, family: 1920000 },
        multiChildFirstHome: { single: 1120000, family: 2240000 }
      },
      note: '多项上浮条件同时满足时按最高上浮比例执行，不叠加计算；实际额度还受账户余额和还款能力限制',
      source: 'https://gjj.gz.gov.cn/siteapp/webpage/page/web/wszx/wszx_content.jsp?MAIL_NUMBER=Z2025090300012'
    },
    'jiangsu-nanjing': {
      province: '江苏',
      city: '南京市',
      label: '江苏南京',
      status: 'verified',
      effectiveFrom: '2025-10-09',
      effectiveTo: '2027-12-31',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        uplift20: '符合一项20%上浮政策',
        stackedSupport: '符合两项可叠加政策'
      },
      caps: {
        standard: { single: 800000, family: 1000000 },
        uplift20: { single: 960000, family: 1200000 },
        stackedSupport: { single: 1160000, family: 1440000 }
      },
      note: '上浮政策适用于多子女、以旧换新、符合条件的绿色建筑或改善型住房等情形，是否可叠加以当地审核为准',
      source: 'https://gjj.nanjing.gov.cn/cjwt/dkl/202307/t20230717_3963784.html'
    },
    'jiangsu-suzhou': {
      province: '江苏',
      city: '苏州市',
      label: '江苏苏州',
      status: 'verified',
      effectiveFrom: '2025-01-01',
      reviewedAt: '2026-09-16',
      capLabels: { standard: '普通家庭' },
      caps: {
        standard: { single: 1200000, family: 1500000 }
      },
      note: '青年人才等特定群体另有上浮政策；此处展示普通家庭最高限额',
      source: 'https://gjj.suzhou.gov.cn/szgjj/fzxdt/202603/db257614ca4d492a8f7e95519f7ffad2.shtml'
    },
    'hubei-wuhan': {
      province: '湖北',
      city: '武汉市',
      label: '湖北武汉',
      status: 'verified',
      effectiveFrom: '2025-09-30',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        multiChild: '多子女家庭',
        greenTwoStarFirstHome: '二星级绿色建筑首套新房'
      },
      caps: {
        standard: { single: 1200000, family: 1500000 },
        multiChild: { single: 1440000, family: 1800000 },
        greenTwoStarFirstHome: { single: 1320000, family: 1650000 }
      },
      note: '多子女家庭与其他贷款额度上浮政策不叠加；实际额度还受缴存时间、账户余额及还款能力限制',
      source: 'https://gjj.wuhan.gov.cn/bsfw/ywzl/ywzn/dkyw/202412/t20241219_2504837.html'
    },
    'shaanxi-xian': {
      province: '陕西',
      city: '西安市',
      label: '陕西西安',
      status: 'verified',
      effectiveFrom: '2026-08-26',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        multiChild: '多子女家庭'
      },
      caps: {
        standard: { single: 900000, family: 1200000 },
        multiChild: { single: 1080000, family: 1440000 }
      },
      note: '政策最高额度不等于实际可贷额度，实际审批还受账户余额、还款能力、房屋情况等因素限制',
      source: 'https://zfgjj.xa.gov.cn/xxgk/zcjd/2092542009973727234.html'
    },
    'shandong-jinan': {
      province: '山东',
      city: '济南市',
      label: '山东济南',
      status: 'verified',
      effectiveFrom: '2026-04-20',
      effectiveTo: '2028-04-19',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        multiChild: '多子女家庭',
        maxStackedSupport: '多项政策叠加上限'
      },
      caps: {
        standard: { single: 900000, family: 1300000 },
        multiChild: { single: 1260000, family: 1820000 },
        maxStackedSupport: { single: 1700000, family: 2400000 }
      },
      note: '叠加上限仅适用于符合多子女或高层次人才、高品质住宅、现房销售项目等组合条件的家庭',
      source: 'https://gjj.jinan.gov.cn/col/col65559/art/2026/art_ae7dd0400dc646d599f5fa7e258e7102.html'
    },
    'shandong-qingdao': {
      province: '山东',
      city: '青岛市',
      label: '山东青岛',
      status: 'verified',
      effectiveFrom: '2026-04-20',
      reviewedAt: '2026-09-16',
      capLabels: {
        standard: '普通家庭',
        maxStackedSupport: '多项政策叠加上限'
      },
      caps: {
        standard: { single: 900000, family: 1300000 },
        maxStackedSupport: { single: 1600000, family: 2400000 }
      },
      note: '叠加上限仅适用于符合现房、多子女、高品质或绿色住宅、高层次人才等组合条件的家庭',
      source: 'https://www.qingdao.gov.cn/ywdt/zwzl/zxwdpt_00/zxwdpt_39/202604/t20260420_10568274.shtml'
    }
  }
};

root.HOUSING_FUND_POLICY_DATA = data;
if (typeof module !== 'undefined' && module.exports) module.exports = data;

})(typeof window !== 'undefined' ? window : globalThis);
