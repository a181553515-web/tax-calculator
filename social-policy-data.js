(function(root) {
'use strict';

var data = {
  version: '2026-08-20',

  // 安徽为本地实测口径；其他省级数据用于未录入具体地市时快速估算。
  provinceBases: {
    '北京':   { min: 7162,  max: 35811, fundMin: 2540,  fundMax: 35811 },
    '天津':   { min: 5124,  max: 25620, fundMin: 2320,  fundMax: 23750 },
    '河北':   { min: 4311,  max: 21556, fundMin: 2200,  fundMax: 21556 },
    '山西':   { min: 4480,  max: 22400, fundMin: 2150,  fundMax: 22400 },
    '内蒙古': { min: 4538,  max: 22689, fundMin: 2180,  fundMax: 22689 },
    '辽宁':   { min: 4359,  max: 21792, fundMin: 2230,  fundMax: 22875 },
    '吉林':   { min: 4436,  max: 22180, fundMin: 2020,  fundMax: 22180 },
    '黑龙江': { min: 4623,  max: 23115, fundMin: 2080,  fundMax: 23115 },
    '上海':   { min: 7460,  max: 37302, fundMin: 2690,  fundMax: 37302 },
    '江苏':   { min: 4952,  max: 24762, fundMin: 2260,  fundMax: 41400 },
    '浙江':   { min: 4986,  max: 25299, fundMin: 2490,  fundMax: 40694 },
    '安徽':   { min: 4311,  max: 21556, fundMin: 2320,  fundMax: 31564 },
    '福建':   { min: 4043,  max: 22607, fundMin: 2100,  fundMax: 22607 },
    '江西':   { min: 3915,  max: 19575, fundMin: 2000,  fundMax: 19575 },
    '山东':   { min: 4952,  max: 24762, fundMin: 2200,  fundMax: 24762 },
    '河南':   { min: 4382,  max: 21910, fundMin: 2200,  fundMax: 21910 },
    '湖北':   { min: 4500,  max: 22500, fundMin: 2210,  fundMax: 34560 },
    '湖南':   { min: 4480,  max: 22400, fundMin: 2100,  fundMax: 22400 },
    '广东':   { min: 4775,  max: 23875, fundMin: 2500,  fundMax: 39828 },
    '广西':   { min: 4245,  max: 21225, fundMin: 2000,  fundMax: 21225 },
    '海南':   { min: 4428,  max: 22140, fundMin: 2010,  fundMax: 22140 },
    '重庆':   { min: 4450,  max: 22250, fundMin: 2200,  fundMax: 22250 },
    '四川':   { min: 4350,  max: 21750, fundMin: 2170,  fundMax: 22938 },
    '贵州':   { min: 4260,  max: 21300, fundMin: 2130,  fundMax: 21300 },
    '云南':   { min: 4428,  max: 22140, fundMin: 2020,  fundMax: 22140 },
    '西藏':   { min: 4750,  max: 23750, fundMin: 2180,  fundMax: 23750 },
    '陕西':   { min: 4382,  max: 21910, fundMin: 2200,  fundMax: 21910 },
    '甘肃':   { min: 4610,  max: 22014, fundMin: 2120,  fundMax: 22014 },
    '青海':   { min: 4538,  max: 22689, fundMin: 2100,  fundMax: 22689 },
    '宁夏':   { min: 4480,  max: 22400, fundMin: 2100,  fundMax: 22400 },
    '新疆':   { min: 4575,  max: 22875, fundMin: 2100,  fundMax: 22875 }
  },

  provinceRates: {
    '北京':   { pension:[16,8], medical:[9.8,2], unemployment:[0.5,0.5], medicalFixed:3, medicalNote:'个人另+3元/月大病统筹' },
    '天津':   { pension:[16,8], medical:[9,2],   unemployment:[0.5,0.5] },
    '河北':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '山西':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '内蒙古': { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '辽宁':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '吉林':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '黑龙江': { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '上海':   { pension:[16,8], medical:[10,2],  unemployment:[0.5,0.5], fundMaxRatio:7 },
    '江苏':   { pension:[16,8], medical:[7.8,2], unemployment:[0.5,0.5] },
    '浙江':   { pension:[14,8], medical:[9.5,2], unemployment:[0.5,0.5], medicalNote:'养老单位14%（浙江试点）' },
    '安徽':   { pension:[16,8], medical:[6.4,2], unemployment:[0.5,0.5] },
    '福建':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '江西':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '山东':   { pension:[16,8], medical:[8.5,2], unemployment:[0.5,0.5] },
    '河南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '湖北':   { pension:[16,8], medical:[8,2],   unemployment:[0.7,0.3], maternityEmployer:0.7, medicalNote:'生育0.7%另计+大病7元个人' },
    '湖南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '广东':   { pension:[16,8], medical:[8,2],   unemployment:[0.8,0.2] },
    '广西':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '海南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '重庆':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '四川':   { pension:[16,8], medical:[8.7,2], unemployment:[0.6,0.4], medicalNote:'含大病补充0.75%' },
    '贵州':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '云南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '西藏':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '陕西':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '甘肃':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '青海':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '宁夏':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '新疆':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] }
  },

  // 只存放已实测或有官方公开文件可核验的具体地区；未列出的省份自动使用省级参考项。
  regionGroups: {
    '安徽': {
      defaultRegion: 'hefei-urban',
      medicalAidAllowed: true,
      regions: [
        { id:'hefei-urban', label:'合肥市区', status:'measured', effectivePeriod:'2026年度', fund:{ min:2320, max:31564 } },
        { id:'hefei-counties', label:'合肥县市（肥东、肥西、长丰、庐江、巢湖）', status:'measured', effectivePeriod:'2026年度', fund:{ min:2100, max:31564 } },
        { id:'luan-urban', label:'六安市区', status:'measured', effectivePeriod:'2026年度', fund:{ min:2170, max:25945 } },
        { id:'luan-counties', label:'六安县区（霍邱、金寨、霍山、舒城、叶集）', status:'measured', effectivePeriod:'2026年度', fund:{ min:2100, max:25945 } }
      ]
    },
    '江苏': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'江苏省级常见口径（参考）', status:'reference' },
        { id:'nanjing', label:'南京市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2660, max:42400 }, source:'https://gjj.nanjing.gov.cn/zwgk/tzgg/202607/t20260717_5878580.html' },
        { id:'suzhou', label:'苏州市（一般单位）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:4952, max:40600 }, note:'公积金下限一般按社保最低基数；实际工资较低且经核准的，不低于当地最低工资标准', source:'https://www.suzhou.gov.cn/szsrmzf/zwgg/202607/501539493f89439aa33768e34a069914.shtml' }
      ]
    },
    '山东': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'山东省级常见口径（参考）', status:'reference' },
        { id:'jinan-urban', label:'济南市区（历下、市中、槐荫、天桥、历城）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:33902 }, source:'https://gjj.jinan.gov.cn/col/col111465/art/2026/art_1df4b8a8b2604fd185a8e9130c55a5ba.html' },
        { id:'jinan-counties', label:'济南其他区县（长清、章丘、济阳、莱芜、钢城、平阴、商河）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:33902 }, source:'https://gjj.jinan.gov.cn/col/col111465/art/2026/art_1df4b8a8b2604fd185a8e9130c55a5ba.html' },
        { id:'qingdao-urban', label:'青岛市区（含即墨区）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:34342.75 }, source:'https://www.qingdao.gov.cn/zwgk/zdgk/fgwj/zcwj/szbmgw/202607/t20260706_10652620.shtml' },
        { id:'qingdao-counties', label:'青岛胶州、平度、莱西', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:34342.75 }, source:'https://www.qingdao.gov.cn/zwgk/zdgk/fgwj/zcwj/szbmgw/202607/t20260706_10652620.shtml' }
      ]
    }
  }
};

root.SOCIAL_POLICY_DATA = data;
if (typeof module !== 'undefined' && module.exports) module.exports = data;

})(typeof window !== 'undefined' ? window : globalThis);
