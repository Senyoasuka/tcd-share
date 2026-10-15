(() => {
  "use strict";

  const STORAGE_KEY = "tcd_client_service_workbench_v1";
  const ACTION_LABELS = { buy: "买入", add: "加仓", sell: "卖出", reduce: "减仓", sell_all: "清仓", hold: "继续持有" };
  const RESPONSE_LABELS = { followed: "全部执行", partial: "部分执行", ignored: "未执行" };
  const TYPE_LABELS = { daily: "日常跟踪", risk: "风险提醒", position: "持仓建议", review: "阶段复盘", education: "投教服务" };
  const CHANNEL_LABELS = { wechat: "企业微信", phone: "电话", meeting: "面谈", message: "短信", other: "其他" };
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const number = (value, fallback = 0) => {
    const parsed = Number(String(value ?? "").replace(/[,，%￥¥元股]/g, "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const optionalNumber = (value) => {
    if (value == null || String(value).trim() === "") return null;
    const parsed = number(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const code = (value) => String(value ?? "").match(/\d{6}/)?.[0] || "";
  const text = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const formatMoney = (value, digits = 2) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "暂无";
    return new Intl.NumberFormat("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  };
  const formatCurrency = (value) => `¥${formatMoney(value)}`;
  const formatPercent = (value) => `${number(value).toFixed(2)}%`;
  const toneClass = (value) => number(value) > 0 ? "positive" : number(value) < 0 ? "negative" : "";
  const firstChar = (name) => text(name).slice(0, 1) || "客";
  const normalizeDate = (value) => {
    const raw = text(value);
    if (!raw) return today();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? today() : parsed.toISOString().slice(0, 10);
  };

  function demoState() {
    return {
      currentCustomerId: "C2026092801",
      customers: [{
        id: "C2026092801",
        name: "陈先生",
        phone: "138****2761",
        risk_level: "C4 成长型",
        assets: 865000,
        advisor: "示例客户经理",
        opened_at: "2026-07-18",
        notes: "示例数据。客户关注科技与资源方向，能接受一定波动，但执行经常延迟。",
        is_demo: true,
        holdings: [
          { code: "000801", name: "四川九洲", quantity: 12000, cost_price: 14.62, current_price: 15.18, updated_at: "2026-09-28" },
          { code: "600000", name: "浦发银行", quantity: 18000, cost_price: 10.54, current_price: 10.86, updated_at: "2026-09-28" },
          { code: "002371", name: "北方华创", quantity: 300, cost_price: 648.2, current_price: 636.4, updated_at: "2026-09-28" },
        ],
        services: [
          { id: "S-DEMO-1", date: "2026-09-10", type: "risk", channel: "wechat", code: "002371", name: "北方华创", action: "reduce", quantity: 200, advice_price: 662.5, current_price: 636.4, response: "ignored", executed_quantity: 0, note: "提示高位波动加大，建议降低集中度。" },
          { id: "S-DEMO-2", date: "2026-09-15", type: "position", channel: "phone", code: "600000", name: "浦发银行", action: "buy", quantity: 8000, advice_price: 10.42, current_price: 10.86, response: "partial", executed_quantity: 3000, note: "建议用低波动银行仓位平衡科技方向波动。" },
          { id: "S-DEMO-3", date: "2026-09-20", type: "position", channel: "wechat", code: "000801", name: "四川九洲", action: "buy", quantity: 5000, advice_price: 14.76, current_price: 15.18, response: "followed", executed_quantity: 5000, note: "回踩关键位后建议分批参与，并设置风险边界。" },
        ],
      }],
    };
  }

  function normalizeHolding(raw = {}) {
    return {
      code: code(raw.code ?? raw["股票代码"] ?? raw["证券代码"]),
      name: text(raw.name ?? raw.stock ?? raw["股票名称"] ?? raw["证券名称"]),
      quantity: Math.max(0, number(raw.quantity ?? raw["持仓数量"] ?? raw["证券数量"])),
      cost_price: Math.max(0, number(raw.cost_price ?? raw["成本价"] ?? raw["买入价"])),
      current_price: Math.max(0, number(raw.current_price ?? raw.latest_price ?? raw["最新价"] ?? raw["当前价"])),
      updated_at: normalizeDate(raw.updated_at ?? raw["更新时间"] ?? today()),
    };
  }

  function normalizeService(raw = {}) {
    const actionMap = { "买入": "buy", "加仓": "add", "卖出": "sell", "减仓": "reduce", "清仓": "sell_all", "继续持有": "hold", "持有": "hold" };
    const responseMap = { "全部执行": "followed", "已执行": "followed", "听取": "followed", "部分执行": "partial", "未执行": "ignored", "未听取": "ignored", "忽略": "ignored" };
    const typeMap = { "日常跟踪": "daily", "风险提醒": "risk", "持仓建议": "position", "阶段复盘": "review", "投教服务": "education" };
    const channelMap = { "企业微信": "wechat", "微信": "wechat", "电话": "phone", "面谈": "meeting", "短信": "message", "其他": "other" };
    const rawAction = text(raw.action ?? raw["建议动作"]);
    const rawResponse = text(raw.response ?? raw["客户反馈"]);
    const rawType = text(raw.type ?? raw["服务类型"]);
    const rawChannel = text(raw.channel ?? raw["渠道"]);
    return {
      id: text(raw.id ?? raw["记录编号"]) || uid("service"),
      date: normalizeDate(raw.date ?? raw["服务日期"]),
      type: TYPE_LABELS[rawType] ? rawType : typeMap[rawType] || "position",
      channel: CHANNEL_LABELS[rawChannel] ? rawChannel : channelMap[rawChannel] || "wechat",
      code: code(raw.code ?? raw["股票代码"] ?? raw["证券代码"]),
      name: text(raw.name ?? raw.stock ?? raw["股票名称"] ?? raw["证券名称"]),
      action: ACTION_LABELS[rawAction] ? rawAction : actionMap[rawAction] || "hold",
      quantity: Math.max(0, number(raw.quantity ?? raw["建议数量"])),
      advice_price: Math.max(0, number(raw.advice_price ?? raw["建议价格"])),
      current_price: Math.max(0, number(raw.current_price ?? raw["最新价格"] ?? raw["当前价格"])),
      response: RESPONSE_LABELS[rawResponse] ? rawResponse : responseMap[rawResponse] || "ignored",
      executed_quantity: Math.max(0, number(raw.executed_quantity ?? raw["实际执行数量"])),
      note: text(raw.note ?? raw["服务记录"] ?? raw["备注"]),
    };
  }

  function normalizeCustomer(raw = {}) {
    return {
      id: text(raw.id ?? raw.customer_id ?? raw["客户编号"]) || uid("customer"),
      name: text(raw.name ?? raw.customer_name ?? raw["客户姓名"]) || "未命名客户",
      phone: text(raw.phone ?? raw["手机号"]),
      risk_level: text(raw.risk_level ?? raw["风险等级"]) || "C3 平衡型",
      assets: Math.max(0, number(raw.assets ?? raw["总资产"])),
      advisor: text(raw.advisor ?? raw["客户经理"]),
      opened_at: normalizeDate(raw.opened_at ?? raw["建档日期"] ?? today()),
      notes: text(raw.notes ?? raw["客户备注"] ?? raw["备注"]),
      is_demo: Boolean(raw.is_demo),
      holdings: (Array.isArray(raw.holdings) ? raw.holdings : []).map(normalizeHolding).filter((item) => item.code || item.name),
      services: (Array.isArray(raw.services) ? raw.services : []).map(normalizeService),
    };
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored && Array.isArray(stored.customers)) {
        const customers = stored.customers.map(normalizeCustomer);
        return { currentCustomerId: stored.currentCustomerId || customers[0]?.id || "", customers };
      }
    } catch (error) {
      console.warn("client service state load failed", error);
    }
    return demoState();
  }

  let state = loadState();
  let chart = null;
  let editingCustomerId = "";
  const dom = {
    customerList: document.getElementById("customerList"),
    customerContent: document.getElementById("customerContent"),
    customerSearch: document.getElementById("customerSearch"),
    customerTotal: document.getElementById("customerTotal"),
    customerCount: document.getElementById("customerCount"),
    dataStatusText: document.getElementById("dataStatusText"),
    importFile: document.getElementById("importFile"),
    customerDialog: document.getElementById("customerDialog"),
    customerForm: document.getElementById("customerForm"),
    toast: document.getElementById("toast"),
  };

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateDataStatus();
  }

  function currentCustomer() {
    return state.customers.find((item) => item.id === state.currentCustomerId) || state.customers[0] || null;
  }

  function holdingFor(customer, service) {
    return customer.holdings.find((item) => (service.code && item.code === service.code) || (service.name && item.name === service.name));
  }

  function resolvedService(service, customer) {
    const holding = holdingFor(customer, service);
    const quantity = service.action === "sell_all" && !service.quantity ? number(holding?.quantity) : number(service.quantity);
    const currentPrice = number(service.current_price || holding?.current_price);
    const advicePrice = number(service.advice_price);
    let fullImpact = 0;
    if (["buy", "add"].includes(service.action)) fullImpact = (currentPrice - advicePrice) * quantity;
    if (["sell", "reduce", "sell_all"].includes(service.action)) fullImpact = (advicePrice - currentPrice) * quantity;
    let actualQuantity = 0;
    if (service.response === "followed") actualQuantity = quantity;
    if (service.response === "partial") actualQuantity = Math.min(quantity, number(service.executed_quantity));
    const actualImpact = quantity > 0 ? fullImpact * (actualQuantity / quantity) : 0;
    const notional = advicePrice * quantity;
    return { quantity, currentPrice, advicePrice, fullImpact, actualImpact, gap: fullImpact - actualImpact, notional, actualQuantity };
  }

  function customerMetrics(customer) {
    const holdingRows = customer.holdings.map((item) => {
      const marketValue = number(item.quantity) * number(item.current_price);
      const costValue = number(item.quantity) * number(item.cost_price);
      const pnl = marketValue - costValue;
      return { ...item, marketValue, costValue, pnl, returnPct: costValue ? pnl / costValue * 100 : 0 };
    });
    const holdingMarket = holdingRows.reduce((sum, item) => sum + item.marketValue, 0);
    const holdingCost = holdingRows.reduce((sum, item) => sum + item.costValue, 0);
    const holdingPnl = holdingRows.reduce((sum, item) => sum + item.pnl, 0);
    const holdingReturn = holdingCost ? holdingPnl / holdingCost * 100 : 0;
    const serviceRows = customer.services.map((item) => ({ ...item, impact: resolvedService(item, customer) }));
    const fullImpact = serviceRows.reduce((sum, item) => sum + item.impact.fullImpact, 0);
    const actualImpact = serviceRows.reduce((sum, item) => sum + item.impact.actualImpact, 0);
    const gap = fullImpact - actualImpact;
    const serviceNotional = serviceRows.reduce((sum, item) => sum + Math.abs(item.impact.notional), 0);
    return {
      holdingRows, holdingMarket, holdingCost, holdingPnl, holdingReturn,
      serviceRows, fullImpact, actualImpact, gap, serviceNotional,
      fullImpactPct: serviceNotional ? fullImpact / serviceNotional * 100 : 0,
      actualImpactPct: serviceNotional ? actualImpact / serviceNotional * 100 : 0,
      followedCount: serviceRows.filter((item) => item.response === "followed").length,
      partialCount: serviceRows.filter((item) => item.response === "partial").length,
      ignoredCount: serviceRows.filter((item) => item.response === "ignored").length,
    };
  }

  function updateDataStatus() {
    const demoCount = state.customers.filter((item) => item.is_demo).length;
    dom.customerTotal.textContent = String(state.customers.length);
    dom.customerCount.textContent = `${state.customers.length} 位`;
    dom.dataStatusText.textContent = state.customers.length
      ? `${state.customers.length} 位客户，${demoCount ? `${demoCount} 位示例客户，` : ""}数据已保存到当前浏览器。`
      : "暂无客户资料，请导入模板或新增客户。";
  }

  function renderCustomerList() {
    const keyword = text(dom.customerSearch.value).toLowerCase();
    const customers = state.customers.filter((item) => [item.name, item.id, item.phone].some((value) => text(value).toLowerCase().includes(keyword)));
    dom.customerList.innerHTML = customers.length ? customers.map((item) => {
      const metrics = customerMetrics(item);
      return `<button class="customer-item ${item.id === state.currentCustomerId ? "active" : ""}" type="button" data-customer-id="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.name)}</strong><b class="${toneClass(metrics.gap)}">${metrics.gap >= 0 ? "+" : ""}${formatMoney(metrics.gap, 0)}</b>
        <span>${escapeHtml(item.id)}　${escapeHtml(item.risk_level)}　${item.holdings.length} 只持仓</span>
      </button>`;
    }).join("") : `<div class="empty-state"><div><strong>没有匹配客户</strong><p>调整搜索条件，或导入新的客户资料。</p></div></div>`;
  }

  function renderHoldingRows(customer, metrics) {
    if (!metrics.holdingRows.length) return `<div class="empty-state"><div><strong>暂未导入持仓</strong><p>可以从 Excel 模板导入，也可以在下方手动增加一只持仓。</p></div></div>`;
    return `<div class="table-wrap"><table><thead><tr><th>股票</th><th>代码</th><th>数量</th><th>成本价</th><th>最新价</th><th>市值</th><th>浮盈亏</th><th>收益率</th><th>操作</th></tr></thead><tbody>
      ${metrics.holdingRows.map((item) => `<tr>
        <td data-label="股票"><strong>${escapeHtml(item.name || "未命名")}</strong><small>更新 ${escapeHtml(item.updated_at)}</small></td>
        <td data-label="代码">${escapeHtml(item.code || "暂无")}</td>
        <td data-label="数量">${formatMoney(item.quantity, 0)}</td>
        <td data-label="成本价">${formatCurrency(item.cost_price)}</td>
        <td data-label="最新价">${formatCurrency(item.current_price)}</td>
        <td data-label="市值">${formatCurrency(item.marketValue)}</td>
        <td data-label="浮盈亏" class="${toneClass(item.pnl)}">${item.pnl >= 0 ? "+" : ""}${formatCurrency(item.pnl)}</td>
        <td data-label="收益率" class="${toneClass(item.returnPct)}">${item.returnPct >= 0 ? "+" : ""}${formatPercent(item.returnPct)}</td>
        <td data-label="操作"><button class="btn small danger" type="button" data-delete-holding="${escapeHtml(item.code || item.name)}">删除</button></td>
      </tr>`).join("")}
    </tbody></table></div>`;
  }

  function serviceActionDescription(item) {
    const action = ACTION_LABELS[item.action] || item.action;
    if (item.action === "hold") return `${action}，不改变数量`;
    return `${action} ${formatMoney(item.impact.quantity, 0)} 股，建议价 ${formatCurrency(item.impact.advicePrice)}`;
  }

  function renderServiceRows(metrics) {
    if (!metrics.serviceRows.length) return `<div class="empty-state"><div><strong>还没有服务记录</strong><p>录入第一条建议后，工作台会立即计算实际执行与全部听取之间的差异。</p></div></div>`;
    return `<div class="service-list">${[...metrics.serviceRows].sort((a, b) => b.date.localeCompare(a.date)).map((item) => `<article class="service-row">
      <time>${escapeHtml(item.date)}<small>${escapeHtml(CHANNEL_LABELS[item.channel] || item.channel)}</small></time>
      <div class="service-security"><strong>${escapeHtml(item.name || "未命名标的")}</strong><span>${escapeHtml(item.code || "未提供代码")}　${escapeHtml(TYPE_LABELS[item.type] || item.type)}</span></div>
      <div class="service-detail"><b>${escapeHtml(serviceActionDescription(item))}</b><p>${escapeHtml(item.note || "未填写服务说明")}</p></div>
      <div class="service-impact"><span class="status-tag ${escapeHtml(item.response)}">${escapeHtml(RESPONSE_LABELS[item.response] || item.response)}</span><strong class="${toneClass(item.impact.gap)}">${item.impact.gap >= 0 ? "+" : ""}${formatCurrency(item.impact.gap)}</strong><small>未采纳差额</small></div>
      <div class="row-actions"><button class="btn small danger" type="button" data-delete-service="${escapeHtml(item.id)}">删除记录</button></div>
    </article>`).join("")}</div>`;
  }

  function renderContent() {
    const customer = currentCustomer();
    if (!customer) {
      dom.customerContent.innerHTML = `<section class="content-card empty-state"><div><strong>建立第一份客户档案</strong><p>下载模板后导入客户、持仓与服务记录，或点击左侧“新增客户”手工创建。</p><button class="btn primary" id="emptyAddCustomerBtn" type="button">新增客户</button></div></section>`;
      document.getElementById("emptyAddCustomerBtn")?.addEventListener("click", () => openCustomerDialog());
      if (chart) { chart.dispose(); chart = null; }
      return;
    }
    const metrics = customerMetrics(customer);
    dom.customerContent.innerHTML = `
      <section class="content-card">
        <div class="customer-summary">
          <div>
            <div class="customer-identity"><div class="customer-avatar">${escapeHtml(firstChar(customer.name))}</div><div><h2>${escapeHtml(customer.name)}${customer.is_demo ? "（示例）" : ""}</h2><div class="customer-meta"><span>编号 ${escapeHtml(customer.id)}</span><span>${escapeHtml(customer.phone || "未填写手机号")}</span><span>${escapeHtml(customer.risk_level)}</span><span>客户经理 ${escapeHtml(customer.advisor || "未分配")}</span><span>建档 ${escapeHtml(customer.opened_at)}</span></div></div></div>
            <p class="customer-notes">${escapeHtml(customer.notes || "暂无客户备注。")}</p>
          </div>
          <div class="summary-actions"><button class="btn" id="refreshQuotesBtn" type="button">刷新持仓行情</button><button class="btn" id="editCustomerBtn" type="button">编辑资料</button><button class="btn danger" id="deleteCustomerBtn" type="button">删除客户</button></div>
        </div>
        <div class="metrics">
          <article class="metric"><span>当前持仓市值</span><strong>${formatCurrency(metrics.holdingMarket)}</strong><small>${metrics.holdingRows.length} 只持仓，总资产字段 ${formatCurrency(customer.assets)}</small></article>
          <article class="metric"><span>当前持仓浮盈亏</span><strong class="${toneClass(metrics.holdingPnl)}">${metrics.holdingPnl >= 0 ? "+" : ""}${formatCurrency(metrics.holdingPnl)}</strong><small>按导入成本价与最新价计算，收益率 ${formatPercent(metrics.holdingReturn)}</small></article>
          <article class="metric emphasis"><span>如果全部听取</span><strong class="${toneClass(metrics.fullImpact)}">${metrics.fullImpact >= 0 ? "+" : ""}${formatCurrency(metrics.fullImpact)}</strong><small>建议对应数量全部按建议价执行后的模拟效果</small></article>
          <article class="metric"><span>未采纳机会差额</span><strong class="${toneClass(metrics.gap)}">${metrics.gap >= 0 ? "+" : ""}${formatCurrency(metrics.gap)}</strong><small>全部听取模拟效果减去客户实际执行效果</small></article>
        </div>
      </section>

      <section class="content-card">
        <div class="section-head"><div><h3>服务效果对比</h3><p>只统计已录入服务记录对应的数量，不与客户全部资产收益混算。</p></div><div class="section-actions"><span class="status-tag followed">执行 ${metrics.followedCount}</span><span class="status-tag partial">部分 ${metrics.partialCount}</span><span class="status-tag ignored">未执行 ${metrics.ignoredCount}</span></div></div>
        <div class="comparison-grid">
          <div class="comparison-visual"><div id="comparisonChart" role="img" aria-label="客户实际执行与全部听取的模拟效果对比图"></div></div>
          <div class="comparison-story">
            <article><span>客户实际执行效果</span><strong class="${toneClass(metrics.actualImpact)}">${metrics.actualImpact >= 0 ? "+" : ""}${formatCurrency(metrics.actualImpact)}</strong><p>按客户反馈与实际执行数量计算。</p></article>
            <article><span>全部听取模拟效果</span><strong class="${toneClass(metrics.fullImpact)}">${metrics.fullImpact >= 0 ? "+" : ""}${formatCurrency(metrics.fullImpact)}</strong><p>每条建议均按建议数量、建议价格执行，并按最新价估算。</p></article>
            <article><span>服务记录名义金额</span><strong>${formatCurrency(metrics.serviceNotional)}</strong><p>用于计算模拟收益率，非客户总资产。</p></article>
            <article><span>模拟收益率差</span><strong class="${toneClass(metrics.fullImpactPct - metrics.actualImpactPct)}">${formatPercent(metrics.fullImpactPct - metrics.actualImpactPct)}</strong><p>全部听取模拟收益率减去实际执行效果率。</p></article>
          </div>
        </div>
        <p class="disclosure">模拟口径：买入建议按“最新价减建议价”乘建议数量计算；卖出或减仓建议按“建议价减最新价”乘建议数量计算。结果未计佣金、印花税、滑点、停牌和无法成交等因素，不代表真实业绩或未来收益。</p>
      </section>

      <section class="content-card">
        <div class="section-head"><div><h3>客户当前持仓</h3><p>呈现客户当前实际持仓，不自动把建议模拟仓位写入真实持仓。</p></div><div class="section-actions"><button class="btn" id="toggleHoldingFormBtn" type="button">手动增加持仓</button></div></div>
        ${renderHoldingRows(customer, metrics)}
        <form class="form-panel hidden" id="holdingForm" style="margin-top:12px">
          <h4>增加或更新持仓</h4>
          <div class="form-grid">
            <div class="field"><label for="holdingCode">股票代码</label><input id="holdingCode" name="code" inputmode="numeric" maxlength="6" required></div>
            <div class="field"><label for="holdingName">股票名称</label><input id="holdingName" name="name" required></div>
            <div class="field"><label for="holdingQuantity">持仓数量</label><input id="holdingQuantity" name="quantity" type="number" min="0" step="1" required></div>
            <div class="field"><label for="holdingCost">成本价</label><input id="holdingCost" name="cost_price" type="number" min="0" step="0.001" required></div>
            <div class="field"><label for="holdingCurrent">最新价</label><input id="holdingCurrent" name="current_price" type="number" min="0" step="0.001" required></div>
            <div class="field"><label for="holdingUpdated">更新时间</label><input id="holdingUpdated" name="updated_at" type="date" value="${today()}" required></div>
          </div>
          <div class="form-footer"><button class="btn primary" type="submit">保存持仓</button></div>
        </form>
      </section>

      <section class="content-card">
        <div class="section-head"><div><h3>服务记录与执行对比</h3><p>每条记录保留建议动作、建议价、客户反馈和实际执行数量。</p></div></div>
        <div class="record-layout">
          <form class="form-panel" id="serviceForm">
            <h4>新增服务记录</h4>
            <div class="form-grid">
              <div class="field"><label for="serviceDate">服务日期</label><input id="serviceDate" name="date" type="date" value="${today()}" required></div>
              <div class="field"><label for="serviceType">服务类型</label><select id="serviceType" name="type">${Object.entries(TYPE_LABELS).map(([value,label]) => `<option value="${value}">${label}</option>`).join("")}</select></div>
              <div class="field"><label for="serviceChannel">沟通渠道</label><select id="serviceChannel" name="channel">${Object.entries(CHANNEL_LABELS).map(([value,label]) => `<option value="${value}">${label}</option>`).join("")}</select></div>
              <div class="field"><label for="serviceAction">建议动作</label><select id="serviceAction" name="action">${Object.entries(ACTION_LABELS).map(([value,label]) => `<option value="${value}">${label}</option>`).join("")}</select></div>
              <div class="field"><label for="serviceCode">股票代码</label><input id="serviceCode" name="code" inputmode="numeric" maxlength="6" required></div>
              <div class="field"><label for="serviceName">股票名称</label><input id="serviceName" name="name" required></div>
              <div class="field"><label for="serviceQuantity">建议数量</label><input id="serviceQuantity" name="quantity" type="number" min="0" step="1" required></div>
              <div class="field"><label for="serviceAdvicePrice">建议价格</label><input id="serviceAdvicePrice" name="advice_price" type="number" min="0" step="0.001" required></div>
              <div class="field"><label for="serviceCurrentPrice">最新价格</label><input id="serviceCurrentPrice" name="current_price" type="number" min="0" step="0.001" required></div>
              <div class="field"><label for="serviceResponse">客户反馈</label><select id="serviceResponse" name="response"><option value="followed">全部执行</option><option value="partial">部分执行</option><option value="ignored" selected>未执行</option></select></div>
              <div class="field"><label for="serviceExecuted">实际执行数量</label><input id="serviceExecuted" name="executed_quantity" type="number" min="0" step="1" value="0"><span class="help">全部执行会自动按建议数量计算</span></div>
              <div class="field full"><label for="serviceNote">服务记录</label><textarea id="serviceNote" name="note" placeholder="记录建议依据、风险提示及后续跟踪事项"></textarea></div>
            </div>
            <div class="form-footer"><button class="btn primary" type="submit">保存服务记录</button></div>
          </form>
          <div>${renderServiceRows(metrics)}</div>
        </div>
      </section>`;

    bindContentEvents(customer);
    renderChart(metrics);
  }

  function renderChart(metrics) {
    const container = document.getElementById("comparisonChart");
    if (!container || typeof echarts === "undefined") return;
    if (chart) chart.dispose();
    chart = echarts.init(container, null, { renderer: "canvas" });
    const values = [metrics.actualImpact, metrics.fullImpact, metrics.gap];
    chart.setOption({
      animationDuration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
      grid: { left: 18, right: 22, top: 36, bottom: 24, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (items) => `${items[0].name}<br><strong>${formatCurrency(items[0].value)}</strong>` },
      xAxis: { type: "category", data: ["客户实际执行", "如果全部听取", "未采纳差额"], axisTick: { show: false }, axisLine: { lineStyle: { color: "#cfd9e5" } }, axisLabel: { color: "#526477", fontSize: 10 } },
      yAxis: { type: "value", axisLabel: { color: "#718096", fontSize: 9, formatter: (value) => Math.abs(value) >= 10000 ? `${(value / 10000).toFixed(1)}万` : value }, splitLine: { lineStyle: { color: "#eef2f6" } } },
      series: [{ type: "bar", barMaxWidth: 58, data: values.map((value, index) => ({ value, itemStyle: { color: index === 0 ? "#64748b" : index === 1 ? "#2563eb" : value >= 0 ? "#c23b32" : "#168252", borderRadius: [6,6,0,0] } })), label: { show: true, position: "top", color: "#334155", fontSize: 9, formatter: ({ value }) => `${value >= 0 ? "+" : ""}${formatMoney(value, 0)}` } }],
    });
  }

  function bindContentEvents(customer) {
    document.getElementById("editCustomerBtn")?.addEventListener("click", () => openCustomerDialog(customer));
    document.getElementById("deleteCustomerBtn")?.addEventListener("click", () => deleteCustomer(customer.id));
    document.getElementById("refreshQuotesBtn")?.addEventListener("click", (event) => refreshQuotes(customer, event.currentTarget));
    document.getElementById("toggleHoldingFormBtn")?.addEventListener("click", () => document.getElementById("holdingForm")?.classList.toggle("hidden"));
    document.getElementById("holdingForm")?.addEventListener("submit", (event) => saveHolding(event, customer));
    document.getElementById("serviceForm")?.addEventListener("submit", (event) => saveService(event, customer));
    dom.customerContent.querySelectorAll("[data-delete-holding]").forEach((button) => button.addEventListener("click", () => deleteHolding(customer, button.dataset.deleteHolding)));
    dom.customerContent.querySelectorAll("[data-delete-service]").forEach((button) => button.addEventListener("click", () => deleteService(customer, button.dataset.deleteService)));
  }

  function renderAll() {
    if (!state.customers.some((item) => item.id === state.currentCustomerId)) state.currentCustomerId = state.customers[0]?.id || "";
    renderCustomerList();
    renderContent();
    updateDataStatus();
  }

  function openCustomerDialog(customer = null) {
    editingCustomerId = customer?.id || "";
    document.getElementById("customerDialogTitle").textContent = customer ? "编辑客户资料" : "新增客户";
    const form = dom.customerForm;
    form.reset();
    form.elements.id.value = customer?.id || `C${today().replace(/-/g, "")}${String(state.customers.length + 1).padStart(2, "0")}`;
    form.elements.id.disabled = Boolean(customer);
    form.elements.name.value = customer?.name || "";
    form.elements.phone.value = customer?.phone || "";
    form.elements.risk_level.value = customer?.risk_level || "C3 平衡型";
    form.elements.assets.value = customer?.assets || "";
    form.elements.advisor.value = customer?.advisor || "";
    form.elements.opened_at.value = customer?.opened_at || today();
    form.elements.notes.value = customer?.notes || "";
    dom.customerDialog.showModal();
  }

  function saveCustomer(event) {
    event.preventDefault();
    const form = new FormData(dom.customerForm);
    const id = editingCustomerId || text(form.get("id"));
    if (!id || !text(form.get("name"))) return showToast("客户编号和姓名不能为空。", true);
    const existing = state.customers.find((item) => item.id === id);
    const next = normalizeCustomer({
      ...(existing || {}),
      id,
      name: form.get("name"),
      phone: form.get("phone"),
      risk_level: form.get("risk_level"),
      assets: form.get("assets"),
      advisor: form.get("advisor"),
      opened_at: form.get("opened_at"),
      notes: form.get("notes"),
      holdings: existing?.holdings || [],
      services: existing?.services || [],
      is_demo: false,
    });
    if (existing) Object.assign(existing, next);
    else state.customers.push(next);
    state.currentCustomerId = id;
    persist();
    dom.customerDialog.close();
    renderAll();
    showToast(existing ? "客户资料已更新。" : "客户已创建。现在可以录入持仓和服务记录。");
  }

  function deleteCustomer(id) {
    const customer = state.customers.find((item) => item.id === id);
    if (!customer || !window.confirm(`确定删除客户“${customer.name}”及其持仓和服务记录吗？`)) return;
    state.customers = state.customers.filter((item) => item.id !== id);
    state.currentCustomerId = state.customers[0]?.id || "";
    persist();
    renderAll();
    showToast("客户档案已删除。", false);
  }

  function saveHolding(event, customer) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const holding = normalizeHolding(Object.fromEntries(form.entries()));
    if (!/^\d{6}$/.test(holding.code)) return showToast("股票代码必须为 6 位数字。", true);
    if (!holding.name || holding.quantity <= 0) return showToast("请填写股票名称和有效持仓数量。", true);
    const index = customer.holdings.findIndex((item) => item.code === holding.code);
    if (index >= 0) customer.holdings[index] = holding;
    else customer.holdings.push(holding);
    customer.is_demo = false;
    persist();
    renderAll();
    showToast(index >= 0 ? "持仓已更新。" : "持仓已增加。" );
  }

  function deleteHolding(customer, key) {
    const holding = customer.holdings.find((item) => item.code === key || item.name === key);
    if (!holding || !window.confirm(`确定删除 ${holding.name || holding.code} 的持仓记录吗？`)) return;
    customer.holdings = customer.holdings.filter((item) => item !== holding);
    persist();
    renderAll();
    showToast("持仓记录已删除。" );
  }

  function saveService(event, customer) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const service = normalizeService(raw);
    if (!/^\d{6}$/.test(service.code)) return showToast("股票代码必须为 6 位数字。", true);
    if (!service.name) return showToast("请填写股票名称。", true);
    if (service.action !== "hold" && (service.quantity <= 0 || service.advice_price <= 0 || service.current_price <= 0)) return showToast("非持有建议必须填写有效数量、建议价和最新价。", true);
    if (service.response === "followed") service.executed_quantity = service.quantity;
    if (service.response === "ignored") service.executed_quantity = 0;
    customer.services.push(service);
    customer.is_demo = false;
    persist();
    renderAll();
    showToast("服务记录已保存，对比结果已重新计算。" );
  }

  function deleteService(customer, id) {
    const service = customer.services.find((item) => item.id === id);
    if (!service || !window.confirm("确定删除这条服务记录吗？")) return;
    customer.services = customer.services.filter((item) => item.id !== id);
    persist();
    renderAll();
    showToast("服务记录已删除。" );
  }

  function apiUrl(path) {
    return location.hostname.endsWith("github.io") ? `https://www.tianchend.online${path}` : path;
  }

  async function refreshQuotes(customer, button) {
    const codes = [...new Set([...customer.holdings.map((item) => item.code), ...customer.services.map((item) => item.code)].filter((item) => /^\d{6}$/.test(item)))];
    if (!codes.length) return showToast("当前客户没有可刷新的股票代码。", true);
    const original = button.textContent;
    button.disabled = true;
    button.textContent = `刷新中 0/${codes.length}`;
    let completed = 0;
    let failed = 0;
    const results = await Promise.all(codes.map(async (stockCode) => {
      try {
        const response = await fetch(apiUrl(`/api/stock-live?code=${encodeURIComponent(stockCode)}&period=daily`), { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.ok || !Number.isFinite(Number(payload.quote?.price))) throw new Error(payload.error || `HTTP ${response.status}`);
        return { code: stockCode, price: Number(payload.quote.price), name: text(payload.quote.name) };
      } catch (error) {
        failed += 1;
        return null;
      } finally {
        completed += 1;
        button.textContent = `刷新中 ${completed}/${codes.length}`;
      }
    }));
    results.filter(Boolean).forEach((quote) => {
      customer.holdings.filter((item) => item.code === quote.code).forEach((item) => { item.current_price = quote.price; item.updated_at = today(); if (!item.name) item.name = quote.name; });
      customer.services.filter((item) => item.code === quote.code).forEach((item) => { item.current_price = quote.price; if (!item.name) item.name = quote.name; });
    });
    persist();
    renderAll();
    button.disabled = false;
    button.textContent = original;
    showToast(failed ? `行情刷新完成，${failed} 只股票暂未取得行情。` : `已刷新 ${codes.length} 只股票的最新行情。`, failed === codes.length);
  }

  function pick(row, keys) {
    for (const key of keys) {
      if (row[key] != null && String(row[key]).trim() !== "") return row[key];
    }
    return "";
  }

  function rowCustomerId(row) {
    return text(pick(row, ["客户编号", "customer_id", "客户ID", "id"]));
  }

  function customerFromRow(row) {
    return normalizeCustomer({
      id: rowCustomerId(row), name: pick(row, ["客户姓名", "姓名", "customer_name", "name"]), phone: pick(row, ["手机号", "电话", "phone"]),
      risk_level: pick(row, ["风险等级", "风险类型", "risk_level"]), assets: pick(row, ["总资产", "资产", "assets"]), advisor: pick(row, ["客户经理", "advisor"]),
      opened_at: pick(row, ["建档日期", "开户日期", "opened_at"]), notes: pick(row, ["客户备注", "备注", "notes"]), holdings: [], services: [],
    });
  }

  function holdingFromRow(row) {
    return normalizeHolding({ code: pick(row, ["股票代码", "证券代码", "code"]), name: pick(row, ["股票名称", "证券名称", "name", "stock"]), quantity: pick(row, ["持仓数量", "证券数量", "quantity"]), cost_price: pick(row, ["成本价", "买入价", "cost_price"]), current_price: pick(row, ["最新价", "当前价", "current_price"]), updated_at: pick(row, ["更新时间", "updated_at"]) });
  }

  function serviceFromRow(row) {
    return normalizeService({ id: pick(row, ["记录编号", "id"]), date: pick(row, ["服务日期", "日期", "date"]), type: pick(row, ["服务类型", "type"]), channel: pick(row, ["渠道", "channel"]), code: pick(row, ["股票代码", "证券代码", "code"]), name: pick(row, ["股票名称", "证券名称", "name", "stock"]), action: pick(row, ["建议动作", "action"]), quantity: pick(row, ["建议数量", "quantity"]), advice_price: pick(row, ["建议价格", "advice_price"]), current_price: pick(row, ["最新价格", "当前价格", "current_price"]), response: pick(row, ["客户反馈", "response"]), executed_quantity: pick(row, ["实际执行数量", "executed_quantity"]), note: pick(row, ["服务记录", "服务说明", "备注", "note"]) });
  }

  function rowsFromSheet(workbook, names) {
    const sheetName = workbook.SheetNames.find((name) => names.includes(name)) || "";
    return sheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false }) : [];
  }

  async function parseImportFile(file) {
    if (file.name.toLowerCase().endsWith(".json")) {
      const payload = JSON.parse(await file.text());
      const customers = (Array.isArray(payload) ? payload : payload.customers || []).map(normalizeCustomer);
      return customers;
    }
    if (typeof XLSX === "undefined") throw new Error("Excel 解析组件未加载。" );
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    let customerRows = rowsFromSheet(workbook, ["客户信息", "客户", "customers"]);
    let holdingRows = rowsFromSheet(workbook, ["客户持仓", "持仓", "holdings"]);
    let serviceRows = rowsFromSheet(workbook, ["服务记录", "服务", "services"]);
    if (!customerRows.length && !holdingRows.length && !serviceRows.length && workbook.SheetNames.length) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "", raw: false });
      const typed = rows.some((row) => text(row["数据类型"] || row.type_group));
      if (typed) {
        customerRows = rows.filter((row) => /客户/.test(text(row["数据类型"] || row.type_group)));
        holdingRows = rows.filter((row) => /持仓/.test(text(row["数据类型"] || row.type_group)));
        serviceRows = rows.filter((row) => /服务/.test(text(row["数据类型"] || row.type_group)));
      } else if (rows.some((row) => pick(row, ["建议动作", "客户反馈"]))) serviceRows = rows;
      else if (rows.some((row) => pick(row, ["持仓数量", "成本价"]))) holdingRows = rows;
      else customerRows = rows;
    }
    const map = new Map();
    customerRows.forEach((row) => { const customer = customerFromRow(row); if (customer.id) map.set(customer.id, customer); });
    const ensureCustomer = (id) => {
      if (!map.has(id)) map.set(id, normalizeCustomer({ id, name: id || "待补充客户姓名", holdings: [], services: [] }));
      return map.get(id);
    };
    holdingRows.forEach((row) => { const id = rowCustomerId(row); if (id) ensureCustomer(id).holdings.push(holdingFromRow(row)); });
    serviceRows.forEach((row) => { const id = rowCustomerId(row); if (id) ensureCustomer(id).services.push(serviceFromRow(row)); });
    return [...map.values()];
  }

  function mergeCustomers(imported) {
    imported.forEach((incoming) => {
      const current = state.customers.find((item) => item.id === incoming.id);
      if (!current) state.customers.push({ ...incoming, is_demo: false });
      else Object.assign(current, {
        ...current,
        ...incoming,
        holdings: incoming.holdings.length ? incoming.holdings : current.holdings,
        services: incoming.services.length ? incoming.services : current.services,
        is_demo: false,
      });
    });
    if (imported[0]) state.currentCustomerId = imported[0].id;
  }

  async function importFile(file) {
    try {
      const customers = await parseImportFile(file);
      if (!customers.length) throw new Error("文件中未识别到客户信息。" );
      mergeCustomers(customers);
      persist();
      renderAll();
      showToast(`成功导入 ${customers.length} 位客户。`);
    } catch (error) {
      showToast(`导入失败：${error.message}`, true);
    } finally {
      dom.importFile.value = "";
    }
  }

  function downloadTemplate() {
    if (typeof XLSX === "undefined") return showToast("Excel 组件未加载，无法生成模板。", true);
    const workbook = XLSX.utils.book_new();
    const customers = [{ 客户编号: "C2026092801", 客户姓名: "陈先生", 手机号: "13800000000", 风险等级: "C4 成长型", 总资产: 865000, 客户经理: "王经理", 建档日期: "2026-09-28", 客户备注: "示例数据，请导入前替换" }];
    const holdings = [
      { 客户编号: "C2026092801", 股票代码: "000801", 股票名称: "四川九洲", 持仓数量: 12000, 成本价: 14.62, 最新价: 15.18, 更新时间: "2026-09-28" },
      { 客户编号: "C2026092801", 股票代码: "600000", 股票名称: "浦发银行", 持仓数量: 18000, 成本价: 10.54, 最新价: 10.86, 更新时间: "2026-09-28" },
    ];
    const services = [
      { 客户编号: "C2026092801", 记录编号: "S001", 服务日期: "2026-09-20", 服务类型: "持仓建议", 渠道: "企业微信", 股票代码: "000801", 股票名称: "四川九洲", 建议动作: "买入", 建议数量: 5000, 建议价格: 14.76, 最新价格: 15.18, 客户反馈: "全部执行", 实际执行数量: 5000, 服务记录: "回踩关键位后建议分批参与" },
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customers), "客户信息");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(holdings), "客户持仓");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(services), "服务记录");
    XLSX.writeFile(workbook, "客户服务对比工作台导入模板.xlsx");
    showToast("导入模板已下载。" );
  }

  function exportState() {
    const payload = { schema_version: "client_service_workbench_v1", exported_at: new Date().toISOString(), customers: state.customers };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `客户服务工作台_${today()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("工作台数据已导出。" );
  }

  let toastTimer = null;
  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.toggle("error", isError);
    dom.toast.classList.remove("hidden");
    toastTimer = setTimeout(() => dom.toast.classList.add("hidden"), 4200);
  }

  dom.customerList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-customer-id]");
    if (!button) return;
    state.currentCustomerId = button.dataset.customerId;
    persist();
    renderAll();
  });
  dom.customerSearch.addEventListener("input", renderCustomerList);
  document.getElementById("addCustomerBtn").addEventListener("click", () => openCustomerDialog());
  document.getElementById("importBtn").addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", () => dom.importFile.files?.[0] && importFile(dom.importFile.files[0]));
  document.getElementById("downloadTemplateBtn").addEventListener("click", downloadTemplate);
  document.getElementById("exportBtn").addEventListener("click", exportState);
  document.getElementById("clearDemoBtn").addEventListener("click", () => {
    const demoCount = state.customers.filter((item) => item.is_demo).length;
    if (!demoCount) return showToast("当前没有示例客户。" );
    state.customers = state.customers.filter((item) => !item.is_demo);
    state.currentCustomerId = state.customers[0]?.id || "";
    persist();
    renderAll();
    showToast(`已清除 ${demoCount} 位示例客户。`);
  });
  dom.customerForm.addEventListener("submit", saveCustomer);
  document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dom.customerDialog.close()));
  window.addEventListener("resize", () => chart?.resize());

  renderAll();
})();
