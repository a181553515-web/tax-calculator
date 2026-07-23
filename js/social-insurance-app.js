(function initSocialInsuranceApp() {
  'use strict';

  const Engine = window.SocialPolicyEngine;
  const policyData = window.SocialPolicyData;
  if (!Engine || !policyData) return;

  const main = document.querySelector('main');
  if (!main) return;
  let currentResult = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function input(id, label, required) {
    return '<div class="form-group">' +
      '<label class="form-label" for="' + id + '">' + escapeHtml(label) + (required ? ' <span class="manual-required">必填</span>' : '') + '</label>' +
      '<input class="form-input" type="text" inputmode="decimal" id="' + id + '" placeholder="元/月或百分比">' +
    '</div>';
  }

  function renderApp() {
    const options = ['<option value="">请选择参保地区或测算模式</option>'].concat(policyData.policies.map(function policyOption(policy) {
      const suffix = policy.status === 'manual' ? '手工测算' : policy.status === 'reference' ? '资料参考，暂不可计算' : '已核验';
      return '<option value="' + escapeHtml(policy.id) + '">' + escapeHtml(policy.label) + ' · ' + suffix + '</option>';
    }));

    main.innerHTML = '' +
      '<section class="policy-notice" aria-label="数据与隐私说明"><strong>审核版说明：</strong>只有已核验的统筹区数据才会自动计算。你的工资、地区和结果仅在当前浏览器计算，不会上传。</section>' +
      '<div class="card fade-in">' +
        '<div class="card-header">📍 参保地与工资 <span class="card-header-badge">政策可追溯</span></div>' +
        '<div class="form-group"><label class="form-label" for="siPolicy">参保地区 / 测算模式</label><select class="form-select" id="siPolicy">' + options.join('') + '</select></div>' +
        '<div id="policyStatus" class="policy-status" aria-live="polite">请选择地区后查看政策状态。</div>' +
        '<div class="form-group"><label class="form-label" for="siSalary">缴费工资 <span class="unit">元/月</span></label><input class="form-input" type="text" id="siSalary" inputmode="decimal" placeholder="按当地规则确认的缴费工资"></div>' +
        '<details id="manualPolicyPanel" class="manual-policy" style="display:none"><summary>按当地通知手工录入政策参数</summary><p class="card-hint">仅在你已确认当地统筹区口径时使用。所有必填项都需要填写，结果会标注为“未核验”。</p>' +
          '<div class="form-row">' + input('siBaseMin', '社保基数下限', true) + input('siBaseMax', '社保基数上限', true) + '</div>' +
          '<div class="form-row">' + input('fundBaseMin', '公积金基数下限', true) + input('fundBaseMax', '公积金基数上限', true) + '</div>' +
          '<div class="form-row">' + input('pensionEmployerRate', '养老单位比例（%）', true) + input('pensionPersonalRate', '养老个人比例（%）', true) + '</div>' +
          '<div class="form-row">' + input('medicalEmployerRate', '医疗单位比例（%）', true) + input('medicalPersonalRate', '医疗个人比例（%）', true) + '</div>' +
          '<div class="form-row">' + input('unemploymentEmployerRate', '失业单位比例（%）', true) + input('unemploymentPersonalRate', '失业个人比例（%）', true) + '</div>' +
          '<div class="form-row">' + input('injuryEmployerRate', '工伤单位比例（%）', true) + input('maternityEmployerRate', '生育单位比例（%）', false) + '</div>' +
          '<div class="form-row">' + input('longTermCareEmployerRate', '长护险单位比例（%）', false) + input('longTermCarePersonalRate', '长护险个人比例（%）', false) + '</div>' +
          '<div class="form-row">' + input('medicalFixedEmployer', '单位固定附加（元）', false) + input('medicalFixedPersonal', '个人固定附加（元）', false) + '</div>' +
        '</details>' +
        '<div class="toggle-row"><span class="toggle-label">🏠 住房公积金</span><label class="toggle"><input type="checkbox" id="siFundEnabled"><span class="toggle-track"></span><span class="toggle-thumb"></span></label></div>' +
        '<div class="form-group" id="siFundSettings" style="display:none"><label class="form-label" for="siFundRatio">公积金比例</label><input class="form-input" type="text" id="siFundRatio" inputmode="decimal" placeholder="例如：12"></div>' +
        '<div class="toggle-row"><span class="toggle-label">🩺 计入长期护理险</span><label class="toggle"><input type="checkbox" id="siLongTermCare"><span class="toggle-track"></span><span class="toggle-thumb"></span></label></div>' +
        '<div class="button-row"><button type="button" class="btn-primary" id="siCalculate">开始测算</button><button type="button" class="btn-reset" id="siReset">清空</button></div>' +
      '</div>' +
      '<div class="base-info" id="siBaseInfo" style="display:none"><span id="siBaseText"></span></div>' +
      '<div class="card fade-in" id="resultCard" style="display:none"><div class="card-header">📊 缴费明细</div><div class="card-body" id="siResult"></div></div>';
  }

  function selectedPolicy() {
    const id = document.getElementById('siPolicy').value;
    return policyData.policies.find(function findPolicy(policy) { return policy.id === id; }) || null;
  }

  function manualInputValues() {
    const values = {};
    document.querySelectorAll('#manualPolicyPanel input').forEach(function readInput(element) {
      values[element.id] = element.value;
    });
    values.fundRatio = document.getElementById('siFundRatio').value;
    return values;
  }

  function renderPolicyStatus(policy) {
    const container = document.getElementById('policyStatus');
    const panel = document.getElementById('manualPolicyPanel');
    const resultCard = document.getElementById('resultCard');
    const baseInfo = document.getElementById('siBaseInfo');
    currentResult = null;
    resultCard.style.display = 'none';
    baseInfo.style.display = 'none';
    panel.style.display = policy && policy.status === 'manual' ? 'block' : 'none';
    if (!policy) {
      container.textContent = '请选择地区后查看政策状态。';
      return;
    }
    const availability = Engine.getPolicyAvailability(policy, new Date());
    const source = policy.sources[0];
    if (policy.status === 'manual') {
      container.innerHTML = '<strong>手工测算模式</strong><br>' + escapeHtml(policy.scope);
      return;
    }
    if (policy.calculation && policy.calculation.fund) document.getElementById('siFundRatio').value = policy.calculation.fund.defaultRatio;
    container.innerHTML = '<strong>' + escapeHtml(policy.label) + '</strong><br>' +
      escapeHtml(availability.reason || '该地区数据已核验。') + '<br>' +
      '适用期：' + escapeHtml(policy.effectiveFrom) + ' 至 ' + escapeHtml(policy.effectiveTo) + '<br>' +
      (source ? '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener">查看官方依据：' + escapeHtml(source.title) + '</a>' : '');
  }

  function buildRows(result) {
    const rows = [];
    function add(label, employerRate, employerAmount, personalRate, personalAmount) {
      if (employerAmount === 0 && personalAmount === 0) return;
      rows.push('<tr><td>' + label + '</td><td>' + employerRate + '</td><td>¥' + money(employerAmount) + '</td><td>' + personalRate + '</td><td>' + (personalAmount ? '¥' + money(personalAmount) : '<span class="si-cell--na">不缴</span>') + '</td><td><strong>¥' + money(employerAmount + personalAmount) + '</strong></td></tr>');
    }
    const rates = result.rates;
    const rate = function getRate(key, side) { return rates[key][side] + '%'; };
    add('养老保险', rate('pension', 'employer'), result.pensionEmployer, rate('pension', 'personal'), result.pensionPersonal);
    add('医疗保险', rate('medical', 'employer'), result.medicalEmployer, rate('medical', 'personal'), result.medicalPersonal);
    add('失业保险', rate('unemployment', 'employer'), result.unemploymentEmployer, rate('unemployment', 'personal'), result.unemploymentPersonal);
    add('工伤保险', result.injuryEmployerRate + '%', result.injuryEmployer, '—', 0);
    add('生育保险', rate('maternity', 'employer'), result.maternityEmployer, '—', 0);
    add('长期护理险', rate('longTermCare', 'employer'), result.longTermCareEmployer, rate('longTermCare', 'personal'), result.longTermCarePersonal);
    add('固定附加项目', '固定金额', result.medicalFixedEmployer, '固定金额', result.medicalFixedPersonal);
    if (result.fundEnabled) add('住房公积金', result.fundRatio + '%', result.fundEmployer, result.fundRatio + '%', result.fundPersonal);
    return rows.join('');
  }

  function renderResult(result) {
    const sourceLine = result.policy.sourceUrl
      ? '<a href="' + escapeHtml(result.policy.sourceUrl) + '" target="_blank" rel="noopener">政策依据：' + escapeHtml(result.policy.sourceTitle) + '</a>'
      : '政策依据：用户手工录入参数，未经小波财税核验';
    document.getElementById('siBaseText').innerHTML = '<strong>社保缴费基数 ¥' + money(result.siBase) + '</strong>　公积金基数 ¥' + money(result.fundBase);
    document.getElementById('siBaseInfo').style.display = 'flex';
    document.getElementById('siResult').innerHTML = '<div class="result-notes"><strong>' + escapeHtml(result.policy.label) + '</strong><br>' +
      escapeHtml(result.policy.scope) + '<br>有效期：' + escapeHtml(result.policy.effectiveFrom) + ' 至 ' + escapeHtml(result.policy.effectiveTo) + '｜复核：' + escapeHtml(result.policy.reviewedBy) + '（' + escapeHtml(result.policy.reviewedAt) + '）<br>' + sourceLine + '</div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>险种</th><th>单位比例</th><th>单位月缴</th><th>个人比例</th><th>个人月缴</th><th>合计</th></tr></thead><tbody>' + buildRows(result) +
      '<tr class="si-row--total"><td><strong>五险一金合计</strong></td><td>—</td><td><strong>¥' + money(result.employerTotal) + '</strong></td><td>—</td><td><strong>¥' + money(result.personalTotal) + '</strong></td><td><strong>¥' + money(result.employerTotal + result.personalTotal) + '</strong></td></tr>' +
      '</tbody></table></div>' +
      '<div class="summary-grid"><div class="summary-card"><div class="summary-card__label">💰 ' + result.afterSocialInsuranceLabel + '</div><div class="summary-card__amount">¥' + money(result.afterSocialInsuranceSalary) + '</div><div class="summary-card__sub">税前工资 ' + money(result.salary) + ' − 个人五险一金 ' + money(result.personalTotal) + '</div></div>' +
      '<div class="summary-card"><div class="summary-card__label">🏢 企业用工成本（未含个税）</div><div class="summary-card__amount">¥' + money(result.companyCost) + '</div><div class="summary-card__sub">工资 ' + money(result.salary) + ' + 单位五险一金 ' + money(result.employerTotal) + '</div></div></div>' +
      '<button type="button" class="btn-primary tax-link" id="continueToTax">继续计算个人所得税</button>';
    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('continueToTax').addEventListener('click', function goToTax() {
      sessionStorage.setItem('xiaoboTax.socialToIncomeTax', JSON.stringify({
        salary: result.salary,
        specialDeduction: result.personalTotal,
        createdAt: new Date().toISOString(),
      }));
      window.location.href = './';
    });
  }

  function calculate() {
    const selected = selectedPolicy();
    const policy = selected && selected.status === 'manual' ? Engine.createManualPolicy(manualInputValues()) : selected;
    const salary = document.getElementById('siSalary').value;
    if (!policy) {
      renderPolicyStatus(null);
      return;
    }
    try {
      const fundEnabled = document.getElementById('siFundEnabled').checked;
      const fundRatio = document.getElementById('siFundRatio').value;
      if (fundEnabled && !String(fundRatio).trim()) throw new Error('已选择住房公积金，请填写当地适用的缴存比例。');
      const result = Engine.calculateSocialInsurance(policy, salary, {
        fundEnabled,
        fundRatio,
        longTermCareEnabled: document.getElementById('siLongTermCare').checked,
      });
      currentResult = result;
      renderResult(result);
    } catch (error) {
      const container = document.getElementById('policyStatus');
      container.innerHTML = '<strong>暂不能计算</strong><br>' + escapeHtml(error.message);
      document.getElementById('resultCard').style.display = 'none';
      document.getElementById('siBaseInfo').style.display = 'none';
    }
  }

  function reset() {
    document.querySelectorAll('input').forEach(function clearInput(element) {
      if (element.type === 'checkbox') element.checked = false;
      else element.value = '';
    });
    document.getElementById('siPolicy').value = '';
    document.getElementById('siFundSettings').style.display = 'none';
    renderPolicyStatus(null);
  }

  renderApp();
  document.getElementById('siPolicy').addEventListener('change', function onPolicyChange() { renderPolicyStatus(selectedPolicy()); });
  document.getElementById('siFundEnabled').addEventListener('change', function onFundChange(event) { document.getElementById('siFundSettings').style.display = event.target.checked ? 'block' : 'none'; });
  document.getElementById('siCalculate').addEventListener('click', calculate);
  document.getElementById('siReset').addEventListener('click', reset);
})();
