(function initSocialPolicyData(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.SocialPolicyData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSocialPolicyData() {
  'use strict';

  return Object.freeze({
    schemaVersion: '1.0.0',
    updatedAt: '2026-07-23',
    updateNote: '审核版：仅已核验地区可自动计算。参考资料不生成缴费金额。',
    policies: Object.freeze([
      Object.freeze({
        id: 'manual-local-policy',
        label: '手工录入当地政策参数',
        region: { province: '手工录入', city: null, poolingArea: '用户自行确认' },
        status: 'manual',
        scope: '按当地人社、医保、税务和公积金中心通知手工录入后测算；结果不代表小波财税已核验。',
        effectiveFrom: '2026-01-01',
        effectiveTo: '2099-12-31',
        sources: [],
        reviewedAt: '2026-07-23',
        reviewedBy: '小波财税',
        calculation: null,
      }),
      Object.freeze({
        id: 'fujian-medical-2026-reference',
        label: '福建省（2026 职工医保资料参考）',
        region: { province: '福建', city: null, poolingArea: '省级' },
        status: 'reference',
        scope: '官方文件仅用于记录 2026 年职工医保基数上下限；养老、失业、工伤、公积金和市级执行口径尚未完成整体核验，因此不生成金额。',
        effectiveFrom: '2026-07-01',
        effectiveTo: '2027-06-30',
        sources: [{
          title: '福建省医疗保障局关于调整2026年职工医保缴费上下限基数的通知',
          url: 'https://ybj.fujian.gov.cn/zfxxgkzl/fdzdgknr/qtyzdgkzfxx/202606/t20260629_7168980.htm',
        }],
        reviewedAt: '2026-07-23',
        reviewedBy: '小波财税',
        calculation: null,
      }),
      Object.freeze({
        id: 'hubei-2025-reference',
        label: '湖北省（2025 分统筹区资料参考）',
        region: { province: '湖北', city: null, poolingArea: '分档统筹区' },
        status: 'reference',
        scope: '官方文件存在武汉/省直及不同地市三档基数，说明省级单一参数不可直接用于计算；等待各统筹区完整费率、公积金及有效期核验。',
        effectiveFrom: '2025-09-01',
        effectiveTo: '2026-08-31',
        sources: [{
          title: '湖北省2025年度社会保险缴费基数标准通知',
          url: 'https://rst.hubei.gov.cn/zfxxgk/zc/qtzdgkwj/202509/t20250919_5775307.shtml',
        }],
        reviewedAt: '2026-07-23',
        reviewedBy: '小波财税',
        calculation: null,
      }),
    ]),
  });
});
