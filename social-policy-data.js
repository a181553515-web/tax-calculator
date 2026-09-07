(function(root) {
'use strict';

var data = {
  version: '2026-09-04',
  reviewedAt: '2026-08-20',

  // 国家八类工伤保险行业基准费率。各省可通过 injuryRates 覆盖。
  defaultInjuryRates: [0.2, 0.4, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9],
  defaultInjurySource: 'https://dghrss.dg.gov.cn/attachment/cmsfile/007330096/020105/201510/daofile/035733861444381862265.pdf',

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
    '安徽':   { min: 4354,  max: 21772, fundMin: 2320,  fundMax: 31564 },
    '福建':   { min: 4043,  max: 22607, medicalMin: 4579, medicalMax: 22893, fundMin: 2100,  fundMax: 22607 },
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
    '上海':   { pension:[16,8], medical:[9,2],   unemployment:[0.5,0.5], fundMaxRatio:7, medicalNote:'2026年3月起单位医保（含生育及地方附加）合计9%' },
    '江苏':   { pension:[16,8], medical:[7.8,2], unemployment:[0.5,0.5] },
    '浙江':   { pension:[16,8], medical:[9.5,2], unemployment:[0.5,0.5], medicalNote:'医保费率按杭州等地区常见口径估算' },
    '安徽':   { pension:[16,8], medical:[6.4,2], unemployment:[0.5,0.5] },
    '福建':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '江西':   { pension:[16,8], medical:[6.8,2], unemployment:[0.5,0.5], medicalNote:'医保含生育按南昌、赣州常见口径估算' },
    '山东':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5], medicalNote:'医保含生育按济南、青岛常见口径估算' },
    '河南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '湖北':   { pension:[16,8], medical:[8,2],   unemployment:[0.7,0.3], maternityEmployer:0.7, medicalNote:'生育0.7%另计+大病7元个人' },
    '湖南':   { pension:[16,8], medical:[8,2],   unemployment:[0.5,0.5] },
    '广东':   { pension:[16,8], medical:[8,2],   unemployment:[0.8,0.2], injuryRates:[0.2,0.4,0.6,0.8,0.9,1.0,1.2,1.4], injurySource:'https://hrss.gd.gov.cn/zcfg/zcfgk/content/post_3269010.html', medicalNote:'省级项仅作兜底，广州、深圳请选择具体城市' },
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
      reviewedAt: '2026-09-04',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      baseSource: 'https://hrss.ah.gov.cn/public/6595721/80811450.html',
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
        { id:'suzhou', label:'苏州市（一般单位）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:4952, max:40600 }, rates:{ medical:[7,2], maternityEmployer:0.8, medicalFixed:5, medicalNote:'职工医保单位7%、个人2%，生育单位0.8%，个人另缴大额医疗5元/月' }, note:'公积金下限一般按社保最低基数；实际工资较低且经核准的，不低于当地最低工资标准', source:'https://www.suzhou.gov.cn/szsrmzf/zwgg/202607/501539493f89439aa33768e34a069914.shtml', rateSource:'https://jiangsu.chinatax.gov.cn/art/2026/4/14/art_21737_921.html' },
        { id:'changzhou', label:'常州市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2660, max:34080 }, source:'https://gjj.changzhou.gov.cn/content/suitable/show?catid=142&id=13974' },
        { id:'lianyungang', label:'连云港市', status:'verified', effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', fund:{ min:2260, max:31545 }, source:'https://www.lyg.gov.cn/zglygzfmhwz/xwfbh/content/5a72f436-44c0-4f27-9b9d-f5c6be51dace.shtml' },
        { id:'taizhou-urban', label:'泰州市区（海陵、姜堰、医药高新区〔高港〕）', status:'verified', effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', fund:{ min:2660, max:30258 }, source:'https://gjj.taizhou.gov.cn/xwzx/tzgg/art/2026/art_0d3c5588297a49238c3c81696f195096.html' },
        { id:'taizhou-counties', label:'泰州靖江、泰兴、兴化', status:'verified', effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', fund:{ min:2430, max:30258 }, source:'https://gjj.taizhou.gov.cn/xwzx/tzgg/art/2026/art_0d3c5588297a49238c3c81696f195096.html' },
        { id:'yancheng-main', label:'盐城市区、大丰、东台', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2260, max:31314 }, note:'含市直、亭湖、盐都、开发区、盐南高新区', source:'https://ycgjj.yancheng.gov.cn/art/2026/7/24/art_6592_4441692.html' },
        { id:'yancheng-counties', label:'盐城建湖、射阳、阜宁、滨海、响水', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2010, max:31314 }, source:'https://ycgjj.yancheng.gov.cn/art/2026/7/24/art_6592_4441692.html' }
      ]
    },
    '浙江': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'浙江省级常见口径（参考）', status:'reference' },
        { id:'ningbo-urban', label:'宁波市区（海曙、江北、镇海、北仑、鄞州、奉化）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2660, max:38907 }, note:'上限暂按2025年度38907元执行，官方公布新标准后需更新', source:'https://www.haishu.gov.cn/col/col1229100020/art/2026/art_ed8daf35d53e482893accae0bcb57abd.html' },
        { id:'ningbo-counties', label:'宁波余姚、慈溪、宁海、象山', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2430, max:38907 }, note:'上限暂按2025年度38907元执行，官方公布新标准后需更新', source:'https://www.haishu.gov.cn/col/col1229100020/art/2026/art_ed8daf35d53e482893accae0bcb57abd.html' }
      ]
    },
    '福建': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'福建省级常见口径（参考）', status:'reference' },
        { id:'fuzhou', label:'福州市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2195, max:32430 }, source:'https://zfgjj.fuzhou.gov.cn/zwgk/gzdt/tzgg/202606/t20260630_5341026.htm' },
        { id:'quanzhou-main', label:'泉州市区、石狮、晋江、南安、惠安', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2195, max:24795 }, note:'含鲤城、丰泽、洛江、泉港及台商投资区', source:'https://qzgjj.quanzhou.gov.cn/zwgk/fgwj/zcjd/202606/t20260629_3304596.htm' },
        { id:'quanzhou-counties', label:'泉州安溪、永春、德化', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2045, max:24795 }, source:'https://qzgjj.quanzhou.gov.cn/zwgk/fgwj/zcjd/202606/t20260629_3304596.htm' },
        { id:'sanming', label:'三明市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:1895, max:26810 }, source:'https://www.sm.gov.cn/zw/ztzl/smszfgjjzt/zcfg_21865/dfxzcfg/202606/t20260625_2231863.htm' }
      ]
    },
    '江西': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'江西省级常见口径（参考）', status:'reference' },
        { id:'nanchang', label:'南昌市', status:'verified', effectiveFrom:'2026-04-01', rates:{ medical:[6.8,2], injurySupplementEmployerFactor:0.3, medicalNote:'职工医保含生育单位6.8%、个人2%；补充工伤按行业基准费率的30%另计' }, note:'补充工伤保险随工伤保险一并测算', source:'https://www.nc.gov.cn/ncszf/ncsgfxwj/202604/71b7a78c36df4b1a83ba5b5320b6a1ea.shtml', rateSource:'https://ybj.nc.gov.cn/ncylbzj/jytagk/202511/73ad6df0be184096bdbad4565bfde7fc.shtml' },
        { id:'ganzhou', label:'赣州市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:1950, max:24304 }, source:'https://zfgjj.ganzhou.gov.cn/gzszfjj/c103430/202607/616e6f447b994708997219f5e2e1748f.shtml' }
      ]
    },
    '山东': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'山东省级常见口径（参考）', status:'reference' },
        { id:'jinan-urban', label:'济南市区（历下、市中、槐荫、天桥、历城）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:33902 }, source:'https://gjj.jinan.gov.cn/col/col111465/art/2026/art_1df4b8a8b2604fd185a8e9130c55a5ba.html' },
        { id:'jinan-counties', label:'济南其他区县（长清、章丘、济阳、莱芜、钢城、平阴、商河）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:33902 }, source:'https://gjj.jinan.gov.cn/col/col111465/art/2026/art_1df4b8a8b2604fd185a8e9130c55a5ba.html' },
        { id:'qingdao-urban', label:'青岛市区（含即墨区）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:34342.75 }, source:'https://www.qingdao.gov.cn/zwgk/zdgk/fgwj/zcwj/szbmgw/202607/t20260706_10652620.shtml' },
        { id:'qingdao-counties', label:'青岛胶州、平度、莱西', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:34342.75 }, source:'https://www.qingdao.gov.cn/zwgk/zdgk/fgwj/zcwj/szbmgw/202607/t20260706_10652620.shtml' },
        { id:'zibo-tier-one', label:'淄博张店、淄川、临淄、高新区、经开区', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:26736.5 }, source:'https://zfgjj.zibo.gov.cn/art/2026/7/7/art_448_3009603.html' },
        { id:'zibo-tier-two', label:'淄博博山、周村、桓台', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:26736.5 }, source:'https://zfgjj.zibo.gov.cn/art/2026/7/7/art_448_3009603.html' },
        { id:'zibo-tier-three', label:'淄博高青、沂源', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2020, max:26736.5 }, source:'https://zfgjj.zibo.gov.cn/art/2026/7/7/art_448_3009603.html' },
        { id:'yantai-main', label:'烟台市直及其他区市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:28692 }, source:'https://gjj.yantai.gov.cn/col/col4103/art/2026/art_657f50be3e25423a8574676332528ac8.html' },
        { id:'yantai-counties', label:'烟台莱阳、栖霞、海阳', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:28692 }, source:'https://gjj.yantai.gov.cn/col/col4103/art/2026/art_657f50be3e25423a8574676332528ac8.html' },
        { id:'taian-tier-one', label:'泰安泰山、新泰、肥城', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:23809 }, source:'https://gjjzx.taian.gov.cn/art/2026/6/30/art_45724_10296492.html' },
        { id:'taian-tier-two', label:'泰安岱岳、宁阳、东平', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2020, max:23809 }, source:'https://gjjzx.taian.gov.cn/art/2026/6/30/art_45724_10296492.html' },
        { id:'weihai', label:'威海市', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2400, max:24950 }, source:'https://www.weihai.gov.cn/art/2026/7/10/art_58820_6474088.html' },
        { id:'linyi-urban', label:'临沂市区（兰山、罗庄、河东、市直、沂河新区）', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2210, max:25484 }, source:'https://gjj.linyi.gov.cn/info/1142/9241.htm' },
        { id:'linyi-counties', label:'临沂其他九县', status:'verified', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', fund:{ min:2020, max:25484 }, note:'沂南、郯城、沂水、兰陵、费县、平邑、莒南、蒙阴、临沭', source:'https://gjj.linyi.gov.cn/info/1142/9241.htm' }
      ]
    },
    '广东': {
      defaultRegion: 'province-reference',
      regions: [
        { id:'province-reference', label:'广东省级常见口径（参考）', status:'reference' },
        { id:'guangzhou', label:'广州市', status:'verified', effectiveFrom:'2022-12-01', effectiveTo:'2026-12-31', rates:{ medical:[6,2], maternityEmployer:0.85, medicalNote:'广州职工医保单位6%、个人2%，生育保险单位0.85%' }, source:'https://www.gz.gov.cn/gfxwj/sbmgfxwj/gzsylbzj/content/mpost_8689834.html' },
        { id:'shenzhen', label:'深圳市（职工医保一档）', status:'verified', effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31', bases:{ medical:{ min:6727, max:33633 } }, rates:{ medical:[6,2], maternityEmployer:0.5, medicalNote:'深圳职工医保一档单位6%、个人2%，生育保险单位0.5%；医保使用独立缴费基数' }, source:'https://hsa.sz.gov.cn/fzlm/znts/cnyc/content/post_12568243.html' }
      ]
    }
  }
};

root.SOCIAL_POLICY_DATA = data;
if (typeof module !== 'undefined' && module.exports) module.exports = data;

})(typeof window !== 'undefined' ? window : globalThis);
