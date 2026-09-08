const tabs = [
  { id: "overview", name: "综合判断", desc: "交易与持仓全貌" },
  { id: "persona", name: "客群匹配", desc: "板块 · 收益 · 频次" },
  { id: "talk", name: "对客话术", desc: "专业精炼可用" },
  { id: "material", name: "物料生成", desc: "多场景话术" },
  { id: "risk", name: "风控体系", desc: "仓位与信号验证" },
  { id: "stock", name: "个股分析", desc: "走势 · 财务 · 估值" },
  { id: "style", name: "交易与持仓", desc: "风格与结构" },
  { id: "validation", name: "逻辑验证", desc: "解析与证据" },
  { id: "feed", name: "主理人风格", desc: "训练与同步" },
  { id: "framework", name: "研究框架", desc: "方法论", href: "./portfolio_research_framework.html" }
];
const ADVISOR_CORPUS_TYPES = ["早评", "盘前洞察", "午评", "盘中问答", "收评复盘"];
const NON_PRICE_THEMES = ["综合策略", "宏观策略", "策略报告", "宏观研究", "券商晨会"];

const state = {
  portfolios: [],
  currentPortfolioId: null,
  compareIds: [],
  activeTab: "overview",
  industryCache: {},
  industryServiceReady: null,
  industryPending: new Set(),
  feedRecords: [],
  hotRecords: [],
  themeMappings: [],
  marketSnapshot: null,
  holdingQuotes: null,
  selectedHoldingDate: "",
  advisorStrategyProfile: null,
  logicValidationResult: null,
  selectedMaterialDate: "",
  materialImageResult: null,
  materialSourceSummary: null,
  materialFrontModal: "",
  materialFrontLoading: false,
  materialFrontError: "",
  materialFrontPortfolioId: "",
  materialSectorDetails: {},
  advisorReview: null,
  advisorReviewSummary: null,
  clientPersonaScriptsByPortfolio: {},
  clientPersonaChatsByPortfolio: {},
  clientPersonaSelectedByPortfolio: {},
  clientPersonaStageByPortfolio: {},
  clientPersonaOpenDimensionByPortfolio: {},
  clientPersonaScriptLoading: false,
  clientPersonaChatLoading: false,
  riskDashboard: null,
  riskDashboardLoading: false,
  riskDashboardError: "",
  riskDashboardPortfolioId: "",
  riskDashboardHoldingKey: "",
  riskIndustryView: "portfolio",
  riskIndustrySearch: "",
  riskIndustryPage: 1,
  selectedRiskIndustryCode: "",
  selectedRiskKlineCode: "",
  riskWorkspace: null,
  riskWorkspaceLoading: false,
  riskWorkspaceError: "",
  riskWorkspacePortfolioId: "",
  selectedRiskIndexCode: "1.000001",
  riskSectorDetail: null,
  riskSectorDetailLoading: false,
  riskSectorDetailError: "",
  riskAnnotationCache: {},
  riskAnnotationDrafts: {},
  riskDrawingKey: "",
  riskDrawingStart: null,
  riskPositionJournal: null,
  riskPositionHistory: [],
  riskPositionHistoryRecord: null,
  riskPositionHistoryDate: "",
  riskPositionDirty: false,
  riskPositionStatus: "",
  riskStockSearchResults: [],
  riskStockSearchLoading: false,
  holdingAssistantPreview: null,
  holdingAssistantStatus: "",
  holdingAssistantDraft: "",
  holdingSkillAnalysis: null,
  holdingSkillAnalysisLoading: false,
  holdingSkillAnalysisError: "",
  holdingSkillAnalysisPortfolioId: "",
  adjustmentReasonDraftByPortfolio: {},
  adjustmentReasonResultByPortfolio: {},
  adjustmentReasonStatusByPortfolio: {},
  holdingTradeStatus: "",
  staticSeedGeneratedAt: ""
};
const STORAGE_KEY = "portfolio-observatory-state-v1";
const STORAGE_RESET_FLAG = "portfolio-observatory-empty-shell-v1";
const STATIC_RISK_ROOT = "./static_risk";
const LOCAL_SERVICE_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
let portfolioDbSyncTimer = null;
let portfolioDbSyncPaused = false;
let holdingQuotesPending = false;
let lastHoldingQuotesAutoKey = "";
let holdingDateTouched = false;
let holdingMarketAutoRefreshTimer = null;
let holdingMarketAutoRefreshPending = false;
let holdingMarketRefreshGeneration = 0;
let holdingMarketRefreshRerunRequested = false;
let logicValidationAutoTimer = null;
let logicValidationAutoPending = false;
let logicValidationAutoGeneration = 0;
let logicValidationAutoRerunRequested = false;
let logicValidationAutoStatus = "";
let materialCopyMap = new Map();
let clientPersonaAutoAttempted = new Set();

const fileInput = document.getElementById("fileInput");
const folderInput = document.getElementById("folderInput");
const triggerImportBtn = document.getElementById("triggerImportBtn");
const triggerFolderImportBtn = document.getElementById("triggerFolderImportBtn");
const exportDatasetBtn = document.getElementById("exportDatasetBtn");
const exportSummaryBtn = document.getElementById("exportSummaryBtn");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const downloadCsvTemplateBtn = document.getElementById("downloadCsvTemplateBtn");
const refreshDataBtn = document.getElementById("refreshDataBtn");
const compareSelectedBtn = document.getElementById("compareSelectedBtn");
const resetWorkspaceBtn = document.getElementById("resetWorkspaceBtn");
const heroStatsEl = document.getElementById("heroStats");
const portfolioCountEl = document.getElementById("portfolioCount");
const portfolioLibraryEl = document.getElementById("portfolioLibrary");
const tabNavEl = document.getElementById("tabNav");
const statusTitleEl = document.getElementById("statusTitle");
const statusDescEl = document.getElementById("statusDesc");
const statusChipsEl = document.getElementById("statusChips");
const actionStatusEl = document.getElementById("actionStatus");
const workspaceSummaryTitleEl = document.getElementById("workspaceSummaryTitle");
const workspaceSummaryDescEl = document.getElementById("workspaceSummaryDesc");
const connectionStatusEl = document.getElementById("connectionStatus");
const shareCurrentBtn = document.getElementById("shareCurrentBtn");
const shareSnapshotModal = document.getElementById("shareSnapshotModal");
const shareSnapshotCloseBtn = document.getElementById("shareSnapshotCloseBtn");
const shareSnapshotLink = document.getElementById("shareSnapshotLink");
const copyShareSnapshotBtn = document.getElementById("copyShareSnapshotBtn");
const openShareSnapshotLink = document.getElementById("openShareSnapshotLink");
const shareSnapshotStatus = document.getElementById("shareSnapshotStatus");
const publishWebSnapshotBtn = document.getElementById("publishWebSnapshotBtn");
const stockShareBtn = document.getElementById("stockShareBtn");
const stockShareModal = document.getElementById("stockShareModal");
const stockShareCloseBtn = document.getElementById("stockShareCloseBtn");
const stockShareSearchInput = document.getElementById("stockShareSearchInput");
const stockShareSearchBtn = document.getElementById("stockShareSearchBtn");
const stockShareResults = document.getElementById("stockShareResults");
const stockShareStatus = document.getElementById("stockShareStatus");

function isLocalServiceHost() {
  return LOCAL_SERVICE_HOSTS.has(window.location.hostname);
}

if (!isLocalServiceHost() && publishWebSnapshotBtn) {
  publishWebSnapshotBtn.textContent = "生成分享快照";
  publishWebSnapshotBtn.title = "把当前页面数据写入分享链接，手机打开即可查看";
}

let staticShareManifestPromise = null;
function loadStaticShareManifest() {
  if (!staticShareManifestPromise) {
    staticShareManifestPromise = fetch(`${STATIC_RISK_ROOT}/share_manifest.json`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null);
  }
  return staticShareManifestPromise;
}
void loadStaticShareManifest();

async function readJsonResponse(response, label = "数据") {
  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch (_) {
    throw new Error(`${label}返回格式异常（HTTP ${response.status}）`);
  }
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `${label}暂不可用（HTTP ${response.status}）`);
  }
  return payload;
}

async function fetchApiWithStaticFallback(apiUrl, staticUrl, label) {
  let apiError = null;
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    return await readJsonResponse(response, label);
  } catch (error) {
    apiError = error;
  }
  try {
    const response = await fetch(staticUrl, { cache: "no-store" });
    const payload = await readJsonResponse(response, `${label}静态快照`);
    payload.__static_snapshot = true;
    return payload;
  } catch (staticError) {
    throw apiError || staticError;
  }
}

async function refreshConnectionStatus() {
  if (!connectionStatusEl) return false;
  if (window.location.protocol === "file:") {
    connectionStatusEl.className = "offline";
    connectionStatusEl.textContent = "当前为直接打开 HTML：可以导入到浏览器临时使用；数据库、行情和风控接口需双击“启动观察台.bat”。";
    return false;
  }
  try {
    const response = await fetch("/api/ping", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error("服务未就绪");
    connectionStatusEl.className = "online";
    connectionStatusEl.textContent = "本地服务已连接：导入数据会写入随包 SQLite，行情与风控接口可用。";
    return true;
  } catch (error) {
    connectionStatusEl.className = "offline";
    const localHostnames = new Set(["127.0.0.1", "localhost", "::1"]);
    connectionStatusEl.textContent = localHostnames.has(window.location.hostname)
      ? "本地服务未连接：请双击“启动观察台.bat”，不要直接双击 HTML。"
      : "普通云端版：导入与编辑内容保存在当前浏览器；云端数据库、行情和自动同步暂未启用。";
    return false;
  }
}

function persistState() {
  try {
    const payload = {
      portfolios: state.portfolios.map((item) => ({
        id: item.id,
        name: item.name,
        keySlug: item.keySlug,
        dataset: item.dataset
      })),
      currentPortfolioId: state.currentPortfolioId,
      compareIds: state.compareIds,
      activeTab: state.activeTab,
      industryCache: state.industryCache,
      feedRecords: state.feedRecords,
      hotRecords: state.hotRecords,
      themeMappings: state.themeMappings,
      marketSnapshot: state.marketSnapshot,
      holdingQuotes: state.holdingQuotes,
      selectedHoldingDate: state.selectedHoldingDate,
      advisorStrategyProfile: state.advisorStrategyProfile,
      logicValidationResult: state.logicValidationResult,
      selectedMaterialDate: state.selectedMaterialDate,
      materialImageResult: state.materialImageResult,
      materialSourceSummary: state.materialSourceSummary,
      advisorReviewSummary: state.advisorReviewSummary,
      riskPositionJournal: state.riskPositionJournal,
      riskPositionHistory: state.riskPositionHistory,
      riskAnnotationDrafts: state.riskAnnotationDrafts,
      riskInstrumentReview: state.riskWorkspace?.instrument_review || null,
      riskHoldingReviews: state.riskWorkspace?.holding_reviews || [],
      staticSeedGeneratedAt: state.staticSeedGeneratedAt,
      clientPersonaScriptsByPortfolio: state.clientPersonaScriptsByPortfolio,
      clientPersonaChatsByPortfolio: state.clientPersonaChatsByPortfolio,
      clientPersonaSelectedByPortfolio: state.clientPersonaSelectedByPortfolio,
      clientPersonaStageByPortfolio: state.clientPersonaStageByPortfolio,
      clientPersonaOpenDimensionByPortfolio: state.clientPersonaOpenDimensionByPortfolio,
      adjustmentReasonDraftByPortfolio: state.adjustmentReasonDraftByPortfolio,
      adjustmentReasonResultByPortfolio: state.adjustmentReasonResultByPortfolio,
      adjustmentReasonStatusByPortfolio: state.adjustmentReasonStatusByPortfolio
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    schedulePortfolioDbSync();
  } catch (error) {
    // Ignore storage errors caused by browser limits or private mode.
  }
}

function schedulePortfolioDbSync() {
  if (portfolioDbSyncPaused || !state.portfolios.length) return;
  window.clearTimeout(portfolioDbSyncTimer);
  portfolioDbSyncTimer = window.setTimeout(() => {
    syncPortfoliosToDb();
  }, 500);
}

function portfolioPayloadForDb() {
  return state.portfolios.map((item) => ({
    id: item.id,
    name: item.name,
    keySlug: item.keySlug,
    dataset: item.dataset,
    source: "web_workbench"
  }));
}

async function syncPortfoliosToDb(options = {}) {
  const required = Boolean(options.required);
  if (!state.portfolios.length) return null;
  try {
    const result = await postJson("/api/portfolios/save", {
      portfolios: portfolioPayloadForDb(),
      reconcile_holding_portfolio_ids: options.reconcileHoldingPortfolioIds || [],
    });
    if (!result?.ok || Number(result.saved || 0) < state.portfolios.length) {
      throw new Error("数据库未确认保存全部持仓组合");
    }
    return result;
  } catch (error) {
    console.warn("portfolio db sync failed", error);
    if (required) throw error;
    return null;
  }
}

async function flushPortfoliosToDb(options = {}) {
  window.clearTimeout(portfolioDbSyncTimer);
  portfolioDbSyncTimer = null;
  return await syncPortfoliosToDb({ required: true, ...options });
}

function buildPortfolioRecordFromSaved(item) {
  const cleanedName = extractPortfolioKeyName(item.name || item.dataset?.name || "导入组合");
  const record = buildPortfolioRecord(item.dataset || {}, cleanedName);
  record.id = item.id || record.id;
  record.name = cleanedName;
  record.keySlug = item.keySlug || item.key_slug || toPortfolioSlug(cleanedName);
  return record;
}

async function hydratePortfoliosFromDb(options = {}) {
  try {
    const response = await fetch("/api/portfolios", { cache: "no-store" });
    if (!response.ok) return false;
    const payload = await response.json();
    // Empty portfolios are authoritative too. After a confirmed history clear,
    // keeping them here prevents stale browser localStorage from restoring the
    // deleted holdings into SQLite on the next page load.
    const portfolios = (payload.portfolios || []).map(buildPortfolioRecordFromSaved);
    if (!portfolios.length) return false;
    const currentId = state.currentPortfolioId;
    state.portfolios = portfolios;
    state.currentPortfolioId = portfolios.some((item) => item.id === currentId) ? currentId : portfolios[0].id;
    state.compareIds = state.compareIds.filter((id) => portfolios.some((item) => item.id === id));
    if (!state.compareIds.length) state.compareIds = [state.currentPortfolioId];
    persistState();
    renderAll();
    if (!options.silent) {
      actionStatusEl.textContent = `已从本地数据库恢复 ${portfolios.length} 个持仓组合。`;
    }
    return true;
  } catch (error) {
    console.warn("portfolio db restore failed", error);
    return false;
  }
}

function hydrateStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    state.feedRecords = parsed.feedRecords || [];
    state.hotRecords = parsed.hotRecords || [];
    state.themeMappings = parsed.themeMappings || getDefaultThemeMappings();
    state.marketSnapshot = parsed.marketSnapshot || null;
    state.holdingQuotes = parsed.holdingQuotes || null;
    state.selectedHoldingDate = parsed.selectedHoldingDate || "";
    state.advisorStrategyProfile = parsed.advisorStrategyProfile || null;
    state.logicValidationResult = parsed.logicValidationResult || null;
    state.selectedMaterialDate = parsed.selectedMaterialDate || "";
    state.materialImageResult = parsed.materialImageResult || null;
    state.materialSourceSummary = parsed.materialSourceSummary || null;
    state.advisorReviewSummary = parsed.advisorReviewSummary || null;
    state.riskPositionJournal = parsed.riskPositionJournal || null;
    state.riskPositionHistory = parsed.riskPositionHistory || [];
    state.riskAnnotationDrafts = parsed.riskAnnotationDrafts || {};
    state.riskAnnotationCache = Object.fromEntries(
      Object.entries(state.riskAnnotationDrafts).map(([key, value]) => [key, value])
    );
    state.riskWorkspace = parsed.riskInstrumentReview || parsed.riskHoldingReviews?.length
      ? {
          instrument_review: parsed.riskInstrumentReview || {},
          holding_reviews: parsed.riskHoldingReviews || [],
          __browser_draft: true,
        }
      : null;
    state.staticSeedGeneratedAt = parsed.staticSeedGeneratedAt || "";
    state.clientPersonaScriptsByPortfolio = parsed.clientPersonaScriptsByPortfolio || {};
    state.clientPersonaChatsByPortfolio = parsed.clientPersonaChatsByPortfolio || {};
    state.clientPersonaSelectedByPortfolio = parsed.clientPersonaSelectedByPortfolio || {};
    state.clientPersonaStageByPortfolio = parsed.clientPersonaStageByPortfolio || {};
    state.clientPersonaOpenDimensionByPortfolio = parsed.clientPersonaOpenDimensionByPortfolio || {};
    state.adjustmentReasonDraftByPortfolio = parsed.adjustmentReasonDraftByPortfolio || {};
    state.adjustmentReasonResultByPortfolio = parsed.adjustmentReasonResultByPortfolio || {};
    state.adjustmentReasonStatusByPortfolio = parsed.adjustmentReasonStatusByPortfolio || {};
    const portfolios = (parsed.portfolios || [])
      .map((item) => {
        // 在加载时也应用最新的名称清洗规则，自动净化之前导入的冗长名称
        const cleanedName = extractPortfolioKeyName(item.name || "导入组合");
        const record = buildPortfolioRecord(item.dataset || {}, cleanedName);
        record.id = item.id || record.id;
        record.name = cleanedName;
        record.keySlug = toPortfolioSlug(cleanedName);
        return record;
      })
      .filter((item) => item.analysis.trades.length || item.analysis.openPositions.length);
    if (!portfolios.length) {
      state.activeTab = tabs.some((tab) => tab.id === parsed.activeTab) ? parsed.activeTab : "overview";
      state.industryCache = parsed.industryCache || {};
      return Boolean(state.feedRecords.length || state.hotRecords.length || state.themeMappings.length);
    }
    state.portfolios = portfolios;
    state.currentPortfolioId = portfolios.some((item) => item.id === parsed.currentPortfolioId)
      ? parsed.currentPortfolioId
      : portfolios[0].id;
    state.compareIds = (parsed.compareIds || []).filter((id) => portfolios.some((item) => item.id === id));
    if (!state.compareIds.length) state.compareIds = [state.currentPortfolioId];
    state.activeTab = tabs.some((tab) => tab.id === parsed.activeTab) ? parsed.activeTab : "overview";
    state.industryCache = parsed.industryCache || {};
    return true;
  } catch (error) {
    return false;
  }
}

// The Vercel edition is intentionally static, so it cannot open the local
// SQLite file.  Ship a small, sanitized recent snapshot with the static build
// so a fresh browser is useful immediately instead of showing an empty shell.
async function hydratePortfoliosFromStaticSeed() {
  if (window.location.protocol === "file:") return false;
  try {
    const response = await fetch("./static_data_seed.json", { cache: "no-store" });
    if (!response.ok) return false;
    const payload = await response.json();
    const seeded = (payload.portfolios || []).map(buildPortfolioRecordFromSaved).filter(Boolean);
    if (!seeded.length) return false;
    const seedGeneratedAt = String(payload.generated_at || payload.source_updated_at || "");
    const samePortfolioExists = state.portfolios.some((item) => item.id === seeded[0].id);
    const seedIsNewer = !state.staticSeedGeneratedAt
      || (seedGeneratedAt && Date.parse(seedGeneratedAt) > Date.parse(state.staticSeedGeneratedAt));
    const hasBrowserRiskEdit = state.riskPositionJournal?.source === "browser_static_edit";
    if (state.portfolios.length && (!samePortfolioExists || !seedIsNewer || hasBrowserRiskEdit)) return false;
    state.portfolios = seeded;
    state.currentPortfolioId = seeded[0].id;
    state.compareIds = [seeded[0].id];
    state.riskPositionHistory = Array.isArray(payload.risk_position_journal) ? payload.risk_position_journal : [];
    const latestJournal = state.riskPositionHistory[0];
    const latestPositions = seeded[0].dataset.open_positions || [];
    if (latestJournal) {
      state.riskPositionJournal = {
        ...latestJournal,
        holdings: latestPositions.map((item) => ({
          stock_code: item.code || item.instrument_key,
          stock_name: item.stock,
          position_pct: Number(item.manager_position_pct ?? item.position_pct ?? item.weight ?? 0),
        })),
      };
    }
    state.staticSeedGeneratedAt = seedGeneratedAt;
    portfolioDbSyncPaused = true;
    persistState();
    portfolioDbSyncPaused = false;
    renderAll();
    actionStatusEl.textContent = `已载入云端初始数据：${seeded[0].name}（最近 ${seeded[0].dataset.daily_snapshots?.length || 0} 个持仓快照）。`;
    return true;
  } catch (error) {
    console.warn("static seed restore failed", error);
    return false;
  }
}

function clearStoredPortfoliosOnce() {
  // 历史版本曾在首次打开时清空导入数据；现在组合已进入 SQLite，不再自动清空。
}

function pct(value, digits = 2, fallback = "—") {
  return value == null || Number.isNaN(Number(value))
    ? fallback
    : `${Number(value).toFixed(digits)}%`;
}

function num(value, digits = 2, fallback = "—") {
  return value == null || Number.isNaN(Number(value))
    ? fallback
    : Number(value).toFixed(digits);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function text(value, fallback = "—") {
  const content = String(value ?? "").trim();
  return content || fallback;
}

function truncateText(value, maxLength = 120) {
  const content = text(value, "");
  return content.length > maxLength ? `${content.slice(0, maxLength).trim()}...` : content;
}

function sum(list) {
  return list.reduce((acc, item) => acc + item, 0);
}

function average(list) {
  return list.length ? sum(list) / list.length : null;
}

function median(list) {
  if (!list.length) return null;
  const arr = [...list].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function ratio(part, total) {
  return total ? (part / total) * 100 : 0;
}

function unique(list) {
  return [...new Set(list)];
}

function normalizeListItems(items) {
  return unique(
    (items || [])
      .map((item) => text(item, "").trim())
      .filter(Boolean)
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDefaultThemeMappings() {
  return [
    { theme: "AI算力", industries: ["通信设备", "IT服务", "服务器", "光模块"], stocks: ["中际旭创(300308)", "新易盛(300502)", "工业富联(601138)", "浪潮信息(000977)", "中科曙光(603019)"] },
    { theme: "半导体", industries: ["半导体", "电子化学品", "专用设备"], stocks: ["北方华创(002371)", "中微公司(688012)", "寒武纪(688256)", "长电科技(600584)"] },
    { theme: "机器人", industries: ["自动化设备", "汽车零部件", "通用设备"], stocks: ["三花智控(002050)", "拓普集团(601689)", "鸣志电器(603728)", "绿的谐波(688017)"] },
    { theme: "电力设备", industries: ["电源设备", "光伏设备", "风电设备"], stocks: ["东方电气(600875)", "阳光电源(300274)", "宁德时代(300750)"] },
    { theme: "有色金属", industries: ["工业金属", "小金属", "贵金属"], stocks: ["紫金矿业(601899)", "洛阳钼业(603993)", "云南锗业(002428)"] },
    { theme: "AI应用", industries: ["软件开发", "游戏", "传媒"], stocks: ["科大讯飞(002230)", "昆仑万维(300418)", "中国软件(600536)"] },
    { theme: "创新药", industries: ["化学制药", "生物制品", "医疗服务"], stocks: ["恒瑞医药(600276)", "百济神州(688235)", "药明康德(603259)"] }
  ];
}

function ensureThemeMappings() {
  if (!state.themeMappings.length) state.themeMappings = getDefaultThemeMappings();
  return state.themeMappings;
}

function getFeedKeywords() {
  return unique([
    ...ensureThemeMappings().map((item) => item.theme),
    "AI", "算力", "光模块", "半导体", "芯片", "机器人", "新能源", "储能", "电力设备", "有色", "黄金",
    "军工", "低空经济", "医药", "创新药", "消费", "白酒", "证券", "银行", "地产", "数据要素", "通信", "传媒"
  ]);
}

function splitNaturalTextBlocks(rawText) {
  return String(rawText || "")
    .replace(/\r/g, "\n")
    .split(/\n{2,}|(?=\d{4}[年/-]\d{1,2}[月/-]\d{1,2})|(?=\d{1,2}月\d{1,2}日)/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length >= 8);
}

function extractFirstDate(textValue) {
  const textContent = String(textValue || "");
  const fullDate = textContent.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/);
  if (fullDate) {
    const [, year, month, day] = fullDate;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const monthDate = textContent.match(/(\d{1,2})月(\d{1,2})日/);
  if (monthDate) {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${String(monthDate[1]).padStart(2, "0")}-${String(monthDate[2]).padStart(2, "0")}`;
  }
  return "";
}

function extractStockMentions(textValue) {
  const textContent = String(textValue || "");
  const matches = [...textContent.matchAll(/([\u4e00-\u9fa5A-Za-z]{2,12})[（(](\d{6})[）)]/g)];
  return unique(matches.map((match) => `${match[1]}(${match[2]})`));
}

function extractKeywordHits(textValue, keywords) {
  const textContent = String(textValue || "");
  return keywords.filter((keyword) => textContent.includes(keyword));
}

function extractSentenceByKeywords(textValue, keywords, fallback = "") {
  const sentences = String(textValue || "")
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return sentences.find((sentence) => keywords.some((keyword) => sentence.includes(keyword))) || fallback;
}

function buildPremarketPoint(insight) {
  const parts = [
    insight.date ? `日期：${insight.date}` : "",
    insight.market_view ? `市场判断：${insight.market_view}` : "",
    insight.focus_directions.length ? `看好方向：${insight.focus_directions.join("、")}` : "",
    insight.mentioned_stocks.length ? `涉及股票：${insight.mentioned_stocks.join("、")}` : "",
    insight.operation_advice ? `操作建议：${insight.operation_advice}` : "",
    insight.risk_warning ? `风险提示：${insight.risk_warning}` : "",
    insight.core_view ? `核心观点：${insight.core_view}` : ""
  ].filter(Boolean);
  return `盘前洞察｜${parts.join("；")}`;
}

function parsePremarketNaturalText(rawText) {
  const blocks = splitNaturalTextBlocks(rawText);
  const focusKeywords = getFeedKeywords();
  const riskKeywords = ["风险", "回撤", "分歧", "追高", "量能", "缩量", "兑现", "退潮", "波动", "止损", "高位"];
  const operationKeywords = ["低吸", "关注", "回避", "控制仓位", "等待", "加仓", "减仓", "止盈", "止损", "切换", "轮动"];
  const marketKeywords = ["指数", "市场", "情绪", "震荡", "反弹", "调整", "主线", "成交量", "量能", "风格"];

  const insights = blocks.map((block, index) => {
    const focusDirections = extractKeywordHits(block, focusKeywords);
    const riskWarning = extractSentenceByKeywords(block, riskKeywords);
    const operationAdvice = extractSentenceByKeywords(block, operationKeywords);
    const marketView = extractSentenceByKeywords(block, marketKeywords);
    const cleaned = cleanText(block);
    return {
      id: `premarket-${Date.now()}-${index + 1}`,
      date: extractFirstDate(block),
      title: block.includes("盘前") ? "盘前洞察" : "自然语言洞察",
      market_view: marketView,
      focus_directions: focusDirections,
      mentioned_stocks: extractStockMentions(block),
      core_view: cleaned.length > 180 ? `${cleaned.slice(0, 180)}...` : cleaned,
      operation_advice: operationAdvice,
      risk_warning: riskWarning,
      raw_text: cleaned
    };
  });

  const strategyPoints = insights.map(buildPremarketPoint);
  return {
    insights,
    strategyPoints
  };
}

function parseMarketHotspotText(rawText, feedDate) {
  const lines = String(rawText || "")
    .split(/\r?\n|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  const focusKeywords = getFeedKeywords();
  const records = [];

  lines.forEach((line, index) => {
    const rankMatch = line.match(/(?:^|[^\d])(?:第)?(\d{1,2})[\.、名位\s：:]/);
    const rank = rankMatch ? Number(rankMatch[1]) : index + 1;
    const themes = extractKeywordHits(line, focusKeywords);
    const stocks = extractStockMentions(line);
    const changeMatch = line.match(/([+-]\d+|上升\d+|下降\d+|升至第?\d+|降至第?\d+)/);
    const coreLogic = extractSentenceByKeywords(line, ["逻辑", "催化", "驱动", "受益", "景气", "政策"], line);
    const riskWarning = extractSentenceByKeywords(line, ["风险", "拥挤", "兑现", "回撤", "退潮", "追高"]);
    const themeList = themes.length ? themes : [line.replace(/^\d+[\.、\s]*/, "").slice(0, 18)];

    themeList.forEach((theme) => {
      records.push({
        id: `hot-${Date.now()}-${index}-${theme}`,
        date: feedDate || extractFirstDate(line) || formatDateObject(new Date()),
        theme,
        rank,
        rank_change: changeMatch?.[1] || "",
        related_stocks: stocks,
        core_logic: coreLogic,
        risk_warning: riskWarning,
        raw_text: cleanText(line)
      });
    });
  });

  return records;
}

function inferMatchedThemes(record) {
  const haystack = [
    record.market_view,
    record.core_view,
    record.operation_advice,
    record.risk_warning,
    ...(record.focus_directions || []),
    ...(record.mentioned_stocks || [])
  ].join(" ");
  return ensureThemeMappings()
    .filter((mapping) => {
      if (haystack.includes(mapping.theme)) return true;
      return [...(mapping.industries || []), ...(mapping.stocks || [])].some((item) => haystack.includes(item.replace(/\(\d{6}\)/, "")) || haystack.includes(item));
    })
    .map((mapping) => mapping.theme);
}

function parseDailyFeed(rawText, meta) {
  const sourceType = meta.source_type || "盘前洞察";
  const parsed = parsePremarketNaturalText(rawText);
  const feedRecords = parsed.insights.map((item, index) => {
    const record = {
      ...item,
      id: `feed-${Date.now()}-${index + 1}`,
      date: meta.date || item.date || formatDateObject(new Date()),
      source_type: sourceType,
      source_title: meta.source_title || item.title || sourceType,
      speaker: meta.speaker || "姜洪斌",
      imported_at: new Date().toISOString()
    };
    record.matched_themes = unique([...(record.focus_directions || []), ...inferMatchedThemes(record)]);
    return record;
  });

  const shouldParseHotspots = ["研报热点", "市场热点", "热点监测"].includes(sourceType);
  const hotRecords = shouldParseHotspots ? parseMarketHotspotText(rawText, meta.date) : [];

  return {
    feedRecords,
    hotRecords,
    strategyPoints: feedRecords.map(buildPremarketPoint)
  };
}

function upsertFeedRecords(records) {
  const map = new Map(state.feedRecords.map((item) => [`${item.date}|${item.source_type}|${item.raw_text}`, item]));
  records.forEach((item) => map.set(`${item.date}|${item.source_type}|${item.raw_text}`, item));
  state.feedRecords = [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function upsertHotRecords(records) {
  const map = new Map(state.hotRecords.map((item) => [`${item.date}|${item.theme}|${item.rank}|${item.raw_text}`, item]));
  records.forEach((item) => map.set(`${item.date}|${item.theme}|${item.rank}|${item.raw_text}`, item));
  state.hotRecords = [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.rank || 99) - (b.rank || 99));
}

function getRecentFeedRecords(limit = 30) {
  return [...state.feedRecords].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, limit);
}

function getRecentHotRecords(limit = 30) {
  return [...state.hotRecords].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.rank || 99) - (b.rank || 99)).slice(0, limit);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  if (data.ok === false) throw new Error(data.error || "请求失败");
  return data;
}

async function syncLatestAutoResearchHotspots() {
  try {
    const response = await fetch(`./daily_research_hotspots_latest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return false;
    const payload = await response.json();
    const hotRecords = payload.hot_records || [];
    if (!hotRecords.length) return false;
    upsertHotRecords(hotRecords);
    persistState();
    if (state.activeTab === "feed") {
      renderAll();
      actionStatusEl.textContent = `已同步自动抓取的 ${payload.date || "最新"} 研报热点：${payload.report_count || 0} 条标题，${hotRecords.length} 条热点记录。`;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function syncLatestAutoMarketSnapshot() {
  try {
    const response = await fetch(`/api/market-snapshot/latest?limit=120`, { cache: "no-store" });
    if (!response.ok) return false;
    const payload = await response.json();
    if (!payload.ok) return false;
    if (!(payload.indexes || []).length && !(payload.themes || []).length) return false;
    state.marketSnapshot = payload;
    persistState();
    if (state.activeTab === "feed") renderAll();
    return true;
  } catch (error) {
    return false;
  }
}

function upsertFeedDocsFromBackend(feedRecords) {
  if (!Array.isArray(feedRecords) || !feedRecords.length) return 0;
  const normalized = feedRecords
    .filter((record) => record && (record.raw_text || record.core_view))
    .map((record) => ({
      ...record,
      id: record.id || `startup-feed-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: record.date || formatDateObject(new Date()),
      source_type: record.source_type || "早评",
      source_title: record.source_title || record.title || `${record.date || ""}${record.source_type || "早评"}`,
      speaker: record.speaker || "姜洪斌",
      raw_text: record.raw_text || record.core_view || "",
      imported_at: record.imported_at || new Date().toISOString()
    }));
  upsertFeedRecords(normalized);
  return normalized.length;
}

async function runStartupCatchupSync() {
  try {
    if (actionStatusEl) {
      actionStatusEl.textContent = "正在启动补同步：检查漏掉的研报热点标题和金山共享表格主理人语料...";
    }
    const payload = await postJson("/api/startup-sync/run", {});
    const hotRecords = payload.research?.hot_records || [];
    const feedRecords = payload.shared_feed?.feed_records || [];
    if (hotRecords.length) upsertHotRecords(hotRecords);
    const feedCount = upsertFeedDocsFromBackend(feedRecords);
    if (hotRecords.length || feedCount) {
      persistState();
      renderAll();
    }
    const researchText = payload.research?.ok
      ? `研报补同步 ${payload.research.report_count || 0} 条标题/${payload.research.hot_count || hotRecords.length || 0} 条热点`
      : `研报补同步失败：${payload.research?.error || "未知原因"}`;
    const feedText = payload.shared_feed?.ok
      ? `主理人语料补同步 ${payload.shared_feed.ingested || feedCount || 0} 条`
      : payload.shared_feed?.reauth_required
        ? `金山授权已过期，已恢复本地 ${payload.shared_feed.cached_count || feedCount || 0} 条语料；请重新授权后再补同步`
        : `主理人语料补同步失败：${payload.shared_feed?.error || "未知原因"}`;
    if (actionStatusEl) {
      actionStatusEl.textContent = `${researchText}；${feedText}。自动任务：研报 08:00，金山主理人语料 20:00；打开网页会自动补漏。`;
    }
    return payload;
  } catch (error) {
    if (actionStatusEl) {
      actionStatusEl.textContent = `启动补同步失败：${error.message}`;
    }
    return null;
  }
}

async function runStartupCatchupSync() {
  try {
    if (actionStatusEl) {
      actionStatusEl.textContent = "正在启动补同步：检查漏掉的研报热点标题、金山主理人语料和盘面验证...";
    }
    const payload = await postJson("/api/startup-sync/run", {});
    const hotRecords = payload.research?.hot_records || [];
    const feedRecords = payload.shared_feed?.feed_records || [];
    const marketSnapshot = payload.market_validation || null;
    if (hotRecords.length) upsertHotRecords(hotRecords);
    const feedCount = upsertFeedDocsFromBackend(feedRecords);
    if (marketSnapshot?.ok && ((marketSnapshot.indexes || []).length || (marketSnapshot.themes || []).length)) {
      state.marketSnapshot = marketSnapshot;
    }
    if (hotRecords.length || feedCount || marketSnapshot?.ok) {
      persistState();
      renderAll();
    }
    const researchText = payload.research?.ok
      ? `研报补同步 ${payload.research.report_count || 0} 条标题/${payload.research.hot_count || hotRecords.length || 0} 条热点`
      : `研报补同步失败：${payload.research?.error || "未知原因"}`;
    const feedText = payload.shared_feed?.ok
      ? `主理人语料补同步 ${payload.shared_feed.ingested || feedCount || 0} 条`
      : payload.shared_feed?.reauth_required
        ? `金山授权已过期，已恢复本地 ${payload.shared_feed.cached_count || feedCount || 0} 条语料；请重新授权后再补同步`
        : `主理人语料补同步失败：${payload.shared_feed?.error || "未知原因"}`;
    const marketText = payload.market_validation?.ok
      ? `盘面验证更新到 ${payload.market_validation.snapshot_date || "最新"}`
      : "盘面验证未更新";
    if (actionStatusEl) {
      actionStatusEl.textContent = `${researchText}；${feedText}；${marketText}。自动任务：研报 08:00，金山主理人语料 20:00；打开网页会自动补漏。`;
    }
    queueLogicValidationRefresh("advisor_corpus_startup_sync", 900);
    return payload;
  } catch (error) {
    if (actionStatusEl) {
      actionStatusEl.textContent = `启动补同步失败：${error.message}`;
    }
    return null;
  }
}

function docsFromFeedRecords(records, docType = "advisor_view") {
  return (records || []).map((record) => ({
    id: record.id,
    doc_type: docType,
    source_type: record.source_type,
    date: record.date,
    title: record.source_title || record.title || record.source_type,
    speaker: record.speaker || "姜洪斌",
    raw_text: record.raw_text || record.core_view || "",
    structured: record
  }));
}

function docsFromHotRecords(records) {
  return (records || []).map((record) => ({
    id: record.id,
    doc_type: "research_hotspot",
    source_type: "研报热点",
    date: record.date,
    title: record.theme,
    speaker: "研报平台",
    raw_text: record.raw_text || [record.theme, record.core_logic, record.risk_warning].filter(Boolean).join("。"),
    structured: record
  }));
}

async function syncKnowledgeDocs(feedRecords, hotRecords) {
  const docs = [
    ...docsFromFeedRecords(feedRecords, "advisor_view"),
    ...docsFromHotRecords(hotRecords)
  ].filter((doc) => doc.raw_text);
  if (!docs.length) return null;
  return postJson("/api/knowledge/ingest", { docs });
}

function buildTradeFeedbackRowsForPortfolio(portfolio) {
  if (!portfolio?.dataset) return [];
  return normalizeTrades(portfolio.dataset.trades || []).map((trade) => {
    const themes = getThemesForStock(trade.stock);
    return {
      id: `${portfolio.id || portfolio.name}-${makeTradeSignature(trade)}`,
      portfolio_name: portfolio.name,
      stock: trade.stock,
      theme: themes[0] || "",
      buy_date: trade.buy_date,
      sell_date: trade.sell_date,
      return_pct: trade.return_pct,
      hold_days: trade.hold_days,
      status: trade.status,
      raw_trade: trade
    };
  });
}

async function syncTradeFeedbackForPortfolio(portfolio) {
  const feedbacks = buildTradeFeedbackRowsForPortfolio(portfolio);
  if (!feedbacks.length) return null;
  return postJson("/api/trade-feedback/ingest", { feedbacks });
}

async function syncAllCurrentDataToKnowledgeBase() {
  // 同步支线相互隔离：某一组合反馈写入失败时，不再阻断早评与物料生成。
  const tasks = [
    syncKnowledgeDocs(state.feedRecords, state.hotRecords),
    ...state.portfolios.map((portfolio) => syncTradeFeedbackForPortfolio(portfolio))
  ];
  const results = await Promise.allSettled(tasks);
  return {
    ok: results.every((item) => item.status === "fulfilled"),
    errors: results
      .filter((item) => item.status === "rejected")
      .map((item) => item.reason?.message || String(item.reason || "同步失败"))
  };
}

async function loadAdvisorStrategyProfile() {
  try {
    const response = await fetch("/api/advisor/profile", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    state.advisorStrategyProfile = payload.latest_snapshot || null;
    persistState();
    renderFeed();
    return payload;
  } catch (error) {
    console.warn("advisor profile load failed", error);
    return null;
  }
}

async function loadAdvisorReview(options = {}) {
  const silent = Boolean(options.silent);
  const portfolio = getCurrentPortfolio();
  const query = portfolio?.id ? `?portfolio_id=${encodeURIComponent(portfolio.id)}` : "";
  const statusEl = document.getElementById("advisorReviewStatus");
  if (!silent && statusEl) statusEl.textContent = "正在读取历史语料、持仓快照和收益反馈...";
  try {
    const response = await fetch(`/api/advisor/review${query}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    state.advisorReview = payload;
    renderFeed();
    return payload;
  } catch (error) {
    console.warn("advisor review load failed", error);
    if (statusEl) statusEl.textContent = `复盘数据读取失败：${error.message}`;
    return null;
  }
}

async function generateAdvisorReviewSummary() {
  const button = document.getElementById("generateAdvisorReviewSummaryBtn");
  const statusEl = document.getElementById("advisorReviewStatus");
  const originalText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "生成中...";
  }
  if (statusEl) statusEl.textContent = "正在调用 DeepSeek，把观点、持仓和收益整理成复盘摘要...";
  try {
    const portfolio = getCurrentPortfolio();
    const payload = await postJson("/api/advisor/review/summary", {
      portfolio_id: portfolio?.id || "",
      requested_at: new Date().toISOString()
    });
    if (!payload.ok) throw new Error(payload.error || "复盘摘要生成失败");
    state.advisorReview = payload.review || state.advisorReview;
    state.advisorReviewSummary = {
      generated_at: new Date().toISOString(),
      mode: payload.mode,
      summary: payload.summary,
      llm_error: payload.llm_error || ""
    };
    persistState();
    renderFeed();
    actionStatusEl.textContent = payload.mode === "deepseek"
      ? "DeepSeek 已生成主理人交易逻辑复盘摘要。"
      : `已生成本地兜底复盘摘要${payload.llm_error ? `；DeepSeek 调用失败：${payload.llm_error}` : ""}。`;
    return payload;
  } catch (error) {
    if (statusEl) statusEl.textContent = `复盘摘要生成失败：${error.message}`;
    actionStatusEl.textContent = `复盘摘要生成失败：${error.message}`;
    return null;
  } finally {
    const nextButton = document.getElementById("generateAdvisorReviewSummaryBtn");
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = originalText || "DeepSeek 生成复盘摘要";
    }
  }
}

async function updateAdvisorStrategyProfile() {
  const button = document.getElementById("updateAdvisorProfileBtn");
  const statusEl = document.getElementById("advisorProfileStatus");
  const originalText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "学习中...";
  }
  if (statusEl) statusEl.textContent = "正在同步最新语料、交易反馈和持仓记录，并调用大模型更新主理人画像...";
  try {
    await syncAllCurrentDataToKnowledgeBase();
    const payload = await postJson("/api/advisor/profile/update", {
      local_profile: buildAdvisorLearningProfile(),
      requested_at: new Date().toISOString(),
    });
    state.advisorStrategyProfile = {
      id: payload.id,
      profile_date: payload.profile_date,
      profile: payload.profile,
      source_summary: payload.source_summary,
      mode: payload.mode,
      created_at: new Date().toISOString(),
    };
    queueLogicValidationRefresh("advisor_profile_updated", 600);
    persistState();
    renderFeed();
    actionStatusEl.textContent = payload.mode === "llm"
      ? "主理人操作画像已由大模型更新并保存。"
      : `主理人操作画像已用本地规则兜底更新并保存${payload.llm_error ? `；大模型调用失败：${payload.llm_error}` : ""}。`;
    return payload;
  } catch (error) {
    if (statusEl) statusEl.textContent = `画像更新失败：${error.message}`;
    actionStatusEl.textContent = `画像更新失败：${error.message}`;
    return null;
  } finally {
    const nextButton = document.getElementById("updateAdvisorProfileBtn");
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = originalText || "更新主理人操作画像";
    }
  }
}

function logicValidationInputPreview(portfolio = getCurrentPortfolio()) {
  const dataset = portfolio?.dataset || {};
  const snapshots = dataset.daily_snapshots || dataset.snapshots || [];
  const holdingRows = (Array.isArray(snapshots) ? snapshots : [])
    .map((snapshot) => ({
      date: getSnapshotDate(snapshot),
      positions: positionsFromSnapshot(snapshot),
    }))
    .filter((row) => row.date && row.positions.length);
  if (!holdingRows.length) {
    const positions = normalizeOpenPositions(dataset.open_positions || []);
    if (positions.length) holdingRows.push({ date: dataset.latest_snapshot_date || "当前", positions });
  }
  return {
    holdingDays: holdingRows.length,
    holdingPositions: holdingRows.reduce((sum, row) => sum + row.positions.length, 0),
    ledgerEvents: (dataset.transaction_ledger || []).length,
  };
}

function logicValidationDatasetSignature(dataset = {}) {
  const snapshots = dataset.daily_snapshots || dataset.snapshots || [];
  const snapshotParts = (Array.isArray(snapshots) ? snapshots : []).map((snapshot) => {
    const positions = positionsFromSnapshot(snapshot)
      .map((position) => [
        getHoldingPositionKey(position),
        parseNumber(position.quantity) ?? "",
        parseNumber(position.weight ?? position.weight_pct) ?? "",
      ].join(":"))
      .sort();
    return [getSnapshotDate(snapshot), ...positions].join("|");
  });
  const ledgerParts = (dataset.transaction_ledger || []).map((item) => [
    item.id || "",
    item.date || "",
    item.action || "",
    item.code || item.stock || "",
    item.quantity ?? item.target_quantity ?? "",
  ].join(":"));
  return JSON.stringify([snapshotParts, ledgerParts]);
}

async function loadLatestLogicValidation() {
  const portfolio = getCurrentPortfolio();
  if (!portfolio) return null;
  try {
    const response = await fetch(`/api/validation/consistency/latest?portfolio_id=${encodeURIComponent(portfolio.id)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    const result = payload?.result;
    if (result?.validation?.version !== "logic_validation_v2_directional" || result.portfolio_id !== portfolio.id) return null;
    result.refreshed_at = result.refreshed_at || result.generated_at || "";
    state.logicValidationResult = result;
    logicValidationAutoStatus = "已读取上次完成的大模型验证结果；持仓或调仓变化后会重新计算。";
    persistState();
    renderValidation(portfolio.analysis);
    return result;
  } catch (error) {
    console.warn("logic validation restore failed", error);
    return null;
  }
}

async function validateLogicConsistencyWithLlm(options = {}) {
  if (logicValidationAutoPending) {
    logicValidationAutoRerunRequested = true;
    return null;
  }
  const portfolio = getCurrentPortfolio();
  const statusEl = document.getElementById("logicValidationStatus");
  if (!portfolio) {
    logicValidationAutoStatus = "等待导入主理人持仓后自动验证。";
    if (statusEl) statusEl.textContent = logicValidationAutoStatus;
    return null;
  }
  const generation = options.generation ?? logicValidationAutoGeneration;
  const portfolioId = portfolio.id;
  logicValidationAutoPending = true;
  const preview = logicValidationInputPreview(portfolio);
  logicValidationAutoStatus = `已提交 ${preview.holdingDays} 个持仓日、${preview.holdingPositions} 条持仓明细和 ${preview.ledgerEvents} 条交易流水，正在调用大模型验证，完整历史通常需要 1-3 分钟...`;
  renderValidation(portfolio.analysis);
  try {
    await syncAllCurrentDataToKnowledgeBase();
    if (generation !== logicValidationAutoGeneration || getCurrentPortfolio()?.id !== portfolioId) {
      logicValidationAutoRerunRequested = true;
      return { ok: false, stale: true };
    }
    const payload = await postJson("/api/validation/consistency", {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        dataset: portfolio.dataset
      },
      local_profile: buildAdvisorLearningProfile(),
      strategy_profile: state.advisorStrategyProfile,
      requested_at: new Date().toISOString(),
      trigger_reason: options.reason || "automatic_refresh",
      validation_scope: "directional_semantic",
      require_llm: true
    });
    if (generation !== logicValidationAutoGeneration || getCurrentPortfolio()?.id !== portfolioId) {
      logicValidationAutoRerunRequested = true;
      return { ok: false, stale: true };
    }
    payload.refreshed_at = new Date().toISOString();
    if (options.automatic === false) {
      payload.manual_refreshed_at = payload.refreshed_at;
    } else {
      payload.auto_refreshed_at = payload.refreshed_at;
    }
    payload.trigger_reason = options.reason || "automatic_refresh";
    state.logicValidationResult = payload;
    logicValidationAutoStatus = options.automatic === false
      ? "大模型手动验证已完成；结果已保存到本地数据库。"
      : "大模型自动验证已完成；结果已保存，持仓或调仓变化后会再次刷新。";
    persistState();
    return payload;
  } catch (error) {
    logicValidationAutoStatus = `大模型自动验证暂未完成：${error.message}。系统将在 5 分钟后自动重试。`;
    const nextStatusEl = document.getElementById("logicValidationStatus");
    if (nextStatusEl) nextStatusEl.textContent = logicValidationAutoStatus;
    window.clearTimeout(logicValidationAutoTimer);
    logicValidationAutoTimer = window.setTimeout(() => {
      queueLogicValidationRefresh("automatic_retry", 0);
    }, 5 * 60 * 1000);
    return null;
  } finally {
    logicValidationAutoPending = false;
    const currentPortfolio = getCurrentPortfolio();
    if (currentPortfolio?.id === portfolioId) renderValidation(currentPortfolio.analysis);
    if (logicValidationAutoRerunRequested || generation !== logicValidationAutoGeneration) {
      logicValidationAutoRerunRequested = false;
      window.clearTimeout(logicValidationAutoTimer);
      logicValidationAutoTimer = window.setTimeout(() => {
        validateLogicConsistencyWithLlm({
          automatic: true,
          reason: "data_changed_rerun",
          generation: logicValidationAutoGeneration
        });
      }, 100);
    }
  }
}

async function refreshLogicValidationManually() {
  const button = document.getElementById("refreshLogicValidationBtn");
  if (!getCurrentPortfolio()) {
    logicValidationAutoStatus = "请先选择一个包含持仓数据的组合。";
    const statusEl = document.getElementById("logicValidationStatus");
    if (statusEl) statusEl.textContent = logicValidationAutoStatus;
    return null;
  }

  if (logicValidationAutoPending) {
    logicValidationAutoGeneration += 1;
    logicValidationAutoRerunRequested = true;
    logicValidationAutoStatus = "当前验证仍在执行；已安排完成后立即重新验证。";
    const statusEl = document.getElementById("logicValidationStatus");
    if (statusEl) statusEl.textContent = logicValidationAutoStatus;
    return null;
  }

  const originalText = button?.textContent || "立即刷新";
  if (button) {
    button.disabled = true;
    button.textContent = "验证中...";
  }
  logicValidationAutoGeneration += 1;
  const generation = logicValidationAutoGeneration;
  try {
    const result = await validateLogicConsistencyWithLlm({
      automatic: false,
      reason: "manual_refresh",
      generation,
    });
    actionStatusEl.textContent = result?.ok
      ? "大模型言行一致度验证已刷新。"
      : logicValidationAutoStatus || "言行一致度验证暂未完成。";
    return result;
  } finally {
    const nextButton = document.getElementById("refreshLogicValidationBtn");
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = originalText;
    }
  }
}

function queueLogicValidationRefresh(reason = "data_changed", delay = 1400) {
  if (!getCurrentPortfolio()) return;
  logicValidationAutoGeneration += 1;
  logicValidationAutoStatus = "检测到数据变化，大模型方向级一致性验证已进入自动刷新队列...";
  const statusEl = document.getElementById("logicValidationStatus");
  if (statusEl) statusEl.textContent = logicValidationAutoStatus;
  window.clearTimeout(logicValidationAutoTimer);
  logicValidationAutoTimer = window.setTimeout(() => {
    validateLogicConsistencyWithLlm({
      automatic: true,
      reason,
      generation: logicValidationAutoGeneration
    });
  }, delay);
}

function getLatestHotDate() {
  return state.hotRecords
    .map((item) => item.date)
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function normalizeHotThemeName(theme) {
  return String(theme || "")
    .replace(/(行业|产业|板块|概念|赛道|专题|报告|研究|周报|月报|点评)$/g, "")
    .trim();
}

function mergeHotRecordGroup(records, displayRank) {
  const rows = [...records].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const primary = rows[0] || {};
  const theme = normalizeHotThemeName(primary.theme) || primary.theme;
  const logicPieces = unique(rows.flatMap((item) => String(item.core_logic || item.raw_text || "").split("；")).map((item) => item.trim()).filter(Boolean)).slice(0, 5);
  const riskPieces = unique(rows.map((item) => item.risk_warning).filter(Boolean)).slice(0, 2);
  const stocks = unique(rows.flatMap((item) => item.related_stocks || []));
  return {
    ...primary,
    theme,
    rank: displayRank,
    original_rank: primary.rank || displayRank,
    report_count: rows.reduce((sum, item) => sum + (Number(item.report_count) || 0), 0) || rows.length,
    related_stocks: stocks,
    core_logic: logicPieces.join("；") || primary.core_logic || primary.raw_text || "",
    risk_warning: riskPieces.join("；") || primary.risk_warning || "",
    raw_text: unique(rows.map((item) => item.raw_text).filter(Boolean)).join("\n"),
    merged_count: rows.length
  };
}

function getHotRecordsByDate(date) {
  const grouped = new Map();
  state.hotRecords
    .filter((item) => item.date === date)
    .forEach((item) => {
      const theme = normalizeHotThemeName(item.theme);
      if (!theme) return;
      const key = `${date}|${theme}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ ...item, theme });
    });
  return [...grouped.values()]
    .sort((a, b) => {
      const left = Math.min(...a.map((item) => item.rank || 99));
      const right = Math.min(...b.map((item) => item.rank || 99));
      const leftCount = a.reduce((sum, item) => sum + (Number(item.report_count) || 1), 0);
      const rightCount = b.reduce((sum, item) => sum + (Number(item.report_count) || 1), 0);
      return left - right || rightCount - leftCount;
    })
    .map((records, index) => mergeHotRecordGroup(records, index + 1));
}

function getPriorMorningRecords(beforeDate, limit = 12) {
  return state.feedRecords
    .filter((item) => item.source_type === "早评" && (!beforeDate || (item.date || "") < beforeDate))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, limit);
}

function averageNumbers(values) {
  const valid = (values || []).filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function findMarketThemeRow(theme) {
  const themes = state.marketSnapshot?.themes || [];
  return themes.find((item) => item.theme === theme)
    || themes.find((item) => item.theme && theme && (item.theme.includes(theme) || theme.includes(item.theme)))
    || null;
}

function summarizeMarketMove(theme) {
  const themeRow = findMarketThemeRow(theme);
  const boards = themeRow?.boards || [];
  if (!boards.length) {
    return {
      has_market: false,
      snapshot_date: state.marketSnapshot?.snapshot_date || "",
      price_status: "待抓取盘面",
      price_score: 0,
      price_summary: "暂无真实价格数据"
    };
  }
  const sortedBoards = [...boards].sort((a, b) => Math.abs(b.pct_5d ?? b.pct_3d ?? b.pct_change ?? 0) - Math.abs(a.pct_5d ?? a.pct_3d ?? a.pct_change ?? 0));
  const leadBoard = sortedBoards[0] || boards[0];
  const pctChange = averageNumbers(boards.map((item) => item.pct_change));
  const pct3d = averageNumbers(boards.map((item) => item.pct_3d));
  const pct5d = averageNumbers(boards.map((item) => item.pct_5d));
  const volumeRatio = averageNumbers(boards.map((item) => item.volume_ratio_5d));
  let priceStatus = "震荡观察";
  let priceScore = 0;
  if ((pct5d ?? 0) >= 2 || (pct3d ?? 0) >= 1.2) {
    priceStatus = "价格转强";
    priceScore = 1;
  } else if ((pct5d ?? 0) <= -2 || (pct3d ?? 0) <= -1.2) {
    priceStatus = "价格走弱";
    priceScore = -1;
  } else if ((pctChange ?? 0) >= 1) {
    priceStatus = "日内走强";
    priceScore = 0.5;
  } else if ((pctChange ?? 0) <= -1) {
    priceStatus = "日内承压";
    priceScore = -0.5;
  }
  if (volumeRatio != null && volumeRatio >= 1.2 && priceScore > 0) priceStatus = "放量走强";
  if (volumeRatio != null && volumeRatio >= 1.2 && priceScore < 0) priceStatus = "放量下跌";
  return {
    has_market: true,
    snapshot_date: state.marketSnapshot?.snapshot_date || "",
    snapshot_time: state.marketSnapshot?.snapshot_time || "",
    board_name: leadBoard.name || "",
    board_status: leadBoard.status || "",
    pct_change: pctChange,
    pct_3d: pct3d,
    pct_5d: pct5d,
    volume_ratio_5d: volumeRatio,
    price_status: priceStatus,
    price_score: priceScore,
    price_summary: `${leadBoard.name || "匹配板块"}：今日${pctChange == null ? "—" : `${num(pctChange)}%`}，近3日${pct3d == null ? "—" : `${num(pct3d)}%`}，近5日${pct5d == null ? "—" : `${num(pct5d)}%`}`
  };
}

function classifyThemeMove(row) {
  const hotRising = row.rank_delta == null || row.rank_delta > 0;
  const hotFalling = row.rank_delta != null && row.rank_delta < 0;
  const recurring = row.count >= 2;
  const priceScore = row.price_score || 0;
  if (!row.has_market) return "缺少盘面验证，先补抓真实价格";
  if (hotRising && priceScore > 0) return "研报热度与价格共振";
  if ((hotRising || recurring) && priceScore < 0) return "研报热但交易偏弱，等待价格确认";
  if ((hotRising || recurring) && priceScore === 0) return "研报热度延续，价格仍需观察";
  if (hotFalling && priceScore < 0) return "热度降温且价格走弱";
  if (hotFalling && priceScore > 0) return "价格修复领先，研报热度未同步";
  return "存量主线观察";
}

function getThemeHistoryRows(latestDate) {
  const latestRows = getHotRecordsByDate(latestDate);
  const rows = latestRows.map((latest) => {
    const history = unique(state.hotRecords.map((item) => item.date).filter(Boolean))
      .filter((date) => date !== latestDate)
      .sort((a, b) => (b || "").localeCompare(a || ""))
      .map((date) => getHotRecordsByDate(date).find((item) => item.theme === latest.theme))
      .filter(Boolean);
    const previous = history[0] || null;
    const allThemeRows = unique(state.hotRecords.map((item) => item.date).filter(Boolean))
      .flatMap((date) => getHotRecordsByDate(date).filter((item) => item.theme === latest.theme));
    const bestRank = Math.min(...allThemeRows.map((item) => item.rank || 99));
    const firstSeen = state.hotRecords
      .filter((item) => normalizeHotThemeName(item.theme) === latest.theme)
      .map((item) => item.date)
      .filter(Boolean)
      .sort()[0] || latestDate;
    const rankDelta = previous?.rank ? previous.rank - latest.rank : null;
    const row = {
      ...summarizeMarketMove(latest.theme),
      theme: latest.theme,
      latest_rank: latest.rank,
      previous_rank: previous?.rank || null,
      rank_delta: rankDelta,
      best_rank: bestRank === 99 ? null : bestRank,
      count: allThemeRows.length,
      first_seen: firstSeen,
      latest_logic: latest.core_logic,
      latest_risk: latest.risk_warning
    };
    return {
      ...row,
      combined_status: classifyThemeMove(row)
    };
  });
  return rows
    .filter((item) => !NON_PRICE_THEMES.includes(item.theme))
    .sort((a, b) => {
      if (a.has_market !== b.has_market) return a.has_market ? -1 : 1;
      return (a.latest_rank || 99) - (b.latest_rank || 99);
    });
}

function buildHotspotInsightPackage() {
  const latestDate = getLatestHotDate();
  if (!latestDate) {
    return {
      latestDate: "",
      latestHotRows: [],
      historyRows: [],
      styleRecords: [],
      insightText: "尚未导入研报热点或市场热点。请先在来源类型中选择“研报热点”或“市场热点”并投喂原文。",
      morningDraft: "暂无可生成的早评辅助稿。"
    };
  }

  const latestHotRows = getHotRecordsByDate(latestDate);
  const historyRows = getThemeHistoryRows(latestDate);
  const styleRecords = getPriorMorningRecords(latestDate);
  const topThemes = latestHotRows.slice(0, 5).map((item) => item.theme);
  const risingThemes = historyRows
    .filter((item) => item.rank_delta != null && item.rank_delta > 0)
    .sort((a, b) => b.rank_delta - a.rank_delta)
    .slice(0, 3);
  const recurringThemes = historyRows
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const heatPriceResonance = historyRows
    .filter((item) => item.has_market && (item.rank_delta == null || item.rank_delta > 0 || item.count >= 2) && (item.price_score || 0) > 0)
    .slice(0, 3);
  const heatPriceDivergence = historyRows
    .filter((item) => item.has_market && (item.rank_delta == null || item.rank_delta > 0 || item.count >= 2) && (item.price_score || 0) < 0)
    .slice(0, 3);
  const priorThemes = unique(styleRecords.flatMap((item) => item.matched_themes || item.focus_directions || []));
  const resonanceThemes = topThemes.filter((theme) => priorThemes.includes(theme));
  const primary = latestHotRows[0];
  const riskSentences = unique(latestHotRows.map((item) => item.risk_warning).filter(Boolean)).slice(0, 2);
  const styleAdvice = unique(styleRecords.map((item) => item.operation_advice).filter(Boolean)).slice(0, 2);

  const insightText = [
    `今日研报热点集中在 ${topThemes.join("、") || "暂无明确主题"}。`,
    risingThemes.length ? `${risingThemes.map((item) => `【${item.theme}】较上次排名提升 ${item.rank_delta} 位`).join("，")}，说明资金与研究关注度正在抬升。` : "从历史排名看，今日热点更多体现为存量主线延续，暂未识别出明显排名跃升主题。",
    recurringThemes.length ? `${recurringThemes.map((item) => `【${item.theme}】出现 ${item.count} 次`).join("，")}，属于近期反复出现的主线。` : "当前热点历史沉淀较少，建议继续观察连续性。",
    heatPriceResonance.length ? `${heatPriceResonance.map((item) => `【${item.theme}】${item.price_summary}`).join("；")}，研报热度与真实价格表现形成共振。` : "",
    heatPriceDivergence.length ? `${heatPriceDivergence.map((item) => `【${item.theme}】${item.price_summary}`).join("；")}，属于研报热但交易偏弱，需要等待价格止跌或放量确认。` : "",
    resonanceThemes.length ? `与主理人历史早评形成共振的方向是 ${resonanceThemes.join("、")}，可优先作为今日早评主线。` : "今日热点与历史早评重合度不高，可作为新增观察方向，早评表达上建议保持验证口径。",
    primary ? `第一热点【${primary.theme}】的核心表述可围绕：${primary.core_logic || "研报关注度靠前，需结合盘面强度继续验证"}。` : ""
  ].filter(Boolean).join("\n");

  const morningDraft = [
    `今日盘前可以重点围绕 ${topThemes.slice(0, 3).join("、") || "市场结构性方向"} 展开。`,
    resonanceThemes.length
      ? `其中 ${resonanceThemes.join("、")} 与我们前期持续跟踪的方向有延续性，说明主线并没有完全切换，更多是围绕高景气方向做节奏分化。`
      : `今天研报端出现的热点与前期早评重合度不算高，建议先作为观察方向，等盘面强度和量能确认后再提高优先级。`,
    risingThemes.length
      ? `${risingThemes.map((item) => item.theme).join("、")} 的热度边际抬升比较明显，盘中可以关注是否有放量承接和核心标的带动。`
      : `操作上不建议简单追逐排名靠前的主题，更要看前排标的能否形成持续性。`,
    styleAdvice.length ? `延续之前早评里的操作思路：${styleAdvice[0]}。` : "操作上仍以控制仓位、低吸核心、避免追高为主。",
    riskSentences.length ? `风险上重点留意：${riskSentences.join("；")}。` : "风险上注意高位兑现、板块轮动过快和指数震荡带来的追高回撤。",
    "以上内容可作为早评框架，实际表达时再结合开盘量能、指数位置和核心标的反馈进行微调。"
  ].filter(Boolean).join("\n\n");

  return {
    latestDate,
    latestHotRows,
    historyRows,
    styleRecords,
    insightText,
    morningDraft
  };
}

function renderMarketValidationPanel(snapshot) {
  if (!snapshot?.themes?.length && !snapshot?.indexes?.length) {
    return `
      <div class="panel-card bento-col-12">
        <h3>盘面验证</h3>
        <p class="lead">抓取真实行情后，会把研报热点和板块价格表现放在一起校验。</p>
        <div class="empty-state">暂无行情快照。点击“抓取盘面验证”后，可查看指数、热点方向近 3 日/5 日走势和强弱状态。</div>
      </div>
    `;
  }
  const indexRows = snapshot.indexes || [];
  const themeRows = snapshot.themes || [];
  return `
    <div class="panel-card bento-col-12">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px;">
        <div>
          <h3>盘面验证</h3>
          <p class="lead">基于真实行情辅助判断研报热点所处阶段，结合价格、趋势和量能观察资金反馈。</p>
        </div>
        <span class="feed-sync-badge">${escapeHtml(snapshot.snapshot_date || "")} ${escapeHtml((snapshot.snapshot_time || "").slice(11, 19))}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th class="left">方向/指数</th><th class="left">匹配板块</th><th>今日</th><th>近3日</th><th>近5日</th><th>量能</th><th class="left">状态</th></tr>
          </thead>
          <tbody>
            ${indexRows.map((item) => `
              <tr>
                <td class="left"><strong>${escapeHtml(item.name)}</strong></td>
                <td class="left">指数</td>
                <td class="${(item.pct_change || 0) >= 0 ? "up-text" : "down-text"}">${num(item.pct_change)}%</td>
                <td>${item.pct_3d == null ? "—" : `${num(item.pct_3d)}%`}</td>
                <td>${item.pct_5d == null ? "—" : `${num(item.pct_5d)}%`}</td>
                <td>${item.volume_ratio_5d == null ? "—" : `${num(item.volume_ratio_5d)}x`}</td>
                <td class="left">${escapeHtml(item.status || "观察")}</td>
              </tr>
            `).join("")}
            ${themeRows.flatMap((theme) => (theme.boards || []).map((board, index) => `
              <tr>
                <td class="left">${index === 0 ? `<strong>${escapeHtml(theme.theme)}</strong>` : ""}</td>
                <td class="left">${escapeHtml(board.name)}<br><span style="color:var(--muted);">${escapeHtml(board.category || "")} ${escapeHtml(board.code || "")}</span></td>
                <td class="${(board.pct_change || 0) >= 0 ? "up-text" : "down-text"}">${num(board.pct_change)}%</td>
                <td>${board.pct_3d == null ? "—" : `${num(board.pct_3d)}%`}</td>
                <td>${board.pct_5d == null ? "—" : `${num(board.pct_5d)}%`}</td>
                <td>${board.volume_ratio_5d == null ? "—" : `${num(board.volume_ratio_5d)}x`}</td>
                <td class="left">${escapeHtml(board.status || "观察")}</td>
              </tr>
            `)).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function countItems(items) {
  const counter = {};
  (items || []).filter(Boolean).forEach((item) => {
    counter[item] = (counter[item] || 0) + 1;
  });
  return Object.entries(counter)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getAllImportedTrades() {
  return state.portfolios.flatMap((portfolio) => normalizeTrades(portfolio.dataset?.trades || []));
}

function getAllImportedOpenPositions() {
  return state.portfolios.flatMap((portfolio) => normalizeOpenPositions(portfolio.dataset?.open_positions || []));
}

function firstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && value !== "") return value;
  }
  return fallback;
}

function getCurrentHoldingCodes() {
  const current = getCurrentPortfolio();
  return unique(
    normalizeOpenPositions(current?.dataset?.open_positions || [])
      .map((position) => position.code)
      .filter(Boolean)
  );
}

function getCurrentRiskHoldingKey() {
  const current = getCurrentPortfolio();
  if (!current) return "";
  const rows = typeof getCurrentHoldingRows === "function"
    ? getCurrentHoldingRows()
    : normalizeOpenPositions(current.dataset?.open_positions || []);
  const latestDate = current.analysis?.summary?.latest_snapshot_date || current.meta?.latestDate || "";
  const signature = rows
    .map((position) => {
      const code = String(position.code || "").replace(/\D/g, "").slice(-6);
      if (!code) return "";
      return [
        code,
        position.quantity ?? "",
        position.weight ?? "",
        position.market_value ?? "",
        position.cost_price ?? "",
      ].join(":");
    })
    .filter(Boolean)
    .sort()
    .join("|");
  return `${current.id || ""}#${latestDate}#${signature}`;
}

function getHoldingQuoteMap() {
  return state.holdingQuotes?.byCode || {};
}

function getHoldingQuoteByCode(code) {
  const normalized = String(code || "").replace(/\D/g, "").slice(-6);
  return normalized ? getHoldingQuoteMap()[normalized] : null;
}

function holdingQuotesAreFreshForCodes(codes) {
  if (!codes.length) return true;
  if ((state.holdingQuotes?.snapshot_date || "") !== formatDateObject(new Date())) return false;
  const byCode = getHoldingQuoteMap();
  return codes.every((code) => byCode[code]);
}

function maybeRefreshHoldingQuotesForOverview() {
  if (state.activeTab !== "style") return;
  const codes = getCurrentHoldingCodes();
  if (!codes.length) return;
  if (holdingQuotesAreFreshForCodes(codes)) return;
  const key = `${formatDateObject(new Date())}|${codes.join(",")}`;
  if (lastHoldingQuotesAutoKey === key || holdingQuotesPending) return;
  lastHoldingQuotesAutoKey = key;
  refreshHoldingQuotesFromBackend();
}

async function refreshHoldingQuotesFromBackend() {
  const current = getCurrentPortfolio();
  const codes = getCurrentHoldingCodes();
  if (!current || !codes.length || holdingQuotesPending) return null;
  const portfolioId = current.id;
  const button = document.getElementById("refreshHoldingQuotesBtn");
  const statusEl = document.getElementById("holdingQuotesStatus");
  const originalText = button?.textContent || "";
  holdingQuotesPending = true;
  if (button) {
    button.disabled = true;
    button.textContent = "刷新中...";
  }
  if (statusEl) statusEl.textContent = `正在抓取 ${codes.length} 只持仓的最新涨跌幅...`;
  try {
    // 统一由后台账本完成：逐日结转 -> 拉取行情 -> 重算收益 -> 保存完整快照。
    // 这里不能再用前端拼出的精简快照覆盖 portfolio_states.dataset_json，
    // 否则 is_carried、carried_from_date、行情状态等账本字段会丢失。
    const payload = await postJson("/api/holding-sync/run", {
      portfolio_id: portfolioId,
      reason: "manual_quote_refresh",
      force: true,
    });
    if (!payload?.portfolio?.dataset) throw new Error("后台同步未返回完整持仓账本");
    if (getCurrentPortfolio()?.id !== portfolioId) return { ok: false, stale: true };

    current.dataset = payload.portfolio.dataset;
    current.analysis = computeAnalysis(current.dataset);
    current.meta = buildDatasetMeta(current.dataset, current.name);
    const byCode = {};
    (payload.latest_quotes || []).forEach((quote) => {
      if (quote.code) byCode[quote.code] = quote;
    });
    state.holdingQuotes = {
      snapshot_date: current.dataset.latest_snapshot_date || formatDateObject(new Date()),
      snapshot_time: payload.synced_at || new Date().toISOString(),
      source: "后台统一同步（东方财富/腾讯/新浪）",
      byCode
    };
    state.logicValidationResult = null;
    // 保留旧风控结果；新持仓的风控计算成功返回后再原子替换。
    persistState();
    renderAll();
    const missingCount = (payload.missing_price_pairs || []).length;
    actionStatusEl.textContent = missingCount
      ? `持仓行情已刷新并保存；${missingCount} 条价格暂未取得，后台将在下次刷新时重试。`
      : `持仓行情与账本已统一刷新：${payload.synced_at || "刚刚"}，覆盖 ${Object.keys(byCode).length}/${codes.length} 只标的；结转状态、每日收益和风控 K 线已同步。`;
    return payload;
  } catch (error) {
    if (statusEl) statusEl.textContent = `持仓行情刷新失败：${error.message}`;
    actionStatusEl.textContent = `持仓行情刷新失败：${error.message}`;
    return null;
  } finally {
    holdingQuotesPending = false;
    const nextButton = document.getElementById("refreshHoldingQuotesBtn");
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = originalText || "刷新涨跌幅";
    }
  }
}

function getCurrentHoldingRows() {
  const current = getCurrentPortfolio();
  const rawPositions = current?.dataset?.open_positions || [];
  const normalized = normalizeOpenPositions(rawPositions);
  const sourceQuantityUnavailable = current?.dataset?.source_meta?.quantity_available === false;
  return normalized.map((position, index) => {
    const raw = rawPositions[index] || {};
    const quote = getHoldingQuoteByCode(position.code) || {};
    const quantityIsPlaceholder = Boolean(raw.quantity_is_placeholder) || sourceQuantityUnavailable;
    return {
      stock: position.stock,
      code: position.code,
      industry: position.industry_name && position.industry_name !== "未识别" ? position.industry_name : firstValue(raw, ["industry_name", "所属行业", "申万行业"], "未识别"),
      quantity: quantityIsPlaceholder ? "" : firstValue(raw, ["quantity", "qty", "证券数量", "持仓数量", "成交数量"], position.quantity ?? ""),
      weight: sourceQuantityUnavailable ? "" : firstValue(raw, ["weight", "仓位"], ""),
      market_value: quantityIsPlaceholder ? "" : firstValue(raw, ["market_value", "市值"], ""),
      latest_price: quote.price ?? firstValue(raw, ["latest_price", "最新价"], ""),
      cost_price: sourceQuantityUnavailable
        ? firstValue(raw, ["cost_price", "成本价", "buy_price", "买入价"], position.buy_price ?? "")
        : quantityIsPlaceholder ? "" : firstValue(raw, ["cost_price", "成本价", "buy_price", "买入价"], position.buy_price ?? ""),
      return_pct: quantityIsPlaceholder ? "" : firstValue(raw, ["unrealized_return_pct", "持有收益率", "收益率"], ""),
      day_pct_change: quote.pct_change,
      day_change: quote.change,
      pnl: quantityIsPlaceholder ? "" : firstValue(raw, ["unrealized_pnl", "持有收益", "浮盈亏"], ""),
      note: firstValue(raw, ["note", "备注"], position.note || "")
    };
  });
}

function upsertTodayHoldingSnapshot() {
  const current = getCurrentPortfolio();
  if (!current) return 0;
  const dataset = current.dataset || {};
  const snapshotDate = state.holdingQuotes?.snapshot_date || formatDateObject(new Date());
  const positions = getCurrentHoldingRows().map((item) => {
    const quote = getHoldingQuoteByCode(item.code) || {};
    return {
      stock: item.stock,
      code: item.code,
      quantity: item.quantity,
      weight: item.weight,
      market_value: item.market_value,
      latest_price: item.latest_price,
      cost_price: item.cost_price,
      day_pct_change: item.day_pct_change,
      day_change: item.day_change,
      return_pct: item.return_pct,
      pnl: item.pnl,
      industry: item.industry,
      note: item.note,
      quote_date: quote.quote_date || snapshotDate,
      quote_time: quote.quote_time || "",
      quote_source: quote.source || state.holdingQuotes?.source || "",
    };
  });
  const snapshot = {
    date: snapshotDate,
    snapshot_date: snapshotDate,
    snapshot_time: state.holdingQuotes?.snapshot_time || new Date().toISOString(),
    source: state.holdingQuotes?.source || "本地持仓行情快照",
    open_positions: positions,
    positions,
    summary: getHoldingSummary(positions),
    saved_at: new Date().toISOString(),
  };
  const existing = Array.isArray(dataset.daily_snapshots) ? dataset.daily_snapshots : [];
  dataset.daily_snapshots = [
    ...existing.filter((item) => getSnapshotDate(item) !== snapshotDate),
    snapshot,
  ].sort((a, b) => (getSnapshotDate(a) || "").localeCompare(getSnapshotDate(b) || ""));
  current.dataset = dataset;
  current.analysis = computeAnalysis(dataset);
  current.meta = buildDatasetMeta(dataset, current.name);
  return positions.length;
}

function renderHoldingCell(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") return num(value);
  return escapeHtml(String(value));
}

function renderHoldingQuoteDate(item) {
  const quoteDate = normalizeDateInput(item?.quote_date || "");
  if (!quoteDate) return "—";
  const status = item?.quote_status || "行情日期与持仓日期一致";
  return `<span title="${escapeHtml(status)}">${escapeHtml(quoteDate)}</span>`;
}

function returnClassName(value) {
  const parsed = parseNumber(value);
  if (parsed == null) return "";
  return parsed >= 0 ? "up-text" : "down-text";
}

function getHoldingSummary(rows) {
  let marketTotal = 0;
  let pnlTotal = 0;
  let weightedDay = 0;
  let weightedReturn = 0;
  let returnWeight = 0;
  rows.forEach((row) => {
    const marketValue = parseMoneyValue(row.market_value);
    const pnl = parseMoneyValue(row.pnl);
    const dayPct = parsePctPointValue(row.day_pct_change);
    const returnPct = parsePercentValue(row.return_pct);
    if (marketValue != null) {
      marketTotal += marketValue;
      if (dayPct != null) weightedDay += marketValue * dayPct;
      if (returnPct != null) {
        weightedReturn += marketValue * returnPct;
        returnWeight += marketValue;
      }
    }
    if (pnl != null) pnlTotal += pnl;
  });
  const costTotal = marketTotal - pnlTotal;
  const totalReturnPct = costTotal > 0 ? (pnlTotal / costTotal) * 100 : (returnWeight ? weightedReturn / returnWeight : null);
  const dayPct = marketTotal > 0 ? weightedDay / marketTotal : null;
  return {
    marketTotal,
    pnlTotal,
    totalReturnPct,
    dayPct,
  };
}

function extractSnapshotStocks(snapshot) {
  const rawPositions = snapshot?.open_positions || snapshot?.positions || snapshot?.holdings || snapshot?.持仓 || [];
  if (Array.isArray(rawPositions) && rawPositions.length) {
    return unique(
      rawPositions
        .map((item) => sanitizeStockName(item.stock || item["证券名称"] || item.name || item))
        .filter(Boolean)
    );
  }
  const rawText = JSON.stringify(snapshot || "");
  return unique(
    (rawText.match(/[\u4e00-\u9fa5A-Z]{2,12}\(\d{6}\)/g) || [])
      .map((item) => sanitizeStockName(item))
      .filter(Boolean)
  );
}

function getSnapshotDate(snapshot) {
  return normalizeDateInput(snapshot?.date || snapshot?.snapshot_date || snapshot?.持仓日期 || snapshot?.日期 || "");
}

function getRecentAdjustmentRows() {
  const current = getCurrentPortfolio();
  const dataset = current?.dataset || {};
  const rows = [];
  const snapshots = (dataset.daily_snapshots || dataset.snapshots || [])
    .map((snapshot) => ({ snapshot, date: getSnapshotDate(snapshot), stocks: extractSnapshotStocks(snapshot) }))
    .filter((item) => item.date && item.stocks.length)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (snapshots.length >= 2) {
    const previous = snapshots[snapshots.length - 2];
    const latest = snapshots[snapshots.length - 1];
    const previousSet = new Set(previous.stocks);
    const latestSet = new Set(latest.stocks);
    latest.stocks.filter((stock) => !previousSet.has(stock)).forEach((stock) => {
      rows.push({ date: latest.date, action: "调入", stock, note: `较 ${previous.date} 新增持仓` });
    });
    previous.stocks.filter((stock) => !latestSet.has(stock)).forEach((stock) => {
      rows.push({ date: latest.date, action: "调出", stock, note: `较 ${previous.date} 不再持有` });
    });
  }

  normalizeOpenPositions(dataset.open_positions || []).forEach((position) => {
    if (!position.buy_date) return;
    rows.push({ date: position.buy_date, action: "调入", stock: position.stock, note: position.note || "当前在途持仓" });
  });

  normalizeTrades(dataset.trades || []).forEach((trade) => {
    if (trade.sell_date) {
      rows.push({ date: trade.sell_date, action: trade.return_pct != null && trade.return_pct < 0 ? "止损/调出" : "止盈/调出", stock: trade.stock, note: `收益 ${pct(trade.return_pct)}` });
    } else if (trade.buy_date) {
      rows.push({ date: trade.buy_date, action: "调入", stock: trade.stock, note: "交易流水记录" });
    }
  });

  const seen = new Set();
  return rows
    .filter((row) => row.date && row.stock)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((row) => {
      const key = `${row.date}|${row.action}|${row.stock}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

function renderCurrentHoldingsPanel() {
  const holdingRows = getCurrentHoldingRows();
  const currentPortfolio = getCurrentPortfolio();
  const summary = getHoldingSummary(holdingRows);
  const adjustments = getRecentAdjustmentRows();
  const quoteTime = state.holdingQuotes?.snapshot_time || "";
  return `
    <div class="panel-card" style="margin-top:16px;">
      <div class="feed-panel-heading">
        <div>
          <h3>当前主理人持仓</h3>
          <p class="lead">${currentPortfolio ? `${escapeHtml(currentPortfolio.name)} · ${holdingRows.length} 只在途持仓` : "导入持仓/调仓文件后，这里会显示当前持仓。"}</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="feed-sync-badge">${quoteTime ? `行情 ${quoteTime.replace("T", " ")}` : "行情待刷新"}</span>
          <button class="pill-btn primary" id="refreshHoldingQuotesBtn" type="button">刷新涨跌幅</button>
        </div>
      </div>
      <div class="overview-grid" style="margin-top:12px;">
        <div class="metric-card blue">
          <div class="metric-title">持仓市值</div>
          <div class="metric-value">${formatMoneyShort(summary.marketTotal)}</div>
          <div class="metric-note">按导入持仓市值汇总</div>
        </div>
        <div class="metric-card ${summary.totalReturnPct != null && summary.totalReturnPct >= 0 ? "up" : "down"}">
          <div class="metric-title">持有总收益率</div>
          <div class="metric-value">${summary.totalReturnPct == null ? "—" : pct(summary.totalReturnPct)}</div>
          <div class="metric-note">总持有收益 ${formatMoneyShort(summary.pnlTotal)}</div>
        </div>
        <div class="metric-card ${summary.dayPct != null && summary.dayPct >= 0 ? "up" : "down"}">
          <div class="metric-title">今日组合涨跌</div>
          <div class="metric-value">${summary.dayPct == null ? "待刷新" : pct(summary.dayPct)}</div>
          <div class="metric-note">按持仓市值加权估算</div>
        </div>
        <div class="metric-card amber">
          <div class="metric-title">最近调仓</div>
          <div class="metric-value">${adjustments.length ? adjustments[0].action : "待识别"}</div>
          <div class="metric-note">${adjustments.length ? `${adjustments[0].date} · ${adjustments[0].stock}` : "需要导入持仓快照或交易流水"}</div>
        </div>
      </div>
      <div class="feed-inline-status" id="holdingQuotesStatus">点击“刷新涨跌幅”会实时获取当前持仓标的的最新价和今日涨跌幅。</div>
      <div class="table-wrap" style="margin-top:14px;">
        <table>
          <thead>
            <tr><th class="left">证券名称</th><th>数量</th><th>仓位</th><th>市值</th><th>最新价</th><th>今日涨跌</th><th>成本价</th><th>持仓收益率</th><th>持有收益</th></tr>
          </thead>
          <tbody>
            ${holdingRows.length ? holdingRows.map((item) => `
              <tr>
                <td class="left"><strong>${escapeHtml(item.stock)}</strong><br><span style="color:var(--muted);">${escapeHtml(item.code || "")}</span></td>
                <td>${renderHoldingCell(item.quantity)}</td>
                <td>${renderHoldingCell(item.weight)}</td>
                <td>${renderHoldingCell(item.market_value)}</td>
                <td>${renderHoldingCell(item.latest_price)}</td>
                <td class="${returnClassName(item.day_pct_change)}">${item.day_pct_change == null ? "待刷新" : pct(item.day_pct_change)}</td>
                <td>${renderHoldingCell(item.cost_price)}</td>
                <td class="${returnClassName(item.return_pct)}">${renderHoldingCell(item.return_pct)}</td>
                <td class="${returnClassName(item.pnl)}">${renderHoldingCell(item.pnl)}</td>
              </tr>
            `).join("") : `<tr><td colspan="9">暂无当前持仓。请导入包含 open_positions / 持仓中 的组合数据。</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="table-wrap" style="margin-top:14px;">
        <table>
          <thead><tr><th>日期</th><th>操作</th><th class="left">标的</th><th class="left">说明</th></tr></thead>
          <tbody>
            ${adjustments.length ? adjustments.map((item) => `
              <tr>
                <td>${escapeHtml(item.date)}</td>
                <td>${escapeHtml(item.action)}</td>
                <td class="left">${escapeHtml(item.stock)}</td>
                <td class="left">${escapeHtml(item.note || "")}</td>
              </tr>
            `).join("") : `<tr><td colspan="4">暂无可识别调仓变化。导入连续日期持仓快照后，可自动识别新增/调出标的。</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function normalizeSnapshotPosition(raw, fallbackDate = "") {
  if (typeof raw === "string") {
    const stock = sanitizeStockName(raw);
    return stock ? { stock, code: extractCode(stock), date: fallbackDate } : null;
  }
  const stock = sanitizeStockName(raw?.stock || raw?.name || raw?.["证券名称"] || raw?.["公司名称"] || "");
  if (!stock) return null;
  const code = extractCode(stock) || extractCode(raw?.code || raw?.["证券代码"] || "");
  const quote = fallbackDate === formatDateObject(new Date()) ? (getHoldingQuoteByCode(code) || {}) : {};
  return {
    stock,
    code,
    date: fallbackDate,
    quantity: firstValue(raw, ["quantity", "qty", "证券数量", "持仓数量", "成交数量"], ""),
    weight: firstValue(raw, ["weight", "仓位"], ""),
    market_value: firstValue(raw, ["market_value", "市值"], ""),
    latest_price: quote.price ?? firstValue(raw, ["latest_price", "最新价"], ""),
    cost_price: firstValue(raw, ["cost_price", "成本价", "buy_price", "买入价"], ""),
    return_pct: firstValue(raw, ["return_pct", "unrealized_return_pct", "持有收益率", "收益率"], ""),
    day_pct_change: quote.pct_change ?? firstValue(raw, ["day_pct_change", "当日涨跌幅", "涨跌幅", "今日涨跌"], ""),
    day_change: quote.change ?? firstValue(raw, ["day_change", "当日涨跌额", "涨跌额"], ""),
    pnl: firstValue(raw, ["pnl", "unrealized_pnl", "持有收益", "浮盈亏"], ""),
    quote_date: normalizeDateInput(quote.quote_date ?? firstValue(raw, ["quote_date", "行情日期"], "")),
    price_source_date: normalizeDateInput(firstValue(raw, ["price_source_date", "价格源日期"], "")),
    quote_status: firstValue(raw, ["quote_status", "行情状态"], ""),
    quote_source: firstValue(raw, ["quote_source", "行情来源"], ""),
    industry: firstValue(raw, ["industry", "industry_name", "所属行业", "申万行业"], ""),
    note: firstValue(raw, ["note", "备注"], ""),
    is_carried: Boolean(raw?.is_carried),
    carried_from_date: normalizeDateInput(raw?.carried_from_date || ""),
    ledger_event_id: cleanText(raw?.ledger_event_id || ""),
    source: cleanText(raw?.source || ""),
  };
}

function positionsFromSnapshot(snapshot) {
  const date = getSnapshotDate(snapshot);
  const rawPositions = snapshot?.open_positions || snapshot?.positions || snapshot?.holdings || snapshot?.["持仓"] || [];
  if (Array.isArray(rawPositions) && rawPositions.length) {
    return rawPositions.map((item) => normalizeSnapshotPosition(item, date)).filter(Boolean);
  }
  const stockTexts = extractSnapshotStocks(snapshot);
  return stockTexts.map((stock) => ({
    stock,
    code: extractCode(stock),
    date,
  }));
}

function getHoldingTimelineRows() {
  const current = getCurrentPortfolio();
  const dataset = current?.dataset || {};
  const snapshotRows = (dataset.daily_snapshots || dataset.snapshots || [])
    .map((snapshot) => ({
      date: getSnapshotDate(snapshot),
      positions: positionsFromSnapshot(snapshot),
      summary: snapshot?.summary || {},
      snapshot_time: snapshot?.snapshot_time || snapshot?.saved_at || "",
    }))
    .filter((item) => item.date && item.positions.length);

  if (!snapshotRows.length) {
    const date = formatDateObject(new Date());
    const positions = getCurrentHoldingRows().map((item) => ({ ...item, date }));
    return [{ date, positions }];
  }

  const currentDate = formatDateObject(new Date());
  const hasCurrentDate = snapshotRows.some((row) => row.date === currentDate);
  const currentPositions = getCurrentHoldingRows();
  if (!hasCurrentDate && currentPositions.length) {
    snapshotRows.push({
      date: currentDate,
      positions: currentPositions.map((item) => ({ ...item, date: currentDate })),
    });
  }

  return snapshotRows.sort((a, b) => b.date.localeCompare(a.date));
}

function summarizeHoldingTimelineDay(row, previousRow) {
  const positions = row.positions || [];
  const summary = getHoldingSummary(positions);
  const previousStocks = new Set((previousRow?.positions || []).map((item) => item.stock));
  const currentStocks = new Set(positions.map((item) => item.stock));
  const added = positions.map((item) => item.stock).filter((stock) => !previousStocks.has(stock));
  const removed = (previousRow?.positions || []).map((item) => item.stock).filter((stock) => !currentStocks.has(stock));
  const changeText = [
    added.length ? `新增：${added.join("、")}` : "",
    removed.length ? `调出：${removed.join("、")}` : "",
  ].filter(Boolean).join("；") || "持仓延续";
  return { ...summary, added, removed, changeText };
}

function renderHoldingTimelinePanel() {
  const rows = getHoldingTimelineRows();
  const ascending = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const previousByDate = {};
  ascending.forEach((row, index) => {
    previousByDate[row.date] = ascending[index - 1] || null;
  });
  return `
    <div class="panel-card" style="margin-top:16px;">
      <div class="feed-panel-heading">
        <div>
          <h3>持仓时间线</h3>
          <p class="lead">按日期记录每日持仓标的、当日涨跌、组合持有收益率和调仓变化。</p>
        </div>
        <div class="feed-sync-badge">${rows.length} 个持仓日期</div>
      </div>
      <div class="table-wrap" style="margin-top:14px;">
        <table>
          <thead>
            <tr><th>日期</th><th>持仓数</th><th class="left">持仓标的</th><th>今日组合涨跌</th><th>持有总收益率</th><th class="left">调仓变化</th></tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((row) => {
              const day = summarizeHoldingTimelineDay(row, previousByDate[row.date]);
              return `
                <tr>
                  <td>${escapeHtml(row.date)}</td>
                  <td>${row.positions.length}</td>
                  <td class="left">
                    <div class="pill-line" style="margin:0;">
                      ${row.positions.map((item) => `<span class="ghost-pill">${escapeHtml(item.stock)}${item.day_pct_change == null || item.day_pct_change === "" ? "" : ` <b class="${returnClassName(item.day_pct_change)}">${pct(parsePctPointValue(item.day_pct_change))}</b>`}</span>`).join("")}
                    </div>
                  </td>
                  <td class="${returnClassName(day.dayPct)}">${day.dayPct == null ? "—" : pct(day.dayPct)}</td>
                  <td class="${returnClassName(day.totalReturnPct)}">${day.totalReturnPct == null ? "—" : pct(day.totalReturnPct)}</td>
                  <td class="left">${escapeHtml(day.changeText)}</td>
                </tr>
              `;
            }).join("") : `<tr><td colspan="6">暂无持仓时间线。导入每日持仓快照后，这里会自动展开。</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getThemesForStock(stockName) {
  const stockText = String(stockName || "");
  return ensureThemeMappings()
    .filter((mapping) => (mapping.stocks || []).some((stock) => stockText.includes(stock.replace(/\(\d{6}\)/, "")) || stockText.includes(stock)))
    .map((mapping) => mapping.theme);
}

function buildAdvisorLearningProfile() {
  const feedRecords = state.feedRecords || [];
  const advisorRecords = feedRecords.filter((item) => ADVISOR_CORPUS_TYPES.includes(item.source_type || ""));
  const hotRecords = state.hotRecords || [];
  const trades = getAllImportedTrades();
  const openPositions = getAllImportedOpenPositions();
  const allPositions = [...trades, ...openPositions];
  const feedThemes = advisorRecords.flatMap((item) => item.matched_themes || item.focus_directions || []);
  const hotThemes = hotRecords.map((item) => item.theme).filter(Boolean);
  const mentionedStocks = advisorRecords.flatMap((item) => item.mentioned_stocks || []);
  const holdingThemes = allPositions.flatMap((item) => [
    item.industry_name && item.industry_name !== "未识别" ? item.industry_name : "",
    item.board && item.board !== "未识别" ? item.board : "",
    ...getThemesForStock(item.stock)
  ]).filter(Boolean);
  const tradedThemes = holdingThemes;
  const operationSentences = advisorRecords.map((item) => item.operation_advice).filter(Boolean);
  const riskSentences = advisorRecords.map((item) => item.risk_warning).filter(Boolean);
  const marketSentences = advisorRecords.map((item) => item.market_view).filter(Boolean);
  const sourceStats = countItems(advisorRecords.map((item) => item.source_type));
  const themeStats = countItems([...feedThemes, ...holdingThemes]);
  const hotStats = countItems(hotThemes);
  const stockStats = countItems([...mentionedStocks, ...allPositions.map((item) => item.stock)]);
  const tradedThemeStats = countItems(tradedThemes);
  const operationKeywords = ["低吸", "控制仓位", "避免追高", "关注", "等待", "止盈", "止损", "切换", "轮动", "放量"];
  const riskKeywords = ["追高", "回撤", "退潮", "分歧", "量能", "缩量", "兑现", "波动", "高位", "止损"];
  const operationStyle = countItems(operationKeywords.filter((keyword) => operationSentences.join(" ").includes(keyword)));
  const riskStyle = countItems(riskKeywords.filter((keyword) => riskSentences.join(" ").includes(keyword)));
  const matchedThemes = unique(feedThemes.filter((theme) => tradedThemes.includes(theme)));
  const consistencyRate = feedThemes.length ? ratio(matchedThemes.length, unique(feedThemes).length) : null;
  const profitableThemes = tradedThemeStats.map((themeItem) => {
    const themeTrades = trades.filter((trade) => getThemesForStock(trade.stock).includes(themeItem.label));
    const returns = themeTrades.map((trade) => trade.return_pct).filter((value) => value != null);
    return {
      theme: themeItem.label,
      count: themeTrades.length,
      avg_return: average(returns),
      win_rate: ratio(returns.filter((value) => value > 0).length, returns.length)
    };
  }).filter((item) => item.count);
  const bestTheme = profitableThemes.length
    ? profitableThemes.reduce((best, item) => ((item.avg_return ?? -Infinity) > (best.avg_return ?? -Infinity) ? item : best), profitableThemes[0])
    : null;
  const avgHold = average(trades.map((trade) => trade.hold_days).filter((value) => value != null));
  const winRate = ratio(trades.filter((trade) => (trade.return_pct ?? -Infinity) > 0).length, trades.length);
  const writingPattern = [
    marketSentences.length ? "先判断指数和市场情绪" : "",
    themeStats.length ? "再列出主线方向和观察重点" : "",
    operationStyle.length ? "随后给出低吸/仓位/追高约束" : "",
    riskStyle.length ? "最后补充高位分歧、量能和回撤风险" : ""
  ].filter(Boolean);

  return {
    feed_count: advisorRecords.length,
    hot_count: hotRecords.length,
    trade_count: trades.length,
    open_count: openPositions.length,
    sourceStats,
    themeStats,
    hotStats,
    stockStats,
    tradedThemeStats,
    operationStyle,
    riskStyle,
    matchedThemes,
    consistencyRate,
    bestTheme,
    avgHold,
    winRate,
    writingPattern,
    summary: [
      themeStats.length ? `主理人观点中最高频方向是 ${themeStats.slice(0, 3).map((item) => `【${item.label}】`).join("、")}。` : "观点库还不够充足，暂时无法稳定识别方向偏好。",
      stockStats.length ? `常出现/常交易标的包括 ${stockStats.slice(0, 4).map((item) => item.label).join("、")}。` : "股票池偏好还需要继续投喂早评和交易记录。",
      operationStyle.length ? `操作表达偏向 ${operationStyle.slice(0, 3).map((item) => item.label).join("、")}。` : "操作语言尚未形成明显稳定模式。",
      riskStyle.length ? `风险表达高频词是 ${riskStyle.slice(0, 3).map((item) => item.label).join("、")}。` : "风险语言尚未形成明显稳定模式。",
      consistencyRate != null ? `观点与已导入交易主题的重合度约为 ${pct(consistencyRate)}。` : "还没有足够的交易记录用于评估知行合一。",
      bestTheme ? `当前交易结果里表现较好的主题是【${bestTheme.theme}】，平均收益 ${pct(bestTheme.avg_return)}，胜率 ${pct(bestTheme.win_rate)}。` : ""
    ].filter(Boolean)
  };
}

let foldSeq = 0;

function nextFoldId(prefix = "fold") {
  foldSeq += 1;
  return `${prefix}-${foldSeq}`;
}

function renderFoldPanel(contentHtml, collapsedLabel, expandedLabel = "收起内容", opts = {}) {
  if (!contentHtml) return "";
  const { open = false } = opts;
  const foldId = nextFoldId();
  return `
    <div class="fold-panel ${open ? "is-open" : ""}">
      <button
        class="fold-toggle"
        type="button"
        data-fold-toggle
        data-target="${foldId}"
        data-closed-label="${collapsedLabel}"
        data-open-label="${expandedLabel}"
        aria-expanded="${open ? "true" : "false"}"
        aria-controls="${foldId}"
      >
        <span class="fold-toggle-text">${open ? expandedLabel : collapsedLabel}</span>
      </button>
      <div class="fold-content" id="${foldId}" ${open ? "" : "hidden"}>
        ${contentHtml}
      </div>
    </div>
  `;
}

function renderFoldListCard(title, items, className = "list-card") {
  const validItems = normalizeListItems(items);
  if (!validItems.length) return "";
  return `
    <div class="${className}">
      <h4>${title}</h4>
      <ul class="bullet-list">${validItems.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `;
}

function renderFoldTextCard(title, textContent, className = "script-card", maxLength = 110, footerHtml = "") {
  void maxLength;
  const fullText = text(textContent, "—");
  return `
    <div class="${className}">
      <h4>${title}</h4>
      <p>${fullText}</p>
      ${footerHtml}
    </div>
  `;
}

function makeTradeSignature(trade) {
  return [
    sanitizeStockName(trade.stock || trade["证券名称"] || trade["公司名称"]),
    normalizeDateInput(trade.buy_date || trade["买入日期"] || trade["调入日期"] || trade["最初购买日"] || trade["调入时间"]),
    parseNumber(trade.buy_price || trade["买入价"] || trade["成交价"]) ?? "",
    normalizeDateInput(trade.sell_date || trade["卖出日期"] || trade["调出日期"] || trade["最终卖出日"] || trade["调出时间"]),
    parseNumber(trade.sell_price || trade["卖出价"]) ?? "",
    parsePercentValue(trade.return_pct ?? trade["收益率"] ?? trade["单笔收益率"]) ?? ""
  ].join("|");
}

function makeOpenPositionSignature(position) {
  return [
    sanitizeStockName(position.stock || position["证券名称"] || position["公司名称"]),
    normalizeDateInput(position.buy_date || position["买入日期"] || position["最初购买日"] || position["调入时间"]),
    parseNumber(position.buy_price || position["买入价"] || position["成交价"]) ?? "",
    parseNumber(position.quantity || position.qty || position["成交数量"] || position["持仓数量"]) ?? ""
  ].join("|");
}

function makeHoldingSnapshotSignature(snapshot) {
  const date = getSnapshotDate(snapshot);
  const positions = positionsFromSnapshot(snapshot)
    .map((position) => [
      getHoldingPositionKey(position),
      sanitizeStockName(position.stock),
      parseNumber(position.quantity) ?? "",
      parseMoneyValue(position.market_value) ?? "",
      parseNumber(position.latest_price) ?? "",
      parseNumber(position.cost_price) ?? "",
      parsePctPointValue(position.return_pct) ?? "",
    ].join(":"))
    .sort();
  return [date, ...positions].join("|");
}

function stripExtension(name) {
  return String(name).replace(/\.[^.]+$/, "");
}

function stripCommonPortfolioSuffix(name) {
  return String(name)
    .replace(/[_-]/g, "")
    .replace(/\s+/g, "")
    .replace(/(最新)?历史交易明细/g, "")
    .replace(/股票组合收益统计/g, "")
    .replace(/组合收益统计/g, "")
    .replace(/股票汇总表\d*/g, "")
    .replace(/汇总表\d*/g, "")
    .replace(/股票汇总\d*/g, "")
    .replace(/汇总\d*/g, "")
    .replace(/收益统计/g, "")
    .replace(/调仓记录/g, "")
    .replace(/交易记录/g, "")
    .replace(/交易明细/g, "")
    .replace(/组合业绩/g, "")
    .replace(/本周/g, "")
    .replace(/本月/g, "")
    .replace(/截至\d{4}\.?\d{1,2}\.?\d{1,2}/g, "")
    .replace(/20\d{2}[.\-]?\d{1,2}[.\-]?\d{1,2}/g, "")
    .replace(/\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/g, "")
    .replace(/(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/g, "")
    .trim();
}

function extractPortfolioKeyName(name) {
  const raw = stripExtension(name);
  const cleaned = stripCommonPortfolioSuffix(raw)
    .replace(/[\/\\]\s*sheet\d*$/i, "")
    .replace(/\s*sheet\d*$/i, "")
    .trim();
  return cleaned || raw;
}

function toPortfolioSlug(name) {
  return extractPortfolioKeyName(name)
    .toLowerCase()
    .replace(/[（）()]/g, "")
    .replace(/\s+/g, "");
}

function makeId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/[：:]/g, "")
    .trim()
    .toLowerCase();
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value)
    .replace(/[,%￥¥元股份只]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMoneyValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/,/g, "").trim();
  if (!raw) return null;
  const sign = raw.includes("-") ? -1 : 1;
  const multiplier = raw.includes("亿") ? 100000000 : raw.includes("万") ? 10000 : 1;
  const numericText = raw.replace(/[+\-%￥¥元股份只万亿]/g, "").trim();
  if (!numericText) return null;
  const parsed = Number(numericText);
  return Number.isFinite(parsed) ? sign * parsed * multiplier : null;
}

function formatMoneyShort(value) {
  const parsed = parseMoneyValue(value);
  if (parsed == null) return "—";
  const absValue = Math.abs(parsed);
  if (absValue >= 100000000) return `${num(parsed / 100000000, 2)}亿`;
  if (absValue >= 10000) return `${num(parsed / 10000, 2)}万`;
  return num(parsed, 2);
}

function parsePercentValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.includes("%")) {
    return parseNumber(value);
  }
  const parsed = parseNumber(value);
  if (parsed == null) return null;
  return Math.abs(parsed) <= 1.2 ? parsed * 100 : parsed;
}

function parsePctPointValue(value) {
  if (value == null || value === "") return null;
  return parseNumber(value);
}

function formatDateObject(date, useUTC = false) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
  const month = String((useUTC ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, "0");
  const day = String(useUTC ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function excelSerialToDateString(serial) {
  if (!Number.isFinite(serial)) return "";
  const base = Date.UTC(1899, 11, 30);
  const utc = new Date(base + Math.round(serial * 86400000));
  return formatDateObject(utc, true);
}

function normalizeDateInput(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date) return formatDateObject(value);
  if (typeof value === "number") {
    if (value > 20000 && value < 70000) return excelSerialToDateString(value);
    return "";
  }
  const raw = cleanText(value);
  if (!raw || raw.includes("尚未")) return "";
  if (/^\d{5}(\.\d+)?$/.test(raw)) return excelSerialToDateString(Number(raw));
  const normalized = raw.replace(/[./年]/g, "-").replace(/[月]/g, "-").replace(/[日]/g, "");
  const dateMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (month >= 1 && month <= 12 && day >= 1 && day <= maxDay) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return "";
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? raw : formatDateObject(parsed);
}

function toDateMs(value) {
  const normalized = normalizeDateInput(value);
  if (!normalized) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function dateRangeStrings(startDate, endDate) {
  const start = normalizeDateInput(startDate);
  const end = normalizeDateInput(endDate);
  if (!start || !end || start > end) return [];
  const dates = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endMs = new Date(`${end}T00:00:00`).getTime();
  while (!Number.isNaN(cursor.getTime()) && cursor.getTime() <= endMs) {
    dates.push(formatDateObject(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function diffDays(start, end) {
  const startMs = toDateMs(start);
  const endMs = toDateMs(end);
  if (startMs == null || endMs == null) return null;
  return Math.max(0, Math.round((endMs - startMs) / 86400000));
}

function sanitizeStockName(value) {
  let stock = cleanText(value);
  if (!stock) return "";
  stock = stock.replace(/\s*\(\s*(\d{6})\s*\)\s*/g, "($1)");
  stock = stock.replace(/\s*(沪\s*A|深\s*A|北\s*A|沪\s*B|深\s*B)$/i, "");
  stock = stock.replace(/\s+/g, "");
  return stock;
}

function extractCode(stock) {
  const match = String(stock).match(/(\d{6})/);
  return match ? match[1] : "";
}

function inferBoard(stock) {
  const code = extractCode(stock);
  if (!code) return "未识别";
  if (/^688/.test(code)) return "科创板";
  if (/^(300|301)/.test(code)) return "创业板";
  if (/^(830|831|832|833|834|835|836|837|838|839|870|871|872|873|874|875|876|877|878|920|430)/.test(code)) return "北交所";
  if (/^(600|601|603|605)/.test(code)) return "沪市主板";
  if (/^(000|001|002|003)/.test(code)) return "深市主板";
  return "其他板块";
}

function inferStatus(status, returnPct) {
  const normalized = cleanText(status)
    .replace(/[✅❌]/g, "")
    .replace(/\s+/g, "");
  if (normalized) return normalized;
  if (returnPct == null) return "未知";
  return returnPct >= 0 ? "盈利" : "亏损";
}

function classifyHold(days) {
  if (days == null) return "未知";
  if (days <= 1) return "1天";
  if (days <= 3) return "2-3天";
  if (days <= 5) return "4-5天";
  if (days <= 10) return "6-10天";
  return "11天以上";
}

function findIndexByKeywords(headers, keywords, opts = {}) {
  const { exact = false, after = -1 } = opts;
  for (let i = 0; i < headers.length; i += 1) {
    if (i <= after) continue;
    const header = headers[i];
    const matched = keywords.some((keyword) => (exact ? header === keyword : header.includes(keyword)));
    if (matched) return i;
  }
  return -1;
}

function findAllIndexesByKeywords(headers, keywords) {
  return headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => keywords.some((keyword) => header.includes(keyword)))
    .map(({ index }) => index);
}

function deriveReturnPct(buyPrice, sellPrice, fallbackValue) {
  if (buyPrice != null && sellPrice != null && buyPrice > 0) {
    return ((sellPrice - buyPrice) / buyPrice) * 100;
  }
  return parsePercentValue(fallbackValue);
}

function normalizeTrades(rawTrades) {
  return (rawTrades || [])
    .map((trade, index) => {
      const stock = sanitizeStockName(trade.stock || trade["证券名称"] || trade["公司名称"]);
      const buyDate = normalizeDateInput(trade.buy_date || trade["买入日期"] || trade["调入日期"] || trade["最初购买日"] || trade["调入时间"]);
      const sellDate = normalizeDateInput(trade.sell_date || trade["卖出日期"] || trade["调出日期"] || trade["最终卖出日"] || trade["调出时间"]);
      const buyPrice = parseNumber(trade.buy_price || trade["买入价"] || trade["成交价"]);
      const sellPrice = parseNumber(trade.sell_price || trade["卖出价"]);
      const holdDays = parseNumber(trade.hold_days || trade["持股天数"] || trade["持仓天数"] || trade["交易天数"]) ?? diffDays(buyDate, sellDate);
      const returnPct = deriveReturnPct(buyPrice, sellPrice, trade.return_pct ?? trade["收益率"] ?? trade["单笔收益率"]);
      const quantity = parseNumber(trade.quantity || trade.qty || trade["成交数量"] || trade["持仓数量"]);
      return {
        idx: parseNumber(trade.idx) ?? index + 1,
        stock,
        code: extractCode(trade.code || trade["证券代码"] || stock),
        board: inferBoard(trade.code || trade["证券代码"] || stock),
        buy_date: buyDate,
        buy_price: buyPrice,
        sell_date: sellDate,
        sell_price: sellPrice,
        hold_days: holdDays,
        return_pct: returnPct,
        quantity,
        status: inferStatus(trade.status || trade["状态"] || trade["交易结果"] || trade["盈亏情况"], returnPct),
        industry_name: cleanText(trade.industry_name || trade["所属行业"] || trade["申万行业"] || trade["industry_name"] || "未识别") || "未识别",
        industry_source: cleanText(trade.industry_source || trade["industry_source"] || ""),
        industry_level: cleanText(trade.industry_level || trade["industry_level"] || "")
      };
    })
    .filter((trade) => trade.stock && (trade.buy_date || trade.sell_date || trade.return_pct != null));
}

function normalizeOpenPositions(rawPositions) {
  return (rawPositions || [])
    .map((position, index) => {
      const stock = sanitizeStockName(position.stock || position["证券名称"] || position["公司名称"]);
      return {
        idx: index + 1,
        stock,
        code: extractCode(position.code || position["证券代码"] || stock),
        board: inferBoard(position.code || position["证券代码"] || stock),
        buy_date: normalizeDateInput(position.buy_date || position["买入日期"] || position["最初购买日"] || position["调入时间"]),
        buy_price: parseNumber(position.buy_price || position["买入价"] || position["成交价"]),
        quantity: parseNumber(position.quantity || position.qty || position["成交数量"] || position["持仓数量"]),
        note: cleanText(position.note || position.remark || position["备注"] || "未完成头寸"),
        industry_name: cleanText(position.industry_name || position["所属行业"] || position["申万行业"] || "未识别") || "未识别",
        industry_source: cleanText(position.industry_source || ""),
        industry_level: cleanText(position.industry_level || "")
      };
    })
    .filter((position) => position.stock);
}

function buildTradeRecord(base, index) {
  const stock = sanitizeStockName(base.stock);
  if (!stock) return null;
  const buyDate = normalizeDateInput(base.buy_date);
  const sellDate = normalizeDateInput(base.sell_date);
  const buyPrice = parseNumber(base.buy_price);
  const sellPrice = parseNumber(base.sell_price);
  const returnPct = deriveReturnPct(buyPrice, sellPrice, base.return_pct);
  const holdDays = parseNumber(base.hold_days) ?? diffDays(buyDate, sellDate);
  return {
    idx: index,
    stock,
    code: extractCode(stock),
    board: inferBoard(stock),
    buy_date: buyDate,
    buy_price: buyPrice,
    sell_date: sellDate,
    sell_price: sellPrice,
    hold_days: holdDays,
    return_pct: returnPct,
    quantity: parseNumber(base.quantity),
    status: inferStatus(base.status, returnPct)
  };
}

function parseTradeTableSheet(rows, context) {
  let headerRowIndex = -1;
  let headers = [];
  for (let i = 0; i < Math.min(rows.length, 15); i += 1) {
    const currentHeaders = (rows[i] || []).map(normalizeText);
    const stockIdx = findIndexByKeywords(currentHeaders, ["证券名称", "股票名称", "公司名称"]);
    const directionIdx = findIndexByKeywords(currentHeaders, ["操作方向"]);
    const returnIdx = findIndexByKeywords(currentHeaders, ["单笔收益率", "收益率", "区间收益率"]);
    const buyIdx = findIndexByKeywords(currentHeaders, ["买入日期", "调入日期", "最初购买日", "调入时间", "买入时间"]);
    if (stockIdx > -1 && directionIdx === -1 && (returnIdx > -1 || buyIdx > -1)) {
      headerRowIndex = i;
      headers = currentHeaders;
      break;
    }
  }
  if (headerRowIndex < 0) return null;

  const stockIdx = findIndexByKeywords(headers, ["证券名称", "股票名称", "公司名称"]);
  const buyDateIdx = findIndexByKeywords(headers, ["买入日期", "调入日期", "最初购买日", "调入时间", "买入时间"]);
  const buyPriceIdx = findIndexByKeywords(headers, ["买入价"]);
  const sellDateIdx = findIndexByKeywords(headers, ["卖出日期", "调出日期", "最终卖出日", "调出时间", "卖出时间"]);
  const sellPriceIdx = findIndexByKeywords(headers, ["卖出价"]);
  const quantityIdx = findIndexByKeywords(headers, ["成交数量", "持仓数量"]);
  const statusIdx = findIndexByKeywords(headers, ["交易结果", "盈亏情况", "状态"]);
  const holdIdxs = findAllIndexesByKeywords(headers, ["持股天数", "持仓天数", "交易天数"]);
  const returnIdxExact = findIndexByKeywords(headers, ["单笔收益率", "收益率"], { exact: true });
  const returnIdx = returnIdxExact > -1 ? returnIdxExact : findIndexByKeywords(headers, ["单笔收益率", "收益率", "区间收益率"]);
  const secondBuyDateIdx = findIndexByKeywords(headers, ["二次交易"], { after: sellDateIdx });
  const secondSellDateIdx = findIndexByKeywords(headers, ["二次交易"], { after: secondBuyDateIdx });
  const secondHoldIdx = holdIdxs[1] ?? -1;
  const secondReturnIdx = secondHoldIdx > -1
    ? findIndexByKeywords(headers, ["收益率", "区间收益率"], { after: secondHoldIdx - 1 })
    : -1;

  const trades = [];
  const openPositions = [];
  let seq = 1;

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const stock = sanitizeStockName(row[stockIdx]);
    if (!stock) continue;

    const baseTrade = buildTradeRecord({
      stock,
      buy_date: row[buyDateIdx],
      buy_price: row[buyPriceIdx],
      sell_date: row[sellDateIdx],
      sell_price: row[sellPriceIdx],
      hold_days: row[holdIdxs[0]],
      return_pct: row[returnIdx],
      quantity: row[quantityIdx],
      status: row[statusIdx]
    }, seq);

    if (baseTrade && (baseTrade.sell_date || baseTrade.return_pct != null)) {
      trades.push(baseTrade);
      seq += 1;
    }

    const secondRaw = row[secondBuyDateIdx];
    const secondOpenMarker = typeof secondRaw === "string" && secondRaw.includes("尚未");
    if (secondOpenMarker) {
      openPositions.push({
        stock,
        buy_date: row[buyDateIdx],
        quantity: row[quantityIdx],
        note: secondRaw
      });
      continue;
    }

    if (secondBuyDateIdx > -1 && secondSellDateIdx > -1) {
      const secondTrade = buildTradeRecord({
        stock,
        buy_date: row[secondBuyDateIdx],
        sell_date: row[secondSellDateIdx],
        hold_days: row[secondHoldIdx],
        return_pct: row[secondReturnIdx],
        quantity: row[quantityIdx],
        status: row[statusIdx]
      }, seq);
      if (secondTrade && (secondTrade.sell_date || secondTrade.return_pct != null)) {
        trades.push(secondTrade);
        seq += 1;
      }
    }
  }

  if (!trades.length && !openPositions.length) return null;

  return {
    name: extractPortfolioKeyName(context.fileName),
    sourceType: context.sourceType,
    trades,
    open_positions: openPositions,
    source_meta: {
      format: secondBuyDateIdx > -1 ? "历史收益汇总/复合交易" : "标准历史交易表",
      file_name: context.fileName,
      sheet_name: context.sheetName,
      parsed_rows: trades.length,
      notes: [
        "已识别闭环买卖记录",
        secondBuyDateIdx > -1 ? "已识别二次交易或未全部卖出字段" : "未发现二次交易列"
      ]
    }
  };
}

function parseTransactionFlowSheet(rows, context) {
  let headerRowIndex = -1;
  let headers = [];
  for (let i = 0; i < Math.min(rows.length, 12); i += 1) {
    const currentHeaders = (rows[i] || []).map(normalizeText);
    const stockIdx = findIndexByKeywords(currentHeaders, ["证券名称", "股票名称", "公司名称"]);
    const directionIdx = findIndexByKeywords(currentHeaders, ["操作方向"]);
    const qtyIdx = findIndexByKeywords(currentHeaders, ["成交数量"]);
    const priceIdx = findIndexByKeywords(currentHeaders, ["成交价"]);
    const timeIdx = findIndexByKeywords(currentHeaders, ["调仓时间", "成交时间", "委托时间"]);
    if (stockIdx > -1 && directionIdx > -1 && qtyIdx > -1 && priceIdx > -1 && timeIdx > -1) {
      headerRowIndex = i;
      headers = currentHeaders;
      break;
    }
  }
  if (headerRowIndex < 0) return null;

  const stockIdx = findIndexByKeywords(headers, ["证券名称", "股票名称", "公司名称"]);
  const directionIdx = findIndexByKeywords(headers, ["操作方向"]);
  const qtyIdx = findIndexByKeywords(headers, ["成交数量"]);
  const priceIdx = findIndexByKeywords(headers, ["成交价"]);
  const timeIdx = findIndexByKeywords(headers, ["调仓时间", "成交时间", "委托时间"]);
  const positionIdx = findIndexByKeywords(headers, ["仓位变化"]);

  const records = [];
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const stock = sanitizeStockName(row[stockIdx]);
    const direction = cleanText(row[directionIdx]);
    if (!stock || !direction) continue;
    records.push({
      stock,
      direction,
      price: parseNumber(row[priceIdx]),
      quantity: parseNumber(row[qtyIdx]) ?? 0,
      datetime: row[timeIdx],
      date: normalizeDateInput(row[timeIdx]),
      position_change: cleanText(row[positionIdx])
    });
  }
  if (!records.length) return null;

  records.sort((a, b) => {
    const aMs = a.datetime instanceof Date ? a.datetime.getTime() : toDateMs(a.datetime) ?? 0;
    const bMs = b.datetime instanceof Date ? b.datetime.getTime() : toDateMs(b.datetime) ?? 0;
    return aMs - bMs;
  });

  const openMap = new Map();
  const trades = [];
  let seq = 1;

  records.forEach((record) => {
    const book = openMap.get(record.stock) || [];
    if (record.direction.includes("买")) {
      book.push({
        stock: record.stock,
        buy_date: record.date,
        buy_price: record.price,
        quantity: record.quantity || 0,
        note: record.position_change
      });
      openMap.set(record.stock, book);
      return;
    }

    if (!record.direction.includes("卖")) return;
    let remaining = record.quantity || 0;
    while (book.length && remaining > 0) {
      const lot = book[0];
      const matched = lot.quantity > 0 ? Math.min(lot.quantity, remaining) : remaining;
      trades.push({
        idx: seq,
        stock: record.stock,
        code: extractCode(record.stock),
        board: inferBoard(record.stock),
        buy_date: lot.buy_date,
        buy_price: lot.buy_price,
        sell_date: record.date,
        sell_price: record.price,
        hold_days: diffDays(lot.buy_date, record.date),
        return_pct: deriveReturnPct(lot.buy_price, record.price, null),
        quantity: matched || null,
        status: deriveReturnPct(lot.buy_price, record.price, null) >= 0 ? "盈利" : "亏损"
      });
      seq += 1;
      if (lot.quantity > 0) lot.quantity -= matched;
      remaining -= matched;
      if (lot.quantity <= 0 || !Number.isFinite(lot.quantity)) {
        book.shift();
      } else {
        break;
      }
    }
    openMap.set(record.stock, book);
  });

  const openPositions = [];
  openMap.forEach((lots, stock) => {
    lots.forEach((lot) => {
      openPositions.push({
        stock,
        buy_date: lot.buy_date,
        buy_price: lot.buy_price,
        quantity: lot.quantity,
        note: lot.note || "调仓流水中仍未匹配卖出"
      });
    });
  });

  if (!trades.length && !openPositions.length) return null;

  return {
    name: extractPortfolioKeyName(context.fileName),
    sourceType: context.sourceType,
    trades,
    open_positions: openPositions,
    source_meta: {
      format: "调仓流水自动配对",
      file_name: context.fileName,
      sheet_name: context.sheetName,
      parsed_rows: trades.length,
      notes: [
        "根据买入/卖出方向和数量自动配对",
        openPositions.length ? "检测到未完成头寸" : "当前流水可形成闭环交易"
      ]
    }
  };
}

function formatImportedPercentCell(value) {
  const parsed = parsePercentValue(value);
  return parsed == null ? "" : `${num(parsed, 2)}%`;
}

function formatImportedMarketValueCell(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number") return `${num(value, 2)}万`;
  const text = cleanText(value);
  if (!text) return "";
  if (text.includes("万") || text.includes("亿")) return text;
  const parsed = parseNumber(text);
  return parsed == null ? text : `${num(parsed, 2)}万`;
}

function parseHoldingSnapshotSheet(rows, context) {
  let headerRowIndex = -1;
  let headers = [];
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const currentHeaders = (rows[i] || []).map(normalizeText);
    const stockIdx = findIndexByKeywords(currentHeaders, ["证券名称", "股票名称", "公司名称"]);
    const dateIdx = findIndexByKeywords(currentHeaders, ["日期", "持仓日期", "快照日期"]);
    const qtyIdx = findIndexByKeywords(currentHeaders, ["证券数量", "持仓数量", "数量"]);
    const valueIdx = findIndexByKeywords(currentHeaders, ["市值"]);
    const priceIdx = findIndexByKeywords(currentHeaders, ["最新价", "收盘价"]);
    const costIdx = findIndexByKeywords(currentHeaders, ["成本价", "买入价"]);
    const hasHoldingShape = stockIdx > -1 && (dateIdx > -1 || context.sheetName?.includes("当前持仓")) && (qtyIdx > -1 || valueIdx > -1 || priceIdx > -1 || costIdx > -1);
    if (hasHoldingShape) {
      headerRowIndex = i;
      headers = currentHeaders;
      break;
    }
  }
  if (headerRowIndex < 0) return null;

  const dateIdx = findIndexByKeywords(headers, ["日期", "持仓日期", "快照日期"]);
  const stockIdx = findIndexByKeywords(headers, ["证券名称", "股票名称", "公司名称"]);
  const codeIdx = findIndexByKeywords(headers, ["证券代码", "股票代码", "代码"]);
  const qtyIdx = findIndexByKeywords(headers, ["证券数量", "持仓数量", "数量"]);
  const weightIdx = findIndexByKeywords(headers, ["仓位", "权重"]);
  const valueIdx = findIndexByKeywords(headers, ["市值"]);
  const priceIdx = findIndexByKeywords(headers, ["最新价", "收盘价"]);
  const costIdx = findIndexByKeywords(headers, ["成本价", "买入价"]);
  const dayIdx = findIndexByKeywords(headers, ["当日涨跌幅", "今日涨跌", "涨跌幅"]);
  const returnIdx = findIndexByKeywords(headers, ["持有收益率", "收益率"]);
  const pnlIdx = findIndexByKeywords(headers, ["持有收益", "浮盈亏", "盈亏"]);
  const noteIdx = findIndexByKeywords(headers, ["备注", "说明"]);
  const sourceIdx = findIndexByKeywords(headers, ["来源", "source"]);

  const snapshotsByDate = new Map();
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const rawStock = cleanText(row[stockIdx]);
    if (!rawStock) continue;
    const code = codeIdx > -1 ? cleanText(row[codeIdx]) : "";
    const stock = sanitizeStockName(code && !rawStock.includes(code) ? `${rawStock}(${code})` : rawStock);
    if (!stock) continue;
    const date = dateIdx > -1
      ? normalizeDateInput(row[dateIdx])
      : normalizeDateInput(context.snapshotDate || "") || formatDateObject(new Date());
    if (!date) continue;
    const bucket = snapshotsByDate.get(date) || {
      date,
      snapshot_date: date,
      snapshot_time: new Date().toISOString(),
      source: cleanText(row[sourceIdx]) || `${context.sourceType || "Excel"}持仓快照：${context.sheetName || ""}`,
      open_positions: [],
      positions: [],
    };
    const position = {
      stock,
      code: extractCode(stock) || code,
      quantity: qtyIdx > -1 ? parseNumber(row[qtyIdx]) : "",
      weight: weightIdx > -1 ? formatImportedPercentCell(row[weightIdx]) : "",
      market_value: valueIdx > -1 ? formatImportedMarketValueCell(row[valueIdx]) : "",
      latest_price: priceIdx > -1 ? parseNumber(row[priceIdx]) : "",
      cost_price: costIdx > -1 ? parseNumber(row[costIdx]) : "",
      day_pct_change: dayIdx > -1 ? formatImportedPercentCell(row[dayIdx]) : "",
      return_pct: returnIdx > -1 ? formatImportedPercentCell(row[returnIdx]) : "",
      pnl: pnlIdx > -1 ? row[pnlIdx] : "",
      note: noteIdx > -1 ? cleanText(row[noteIdx]) : "",
    };
    bucket.open_positions.push(position);
    bucket.positions.push(position);
    snapshotsByDate.set(date, bucket);
  }

  const dailySnapshots = [...snapshotsByDate.values()]
    .filter((snapshot) => snapshot.open_positions.length)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!dailySnapshots.length) return null;
  const latest = dailySnapshots[dailySnapshots.length - 1];
  return {
    name: extractPortfolioKeyName(context.fileName),
    sourceType: context.sourceType,
    open_positions: latest.open_positions,
    daily_snapshots: dailySnapshots,
    source_meta: {
      format: "每日持仓快照",
      file_name: context.fileName,
      sheet_name: context.sheetName,
      parsed_rows: dailySnapshots.reduce((sum, snapshot) => sum + snapshot.open_positions.length, 0),
      notes: ["已识别为每日持仓快照，导入后会自动补齐历史/实时涨跌幅。"]
    }
  };
}
function parseRowsToDataset(rows, context) {
  return (
    parseHoldingSnapshotSheet(rows, context) ||
    parseTransactionFlowSheet(rows, context) ||
    parseTradeTableSheet(rows, context)
  );
}

function parseJsonFile(text) {
  const parsed = JSON.parse(text);
  if (parsed?.portfolios && Array.isArray(parsed.portfolios)) {
    return {
      portfolios: parsed.portfolios.map((item, index) => ({
        ...item,
        name: item.name || `导入组合 ${index + 1}`,
        sourceType: "JSON"
      }))
    };
  }
  if (Array.isArray(parsed)) {
    return { name: "导入数组样本", trades: parsed, sourceType: "JSON" };
  }
  if (parsed.trades || parsed.open_positions || parsed.daily_snapshots || parsed.snapshots) {
    return { ...parsed, sourceType: "JSON" };
  }
  throw new Error("JSON 中未找到可识别的交易字段");
}

function parseHtmlFile(text, fileName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const rows = [...doc.querySelectorAll("#trades tbody tr")];
  if (!rows.length) throw new Error("HTML 中未找到可识别交易表");
  const trades = rows.map((row, index) => {
    const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim());
    return buildTradeRecord({
      stock: cells[1],
      buy_date: cells[2],
      buy_price: cells[3],
      sell_date: cells[4],
      sell_price: cells[5],
      hold_days: cells[6],
      return_pct: cells[7],
      status: cells[8]
    }, index + 1);
  }).filter(Boolean);

  const strategyPoints = [];
  const idea = doc.querySelector(".strategy-big-sentence-v27");
  if (idea) strategyPoints.push(idea.textContent.trim());
  [...doc.querySelectorAll(".ops-grid-v27 article, .pick-grid-final-v17 .pick-card-v17")].forEach((node) => {
    const piece = node.textContent.replace(/\s+/g, " ").trim();
    if (piece) strategyPoints.push(piece);
  });

  return {
    name: doc.querySelector("title")?.textContent?.trim() || extractPortfolioKeyName(fileName),
    sourceType: "HTML",
    trades,
    strategy_points: strategyPoints,
    source_meta: {
      format: "HTML 历史操作表",
      file_name: fileName,
      sheet_name: "页面"
    }
  };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((item) => item.trim());
}

function parseCsvFile(text, fileName) {
  const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const parsed = parseRowsToDataset(rows, {
    fileName,
    sheetName: "CSV",
    sourceType: "CSV"
  });
  if (parsed) return parsed;

  const headers = rows[0] || [];
  const trades = rows.slice(1).map((row, index) => {
    const item = {};
    headers.forEach((header, col) => {
      item[header] = row[col];
    });
    return buildTradeRecord({
      stock: item["证券名称"] || item["公司名称"],
      buy_date: item["调入日期"] || item["买入日期"],
      buy_price: item["买入价"],
      sell_date: item["调出日期"] || item["卖出日期"],
      sell_price: item["卖出价"],
      hold_days: item["持股天数"] || item["交易天数"],
      return_pct: item["收益率"] || item["单笔收益率"],
      status: item["状态"] || item["交易结果"]
    }, index + 1);
  }).filter(Boolean);

  if (!trades.length) throw new Error("CSV 中未识别到交易记录");
  return {
    name: extractPortfolioKeyName(fileName),
    sourceType: "CSV",
    trades,
    source_meta: {
      format: "CSV 交易明细",
      file_name: fileName,
      sheet_name: "CSV"
    }
  };
}

function parseWorkbookFile(fileName, arrayBuffer) {
  if (typeof XLSX === "undefined") {
    throw new Error("本地 Excel 解析组件未加载");
  }
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const portfolios = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false
    });
    const parsed = parseRowsToDataset(rows, {
      fileName,
      sheetName,
      sourceType: "Excel"
    });
    if (parsed && (parsed.trades?.length || parsed.open_positions?.length || parsed.daily_snapshots?.length || parsed.snapshots?.length)) {
      portfolios.push({
        ...parsed,
        name: extractPortfolioKeyName(fileName)
      });
    }
  });
  if (!portfolios.length) {
    throw new Error(`${fileName} 中未识别到可分析交易结构`);
  }
  return portfolios.length === 1 ? portfolios[0] : { portfolios };
}

function getCurrentPortfolio() {
  return state.portfolios.find((item) => item.id === state.currentPortfolioId) || state.portfolios[0] || null;
}

function getCurrentAnalysis() {
  return getCurrentPortfolio()?.analysis || null;
}

function getComparePortfolios() {
  return state.portfolios.filter((item) => state.compareIds.includes(item.id));
}

function makeUniqueName(rawName) {
  const baseName = rawName || "导入组合";
  let candidate = baseName;
  let seq = 2;
  while (state.portfolios.some((item) => item.name === candidate)) {
    candidate = `${baseName} ${seq}`;
    seq += 1;
  }
  return candidate;
}

function normalizeImportedDataset(dataset, fallbackName) {
  const baseName = extractPortfolioKeyName(fallbackName);
  return {
    ...dataset,
    name: dataset.name && !dataset.name.startsWith("导入") ? dataset.name : baseName,
    sourceType: dataset.sourceType || "本地数据"
  };
}

async function ensureIndustryServiceReady() {
  if (state.industryServiceReady !== null) return state.industryServiceReady;
  try {
    const response = await fetch("/api/ping", { cache: "no-store" });
    state.industryServiceReady = response.ok;
  } catch (error) {
    state.industryServiceReady = false;
  }
  return state.industryServiceReady;
}

function getDatasetCodes(dataset) {
  // 申万二级行业不仅服务当前持仓，也要覆盖历史持仓快照；组合复盘图会读取
  // 选中日期及上一持仓日的快照，用于展示当日持仓与调仓明细。
  const snapshotCodes = (dataset.daily_snapshots || dataset.snapshots || [])
    .flatMap((snapshot) => snapshot.open_positions || snapshot.positions || snapshot.holdings || snapshot["持仓"] || [])
    .map((item) => typeof item === "string"
      ? extractCode(item)
      : extractCode(item?.code || item?.["证券代码"] || item?.stock || item?.name || item?.["证券名称"] || item?.["公司名称"] || ""))
    .filter(Boolean);
  return unique([
    ...normalizeTrades(dataset.trades).map((item) => item.code).filter(Boolean),
    ...normalizeOpenPositions(dataset.open_positions).map((item) => item.code).filter(Boolean),
    ...snapshotCodes
  ]);
}

function applyIndustryMapToDataset(dataset, industryMap) {
  const annotateTrade = (item) => {
    const code = extractCode(item.code || item.stock || item["证券名称"] || item["公司名称"]);
    const industry = industryMap[code];
    if (!industry) return item;
    return {
      ...item,
      industry_name: industry.industry_name || "未识别",
      industry_source: industry.industry_source || "",
      industry_level: industry.industry_level || ""
    };
  };
  const annotateSnapshot = (snapshot) => {
    const positions = (snapshot.open_positions || snapshot.positions || []).map(annotateTrade);
    return {
      ...snapshot,
      open_positions: positions,
      positions
    };
  };
  return {
    ...dataset,
    trades: (dataset.trades || []).map(annotateTrade),
    open_positions: (dataset.open_positions || []).map(annotateTrade),
    daily_snapshots: (dataset.daily_snapshots || dataset.snapshots || []).map(annotateSnapshot)
  };
}

async function enrichPortfolioIndustries(recordId, force = false) {
  const record = state.portfolios.find((item) => item.id === recordId);
  if (!record || state.industryPending.has(recordId)) return;
  const ready = await ensureIndustryServiceReady();
  if (!ready) {
    actionStatusEl.textContent = "本地行业服务未启动，当前先按交易数据分析。";
    return;
  }
  
  // 数据库恢复后先应用浏览器内已有缓存，再请求仍然缺失的行业。
  record.dataset = applyIndustryMapToDataset(record.dataset, state.industryCache);
  record.analysis = computeAnalysis(record.dataset);
  record.meta = buildDatasetMeta(record.dataset, record.name);

  // 强制刷新时，提取所有代码；否则只提取缓存中没有或未识别的代码
  const codes = force 
    ? getDatasetCodes(record.dataset)
    : getDatasetCodes(record.dataset).filter((code) => !state.industryCache[code] || state.industryCache[code].industry_name === "未识别");
    
  if (!codes.length) {
    persistState();
    if (state.currentPortfolioId === recordId) renderAll();
    if (force) actionStatusEl.textContent = "所有行业数据已是最新的。";
    return;
  }
  
  state.industryPending.add(recordId);
  if (force) actionStatusEl.textContent = "正在从云端刷新行业数据...";
  
  try {
    const response = await fetch(`/api/industry?codes=${encodeURIComponent(codes.join(","))}&force=${force}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    Object.assign(state.industryCache, payload.data || {});
    const current = state.portfolios.find((item) => item.id === recordId);
    if (!current) return;
    current.dataset = applyIndustryMapToDataset(current.dataset, state.industryCache);
    current.analysis = computeAnalysis(current.dataset);
    current.meta = buildDatasetMeta(current.dataset, current.name);
    persistState();
    if (state.currentPortfolioId === recordId) renderAll();
    if (force) actionStatusEl.textContent = "行业数据刷新成功！";
  } catch (error) {
    actionStatusEl.textContent = `行业补全失败：${error.message}`;
  } finally {
    state.industryPending.delete(recordId);
  }
}

function getBoardNarrative(boardFocus, growthBoardRate) {
  if (growthBoardRate >= 60) return "偏双创及高弹性方向";
  if (growthBoardRate <= 20 && ["沪市主板", "深市主板"].includes(boardFocus)) return "偏主板趋势与行业龙头";
  if (growthBoardRate >= 35) return "主板与双创板块混合切换";
  return `偏 ${boardFocus}`;
}

function buildAdaptiveNarratives(context) {
  const {
    name,
    tradingStyle,
    logicMode,
    boardFocus,
    industryFocus,
    industryPerformance,
    repeatedNames,
    closedCount,
    activityDays,
    uniqueStocks,
    openPositions,
    within3dRate,
    within5dRate,
    oneDayRate,
    growthBoardRate,
    strategy_points: strategyPoints,
    summary
  } = context;
  const industryKnown = industryFocus !== "未识别";
  
  // 识别主理人能力圈（做得好）与失血区（做得差）
  const validIndPerf = (industryPerformance || []).filter(item => item.count >= Math.max(3, closedCount * 0.05));
  const bestIndustry = validIndPerf.length ? validIndPerf.reduce((prev, curr) => (curr.avg_return > prev.avg_return && curr.win_rate >= 0.5) ? curr : prev, validIndPerf[0]) : null;
  const worstIndustry = validIndPerf.length ? validIndPerf.reduce((prev, curr) => (curr.avg_return < prev.avg_return) ? curr : prev, validIndPerf[0]) : null;
  
  const boardNarrative = getBoardNarrative(boardFocus, growthBoardRate);
  const concentrationLabel = summary.industry_focus_rate >= 48
    ? "高度集中"
    : summary.industry_top3_rate >= 72
      ? "中度集中"
      : summary.industry_count >= 5
        ? "分散覆盖"
        : "适度集中";
  const sampleLabel = closedCount >= 120 ? "样本量较充足" : closedCount >= 40 ? "样本量处于可判断区间" : "样本量偏小，结论需保留弹性";
  const stockMode = repeatedNames[0]?.count >= 4 ? "熟悉标的反复滚动" : uniqueStocks.length >= Math.max(8, closedCount * 0.7) ? "广覆盖轮动" : "在有限标的池内切换";
  const riskTone = (summary.max_loss ?? 0) <= -12
    ? "单笔亏损尾部仍偏大"
    : (summary.profit_factor ?? 0) >= 2
      ? "盈亏交换效率较好"
      : "盈亏交换效率中性";
  const qualityTone = (summary.win_rate ?? 0) >= 70 && (summary.profit_factor ?? 0) >= 1.8
    ? "高胜率且期望值明确"
    : (summary.win_rate ?? 0) < 55 && (summary.avg_return ?? 0) > 4
      ? "低胜率高弹性"
      : (summary.avg_return ?? 0) < 1.5
        ? "收益兑现偏薄"
        : "正收益结构成立";
  const fitText = within3dRate >= 60 || (summary.avg_hold ?? 0) <= 3
    ? "这个组合非常适合像您这样平时看盘积极、执行力强，希望资金能快速流转、不被长期套牢的活跃型投资者。"
    : (summary.avg_hold ?? 0) <= 7
      ? "如果您平时偏好短线波段、喜欢利润快速落袋为安，并且能接受一定的换手频率，那这个组合的节奏会非常契合您的投资习惯。"
      : (summary.avg_hold ?? 0) <= 14
        ? "这个组合不怎么折腾瞎换，主要做中短线波段。非常适合像您这样平时工作比较忙，但又希望有一位专业主理人帮您跟踪趋势、稳健操作的客户。"
        : "如果您更看重长期的趋势收益，不喜欢每天在市场里杀跌追涨，那么这个组合耐心持有的风格会非常让您省心。";
  
  const avoidText = within3dRate >= 60 || (summary.avg_hold ?? 0) <= 3
    ? "不过我也要客观提醒您，这个组合节奏很快，如果您平时工作比较忙、没法及时看手机，或者对短期的涨跌比较敏感，这可能不太适合您。"
    : growthBoardRate >= 55
      ? "另外，由于组合里包含了较多双创板块的高弹性股票，如果您比较在意净值的平稳度、不能接受偶尔的较大幅度波动，建议您慎重考虑。"
      : "当然，如果您对收益的预期是短期内的极速爆发，或者完全无法承受正常的市场回撤，这个组合可能未必能满足您的保本和高预期诉求。";

  const tradingTraits = unique([
    `${sampleLabel}，当前共识别 ${closedCount} 笔闭环交易、${activityDays} 个活跃交易日、${uniqueStocks.length} 只股票。`,
    within3dRate >= 60
      ? `交易节奏明显偏快，3 日内完成交易占比 ${pct(within3dRate)}，其中隔日内完成占比 ${pct(oneDayRate)}。`
      : `交易节奏并非纯超短，5 日内完成交易占比 ${pct(within5dRate)}，平均持有 ${num(summary.avg_hold)} 天。`,
    `组合表现呈现 ${qualityTone} 的特征，平仓胜率 ${pct(summary.win_rate)}，平均单笔收益 ${pct(summary.avg_return)}，利润因子 ${num(summary.profit_factor)}。`,
    repeatedNames.length
      ? `标的处理方式更接近 ${stockMode}，其中 ${repeatedNames[0].stock} 重复参与 ${repeatedNames[0].count} 次。`
      : "重复交易标的不突出，更偏向分散轮动。",
    `${boardNarrative}，说明组合对板块风格切换和主线活跃度具有明确偏好。`
  ]);

  const holdingTraits = unique([
    industryKnown
      ? `行业暴露呈 ${concentrationLabel}，第一行业为 ${industryFocus}，占比 ${pct(summary.industry_focus_rate)}，前 3 行业合计 ${pct(summary.industry_top3_rate)}。`
      : "行业字段尚未补全，当前仅能基于交易行为和板块属性判断风格。",
    openPositions.length
      ? `样本内仍有 ${openPositions.length} 只未完成头寸，正式评价需结合当前持仓状态观察在途风险。`
      : "当前样本闭环程度较高，适合直接做交易质量与风格归因。",
    growthBoardRate >= 55
      ? `双创及北交所交易占比 ${pct(growthBoardRate)}，说明收益弹性和波动体验更受市场风险偏好影响。`
      : `双创及北交所交易占比 ${pct(growthBoardRate)}，组合更偏向主板趋势与相对稳态的行业主线。`,
    within3dRate >= 60 
      ? "持仓结构更依赖执行速度驱动，并非单纯依赖长持有换取收益。"
      : within5dRate >= 70 
        ? "持仓结构节奏一致性较高，换手相对紧凑。"
        : "持仓结构更依赖耐心持有，并非依靠日内或极短期的频繁换手获利。"
  ]);

  const logicPoints = unique([
    `${name || "该组合"}整体属于 ${tradingStyle} 框架，核心运作方式是 ${logicMode}。`,
    industryKnown
      ? `行业层面并非平均撒网，而是围绕 ${industryFocus} 及相近行业建立舒适区，能力边界较清晰。`
      : "行业舒适区尚未完全补齐，当前阶段主要依据交易节奏与标的重复度判断其逻辑结构。",
    repeatedNames[0]?.count >= 4
      ? "组合更像先建立熟悉股票池，再围绕高把握标的反复滚动，而不是一次性交易后离场。"
      : "组合更偏轮动筛选，不依赖单一标的反复博弈。",
    (summary.max_loss ?? 0) <= -12
      ? "最大单笔亏损偏大，说明在极端不利走势下仍存在止损执行不够统一的情况。"
      : "亏损尾部尚可控，说明卖出纪律具备一定稳定性。",
    bestIndustry && bestIndustry.avg_return > 0 ? `在【${bestIndustry.industry}】板块呈现出显著的能力圈特征（胜率 ${pct(bestIndustry.win_rate)}，平均收益 ${pct(bestIndustry.avg_return)}）。` : "",
    worstIndustry && worstIndustry.avg_return < 0 ? `在【${worstIndustry.industry}】板块表现相对吃力，存在一定的失血效应（平均收益 ${pct(worstIndustry.avg_return)}）。` : "",
    `${riskTone}，这决定了它更适合被理解为有风格边界的主动管理组合，而不是低波动替代品。`
  ]);

  const strengths = unique([
    (summary.win_rate ?? 0) >= 68 ? "胜率处于较高水平，说明入场筛选和退出节奏具备一定稳定性。" : "",
    (summary.profit_factor ?? 0) >= 1.8 ? "利润因子较高，说明收益并非完全依赖少数极端大赚样本。" : "",
    bestIndustry && bestIndustry.avg_return >= 5 ? `具备明确的优势行业：在 ${bestIndustry.industry} 上能够获取超越平均水平的兑现收益。` : "",
    summary.cash_cows && summary.cash_cows.length > 0 ? `存在显著的“提款机”标的：在 ${summary.cash_cows[0].stock} 等标的上反复操作 ${summary.cash_cows[0].count} 次且胜率达 ${pct(summary.cash_cows[0].win_rate)}，主理人对熟悉标的股性把握极准。` : "",
    summary.stock_breadth_rate >= 0.6 && uniqueStocks.length >= 10 ? `能力圈覆盖较广：在交易过的 ${uniqueStocks.length} 只股票中，有 ${pct(summary.stock_breadth_rate)} 的标的最终实现了正向平均收益，不完全依赖单一神票。` : "",
    within5dRate >= 70 ? "持有区间相对集中，节奏边界比较清晰，便于对客解释打法。" : "",
    repeatedNames[0]?.count >= 4 ? "对熟悉标的进行滚动交易，说明组合在主线跟踪和熟悉股票池管理上有经验积累。" : "",
    industryKnown && summary.industry_focus_rate >= 30 && summary.industry_focus_rate <= 48 ? "行业集中度适中，既能体现舒适区，又未过度依赖单一行业。" : "",
    openPositions.length ? "未完成头寸被单独识别，便于把已实现结果与在途风险分开呈现。" : ""
  ]).slice(0, 4);

  const weaknesses = unique([
    within3dRate >= 65 ? "节奏较快，客户若无法及时执行，实际体验与样本表现容易出现偏差。" : "",
    (summary.max_loss ?? 0) <= -12 ? "最大单笔亏损偏大，高胜率不能直接等同于低风险。" : "",
    summary.stubborn_losers && summary.stubborn_losers.length > 0 ? `存在“死磕”单一亏损标的的现象（如 ${summary.stubborn_losers[0].stock}），部分交易可能受情绪驱动，未能及时认错。` : "",
    summary.stock_breadth_rate < 0.3 && uniqueStocks.length >= 8 ? `标的胜率覆盖面偏窄：盈利过度集中在少数几只股票上，大部分试错标的未能贡献正收益，能力圈亟待拓宽。` : "",
    worstIndustry && worstIndustry.avg_return <= -3 ? `存在明显的弱势板块：在 ${worstIndustry.industry} 上的交易拉低了组合整体期望，存在盲目试错或死扛现象。` : "",
    industryKnown && summary.industry_focus_rate >= 48 ? `行业集中度较高，组合阶段表现可能较依赖 ${industryFocus} 所处赛道景气。` : "",
    growthBoardRate >= 58 ? "双创及高弹性暴露较高，风格退潮期的回撤体感会明显放大。" : "",
    closedCount < 25 ? "样本量仍然有限，对策略稳定性的判断需要继续跟踪。 " : "",
    summary.loser_avg_hold > summary.winner_avg_hold ? "亏损单持有时间长于盈利单，说明止损和止盈节奏仍可继续优化。" : ""
  ]).slice(0, 4);

  const suggestions = unique([
    within3dRate >= 55 ? "建议将 1 天、3 天、5 天三个窗口的胜率和收益拆分展示，进一步锁定最优兑现区间。" : "",
    industryKnown ? "建议继续增加行业分层胜率与平均收益统计，验证舒适区是否真正具备持续优势。" : "建议先完成行业口径补全，再继续判断行业舒适区和依赖度。",
    summary.loser_avg_hold > summary.winner_avg_hold ? "建议强化亏损单的退出阈值，避免出现盈利快、亏损拖延的结构。" : "",
    openPositions.length ? "建议同步纳入最新持仓状态和浮盈浮亏，避免客户仅基于已平仓样本形成片面判断。" : "",
    repeatedNames.length ? "建议补充重复交易标的的累计贡献分析，区分能力来源于个别熟悉标的还是整体选股体系。" : ""
  ]).slice(0, 4);

  const judgement = `${name || "该组合"}当前呈现 ${tradingStyle} 特征，属于 ${boardNarrative}、${industryKnown ? `${industryFocus}舒适区较清晰` : "行业口径待补全"}、${stockMode} 的主动管理组合。样本期内平仓胜率 ${pct(summary.win_rate)}，平均单笔收益 ${pct(summary.avg_return)}，平均持有 ${num(summary.avg_hold)} 天，整体表现为 ${qualityTone}，但同时也存在 ${riskTone} 的现实约束。`;

  const scripts = {
    position: `这是一个主打“${tradingStyle}”的主动管理组合。它的核心不是靠运气去赌，而是靠${industryKnown ? `深耕【${industryFocus}】等熟悉领域` : "深耕熟悉的股票池"}，通过成熟的交易节奏来为您一点点积累收益。`,
    customer: `您好，向您推荐这个组合。从历史真实交易来看，主理人风格非常明确，不盲目撒网，而是主要聚焦在 ${boardNarrative.replace(/^偏/, '')}${industryKnown ? `，特别是【${industryFocus}】等熟悉赛道` : ""}。目前组合已经验证了 ${closedCount} 笔闭环交易，胜率保持在 ${pct(summary.win_rate)} 左右，平均每笔能赚 ${pct(summary.avg_return)}。如果您认可这种${tradingStyle}的打法，愿意交由专业的人来帮您跟踪操作，这个组合会是很好的选择。`,
    professional: `内部判断上，这个组合最值得关注的不是单一业绩数字，而是 ${tradingStyle}、${concentrationLabel}、${stockMode} 这三个维度是否能够持续成立。若这三项同时保持稳定，组合的可解释性和可经营性会更强。`,
    marketingFit: fitText,
    marketingAvoid: avoidText,
    marketingRisk: `最后还要跟您客观提示一下风险：过去的交易数据确实不错，但不能代表未来也一定能做到。${industryKnown && summary.industry_focus_rate >= 48 ? `特别是目前组合在【${industryFocus}】上持仓较重，如果遇到该行业整体调整，净值也会跟着波动。` : ""}${openPositions.length ? "而且当前组合里还有正在持有的股票，" : ""}市场风格一旦切换，真实的跟投体验肯定会有起伏。咱们在投前先建立一个理性的预期。`,
    followKey: industryKnown
      ? `后续跟踪重点应关注主理人在【${industryFocus}】赛道的优势能否保持，以及他${tradingStyle}的交易节奏是否出现了变形。`
      : "后续跟踪重点应关注他的交易节奏是否稳定、经常买的熟悉标的是否还在延续，以及单笔的最大亏损是否能继续控制住。"
  };

  // 动态重构：基于组合特征生成深度定制化的客群匹配
  let corePersonaText = "";
  let corePersonaTags = [];
  if (within3dRate >= 60 || (summary.avg_hold ?? 0) <= 3) {
    corePersonaText = `该组合属于典型的高频快切打法（平均持仓 ${num(summary.avg_hold)} 天，3日内占比 ${pct(within3dRate)}）。适合时间充裕、能紧盯盘面并能果断执行交易指令的活跃型客户。`;
    corePersonaTags = ["盯盘积极", "执行力强", "拥抱波动"];
  } else if ((summary.avg_hold ?? 0) <= 7) {
    corePersonaText = `该组合属于短线波段交易（平均持仓 ${num(summary.avg_hold)} 天）。适合偏好快速兑现利润、能够接受短线换手和波动的交易型客户。`;
    corePersonaTags = ["短线偏好", "快速兑现", "接受换手"];
  } else if ((summary.avg_hold ?? 0) <= 14) {
    corePersonaText = `组合节奏处于中短波段（平均持仓 ${num(summary.avg_hold)} 天）。要求客户有一定的跟踪意愿，同时能够理解并接受中短期的波段换手。适合具有一定投资经验的成熟型客户。`;
    corePersonaTags = ["持续跟踪", "成熟客户", "波段换手"];
  } else {
    corePersonaText = `该组合偏向中长线趋势持有（平均持仓 ${num(summary.avg_hold)} 天）。适合有耐心、不追求日内极速兑现、注重趋势延续性的稳健型客户。`;
    corePersonaTags = ["耐心持有", "趋势偏好", "低频操作"];
  }

  let avoidPersonaText = "";
  let avoidPersonaTags = [];
  if ((summary.max_loss ?? 0) <= -15) {
    avoidPersonaText = `组合存在较大幅度的尾部回撤（最大单笔亏损 ${pct(summary.max_loss)}）。极度厌恶风险、对短期净值回撤零容忍的保本型客户应坚决规避。`;
    avoidPersonaTags = ["厌恶回撤", "保本诉求", "风险低容忍"];
  } else if (growthBoardRate >= 60) {
    avoidPersonaText = `组合在成长板和高弹性标的上暴露较高（占比 ${pct(growthBoardRate)}）。只能接受主板大票或低波红利体验的客户不适合。`;
    avoidPersonaTags = ["低波偏好", "偏好红利", "厌恶高弹"];
  } else if (within3dRate >= 50) {
    avoidPersonaText = `由于调仓较为频繁，无法及时看手机、执行存在明显延迟的客户不适合，否则容易产生严重的滑点损耗。`;
    avoidPersonaTags = ["执行滞后", "无暇盯盘", "操作拖沓"];
  } else {
    avoidPersonaText = `对短期极速爆发有不切实际预期，或无法承受正常市场风格波动的客户，不建议配置。`;
    avoidPersonaTags = ["过度预期", "缺乏耐心", "追涨杀跌"];
  }

  let opFocusText = "";
  let opFocusTags = [];
  if (industryKnown && summary.industry_focus_rate >= 40) {
    opFocusText = `组合明显重仓于 ${industryFocus} 赛道（占比 ${pct(summary.industry_focus_rate)}）。营销前必须确认客户对该主线有基础认知，否则容易在行业回调期产生沟通障碍。`;
    opFocusTags = ["主线认知", "赛道偏好", "沟通预期"];
  } else if ((summary.win_rate ?? 0) >= 70) {
    opFocusText = `组合胜率极高（${pct(summary.win_rate)}），营销时可重点强化其高胜率带来的持仓体验优势，但需提示防范单笔极端风险。`;
    opFocusTags = ["体验优异", "强化胜率", "防范尾部"];
  } else {
    opFocusText = `在推广前，理顾需要先为客户做好策略的框架教育，对齐收益和风险预期，避免净值波动带来的信任损耗。`;
    opFocusTags = ["策略教育", "对齐预期", "长期经营"];
  }

  const personas = [
    {
      title: "核心适配客群",
      text: corePersonaText,
      tags: corePersonaTags
    },
    {
      title: "不适配客群",
      text: avoidPersonaText,
      tags: avoidPersonaTags
    },
    {
      title: "经营与沟通关注点",
      text: opFocusText,
      tags: opFocusTags
    }
  ];

  // 动态重构：基于实际数据暴露组合的核心风险点
  const risks = [];
  
  // ================= 智能宣发口径与实盘校验 =================
  const strategyValidations = [];
  if (context.strategy_points && context.strategy_points.length > 0) {
    const rawText = context.strategy_points.join(" ");
    
    // 校验止损
    if (rawText.includes("止损") || rawText.includes("认错") || rawText.includes("防守")) {
      if ((summary.max_loss ?? 0) <= -12 || (summary.loser_avg_hold > summary.winner_avg_hold + 5)) {
        strategyValidations.push({
          point: "宣发强调严格止损与防守",
          conclusion: "知行合一存在瑕疵",
          evidence: `实盘样本中存在单笔最大亏损达 ${pct(summary.max_loss)}，或亏损单平均持有长达 ${num(summary.loser_avg_hold)} 天，防守纪律在实际执行中未能完全一致。`,
          match: false
        });
      } else {
        strategyValidations.push({
          point: "宣发强调严格止损与防守",
          conclusion: "实盘高度吻合",
          evidence: `亏损单平均持有仅 ${num(summary.loser_avg_hold)} 天，最大单笔亏损控制在 ${pct(summary.max_loss)}，防守纪律执行非常到位。`,
          match: true
        });
      }
    }

    // 校验胜率
    if (rawText.includes("胜率优先") || rawText.includes("高胜率") || rawText.includes("确定性")) {
      if ((summary.win_rate ?? 0) >= 65) {
        strategyValidations.push({
          point: "宣发强调胜率优先与确定性",
          conclusion: "实盘高度吻合",
          evidence: `实盘平仓胜率达到 ${pct(summary.win_rate)}，确实做到了高胜率兑现。`,
          match: true
        });
      } else {
        strategyValidations.push({
          point: "宣发强调胜率优先与确定性",
          conclusion: "实盘略有偏离",
          evidence: `实盘平仓胜率仅为 ${pct(summary.win_rate)}，并非以高胜率见长，收益结构更偏向盈亏比驱动。`,
          match: false
        });
      }
    }

    // 校验短线/波段
    if (rawText.includes("短线") || rawText.includes("以短为主") || rawText.includes("波段")) {
      if (within5dRate >= 60) {
        strategyValidations.push({
          point: "宣发强调短线/波段交易节奏",
          conclusion: "实盘高度吻合",
          evidence: `5日内完成的交易占比高达 ${pct(within5dRate)}，换手节奏与宣传口径完全一致。`,
          match: true
        });
      } else {
        strategyValidations.push({
          point: "宣发强调短线/波段交易节奏",
          conclusion: "实盘偏向长周期",
          evidence: `平均持有天数高达 ${num(summary.avg_hold)} 天，更偏向中长线趋势持有，与“以短为主”的宣传口径不符。`,
          match: false
        });
      }
    }

    // 校验主线/龙头
    if (rawText.includes("龙头") || rawText.includes("主线") || rawText.includes("赛道") || rawText.includes("强势")) {
      const hasHighElasticity = (summary.max_win ?? 0) >= 10 || (summary.winner_avg_return ?? 0) >= 6;
      const hasCoreRolling = repeatedNames.length > 0 && repeatedNames[0].count >= 3;
      
      if (hasHighElasticity || hasCoreRolling || growthBoardRate >= 50) {
        strategyValidations.push({
          point: "宣发强调聚焦主线与龙头标的",
          conclusion: "实盘表现一致",
          evidence: `实盘捕获了单笔 ${pct(summary.max_win)} 的高弹性爆发，${hasCoreRolling ? `且在核心标的（如 ${repeatedNames[0].stock}）上有反复滚动的操作痕迹，` : ""}符合主线龙头战法的攻击特征。`,
          match: true
        });
      } else {
        strategyValidations.push({
          point: "宣发强调聚焦主线与龙头标的",
          conclusion: "实盘弹性偏弱或趋于分散",
          evidence: `实盘缺乏明显的单笔高爆发记录（最大单笔收益仅 ${pct(summary.max_win)}），且标的覆盖面较广（共 ${uniqueStocks.length} 只），未见对核心强势标的的持续聚焦与重仓突击，与龙头战法的高弹性特征有出入。`,
          match: false
        });
      }
    }
    
    // 强制兜底核验：如果上述正则都没有命中，直接从客观数据里抓取3个最突出的特征进行强制对比
    if (strategyValidations.length === 0) {
      // 强制校验胜率
      if ((summary.win_rate ?? 0) >= 70) {
        strategyValidations.push({
          point: "宣发口径隐含的高确定性预期",
          conclusion: "实盘高度吻合",
          evidence: `未提取到明显的胜率关键词，但实盘平仓胜率高达 ${pct(summary.win_rate)}，展现出极强的高确定性特征。`,
          match: true
        });
      } else if ((summary.win_rate ?? 0) < 50) {
        strategyValidations.push({
          point: "宣发口径隐含的盈亏比驱动预期",
          conclusion: "实盘表现一致",
          evidence: `实盘胜率仅 ${pct(summary.win_rate)}，说明该组合不靠高胜率吃饭，而是依赖大盈小亏的盈亏比模型。`,
          match: true
        });
      }

      // 强制校验持有周期
      if (within5dRate >= 60) {
        strategyValidations.push({
          point: "宣发口径隐含的快节奏预期",
          conclusion: "实盘高度吻合",
          evidence: `虽然宣发未直言短线，但实盘中 5 日内完成的交易占比高达 ${pct(within5dRate)}，属于极其典型的快切打法。`,
          match: true
        });
      } else if ((summary.avg_hold ?? 0) >= 15) {
        strategyValidations.push({
          point: "宣发口径隐含的波段/趋势预期",
          conclusion: "实盘高度吻合",
          evidence: `实盘平均持有高达 ${num(summary.avg_hold)} 天，明显属于中长周期的波段/趋势持有。`,
          match: true
        });
      }

      // 强制校验行业与标的集中度
      if (summary.industry_focus_rate >= 35) {
        strategyValidations.push({
          point: "宣发口径隐含的能力圈聚集预期",
          conclusion: "实盘高度吻合",
          evidence: `实盘在 ${industryKnown ? industryFocus : "第一大行业"} 的资金暴露高达 ${pct(summary.industry_focus_rate)}，存在极其明确的行业舒适区。`,
          match: true
        });
      } else if (uniqueStocks.length >= 20 && summary.industry_focus_rate < 20) {
        strategyValidations.push({
          point: "宣发口径隐含的分散轮动预期",
          conclusion: "实盘高度吻合",
          evidence: `实盘交易标的极其分散（共操作 ${uniqueStocks.length} 只票），未在单一行业上重仓押注。`,
          match: true
        });
      }
    }
  }

  if (summary.stubborn_losers && summary.stubborn_losers.length > 0) {
    risks.push({
      title: "死磕亏损标的风险",
      text: `数据暴露：在 ${summary.stubborn_losers[0].stock} 等标的上的博弈胜率极低（≤33%）且平均收益为负。存在不认错、执着于从失败标的中回本的情绪化交易倾向，这种“滑铁卢”式的死磕极易造成净值深坑。`
    });
  }

  if (summary.loser_avg_hold > summary.winner_avg_hold && summary.loser_avg_hold > 15) {
    risks.push({
      title: "止损拖沓风险",
      text: `数据暴露：亏损单平均持有时间（${num(summary.loser_avg_hold)}天）显著长于盈利单（${num(summary.winner_avg_hold)}天）。这意味着组合在面对错误交易时存在扛单倾向，可能在极端下行行情中造成深幅拖累。`
    });
  }

  if ((summary.max_loss ?? 0) <= -12) {
    risks.push({
      title: "尾部回撤风险",
      text: `数据暴露：样本中存在幅度达 ${pct(summary.max_loss)} 的单笔亏损。尽管可能整体胜率不错，但单次防守失误极易对净值造成脉冲式打击。`
    });
  }

  if (worstIndustry && worstIndustry.avg_return <= -3 && worstIndustry.count >= 5) {
    risks.push({
      title: "特定板块失血风险",
      text: `数据暴露：在 ${worstIndustry.industry} 上的 ${worstIndustry.count} 笔交易平均收益仅为 ${pct(worstIndustry.avg_return)}。主理人在该板块的博弈能力偏弱，可能存在认知盲区或能力圈外强行交易的现象。`
    });
  }

  if (industryKnown && summary.industry_focus_rate >= 50) {
    risks.push({
      title: "行业单一暴露",
      text: `数据暴露：${industryFocus} 占比高达 ${pct(summary.industry_focus_rate)}。组合的净值表现与该行业贝塔高度绑定，一旦行业进入中期调整，组合可能缺乏有效的对冲和轮动手段。`
    });
  }

  if (within3dRate >= 60) {
    risks.push({
      title: "高频滑点与执行风险",
      text: `数据暴露：超短交易占比达 ${pct(within3dRate)}。该类策略极度依赖交易员的盘感和执行速度，如果规模扩大或客户跟投存在延迟，实际收益将大幅缩水。`
    });
  }

  if (risks.length < 3) {
    risks.push({
      title: "风格切换风险",
      text: growthBoardRate >= 55 
        ? "当前组合高频穿梭于双创及北交板块，一旦市场进入防御或红利占优阶段，组合可能会遭遇持续的逆风期。"
        : "市场主线如果发生剧烈切换，组合原本的选股模型和节奏可能失效，带来阶段性净值回落。"
    });
  }
  
  if (risks.length < 3 && openPositions.length > 0) {
    risks.push({
      title: "在途持仓风险",
      text: `当前样本内仍有 ${openPositions.length} 只未闭环的头寸。历史高胜率不能掩盖在途持仓可能的浮亏，需结合最新持仓明细做综合判断。`
    });
  }

  // 截取前3个最显著的风险
  const finalRisks = risks.slice(0, 3);

  return {
    judgement,
    tradingTraits,
    holdingTraits,
    logicPoints,
    strategyValidations,
    strengths,
    weaknesses,
    suggestions,
    scripts,
    personas,
    risks: finalRisks
  };
}

function computeAnalysis(dataset) {
  const trades = normalizeTrades(dataset.trades);
  const openPositions = normalizeOpenPositions(dataset.open_positions);
  const holdingSnapshots = (dataset.daily_snapshots || dataset.snapshots || [])
    .filter((snapshot) => getSnapshotDate(snapshot));
  const latestHoldingSnapshotDate = holdingSnapshots
    .map((snapshot) => getSnapshotDate(snapshot))
    .sort((a, b) => a.localeCompare(b))
    .at(-1) || "";
  const closedTrades = trades.filter((trade) => trade.sell_date || trade.return_pct != null);
  const returns = closedTrades.map((trade) => trade.return_pct).filter((value) => value != null);
  const holds = closedTrades.map((trade) => trade.hold_days).filter((value) => value != null);
  const winners = closedTrades.filter((trade) => (trade.return_pct ?? -Infinity) > 0);
  const losers = closedTrades.filter((trade) => (trade.return_pct ?? Infinity) <= 0);
  const repeatedMap = new Map();
  closedTrades.forEach((trade) => {
    if (!repeatedMap.has(trade.stock)) repeatedMap.set(trade.stock, []);
    repeatedMap.get(trade.stock).push(trade);
  });
  
  // 个股行为穿透（计算所有股票，不只重复的）
  const allStockPerf = [...repeatedMap.entries()].map(([stock, rows]) => {
    const industry = rows.find(r => r.industry_name && r.industry_name !== "未识别")?.industry_name || "待补全";
    const wins = rows.filter(r => (r.return_pct ?? -Infinity) > 0).length;
    return {
      stock,
      industry,
      count: rows.length,
      win_rate: ratio(wins, rows.length),
      avg_return: average(rows.map((row) => row.return_pct).filter((value) => value != null)),
      avg_hold_days: average(rows.map((row) => row.hold_days).filter((value) => value != null))
    };
  });
  
  const repeatedNames = allStockPerf
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count || (b.avg_return ?? 0) - (a.avg_return ?? 0));
    
  // 识别极端的提款机与死磕标的
  const cashCows = repeatedNames.filter(s => s.count >= 3 && s.win_rate >= 66 && s.avg_return > 0);
  const stubbornLosers = repeatedNames.filter(s => s.count >= 3 && s.win_rate <= 33 && s.avg_return < 0);
  const profitableStocks = allStockPerf.filter(s => s.avg_return > 0);
  const stockBreadthRate = allStockPerf.length ? ratio(profitableStocks.length, allStockPerf.length) : 0;

  const boardCounter = {};
  [...closedTrades, ...openPositions].forEach((item) => {
    boardCounter[item.board] = (boardCounter[item.board] || 0) + 1;
  });
  const boardDistribution = Object.entries(boardCounter)
    .map(([label, count]) => ({ label, count, ratio: ratio(count, closedTrades.length + openPositions.length) }))
    .sort((a, b) => b.count - a.count);

  const industryCounter = {};
  [...closedTrades, ...openPositions].forEach((item) => {
    const industry = item.industry_name && item.industry_name !== "未识别" ? item.industry_name : "";
    if (!industry) return;
    industryCounter[industry] = (industryCounter[industry] || 0) + 1;
  });
  const industryDistribution = Object.entries(industryCounter)
    .map(([label, count]) => ({ label, count, ratio: ratio(count, closedTrades.length + openPositions.length) }))
    .sort((a, b) => b.count - a.count);

  const industryPerfMap = new Map();
  closedTrades.forEach((trade) => {
    const industry = trade.industry_name && trade.industry_name !== "未识别" ? trade.industry_name : "未识别";
    if (industry === "未识别") return;
    if (!industryPerfMap.has(industry)) industryPerfMap.set(industry, { count: 0, wins: 0, returns: [] });
    const stat = industryPerfMap.get(industry);
    stat.count++;
    if ((trade.return_pct ?? -Infinity) > 0) stat.wins++;
    if (trade.return_pct != null) stat.returns.push(trade.return_pct);
  });
  const industryPerformance = [...industryPerfMap.entries()]
    .map(([industry, stat]) => ({
      industry,
      count: stat.count,
      win_rate: ratio(stat.wins, stat.count),
      avg_return: average(stat.returns)
    }))
    .sort((a, b) => b.count - a.count || (b.avg_return ?? 0) - (a.avg_return ?? 0));

  const holdLabels = ["1天", "2-3天", "4-5天", "6-10天", "11天以上", "未知"];
  const holdDistribution = holdLabels.map((label) => ({
    label,
    ratio: ratio(closedTrades.filter((trade) => classifyHold(trade.hold_days) === label).length, closedTrades.length)
  }));

  const monthlyMap = new Map();
  closedTrades.forEach((trade) => {
    const month = (trade.sell_date || trade.buy_date || "").slice(0, 7);
    if (!month) return;
    if (!monthlyMap.has(month)) monthlyMap.set(month, []);
    monthlyMap.get(month).push(trade);
  });
  const monthlyStats = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, rows]) => ({
      month,
      count: rows.length,
      win_rate: ratio(rows.filter((row) => (row.return_pct ?? -Infinity) > 0).length, rows.length),
      avg_return: average(rows.map((row) => row.return_pct).filter((value) => value != null)),
      avg_hold_days: average(rows.map((row) => row.hold_days).filter((value) => value != null))
    }));

  const closedCount = closedTrades.length;
  const uniqueStocks = unique(closedTrades.map((trade) => trade.stock));
  const activityDays = unique(
    closedTrades.flatMap((trade) => [trade.buy_date, trade.sell_date]).filter(Boolean)
  ).length;
  const growthBoards = ["创业板", "科创板", "北交所"];
  const growthBoardRate = ratio(
    closedTrades.filter((trade) => growthBoards.includes(trade.board)).length,
    closedCount
  );
  const within3dRate = ratio(closedTrades.filter((trade) => (trade.hold_days ?? 999) <= 3).length, closedCount);
  const within5dRate = ratio(closedTrades.filter((trade) => (trade.hold_days ?? 999) <= 5).length, closedCount);
  const oneDayRate = ratio(closedTrades.filter((trade) => (trade.hold_days ?? 999) <= 1).length, closedCount);
  const profitOver2Rate = ratio(closedTrades.filter((trade) => (trade.return_pct ?? -Infinity) >= 2).length, closedCount);
  const winnerReturns = winners.map((trade) => trade.return_pct).filter((value) => value != null);
  const loserReturns = losers.map((trade) => trade.return_pct).filter((value) => value != null);
  const industryTop3Rate = industryDistribution
    .slice(0, 3)
    .reduce((acc, item) => acc + item.ratio, 0);
  const summary = {
    trade_count: closedCount,
    open_count: openPositions.length,
    snapshot_count: holdingSnapshots.length,
    latest_snapshot_date: latestHoldingSnapshotDate,
    unique_stock_count: uniqueStocks.length,
    activity_days: activityDays,
    win_rate: ratio(winners.length, closedCount),
    avg_return: average(returns),
    median_return: median(returns),
    avg_hold: average(holds),
    median_hold: median(holds),
    winner_avg_return: average(winnerReturns),
    loser_avg_return: average(loserReturns),
    winner_avg_hold: average(winners.map((trade) => trade.hold_days).filter((value) => value != null)),
    loser_avg_hold: average(losers.map((trade) => trade.hold_days).filter((value) => value != null)),
    one_day_rate: oneDayRate,
    within_3d_rate: within3dRate,
    within_5d_rate: within5dRate,
    profit_over_2_rate: profitOver2Rate,
    profit_factor: loserReturns.length ? sum(winnerReturns) / Math.abs(sum(loserReturns)) : null,
    max_win: returns.length ? Math.max(...returns) : null,
    max_loss: returns.length ? Math.min(...returns) : null,
    max_win_stock: returns.length ? closedTrades.reduce((best, trade) => ((trade.return_pct ?? -Infinity) > (best.return_pct ?? -Infinity) ? trade : best), closedTrades[0]).stock : "—",
    max_loss_stock: returns.length ? closedTrades.reduce((worst, trade) => ((trade.return_pct ?? Infinity) < (worst.return_pct ?? Infinity) ? trade : worst), closedTrades[0]).stock : "—",
    growth_board_rate: growthBoardRate,
    industry_count: industryDistribution.length,
    industry_focus_rate: industryDistribution[0]?.ratio ?? 0,
    industry_top3_rate: industryTop3Rate,
    stock_breadth_rate: stockBreadthRate,
    cash_cows: cashCows,
    stubborn_losers: stubbornLosers
  };

  const tradingStyle = !closedCount
    ? "持仓跟踪"
    : within3dRate >= 65
    ? "超短快切"
    : within5dRate >= 65 || (summary.avg_hold ?? 0) <= 6
      ? "短线波段"
      : (summary.avg_hold ?? 0) <= 14
        ? "中短波段"
        : "中线趋势";

  const boardFocus = boardDistribution[0]?.label || "未识别";
  const industryFocus = industryDistribution[0]?.label || "未识别";
  const logicMode = repeatedNames[0]?.count >= 3 ? "围绕核心标的反复滚动" : "分散轮动择机切换";
  const holdingState = openPositions.length
    ? `仍有 ${openPositions.length} 只未完成头寸`
    : "样本以内以闭环交易为主";

  const styleTags = [];
  if (within3dRate >= 60) styleTags.push("高频切换");
  if (within5dRate >= 70) styleTags.push("短线节奏");
  if ((summary.avg_hold ?? 0) >= 10) styleTags.push("波段持有");
  if (growthBoardRate >= 55) styleTags.push("双创板块偏好");
  if ((summary.win_rate ?? 0) >= 65) styleTags.push("胜率占优");
  if ((summary.profit_factor ?? 0) >= 1.8) styleTags.push("正期望明确");
  if (repeatedNames[0]?.count >= 3) styleTags.push("核心标的滚动");
  if ((summary.max_loss ?? 0) <= -12) styleTags.push("尾部亏损需控");
  if (openPositions.length) styleTags.push("存在未完成头寸");
  if (industryDistribution[0]?.ratio >= 45) styleTags.push("行业集中度高");
  if (industryDistribution.length >= 5) styleTags.push("行业覆盖较广");

  const consistencyScore = Math.min(
    96,
    42 +
      (closedCount >= 20 ? 10 : 0) +
      (within5dRate >= 60 ? 10 : 0) +
      ((summary.profit_factor ?? 0) >= 1.5 ? 12 : 0) +
      ((summary.win_rate ?? 0) >= 65 ? 10 : 0) +
      (dataset.strategy_points?.length ? 6 : 0) +
      (dataset.premarket_insights?.length ? 4 : 0)
  );

  const transparencyScore = Math.min(
    92,
    38 +
      (closedCount >= 20 ? 12 : 0) +
      (dataset.source_meta?.format ? 10 : 0) +
      (openPositions.length ? 8 : 0) +
      (closedTrades.some((trade) => trade.buy_price != null && trade.sell_price != null) ? 10 : 0) +
      (dataset.sample_validations?.length ? 8 : 0)
  );

  const adaptive = buildAdaptiveNarratives({
    name: dataset.name || "该组合",
    tradingStyle,
    logicMode,
    boardFocus,
    industryFocus,
    industryDistribution,
    industryPerformance,
    repeatedNames,
    closedCount,
    activityDays,
    uniqueStocks,
    openPositions,
    within3dRate,
    within5dRate,
    oneDayRate,
    growthBoardRate,
    summary,
    strategy_points: dataset.strategy_points || []
  });

  const evidence = [
    { title: "解析格式", text: `${dataset.source_meta?.format || dataset.sourceType || "本地数据"} · ${dataset.source_meta?.sheet_name || "默认工作表"}` },
    { title: "交易节奏", text: `3日内 ${pct(within3dRate)}，5日内 ${pct(within5dRate)}，平均持有 ${num(summary.avg_hold)} 天。` },
    { title: "股票特性", text: `主要集中在 ${boardFocus}，双创及北交交易占比 ${pct(growthBoardRate)}。` },
    { title: "行业口径", text: industryFocus !== "未识别" ? `统一按申万二级行业补全，当前第一行业为 ${industryFocus}，占比 ${pct(summary.industry_focus_rate)}。` : "行业字段尚未完成补全。" },
    { title: "持仓状态", text: openPositions.length ? `当前识别出 ${openPositions.length} 只未完成头寸。` : "当前样本未识别到未完成头寸，闭环程度较高。" },
    { title: "盘前材料", text: dataset.premarket_insights?.length ? `已结构化 ${dataset.premarket_insights.length} 条盘前洞察，可用于知行合一校验。` : "尚未导入盘前洞察材料。" }
  ];

  return {
    name: dataset.name || "导入组合",
    sourceType: dataset.sourceType || "本地数据",
    sourceMeta: dataset.source_meta || {},
    strategy_points: dataset.strategy_points || [],
    premarket_insights: dataset.premarket_insights || [],
    strengths: dataset.strengths?.length ? dataset.strengths : adaptive.strengths,
    weaknesses: dataset.weaknesses?.length ? dataset.weaknesses : adaptive.weaknesses,
    suggestions: dataset.suggestions?.length ? dataset.suggestions : adaptive.suggestions,
    trades: closedTrades,
    openPositions,
    holdDistribution,
    boardDistribution,
    industryDistribution,
    industryPerformance,
    monthlyStats,
    repeatedNames,
    sample_validations: dataset.sample_validations || [],
    styleTags,
    consistencyScore,
    transparencyScore,
    judgement: adaptive.judgement,
    evidence,
    tradingTraits: adaptive.tradingTraits,
    holdingTraits: adaptive.holdingTraits,
    logicPoints: adaptive.logicPoints,
    strategyValidations: adaptive.strategyValidations,
    scripts: adaptive.scripts,
    personas: adaptive.personas,
    risks: adaptive.risks,
    profile: {
      tradingStyle,
      boardFocus,
      industryFocus,
      holdingState,
      fitLabel: within3dRate >= 60 || (summary.avg_hold ?? 0) <= 3 
        ? "超短线活跃客户" 
        : (summary.avg_hold ?? 0) <= 7 
          ? "短线波段客户" 
          : (summary.avg_hold ?? 0) <= 14 
            ? "中短线波段客户" 
            : "中长线趋势客户"
    },
    summary
  };
}

function getDatasetLatestDate(dataset) {
  const tradeDates = normalizeTrades(dataset.trades)
    .flatMap((trade) => [trade.buy_date, trade.sell_date])
    .filter(Boolean)
    .map(toDateMs)
    .filter((value) => value != null);
  const openDates = normalizeOpenPositions(dataset.open_positions)
    .map((item) => toDateMs(item.buy_date))
    .filter((value) => value != null);
  const allDates = [...tradeDates, ...openDates];
  return allDates.length ? Math.max(...allDates) : 0;
}

function buildDatasetMeta(dataset, fallbackName = "导入组合") {
  const keyName = extractPortfolioKeyName(dataset.name || fallbackName);
  const tradeSignatures = unique(normalizeTrades(dataset.trades).map(makeTradeSignature)).sort();
  const openSignatures = unique(normalizeOpenPositions(dataset.open_positions).map(makeOpenPositionSignature)).sort();
  const snapshotSignatures = unique((dataset.daily_snapshots || dataset.snapshots || []).map(makeHoldingSnapshotSignature)).sort();
  return {
    keyName,
    keySlug: toPortfolioSlug(keyName),
    tradeSignatures,
    openSignatures,
    snapshotSignatures,
    latestDate: getDatasetLatestDate(dataset)
  };
}

function createIndustryPieMarkup(industryDistribution) {
  if (!industryDistribution.length) {
    return `<div class="empty-state">行业数据尚未补全，暂时无法生成行业配比图。</div>`;
  }

  const topItems = industryDistribution.slice(0, 5);
  const otherRatio = Math.max(
    0,
    100 - topItems.reduce((acc, item) => acc + item.ratio, 0)
  );
  const palette = ["#1d4ed8", "#7c3aed", "#dc2626", "#d97706", "#059669", "#64748b"];
  const slices = topItems.map((item, index) => ({
    ...item,
    color: palette[index]
  }));
  if (otherRatio > 0.01) {
    slices.push({
      label: "其余行业",
      ratio: otherRatio,
      count: 0,
      color: palette[5]
    });
  }
  let progress = 0;
  const gradient = slices.map((item) => {
    const start = progress;
    progress += item.ratio;
    return `${item.color} ${start.toFixed(2)}% ${progress.toFixed(2)}%`;
  }).join(", ");
  const topFocus = topItems[0];

  return `
    <div class="industry-visual">
      <div class="pie-card">
        <div class="pie-chart-shell">
          <div class="pie-donut" style="background: conic-gradient(${gradient});" aria-label="行业配比饼图"></div>
          <div class="pie-center">
            <strong>${pct(topFocus?.ratio, 1)}</strong>
            <span>${topFocus?.label || "Top 1 行业"}</span>
          </div>
        </div>
      </div>
      <div class="legend-list">
        ${topItems.map((item, index) => `
          <div class="legend-item">
            <span class="legend-swatch" style="background:${palette[index]};"></span>
            <div class="legend-copy">
              <strong>${item.label}</strong>
              <span>${item.count} 次行业暴露</span>
              <div class="legend-bar"><span style="width:${item.ratio.toFixed(2)}%; background:${palette[index]};"></span></div>
            </div>
            <div class="legend-value">${pct(item.ratio)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function getCompareMetricBlueprint() {
  return [
    {
      key: "win_rate",
      label: "胜率",
      better: "max",
      display: (analysis) => pct(analysis.summary.win_rate),
      numeric: (analysis) => analysis.summary.win_rate ?? 0,
      score: (analysis) => clamp(analysis.summary.win_rate ?? 0, 0, 100)
    },
    {
      key: "avg_return",
      label: "平均收益",
      better: "max",
      display: (analysis) => pct(analysis.summary.avg_return),
      numeric: (analysis) => analysis.summary.avg_return ?? 0,
      score: (analysis) => clamp(((analysis.summary.avg_return ?? 0) + 2) * 12.5, 0, 100)
    },
    {
      key: "avg_hold",
      label: "持股效率",
      better: "min",
      display: (analysis) => `${num(analysis.summary.avg_hold)}天`,
      numeric: (analysis) => analysis.summary.avg_hold ?? 999,
      score: (analysis) => clamp(100 - (analysis.summary.avg_hold ?? 0) * 5.5, 0, 100)
    },
    {
      key: "profit_factor",
      label: "盈亏交换",
      better: "max",
      display: (analysis) => num(analysis.summary.profit_factor),
      numeric: (analysis) => analysis.summary.profit_factor ?? 0,
      score: (analysis) => clamp((analysis.summary.profit_factor ?? 0) * 28, 0, 100)
    },
    {
      key: "industry_focus_rate",
      label: "行业聚焦",
      better: "max",
      display: (analysis) => pct(analysis.summary.industry_focus_rate),
      numeric: (analysis) => analysis.summary.industry_focus_rate ?? 0,
      score: (analysis) => clamp(analysis.summary.industry_focus_rate ?? 0, 0, 100)
    },
    {
      key: "consistency",
      label: "逻辑一致",
      better: "max",
      display: (analysis) => `${num(analysis.consistencyScore, 0)}分`,
      numeric: (analysis) => analysis.consistencyScore ?? 0,
      score: (analysis) => clamp(analysis.consistencyScore ?? 0, 0, 100)
    }
  ];
}

function createCompareRadarMarkup(portfolios) {
  const metrics = getCompareMetricBlueprint();
  const palette = ["#1d4ed8", "#7c3aed", "#dc2626", "#d97706", "#059669", "#0f766e"];
  const center = 180;
  const radius = 122;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const axisStep = (Math.PI * 2) / metrics.length;
  const polygons = levels.map((level) => {
    const points = metrics.map((_, index) => {
      const angle = -Math.PI / 2 + axisStep * index;
      const x = center + Math.cos(angle) * radius * level;
      const y = center + Math.sin(angle) * radius * level;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${points}" fill="none" stroke="rgba(148,163,184,0.26)" stroke-width="1"></polygon>`;
  }).join("");
  const axes = metrics.map((metric, index) => {
    const angle = -Math.PI / 2 + axisStep * index;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    const labelX = center + Math.cos(angle) * (radius + 24);
    const labelY = center + Math.sin(angle) * (radius + 24);
    return `
      <line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(148,163,184,0.22)" stroke-width="1"></line>
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#475569">${metric.label}</text>
    `;
  }).join("");
  const series = portfolios.map((item, index) => {
    const color = palette[index % palette.length];
    const points = metrics.map((metric, metricIndex) => {
      const angle = -Math.PI / 2 + axisStep * metricIndex;
      const scale = metric.score(item.analysis) / 100;
      const x = center + Math.cos(angle) * radius * scale;
      const y = center + Math.sin(angle) * radius * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `
      <polygon points="${points}" fill="${color}22" stroke="${color}" stroke-width="2"></polygon>
    `;
  }).join("");

  return `
    <div class="compare-visual-card">
      <h3>风格雷达</h3>
      <p>从胜率、收益、持股效率、盈亏交换、行业聚焦和逻辑一致性六个维度观察组合差异。</p>
      <div class="radar-shell">
        <div class="radar-stage">
          <svg viewBox="0 0 360 360" aria-label="组合对比雷达图">
            ${polygons}
            ${axes}
            ${series}
          </svg>
        </div>
        <div class="radar-legend">
          ${portfolios.map((item, index) => `
            <div class="radar-legend-item">
              <span class="radar-legend-dot" style="background:${palette[index % palette.length]};"></span>
              <div>
                <strong>${item.name}</strong>
                <span>${item.analysis.profile.tradingStyle} · ${pct(item.analysis.summary.win_rate)} · ${pct(item.analysis.summary.avg_return)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function createCompareHeatmapMarkup(portfolios) {
  const metrics = getCompareMetricBlueprint();
  const rows = metrics.map((metric) => {
    const values = portfolios.map((item) => metric.numeric(item.analysis)).filter((value) => Number.isFinite(value));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    return `
      <div class="heatmap-row">
        <div class="heatmap-label">${metric.label}</div>
        <div class="heatmap-scroll">
          <div class="heatmap-cells">
            ${portfolios.map((item) => {
              const value = metric.numeric(item.analysis);
              const base = max === min
                ? 0.5
                : (value - min) / (max - min);
              const intensity = metric.better === "min" ? 1 - base : base;
              const alpha = (0.16 + intensity * 0.42).toFixed(2);
              const background = intensity >= 0.7
                ? `rgba(217, 45, 32, ${alpha})`
                : intensity <= 0.3
                  ? `rgba(3, 152, 85, ${Math.max(0.12, 0.34 - intensity * 0.22).toFixed(2)})`
                  : `rgba(37, 99, 235, ${(0.16 + intensity * 0.18).toFixed(2)})`;
              return `
                <div class="heatmap-cell ${item.id === state.currentPortfolioId ? "active" : ""}" style="background:${background};">
                  <strong>${item.name}</strong>
                  <span>${metric.display(item.analysis)}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }).join("");
  return `
    <div class="compare-visual-card">
      <h3>强弱热力矩阵</h3>
      <p>左侧看指标，右侧横向滚动看组合。红色代表更强，绿色代表相对更弱或更慢，当前分析组合会额外高亮。</p>
      <div class="heatmap-grid">${rows}</div>
    </div>
  `;
}

function mergeDatasets(existing, incoming, baseName) {
  const tradeMap = new Map();
  normalizeTrades(existing.trades).forEach((trade) => {
    tradeMap.set(makeTradeSignature(trade), trade);
  });
  normalizeTrades(incoming.trades).forEach((trade) => {
    tradeMap.set(makeTradeSignature(trade), trade);
  });

  const openMap = new Map();
  normalizeOpenPositions(existing.open_positions).forEach((item) => {
    openMap.set(makeOpenPositionSignature(item), item);
  });
  normalizeOpenPositions(incoming.open_positions).forEach((item) => {
    openMap.set(makeOpenPositionSignature(item), item);
  });

  const snapshotMap = new Map();
  [...(existing.daily_snapshots || existing.snapshots || [])].forEach((snapshot) => {
    const date = getSnapshotDate(snapshot);
    if (date) snapshotMap.set(date, snapshot);
  });
  [...(incoming.daily_snapshots || incoming.snapshots || [])].forEach((snapshot) => {
    const date = getSnapshotDate(snapshot);
    if (date) snapshotMap.set(date, snapshot);
  });

  const merged = {
    ...existing,
    ...incoming,
    name: baseName,
    trades: [...tradeMap.values()].sort((a, b) => {
      const aMs = toDateMs(a.sell_date || a.buy_date) ?? 0;
      const bMs = toDateMs(b.sell_date || b.buy_date) ?? 0;
      return aMs - bMs;
    }),
    open_positions: [...openMap.values()],
    daily_snapshots: [...snapshotMap.values()].sort((a, b) => (getSnapshotDate(a) || "").localeCompare(getSnapshotDate(b) || "")),
    holding_trading_dates: unique([
      ...(existing.holding_trading_dates || []),
      ...(incoming.holding_trading_dates || []),
    ].map(normalizeDateInput).filter(Boolean)).sort((a, b) => a.localeCompare(b)),
    premarket_insights: unique([...(existing.premarket_insights || []), ...(incoming.premarket_insights || [])].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    strategy_points: unique([...(existing.strategy_points || []), ...(incoming.strategy_points || [])]),
    strengths: unique([...(existing.strengths || []), ...(incoming.strengths || [])]),
    weaknesses: unique([...(existing.weaknesses || []), ...(incoming.weaknesses || [])]),
    suggestions: unique([...(existing.suggestions || []), ...(incoming.suggestions || [])]),
    sample_validations: unique([...(existing.sample_validations || []), ...(incoming.sample_validations || [])].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    source_meta: {
      ...(existing.source_meta || {}),
      ...(incoming.source_meta || {}),
      format: unique([existing.source_meta?.format, incoming.source_meta?.format].filter(Boolean)).join(" + "),
      notes: unique([...(existing.source_meta?.notes || []), ...(incoming.source_meta?.notes || []), "已自动与同组合历史记录衔接"])
    }
  };

  return merged;
}

function buildPortfolioRecord(dataset, fallbackName = "导入组合") {
  const keyName = extractPortfolioKeyName(dataset.name || fallbackName);
  const normalized = { ...dataset, name: keyName };
  const meta = buildDatasetMeta(normalized, keyName);
  return {
    id: makeId(),
    name: keyName,
    keySlug: meta.keySlug,
    dataset: normalized,
    analysis: computeAnalysis(normalized),
    meta
  };
}

function addPortfolio(dataset, message, fallbackName) {
  const normalized = normalizeImportedDataset(dataset, fallbackName);
  const incomingMeta = buildDatasetMeta(normalized, fallbackName);
  const existingIndex = state.portfolios.findIndex((item) => item.keySlug === incomingMeta.keySlug);

  if (existingIndex > -1) {
    const existing = state.portfolios[existingIndex];
    const sameTrades =
      existing.meta.tradeSignatures.length === incomingMeta.tradeSignatures.length &&
      existing.meta.tradeSignatures.every((item, index) => item === incomingMeta.tradeSignatures[index]);
    const sameOpens =
      existing.meta.openSignatures.length === incomingMeta.openSignatures.length &&
      existing.meta.openSignatures.every((item, index) => item === incomingMeta.openSignatures[index]);
    const sameSnapshots =
      (existing.meta.snapshotSignatures || []).length === (incomingMeta.snapshotSignatures || []).length &&
      (existing.meta.snapshotSignatures || []).every((item, index) => item === (incomingMeta.snapshotSignatures || [])[index]);

    if (sameTrades && sameOpens && sameSnapshots) {
      state.currentPortfolioId = existing.id;
      persistState();
      renderAll();
      actionStatusEl.textContent = `${existing.name} 已存在，已跳过重复导入。`;
      return { action: "skipped", count: 0, name: existing.name };
    }

    const merged = mergeDatasets(existing.dataset, normalized, existing.name);
    const updatedRecord = buildPortfolioRecord(merged, existing.name);
    updatedRecord.id = existing.id;
    state.portfolios.splice(existingIndex, 1, updatedRecord);
    state.currentPortfolioId = existing.id;
    if (!state.compareIds.includes(existing.id) && state.compareIds.length < 2) {
      state.compareIds.push(existing.id);
    }
    persistState();
    renderAll();
    actionStatusEl.textContent = incomingMeta.latestDate >= existing.meta.latestDate
      ? `${existing.name} 已自动更新并衔接新记录。`
      : `${existing.name} 已自动合并历史记录。`;
    enrichPortfolioIndustries(existing.id);
    return { action: "updated", count: 1, name: existing.name };
  }

  const record = buildPortfolioRecord(normalized, fallbackName);
  state.portfolios.push(record);
  state.currentPortfolioId = record.id;
  if (!state.compareIds.includes(record.id) && state.compareIds.length < 2) {
    state.compareIds.push(record.id);
  }
  persistState();
  renderAll();
  actionStatusEl.textContent = message;
  enrichPortfolioIndustries(record.id);
  return { action: "added", count: 1, name: record.name };
}

function renderTabs() {
  tabNavEl.innerHTML = tabs.map((tab) => `
    ${tab.href ? `<a class="tab-btn" href="${tab.href}" target="_blank" rel="noreferrer">` : `<button class="tab-btn ${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">`}
      <span class="tab-name">${tab.name}</span>
      <span class="tab-desc">${tab.desc}</span>
    ${tab.href ? "</a>" : "</button>"}
  `).join("");

  tabNavEl.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.tagName === "A") return;
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      persistState();
      renderAll();
    });
  });
}

function renderHeroStats(analysis) {
  const hasClosedTrades = analysis.summary.trade_count > 0;
  const activityLabel = hasClosedTrades ? "已闭环交易" : "持仓快照";
  const activityValue = hasClosedTrades
    ? analysis.summary.trade_count
    : `${analysis.summary.snapshot_count || 0} 天`;
  const activityNote = hasClosedTrades
    ? (analysis.summary.open_count ? `另有 ${analysis.summary.open_count} 只未完成头寸` : "当前样本以闭环交易为主")
    : `${analysis.summary.latest_snapshot_date || "暂无日期"} · 当前 ${analysis.summary.open_count || 0} 只持仓`;
  heroStatsEl.innerHTML = `
    <div class="hero-stat">
      <div class="label">交易风格</div>
      <div class="value">${analysis.profile.tradingStyle}</div>
      <div class="note">${hasClosedTrades ? "由持有周期、换手密度和收益兑现节奏联合识别。" : "尚无完整买卖流水，当前按每日持仓变化持续跟踪。"}</div>
    </div>
    <div class="hero-stat">
      <div class="label">板块与行业</div>
      <div class="value">${analysis.profile.boardFocus}</div>
      <div class="note">${analysis.profile.industryFocus !== "未识别" ? `${analysis.profile.industryFocus} 舒适区` : "行业舒适区待补全"}</div>
    </div>
    <div class="hero-stat">
      <div class="label">${activityLabel}</div>
      <div class="value" style="color: var(--up)">${activityValue}</div>
      <div class="note">${activityNote}</div>
    </div>
    <div class="hero-stat">
      <div class="label">第一行业占比</div>
      <div class="value" style="color: var(--amber)">${pct(analysis.summary.industry_focus_rate, 1)}</div>
      <div class="note">前 3 行业 ${pct(analysis.summary.industry_top3_rate, 1)} · 覆盖 ${analysis.summary.industry_count || 0} 个行业</div>
    </div>
  `;
}

function renderPortfolioLibrary() {
  portfolioCountEl.textContent = `${state.portfolios.length} 个`;
  if (!state.portfolios.length) {
    portfolioLibraryEl.innerHTML = `<div class="empty-state">当前没有已导入组合。可使用上方导入入口添加交易数据。</div>`;
    return;
  }
  portfolioLibraryEl.innerHTML = state.portfolios.map((item) => `
    <div class="portfolio-item ${item.id === state.currentPortfolioId ? "active" : ""}">
      <button class="portfolio-select" data-select-id="${item.id}">
        <strong>${item.name}</strong>
        <span>${item.analysis.sourceType} · ${item.analysis.sourceMeta.format || "本地数据"}</span>
      </button>
      <div class="portfolio-row">
        <div class="portfolio-mini">
          <span class="mini-chip">${item.analysis.profile.tradingStyle}</span>
          <span class="mini-chip">胜率 ${pct(item.analysis.summary.win_rate)}</span>
          <span class="mini-chip">${item.analysis.summary.trade_count} 笔</span>
        </div>
        <label class="current-check">
          <input type="radio" name="currentPortfolio" data-current-id="${item.id}" ${item.id === state.currentPortfolioId ? "checked" : ""}>
          当前分析
        </label>
        <label class="compare-check">
          <input type="checkbox" data-compare-id="${item.id}" ${state.compareIds.includes(item.id) ? "checked" : ""}>
          对比
        </label>
      </div>
    </div>
  `).join("");

  portfolioLibraryEl.querySelectorAll("[data-select-id]").forEach((node) => {
    node.addEventListener("click", () => {
      state.currentPortfolioId = node.dataset.selectId;
      persistState();
      renderAll();
      queueLogicValidationRefresh("portfolio_switched", 500);
    });
  });

  portfolioLibraryEl.querySelectorAll("[data-current-id]").forEach((node) => {
    node.addEventListener("change", () => {
      state.currentPortfolioId = node.dataset.currentId;
      persistState();
      renderAll();
      queueLogicValidationRefresh("portfolio_switched", 500);
    });
  });

  portfolioLibraryEl.querySelectorAll("[data-compare-id]").forEach((node) => {
    node.addEventListener("change", () => {
      const compareId = node.dataset.compareId;
      if (node.checked) {
        if (!state.compareIds.includes(compareId)) state.compareIds.push(compareId);
      } else {
        state.compareIds = state.compareIds.filter((id) => id !== compareId);
      }
      persistState();
      renderAll();
    });
  });
}

function renderEmptyWorkspace() {
  heroStatsEl.innerHTML = `
    <div class="hero-stat">
      <div class="label">当前状态</div>
      <div class="value">空工作台</div>
      <div class="note">可使用页面顶部的永久导入栏加载 Excel、CSV、JSON 或整个文件夹。</div>
    </div>
    <div class="hero-stat">
      <div class="label">导入方式</div>
      <div class="value">文件 / 文件夹</div>
      <div class="note">支持 Excel、CSV、JSON、HTML 等交易明细格式。</div>
    </div>
    <div class="hero-stat">
      <div class="label">已导入组合</div>
      <div class="value" style="color: var(--up)">0</div>
      <div class="note">通过启动脚本打开时，空数据库会自动载入随包示例组合。</div>
    </div>
    <div class="hero-stat">
      <div class="label">打包状态</div>
      <div class="value" style="color: var(--amber)">Portable</div>
      <div class="note">数据、启动脚本和导入入口均按离线交付场景保留。</div>
    </div>
  `;

  statusTitleEl.textContent = "当前组合：未导入数据";
  statusDescEl.textContent = "空界面模式 · 未附带任何交易样本";
  statusChipsEl.innerHTML = `
    <span class="status-chip violet">空工作台</span>
    <span class="status-chip">待导入</span>
  `;
  workspaceSummaryTitleEl.textContent = "等待导入组合";
  workspaceSummaryDescEl.textContent = "当前版本仅保留界面与导入能力，不包含任何底层交易数据。开发方可直接在此基础上接入新的数据源、接口或本地样本。";

  const viewConfigs = {
    overview: {
      title: "尚未导入任何组合",
      desc: "点击上方“导入文件”或“导入文件夹”后，系统才会生成综合判断、风格画像、对客话术和数据明细。"
    },
    compare: {
      title: "暂无可对比组合",
      desc: "至少导入 2 个组合后，这里才会展示横向比较、指标冠军和热力矩阵。"
    },
    validation: {
      title: "暂无验证样本",
      desc: "导入交易明细及相关宣传材料后，这里会生成逻辑验证和证据匹配结果。"
    },
    style: {
      title: "暂无风格画像",
      desc: "导入真实交易记录后，这里会分析交易节奏、行业舒适区、板块偏好和持仓结构。"
    },
    talk: {
      title: "暂无对客话术",
      desc: "话术内容依赖交易样本自动生成，当前空界面不展示任何历史结论。"
    },
    material: {
      title: "暂无可生成物料",
      desc: "导入持仓和主理人语料后，这里会生成私聊、社群、朋友圈、电话跟进等多场景对客话术。"
    },
    persona: {
      title: "暂无客群匹配结果",
      desc: "导入组合后，这里会基于收益结构、波动体验和风格特征生成客群适配建议。"
    },
    data: {
      title: "暂无数据明细",
      desc: "导入闭环交易和未完成头寸后，这里才会展示明细表、模板参考和导出结果。"
    }
  };

  Object.entries(viewConfigs).forEach(([tabId, config]) => {
    const container = document.getElementById(`view-${tabId}`);
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">+</div>
        <h4>${config.title}</h4>
        <p>${config.desc}</p>
      </div>
    `;
  });
}

function summarizeFeedThemes() {
  const counter = {};
  state.feedRecords.forEach((record) => {
    (record.matched_themes || record.focus_directions || []).forEach((theme) => {
      counter[theme] = (counter[theme] || 0) + 1;
    });
  });
  return Object.entries(counter)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getRecentDateStrings(days = 14) {
  const dates = [];
  const cursor = new Date();
  for (let index = 0; index < days; index += 1) {
    const item = new Date(cursor);
    item.setDate(cursor.getDate() - index);
    dates.push(formatDateObject(item));
  }
  return dates;
}

function countRecordsByDate(records, date, sourceType = "") {
  return (records || []).filter((record) => {
    const sameDate = (record.date || record.doc_date || "") === date;
    if (!sameDate) return false;
    if (!sourceType) return true;
    return (record.source_type || "") === sourceType;
  }).length;
}

function renderSyncStatusBadge(count, label = "已同步") {
  if (count > 0) return `<span class="feed-sync-badge">${label} ${count}</span>`;
  return `<span class="feed-sync-badge" style="background:rgba(220,38,38,0.08); color:#b91c1c;">待补同步</span>`;
}

function summarizeCorpusByDate(date) {
  const counts = {};
  ADVISOR_CORPUS_TYPES.forEach((type) => {
    counts[type] = countRecordsByDate(state.feedRecords, date, type);
  });
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const syncedTypes = ADVISOR_CORPUS_TYPES.filter((type) => counts[type] > 0);
  return { counts, total, syncedTypes };
}

function latestAdvisorCorpusRecord() {
  return [...(state.feedRecords || [])]
    .filter((item) => ADVISOR_CORPUS_TYPES.includes(item.source_type || ""))
    .sort((a, b) => `${b.date || ""}${b.source_type || ""}`.localeCompare(`${a.date || ""}${a.source_type || ""}`))[0];
}

function renderCompactSyncBadge(count, label) {
  const ok = count > 0;
  return `<span class="feed-sync-badge" style="${ok ? "" : "background:rgba(220,38,38,0.08); color:#b91c1c;"}">${escapeHtml(label)}${ok ? ` ${count}` : " - "}</span>`;
}

function renderAutoSyncDashboard() {
  const dates = getRecentDateStrings(14);
  const syncRows = dates.map((date) => {
    const corpus = summarizeCorpusByDate(date);
    return {
      date,
      ...corpus,
      hotCount: countRecordsByDate(state.hotRecords, date)
    };
  });

  return `
    <div class="bento-grid">
      <div class="panel-card bento-col-12">
        <div class="feed-panel-heading">
          <div>
            <h3>同步明细</h3>
            <p class="lead">金山共享表格主理人语料与研报热点会在打开网页时自动补同步。</p>
          </div>
          <div class="feed-sync-badge">研报 08:00；主理人语料 20:00</div>
        </div>
        <div class="feed-actions" style="margin-top:14px;">
          <span class="natural-import-hint">用于检查是否漏同步，手动补同步可能需要几十秒。</span>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="pill-btn primary" id="runStartupSyncBtn" type="button">立即补同步</button>
            <button class="pill-btn secondary" id="fetchMarketSnapshotBtn" type="button">抓取盘面验证</button>
          </div>
        </div>
        <div class="feed-inline-status" id="feedInlineStatus">自动刷新：研报热点标题每天 08:00；金山共享表格主理人语料每天 20:00；每次打开网页会自动补同步漏掉日期。</div>
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead><tr><th>日期</th><th>早评</th><th>盘前</th><th>午评</th><th>问答</th><th>复盘</th><th>研报热点</th><th class="left">状态</th></tr></thead>
            <tbody>
              ${syncRows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.date)}</td>
                  <td>${renderCompactSyncBadge(row.counts["早评"], "早评")}</td>
                  <td>${renderCompactSyncBadge(row.counts["盘前洞察"], "盘前")}</td>
                  <td>${renderCompactSyncBadge(row.counts["午评"], "午评")}</td>
                  <td>${renderCompactSyncBadge(row.counts["盘中问答"], "问答")}</td>
                  <td>${renderCompactSyncBadge(row.counts["收评复盘"], "复盘")}</td>
                  <td>${renderSyncStatusBadge(row.hotCount, "热点")}</td>
                  <td class="left">${row.total && row.hotCount ? `已同步 ${row.total} 条主理人语料` : "打开网页后会自动尝试补同步"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderSignedPct(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const parsed = Number(value);
  return `${parsed > 0 ? "+" : ""}${num(parsed, 2)}%`;
}

function pctTone(value) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return Number(value) >= 0 ? "up-text" : "down-text";
}

function renderAdvisorReviewSummaryBlock(summaryState) {
  const summary = summaryState?.summary;
  if (!summary) {
    return `
      <div class="advisor-review-ai empty">
        <strong>DeepSeek 复盘摘要</strong>
        <span>点击“DeepSeek 生成复盘摘要”后，系统会基于观点、持仓收益和调仓变化，生成一份可读的交易逻辑复盘。</span>
      </div>
    `;
  }
  const list = (items) => Array.isArray(items) && items.length
    ? `<ul>${items.slice(0, 4).map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`
    : `<span class="empty-state">暂无</span>`;
  return `
    <div class="advisor-review-ai">
      <div class="advisor-review-ai-head">
        <strong>DeepSeek 复盘摘要</strong>
        <span>${summaryState.mode === "deepseek" ? "大模型生成" : "本地兜底"} · ${summaryState.generated_at ? normalizeDateInput(summaryState.generated_at) : ""}</span>
      </div>
      <p>${escapeHtml(summary.summary || "暂无总评")}</p>
      <div class="advisor-review-ai-grid">
        <section><b>被验证的逻辑</b>${list(summary.validated_logic)}</section>
        <section><b>需要反思</b>${list(summary.needs_review)}</section>
        <section><b>重点标的</b>${list(summary.stock_notes)}</section>
        <section><b>下次追问</b>${list(summary.next_questions)}</section>
      </div>
    </div>
  `;
}

function renderAdvisorReviewPanel() {
  const review = state.advisorReview;
  if (!review) {
    return `
      <div class="panel-card bento-col-12 advisor-review-panel">
        <div class="feed-panel-heading">
          <div>
            <h3>主理人交易逻辑复盘</h3>
            <p class="lead">把历史早评、午评、盘中问答和每日持仓收益放在一起，帮助主理人回看自己的投资逻辑。</p>
          </div>
          <button class="pill-btn primary" id="refreshAdvisorReviewBtn" type="button">读取复盘数据</button>
        </div>
        <div class="empty-state" id="advisorReviewStatus">正在等待读取本地语料库与持仓库。</div>
      </div>
    `;
  }
  const summary = review.source_summary || {};
  const latest = review.latest_snapshot || {};
  const themeRows = review.theme_review || [];
  const stockRows = review.stock_review || [];
  const timeline = review.timeline || [];
  const maxThemeScore = Math.max(1, ...themeRows.map((item) => Number(item.review_score || 0)));
  return `
    <div class="panel-card bento-col-12 advisor-review-panel">
      <div class="feed-panel-heading">
        <div>
          <h3>主理人交易逻辑复盘</h3>
          <p class="lead">从主理人自己的语料和真实持仓出发，回看“当时怎么想、实际拿了什么、收益如何反馈”。</p>
        </div>
        <div class="advisor-profile-actions">
          <button class="pill-btn secondary" id="refreshAdvisorReviewBtn" type="button">刷新复盘</button>
          <button class="pill-btn primary" id="generateAdvisorReviewSummaryBtn" type="button">DeepSeek 生成复盘摘要</button>
        </div>
      </div>
      <div class="advisor-review-metrics">
        <div><span>语料覆盖</span><strong>${summary.advisor_docs || 0}</strong><small>${summary.advisor_days || 0} 个日期</small></div>
        <div><span>持仓覆盖</span><strong>${summary.holding_days || 0}</strong><small>${escapeHtml(summary.date_start || "—")} 至 ${escapeHtml(summary.date_end || "—")}</small></div>
        <div><span>最新持仓日</span><strong>${escapeHtml(latest.date || "—")}</strong><small>${latest.holding_count || 0} 只持仓</small></div>
        <div><span>组合当日涨跌</span><strong class="${pctTone(latest.weighted_day_pct)}">${renderSignedPct(latest.weighted_day_pct)}</strong><small>按仓位加权</small></div>
      </div>
      ${renderAdvisorReviewSummaryBlock(state.advisorReviewSummary)}
      <div class="advisor-review-grid">
        <section class="advisor-review-box">
          <h4>方向复盘</h4>
          <p>同时观察该方向在主理人语料中出现的频率、真实持仓暴露和对应价格反馈。</p>
          <div class="advisor-review-bars">
            ${themeRows.length ? themeRows.slice(0, 8).map((item) => `
              <div class="advisor-review-bar-row">
                <div class="advisor-review-bar-label">
                  <strong>${escapeHtml(item.theme)}</strong>
                  <span>语料${item.doc_days || 0}天 · 持仓${item.holding_days || 0}天 · ${escapeHtml((item.stocks || []).slice(0, 3).join("、") || "暂无标的")}</span>
                </div>
                <div class="advisor-review-bar-track"><i style="width:${Math.max(6, Math.min(100, Number(item.review_score || 0) / maxThemeScore * 100))}%"></i></div>
                <div class="${pctTone(item.avg_day_pct)}">${renderSignedPct(item.avg_day_pct)}</div>
              </div>
            `).join("") : `<div class="empty-state">暂无方向复盘数据。</div>`}
          </div>
        </section>
        <section class="advisor-review-box">
          <h4>重点标的复盘</h4>
          <p>看主理人反复持有或反复提及的标的，收益是否支撑其操作逻辑。</p>
          <div class="table-wrap compact">
            <table>
              <thead><tr><th class="left">标的</th><th>持仓日</th><th>平均仓位</th><th>最新涨跌</th><th>持有收益</th><th>提及</th></tr></thead>
              <tbody>
                ${stockRows.length ? stockRows.slice(0, 8).map((item) => `
                  <tr>
                    <td class="left"><strong>${escapeHtml(item.stock || item.name || item.code || "—")}</strong><br><span style="color:var(--muted);">${escapeHtml(item.industry || "未识别")}</span></td>
                    <td>${item.holding_days || 0}</td>
                    <td>${renderSignedPct(item.avg_weight).replace("+", "")}</td>
                    <td class="${pctTone(item.latest_day_pct)}">${renderSignedPct(item.latest_day_pct)}</td>
                    <td class="${pctTone(item.latest_return_pct)}">${renderSignedPct(item.latest_return_pct)}</td>
                    <td>${item.mention_count || 0}</td>
                  </tr>
                `).join("") : `<tr><td colspan="6">暂无标的复盘数据。</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div class="advisor-review-timeline">
        <div class="advisor-review-timeline-head">
          <h4>历史观点与持仓时间线</h4>
          <span>显示最近 ${timeline.length} 个有语料或持仓的日期</span>
        </div>
        ${timeline.length ? timeline.slice(0, 16).map((day) => `
          <article class="advisor-review-day">
            <div class="advisor-review-date">
              <strong>${escapeHtml(day.date)}</strong>
              <span>${day.doc_count || 0}条语料 · ${day.holding_count || 0}只持仓</span>
              <em class="${pctTone(day.weighted_day_pct)}">${renderSignedPct(day.weighted_day_pct)}</em>
            </div>
            <div class="advisor-review-day-main">
              <div class="advisor-review-tags">
                ${(day.themes || []).slice(0, 6).map((item) => `<span>${escapeHtml(item)}</span>`).join("") || `<span>未提取方向</span>`}
              </div>
              <p>${escapeHtml(day.core_view || "当日没有可提取的观点文本，主要参考持仓变化。")}</p>
              <div class="advisor-review-holdings">
                ${(day.top_positions || []).slice(0, 5).map((pos) => `
                  <span>${escapeHtml(pos.stock || pos.name)} <b class="${pctTone(pos.day_pct_change)}">${renderSignedPct(pos.day_pct_change)}</b>${pos.weight != null ? ` · ${renderSignedPct(pos.weight).replace("+", "")}` : ""}</span>
                `).join("") || `<span>当日无持仓快照</span>`}
              </div>
              ${(day.changes || []).length ? `<div class="advisor-review-changes">${day.changes.slice(0, 4).map((item) => `<span>${escapeHtml(item.type)} ${escapeHtml(item.stock || item.code || "")}${item.delta != null ? ` ${renderSignedPct(item.delta)}` : ""}</span>`).join("")}</div>` : ""}
            </div>
          </article>
        `).join("") : `<div class="empty-state">暂无时间线数据。</div>`}
      </div>
      <div class="advisor-profile-status" id="advisorReviewStatus"></div>
    </div>
  `;
}

function renderFeed() {
  ensureThemeMappings();
  const container = document.getElementById("view-feed");
  if (!container) return;
  const hotspotPackage = buildHotspotInsightPackage();
  const advisorProfile = buildAdvisorLearningProfile();
  const strategySnapshot = state.advisorStrategyProfile;
  const strategyProfile = strategySnapshot?.profile || {};
  const topThemes = advisorProfile.themeStats.slice(0, 6);
  const topOperations = advisorProfile.operationStyle.slice(0, 5);
  const topRisks = advisorProfile.riskStyle.slice(0, 5);
  const renderProfileTags = (items, fallback = "暂无") => {
    const list = Array.isArray(items) ? items.filter(Boolean).slice(0, 8) : [];
    return list.length
      ? `<div class="chip-list">${list.map((item) => `<span class="style-tag">${escapeHtml(String(item))}</span>`).join("")}</div>`
      : `<div class="empty-state">${escapeHtml(fallback)}</div>`;
  };
  const renderProfileList = (items, fallback = "暂无") => {
    const list = Array.isArray(items) ? items.filter(Boolean).slice(0, 6) : [];
    return list.length
      ? `<ul class="bullet-list">${list.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`
      : `<div class="empty-state">${escapeHtml(fallback)}</div>`;
  };

  container.innerHTML = `
    <div class="bento-grid">
      <div class="panel-card bento-col-12 advisor-profile-panel">
        <div class="feed-panel-heading">
          <div>
            <h3>主理人操作画像</h3>
            <p class="lead">从主理人的早评、午评、盘中问答、真实持仓和调仓中归纳；研报热点不计入主理人偏好。</p>
          </div>
          <div class="advisor-profile-actions">
            <div class="feed-sync-badge">更新于 ${strategyProfile.profile_date || strategySnapshot?.profile_date || "待生成"}</div>
            <button class="pill-btn primary" id="updateAdvisorProfileBtn" type="button">更新画像</button>
          </div>
        </div>
        <div class="advisor-profile-grid">
          <section class="advisor-profile-section">
            <div class="advisor-profile-label">关注方向</div>
            ${renderProfileTags(strategyProfile.direction_preferences || topThemes.map((item) => item.label), "方向偏好仍在积累")}
          </section>
          <section class="advisor-profile-section">
            <div class="advisor-profile-label">重点标的</div>
            ${renderProfileTags(strategyProfile.stock_focus || advisorProfile.stockStats?.map?.((item) => item.label), "标的偏好仍在积累")}
          </section>
          <section class="advisor-profile-section">
            <div class="advisor-profile-label">买入/加仓习惯</div>
            ${renderProfileList(strategyProfile.buy_triggers || topOperations.map((item) => item.label), "等待从真实调仓行为中归纳")}
          </section>
          <section class="advisor-profile-section">
            <div class="advisor-profile-label">减仓/止损习惯</div>
            ${renderProfileList(strategyProfile.sell_triggers, "尚未积累足够的真实减仓或止损样本")}
          </section>
        </div>
        <div class="advisor-style-summary">
          <span><strong>操作风格</strong>${escapeHtml(strategyProfile.position_style || advisorProfile.summary[0] || "仍在积累")}</span>
          <span><strong>风险习惯</strong>${escapeHtml(strategyProfile.risk_style || (topRisks.length ? topRisks.map((item) => item.label).join("、") : "仍在积累"))}</span>
        </div>
        <div class="advisor-profile-status" id="advisorProfileStatus"></div>
      </div>
    </div>

    <div class="bento-grid" style="margin-top:14px;">
      ${renderAdvisorReviewPanel()}
    </div>

    ${renderAutoSyncDashboard()}

    <div class="bento-grid" style="margin-top:14px;">
      <div class="panel-card bento-col-5">
        <h3>热点洞察</h3>
        <p class="lead">${hotspotPackage.latestDate ? `基于 ${hotspotPackage.latestDate} 最新研报/市场热点生成。` : "导入研报热点后自动生成。"}</p>
        <div class="insight-callout" style="white-space: pre-wrap;">${escapeHtml(hotspotPackage.insightText)}</div>
      </div>
      <div class="panel-card bento-col-7">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
          <h3 style="margin:0;">今日早评辅助稿</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="pill-btn primary" id="generateMorningDraftBtn" type="button">检索增强生成</button>
            <button class="pill-btn secondary" id="copyMorningDraftBtn" type="button">复制早评稿</button>
          </div>
        </div>
        <p class="lead">参考最新研报热点，并结合主理人历史早评中反复出现的表达和关注方向。</p>
        <div class="fold-copy" id="morningDraftText" style="white-space: pre-wrap;">${escapeHtml(hotspotPackage.morningDraft)}</div>
      </div>
    </div>

    <div class="bento-grid" style="margin-top:14px;">
      <div class="panel-card bento-col-12">
        <h3>历史板块异动</h3>
        <p class="lead">展示最新研报热点的历史排名变化，并叠加可匹配到的真实板块涨跌；暂未匹配到价格的主题会保留为待补盘面。</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>排名</th><th class="left">主题</th><th>热度变化</th><th>今日</th><th>近3日</th><th>近5日</th><th>量能</th><th class="left">综合判断</th><th class="left">依据</th></tr>
            </thead>
            <tbody>
              ${hotspotPackage.historyRows.length ? hotspotPackage.historyRows.map((item) => `
                <tr>
                  <td>${item.latest_rank || "—"}</td>
                  <td class="left"><strong>${escapeHtml(item.theme)}</strong><br><span style="color:var(--muted);">${escapeHtml(item.board_name || "未匹配板块")}</span></td>
                  <td class="${(item.rank_delta || 0) > 0 ? "up-text" : (item.rank_delta || 0) < 0 ? "down-text" : ""}">
                    ${item.rank_delta == null ? "新进入" : item.rank_delta > 0 ? `上升 ${item.rank_delta}` : item.rank_delta < 0 ? `下降 ${Math.abs(item.rank_delta)}` : "持平"}
                    <br><span style="color:var(--muted);">历史 ${item.count} 次</span>
                  </td>
                  <td class="${(item.pct_change || 0) >= 0 ? "up-text" : "down-text"}">${item.pct_change == null ? "—" : `${num(item.pct_change)}%`}</td>
                  <td class="${(item.pct_3d || 0) >= 0 ? "up-text" : "down-text"}">${item.pct_3d == null ? "—" : `${num(item.pct_3d)}%`}</td>
                  <td class="${(item.pct_5d || 0) >= 0 ? "up-text" : "down-text"}">${item.pct_5d == null ? "—" : `${num(item.pct_5d)}%`}</td>
                  <td>${item.volume_ratio_5d == null ? "—" : `${num(item.volume_ratio_5d)}x`}</td>
                  <td class="left"><strong>${escapeHtml(item.combined_status)}</strong><br><span style="color:var(--muted);">${escapeHtml(item.price_status || "")}${item.snapshot_date ? ` · ${escapeHtml(item.snapshot_date)}` : ""}</span></td>
                  <td class="left">${escapeHtml(item.latest_logic || item.price_summary || "未提取")} ${item.latest_risk ? `<br><span style="color:var(--down)">风险：${escapeHtml(item.latest_risk)}</span>` : ""}</td>
                </tr>
              `).join("") : `<tr><td colspan="9">暂无历史板块异动。请先同步研报热点。</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  bindFeedControls(container);
}

function renderStatus(analysis) {
  statusTitleEl.textContent = `当前组合：${analysis.name}`;
  statusDescEl.textContent = `${analysis.sourceType} · ${analysis.sourceMeta.format || "本地数据"} · 已导入 ${state.portfolios.length} 个组合`;
  statusChipsEl.innerHTML = `
    <span class="status-chip violet">${analysis.profile.tradingStyle}</span>
    <span class="status-chip">${analysis.profile.boardFocus}</span>
    <span class="status-chip">${analysis.profile.industryFocus !== "未识别" ? analysis.profile.industryFocus : "行业待补全"}</span>
    <span class="status-chip red">胜率 ${pct(analysis.summary.win_rate)}</span>
    <span class="status-chip green">持仓 ${analysis.summary.open_count} 只</span>
  `;
  workspaceSummaryTitleEl.textContent = `${analysis.profile.tradingStyle} · ${analysis.profile.boardFocus}${analysis.profile.industryFocus !== "未识别" ? ` · ${analysis.profile.industryFocus}` : ""}`;
  workspaceSummaryDescEl.textContent = analysis.profile.industryFocus !== "未识别"
    ? `当前样本胜率 ${pct(analysis.summary.win_rate)}，平均收益 ${pct(analysis.summary.avg_return)}，平均持有 ${num(analysis.summary.avg_hold)} 天。行业统一按申万二级口径观察，第一行业占比 ${pct(analysis.summary.industry_focus_rate)}，前 3 行业合计 ${pct(analysis.summary.industry_top3_rate)}，覆盖 ${analysis.summary.industry_count || 0} 个行业。`
    : `当前样本胜率 ${pct(analysis.summary.win_rate)}，平均收益 ${pct(analysis.summary.avg_return)}，平均持有 ${num(analysis.summary.avg_hold)} 天。行业数据补全后，系统会统一给出舒适区、集中度与依赖度判断。`;
}

function buildCompareConclusion(portfolios, leaders) {
  const styles = unique(portfolios.map((item) => item.analysis.profile.tradingStyle));
  const industries = unique(
    portfolios
      .map((item) => item.analysis.profile.industryFocus)
      .filter((item) => item && item !== "未识别")
  );
  const fastPortfolios = portfolios.filter((item) => (item.analysis.summary.within_3d_rate ?? 0) >= 60);
  const concentratedPortfolios = portfolios.filter((item) => (item.analysis.summary.industry_focus_rate ?? 0) >= 35);
  const styleText = styles.length <= 2
    ? `风格层面主要集中在 ${styles.join("、")}，整体分层不算散。`
    : `风格层面分化明显，当前已覆盖 ${styles.join("、")} 等多种节奏。`;
  const industryText = industries.length
    ? concentratedPortfolios.length
      ? `行业上有 ${concentratedPortfolios.length} 个组合表现出较强舒适区依赖，当前主要覆盖 ${industries.slice(0, 4).join("、")}${industries.length > 4 ? " 等方向" : ""}。`
      : `行业覆盖相对分散，当前主要涉及 ${industries.slice(0, 4).join("、")}${industries.length > 4 ? " 等方向" : ""}。`
    : "仍有部分组合行业口径未补全，行业比较结论需保留弹性。";
  
  const slowPortfolios = portfolios.filter((item) => (item.analysis.summary.avg_hold ?? 0) >= 15);
  let speedText = "";
  if (fastPortfolios.length && slowPortfolios.length) {
    speedText = `组合间轮动速度差异显著，既有 3 日内高频快切的组合（如 ${fastPortfolios[0].name}），也有平均持股超 15 天偏重波段趋势的组合（如 ${slowPortfolios[0].name}）。`;
  } else if (fastPortfolios.length) {
    speedText = `其中 ${fastPortfolios.length} 个组合 3 日内完成交易占比超过 60%，整体偏向高频快切与短周期兑现。`;
  } else if (slowPortfolios.length) {
    speedText = `对比组合整体轮动偏慢，其中 ${slowPortfolios.length} 个组合平均持股超过 15 天，更注重趋势延续性而非短期兑现。`;
  } else {
    speedText = "本轮对比组合整体轮动速度适中，更多体现为中短周期波段兑现，未出现极端快切或长线持有的情况。";
  }

  return `${leaders.highestWin.name} 的胜率最高，为 ${pct(leaders.highestWin.analysis.summary.win_rate)}；${leaders.highestReturn.name} 的平均收益最高，为 ${pct(leaders.highestReturn.analysis.summary.avg_return)}；${leaders.shortestHold.name} 的平均持股最短，为 ${num(leaders.shortestHold.analysis.summary.avg_hold)} 天。${styleText}${industryText}${speedText}`;
}

function createComparePortfolioStrip(portfolios) {
  return `
    <div class="compare-strip">
      ${portfolios.map((item) => `
        <article class="compare-strip-card ${item.id === state.currentPortfolioId ? "active" : ""}">
          <strong>${item.name}</strong>
          <span>${item.analysis.profile.tradingStyle} · ${item.analysis.profile.boardFocus}</span>
          <div class="compare-strip-metrics">
            <label>胜率 <b>${pct(item.analysis.summary.win_rate)}</b></label>
            <label>均收 <b>${pct(item.analysis.summary.avg_return)}</b></label>
            <label>持股 <b>${num(item.analysis.summary.avg_hold)}天</b></label>
            <label>行业 <b>${item.analysis.profile.industryFocus !== "未识别" ? item.analysis.profile.industryFocus : "待补全"}</b></label>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function getHoldFrequencyInsight(analysis) {
  const avgHold = analysis.summary.avg_hold ?? 0;
  const within3dRate = analysis.summary.within_3d_rate ?? 0;
  const within5dRate = analysis.summary.within_5d_rate ?? 0;
  const winnerAvgHold = analysis.summary.winner_avg_hold ?? 0;
  const loserAvgHold = analysis.summary.loser_avg_hold ?? 0;
  const tradingStyle = analysis.profile.tradingStyle || "中短波段";

  let level = "中频";
  let tone = "mid";
  let title = "中短波段";

  if (tradingStyle === "超短快切") {
    level = "超短快切";
    tone = "high";
    title = "超短快切";
  } else if (tradingStyle === "短线波段") {
    level = "短线波段";
    tone = "high";
    title = "短线波段";
  } else if (tradingStyle === "中短波段") {
    level = "中短波段";
    tone = "mid";
    title = "中短波段";
  } else {
    level = "中线趋势";
    tone = "low";
    title = "中线趋势";
  }

  const coreView = (level === "超短快切" || level === "短线波段")
    ? `平均持有 ${num(avgHold)} 天，5 日内完成交易占比 ${pct(within5dRate)}，整体明显偏向快进快出。`
    : level === "中线趋势"
      ? `平均持有 ${num(avgHold)} 天，5 日内完成交易占比仅 ${pct(within5dRate)}，更接近耐心持有和波段等待。`
      : `平均持有 ${num(avgHold)} 天，5 日内完成交易占比 ${pct(within5dRate)}，节奏介于快切和长持之间。`;
  
  const disciplineView = loserAvgHold > winnerAvgHold + 5
    ? `亏损单平均持有 ${num(loserAvgHold)} 天，明显长于盈利单的 ${num(winnerAvgHold)} 天，止损执行仍偏慢。`
    : winnerAvgHold > 0 || loserAvgHold > 0
      ? `盈利单平均持有 ${num(winnerAvgHold)} 天，亏损单平均持有 ${num(loserAvgHold)} 天，盈亏退出节奏整体可解释。`
      : "当前样本的盈亏持有差异不足以单独形成强结论。";
      
  const fitView = (level === "超短快切" || level === "短线波段")
    ? "更适合执行积极、能接受频繁换手和波动反馈的活跃型客户。"
    : level === "中线趋势"
      ? "更适合能接受等待、重视趋势延续和持仓耐心的稳健型客户。"
      : "更适合愿意持续跟踪组合动作、但不需要极端高频执行的波段型客户。";

  return {
    level,
    tone,
    title,
    coreView,
    points: [coreView, disciplineView, fitView],
    tags: [
      `${level}`,
      `平均持有 ${num(avgHold)} 天`,
      `3日内 ${pct(within3dRate)}`,
      `5日内 ${pct(within5dRate)}`
    ]
  };
}

function getAdvisorTrainingLevel(profile) {
  const score =
    Math.min(40, profile.feed_count * 1.2) +
    Math.min(25, profile.hot_count * 0.6) +
    Math.min(25, profile.trade_count * 1.5) +
    Math.min(10, profile.sourceStats.length * 2);
  if (score >= 80) return { label: "较稳定", value: Math.round(score), note: "已具备较完整的风格、方向与交易反馈样本。" };
  if (score >= 50) return { label: "形成中", value: Math.round(score), note: "已有可用画像，但仍需要持续补充真实早评和交易反馈。" };
  return { label: "早期学习", value: Math.round(score), note: "语料和反馈样本仍偏少，输出应作为辅助草稿。" };
}

function renderAdvisorStyleOverviewPanel() {
  const profile = buildAdvisorLearningProfile();
  const hotspotPackage = buildHotspotInsightPackage();
  const training = getAdvisorTrainingLevel(profile);
  const topThemes = profile.themeStats.slice(0, 5);
  const topOperations = profile.operationStyle.slice(0, 4);
  const topRisks = profile.riskStyle.slice(0, 4);
  const sourceText = profile.sourceStats.length
    ? profile.sourceStats.slice(0, 5).map((item) => `${item.label}${item.count}`).join(" / ")
    : "暂无主理人语料";

  return `
    <div class="bento-grid" style="margin-top:16px;">
      <div class="panel-card bento-col-5">
        <div class="feed-panel-heading">
          <div>
            <h3>主理人风格</h3>
            <p class="lead">由主理人早评、午评、盘中问答、复盘和实际持仓/交易共同更新；研报热点不进入方向偏好。</p>
          </div>
          <div class="feed-sync-badge">${training.label} · ${training.value}%</div>
        </div>
        <ul class="bullet-list" style="margin-top:12px;">
          ${profile.summary.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="pill-line">
          ${topThemes.map((item) => `<span class="ghost-pill">方向 ${escapeHtml(item.label)} ${item.count}</span>`).join("")}
          ${topOperations.map((item) => `<span class="ghost-pill">操作 ${escapeHtml(item.label)}</span>`).join("")}
          ${topRisks.map((item) => `<span class="ghost-pill">风险 ${escapeHtml(item.label)}</span>`).join("")}
        </div>
      </div>
      <div class="panel-card bento-col-3">
        <h3>模型训练进度</h3>
        <div class="overview-grid" style="margin-top:12px; grid-template-columns:1fr;">
          <div class="metric-card blue">
            <div class="metric-title">学习完成度</div>
            <div class="metric-value">${training.value}%</div>
            <div class="metric-note">${escapeHtml(training.note)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">语料结构</div>
            <div class="metric-value">${profile.feed_count}</div>
            <div class="metric-note">${escapeHtml(sourceText)}</div>
          </div>
          <div class="metric-card amber">
            <div class="metric-title">交易反馈</div>
            <div class="metric-value">${profile.trade_count}</div>
            <div class="metric-note">知行重合 ${profile.consistencyRate == null ? "待观察" : pct(profile.consistencyRate, 1)}</div>
          </div>
        </div>
      </div>
      <div class="panel-card bento-col-4">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
          <div>
            <h3 style="margin:0;">每日早评辅助</h3>
            <p class="lead" style="margin-top:8px;">检索主理人历史语料、研报热点和交易反馈后生成。</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
            <button class="pill-btn primary" id="generateMorningDraftBtn" type="button">检索生成</button>
            <button class="pill-btn secondary" id="copyMorningDraftBtn" type="button">复制</button>
          </div>
        </div>
        <div class="fold-copy" id="morningDraftText" style="white-space: pre-wrap; max-height:360px;">${escapeHtml(hotspotPackage.morningDraft)}</div>
      </div>
    </div>
  `;
}

async function loadRiskDashboard(force = false) {
  const portfolioId = state.currentPortfolioId || "";
  const holdingKey = getCurrentRiskHoldingKey();
  if (state.riskDashboardLoading) return;
  if (
    state.riskDashboard &&
    state.riskDashboardPortfolioId === portfolioId &&
    state.riskDashboardHoldingKey === holdingKey &&
    !force
  ) {
    return;
  }
  const previousPayload = state.riskDashboard;
  const uiSnapshot = captureRiskDashboardUiState();
  state.riskDashboardLoading = true;
  state.riskDashboardError = "";
  if (previousPayload) {
    updateRiskRefreshIndicator("refreshing", "后台正在重新计算，当前画面和展开状态会一直保留");
  } else {
    renderRiskDashboard();
  }
  let replaced = false;
  try {
    // Opening the risk workspace must not wait for a full portfolio snapshot
    // rewrite. Portfolio mutations already schedule their own database sync;
    // waiting here can block behind the market-refresh lock for minutes.
    const params = new URLSearchParams();
    if (portfolioId) params.set("portfolio_id", portfolioId);
    const localHostnames = new Set(["127.0.0.1", "localhost", "::1"]);
    if (force && localHostnames.has(window.location.hostname)) params.set("refresh", "1");
    const query = params.toString() ? `?${params.toString()}` : "";
    const payload = await fetchApiWithStaticFallback(
      `/api/v1/risk_dashboard${query}`,
      `${STATIC_RISK_ROOT}/dashboard.json`,
      "风控主看板"
    );
    if (payload?.risk_v2?.status === "error" || payload?.risk_v2?.error) {
      throw new Error(payload.risk_v2.error || "风控主评分暂时不可用");
    }
    state.riskDashboard = payload;
    state.riskDashboardPortfolioId = portfolioId;
    state.riskDashboardHoldingKey = holdingKey;
    adoptRiskPositionJournal(payload, force);
    replaced = true;
  } catch (error) {
    state.riskDashboardError = error?.name === "AbortError"
      ? "风控计算超过 45 秒，请稍后点击刷新重试"
      : (error.message || String(error));
  } finally {
    state.riskDashboardLoading = false;
    if (replaced || !previousPayload) {
      renderRiskDashboard();
      restoreRiskDashboardUiState(uiSnapshot);
    } else {
      updateRiskRefreshIndicator("error", `后台刷新失败，继续展示上一次结果：${state.riskDashboardError}`);
    }
  }
}

function riskChartKey(scope, code) {
  return `${scope}:${code}`;
}

async function loadRiskWorkspace(force = false) {
  const portfolioId = state.currentPortfolioId || "";
  if (state.riskWorkspaceLoading) return;
  if (state.riskWorkspace && state.riskWorkspacePortfolioId === portfolioId && !force) return;
  state.riskWorkspaceLoading = true;
  state.riskWorkspaceError = "";
  renderRiskDashboard();
  try {
    const params = new URLSearchParams({ portfolio_id: portfolioId });
    if (force) params.set("refresh", "1");
    const browserReview = state.riskWorkspace?.instrument_review || null;
    const browserHoldingReviews = state.riskWorkspace?.holding_reviews || [];
    const payload = await fetchApiWithStaticFallback(
      `/api/v1/risk/workspace?${params}`,
      `${STATIC_RISK_ROOT}/workspace.json`,
      "风控行情工作台"
    );
    state.riskWorkspace = {
      ...payload,
      instrument_review: browserReview || payload.instrument_review || {},
      holding_reviews: browserHoldingReviews.length ? browserHoldingReviews : (payload.holding_reviews || []),
    };
    state.riskWorkspacePortfolioId = portfolioId;
    const sectors = (payload.sectors || []).filter((item) => item.available);
    if (!sectors.some((item) => item.industry_code === state.selectedRiskIndustryCode)) {
      state.selectedRiskIndustryCode = sectors[0]?.industry_code || "";
      state.riskSectorDetail = null;
    }
  } catch (error) {
    state.riskWorkspaceError = error.message || String(error);
  } finally {
    state.riskWorkspaceLoading = false;
    renderRiskDashboard();
  }
}

async function loadRiskSectorDetail(industryCode, force = false) {
  const code = String(industryCode || "");
  if (!code || state.riskSectorDetailLoading) return;
  if (state.riskSectorDetail?.sector?.industry_code === code && !force) return;
  state.riskSectorDetailLoading = true;
  state.riskSectorDetailError = "";
  renderRiskDashboard();
  try {
    const params = new URLSearchParams({ industry_code: code });
    if (force) params.set("refresh", "1");
    const payload = await fetchApiWithStaticFallback(
      `/api/v1/risk/sector-detail?${params}`,
      `${STATIC_RISK_ROOT}/sectors/${encodeURIComponent(code)}.json`,
      `行业 ${code}`
    );
    if (state.selectedRiskIndustryCode === code) state.riskSectorDetail = payload;
  } catch (error) {
    if (state.selectedRiskIndustryCode === code) {
      const rawMessage = error?.message || String(error);
      state.riskSectorDetailError = /failed to fetch|networkerror|load failed/i.test(rawMessage)
        ? "行业行情连接暂时中断，请点击重试"
        : rawMessage;
    }
  } finally {
    state.riskSectorDetailLoading = false;
    renderRiskDashboard();
  }
}

async function loadRiskAnnotations(scope, code) {
  const key = riskChartKey(scope, code);
  if (!code || Object.prototype.hasOwnProperty.call(state.riskAnnotationCache, key)) return;
  if (!isLocalServiceHost() && Array.isArray(state.riskAnnotationDrafts[key])) {
    state.riskAnnotationCache[key] = state.riskAnnotationDrafts[key];
    return;
  }
  state.riskAnnotationCache[key] = null;
  try {
    const params = new URLSearchParams({
      portfolio_id: state.currentPortfolioId || "",
      chart_scope: scope,
      instrument_code: code,
    });
    const response = await fetch(`/api/v1/risk/chart-annotations?${params}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${response.status}`);
    state.riskAnnotationCache[key] = payload.annotations || [];
    state.riskAnnotationDrafts[key] = (payload.annotations || []).map((item) => ({ ...item }));
  } catch (error) {
    state.riskAnnotationCache[key] = [];
    state.riskAnnotationDrafts[key] = [];
  }
  renderRiskDashboard();
}

async function saveRiskAnnotations(scope, code) {
  const key = riskChartKey(scope, code);
  if (!isLocalServiceHost()) {
    const annotations = (state.riskAnnotationDrafts[key] || []).map((item) => ({ ...item }));
    state.riskAnnotationCache[key] = annotations;
    state.riskAnnotationDrafts[key] = annotations;
    persistState();
    return { ok: true, annotations, storage: "browser" };
  }
  const result = await postJson("/api/v1/risk/chart-annotations", {
    portfolio_id: state.currentPortfolioId || "",
    chart_scope: scope,
    instrument_code: code,
    annotations: state.riskAnnotationDrafts[key] || [],
  });
  state.riskAnnotationCache[key] = result.annotations || [];
  state.riskAnnotationDrafts[key] = (result.annotations || []).map((item) => ({ ...item }));
  return result;
}

function captureRiskDashboardUiState() {
  const container = document.getElementById("view-risk");
  if (!container || !state.riskDashboard) return null;
  const scrollPositions = {};
  container.querySelectorAll("[data-risk-scroll-key]").forEach((element) => {
    scrollPositions[element.dataset.riskScrollKey] = {
      top: element.scrollTop,
      left: element.scrollLeft,
    };
  });
  const openDetails = {};
  container.querySelectorAll("details").forEach((element, index) => {
    const key = element.dataset.riskDetailKey || `index:${index}`;
    openDetails[key] = element.open;
  });
  let klineZoom = null;
  const klineDom = document.getElementById("riskKlineChart");
  const klineChart = klineDom && typeof echarts !== "undefined" ? echarts.getInstanceByDom(klineDom) : null;
  if (klineChart) {
    const zoom = klineChart.getOption()?.dataZoom || [];
    klineZoom = zoom.map((item) => ({ start: item.start, end: item.end }));
  }
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    scrollPositions,
    openDetails,
    klineZoom,
  };
}

function restoreRiskDashboardUiState(snapshot) {
  if (!snapshot) return;
  const container = document.getElementById("view-risk");
  if (!container) return;
  container.querySelectorAll("[data-risk-scroll-key]").forEach((element) => {
    const saved = snapshot.scrollPositions?.[element.dataset.riskScrollKey];
    if (!saved) return;
    element.scrollTop = saved.top;
    element.scrollLeft = saved.left;
  });
  container.querySelectorAll("details").forEach((element, index) => {
    const key = element.dataset.riskDetailKey || `index:${index}`;
    if (Object.prototype.hasOwnProperty.call(snapshot.openDetails || {}, key)) {
      element.open = Boolean(snapshot.openDetails[key]);
    }
  });
  const klineDom = document.getElementById("riskKlineChart");
  const klineChart = klineDom && typeof echarts !== "undefined" ? echarts.getInstanceByDom(klineDom) : null;
  if (klineChart && snapshot.klineZoom?.length) {
    klineChart.setOption({
      dataZoom: snapshot.klineZoom.map((item, index) => ({
        type: index === 0 ? "inside" : "slider",
        start: item.start,
        end: item.end,
      })),
    });
  }
  window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0);
}

function updateRiskRefreshIndicator(status, message) {
  const indicator = document.getElementById("riskRefreshStatus");
  if (indicator) {
    indicator.className = `risk-page-data-status ${status || ""}`;
    indicator.textContent = message || "";
  }
  const button = document.getElementById("refreshRiskDashboardBtn");
  if (button) {
    button.disabled = status === "refreshing";
    button.textContent = status === "refreshing" ? "正在刷新" : "刷新数据";
  }
}

function renderRiskLogItems(logs = [], payload = {}) {
  if (!logs.length) {
    return `<div class="empty-state">暂无加减分事件；当前已覆盖的规则没有触发分值变化。</div>`;
  }
  const eventDetails = payload?.dimension_details?.event?.event_details || [];
  return logs.map((log) => {
    const type = log.type === "bearish" ? "bearish" : "bullish";
    const dimension = escapeHtml(log.dimension || "风控");
    const desc = escapeHtml(log.desc || log.condition || "信号触发");
    const direction = type === "bearish" ? "减分事件" : "加分事件";
    const condition = escapeHtml(log.condition || "未提供条件编码");
    const detail = eventDetails.find((item) =>
      item.condition === log.condition && (!item.date || item.date === log.date)
    );
    const reason = escapeHtml(detail?.reason || "");
    const evidence = (detail?.evidence || []).slice(0, 2).map(escapeHtml);
    return `
      <div class="risk-log-item ${type}">
        <div class="risk-log-date">${escapeHtml(log.date || "—")}</div>
        <div class="risk-log-main">
          <strong>${dimension} · ${direction}</strong>
          <span>${desc}</span>
          ${reason ? `<span>DeepSeek 判断：${reason}</span>` : ""}
          ${evidence.length ? `<span>语料证据：${evidence.join("；")}</span>` : ""}
          <span class="risk-log-condition">条件：${condition}</span>
        </div>
        <div class="risk-log-score ${type}">${escapeHtml(log.score_change || "0")}</div>
      </div>
    `;
  }).join("");
}

function riskScoreChangeNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^\d.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function renderRiskEventSummary(logs = []) {
  const bullish = logs.filter((item) => item.type !== "bearish");
  const bearish = logs.filter((item) => item.type === "bearish");
  const dimensionWeights = {
    market: 0.4,
    "大盘": 0.4,
    "大盘环境": 0.4,
    sector: 0.3,
    "板块": 0.3,
    "板块风格": 0.3,
    portfolio: 0.2,
    "组合": 0.2,
    "组合反馈": 0.2,
    event: 0.1,
    "事件": 0.1,
    "事件驱动": 0.1
  };
  const bullishPoints = bullish.reduce(
    (sum, item) => sum + Math.max(0, riskScoreChangeNumber(item.score_change)),
    0
  );
  const bearishPoints = bearish.reduce(
    (sum, item) => sum + Math.abs(Math.min(0, riskScoreChangeNumber(item.score_change))),
    0
  );
  const weightedNetChange = logs.reduce((sum, item) => {
    const weight = dimensionWeights[item.dimension] ?? 0;
    return sum + riskScoreChangeNumber(item.score_change) * weight;
  }, 0);
  const signedNet = `${weightedNetChange > 0 ? "+" : ""}${num(weightedNetChange, 1)}`;
  return `
    <div class="risk-event-summary">
      <div class="risk-event-stat bullish">
        <span>利好加分 · ${bullish.length} 条</span>
        <strong>+${num(bullishPoints, 1)}</strong>
      </div>
      <div class="risk-event-stat bearish">
        <span>利空减分 · ${bearish.length} 条</span>
        <strong>-${num(bearishPoints, 1)}</strong>
      </div>
      <div class="risk-event-stat">
        <span>加权后综合影响</span>
        <strong>${signedNet}</strong>
      </div>
    </div>
  `;
}

function renderRiskRuleCatalog(payload = {}) {
  const rules = Array.isArray(payload.rule_catalog) ? payload.rule_catalog : [];
  if (!rules.length) {
    return `<div class="empty-state">完整规则目录尚未返回，请刷新风控或重启本地服务。</div>`;
  }
  const dimensions = [
    ["market", "大盘环境"],
    ["sector", "板块风格"],
    ["portfolio", "组合反馈"],
    ["event", "事件驱动"]
  ];
  const statusLabels = {
    triggered: "已触发",
    not_triggered: "未触发",
    unavailable: "替代指标评估"
  };
  return `
    <div class="risk-rule-groups">
      ${dimensions.map(([key, label]) => {
        const items = rules.filter((item) => item.dimension === key);
        const triggered = items.filter((item) => item.status === "triggered").length;
        const unavailable = items.filter((item) => item.status === "unavailable").length;
        const shouldOpen = triggered > 0;
        return `
          <details class="risk-rule-group" ${shouldOpen ? "open" : ""}>
            <summary>
              ${label} · ${items.length} 条
              <span>已触发 ${triggered} · 替代指标评估 ${unavailable}</span>
            </summary>
            <div class="risk-rule-list">
              ${items.map((item) => {
                const direction = item.direction === "bearish" ? "bearish" : "bullish";
                const status = ["triggered", "not_triggered", "unavailable"].includes(item.status)
                  ? item.status
                  : "unavailable";
                const statusClass = status.replace("_", "-");
                const subline = [item.category, item.condition, item.evaluation_basis].filter(Boolean).join(" · ");
                return `
                  <div class="risk-rule-row">
                    <span class="risk-rule-direction ${direction}">${direction === "bullish" ? "利好加分" : "利空减分"}</span>
                    <div class="risk-rule-copy">
                      <strong>${escapeHtml(item.desc || item.condition || "风控条件")}</strong>
                      <span>${escapeHtml(subline)}</span>
                    </div>
                    <span class="risk-rule-score ${direction}">${escapeHtml(item.score_change || "0")}</span>
                    <span class="risk-rule-status ${statusClass}">${statusLabels[status]}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </details>
        `;
      }).join("")}
    </div>
  `;
}

function renderRiskMarketBreadth(payload = {}) {
  const metrics = payload?.dimension_details?.market?.metrics || {};
  const hasCounts = Number.isFinite(Number(metrics.decliners));
  if (!hasCounts) {
    return `
      <div class="risk-breadth-panel">
        <div class="risk-breadth-head"><strong>今日全市场涨跌分布</strong><span>暂未取得实时快照</span></div>
      </div>
    `;
  }
  const decliningRatio = Number(metrics.declining_ratio || 0);
  const decliningShare = Number(metrics.declining_share ?? decliningRatio);
  const medianPct = Number(metrics.median_pct_change);
  const exceeded = Boolean(metrics.decline_threshold_exceeded);
  return `
    <div class="risk-breadth-panel">
      <div class="risk-breadth-head">
        <strong>今日全市场涨跌分布</strong>
        <span>${escapeHtml(metrics.breadth_source || "实时行情")} · ${escapeHtml(metrics.snapshot_time || "")}</span>
      </div>
      <div class="risk-breadth-grid">
        <div class="risk-breadth-stat bearish"><span>下跌股票</span><strong>${num(metrics.decliners, 0)} 只</strong><em>实时统计</em></div>
        <div class="risk-breadth-stat bearish"><span>下跌占全市场</span><strong>${num(decliningShare * 100, 1)}%</strong><em>风险阈值 60%</em></div>
        <div class="risk-breadth-stat bullish"><span>上涨股票</span><strong>${num(metrics.advancers, 0)} 只</strong><em>实时统计</em></div>
        <div class="risk-breadth-stat"><span>平盘/无报价</span><strong>${num(metrics.flat_count, 0)} 只</strong><em>全市场 ${num(metrics.sample_size, 0)} 只</em></div>
        <div class="risk-breadth-stat ${medianPct < 0 ? "bearish" : "bullish"}"><span>涨跌幅中位数</span><strong>${Number.isFinite(medianPct) ? `${num(medianPct, 2)}%` : "—"}</strong><em>个股体感</em></div>
      </div>
      ${exceeded ? `<div class="risk-breadth-alert">下跌股票占全市场比例已经超过 60% 风险阈值；当前涨跌样本内下跌比例为 ${num(decliningRatio * 100, 1)}%。若个股涨跌幅中位数同时低于 -0.5%，将触发大盘赚钱效应 -10 分。</div>` : ""}
    </div>
  `;
}

function renderRiskDeepseekAnalysis(payload = {}) {
  const meta = payload.event_analysis || {};
  const analysis = meta.analysis || {};
  const statusLabels = {
    fresh: "本次新分析",
    cached: "已复用当日缓存",
    cached_after_error: "接口异常，复用缓存",
    missing_api_key: "未配置密钥",
    no_daily_corpus: "当日无语料",
    deepseek_error: "分析失败"
  };
  return `
    <div class="risk-llm-box">
      <div class="risk-llm-head">
        <strong>DeepSeek 每日事件定性</strong>
        <span>${escapeHtml(statusLabels[meta.status] || meta.status || "等待分析")} · 语料 ${num(meta.source_doc_count, 0)} 条 · 识别事件 ${num(meta.deepseek_event_count, 0)} 条</span>
      </div>
      ${analysis.scored_summary ? `<p class="risk-llm-summary">${escapeHtml(analysis.scored_summary)}</p>` : analysis.summary ? `<p class="risk-llm-summary">${escapeHtml(analysis.summary)}</p>` : ""}
      ${meta.error ? `<div class="risk-llm-error">${escapeHtml(meta.error)}</div>` : ""}
    </div>
  `;
}

function renderRiskDataQuality(payload = {}) {
  const details = payload.dimension_details || {};
  const labels = { market: "大盘", sector: "板块", portfolio: "组合", event: "事件" };
  const coverageItems = Object.entries(labels).map(([key, label]) => {
    const quality = details[key]?.data_quality || {};
    const evaluated = Number(quality.evaluated_rules || 0);
    const total = Number(quality.total_rules || 0);
    const rate = total ? Math.round((Number(quality.coverage_rate || 0)) * 100) : 0;
    return `<span class="risk-quality-chip"><strong>${label}</strong> ${evaluated}/${total} · ${rate}%</span>`;
  }).join("");
  const warnings = Array.isArray(payload.data_quality?.warnings)
    ? payload.data_quality.warnings.filter(Boolean)
    : [];
  const sources = payload.source_status || {};
  return `
    <div class="risk-quality-box">
      <div class="risk-quality-head">
        <strong>规则覆盖与真实数据源</strong>
        <span>真实字段缺失时自动切换可解释代理口径，所有规则均完成评估</span>
      </div>
      <div class="risk-quality-chips">${coverageItems}</div>
      <div class="risk-quality-source">
        大盘：${escapeHtml(sources.market || "未声明")} · 板块：${escapeHtml(sources.sector || "未声明")} ·
        组合：${escapeHtml(sources.portfolio || "未声明")} · 事件：${escapeHtml(sources.event || "未声明")}
      </div>
      ${warnings.length ? `<details class="risk-quality-warnings"><summary>${warnings.length} 条口径说明</summary>${warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</details>` : ""}
    </div>
  `;
}

function getRiskKlineItems(payload) {
  return payload?.holding_klines?.items || [];
}

function getSelectedRiskKline(payload) {
  const items = getRiskKlineItems(payload);
  const available = items.filter((item) => (item.dates || []).length && (item.ohlc || []).length);
  if (!available.length) return payload?.kline_data || {};
  const selected = available.find((item) => item.code === state.selectedRiskKlineCode);
  if (selected) return selected;
  state.selectedRiskKlineCode = available[0].code || "";
  return available[0];
}

function renderRiskStockButtons(payload) {
  const items = getRiskKlineItems(payload);
  if (!items.length) {
    return `<div class="empty-state">当前组合暂无可用于绘制真实 K 线的持仓代码。</div>`;
  }
  const selected = getSelectedRiskKline(payload);
  return `
    <div class="risk-stock-toolbar">
      ${items.map((item) => {
        const hasData = (item.dates || []).length && (item.ohlc || []).length;
        const active = item.code && item.code === selected.code;
        return `
          <button class="risk-stock-btn ${active ? "active" : ""} ${hasData ? "" : "disabled"}" type="button" data-risk-code="${escapeHtml(item.code || "")}" ${hasData ? "" : "disabled"}>
            ${escapeHtml(item.name || item.stock || item.code || "持仓")}
            <span>${escapeHtml(item.code || "")}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderRiskKlineMeta(payload) {
  const selected = getSelectedRiskKline(payload);
  const holding = payload?.holding_klines || {};
  if (!selected || !(selected.dates || []).length) {
    return `<div class="risk-kline-meta">暂无真实 K 线数据。可检查当前组合是否已有持仓代码，或东方财富历史行情接口是否可访问。</div>`;
  }
  return `
    <div class="risk-kline-meta">
      <span>组合：${escapeHtml(holding.portfolio_name || "当前组合")}</span>
      <span>持仓日：${escapeHtml(holding.snapshot_date || "—")}</span>
      <span>股票：${escapeHtml(selected.name || selected.code)} ${escapeHtml(selected.code || "")}</span>
      <span>行情：${escapeHtml(selected.source || holding.source || "东方财富历史日K")}</span>
      <span>最新K线：${escapeHtml(selected.latest_date || "—")}</span>
    </div>
  `;
}

function eventRiskOption(value, selected, label) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function safeEventSourceUrl(value) {
  try {
    const parsed = new URL(String(value || ""), window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch (error) {
    return "";
  }
}

function renderEventRiskMonitor(payload = {}, options = {}) {
  const monitor = payload.event_risk_monitor || {};
  const reviewOnly = Boolean(options.reviewOnly);
  const sourceStatus = monitor.source_status || {};
  const events = Array.isArray(monitor.active_events) ? monitor.active_events : [];
  const researchEvents = Array.isArray(monitor.research_events)
    ? monitor.research_events.slice(0, 5)
    : events.filter((event) => (event.content_types || []).includes("research")).slice(0, 5);
  const newsEvents = Array.isArray(monitor.news_events)
    ? monitor.news_events.slice(0, 5)
    : events.filter((event) => (event.content_types || []).includes("news")).slice(0, 5);
  const reviewEvents = events.filter((event) => {
    const final = event.final || {};
    const isCompanyResearch = (event.content_types || []).includes("research") && (event.news || []).some((item) => String(item.report_category || "").includes("个股") || item.code || item.stock);
    if (isCompanyResearch) return false;
    return final.risk_gate || Number(final.effective_risk_score || 0) >= 70 || event.ai_status !== "analyzed" || event.manual?.reviewed_at;
  });
  const eventGroups = reviewOnly
    ? [{ key: "review", title: "待人工复核事件", desc: "仅保留 Risk Gate、高风险、AI异常或已有人工修改的事件；不重复展示普通新闻", events: reviewEvents }]
    : [
        { key: "news", title: "重要新闻 Top 5", desc: "扫描当日财经新闻；按市场影响、时效与持仓相关性排序", events: newsEvents },
        { key: "research", title: "重要行业研报 Top 5", desc: "只保留行业、板块和宏观研报；已排除个股公司研报", events: researchEvents },
      ];
  const durationLabels = { intraday: "日内", short: "短期", medium: "中期", long: "长期" };
  const impactLabels = { market: "全市场", industry: "行业", stock: "个股" };
  const directionLabels = { risk: "风险", opportunity: "机会", both: "双向", neutral: "中性" };
  return `
    <div class="panel-card" id="eventRiskMonitorPanel">
      <div class="event-risk-toolbar">
        <div>
          <h3>${reviewOnly ? "事件驱动监控与人工复核" : "事件驱动风险与机会监控"}</h3>
          <p class="lead">${reviewOnly ? "新闻正文已在上方滚动窗口统一展示；这里仅处理事件参数、硬风控和人工复核，不再重复列新闻。" : "研报与财经新闻分开筛选、分开排序；同一事件跨来源聚类后只调用一次 DeepSeek。"}</p>
          <p class="risk-event-caption">展示日期：${escapeHtml(sourceStatus.display_date || "今日")} · 当前数据源：${escapeHtml(sourceStatus.label || "在线源等待抓取")} · 最近刷新：${escapeHtml(sourceStatus.last_finished_at || "尚未完成抓取")} · 每 10 分钟自动更新</p>
        </div>
        <button class="pill-btn secondary" id="runEventRiskBtn" type="button">立即抓取并分析</button>
      </div>
      <div class="event-risk-overview">
        <div class="event-risk-metric risk"><span>事件风险参考</span><strong>${num(monitor.event_risk_score, 1)}</strong><em>仅用于事件排序，不直接作为v2总分</em></div>
        <div class="event-risk-metric opportunity"><span>事件机会参考</span><strong>${num(monitor.event_opportunity_score, 1)}</strong><em>v2由Python按事件参数重算</em></div>
        <div class="event-risk-metric"><span>重点事件</span><strong>${num(monitor.active_event_count, 0)}</strong><em>最多展示 10 条${Number(monitor.tracked_active_event_count || 0) > Number(monitor.active_event_count || 0) ? ` · 跟踪 ${num(monitor.tracked_active_event_count, 0)}` : ""}</em></div>
        <div class="event-risk-metric"><span>高风险事件</span><strong>${num(monitor.high_risk_event_count, 0)}</strong><em>有效风险 ≥ 70</em></div>
        <div class="event-risk-metric ${monitor.risk_gate ? "gate" : ""}"><span>Risk Gate</span><strong>${monitor.risk_gate ? "开启" : "关闭"}</strong><em>待分析 ${num(monitor.pending_ai_count, 0)} 条</em></div>
      </div>
      ${monitor.error ? `<div class="risk-llm-error">事件模块读取失败：${escapeHtml(monitor.error)}</div>` : ""}
      <div id="eventRiskActionStatus" class="event-risk-status"></div>
      <div class="event-risk-groups">
        ${eventGroups.map((group) => `
          <section class="event-risk-group ${group.key}">
            <div class="event-risk-group-head">
              <div><h4>${escapeHtml(group.title)}</h4><p>${escapeHtml(group.desc)}</p></div>
              <strong>${group.events.length} / 5</strong>
            </div>
            <div class="event-risk-list">
        ${group.events.length ? group.events.map((event, eventIndex) => {
          const ai = event.ai || {};
          const manual = event.manual || {};
          const final = event.final || {};
          const news = Array.isArray(event.news) ? event.news : [];
          const primaryNews = news[0] || {};
          const industries = final.affected_industries || [];
          const stocks = final.affected_stocks || [];
          const researchSubject = primaryNews.subject || (final.affected_stocks || [])[0] || "";
          const displayTitle = researchSubject && !(event.title || "").includes(researchSubject)
            ? `${researchSubject}｜${event.title || event.summary || "未命名事件"}`
            : (event.title || event.summary || "未命名事件");
          const factTitle = displayTitle.includes("｜") ? displayTitle.split("｜").slice(1).join("｜") : displayTitle;
          const subjectLabel = researchSubject || industries.join("、") || (primaryNews.report_category === "宏观研究" ? "宏观经济与全市场" : "市场整体");
          const directionLabel = directionLabels[final.direction] || final.direction || "待判断";
          const decisionReason = final.direction === "risk"
            ? ai.risk_reason
            : final.direction === "opportunity"
              ? ai.opportunity_reason
              : final.direction === "both"
                ? [ai.risk_reason, ai.opportunity_reason].filter(Boolean).join("；")
                : (ai.risk_reason || ai.opportunity_reason || event.summary);
          const clearConclusion = `${subjectLabel}：${factTitle}。系统判断为${directionLabel}${decisionReason ? `，依据：${decisionReason}` : ""}。`;
          return `
            <details class="event-risk-card" data-event-id="${escapeHtml(event.id || "")}">
              <summary>
                <div class="event-risk-title">
                  <strong><i class="event-risk-rank">TOP ${eventIndex + 1}</i>${escapeHtml(displayTitle)}</strong>
                  <span>${researchSubject ? `研究对象：${escapeHtml(researchSubject)} · ` : ""}${primaryNews.organization ? `发布机构：${escapeHtml(primaryNews.organization)} · ` : ""}${primaryNews.media_name && !primaryNews.organization ? `来源媒体：${escapeHtml(primaryNews.media_name)} · ` : ""}${primaryNews.report_category ? `${escapeHtml(primaryNews.report_category)} · ` : ""}${primaryNews.content_type === "news" ? "财经新闻 · " : ""}${escapeHtml((event.published_at || "").slice(0, 19).replace("T", " "))} · 重要度 ${num(event.importance_score, 1)} · ${num(event.source_count, 0)} 个来源 / ${num(event.news_count, 0)} 条材料 · ${escapeHtml(directionLabels[final.direction] || final.direction || "中性")}</span>
                  <span class="event-risk-selection">入选原因：${escapeHtml((primaryNews.selection_reasons || []).join("；") || "DeepSeek 风险/机会影响评分靠前")}${primaryNews.holding_match ? " · 当前持仓相关" : " · 全市场事件"}</span>
                  <em class="event-risk-conclusion"><b>一句话结论：</b>${escapeHtml(clearConclusion)}</em>
                </div>
                <div class="event-risk-scores">
                  <span class="event-risk-score risk">风险<strong>${num(final.effective_risk_score, 1)}</strong></span>
                  <span class="event-risk-score opportunity">机会<strong>${num(final.effective_opportunity_score, 1)}</strong></span>
                </div>
                <div class="event-risk-tags">
                  <span class="event-risk-tag">${escapeHtml(impactLabels[final.impact_level] || final.impact_level || "行业")}</span>
                  <span class="event-risk-tag">${escapeHtml(durationLabels[ai.expected_duration] || ai.expected_duration || "待判断")}</span>
                  <span class="event-risk-tag ${event.ai_status !== "analyzed" ? "pending" : ""}">${escapeHtml(event.ai_status === "analyzed" ? "AI已分析" : `AI ${event.ai_status || "pending"}`)}</span>
                  ${final.risk_gate ? `<span class="event-risk-tag gate">Risk Gate</span>` : ""}
                </div>
              </summary>
              <div class="event-risk-detail">
                <div class="event-risk-brief">
                  <div><span>研究对象</span><strong>${escapeHtml(subjectLabel)}</strong></div>
                  <div><span>发生了什么</span><strong>${escapeHtml(factTitle || "等待明确事件事实")}</strong></div>
                  <div><span>系统判断</span><strong>${escapeHtml(directionLabel)} · 风险 ${num(final.effective_risk_score, 1)} / 机会 ${num(final.effective_opportunity_score, 1)}</strong></div>
                </div>
                <div class="event-risk-reasons">
                  <div class="event-risk-reason"><strong>风险依据</strong>${escapeHtml(ai.risk_reason || "AI尚未给出风险依据")}</div>
                  <div class="event-risk-reason"><strong>机会依据</strong>${escapeHtml(ai.opportunity_reason || "AI尚未给出机会依据")}</div>
                </div>
                <div class="risk-quality-chips">
                  <span class="risk-quality-chip">严重度 ${num(ai.severity, 0)}</span>
                  <span class="risk-quality-chip">意外度 ${num(ai.surprise, 0)}</span>
                  <span class="risk-quality-chip">相关度 ${num(ai.relevance, 0)}</span>
                  <span class="risk-quality-chip">置信度 ${num(ai.confidence, 0)}</span>
                  <span class="risk-quality-chip">衰减 ${num(Number(final.decay_factor || 0) * 100, 1)}%</span>
                  ${final.excluded_from_market_aggregate ? `<span class="risk-quality-chip">个股事件：未计入市场聚合</span>` : ""}
                </div>
                <div class="event-risk-news">
                  ${news.length ? news.map((item) => {
                    const url = safeEventSourceUrl(item.url);
                    const copy = `${item.source || "来源"} · ${item.title || event.title || "原文"}`;
                    return url
                      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy)}</a>`
                      : `<span>${escapeHtml(copy)}</span>`;
                  }).join("") : `<span>来源明细已保存在 event_news 表。</span>`}
                </div>
                ${event.ai_error ? `<div class="risk-llm-error">AI状态：${escapeHtml(event.ai_error)}${event.next_retry_at ? `；下次重试 ${escapeHtml(event.next_retry_at)}` : ""}</div>` : ""}
                <form class="event-risk-form" data-event-review-form="${escapeHtml(event.id || "")}">
                  <label>方向
                    <select name="direction">
                      ${eventRiskOption("risk", final.direction, "风险")}
                      ${eventRiskOption("opportunity", final.direction, "机会")}
                      ${eventRiskOption("both", final.direction, "双向")}
                      ${eventRiskOption("neutral", final.direction, "中性")}
                    </select>
                  </label>
                  <label>影响层级
                    <select name="impact_level">
                      ${eventRiskOption("market", final.impact_level, "全市场")}
                      ${eventRiskOption("industry", final.impact_level, "行业")}
                      ${eventRiskOption("stock", final.impact_level, "个股")}
                    </select>
                  </label>
                  <label>人工风险分<input name="risk_score" type="number" min="0" max="100" step="1" value="${escapeHtml(manual.risk_score ?? final.risk_score ?? 0)}"></label>
                  <label>人工机会分<input name="opportunity_score" type="number" min="0" max="100" step="1" value="${escapeHtml(manual.opportunity_score ?? final.opportunity_score ?? 0)}"></label>
                  <label class="wide">影响行业<input name="affected_industries" value="${escapeHtml((manual.affected_industries ?? industries).join("，"))}" placeholder="逗号分隔"></label>
                  <label class="wide">影响股票<input name="affected_stocks" value="${escapeHtml((manual.affected_stocks ?? stocks).join("，"))}" placeholder="代码或名称，逗号分隔"></label>
                  <label class="wide">人工备注<input name="note" value="${escapeHtml(manual.note || "")}" placeholder="记录复核依据"></label>
                  <label><input name="risk_gate" type="checkbox" ${final.risk_gate ? "checked" : ""}> 开启 Risk Gate</label>
                  <div class="event-risk-actions">
                    <button class="pill-btn" type="submit">保存人工复核</button>
                    <button class="pill-btn secondary" type="button" data-clear-event-review="${escapeHtml(event.id || "")}">恢复 AI 结论</button>
                    <button class="pill-btn secondary" type="button" data-reanalyze-event="${escapeHtml(event.id || "")}">重新调用 DeepSeek</button>
                    <span>人工结论优先于 AI；原始 AI JSON 和每次修改审计不会被覆盖。</span>
                  </div>
                </form>
              </div>
            </details>
          `;
        }).join("") : `<div class="empty-state">今日暂无达到重要性门槛的${group.key === "research" ? "研报" : "财经新闻"}。</div>`}
            </div>
          </section>
        `).join("")}
      </div>
    </div>
  `;
}

function refreshEventRiskDashboard() {
  state.riskDashboardError = "";
  return loadRiskDashboard(true);
}

function bindEventRiskMonitorActions(container) {
  const statusEl = container.querySelector("#eventRiskActionStatus");
  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#b91c1c" : "#475569";
  };
  const runBtn = container.querySelector("#runEventRiskBtn");
  if (runBtn) {
    runBtn.addEventListener("click", async () => {
      runBtn.disabled = true;
      setStatus("正在逐个读取新闻源、聚类并分析新事件……");
      try {
        const result = await postJson("/api/event-risk/run", { trigger_type: "web", analyze: true });
        setStatus(`完成：抓取 ${result.news_fetched || 0} 条，新增新闻 ${result.inserted || 0} 条，新建事件 ${result.events_created || 0} 个。`);
        await refreshEventRiskDashboard();
      } catch (error) {
        setStatus(`执行失败：${error.message || error}`, true);
      } finally {
        runBtn.disabled = false;
      }
    });
  }
  container.querySelectorAll("[data-event-review-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const eventId = form.dataset.eventReviewForm || "";
      setStatus("正在保存人工复核……");
      try {
        await postJson("/api/event-risk/review", {
          event_id: eventId,
          changes: {
            direction: values.get("direction"), impact_level: values.get("impact_level"),
            risk_score: Number(values.get("risk_score") || 0),
            opportunity_score: Number(values.get("opportunity_score") || 0),
            affected_industries: String(values.get("affected_industries") || ""),
            affected_stocks: String(values.get("affected_stocks") || ""),
            note: String(values.get("note") || ""), risk_gate: values.get("risk_gate") === "on"
          }
        });
        await refreshEventRiskDashboard();
      } catch (error) {
        setStatus(`保存失败：${error.message || error}`, true);
      }
    });
  });
  container.querySelectorAll("[data-clear-event-review]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await postJson("/api/event-risk/review", { event_id: button.dataset.clearEventReview, changes: { clear_manual: true } });
        await refreshEventRiskDashboard();
      } catch (error) {
        setStatus(`恢复失败：${error.message || error}`, true);
      }
    });
  });
  container.querySelectorAll("[data-reanalyze-event]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      setStatus("正在重新调用 DeepSeek；无论成功或失败都会保存状态……");
      try {
        await postJson("/api/event-risk/reanalyze", { event_id: button.dataset.reanalyzeEvent });
        await refreshEventRiskDashboard();
      } catch (error) {
        setStatus(`重新分析失败：${error.message || error}`, true);
      } finally {
        button.disabled = false;
      }
    });
  });
}

function renderRiskDashboard() {
  const container = document.getElementById("view-risk");
  if (!container) return;
  const currentRiskPortfolioId = state.currentPortfolioId || "";
  const currentHoldingKey = getCurrentRiskHoldingKey();
  const payloadMatchesCurrent =
    state.riskDashboardPortfolioId === currentRiskPortfolioId &&
    state.riskDashboardHoldingKey === currentHoldingKey;
  // 持仓同步或后台定时重算期间，即使持仓 key 已变化，也继续展示上一次完整
  // 结果，直到新响应成功返回后再一次性替换，避免整个风控页闪成 loading。
  // 即使组合/持仓 key 已变化，也先把上一版完整结果作为可见缓冲层。
  // 下面会自动请求新结果，但不会再把容器替换成 loading 空态。
  const payload = state.riskDashboard || null;
  const needsCurrentPayload = !payload || !payloadMatchesCurrent;
  if (needsCurrentPayload && !state.riskDashboardLoading && !state.riskDashboardError) {
    loadRiskDashboard();
  }
  if (state.riskDashboardLoading && !payload) {
    container.innerHTML = `<div class="empty-state">正在计算四层风控得分和 K 线标注...</div>`;
    return;
  }
  if (state.riskDashboardError && !payload) {
    container.innerHTML = `
      <div class="panel-card">
        <h3>风控体系暂不可用</h3>
        <div class="empty-state">接口返回异常：${escapeHtml(state.riskDashboardError)}</div>
      </div>
    `;
    return;
  }
  if (!payload) return;

  if (payload.risk_v2 && payload.risk_v2.status !== "error") {
    renderRiskV2Dashboard(container, payload);
    return;
  }

  const radarData = payload.radar_data || [];
  container.innerHTML = `
    <div class="risk-shell">
      <div class="panel-card">
        <div class="feed-panel-heading">
          <div>
            <h3>全维度双向风控体系</h3>
            <p class="lead">承接综合判断结论，并把大盘、板块、组合与事件信号落到仓位建议和 K 线验证上。</p>
          </div>
          <button class="pill-btn secondary" id="refreshRiskDashboardBtn" type="button">刷新风控</button>
        </div>
        <div class="risk-hero-grid" style="margin-top:16px;">
          <div id="riskGaugeChart" class="risk-gauge"></div>
          <div class="risk-summary-card">
            <div class="risk-score-large">${num(payload.total_score, 1)}</div>
            <div class="risk-advice">${escapeHtml(payload.position_advice || "")}</div>
            <div class="risk-dimension-strip">
              ${radarData.map((item) => `
                <div class="risk-dimension-pill">
                  <strong>${escapeHtml(item.name || "")}</strong>
                  <span>${num(item.value, 1)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
        ${renderRiskDataQuality(payload)}
        ${renderRiskMarketBreadth(payload)}
      </div>

      <div class="panel-card">
          <h3>加减分事件明细</h3>
          <p class="risk-event-caption">仅展示本次实际触发并进入得分计算的规则；红色为利好加分，绿色为利空减分。</p>
          ${renderRiskDeepseekAnalysis(payload)}
          ${renderRiskEventSummary(payload.signal_logs || [])}
          <div class="risk-log-list">${renderRiskLogItems(payload.signal_logs || [], payload)}</div>
      </div>

      <div class="panel-card">
        <h3>文档全量加减分条件 · ${Number(payload.rule_catalog_summary?.total || 0)} 条</h3>
        <p class="lead">完整纳入大盘、板块、组合与事件驱动规则。优先使用真实数据；专项字段不可得时自动切换明确的代理指标，不再出现“数据待补齐”。</p>
        ${renderRiskRuleCatalog(payload)}
      </div>

      <div class="panel-card">
        <h3>当前持仓真实 K 线验证</h3>
        <p class="lead">从东方财富抓取主理人当前持仓的日 K，逐只叠加 MA20/MA60；红色向上标记代表利好加分，绿色向下标记代表利空减分。</p>
        ${renderRiskStockButtons(payload)}
        ${renderRiskKlineMeta(payload)}
        <div id="riskKlineChart" class="risk-kline-chart"></div>
      </div>
    </div>
  `;

  const refreshBtn = document.getElementById("refreshRiskDashboardBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadRiskDashboard(true));
  }
  container.querySelectorAll("[data-risk-code]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRiskKlineCode = button.dataset.riskCode || "";
      renderRiskDashboard();
    });
  });
  bindEventRiskMonitorActions(container);
  if (state.activeTab === "risk") {
    renderRiskCharts(payload);
  }
}

function riskV2Tone(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "unavailable";
  if (value >= 60) return "positive";
  if (value <= 40) return "negative";
  return "neutral";
}

function riskV2Score(value, suffix = "") {
  return Number.isFinite(Number(value)) ? `${num(value, 1)}${suffix}` : "—";
}

function renderRiskV2Factors(entity = {}, showFormula = false) {
  const factors = Array.isArray(entity.factors) ? entity.factors : [];
  if (!factors.length) return `<div class="empty-state">暂无可展示的因子结果。</div>`;
  return `
    <div class="risk-v2-factor-table">
      <div class="risk-v2-factor-head">
        <span>因子</span><span>原始值</span><span>得分</span><span>有效权重</span><span>贡献</span><span>较昨日</span><span>解释、公式与打分点</span>
      </div>
      ${factors.map((factor) => {
        const available = factor.available !== false && factor.status !== "unavailable";
        const change = Number(factor.score_change);
        return `
          <div class="risk-v2-factor-row ${available ? "" : "unavailable"}">
            <strong>${escapeHtml(factor.factor_name || factor.factor_code || "因子")}</strong>
            <span>${escapeHtml(factor.display_value || "暂无可靠数据")}</span>
            <b class="${riskV2Tone(factor.score)}">${riskV2Score(factor.score)}</b>
            <span>${available ? `${num(Number(factor.effective_weight || 0) * 100, 1)}%` : "不参与"}</span>
            <span>${riskV2Score(factor.contribution)}</span>
            <span class="${change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}">${Number.isFinite(change) ? `${change > 0 ? "+" : ""}${num(change, 1)}` : "—"}</span>
            <small>
              ${escapeHtml(factor.explanation || "")}
              <em>${escapeHtml(factor.data_source || "未声明数据源")}</em>
              ${showFormula ? `<span class="risk-score-formula-preview"><b>公式</b>${escapeHtml(factor.calculation_formula || "该因子按模型配置映射至0-100分。")}</span>` : ""}
              <details class="risk-v2-logic-detail" data-risk-detail-key="factor:${escapeHtml(entity.entity_id || entity.name || "entity")}:${escapeHtml(factor.factor_code || "factor")}">
                <summary>查看严密打分逻辑</summary>
                <strong>计算公式</strong><p>${escapeHtml(factor.calculation_formula || "该因子按模型配置映射至0-100分。")}</p>
                ${(factor.scoring_rules || []).length ? `<strong>本次打分点</strong><ul>${factor.scoring_rules.map((rule) => `<li class="${rule.triggered === true ? "hit" : rule.triggered === false ? "miss" : "unknown"}"><span>${escapeHtml(rule.label || "观察项")}</span><b>${escapeHtml(String(rule.observed ?? "—"))}</b><em>${escapeHtml(String(rule.points ?? "观察项"))}</em></li>`).join("")}</ul>` : ""}
                <strong>人工复核提示</strong><p>${escapeHtml(factor.manual_review_guide || "核对数据来源和更新时间后再做判断。")}</p>
              </details>
            </small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderRiskV2WatchMetrics(entity = {}, title = "主理人盯盘指标") {
  const items = Array.isArray(entity.watch_metrics) ? entity.watch_metrics : [];
  if (!items.length) return "";
  return `
    <div class="risk-v2-watch-panel">
      <div class="risk-v2-watch-head"><strong>${escapeHtml(title)}</strong><span>红色偏强 · 绿色风险 · 黄色中性；点击因子可核对完整公式</span></div>
      <div class="risk-v2-watch-grid">
        ${items.map((item) => `<div class="risk-v2-watch-item ${escapeHtml(item.status || "neutral")} ${item.group === "capital" ? "capital" : ""}"><span>${escapeHtml(item.name || item.code || "指标")}</span><strong>${escapeHtml(String(item.value ?? "—"))}</strong>${item.alert ? `<em>${escapeHtml(item.alert)}</em>` : ""}</div>`).join("")}
      </div>
    </div>
  `;
}

function renderRiskV2MarketCockpit(market = {}, breadth = {}) {
  const items = Array.isArray(market.watch_metrics) ? market.watch_metrics : [];
  const capitalItems = items.filter((item) => item.group === "capital");
  const liquidityItems = capitalItems.filter((item) => ["volume", "amount"].includes(String(item.code || "")));
  const mainFlow = capitalItems.find((item) => item.code === "main_net_inflow") || capitalItems[2] || {};
  const flowItems = capitalItems.filter((item) => !["volume", "amount", "main_net_inflow"].includes(String(item.code || "")));
  const advancers = Number(breadth.advancers);
  const decliners = Number(breadth.decliners);
  const suppliedRatio = Number(breadth.advancing_ratio);
  const advancingRatio = Number.isFinite(suppliedRatio)
    ? suppliedRatio
    : (Number.isFinite(advancers) && Number.isFinite(decliners) && advancers + decliners > 0 ? advancers / (advancers + decliners) : 0);
  const advancingPercent = Math.max(0, Math.min(100, advancingRatio * 100));
  const marketScore = Number(market.score);
  const regime = marketScore >= 80 ? "强势低风险" : marketScore >= 60 ? "偏强可进攻" : marketScore >= 40 ? "中性需观察" : marketScore >= 20 ? "偏弱需防守" : "高风险防守";
  const regimeTone = marketScore >= 60 ? "positive" : marketScore < 40 ? "negative" : "neutral";
  const metricCard = (item, className) => item && Object.keys(item).length ? `
    <div class="${className} ${escapeHtml(item.status || "neutral")}">
      <span>${escapeHtml(item.name || item.code || "指标")}</span>
      <strong>${escapeHtml(String(item.value ?? "—"))}</strong>
      ${item.alert ? `<small>${escapeHtml(item.alert)}</small>` : ""}
    </div>
  ` : "";
  return `
    <div class="risk-v2-market-command-grid">
      <section class="risk-v2-market-pulse" aria-label="大盘市场宽度">
        <div class="risk-v2-market-block-head">
          <div><span>市场宽度</span><strong>上涨与下跌股票分布</strong></div>
          <b class="risk-v2-market-regime ${regimeTone}">${regime}</b>
        </div>
        <div class="risk-v2-breadth-hero">
          <div class="risk-v2-breadth-ratio"><span>上涨家数占比</span><strong>${Number.isFinite(suppliedRatio) ? `${num(advancingPercent, 1)}%` : "—"}</strong></div>
          <div class="risk-v2-breadth-counts">
            <div class="up"><span>上涨股票</span><strong>${riskV2Score(breadth.advancers)}</strong></div>
            <div class="down"><span>下跌股票</span><strong>${riskV2Score(breadth.decliners)}</strong></div>
          </div>
        </div>
        <div class="risk-v2-breadth-track" role="img" aria-label="上涨股票占比 ${num(advancingPercent, 1)}%">
          <span class="up" style="width:${num(advancingPercent, 1)}%"></span><span class="down"></span>
        </div>
        <div class="risk-v2-breadth-scale"><span>上涨 ${num(advancingPercent, 1)}%</span><span>下跌 ${num(100 - advancingPercent, 1)}%</span></div>
        <div class="risk-v2-market-pulse-meta">
          <div><span>个股涨跌中位数</span><strong>${riskV2Score(breadth.median_pct_change, "%")}</strong></div>
          <div><span>大盘评分置信度</span><strong>${num(Number(market.score_confidence || 0) * 100, 0)}%</strong></div>
        </div>
        <p class="risk-v2-market-source">数据口径：${escapeHtml(breadth.source || "全市场实时行情快照")}</p>
      </section>

      <section class="risk-v2-market-capital" aria-label="成交与资金流">
        <div class="risk-v2-market-block-head">
          <div><span>成交与资金流</span><strong>先看量能，再看各类资金方向</strong></div>
          <b class="risk-v2-market-regime neutral">盘中实时</b>
        </div>
        <div class="risk-v2-liquidity-grid">${liquidityItems.map((item) => metricCard(item, "risk-v2-liquidity-card")).join("")}</div>
        <div class="risk-v2-fund-flow-layout">
          ${metricCard(mainFlow, "risk-v2-fund-flow-main")}
          <div class="risk-v2-fund-flow-grid">${flowItems.map((item) => metricCard(item, "risk-v2-fund-flow-item")).join("")}</div>
        </div>
      </section>
    </div>
  `;
}

function riskPageStatus(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return { className: "unavailable", label: "暂无评分" };
  if (value <= 40) return { className: "risk", label: "高风险" };
  if (value < 60) return { className: "watch", label: "观察" };
  return { className: "safe", label: "相对安全" };
}

function riskPageChange(value) {
  const change = Number(value);
  if (!Number.isFinite(change)) return { className: "flat", text: "—" };
  return {
    className: change > 0 ? "up" : change < 0 ? "down" : "flat",
    text: `${change > 0 ? "+" : ""}${num(change, 1)}`,
  };
}

function riskPagePrimaryTrigger(industry = {}) {
  const factors = (Array.isArray(industry.factors) ? industry.factors : [])
    .filter((item) => item.available !== false && Number.isFinite(Number(item.score)))
    .sort((a, b) => Number(a.score) - Number(b.score));
  const factor = factors[0];
  if (!factor) return "暂无可用风险因子";
  return `${factor.factor_name || factor.factor_code || "风险因子"}：${factor.display_value || "暂无原始值"}`;
}

function renderRiskV2SectorTable(v2 = {}) {
  const uniqueSectors = new Map();
  (Array.isArray(v2.sectors) ? v2.sectors : []).forEach((item) => {
    const code = String(item.industry_code || item.entity_id || "").trim();
    if (!code || item.industry_standard !== "SW" || Number(item.industry_level) !== 2 || uniqueSectors.has(code)) return;
    uniqueSectors.set(code, item);
  });
  const sectors = [...uniqueSectors.values()];
  const holdings = Array.isArray(v2.holdings) ? v2.holdings : [];
  const exposure = new Map();
  holdings.forEach((holding) => {
    const sw = holding.sw_industry || {};
    const code = String(sw.industry_code || "").trim();
    if (!code || sw.mapping_status !== "mapped") return;
    const current = exposure.get(code) || { count: 0, names: [] };
    current.count += 1;
    current.names.push(holding.name || holding.entity_id || "持仓");
    exposure.set(code, current);
  });

  const view = ["portfolio", "high-risk", "all"].includes(state.riskIndustryView) ? state.riskIndustryView : "portfolio";
  const search = String(state.riskIndustrySearch || "").trim().toLowerCase();
  let visible = sectors.filter((item) => item.mapping_status === "mapped");
  if (view === "portfolio") {
    visible = visible.filter((item) => exposure.has(String(item.industry_code || item.entity_id || "")));
    visible.sort((a, b) => (exposure.get(String(b.industry_code))?.count || 0) - (exposure.get(String(a.industry_code))?.count || 0));
  } else if (view === "high-risk") {
    visible = visible
      .filter((item) => Number.isFinite(Number(item.score)))
      .sort((a, b) => Number(a.score) - Number(b.score))
      .slice(0, 10);
  } else {
    if (search) visible = visible.filter((item) => `${item.industry_name || item.name || ""} ${item.industry_code || item.entity_id || ""}`.toLowerCase().includes(search));
    visible.sort((a, b) => String(a.industry_code || "").localeCompare(String(b.industry_code || "")));
  }

  const pageSize = 15;
  const pageCount = view === "all" ? Math.max(1, Math.ceil(visible.length / pageSize)) : 1;
  const currentPage = Math.min(pageCount, Math.max(1, Number(state.riskIndustryPage || 1)));
  const pageRows = view === "all" ? visible.slice((currentPage - 1) * pageSize, currentPage * pageSize) : visible;
  const selected = uniqueSectors.get(String(state.selectedRiskIndustryCode || "")) || null;
  const unmapped = Array.isArray(v2.unmapped_holdings) ? v2.unmapped_holdings : [];

  const rows = pageRows.map((item) => {
    const code = String(item.industry_code || item.entity_id || "");
    const status = riskPageStatus(item.score);
    const change = riskPageChange(item.score_change);
    const holdingExposure = exposure.get(code);
    const trigger = riskPagePrimaryTrigger(item);
    return `
      <tr>
        <td><button class="risk-page-industry-link" type="button" data-risk-industry-code="${escapeHtml(code)}"><strong>${escapeHtml(item.industry_name || item.name || "未命名行业")}</strong><span>${escapeHtml(code)}</span></button></td>
        <td class="risk-page-number"><strong class="risk-page-score ${status.className}">${riskV2Score(item.score)}</strong></td>
        <td><span class="risk-page-status ${status.className}">${status.label}</span></td>
        <td class="risk-page-number"><span class="risk-page-change ${change.className}">${change.text}</span></td>
        <td title="${escapeHtml(holdingExposure?.names?.join("、") || "当前组合未持有")}">${holdingExposure ? `${holdingExposure.count} 只持仓` : "无"}</td>
        <td><span class="risk-page-trigger" title="${escapeHtml(trigger)}">${escapeHtml(trigger)}</span></td>
        <td class="risk-page-time">${escapeHtml(String(item.updated_at || v2.calculation_time || "—").replace("T", " ").slice(0, 19))}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="risk-page-industry-toolbar">
      <div class="risk-page-segments" role="tablist" aria-label="申万二级行业视图">
        <button type="button" role="tab" aria-selected="${view === "portfolio"}" class="${view === "portfolio" ? "active" : ""}" data-risk-industry-view="portfolio">当前组合相关</button>
        <button type="button" role="tab" aria-selected="${view === "high-risk"}" class="${view === "high-risk" ? "active" : ""}" data-risk-industry-view="high-risk">高风险行业</button>
        <button type="button" role="tab" aria-selected="${view === "all"}" class="${view === "all" ? "active" : ""}" data-risk-industry-view="all">全部行业</button>
      </div>
      ${view === "all" ? `<form class="risk-page-search" id="riskIndustrySearchForm"><input id="riskIndustrySearchInput" type="search" value="${escapeHtml(state.riskIndustrySearch || "")}" placeholder="搜索行业名称或代码" aria-label="搜索申万二级行业"><button type="submit">搜索</button></form>` : `<span class="risk-page-industry-count">${view === "high-risk" ? "按安全分从低到高，最多 10 个" : `涉及 ${visible.length} 个申万二级行业`}</span>`}
    </div>
    ${unmapped.length ? `<div class="risk-page-mapping-note"><strong>${unmapped.length} 只持仓未映射/待补充</strong><span>${unmapped.map((item) => `${item.stock_name || item.stock_code || "未知持仓"}(${item.stock_code || "无代码"})`).join("、")}</span></div>` : ""}
    <div class="risk-page-table-wrap">
      <table class="risk-page-industry-table">
        <thead><tr><th>申万二级行业</th><th>行业风控值</th><th>风险状态</th><th>较上一交易日</th><th>当前组合暴露</th><th>主要风险触发点</th><th>数据更新时间</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="risk-page-empty">${view === "portfolio" ? "暂无申万二级行业映射数据" : search ? "没有匹配的申万二级行业" : "暂无申万二级行业评分数据"}</td></tr>`}</tbody>
      </table>
    </div>
    ${view === "all" && pageCount > 1 ? `<div class="risk-page-pagination"><button type="button" data-risk-industry-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>上一页</button><span>第 ${currentPage} / ${pageCount} 页 · 共 ${visible.length} 个行业</span><button type="button" data-risk-industry-page="${currentPage + 1}" ${currentPage >= pageCount ? "disabled" : ""}>下一页</button></div>` : ""}
    ${selected ? `<details class="risk-page-industry-detail" open><summary><span>${escapeHtml(selected.industry_name || selected.name || "申万二级行业")} · ${escapeHtml(selected.industry_code || selected.entity_id || "")}</span><strong>${riskV2Score(selected.score)}</strong></summary><p>行业自身分与大盘环境按现有 risk_v2 公式联动；缺失因子不补默认分。</p>${renderRiskV2Factors(selected)}</details>` : ""}
  `;
}
function renderRiskV2EventCards(items = []) {
  if (!items.length) return `<div class="empty-state">今日没有达到重要度门槛的热点新闻，系统不会用历史内容凑数。</div>`;
    return `
      <div class="risk-v2-real-event-list scrollable" data-risk-scroll-key="real-event-list">
        <div id="eventRiskActionStatus" class="risk-v2-event-action-status">真实事件来自联网新闻源；DeepSeek 分析结果与原始新闻证据同时展示。</div>
        ${items.map((item, index) => {
          const ai = item.ai || {};
          const final = item.final || {};
          const sourceNews = Array.isArray(item.news) ? item.news[0] || {} : {};
          const sourceUrl = safeEventSourceUrl(sourceNews.url);
          const direction = String(final.direction || ai.direction || "neutral");
          const directionLabel = direction === "risk" ? "偏风险" : direction === "opportunity" ? "偏机会" : direction === "both" ? "双向影响" : "中性观察";
          const affected = [...(final.affected_industries || []), ...(final.affected_stocks || [])].filter(Boolean).slice(0, 8);
          return `
            <article class="risk-v2-real-event-card ${escapeHtml(direction)}">
              <div class="risk-v2-real-event-head">
                <span class="rank">${index + 1}</span>
                <div>
                  <strong>${escapeHtml(item.title || "未命名真实事件")}</strong>
                  <p>${escapeHtml(sourceNews.source || sourceNews.media_name || "联网新闻源")} · ${escapeHtml(String(item.published_at || "").replace("T", " ").slice(0, 19))} · ${Number(item.source_count || 0)} 个来源</p>
                </div>
                <b>${directionLabel}</b>
              </div>
              <div class="risk-v2-real-event-fact"><strong>事件主要内容</strong><p>${escapeHtml(item.summary || "当前新闻源未提供摘要。")}</p></div>
              <div class="risk-v2-real-event-source">
                <span>真实性证据：${escapeHtml(sourceNews.title || item.title || "原始新闻")}</span>
                ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">查看原始新闻</a>` : `<em>原始链接已记录在本地事件库</em>`}
              </div>
              <section class="risk-v2-event-ai-analysis">
                <div class="risk-v2-event-ai-head">
                  <div><span>DEEPSEEK EVENT ANALYSIS</span><strong>组合小助手事件解读</strong></div>
                  <small>${item.ai_status === "analyzed" ? `已分析 · ${escapeHtml(String(item.ai_analyzed_at || "").replace("T", " ").slice(0, 19))}` : `状态：${escapeHtml(item.ai_status || "待分析")}`}</small>
                </div>
                ${item.ai_status === "analyzed" ? `
                  <div class="risk-v2-event-ai-metrics">
                    <span>严重度<strong>${riskV2Score(ai.severity)}</strong></span>
                    <span>意外度<strong>${riskV2Score(ai.surprise)}</strong></span>
                    <span>市场相关度<strong>${riskV2Score(ai.relevance)}</strong></span>
                    <span>判断置信度<strong>${riskV2Score(ai.confidence)}</strong></span>
                    <span>影响周期<strong>${escapeHtml(ai.expected_duration === "short" ? "短期" : ai.expected_duration === "medium" ? "中期" : ai.expected_duration === "long" ? "长期" : ai.expected_duration || "待判断")}</strong></span>
                  </div>
                  <div class="risk-v2-event-ai-reasons">
                    <div class="risk"><strong>风险分析</strong><p>${escapeHtml(ai.risk_reason || "当前未识别明确风险依据。")}</p></div>
                    <div class="opportunity"><strong>机会分析</strong><p>${escapeHtml(ai.opportunity_reason || "当前未识别明确机会依据。")}</p></div>
                  </div>
                  <div class="risk-v2-event-ai-foot">
                    <div>${affected.length ? affected.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("") : `<span>全市场观察</span>`}</div>
                    <p>Python计分：有效风险 ${riskV2Score(final.effective_risk_score)} · 有效机会 ${riskV2Score(final.effective_opportunity_score)} · 时效衰减 ${num(Number(final.decay_factor || 0) * 100, 1)}%</p>
                  </div>
                ` : `<div class="risk-v2-ai-empty"><strong>该真实事件正在等待 DeepSeek 分析</strong><span>${escapeHtml(item.ai_error || "稍后刷新即可读取风险、机会和影响范围。")}</span></div>`}
                <button class="risk-v2-event-reanalyze" type="button" data-reanalyze-event="${escapeHtml(item.id || "")}">${item.ai_status === "analyzed" ? "重新调用 DeepSeek 分析" : "立即调用 DeepSeek 分析"}</button>
              </section>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }
function renderRiskAnnotationToolbar(scope, code) {
  const key = riskChartKey(scope, code);
  const annotations = state.riskAnnotationDrafts[key] || [];
  const drawing = state.riskDrawingKey === key;
  return `
    <div class="risk-workspace-chart-tools" data-chart-tools="${escapeHtml(key)}">
      <button type="button" class="${drawing ? "active" : ""}" data-risk-annotation-action="draw" data-scope="${scope}" data-code="${escapeHtml(code)}">画趋势线</button>
      <label><span>压力位</span><input type="number" min="0" step="0.01" id="riskPressure-${scope}" placeholder="价格"></label>
      <button type="button" data-risk-annotation-action="pressure" data-scope="${scope}" data-code="${escapeHtml(code)}">添加</button>
      <button type="button" data-risk-annotation-action="undo" data-scope="${scope}" data-code="${escapeHtml(code)}" ${annotations.length ? "" : "disabled"}>撤销</button>
      <button type="button" data-risk-annotation-action="clear" data-scope="${scope}" data-code="${escapeHtml(code)}" ${annotations.length ? "" : "disabled"}>清空</button>
      <button type="button" class="save" data-risk-annotation-action="save" data-scope="${scope}" data-code="${escapeHtml(code)}">保存</button>
      <small id="riskAnnotationStatus-${scope}">${drawing ? (state.riskDrawingStart ? "已选起点，请选终点" : "请在K线上依次选择两个点") : `${annotations.length} 条标注`}</small>
    </div>
  `;
}

function riskScoreAuditTrigger(level, entityId, label = "查看评分标准") {
  if (!entityId) return "";
  return `<span class="risk-score-audit-trigger" role="button" tabindex="0" data-risk-score-level="${escapeHtml(level)}" data-risk-score-id="${escapeHtml(entityId)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">i</span>`;
}

function findRiskScoreEntity(payload, level, entityId) {
  const v2 = payload?.risk_v2 || {};
  const id = String(entityId || "");
  if (level === "market") return v2.market || null;
  const rows = level === "sector" ? (v2.sectors || []) : level === "stock" ? (v2.holdings || []) : [];
  return rows.find((item) => String(item.industry_code || item.entity_id || item.stock_code || item.code || "") === id) || null;
}

function renderRiskScoreAudit(entity, level, v2 = {}) {
  if (!entity) return `<div class="risk-workspace-empty">当前评分明细暂不可用。</div>`;
  const weights = v2.methodology?.weights?.linkage || {};
  let linkage = "本层有效因子按有效权重重新归一后加权；缺失因子不使用默认分。";
  if (level === "sector") {
    linkage = `行业最终分 = 行业自身分 ${riskV2Score(entity.own_score)} × ${num(Number(weights.sector_own ?? 0.8) * 100, 0)}% + 大盘分 ${riskV2Score(entity.market_score)} × ${num(Number(weights.sector_market ?? 0.2) * 100, 0)}%。`;
  } else if (level === "stock") {
    linkage = `个股最终分 = 个股自身分 ${riskV2Score(entity.own_score)} × ${num(Number(weights.stock_own ?? 0.65) * 100, 0)}% + 行业分 ${riskV2Score(entity.sector_score)} × ${num(Number(weights.stock_sector ?? 0.2) * 100, 0)}% + 大盘分 ${riskV2Score(entity.market_score)} × ${num(Number(weights.stock_market ?? 0.15) * 100, 0)}%。`;
  }
  return `
    <div class="risk-score-audit-summary">
      <div><span>当前风控分</span><strong>${riskV2Score(entity.score)}</strong></div>
      <div><span>较前值</span><strong>${Number.isFinite(Number(entity.score_change)) ? `${Number(entity.score_change) >= 0 ? "+" : ""}${num(entity.score_change, 1)}` : "—"}</strong></div>
      <div><span>数据完整度</span><strong>${num(Number(entity.score_confidence || 0) * 100, 0)}%</strong></div>
    </div>
    <div class="risk-score-audit-method"><strong>最终分合成方式</strong><p>${escapeHtml(linkage)}</p><small>统一口径：分数越高代表风险越低。模型 ${escapeHtml(v2.model_version || "risk_v2")}；AI仅抽取新闻事实，不直接生成评分。</small></div>
    ${renderRiskV2Factors(entity, true)}
  `;
}

function renderRiskInstrumentReview() {
  const review = state.riskWorkspace?.instrument_review || {};
  const option = (value, label, current) => `<option value="${value}" ${current === value ? "selected" : ""}>${label}</option>`;
  return `
    <form class="risk-instrument-review" id="riskInstrumentReviewForm">
      <div><strong>衍生工具必要性 · 主理人主观评价</strong><span>仅保存观点，客观风控分不因本栏内容改变。</span></div>
      <label><span>两融</span><select name="margin_view">${option("", "未评价", review.margin_view)}${option("needed", "有必要", review.margin_view)}${option("not_needed", "无必要", review.margin_view)}${option("watch", "继续观察", review.margin_view)}</select></label>
      <label><span>期权</span><select name="options_view">${option("", "未评价", review.options_view)}${option("needed", "有必要", review.options_view)}${option("not_needed", "无必要", review.options_view)}${option("watch", "继续观察", review.options_view)}</select></label>
      <label class="note"><span>评价理由</span><textarea name="note" rows="2" maxlength="1000" placeholder="填写是否需要融资融券或期权保护、增强收益的主观判断及理由">${escapeHtml(review.note || "")}</textarea></label>
      <button type="submit">保存评价</button>
      <small id="riskInstrumentReviewStatus">${review.updated_at ? `已保存 ${escapeHtml(String(review.updated_at).replace("T", " ").slice(0, 16))}` : "尚未填写"}</small>
    </form>
  `;
}

function isRiskRsiOverbought(value) {
  return Number.isFinite(Number(value)) && Number(value) > 80;
}

function renderRiskRsiAlert(value, showNormal = false) {
  if (isRiskRsiOverbought(value)) {
    return `<span class="risk-rsi-alert" title="Wilder RSI(14) 大于 80">RSI ${num(value, 1)} · 超买</span>`;
  }
  if (!showNormal) return "";
  return Number.isFinite(Number(value))
    ? `<span class="risk-rsi-value" title="Wilder RSI(14)">RSI ${num(value, 1)}</span>`
    : `<span class="risk-rsi-value unavailable">RSI —</span>`;
}

function riskHoldingCandidates(payload) {
  const klineRows = payload.holding_klines?.items || [];
  const localRows = getCurrentHoldingRows();
  const localByCode = new Map(localRows.map((item) => [String(item.code || "").replace(/\D/g, "").slice(-6), item]));
  const v2ByCode = new Map((payload.risk_v2?.holdings || []).map((item) => [String(item.entity_id || item.stock_code || item.code || "").replace(/\D/g, "").slice(-6), item]));
  const base = klineRows.length ? klineRows : localRows;
  const rows = base.map((item) => {
    const code = String(item.code || item.stock_code || "").replace(/\D/g, "").slice(-6);
    const local = localByCode.get(code) || {};
    const risk = v2ByCode.get(code) || {};
    const rawReturn = item.return_pct ?? local.return_pct ?? local.unrealized_return_pct;
    const closes = (item.ohlc || []).map((row) => Number(row?.[1])).filter(Number.isFinite);
    const latestClose = closes.at(-1);
    const movingAverage = (window) => closes.length >= window
      ? closes.slice(-window).reduce((sum, value) => sum + value, 0) / window
      : null;
    const maLevels = [5, 10, 20, 60].map((window) => {
      const average = movingAverage(window);
      return {
        window,
        average,
        below: Number.isFinite(latestClose) && Number.isFinite(average) ? latestClose < average : null,
      };
    });
    return {
      code,
      name: item.name || item.stock || local.stock || local.name || risk.entity_name || code,
      returnPct: parsePctPointValue(rawReturn),
      latestPrice: item.latest_price ?? local.latest_price ?? local.price ?? risk.latest_price,
      industry: risk.sw_industry?.industry_name || risk.sw_industry_name || risk.industry || local.industry || "行业待映射",
      sectorCode: risk.sw_industry?.industry_code || risk.sw_industry_code || "",
      stockScore: risk.score,
      sectorScore: risk.sector_score,
      rsi14: risk.rsi14,
      maLevels,
    };
  }).filter((item) => item.code);
  const values = rows.map((item) => item.returnPct).filter(Number.isFinite).sort((a, b) => a - b);
  const median = values.length ? values[Math.floor(values.length / 2)] : null;
  return rows
    .filter((item) => Number.isFinite(item.returnPct) && (item.returnPct < 0 || (item.returnPct <= 3 && item.returnPct <= median)))
    .sort((a, b) => a.returnPct - b.returnPct);
}

function renderRiskHoldingReview(payload) {
  const rows = riskHoldingCandidates(payload);
  const reviews = new Map((state.riskWorkspace?.holding_reviews || []).map((item) => [String(item.stock_code), item]));
  if (!rows.length) return `<div class="risk-workspace-empty">当前持仓没有亏损或明显弱于组合中位数的标的。</div>`;
  return `<div class="risk-holding-review-list">${rows.map((item) => {
    const review = reviews.get(item.code) || {};
    return `
      <article class="risk-holding-review-item ${isRiskRsiOverbought(item.rsi14) ? "rsi-overbought" : ""}">
        <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.code)} · ${escapeHtml(item.industry)}</span>${renderRiskRsiAlert(item.rsi14)}</div>
        <b class="${item.returnPct < 0 ? "loss" : "weak"}">${item.returnPct > 0 ? "+" : ""}${num(item.returnPct, 2)}%</b>
        <div class="risk-holding-scoreline"><span>个股风控分 <strong>${Number.isFinite(Number(item.stockScore)) ? num(item.stockScore, 1) : "—"}</strong>${riskScoreAuditTrigger("stock", item.code)}</span><span>行业风控分 <strong>${Number.isFinite(Number(item.sectorScore)) ? num(item.sectorScore, 1) : "—"}</strong>${riskScoreAuditTrigger("sector", item.sectorCode)}</span></div>
        <div class="risk-holding-ma-line">${item.maLevels.map((level) => `<span class="${level.below === true ? "below" : level.below === false ? "above" : "unknown"}">MA${level.window} ${level.below === true ? "已跌破" : level.below === false ? "站上" : "暂无"}${Number.isFinite(level.average) ? ` · ${num(level.average, 2)}` : ""}</span>`).join("")}</div>
        <p>${item.returnPct < 0 ? "当前持仓处于亏损，是否需要修改？" : "收益弱于当前组合中位水平，是否继续持有？"}</p>
        <div class="risk-holding-review-actions">
          <button type="button" class="${review.decision === "adjust" ? "active adjust" : ""}" data-holding-review="adjust" data-code="${item.code}" data-name="${escapeHtml(item.name)}">需要调整</button>
          <button type="button" class="${review.decision === "watch" ? "active watch" : ""}" data-holding-review="watch" data-code="${item.code}" data-name="${escapeHtml(item.name)}">继续观察</button>
          <small>${review.updated_at ? `已记录 ${escapeHtml(String(review.updated_at).replace("T", " ").slice(0, 16))}` : "尚未处理"}</small>
        </div>
      </article>`;
  }).join("")}</div>`;
}

function renderRiskHoldingScoreStrip(payload) {
  const rows = (payload.risk_v2?.holdings || [])
    .filter((item) => item.entity_id || item.name)
    .sort((a, b) => Number(a.score ?? 999) - Number(b.score ?? 999));
  if (!rows.length) return `<div class="risk-workspace-empty">暂无可展示的个股风控评分。</div>`;
  return `<div class="risk-holding-score-strip" data-risk-scroll-key="holding-scores">${rows.map((item) => `
    <article class="${isRiskRsiOverbought(item.rsi14) ? "rsi-overbought" : ""}">
      <div><strong>${escapeHtml(item.name || item.entity_id || "未命名")}</strong><span>${escapeHtml(item.entity_id || "")}</span></div>
      <b>${Number.isFinite(Number(item.score)) ? num(item.score, 1) : "—"}${riskScoreAuditTrigger("stock", item.entity_id || item.stock_code || item.code)}</b>
      <p>${escapeHtml(item.sw_industry?.industry_name || item.industry || "行业待映射")} · 行业分 ${Number.isFinite(Number(item.sector_score)) ? num(item.sector_score, 1) : "—"} ${riskScoreAuditTrigger("sector", item.sw_industry?.industry_code || item.sw_industry_code)}</p>${renderRiskRsiAlert(item.rsi14)}
    </article>`).join("")}</div>`;
}

function renderRiskEventBrief(items = []) {
  const usable = items.filter((item) => item && item.title);
  const riskItems = usable.filter((item) => ["risk", "both"].includes(String(item.final?.direction || item.ai?.direction || "neutral")));
  const opportunityItems = usable.filter((item) => ["opportunity", "both"].includes(String(item.final?.direction || item.ai?.direction || "neutral")));
  const column = (title, tone, rows) => `
    <section class="risk-event-brief-column ${tone}">
      <header><h4>${title}</h4><span>${rows.length} 条</span></header>
      ${rows.length ? rows.slice(0, 6).map((item) => {
        const source = (item.news || [])[0] || {};
        const score = tone === "bearish" ? item.final?.effective_risk_score : item.final?.effective_opportunity_score;
        const sourceUrl = safeEventSourceUrl(source.url);
        const affected = [...(item.final?.affected_industries || []), ...(item.final?.affected_stocks || [])].filter(Boolean).slice(0, 10);
        const duration = item.ai?.expected_duration === "short" ? "短期" : item.ai?.expected_duration === "medium" ? "中期" : item.ai?.expected_duration === "long" ? "长期" : "待判断";
        return `
          <details class="risk-event-brief-item">
            <summary>
              <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(source.source || source.media_name || "联网新闻")} · ${escapeHtml(String(item.published_at || "").slice(0, 10))}</span></div>
              <b>${Number.isFinite(Number(score)) ? num(score, 0) : "—"}</b>
              <i aria-hidden="true"></i>
            </summary>
            <div class="risk-event-brief-body">
              <section><strong>事件主要内容</strong><p>${escapeHtml(item.summary || "当前事件暂无结构化摘要。")}</p></section>
              ${item.ai?.risk_reason ? `<section class="risk"><strong>风险影响</strong><p>${escapeHtml(item.ai.risk_reason)}</p></section>` : ""}
              ${item.ai?.opportunity_reason ? `<section class="opportunity"><strong>机会影响</strong><p>${escapeHtml(item.ai.opportunity_reason)}</p></section>` : ""}
              <div class="risk-event-brief-meta"><span>影响层级：${escapeHtml(item.final?.impact_level || item.ai?.impact_level || "待判断")}</span><span>影响周期：${duration}</span><span>来源数：${Number(item.source_count || 0)}</span></div>
              ${affected.length ? `<div class="risk-event-brief-tags">${affected.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
              ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">查看原始新闻</a>` : ""}
            </div>
          </details>`;
      }).join("") : `<div class="risk-workspace-empty">暂无${title}消息</div>`}
    </section>`;
  return `<div class="risk-event-brief-grid">${column("利空消息", "bearish", riskItems)}${column("利好消息", "bullish", opportunityItems)}</div>`;
}

function renderRiskSectorStrongStocks(detail) {
  if (state.riskSectorDetailLoading) return `<div class="risk-workspace-empty">正在读取行业成分股历史行情...</div>`;
  if (state.riskSectorDetailError) return `<div class="risk-workspace-empty error"><span>${escapeHtml(state.riskSectorDetailError)}</span><button type="button" data-risk-sector-retry>重试</button></div>`;
  const rows = detail?.strong_stocks || [];
  if (!rows.length) return `<div class="risk-workspace-empty">最近约 75 天内，已扫描成分股中暂无单日涨幅达到 5% 的标的。</div>`;
  return `<div class="risk-sector-stock-list" data-risk-scroll-key="strong-stocks">${rows.map((item) => `
    <article class="${isRiskRsiOverbought(item.rsi14) ? "rsi-overbought" : ""}">
      <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.code)}</span></div>
      <b>最高 +${num(item.max_gain_pct, 2)}%</b>
      <p>${item.limit_up_dates?.length ? `涨停 ${item.limit_up_dates.length} 次 · 最近 ${escapeHtml(item.limit_up_dates[0])}` : `5%以上 ${item.strong_days?.length || 0} 次 · 最近 ${escapeHtml(item.strong_days?.[0]?.date || "—")}`}</p>${renderRiskRsiAlert(item.rsi14)}
    </article>`).join("")}</div>`;
}

function adoptRiskPositionJournal(payload, force = false) {
  const incoming = payload?.risk_position_journal;
  const incomingHistory = Array.isArray(payload?.risk_position_history) ? payload.risk_position_history : [];
  const browserRecord = state.riskPositionJournal?.source === "browser_static_edit" ? state.riskPositionJournal : null;
  if (payload?.__static_snapshot && browserRecord && !force) {
    const mergedHistory = incomingHistory.filter((item) => item.snapshot_date !== browserRecord.snapshot_date);
    mergedHistory.unshift(browserRecord);
    state.riskPositionHistory = mergedHistory;
    return;
  }
  state.riskPositionHistory = incomingHistory.length ? incomingHistory : state.riskPositionHistory;
  if (!incoming) return;
  const current = state.riskPositionJournal;
  const sameRecord = current
    && current.portfolio_id === incoming.portfolio_id
    && current.snapshot_date === incoming.snapshot_date;
  if (!sameRecord || force || !state.riskPositionDirty) {
    state.riskPositionJournal = JSON.parse(JSON.stringify(incoming));
    state.riskPositionHistoryRecord = null;
    state.riskPositionHistoryDate = "";
    state.riskPositionDirty = false;
    state.riskPositionStatus = "";
    state.riskStockSearchResults = [];
  }
}

function riskPositionTotal(record) {
  return Math.round((record?.holdings || []).reduce((sum, item) => {
    const value = Number(item.position_pct);
    return sum + (Number.isFinite(value) ? Math.max(0, value) : 0);
  }, 0) * 100) / 100;
}

function riskPositionGapMeta(totalPosition, marketScore) {
  if (!Number.isFinite(Number(marketScore))) {
    return { gap: null, className: "unavailable", label: "等待大盘风控分" };
  }
  const gap = Number(totalPosition) - Number(marketScore);
  if (gap > 15) return { gap, className: "risk", label: "仓位明显高于市场安全分" };
  if (gap > 5) return { gap, className: "watch", label: "仓位略高于市场安全分" };
  if (gap >= -5) return { gap, className: "aligned", label: "仓位与市场安全分接近" };
  return { gap, className: "defensive", label: "仓位低于市场安全分" };
}

function renderRiskPositionJournal(payload, market = {}) {
  const current = state.riskPositionJournal || payload?.risk_position_journal;
  if (!current) {
    return `<section class="risk-page-panel risk-position-journal"><div class="risk-position-empty"><strong>仓位对照正在建立</strong><span>当天大盘风控分完成后，会自动生成首份主理人仓位记录。</span></div></section>`;
  }
  const historyRecord = state.riskPositionHistoryRecord;
  const record = historyRecord || current;
  const isHistory = Boolean(historyRecord);
  const holdings = Array.isArray(record.holdings) ? record.holdings : [];
  const totalPosition = riskPositionTotal(record);
  const marketScoreValue = Number(record.market_risk_score ?? market.score);
  const marketScore = Number.isFinite(marketScoreValue) ? marketScoreValue : null;
  const gapMeta = riskPositionGapMeta(totalPosition, marketScore);
  const gapText = gapMeta.gap == null ? "—" : `${gapMeta.gap >= 0 ? "+" : ""}${num(gapMeta.gap, 1)}`;
  const history = state.riskPositionHistory || [];
  const viewedDate = record.snapshot_date || current.snapshot_date;
  const existingCodes = new Set(holdings.map((item) => String(item.stock_code || "")));
  const searchResults = state.riskStockSearchResults || [];
  const historyOptions = history
    .filter((item) => item.snapshot_date !== current.snapshot_date)
    .map((item) => `<option value="${escapeHtml(item.snapshot_date)}" ${item.snapshot_date === viewedDate ? "selected" : ""}>${escapeHtml(item.snapshot_date)} · 风控 ${Number.isFinite(Number(item.market_risk_score)) ? num(item.market_risk_score, 1) : "—"} / 仓位 ${num(item.total_position_pct, 1)}%</option>`)
    .join("");
  const historyButtons = history.slice(0, 14).map((item) => `
    <button type="button" class="${item.snapshot_date === viewedDate ? "active" : ""}" data-risk-history-date="${escapeHtml(item.snapshot_date)}">
      <span>${escapeHtml(item.snapshot_date.slice(5))}</span>
      <strong>${Number.isFinite(Number(item.market_risk_score)) ? num(item.market_risk_score, 1) : "—"} / ${num(item.total_position_pct, 1)}%</strong>
    </button>`).join("");
  const holdingRows = holdings.map((item) => `
    <div class="risk-position-row" data-risk-position-row="${escapeHtml(item.stock_code)}">
      <div><strong>${escapeHtml(item.stock_name || item.stock_code)}</strong><span>${escapeHtml(item.stock_code)}</span></div>
      <label><span>个股仓位</span><input type="number" min="0.01" max="100" step="0.1" value="${escapeHtml(num(item.position_pct, 2))}" data-risk-position-input="${escapeHtml(item.stock_code)}" ${isHistory ? "disabled" : ""}><em>%</em></label>
      ${isHistory ? "" : `<button type="button" data-risk-position-remove="${escapeHtml(item.stock_code)}">移除</button>`}
    </div>`).join("");
  const resultRows = searchResults.map((item) => `
    <button type="button" data-risk-position-add="${escapeHtml(item.stock_code)}" data-stock-name="${escapeHtml(item.stock_name || item.stock_code)}" ${existingCodes.has(item.stock_code) ? "disabled" : ""}>
      <span><strong>${escapeHtml(item.stock_name || item.stock_code)}</strong><small>${escapeHtml(item.stock_code)}${Number.isFinite(Number(item.latest_price)) ? ` · ${num(item.latest_price, 2)} 元` : ""}</small></span>
      <b>${existingCodes.has(item.stock_code) ? "已加入" : "加入持仓"}</b>
    </button>`).join("");
  return `
    <section class="risk-page-panel risk-position-journal">
      <div class="risk-position-head">
        <div><span class="risk-position-kicker">每日留痕</span><h3>大盘风控分 × 主理人仓位</h3><p>两项都按 0–100 展示，偏差用于发现仓位与市场环境的异动，不自动生成交易指令。</p></div>
        <label class="risk-position-history-select"><span>查看历史记录</span><select data-risk-position-history-select><option value="">今日 ${escapeHtml(current.snapshot_date)}</option>${historyOptions}</select></label>
      </div>

      <div class="risk-position-main-grid">
        <article class="risk-position-compare-card">
          <div class="risk-position-date-line"><span>${escapeHtml(viewedDate)}</span><b>${isHistory ? "历史快照" : "今日记录"}</b></div>
          <div class="risk-position-score-pair">
            <div><span>大盘风控分</span><strong>${marketScore == null ? "—" : num(marketScore, 1)}</strong><i><b style="width:${marketScore == null ? 0 : Math.max(0, Math.min(100, marketScore))}%"></b></i></div>
            <div><span>主理人总仓位</span><strong data-risk-total-position>${num(totalPosition, 1)}%</strong><i><b data-risk-position-bar style="width:${Math.max(0, Math.min(100, totalPosition))}%"></b></i></div>
          </div>
          <div class="risk-position-gap ${gapMeta.className}" data-risk-position-gap><span>仓位－风控分偏差</span><strong data-risk-position-gap-value>${gapText}</strong><p data-risk-position-gap-label>${escapeHtml(gapMeta.label)}</p></div>
          <div class="risk-position-legend"><span>风控分越高代表市场安全度越高</span><span>总仓位为下方个股仓位之和</span></div>
        </article>

        <article class="risk-position-note-card">
          <div><span class="risk-position-kicker">主理人解释</span><strong>${isHistory ? "当日异动说明" : "记录仓位偏差和调整原因"}</strong></div>
          <textarea id="riskPositionManagerNote" maxlength="4000" placeholder="例如：大盘风控分下降，但核心持仓现金流与趋势未破，因此暂不一次性降仓；若收盘继续跌破关键均线，明日分批处理。" ${isHistory ? "readonly" : ""}>${escapeHtml(record.manager_note || "")}</textarea>
          <div class="risk-position-note-actions"><span id="riskPositionStatus" aria-live="polite">${escapeHtml(isHistory ? `保存于 ${String(record.updated_at || "").replace("T", " ").slice(0, 16) || viewedDate}` : state.riskPositionStatus || (state.riskPositionDirty ? "有未保存修改" : "修改后请保存当日记录"))}</span>${isHistory ? `<button type="button" data-risk-history-date="">返回今日</button>` : `<button type="button" data-save-risk-position>保存当日记录</button>`}</div>
        </article>
      </div>

      <div class="risk-position-holdings-card">
        <div class="risk-position-holdings-head">
          <div><strong>主理人自选持仓</strong><span>这里是全程序的当前持仓主来源；保存后，综合判断、交易与持仓、风控 K 线等页面同步更新。</span></div>
          <div class="risk-position-holdings-summary"><span>股票数</span><strong>${holdings.length}</strong><span>总仓位</span><strong data-risk-total-position-secondary>${num(totalPosition, 1)}%</strong></div>
        </div>
        <div class="risk-position-holdings-actions">
          <label><span>持仓历史</span><select data-risk-position-history-select><option value="">今日 ${escapeHtml(current.snapshot_date)}</option>${historyOptions}</select></label>
          ${isHistory ? `<button type="button" data-risk-history-date="">返回今日持仓</button>` : `<button type="button" data-save-risk-position>保存持仓并同步全程序</button>`}
        </div>
        ${isHistory ? "" : `<form class="risk-position-search" id="riskPositionStockSearchForm"><input id="riskPositionStockSearchInput" type="search" inputmode="numeric" maxlength="12" placeholder="输入股票代码，如 600519" aria-label="搜索股票代码"><button type="submit" ${state.riskStockSearchLoading ? "disabled" : ""}>${state.riskStockSearchLoading ? "搜索中" : "搜索"}</button></form>`}
        ${!isHistory && (resultRows || state.riskPositionStatus) ? `<div class="risk-position-search-results">${resultRows || `<p>${escapeHtml(state.riskPositionStatus)}</p>`}</div>` : ""}
        <div class="risk-position-list">${holdingRows || `<div class="risk-position-empty"><strong>${isHistory ? "当日没有登记股票持仓" : "尚未加入自选持仓"}</strong><span>${isHistory ? "该日总仓位为 0%。" : "通过上方股票代码搜索加入，系统会自动汇总总仓位。"}</span></div>`}</div>
      </div>

      ${historyButtons ? `<div class="risk-position-history-strip" data-risk-scroll-key="position-history"><span>近期记录</span><div>${historyButtons}</div></div>` : ""}
    </section>`;
}

async function loadRiskPositionHistory(dateValue) {
  const date = String(dateValue || "");
  state.riskPositionHistoryDate = date;
  if (!date || date === state.riskPositionJournal?.snapshot_date) {
    state.riskPositionHistoryRecord = null;
    state.riskPositionHistoryDate = "";
    state.riskPositionStatus = "";
    renderRiskDashboard();
    return;
  }
  state.riskPositionStatus = "正在读取历史记录...";
  if (!isLocalServiceHost()) {
    state.riskPositionHistoryRecord = (state.riskPositionHistory || []).find((item) => item.snapshot_date === date) || null;
    state.riskPositionStatus = state.riskPositionHistoryRecord ? "" : "没有找到这一天的记录";
    renderRiskDashboard();
    return;
  }
  try {
    const params = new URLSearchParams({
      portfolio_id: state.currentPortfolioId || "__default__",
      date,
    });
    const response = await fetch(`/api/v1/risk/position-journal?${params}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || result.ok === false) throw new Error(result.error || `HTTP ${response.status}`);
    state.riskPositionHistoryRecord = result.record || null;
    state.riskPositionHistory = result.history || state.riskPositionHistory;
    state.riskPositionStatus = result.record ? "" : "没有找到这一天的记录";
  } catch (error) {
    state.riskPositionHistoryRecord = null;
    state.riskPositionStatus = `读取失败：${error.message || error}`;
  }
  renderRiskDashboard();
}

async function searchRiskPositionStocks(query) {
  const keyword = String(query || "").trim();
  if (keyword.replace(/\D/g, "").length < 2) {
    state.riskPositionStatus = "请输入至少 2 位股票代码";
    state.riskStockSearchResults = [];
    renderRiskDashboard();
    return;
  }
  state.riskStockSearchLoading = true;
  state.riskPositionStatus = "正在搜索股票代码...";
  renderRiskDashboard();
  try {
    let result;
    if (isLocalServiceHost()) {
      const response = await fetch(`/api/v1/risk/stock-search?query=${encodeURIComponent(keyword)}`, { cache: "no-store" });
      result = await readJsonResponse(response, "股票代码搜索");
    } else {
      const response = await fetch(`${STATIC_RISK_ROOT}/stock_catalog.json`, { cache: "no-store" });
      const catalog = await readJsonResponse(response, "股票代码目录");
      const digits = keyword.replace(/\D/g, "").slice(0, 6);
      const rows = (catalog.stocks || []).filter((item) => String(item.stock_code || "").startsWith(digits)).slice(0, 12);
      if (digits.length === 6 && !rows.some((item) => item.stock_code === digits)) {
        rows.push({ stock_code: digits, stock_name: digits, latest_price: null, source: "代码待下次静态同步确认" });
      }
      result = { ok: true, results: rows };
    }
    state.riskStockSearchResults = result.results || [];
    state.riskPositionStatus = state.riskStockSearchResults.length ? "" : (result.message || "没有找到匹配股票");
  } catch (error) {
    state.riskStockSearchResults = [];
    state.riskPositionStatus = `搜索失败：${error.message || error}`;
  } finally {
    state.riskStockSearchLoading = false;
    renderRiskDashboard();
  }
}

function syncRiskJournalToBrowserPortfolio(record) {
  const portfolio = getCurrentPortfolio();
  if (!portfolio || !record) return;
  const dataset = portfolio.dataset || (portfolio.dataset = {});
  const existing = new Map((dataset.open_positions || []).map((item) => [String(item.code || item.instrument_key || ""), item]));
  const snapshotDate = record.snapshot_date || new Date().toISOString().slice(0, 10);
  const openPositions = (record.holdings || []).map((holding) => {
    const code = String(holding.stock_code || "");
    return {
      ...(existing.get(code) || {}),
      code,
      instrument_key: code,
      stock: holding.stock_name || existing.get(code)?.stock || code,
      date: snapshotDate,
      manager_position_pct: Number(holding.position_pct),
      position_pct: Number(holding.position_pct),
      weight: Number(holding.position_pct),
      source: "云端浏览器持仓记录",
    };
  });
  dataset.open_positions = openPositions;
  dataset.latest_snapshot_date = snapshotDate;
  const snapshots = Array.isArray(dataset.daily_snapshots) ? dataset.daily_snapshots : [];
  const nextSnapshot = {
    date: snapshotDate,
    snapshot_date: snapshotDate,
    snapshot_time: new Date().toISOString(),
    source: "云端浏览器持仓记录",
    open_positions: openPositions,
  };
  const index = snapshots.findIndex((item) => (item.snapshot_date || item.date) === snapshotDate);
  if (index >= 0) snapshots[index] = nextSnapshot;
  else snapshots.unshift(nextSnapshot);
  dataset.daily_snapshots = snapshots;
  portfolio.analysis = computeAnalysis(dataset);
  portfolio.meta = buildDatasetMeta(dataset, portfolio.name);
}

function saveRiskPositionInBrowser(current, marketScore) {
  const timestamp = new Date().toISOString();
  const record = {
    ...JSON.parse(JSON.stringify(current)),
    market_risk_score: Number.isFinite(marketScore) ? marketScore : null,
    total_position_pct: riskPositionTotal(current),
    source: "browser_static_edit",
    updated_at: timestamp,
    created_at: current.created_at || timestamp,
  };
  state.riskPositionJournal = record;
  const history = [...(state.riskPositionHistory || [])];
  const index = history.findIndex((item) => item.snapshot_date === record.snapshot_date);
  if (index >= 0) history[index] = record;
  else history.unshift(record);
  state.riskPositionHistory = history.sort((a, b) => String(b.snapshot_date || "").localeCompare(String(a.snapshot_date || "")));
  state.riskPositionDirty = false;
  state.riskPositionStatus = `已保存到当前浏览器 ${timestamp.replace("T", " ").slice(0, 16)}`;
  syncRiskJournalToBrowserPortfolio(record);
  persistState();
  renderAll();
  return { ok: true, record, history: state.riskPositionHistory, storage: "browser" };
}

function updateRiskPositionLiveSummary(container, marketScore) {
  const total = riskPositionTotal(state.riskPositionJournal);
  state.riskPositionJournal.total_position_pct = total;
  const meta = riskPositionGapMeta(total, marketScore);
  const gapText = meta.gap == null ? "—" : `${meta.gap >= 0 ? "+" : ""}${num(meta.gap, 1)}`;
  container.querySelectorAll("[data-risk-total-position]").forEach((element) => { element.textContent = `${num(total, 1)}%`; });
  container.querySelectorAll("[data-risk-total-position-secondary]").forEach((element) => { element.textContent = `${num(total, 1)}%`; });
  const bar = container.querySelector("[data-risk-position-bar]");
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, total))}%`;
  const gap = container.querySelector("[data-risk-position-gap]");
  if (gap) gap.className = `risk-position-gap ${meta.className}`;
  const value = container.querySelector("[data-risk-position-gap-value]");
  if (value) value.textContent = gapText;
  const label = container.querySelector("[data-risk-position-gap-label]");
  if (label) label.textContent = meta.label;
  const status = container.querySelector("#riskPositionStatus");
  if (status) status.textContent = total > 100 ? `总仓位 ${num(total, 2)}%，超过 100%，请调整` : "有未保存修改";
}

function bindRiskPositionActions(container, payload) {
  const current = state.riskPositionJournal;
  if (!current) return;
  const marketScore = Number(current.market_risk_score ?? payload?.risk_v2?.market?.score);
  container.querySelectorAll("[data-risk-position-history-select]").forEach((select) => select.addEventListener("change", (event) => {
    loadRiskPositionHistory(event.currentTarget.value);
  }));
  container.querySelectorAll("[data-risk-history-date]").forEach((button) => button.addEventListener("click", () => {
    loadRiskPositionHistory(button.dataset.riskHistoryDate || "");
  }));
  container.querySelector("#riskPositionStockSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchRiskPositionStocks(container.querySelector("#riskPositionStockSearchInput")?.value || "");
  });
  container.querySelectorAll("[data-risk-position-add]").forEach((button) => button.addEventListener("click", () => {
    const code = button.dataset.riskPositionAdd || "";
    if (!code || (current.holdings || []).some((item) => item.stock_code === code)) return;
    current.holdings = [...(current.holdings || []), {
      stock_code: code,
      stock_name: button.dataset.stockName || code,
      position_pct: 1,
      sequence_no: (current.holdings || []).length,
    }];
    state.riskPositionDirty = true;
    state.riskPositionStatus = "已加入，默认仓位 1%，请调整后保存";
    state.riskStockSearchResults = [];
    renderRiskDashboard();
  }));
  container.querySelectorAll("[data-risk-position-remove]").forEach((button) => button.addEventListener("click", () => {
    const code = button.dataset.riskPositionRemove || "";
    current.holdings = (current.holdings || []).filter((item) => item.stock_code !== code);
    state.riskPositionDirty = true;
    state.riskPositionStatus = `已移除 ${code}，尚未保存`;
    renderRiskDashboard();
  }));
  container.querySelectorAll("[data-risk-position-input]").forEach((input) => input.addEventListener("input", () => {
    const holding = (current.holdings || []).find((item) => item.stock_code === input.dataset.riskPositionInput);
    if (!holding) return;
    const value = Number(input.value);
    holding.position_pct = Number.isFinite(value) ? value : 0;
    state.riskPositionDirty = true;
    state.riskPositionStatus = "有未保存修改";
    updateRiskPositionLiveSummary(container, marketScore);
  }));
  container.querySelector("#riskPositionManagerNote")?.addEventListener("input", (event) => {
    current.manager_note = event.currentTarget.value;
    state.riskPositionDirty = true;
    state.riskPositionStatus = "有未保存修改";
    const status = container.querySelector("#riskPositionStatus");
    if (status) status.textContent = state.riskPositionStatus;
  });
  container.querySelectorAll("[data-save-risk-position]").forEach((saveButton) => saveButton.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const total = riskPositionTotal(current);
    const invalid = (current.holdings || []).find((item) => !Number.isFinite(Number(item.position_pct)) || Number(item.position_pct) <= 0 || Number(item.position_pct) > 100);
    if (invalid || total > 100.0001) {
      state.riskPositionStatus = invalid ? `${invalid.stock_name || invalid.stock_code} 的仓位必须大于 0 且不超过 100%` : `总仓位 ${num(total, 2)}%，不能超过 100%`;
      const status = container.querySelector("#riskPositionStatus");
      if (status) status.textContent = state.riskPositionStatus;
      return;
    }
    button.disabled = true;
    const status = container.querySelector("#riskPositionStatus");
    if (status) status.textContent = "正在保存当日记录...";
    try {
      const result = isLocalServiceHost()
        ? await postJson("/api/v1/risk/position-journal", {
            portfolio_id: state.currentPortfolioId || current.portfolio_id || "__default__",
            snapshot_date: current.snapshot_date,
            market_risk_score: Number.isFinite(marketScore) ? marketScore : null,
            manager_note: current.manager_note || "",
            holdings: (current.holdings || []).map((item) => ({
              stock_code: item.stock_code,
              stock_name: item.stock_name,
              position_pct: Number(item.position_pct),
            })),
          })
        : saveRiskPositionInBrowser(current, marketScore);
      if (result.storage === "browser") return;
      state.riskPositionJournal = result.record;
      state.riskPositionHistory = result.history || [];
      state.riskPositionDirty = false;
      state.riskPositionStatus = result.holdings_synced
        ? `已保存并同步全程序 ${String(result.record?.updated_at || "").replace("T", " ").slice(0, 16)}`
        : `已保存 ${String(result.record?.updated_at || "").replace("T", " ").slice(0, 16)}`;
      const currentPortfolio = getCurrentPortfolio();
      if (result.portfolio?.dataset && currentPortfolio?.id === result.portfolio.id) {
        currentPortfolio.dataset = result.portfolio.dataset;
        currentPortfolio.analysis = computeAnalysis(currentPortfolio.dataset);
        currentPortfolio.meta = buildDatasetMeta(currentPortfolio.dataset, currentPortfolio.name);
        state.holdingQuotes = null;
        state.logicValidationResult = null;
        state.riskDashboard = null;
        state.riskDashboardPortfolioId = "";
        state.riskDashboardHoldingKey = "";
        persistState();
        renderAll();
        queueHoldingMarketRefresh("risk_position_journal");
      } else {
        renderRiskDashboard();
      }
    } catch (error) {
      state.riskPositionStatus = `保存失败：${error.message || error}`;
      if (status) status.textContent = state.riskPositionStatus;
      button.disabled = false;
    }
  }));
}

function bindRiskV2Actions(container, payload) {
  bindRiskPositionActions(container, payload);
  container.querySelector("#refreshRiskDashboardBtn")?.addEventListener("click", async () => {
    if (state.riskDashboardLoading || state.riskWorkspaceLoading) return;
    state.riskSectorDetail = null;
    state.riskAnnotationCache = {};
    state.riskAnnotationDrafts = {};
    await Promise.all([loadRiskDashboard(true), loadRiskWorkspace(true)]);
  });
  container.querySelectorAll("[data-risk-index-code]").forEach((button) => button.addEventListener("click", () => {
    state.selectedRiskIndexCode = button.dataset.riskIndexCode || "1.000001";
    state.riskDrawingKey = "";
    state.riskDrawingStart = null;
    renderRiskDashboard();
  }));
  container.querySelectorAll("[data-risk-sector-code]").forEach((button) => button.addEventListener("click", () => {
    const code = button.dataset.riskSectorCode || "";
    if (!code || code === state.selectedRiskIndustryCode) return;
    state.selectedRiskIndustryCode = code;
    state.riskSectorDetail = null;
    state.riskDrawingKey = "";
    state.riskDrawingStart = null;
    renderRiskDashboard();
  }));
  container.querySelector("[data-risk-sector-retry]")?.addEventListener("click", () => {
    state.riskSectorDetailError = "";
    loadRiskSectorDetail(state.selectedRiskIndustryCode, true);
  });
  const scoreModal = container.querySelector("#riskScoreAuditModal");
  const closeScoreModal = () => {
    if (scoreModal) scoreModal.hidden = true;
  };
  const openScoreModal = (trigger) => {
    const entity = findRiskScoreEntity(payload, trigger.dataset.riskScoreLevel, trigger.dataset.riskScoreId);
    const title = container.querySelector("#riskScoreAuditTitle");
    const body = container.querySelector("#riskScoreAuditBody");
    if (title) title.textContent = `${entity?.name || entity?.industry_name || trigger.dataset.riskScoreId || "评分"} · 评分标准`;
    if (body) body.innerHTML = renderRiskScoreAudit(entity, trigger.dataset.riskScoreLevel, payload.risk_v2 || {});
    if (scoreModal) {
      scoreModal.hidden = false;
      scoreModal.querySelector("[data-risk-score-close]")?.focus();
    }
  };
  container.querySelectorAll("[data-risk-score-level]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openScoreModal(trigger);
    });
    trigger.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      openScoreModal(trigger);
    });
  });
  container.querySelector("[data-risk-score-close]")?.addEventListener("click", closeScoreModal);
  scoreModal?.addEventListener("click", (event) => {
    if (event.target === scoreModal) closeScoreModal();
  });
  scoreModal?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeScoreModal();
  });
  container.querySelector("#riskInstrumentReviewForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const status = form.querySelector("#riskInstrumentReviewStatus");
    const formData = new FormData(form);
    submit.disabled = true;
    if (status) status.textContent = "正在保存...";
    try {
      const localReview = {
        portfolio_id: state.currentPortfolioId || "__default__",
        margin_view: formData.get("margin_view") || "",
        options_view: formData.get("options_view") || "",
        note: formData.get("note") || "",
        updated_at: new Date().toISOString(),
      };
      const result = isLocalServiceHost()
        ? await postJson("/api/v1/risk/instrument-review", localReview)
        : { ok: true, review: localReview, storage: "browser" };
      if (state.riskWorkspace) state.riskWorkspace.instrument_review = result.review || {};
      if (result.storage === "browser") persistState();
      if (status) status.textContent = `已保存 ${String(result.review?.updated_at || "").replace("T", " ").slice(0, 16)}`;
    } catch (error) {
      if (status) status.textContent = `保存失败：${error.message || error}`;
    } finally {
      submit.disabled = false;
    }
  });
  container.querySelectorAll("[data-risk-annotation-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.riskAnnotationAction;
    const scope = button.dataset.scope;
    const code = button.dataset.code;
    const key = riskChartKey(scope, code);
    const draft = state.riskAnnotationDrafts[key] || (state.riskAnnotationDrafts[key] = []);
    if (action === "draw") {
      state.riskDrawingKey = state.riskDrawingKey === key ? "" : key;
      state.riskDrawingStart = null;
      renderRiskDashboard();
    } else if (action === "pressure") {
      const value = Number(container.querySelector(`#riskPressure-${scope}`)?.value);
      if (Number.isFinite(value) && value > 0) {
        draft.push({ type: "pressure", price: value, label: "压力位" });
        renderRiskDashboard();
      }
    } else if (action === "undo") {
      draft.pop();
      renderRiskDashboard();
    } else if (action === "clear") {
      state.riskAnnotationDrafts[key] = [];
      renderRiskDashboard();
    } else if (action === "save") {
      const status = container.querySelector(`#riskAnnotationStatus-${scope}`);
      button.disabled = true;
      if (status) status.textContent = "正在保存...";
      try {
        await saveRiskAnnotations(scope, code);
        if (status) status.textContent = "已保存";
      } catch (error) {
        if (status) status.textContent = `保存失败：${error.message || error}`;
      } finally {
        button.disabled = false;
      }
    }
  }));
  container.querySelectorAll("[data-holding-review]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const reviewPayload = {
        portfolio_id: state.currentPortfolioId || "",
        stock_code: button.dataset.code,
        stock_name: button.dataset.name,
        decision: button.dataset.holdingReview,
        updated_at: new Date().toISOString(),
      };
      let result;
      if (isLocalServiceHost()) {
        result = await postJson("/api/v1/risk/holding-review", reviewPayload);
      } else {
        const reviews = [...(state.riskWorkspace?.holding_reviews || [])].filter((item) => item.stock_code !== reviewPayload.stock_code);
        if (reviewPayload.decision !== "clear") reviews.push(reviewPayload);
        result = { ok: true, reviews, storage: "browser" };
      }
      if (state.riskWorkspace) state.riskWorkspace.holding_reviews = result.reviews || [];
      if (result.storage === "browser") persistState();
      renderRiskDashboard();
    } catch (error) {
      button.disabled = false;
      button.title = error.message || String(error);
    }
  }));
  if (state.activeTab === "risk") renderRiskCharts(payload);
}

function renderRiskV2Dashboard(container, payload) {
  const v2 = payload.risk_v2 || {};
  const market = v2.market || {};
  const breadth = market.breadth_summary || {};
  const workspace = state.riskWorkspacePortfolioId === (state.currentPortfolioId || "") ? state.riskWorkspace : null;
  const indices = workspace?.indices || [];
  const selectedIndex = indices.find((item) => item.code === state.selectedRiskIndexCode && (item.dates || []).length)
    || indices.find((item) => (item.dates || []).length)
    || indices[0]
    || {};
  if (selectedIndex.code && selectedIndex.code !== state.selectedRiskIndexCode) state.selectedRiskIndexCode = selectedIndex.code;
  const sectors = workspace?.sectors || [];
  const sectorScores = new Map((v2.sectors || []).map((item) => [String(item.industry_code || item.entity_id || ""), item.score]));
  const selectedSector = sectors.find((item) => item.industry_code === state.selectedRiskIndustryCode) || sectors.find((item) => item.available) || {};
  if (selectedSector.industry_code && selectedSector.industry_code !== state.selectedRiskIndustryCode) state.selectedRiskIndustryCode = selectedSector.industry_code;
  const sectorDetail = state.riskSectorDetail?.sector?.industry_code === state.selectedRiskIndustryCode ? state.riskSectorDetail : null;
  const loading = state.riskDashboardLoading || state.riskWorkspaceLoading;
  const isStaticSnapshot = Boolean(payload.__static_snapshot || workspace?.__static_snapshot);
  const volume = (selectedIndex.amounts || []).at(-1);
  const futuresBasis = market.futures_basis || {};
  const updatedAt = String(workspace?.updated_at || v2.calculation_time || "").replace("T", " ").slice(0, 19) || "暂无时间";
  const marketRatioTotal = Number(breadth.advancers || 0) + Number(breadth.decliners || 0);
  const upRatio = marketRatioTotal ? Number(breadth.advancers || 0) / marketRatioTotal * 100 : null;

  container.innerHTML = `
    <div class="risk-page-shell risk-workspace-shell">
      <header class="risk-page-header">
        <div><h2>风控体系</h2><p>指数与行业技术观察、弱势持仓处理、重大事件分流。</p></div>
        <div class="risk-page-header-actions"><div><span>${escapeHtml(updatedAt)}</span><strong id="riskRefreshStatus" class="risk-page-data-status ${loading ? "refreshing" : state.riskWorkspaceError ? "error" : "ready"}">${loading ? "数据刷新中" : state.riskWorkspaceError ? escapeHtml(state.riskWorkspaceError) : isStaticSnapshot ? "当天静态风控快照" : "真实行情已更新"}</strong></div><button id="refreshRiskDashboardBtn" type="button" ${loading ? "disabled" : ""}>${loading ? "正在刷新" : isStaticSnapshot ? "重新读取快照" : "刷新数据"}</button></div>
      </header>

      ${renderRiskPositionJournal(payload, market)}

      <section class="risk-page-panel risk-workspace-market">
        <div class="risk-page-section-head"><div><h3>盘面指数</h3><p>选择指数查看日K，主理人画线和压力位保存后会随组合保留。</p></div><span>${escapeHtml(workspace?.source || "行情工作台加载中")}</span></div>
        ${workspace ? `<div class="risk-market-layout">
          <nav class="risk-index-nav" aria-label="盘面指数">${indices.map((item) => `<button type="button" class="${item.code === state.selectedRiskIndexCode ? "active" : ""}" data-risk-index-code="${escapeHtml(item.code)}"><strong>${escapeHtml(item.name)}</strong><span class="${Number(item.latest_pct) >= 0 ? "up" : "down"}">${Number(item.latest_pct) >= 0 ? "+" : ""}${Number.isFinite(Number(item.latest_pct)) ? num(item.latest_pct, 2) + "%" : "—"}</span><small>${Number.isFinite(Number(item.latest_close)) ? num(item.latest_close, 2) : "暂无"}</small></button>`).join("")}</nav>
          <div class="risk-chart-stage">${renderRiskAnnotationToolbar("index", state.selectedRiskIndexCode)}<div id="riskIndexChart" class="risk-workspace-kline"></div></div>
          <aside class="risk-market-mini"><div class="score"><span>大盘风控分 ${riskScoreAuditTrigger("market", "market")}</span><strong>${Number.isFinite(Number(market.score)) ? num(market.score, 1) : "—"}</strong><small>较前值 ${Number.isFinite(Number(market.score_change)) ? `${Number(market.score_change) >= 0 ? "+" : ""}${num(market.score_change, 1)}` : "—"}</small><small class="risk-basis-mini">${Number.isFinite(Number(futuresBasis.basis_pct)) ? `${Number(futuresBasis.basis_points) >= 0 ? "升水" : "贴水"} ${Math.abs(Number(futuresBasis.basis_points)).toFixed(2)}点 / ${Number(futuresBasis.basis_pct) >= 0 ? "+" : ""}${num(futuresBasis.basis_pct, 2)}%` : "升贴水暂缺"}<em>${escapeHtml(futuresBasis.attitude || "暂无期货态度")}</em></small></div><div><span>成交额</span><strong>${Number.isFinite(Number(volume)) ? `${num(Number(volume) / 100000000, 0)} 亿` : "—"}</strong></div><div><span>上涨 / 下跌</span><strong>${breadth.advancers ?? "—"} / ${breadth.decliners ?? "—"}</strong><i><b style="width:${Number.isFinite(upRatio) ? upRatio : 50}%"></b></i></div><div><span>全市场涨跌中位数</span><strong>${Number.isFinite(Number(breadth.median_pct_change)) ? `${Number(breadth.median_pct_change) >= 0 ? "+" : ""}${num(breadth.median_pct_change, 2)}%` : "—"}</strong></div></aside>
        </div>` : `<div class="risk-workspace-empty">${state.riskWorkspaceError ? escapeHtml(state.riskWorkspaceError) : "正在加载指数与行业技术数据..."}</div>`}
      </section>

      <section class="risk-page-panel risk-workspace-sector">
        <div class="risk-page-section-head"><div><h3>申万二级行业</h3><p>按当前连续站上 MA5 的交易日数排序；选择行业后再扫描其强势成分股。</p></div><span>${sectors.length ? `${sectors.filter((item) => item.available).length} / ${sectors.length} 个行业有行情` : "等待行业行情"}</span></div>
        <div class="risk-sector-layout">
          <div class="risk-sector-ranking" data-risk-scroll-key="sector-ranking">${sectors.length ? sectors.map((item, index) => `<button type="button" class="${item.industry_code === state.selectedRiskIndustryCode ? "active" : ""} ${item.available ? "" : "unavailable"} ${isRiskRsiOverbought(item.rsi14) ? "rsi-overbought" : ""}" data-risk-sector-code="${escapeHtml(item.industry_code)}"><span>${index + 1}</span><div><strong>${escapeHtml(item.industry_name)}</strong><small>${escapeHtml(item.industry_code)}</small>${renderRiskRsiAlert(item.rsi14, true)}</div><div class="risk-sector-values"><b>${item.above_ma5_days == null ? "—" : `${item.above_ma5_days}天`}</b><em>风控 ${Number.isFinite(Number(sectorScores.get(item.industry_code))) ? num(sectorScores.get(item.industry_code), 1) : "—"} ${riskScoreAuditTrigger("sector", item.industry_code)}</em></div></button>`).join("") : `<div class="risk-workspace-empty">行业排序计算中...</div>`}</div>
          <div class="risk-chart-stage">${selectedSector.market_board_code ? renderRiskAnnotationToolbar("sector", selectedSector.market_board_code) : ""}<div class="risk-sector-chart-head"><strong>${escapeHtml(selectedSector.industry_name || "选择行业")}${renderRiskRsiAlert(selectedSector.rsi14, true)}</strong><span>${selectedSector.above_ma5_days == null ? "暂无MA5排序" : `连续站上MA5 ${selectedSector.above_ma5_days}天`} · 风控分 ${Number.isFinite(Number(sectorScores.get(selectedSector.industry_code))) ? num(sectorScores.get(selectedSector.industry_code), 1) : "—"} ${riskScoreAuditTrigger("sector", selectedSector.industry_code)}</span></div><div id="riskSectorChart" class="risk-workspace-kline"></div>${state.riskSectorDetailLoading ? `<div class="risk-chart-loading">行业K线加载中...</div>` : ""}</div>
          <aside class="risk-sector-stocks"><header><div><h4>强势个股</h4><span>近期曾涨停或单日涨幅 ≥ 5%</span></div><b>${sectorDetail?.strong_stocks?.length ?? "—"}</b></header>${renderRiskSectorStrongStocks(sectorDetail)}<footer>已扫描 ${sectorDetail?.scanned_count ?? 0} / ${sectorDetail?.constituent_count ?? 0} 只成分股</footer></aside>
        </div>
      </section>

      <section class="risk-page-panel">
        <div class="risk-page-section-head"><div><h3>持仓评分与修改提醒</h3><p>全部个股及所属行业评分保留展示；下方仅提醒亏损或收益弱于组合中位水平的持仓。</p></div><span>${escapeHtml(v2.portfolio_name || "当前组合")}</span></div>
        ${renderRiskHoldingScoreStrip(payload)}
        ${renderRiskInstrumentReview()}
        ${renderRiskHoldingReview(payload)}
      </section>

      <section class="risk-page-panel">
        <div class="risk-page-section-head"><div><h3>重大事件</h3><p>保留原事件监控结果，仅按对市场和组合的利空、利好方向分流。</p></div><span>${(v2.top_events || []).length} 条重点事件</span></div>
        ${renderRiskEventBrief(v2.top_events || [])}
      </section>
      <div class="risk-score-audit-modal" id="riskScoreAuditModal" role="dialog" aria-modal="true" aria-labelledby="riskScoreAuditTitle" hidden>
        <div class="risk-score-audit-window"><header><div><span>客观评分审计</span><h3 id="riskScoreAuditTitle">评分依据</h3></div><button type="button" data-risk-score-close aria-label="关闭评分依据">×</button></header><div id="riskScoreAuditBody"></div></div>
      </div>
    </div>`;

  bindRiskV2Actions(container, payload);
  if (!workspace && !state.riskWorkspaceLoading) setTimeout(() => loadRiskWorkspace(), 0);
  if (workspace && state.selectedRiskIndustryCode && !sectorDetail && !state.riskSectorDetailLoading && !state.riskSectorDetailError) setTimeout(() => loadRiskSectorDetail(state.selectedRiskIndustryCode), 0);
  if (selectedIndex.code) setTimeout(() => loadRiskAnnotations("index", selectedIndex.code), 0);
  if (selectedSector.market_board_code) setTimeout(() => loadRiskAnnotations("sector", selectedSector.market_board_code), 0);
}

function riskKlineOption(kline, annotations) {
  const lines = [];
  (annotations || []).forEach((item) => {
    if (item.type === "pressure") lines.push({ name: item.label || "压力位", yAxis: Number(item.price), lineStyle: { color: "#b42318", type: "dashed", width: 1.5 }, label: { formatter: `${item.label || "压力位"} ${num(item.price, 2)}`, color: "#b42318" } });
    if (item.type === "line") lines.push([{ coord: [item.start?.date, Number(item.start?.price)], lineStyle: { color: "#1d4ed8", width: 2 } }, { coord: [item.end?.date, Number(item.end?.price)] }]);
  });
  return {
    animation: false,
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["K线", "MA5", "MA20"], top: 4, right: 8, textStyle: { fontSize: 11 } },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    grid: [{ left: 52, right: 18, top: 38, height: "60%" }, { left: 52, right: 18, top: "75%", height: "13%" }],
    xAxis: [{ type: "category", data: kline.dates || [], boundaryGap: true, axisLabel: { color: "#64748b", fontSize: 10 }, axisLine: { lineStyle: { color: "#cbd5e1" } } }, { type: "category", gridIndex: 1, data: kline.dates || [], boundaryGap: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: "#cbd5e1" } } }],
    yAxis: [{ scale: true, axisLabel: { color: "#64748b", fontSize: 10 }, splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } } }, { gridIndex: 1, scale: true, axisLabel: { show: false }, splitLine: { show: false } }],
    dataZoom: [{ type: "inside", xAxisIndex: [0, 1], start: 55, end: 100 }, { type: "slider", xAxisIndex: [0, 1], start: 55, end: 100, bottom: 2, height: 18 }],
    series: [
      { name: "K线", type: "candlestick", data: kline.ohlc || [], itemStyle: { color: "#c62828", color0: "#168252", borderColor: "#c62828", borderColor0: "#168252" }, markLine: { symbol: ["none", "none"], silent: true, data: lines } },
      { name: "MA5", type: "line", data: kline.ma5 || [], showSymbol: false, smooth: false, lineStyle: { width: 1.4, color: "#d97706" } },
      { name: "MA20", type: "line", data: kline.ma20 || [], showSymbol: false, smooth: false, lineStyle: { width: 1.4, color: "#2563eb" } },
      { name: "成交量", type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: kline.volumes || [], itemStyle: { color: "#94a3b8" } },
    ],
  };
}

function bindRiskChartDrawing(chart, scope, code, kline, payload) {
  const zr = chart.getZr();
  if (chart.__riskDrawHandler) zr.off("click", chart.__riskDrawHandler);
  chart.__riskDrawHandler = (event) => {
    const key = riskChartKey(scope, code);
    if (state.riskDrawingKey !== key) return;
    const converted = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [event.offsetX, event.offsetY]);
    if (!Array.isArray(converted) || !Number.isFinite(Number(converted[1]))) return;
    const index = Math.max(0, Math.min((kline.dates || []).length - 1, Math.round(Number(converted[0]))));
    const point = { date: kline.dates[index], price: Number(converted[1]) };
    if (!point.date) return;
    if (!state.riskDrawingStart) {
      state.riskDrawingStart = point;
      const status = document.getElementById(`riskAnnotationStatus-${scope}`);
      if (status) status.textContent = `起点 ${point.date} / ${num(point.price, 2)}，请选择终点`;
      return;
    }
    const draft = state.riskAnnotationDrafts[key] || (state.riskAnnotationDrafts[key] = []);
    draft.push({ type: "line", start: state.riskDrawingStart, end: point });
    state.riskDrawingStart = null;
    state.riskDrawingKey = "";
    renderRiskDashboard();
  };
  zr.on("click", chart.__riskDrawHandler);
}

function renderRiskCharts(payload) {
  if (typeof echarts === "undefined" || !payload || !state.riskWorkspace) return;
  const indexKline = (state.riskWorkspace.indices || []).find((item) => item.code === state.selectedRiskIndexCode) || {};
  const sectorKline = state.riskSectorDetail?.sector?.industry_code === state.selectedRiskIndustryCode ? (state.riskSectorDetail.kline || {}) : {};
  [["riskIndexChart", "index", indexKline.code, indexKline], ["riskSectorChart", "sector", sectorKline.code, sectorKline]].forEach(([id, scope, code, kline]) => {
    const dom = document.getElementById(id);
    if (!dom || !code || !(kline.dates || []).length) return;
    const chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
    const key = riskChartKey(scope, code);
    chart.setOption(riskKlineOption(kline, state.riskAnnotationDrafts[key] || []), true);
    bindRiskChartDrawing(chart, scope, code, kline, payload);
  });
  if (!window.__riskWorkspaceResizeBound) {
    window.__riskWorkspaceResizeBound = true;
    window.addEventListener("resize", () => ["riskIndexChart", "riskSectorChart"].forEach((id) => {
      const dom = document.getElementById(id);
      const chart = dom && echarts.getInstanceByDom(dom);
      if (chart) chart.resize();
    }));
  }
}

function renderOverview(analysis) {
  const suggestionItems = normalizeListItems(analysis.suggestions);
  document.getElementById("view-overview").innerHTML = `
    <div class="overview-grid">
      <div class="metric-card up focus">
        <div class="metric-title">平仓胜率</div>
        <div class="metric-value">${pct(analysis.summary.win_rate)}</div>
        <div class="metric-note">${analysis.summary.trade_count} 笔闭环交易样本。</div>
      </div>
      <div class="metric-card blue focus">
        <div class="metric-title">平均单笔收益</div>
        <div class="metric-value">${pct(analysis.summary.avg_return)}</div>
        <div class="metric-note">中位数 ${pct(analysis.summary.median_return)}</div>
      </div>
      <div class="metric-card amber focus">
        <div class="metric-title">平均持股</div>
        <div class="metric-value">${num(analysis.summary.avg_hold)}天</div>
        <div class="metric-note">中位数 ${num(analysis.summary.median_hold)} 天</div>
      </div>
      <div class="metric-card ${analysis.summary.max_loss != null && analysis.summary.max_loss < 0 ? "down" : "blue"}">
        <div class="metric-title">未完成头寸</div>
        <div class="metric-value">${analysis.summary.open_count}</div>
        <div class="metric-note">${analysis.profile.holdingState}</div>
      </div>
    </div>

    <div class="panel-grid">
      <div class="panel-card">
        <h3>总评</h3>
        <div class="insight-callout">${analysis.judgement}</div>
        <div class="pill-line">
          ${analysis.styleTags.map((item) => `<span class="ghost-pill">${item}</span>`).join("")}
        </div>
      </div>
      <div class="panel-card">
        <h3>关键判断</h3>
        <div class="matrix">
          <div class="tile"><strong>逻辑一致性</strong><span>${num(analysis.consistencyScore, 0)} 分</span></div>
          <div class="tile"><strong>透明度</strong><span>${num(analysis.transparencyScore, 0)} 分</span></div>
          <div class="tile"><strong>交易风格</strong><span>${analysis.profile.tradingStyle}</span></div>
          <div class="tile"><strong>行业舒适区</strong><span>${analysis.profile.industryFocus !== "未识别" ? analysis.profile.industryFocus : "待补全"}</span></div>
        </div>
      </div>
    </div>

    <div class="bento-grid" style="margin-top: 16px;">
      <div class="panel-card bento-col-4">
        <h3>综合能力雷达图</h3>
        <div id="radarChart" style="width: 100%; height: 280px; margin-top: 12px;"></div>
      </div>
      <div class="panel-card bento-col-8">
        <h3>月度收益与胜率趋势</h3>
        <div id="monthlyChart" style="width: 100%; height: 280px; margin-top: 12px;"></div>
      </div>
    </div>

    <div class="kv-grid" style="margin-top: 16px;">
      ${renderFoldListCard("交易特征", analysis.tradingTraits, "kv-card", 3)}
      ${renderFoldListCard("持仓特征", analysis.holdingTraits, "kv-card", 3)}
    </div>

    <div class="split-panel">
      ${renderFoldListCard("优点", analysis.strengths, "list-card", 3)}
      ${renderFoldListCard("关注点", analysis.weaknesses, "list-card", 3)}
    </div>
    <div class="panel-card" style="margin-top:16px;">
      <h3>优化建议</h3>
      <ul class="bullet-list">${suggestionItems.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `;

  // 渲染图表
  if (typeof echarts !== "undefined") {
    // 雷达图
    const radarDom = document.getElementById("radarChart");
    if (radarDom) {
      const radarChart = echarts.init(radarDom);
      radarChart.setOption({
        tooltip: { trigger: 'item' },
        radar: {
          indicator: [
            { name: '胜率', max: 100 },
            { name: '盈亏比', max: 3 },
            { name: '单笔爆发', max: 30 },
            { name: '回撤控制', max: 100 },
            { name: '快切能力', max: 100 },
            { name: '行业聚焦', max: 100 }
          ],
          radius: '65%',
          center: ['50%', '50%'],
          splitNumber: 4,
          axisName: { color: '#64748b' }
        },
        series: [{
          type: 'radar',
          data: [{
            value: [
              Math.min(100, analysis.summary.win_rate ?? 0),
              Math.min(3, analysis.summary.profit_factor ?? 1),
              Math.min(30, analysis.summary.max_win ?? 0),
              Math.max(0, 100 + (analysis.summary.max_loss ?? -20)),
              Math.min(100, analysis.summary.within_5d_rate ?? 0),
              Math.min(100, analysis.summary.industry_focus_rate ?? 0)
            ],
            name: '综合能力',
            itemStyle: { color: '#2563eb' },
            areaStyle: { color: 'rgba(37, 99, 235, 0.2)' }
          }]
        }]
      });
    }

    // 月度趋势图
    const monthlyDom = document.getElementById("monthlyChart");
    if (monthlyDom && analysis.monthlyStats && analysis.monthlyStats.length > 0) {
      const monthlyChart = echarts.init(monthlyDom);
      const months = analysis.monthlyStats.map(item => item.month);
      const returns = analysis.monthlyStats.map(item => Number(item.avg_return?.toFixed(2) || 0));
      const winRates = analysis.monthlyStats.map(item => Number(item.win_rate?.toFixed(2) || 0));

      monthlyChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: { data: ['平均收益(%)', '胜率(%)'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
        xAxis: [
          { type: 'category', data: months, axisPointer: { type: 'shadow' }, axisLabel: { color: '#64748b' } }
        ],
        yAxis: [
          { type: 'value', name: '收益(%)', axisLabel: { formatter: '{value}' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
          { type: 'value', name: '胜率(%)', min: 0, max: 100, axisLabel: { formatter: '{value}' }, splitLine: { show: false } }
        ],
        series: [
          {
            name: '平均收益(%)',
            type: 'bar',
            itemStyle: {
              color: function(params) {
                return params.value >= 0 ? '#d92d20' : '#039855';
              },
              borderRadius: [4, 4, 0, 0]
            },
            data: returns
          },
          {
            name: '胜率(%)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            itemStyle: { color: '#2563eb' },
            lineStyle: { width: 3, shadowColor: 'rgba(37,99,235,0.3)', shadowBlur: 10 },
            data: winRates
          }
        ]
      });
    } else if (monthlyDom) {
      monthlyDom.innerHTML = '<div class="empty-state" style="height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b;">暂无月度数据</div>';
    }
    
    // 监听窗口大小变化以自动调整图表大小
    window.addEventListener('resize', () => {
      const radarChartInstance = echarts.getInstanceByDom(document.getElementById("radarChart"));
      if (radarChartInstance) radarChartInstance.resize();
      
      const monthlyChartInstance = echarts.getInstanceByDom(document.getElementById("monthlyChart"));
      if (monthlyChartInstance) monthlyChartInstance.resize();
    });
  }
  bindOverviewControls();
}

function renderCompare() {
  const portfolios = getComparePortfolios();
  const container = document.getElementById("view-compare");
  if (portfolios.length < 2) {
    container.innerHTML = `<div class="empty-state">请在左侧勾选至少 2 个组合，再进入对比。</div>`;
    return;
  }

  const highestWin = portfolios.reduce((best, item) => (item.analysis.summary.win_rate ?? -1) > (best.analysis.summary.win_rate ?? -1) ? item : best, portfolios[0]);
  const highestReturn = portfolios.reduce((best, item) => (item.analysis.summary.avg_return ?? -999) > (best.analysis.summary.avg_return ?? -999) ? item : best, portfolios[0]);
  const shortestHold = portfolios.reduce((best, item) => (item.analysis.summary.avg_hold ?? 999) < (best.analysis.summary.avg_hold ?? 999) ? item : best, portfolios[0]);
  const compareLeaders = { highestWin, highestReturn, shortestHold };
  const championRules = {
    "平仓胜率": {
      better: "max",
      value: (analysis) => analysis.summary.win_rate,
      note: "胜率第一"
    },
    "平均收益": {
      better: "max",
      value: (analysis) => analysis.summary.avg_return,
      note: "收益第一"
    },
    "平均持股": {
      better: "min",
      value: (analysis) => analysis.summary.avg_hold,
      note: "持股最短"
    },
    "3日内占比": {
      better: "max",
      value: (analysis) => analysis.summary.within_3d_rate,
      note: "快切最强"
    },
    "第一行业占比": {
      better: "max",
      value: (analysis) => analysis.summary.industry_focus_rate,
      note: "行业最集中"
    },
    "利润因子": {
      better: "max",
      value: (analysis) => analysis.summary.profit_factor,
      note: "期望最强"
    }
  };
  const rows = [
    { label: "交易风格", get: (analysis) => analysis.profile.tradingStyle },
    { label: "行业舒适区", get: (analysis) => analysis.profile.industryFocus !== "未识别" ? analysis.profile.industryFocus : "待补全" },
    { label: "板块偏好", get: (analysis) => analysis.profile.boardFocus },
    { label: "已闭环交易", get: (analysis) => analysis.summary.trade_count },
    { label: "未完成头寸", get: (analysis) => analysis.summary.open_count },
    { label: "平仓胜率", get: (analysis) => pct(analysis.summary.win_rate) },
    { label: "平均收益", get: (analysis) => pct(analysis.summary.avg_return) },
    { label: "平均持股", get: (analysis) => `${num(analysis.summary.avg_hold)}天` },
    { label: "3日内占比", get: (analysis) => pct(analysis.summary.within_3d_rate) },
    { label: "双创/北交占比", get: (analysis) => pct(analysis.summary.growth_board_rate) },
    { label: "第一行业占比", get: (analysis) => pct(analysis.summary.industry_focus_rate) },
    { label: "利润因子", get: (analysis) => num(analysis.summary.profit_factor) },
    { label: "最大单笔亏损", get: (analysis) => pct(analysis.summary.max_loss) },
    { label: "客群匹配", get: (analysis) => analysis.profile.fitLabel }
  ];

  function championIdsForRow(row) {
    const rule = championRules[row.label];
    if (!rule) return [];
    const numericValues = portfolios
      .map((item) => ({ id: item.id, value: rule.value(item.analysis) }))
      .filter((item) => item.value != null && Number.isFinite(item.value));
    if (!numericValues.length) return [];
    const target = rule.better === "min"
      ? Math.min(...numericValues.map((item) => item.value))
      : Math.max(...numericValues.map((item) => item.value));
    return numericValues
      .filter((item) => Math.abs(item.value - target) < 1e-9)
      .map((item) => item.id);
  }

  const compareConclusion = buildCompareConclusion(portfolios, compareLeaders);

  container.innerHTML = `
    <div class="compare-grid">
      <div class="compare-card highlight win">
        <strong>最高胜率</strong>
        <span>${pct(highestWin.analysis.summary.win_rate)}</span>
        <em>${highestWin.name}</em>
      </div>
      <div class="compare-card highlight gain">
        <strong>最高平均收益</strong>
        <span>${pct(highestReturn.analysis.summary.avg_return)}</span>
        <em>${highestReturn.name}</em>
      </div>
      <div class="compare-card highlight hold">
        <strong>最短平均持股</strong>
        <span>${num(shortestHold.analysis.summary.avg_hold)}天</span>
        <em>${shortestHold.name}</em>
      </div>
    </div>
    <div class="panel-card compare-conclusion-card">
      <h3>对比结论</h3>
      <div class="insight-callout">${compareConclusion}</div>
    </div>
    <div class="panel-card compare-strip-shell">
      <h3>组合速览</h3>
      <p class="lead">对比数量较多时，直接横向滚动查看各组合核心指标。</p>
      ${createComparePortfolioStrip(portfolios)}
    </div>
    <div class="visual-grid">
      ${createCompareRadarMarkup(portfolios)}
      ${createCompareHeatmapMarkup(portfolios)}
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="left">指标</th>
            ${portfolios.map((item) => `<th>${item.name}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            ${(() => {
              const championIds = championIdsForRow(row);
              const note = championRules[row.label]?.note || "指标领先";
              return `
            <tr>
              <td class="left">${row.label}</td>
              ${portfolios.map((item) => {
                const isChampion = championIds.includes(item.id);
                if (!isChampion) return `<td>${row.get(item.analysis)}</td>`;
                return `
                  <td class="champion-cell">
                    <span class="champion-badge">No.1</span>
                    <span class="champion-value">${row.get(item.analysis)}</span>
                    <span class="champion-note">${note}</span>
                  </td>
                `;
              }).join("")}
            </tr>
          `;
            })()}
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLogicConsistencyPanel() {
  const currentPortfolio = getCurrentPortfolio();
  const savedPayload = state.logicValidationResult;
  const payload = savedPayload?.validation?.version !== "logic_validation_v2_directional"
    ? null
    : savedPayload?.portfolio_id && currentPortfolio?.id && savedPayload.portfolio_id !== currentPortfolio.id
    ? null
    : savedPayload;
  const validation = payload?.validation || null;
  const sourceSummary = payload?.source_summary || {};
  const inputPreview = logicValidationInputPreview(currentPortfolio);
  const score = Number(validation?.overall_score ?? 0);
  const consistencyLevel = validation?.consistency_level || (payload ? (score >= 80 ? "高" : score >= 55 ? "中" : "低") : "--");
  const providerLabels = {
    deepseek: "DeepSeek 自动语义验证",
    glm: "GLM 自动语义验证",
    ark: "豆包自动语义验证",
    openai_compatible: "OpenAI 兼容接口验证",
    local_rules_fallback: "本地规则验证"
  };
  const modeLabel = payload ? (providerLabels[payload.mode] || "大模型自动语义验证") : "等待自动验证";
  const dailyLogicRows = validation?.daily_checks || [];
  const dailyChecks = (validation?.daily_checks || []).flatMap((day) =>
    (day.checks || []).map((item) => ({ ...item, date: day.date || "" }))
  );
  const refreshedAt = payload?.refreshed_at || payload?.manual_refreshed_at || payload?.auto_refreshed_at || payload?.generated_at || "";
  const refreshLabel = payload?.trigger_reason === "manual_refresh" ? "手动验证" : "自动验证";
  let refreshedText = "";
  if (refreshedAt) {
    const parsed = new Date(refreshedAt);
    refreshedText = Number.isNaN(parsed.getTime()) ? refreshedAt : parsed.toLocaleString("zh-CN", { hour12: false });
  }
  const statusText = payload
    ? `已读取 ${sourceSummary.advisor_docs || 0} 条主理人语料、${sourceSummary.holding_days || 0} 个持仓日，识别 ${sourceSummary.adjustment_events || 0} 个调仓事件。${refreshedText ? ` 最后${refreshLabel}：${refreshedText}。` : ""}`
    : "系统会在打开网页以及语料、持仓或调仓变化后自动调用大模型，按行业方向与操作语义验证，无需手动点击。";
  const scoreTone = score >= 75 ? "up" : score >= 55 ? "amber" : "down";

  return `
    <div class="panel-card bento-col-12 logic-ai-card" style="margin-bottom:16px;">
      <div class="feed-panel-heading">
        <div>
          <h3>大模型言行一致度验证</h3>
          <p class="lead">${statusText}</p>
        </div>
        <div class="advisor-profile-actions">
          <span class="v-tag up">自动验证</span>
          <button class="pill-btn secondary" id="refreshLogicValidationBtn" type="button" ${logicValidationAutoPending ? "disabled" : ""}>${logicValidationAutoPending ? "验证中..." : "立即刷新"}</button>
        </div>
      </div>
      <div class="kv-grid" style="margin-top:14px;">
        <div class="kv-card">
          <strong>一致度</strong>
          <div class="metric-value ${scoreTone}" style="font-size:34px;">${payload ? `${num(score, 1)}%` : "--"}</div>
          <span>${payload ? `${consistencyLevel} · ` : ""}${modeLabel}</span>
        </div>
        <div class="kv-card">
          <strong>验证摘要</strong>
          <span>${escapeHtml(validation?.summary || "等待首次验证。")}</span>
        </div>
        <div class="kv-card">
          <strong>数据覆盖</strong>
          <span>持仓日 ${sourceSummary.holding_days ?? inputPreview.holdingDays} 天；持仓明细 ${sourceSummary.holding_positions ?? inputPreview.holdingPositions} 条；调仓事件 ${sourceSummary.adjustment_events ?? inputPreview.ledgerEvents} 个；画像${sourceSummary.has_strategy_profile ? "已接入" : "待更新"}。</span>
        </div>
      </div>
      <p class="lead" id="logicValidationStatus" style="margin-top:10px;">${escapeHtml(logicValidationAutoStatus || "验证口径：同一行业、主题或产业链方向大致一致即可，不要求观点与交易出现同一标的。")}</p>
      ${dailyLogicRows.length ? `
        <div class="evidence-list" style="margin-top:14px;">
          ${dailyLogicRows.map((day) => `
            <div class="evidence-item">
              <strong>${escapeHtml(day.date || "未标注日期")} · 验证逻辑</strong>
              <span><b>核心观点：</b>${escapeHtml(day.core_view || "当日语料未形成明确方向，参考近期语料与稳定策略画像。")}</span>
              <span><b>实际动作：</b>${escapeHtml(day.actual_actions || "以当日持仓方向及持仓变化为准。")}</span>
              <span><b>匹配分析：</b>${escapeHtml(day.match_logic_analysis || "详见下方方向匹配与证据明细。")}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${dailyChecks.length ? `
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead>
              <tr>
                <th class="left">日期</th>
                <th class="left">标的</th>
                <th>动作</th>
                <th class="left">方向匹配</th>
                <th>单项分</th>
                <th class="left">结论</th>
                <th class="left">证据</th>
              </tr>
            </thead>
            <tbody>
              ${dailyChecks.map((item) => {
                const consistent = item.is_consistent === true || item.is_consistent === "true";
                const evidence = Array.isArray(item.evidence) ? item.evidence.join("；") : (item.evidence || "");
                const direction = item.direction || item.industry || "";
                const matchedDirection = item.matched_view_direction || "";
                return `
                  <tr>
                    <td class="left">${escapeHtml(item.date || "")}</td>
                    <td class="left">${escapeHtml(item.stock || "")}</td>
                    <td>${escapeHtml(item.action || "")}</td>
                    <td class="left">${escapeHtml([direction, matchedDirection ? `观点：${matchedDirection}` : ""].filter(Boolean).join("；") || "证据待补")}</td>
                    <td>${item.score == null ? "--" : num(item.score, 0)}</td>
                    <td class="left"><span class="v-tag ${consistent ? "up" : "down"}">${consistent ? "一致" : "待复核"}</span> ${escapeHtml(item.reason || "")}</td>
                    <td class="left">${escapeHtml(evidence || item.missing_evidence || "")}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state" style="margin-top:14px;">暂无逐日调仓验证结果。</div>
      `}
      ${(validation?.logic_evidence || []).length ? `
        <div class="evidence-list" style="margin-top:14px;">
          ${(validation.logic_evidence || []).slice(0, 6).map((item) => `
            <div class="evidence-item"><strong>逻辑依据</strong><span>${escapeHtml(item)}</span></div>
          `).join("")}
        </div>
      ` : ""}
      ${(validation?.risks || []).length ? `
        <ul class="bullet-list" style="margin-top:12px;">
          ${(validation.risks || []).slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      ` : ""}
    </div>
  `;
}

function renderValidation(analysis) {
  const logicItems = normalizeListItems(analysis.logicPoints);
  const strategyItems = normalizeListItems(analysis.strategy_points);
  const premarketItems = analysis.premarket_insights || [];
  const logicConsistencyHtml = renderLogicConsistencyPanel();
  
  // 渲染实盘归纳模块
  const logicHtml = `
    <div class="panel-card bento-col-12">
      <h3>交易逻辑归纳（实盘证据）</h3>
      <p class="lead">系统基于实际交易明细中的胜率、盈亏比、行业暴露和周期特征，客观归纳的主理人真实打法。</p>
      <ul class="bullet-list" style="margin-top:12px;">${logicItems.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `;

  const premarketHtml = premarketItems.length
    ? `
      <div class="panel-card bento-col-12" style="margin-top: 16px;">
        <h3>盘前洞察结构化结果</h3>
        <p class="lead">系统从自然语言中自动整理出的日期、方向、股票、操作建议和风险提示。</p>
        <div class="evidence-list">
          ${premarketItems.map((item) => `
            <div class="evidence-item">
              <strong>${item.date || item.title || "盘前洞察"}</strong>
              <span>
                ${item.focus_directions?.length ? `方向：${item.focus_directions.join("、")}。` : ""}
                ${item.mentioned_stocks?.length ? `股票：${item.mentioned_stocks.join("、")}。` : ""}
                ${item.operation_advice ? `建议：${item.operation_advice}。` : ""}
                ${item.risk_warning ? `风险：${item.risk_warning}。` : ""}
              </span>
            </div>
          `).join("")}
        </div>
      </div>
    `
    : "";

  // 渲染宣发校验模块
  let strategyHtml = "";
  if (strategyItems.length > 0) {
    const validations = analysis.strategyValidations || [];
    const validationListHtml = validations.length > 0 
      ? validations.map(v => `
          <div class="validation-item ${v.match ? 'match' : 'mismatch'}">
            <div class="v-header">
              <span class="v-tag ${v.match ? 'up' : 'down'}">${v.conclusion}</span>
              <strong>${v.point}</strong>
            </div>
            <div class="v-evidence">${v.evidence}</div>
          </div>
        `).join("")
      : `<div class="empty-state">当前宣发口径中未能提取出可供量化核验的关键词（如：止损、胜率、短线、主线等）。</div>`;

    strategyHtml = `
      <div class="panel-card bento-col-12" style="margin-top: 16px;">
        <h3>知行合一校验（他说 vs 他做）</h3>
        <p class="lead">将上传的宣传材料口径与客观交易数据进行智能比对，校验主理人是否做到“知行合一”。</p>
        <div class="validation-grid">
          <div class="validation-col">
            <h4>宣传口径原文</h4>
            <ul class="bullet-list" style="max-height: 400px; overflow-y: auto; padding-right: 8px;">${strategyItems.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div class="validation-col">
            <h4>系统量化核验结果</h4>
            <div class="validation-results">
              ${validationListHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    strategyHtml = `
      <div class="panel-card bento-col-12" style="margin-top: 16px;">
        <h3>知行合一校验（他说 vs 他做）</h3>
        <div class="empty-state-card">
          <div class="empty-icon">📝</div>
          <h4>未上传宣传资料或策略口径</h4>
          <p>当前组合仅提供了历史交易明细。如果需要进行“知行合一”的匹配校验，请在导入数据时一并包含该主理人的宣传材料或路演文案。</p>
        </div>
      </div>
    `;
  }

  document.getElementById("view-validation").innerHTML = `
    <div class="bento-grid">
      ${logicConsistencyHtml}
      <div class="panel-card bento-col-12" style="margin-bottom: 16px;">
        <h3>客观证据链</h3>
        <div class="evidence-list">
          ${analysis.evidence.map((item) => `
            <div class="evidence-item">
              <strong>${item.title}</strong>
              <span>${item.text}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="bento-grid">
      ${logicHtml}
      ${premarketHtml}
      ${strategyHtml}
    </div>
  `;
  document.getElementById("refreshLogicValidationBtn")?.addEventListener("click", refreshLogicValidationManually);
}

function renderStyle(analysis) {
  const holdInsight = getHoldFrequencyInsight(analysis);
  const visibleHoldDistribution = analysis.holdDistribution.filter((item) => item.ratio > 0 || item.label !== "未知");
  
  let topIndustries = analysis.industryDistribution.slice(0, 5);
  let extraIndustries = analysis.industryDistribution.slice(5);
  // 如果剩下的行业只有 1 个，那就直接放出来，不用单独搞个折叠块
  if (extraIndustries.length === 1) {
    topIndustries = analysis.industryDistribution.slice(0, 6);
    extraIndustries = [];
  }
  document.getElementById("view-style").innerHTML = `
    ${renderCurrentHoldingsPanel()}
    ${renderHoldingTimelinePanel()}
    <div class="bento-grid">
      <!-- 频率判断 (1/3) -->
      <div class="panel-card hold-judge-card bento-col-4">
        <div class="hold-judge-head">
          <span class="judge-badge ${holdInsight.tone}">${holdInsight.level}</span>
          <div>
            <h3>持仓频率判断</h3>
            <p class="lead">${holdInsight.title}</p>
          </div>
        </div>
        <div class="insight-callout" style="margin-top:12px;">${holdInsight.coreView}</div>
        <div class="pill-line">
          ${holdInsight.tags.map((item) => `<span class="ghost-pill">${item}</span>`).join("")}
        </div>
        <ul class="bullet-list">${holdInsight.points.slice(1).map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>

      <!-- 收益结构 (1/3) -->
      <div class="panel-card bento-col-4">
        <h3>收益结构</h3>
        <div class="style-metric-grid">
          <div class="metric-card up">
            <div class="metric-title">盈利单平均收益</div>
            <div class="metric-value">${pct(analysis.summary.winner_avg_return)}</div>
            <div class="metric-note">平均持有 ${num(analysis.summary.winner_avg_hold)} 天</div>
          </div>
          <div class="metric-card down">
            <div class="metric-title">亏损单平均收益</div>
            <div class="metric-value">${pct(analysis.summary.loser_avg_return)}</div>
            <div class="metric-note">平均持有 ${num(analysis.summary.loser_avg_hold)} 天</div>
          </div>
          <div class="metric-card blue">
            <div class="metric-title">利润因子</div>
            <div class="metric-value">${num(analysis.summary.profit_factor)}</div>
            <div class="metric-note">总盈利 / 总亏损绝对值</div>
          </div>
          <div class="metric-card amber">
            <div class="metric-title">盈利 2%+ 占比</div>
            <div class="metric-value">${pct(analysis.summary.profit_over_2_rate)}</div>
            <div class="metric-note">反映止盈兑现的有效密度</div>
          </div>
        </div>
      </div>

      <!-- 周期分布 (1/3) -->
      <div class="panel-card bento-col-4">
        <h3>持有周期分布</h3>
        <div class="bar-group">
          ${visibleHoldDistribution.map((item) => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill ${item.label === "1天" ? "red" : "blue"}" style="width:${item.ratio.toFixed(2)}%"></div></div>
              <div class="bar-value">${pct(item.ratio)}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- 个股博弈穿透 (2/3) -->
      <div class="panel-card bento-col-8">
        <h3>个股博弈特征与能力圈</h3>
        <div class="kv-grid" style="margin-top:0; margin-bottom:12px;">
          <div class="kv-card">
            <strong>个股特征诊断</strong>
            <ul>
              <li><strong>能力圈宽度：</strong>${analysis.summary.stock_breadth_rate >= 0.5 ? "较广" : "较窄"}（盈利标的占总交易标的 ${pct(analysis.summary.stock_breadth_rate)}）</li>
              <li><strong>提款机标的：</strong>${analysis.summary.cash_cows && analysis.summary.cash_cows.length ? `识别出 ${analysis.summary.cash_cows.length} 只高频提款机（如 ${analysis.summary.cash_cows[0].stock}）` : "未见明显的高频提款机"}</li>
              <li><strong>滑铁卢标的：</strong>${analysis.summary.stubborn_losers && analysis.summary.stubborn_losers.length ? `<span style="color:var(--down)">存在 ${analysis.summary.stubborn_losers.length} 只反复亏损标的（如 ${analysis.summary.stubborn_losers[0].stock}）</span>` : "未见明显的死磕亏损标的"}</li>
            </ul>
          </div>
          <div class="kv-card">
            <strong>行为解读</strong>
            <ul>
              <li>${analysis.summary.stock_breadth_rate >= 0.5 ? "组合能在多数操作过的股票上赚到钱，说明选股模型具有普适性，不单纯依赖极少数“神票”。" : "赚钱标的占比较低，说明组合的收益高度集中在少数几只票上，大部分试错标的在失血。"}</li>
              <li>${analysis.summary.cash_cows && analysis.summary.cash_cows.length ? "对部分股票股性极其熟悉，能在一个票上反复赚钱，这是非常明显的优势能力。" : "没有在一只票上反复赚钱的习惯，更偏向打一枪换一个地方的广覆盖轮动。"}</li>
              <li>${analysis.summary.stubborn_losers && analysis.summary.stubborn_losers.length ? "存在反复在一个票上亏钱的执念交易，需警惕情绪化“死磕”和不认错的倾向。" : "没有在亏损标的上反复死磕，说明止损后能理智放弃，不带情绪交易。"}</li>
            </ul>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th class="left">标的</th><th class="left">所属行业</th><th>次数</th><th>胜率</th><th>平均收益</th><th>平均持有</th></tr>
            </thead>
            <tbody>
              ${analysis.repeatedNames.length ? analysis.repeatedNames.slice(0, 10).map((item) => `
                <tr>
                  <td class="left"><strong>${item.stock}</strong></td>
                  <td class="left" style="color:var(--muted);">${item.industry}</td>
                  <td>${item.count}</td>
                  <td>${pct(item.win_rate)}</td>
                  <td class="${(item.avg_return ?? 0) >= 0 ? "up-text" : "down-text"}">${pct(item.avg_return)}</td>
                  <td>${num(item.avg_hold_days)}天</td>
                </tr>
              `).join("") : `<tr><td colspan="6">当前样本未呈现出明显的重复交易标的。</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 行业分布 (1/3) -->
      <div class="panel-card bento-col-4">
        <h3>行业分布</h3>
        ${createIndustryPieMarkup(analysis.industryDistribution)}
        <div class="bar-group">
          ${analysis.industryDistribution.length ? topIndustries.map((item) => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill blue" style="width:${item.ratio.toFixed(2)}%"></div></div>
              <div class="bar-value">${pct(item.ratio)}</div>
            </div>
          `).join("") : `<div class="empty-state">行业数据尚未补全，暂时无法展示行业分布。</div>`}
        </div>
        ${extraIndustries.length
          ? renderFoldPanel(
            `<div class="bar-group">
              ${extraIndustries.map((item) => `
                <div class="bar-row">
                  <div class="bar-label">${item.label}</div>
                  <div class="bar-track"><div class="bar-fill blue" style="width:${item.ratio.toFixed(2)}%"></div></div>
                  <div class="bar-value">${pct(item.ratio)}</div>
                </div>
              `).join("")}
            </div>`,
            `展开其余 ${extraIndustries.length} 个行业`,
            "收起其余行业"
          )
          : ""}
      </div>
    </div>

    <!-- 行业绩效表现 (满宽) -->
    <div class="bento-grid">
      <div class="panel-card bento-col-12">
        <h3>各行业盈亏表现</h3>
        <p class="lead">统计所有已闭环交易在各行业板块内的胜率与收益水平，直观呈现主理人的真实能力圈与失血区。</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th class="left">行业板块</th><th>交易笔数</th><th>胜率</th><th>平均收益</th></tr>
            </thead>
            <tbody>
              ${analysis.industryPerformance?.length ? analysis.industryPerformance.map((item) => `
                <tr>
                  <td class="left"><strong>${item.industry}</strong></td>
                  <td>${item.count}</td>
                  <td>${pct(item.win_rate)}</td>
                  <td class="${(item.avg_return ?? 0) >= 0 ? "up-text" : "down-text"}">${pct(item.avg_return)}</td>
                </tr>
              `).join("") : `<tr><td colspan="4">暂无行业绩效数据（请先确保行业信息已补全）。</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderStockAnalysisModule() {
  const view = document.getElementById("view-stock");
  if (!view || state.activeTab !== "stock") return;
  let holdings = [];
  try {
    holdings = buildCurrentShareSnapshot().position?.holdings || [];
  } catch (_) {
    holdings = [];
  }
  const defaultCode = String(holdings[0]?.stock_code || "600000").replace(/\D/g, "").slice(-6);
  const publicUrl = (code) => `https://senyoasuka.github.io/tcd-share/stock_market_v84.html?code=${encodeURIComponent(code)}`;
  const frameUrl = (code) => isLocalServiceHost() ? `./stock_market.html?code=${encodeURIComponent(code)}` : publicUrl(code);
  view.innerHTML = `<div class="stock-analysis-module">
    <section class="stock-analysis-module-head">
      <div><h2>个股走势与仓位分析</h2><p>在观察台内直接查看实时行情、技术面、财务与业绩、估值、申万行业位置及条件化仓位框架。页面内可继续搜索任意股票。</p><div class="stock-analysis-shortcuts">${holdings.length ? holdings.slice(0, 8).map(item => `<button type="button" data-stock-analysis-code="${escapeHtml(item.stock_code)}">${escapeHtml(item.stock_name || item.stock_code)}</button>`).join("") : `<button type="button" data-stock-analysis-code="600000">浦发银行 600000</button><button type="button" data-stock-analysis-code="601168">西部矿业 601168</button>`}</div></div>
      <a class="stock-analysis-open" id="stockAnalysisOpen" href="${publicUrl(defaultCode)}" target="_blank" rel="noopener noreferrer">打开分享页</a>
    </section>
    <div class="stock-analysis-frame-wrap"><iframe class="stock-analysis-frame" id="stockAnalysisFrame" title="个股走势与仓位分析" src="${frameUrl(defaultCode)}" loading="eager"></iframe></div>
  </div>`;
  const frame = document.getElementById("stockAnalysisFrame");
  const open = document.getElementById("stockAnalysisOpen");
  view.querySelectorAll("[data-stock-analysis-code]").forEach((button) => button.addEventListener("click", () => {
    const code = String(button.dataset.stockAnalysisCode || "").replace(/\D/g, "").slice(-6);
    if (!/^\d{6}$/.test(code)) return;
    if (frame) frame.src = frameUrl(code);
    if (open) open.href = publicUrl(code);
  }));
}

function buildMaterialScripts(analysis) {
  const profile = state.advisorStrategyProfile?.profile || {};
  const validation = state.logicValidationResult?.validation || {};
  const current = getCurrentPortfolio();
  const holdingDate = analysis.summary.latest_snapshot_date || current?.meta?.latestDate || "";
  const holdings = (analysis.openPositions || [])
    .slice(0, 6)
    .map((item) => {
      const ret = item.return_pct == null ? "" : `，持有收益率${pct(parsePctPointValue(item.return_pct))}`;
      return `${item.stock}${item.code ? `(${item.code})` : ""}${ret}`;
    });
  const holdingLine = holdings.length
    ? `当前组合主要持有 ${holdings.join("、")}。`
    : "当前组合持仓仍需结合最新导入数据确认。";
  const directionLine = (profile.direction_preferences || [])
    .slice(0, 4)
    .join("、") || analysis.profile.industryFocus || analysis.profile.boardFocus || "结构性主线";
  const styleLine = profile.position_style || `${analysis.profile.tradingStyle}，更重视节奏和风险边界`;
  const riskLine = profile.risk_style || analysis.scripts.marketingRisk;
  const validationLine = validation.summary
    ? `最近言行一致验证显示：${validation.summary}`
    : "系统会继续跟踪主理人观点与实际持仓是否保持大方向一致。";
  const baseIntro = `这个组合不是单纯看短期涨跌，而是把主理人的观点、真实持仓、调仓变化和盘面表现放在一起跟踪。${holdingDate ? `最新持仓日为 ${holdingDate}。` : ""}`;

  const scripts = [
    {
      id: "private_follow",
      title: "私聊跟进",
      scene: "适合一对一发给已关注客户",
      text: `您好，跟您同步一下这个组合的最新观察。\n\n${baseIntro}${holdingLine}\n\n从风格上看，主理人目前更偏向「${styleLine}」，关注方向集中在 ${directionLine}。这类组合适合愿意持续跟踪、能接受阶段波动的客户，不建议只因为某一天涨跌就做判断。\n\n${validationLine}\n\n风险上也要先说清楚：${riskLine}`
    },
    {
      id: "group_brief",
      title: "社群短评",
      scene: "适合客户群里的简短更新",
      text: `【组合跟踪】\n${holdingDate ? `${holdingDate} 持仓已更新。` : "组合持仓已更新。"}${holdingLine}\n\n当前观察重点：一是主理人关注方向是否延续在 ${directionLine}，二是实际调仓是否和观点保持一致，三是持仓收益和当日涨跌是否出现明显背离。\n\n结论先保持克制：组合逻辑需要持续验证，不因为单日表现直接下结论。后续重点看调仓动作、板块强弱和风险控制是否同步。`
    },
    {
      id: "moments",
      title: "朋友圈/企微",
      scene: "适合更轻量的展示文案",
      text: `看一个股票组合，不能只看今天涨了还是跌了。\n\n更重要的是：主理人之前怎么说，实际又怎么做；看好的方向有没有落实到持仓里；遇到波动时是追高、死扛，还是有纪律地调整。\n\n我们现在把主理人观点、每日持仓、调仓变化和市场涨跌放到同一个系统里观察。${holdingDate ? `最新跟踪到 ${holdingDate}。` : ""}\n\n这类跟踪的价值，不是承诺收益，而是让组合的逻辑、风格和风险边界变得更透明。`
    },
    {
      id: "phone_opening",
      title: "电话开场",
      scene: "适合电话沟通前 30 秒",
      text: `我简单跟您说一下这个组合现在怎么看。\n\n它不是一个只看短期收益的组合，我们现在重点看三件事：第一，主理人的观点方向；第二，实际持仓和调仓有没有跟观点一致；第三，遇到市场波动时有没有风险控制。\n\n目前组合风格偏「${analysis.profile.tradingStyle}」，关注方向主要在 ${directionLine}。${holdingLine}\n\n如果您看重的是有人持续盯盘、持续解释、持续做复盘，这个组合可以继续了解；如果您希望完全没有波动，可能就不太适合。`
    },
    {
      id: "risk_notice",
      title: "风险提示",
      scene: "适合成交前或波动时补充",
      text: `风险提示需要提前说清楚：\n\n1. 股票组合会跟随市场和板块波动，过往表现不代表未来收益。\n2. 如果组合集中在某几个方向，遇到对应板块调整时，净值波动会更明显。\n3. 当前持仓和主理人观点即使大方向一致，也不代表每一次调仓都一定正确。\n4. 后续需要持续看调仓纪律、仓位变化、持仓收益率和板块强弱。\n\n所以这个组合更适合作为持续观察和专业跟踪的对象，不适合用“短期必涨”的心态参与。`
    },
    {
      id: "review",
      title: "复盘解释",
      scene: "适合涨跌后解释组合变化",
      text: `今天复盘这个组合，建议不要只看单日涨跌，而要放到主理人原本的投资框架里看。\n\n${validationLine}\n\n如果持仓表现和主理人关注方向一致，说明逻辑和资金表现阶段性共振；如果观点逻辑还在，但持仓短期走弱，就要重点观察是否止跌、是否减仓、是否有新的风险解释。\n\n${holdingLine}\n\n后续跟踪重点是：主理人是否继续坚持原方向、是否调整仓位、以及调仓动作能否被早评/午评/盘中问答里的逻辑解释。`
    }
  ];
  return scripts;
}

function getMaterialDateOptions(analysis) {
  const importedDates = [
    ...(state.feedRecords || []).map((item) => item.date),
    ...(state.hotRecords || []).map((item) => item.date),
    ...((getCurrentPortfolio()?.dataset?.daily_snapshots || getCurrentPortfolio()?.dataset?.snapshots || []).map(getSnapshotDate)),
    analysis.summary.latest_snapshot_date,
    formatDateObject(new Date()),
  ].filter(Boolean).map(normalizeDateInput).filter(Boolean);
  const today = formatDateObject(new Date());
  const firstImportedDate = importedDates.length ? importedDates.slice().sort((a, b) => a.localeCompare(b))[0] : "2026-07-21";
  const startDate = firstImportedDate && firstImportedDate < "2026-07-21" ? firstImportedDate : "2026-07-21";
  return unique([
    ...dateRangeStrings(startDate, today),
    ...importedDates,
  ]).sort((a, b) => b.localeCompare(a));
}

function buildMaterialImagePayload(analysis, scripts) {
  const dates = getMaterialDateOptions(analysis);
  const targetDate = state.selectedMaterialDate || dates[0] || formatDateObject(new Date());
  state.selectedMaterialDate = targetDate;
  return {
    date: targetDate,
    size: "2K"
  };
}

function dateToChineseLabel(dateValue) {
  const date = normalizeDateInput(dateValue);
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function numberForMaterialPct(value) {
  const parsed = parsePctPointValue(value);
  return parsed == null || Number.isNaN(parsed) ? null : parsed;
}

function portfolioReviewSuggestion(row) {
  const day = numberForMaterialPct(row.day_pct_change);
  const holding = numberForMaterialPct(row.return_pct);
  if (holding != null && holding < -8) return "观察止跌";
  if (day != null && day > 4) return "继续跟踪";
  if (day != null && day < -4) return "控制波动";
  return "继续持有";
}

function isMissingSw2Industry(value) {
  const text = cleanText(value || "");
  return !text || ["未识别", "待补全", "未知", "暂无", "-", "--"].includes(text);
}

function resolvePortfolioReviewIndustry(item) {
  const code = extractCode(item?.code || item?.stock || item?.name || item?.["证券代码"] || "");
  const mapped = state.industryCache?.[code] || {};
  const candidates = [
    mapped.industry_name,
    item?.industry_name,
    item?.industry,
    item?.["所属行业"],
    item?.["申万行业"],
  ];
  return candidates.map((value) => cleanText(value || "")).find((value) => !isMissingSw2Industry(value)) || "申万二级行业待补全";
}

async function ensurePortfolioReviewIndustries(targetDate) {
  // 数据源：选中日期与上一持仓日的持仓快照；接口：GET /api/industry（申万二级）。
  const timeline = buildHoldingTimelineLookup();
  const row = timeline.lookup.get(targetDate) || null;
  const previousRow = timeline.previousByDate.get(targetDate) || null;
  const positions = [
    ...(row?.positions || []),
    ...(previousRow?.positions || []),
  ];
  const codes = unique(positions
    .map((item) => extractCode(item?.code || item?.stock || item?.name || item?.["证券代码"] || ""))
    .filter(Boolean));
  const missingCodes = codes.filter((code) => isMissingSw2Industry(state.industryCache?.[code]?.industry_name));
  if (!missingCodes.length) return;

  const ready = await ensureIndustryServiceReady();
  if (!ready) throw new Error("申万二级行业服务未启动");
  const response = await fetch(`/api/industry?codes=${encodeURIComponent(missingCodes.join(","))}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`申万二级行业查询失败（HTTP ${response.status}）`);
  const payload = await response.json();
  Object.assign(state.industryCache, payload.data || {});

  const unresolved = missingCodes.filter((code) => isMissingSw2Industry(state.industryCache?.[code]?.industry_name));
  if (unresolved.length) throw new Error(`以下证券暂未识别申万二级行业：${unresolved.join("、")}`);

  const current = getCurrentPortfolio();
  if (current) {
    current.dataset = applyIndustryMapToDataset(current.dataset, state.industryCache);
    current.analysis = computeAnalysis(current.dataset);
    current.meta = buildDatasetMeta(current.dataset, current.name);
    persistState();
  }
}

function buildPortfolioReviewPayload(analysis) {
  const timeline = buildHoldingTimelineLookup();
  const dates = getMaterialDateOptions(analysis);
  const selectedDate = state.selectedMaterialDate || state.selectedHoldingDate || dates[0] || formatDateObject(new Date());
  const row = timeline.lookup.get(selectedDate) || { date: selectedDate, positions: getCurrentHoldingRows() };
  const previousRow = timeline.previousByDate.get(selectedDate) || null;
  const positions = row.positions || [];
  const summary = getHoldingSummary(positions);
  const displayDates = getHoldingDisplayDates().filter((date) => date <= selectedDate).slice(-7);
  const weekReturnParts = displayDates
    .map((date) => timeline.lookup.get(date))
    .filter(Boolean)
    .map((item) => getHoldingSummary(item.positions || []).dayPct)
    .filter((value) => value != null && !Number.isNaN(Number(value)));
  const weekReturn = weekReturnParts.length ? weekReturnParts.reduce((acc, item) => acc + Number(item), 0) : null;
  const holdings = positions.slice(0, 8).map((item) => ({
    code: item.code || extractCode(item.stock) || "",
    name: sanitizeStockName(item.stock || item.name || ""),
    industry: resolvePortfolioReviewIndustry(item),
    day_change: numberForMaterialPct(item.day_pct_change),
    weight: numberForMaterialPct(item.weight),
    holding_return: numberForMaterialPct(item.return_pct),
    suggestion: item.suggestion || item.advice || portfolioReviewSuggestion(item),
  }));
  const changeSummary = buildHoldingChangeSummary(row, previousRow);
  const adjustmentRows = [
    ...(changeSummary.added || []).map((item) => ({ item, direction: previousRow ? "建仓" : "建仓", reason: previousRow ? "较上一持仓日新增持仓" : "首日持仓记录" })),
    ...(changeSummary.increased || []).map((item) => ({ item, direction: "加仓", reason: item.note || "持仓数量或市值提升" })),
    ...(changeSummary.decreased || []).map((item) => ({ item, direction: "减仓", reason: item.note || "持仓数量或市值下降" })),
    ...(changeSummary.removed || []).map((item) => ({ item, direction: "清仓", reason: "较上一持仓日不再持有" })),
  ];
  const adjustments = adjustmentRows.slice(0, 5).map(({ item, direction, reason }) => ({
    code: item.code || extractCode(item.stock) || "",
    name: sanitizeStockName(item.stock || item.name || ""),
    industry: resolvePortfolioReviewIndustry(item),
    direction,
    reason,
  }));
  return {
    date: selectedDate,
    date_label: dateToChineseLabel(selectedDate),
    brand_left: "华泰证券",
    brand_right: "姜洪斌",
    product_name: "一号计划",
    risk_level: "R4",
    advisor_name: "姜洪斌",
    license_no: "S0570622080052",
    metrics: {
      week_return: weekReturn,
      cumulative_return: summary.totalReturnPct,
      today_return: summary.dayPct,
    },
    holdings,
    adjustments: adjustments.length ? adjustments : [{
      code: "-",
      name: "无调仓",
      industry: "-",
      direction: "持仓延续",
      reason: previousRow ? "较上一持仓日未识别到明显调仓" : "暂无上一持仓日可对比",
    }],
  };
}

function renderMaterialImagePanel(analysis, scripts) {
  const dates = getMaterialDateOptions(analysis);
  const selectedDate = state.selectedMaterialDate || dates[0] || formatDateObject(new Date());
  state.selectedMaterialDate = selectedDate;
  const sourceSummary = state.materialSourceSummary?.requested_date === selectedDate || state.materialSourceSummary?.advisor_requested_date === selectedDate
    ? state.materialSourceSummary
    : null;
  const advisorCount = sourceSummary?.advisor_count ?? (state.feedRecords || []).filter((item) => normalizeDateInput(item.date) === selectedDate).length;
  const hotCount = sourceSummary?.hotspot_count ?? (state.hotRecords || []).filter((item) => normalizeDateInput(item.date) === selectedDate).length;
  const advisorUsed = sourceSummary?.advisor_used_date || selectedDate;
  const fallbackText = sourceSummary?.advisor_fallback
    ? ` 当日没有早评，已回退使用 ${advisorUsed || "最近日期"} 的金山早评。`
    : "";
  const sampleText = sourceSummary?.selected_morning_title
    ? ` 本次样板：${sourceSummary.selected_morning_title}。`
    : "";
  const image = state.materialImageResult;
  const imageSrc = image?.local_url || image?.image_url || "";
  return `
    <div class="panel-card" style="margin-bottom:14px;">
      <div class="section-title-row">
        <div>
          <h3>Seedream 图片物料</h3>
          <p class="lead">按日期从金山云语料中选取一篇早评：资讯长图只讲消息面大事，早评海报只讲指数总看与板块方向。</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
          <select class="pill-btn secondary" id="materialDateSelect" style="height:42px;">
            ${dates.map((date) => `<option value="${escapeHtml(date)}" ${date === selectedDate ? "selected" : ""}>${escapeHtml(date)}</option>`).join("")}
          </select>
          <button class="pill-btn primary" type="button" id="renderDailyDigestBtn">生成资讯长图</button>
          <button class="pill-btn primary" type="button" id="renderAdvisorPosterBtn">生成早评海报</button>
          <button class="pill-btn primary" type="button" id="renderPortfolioReviewBtn">生成组合复盘图</button>
          <button class="pill-btn secondary" type="button" id="generateMaterialImageBtn">AI生成备选图</button>
        </div>
      </div>
      <div class="feed-inline-status" id="materialImageStatus">
        ${escapeHtml(selectedDate)}：可用主理人语料 ${advisorCount} 条、研报热点 ${hotCount} 条；本模块只使用所选单篇金山早评。${escapeHtml(fallbackText)}${escapeHtml(sampleText)}
        ${image?.generated_at ? `最近一次生成：${escapeHtml((image.generated_at || "").replace("T", " "))} · ${escapeHtml(image.kind || image.model || "图片物料")}` : "选择日期后点击生成，图片会保存到本地 generated_materials 文件夹。"}
      </div>
      ${imageSrc ? `
        <div style="margin-top:14px; display:grid; gap:12px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a class="pill-btn secondary" href="${escapeHtml(imageSrc)}" target="_blank" rel="noreferrer">打开图片</a>
            <a class="pill-btn secondary" href="${escapeHtml(imageSrc)}" download>下载图片</a>
          </div>
          <div style="max-width:440px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:10px;">
            <img src="${escapeHtml(imageSrc)}" alt="Seedream 生成的早报图片物料" style="width:100%; display:block; border-radius:8px;">
          </div>
        </div>
      ` : `
        <div class="empty-state-card" style="margin-top:14px;">
          <h4>等待生成图片物料</h4>
          <p>资讯长图展示消息面因素；早评海报展示指数和板块观点。两者沿用原版式，并按实际文字长度自动收缩。</p>
        </div>
      `}
    </div>
  `;
}

async function refreshMaterialSourceSummary(dateValue) {
  const targetDate = normalizeDateInput(dateValue || state.selectedMaterialDate || formatDateObject(new Date()));
  if (!targetDate) return null;
  try {
    const response = await fetch(`/api/material/source?date=${encodeURIComponent(targetDate)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.materialSourceSummary = {
      ...(payload.source_summary || {}),
      requested_date: targetDate
    };
    persistState();
    return state.materialSourceSummary;
  } catch (error) {
    console.warn("material source summary failed", error);
    return null;
  }
}

/*
 * 客户只读风控弹窗的数据接口预留：
 * - /api/v1/risk_dashboard：risk_position_journal、risk_v2.market/factors、
 *   risk_v2.holdings/sectors、risk_v2.industry_research、position_advice。
 * - /api/v1/risk/workspace：indices、sectors、instrument_review。
 * - /api/v1/risk/sector-detail：每个申万二级行业的独立 kline。
 * - state.feedRecords：系统当日主理人语料；严格按日期和行业/持仓名称匹配。
 * 页面只做字段排版；通道与压力/支撑使用下方明确的机械规则计算。
 */
function materialNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function materialKlineStats(kline = {}) {
  const ohlc = Array.isArray(kline.ohlc) ? kline.ohlc : [];
  const closes = ohlc.map((row) => materialNumber(row?.[1])).filter((value) => value != null);
  const recent = ohlc.slice(-20);
  const highs = recent.map((row) => materialNumber(row?.[3])).filter((value) => value != null);
  const lows = recent.map((row) => materialNumber(row?.[2])).filter((value) => value != null);
  const latestClose = closes.at(-1) ?? materialNumber(kline.latest_close);
  const latestMa5 = (Array.isArray(kline.ma5) ? kline.ma5 : []).map(materialNumber).filter((value) => value != null).at(-1) ?? null;
  const latestMa20 = (Array.isArray(kline.ma20) ? kline.ma20 : []).map(materialNumber).filter((value) => value != null).at(-1) ?? null;
  let channel = "震荡通道";
  let channelClass = "range";
  if (latestClose != null && latestMa5 != null && latestMa20 != null && latestClose > latestMa5 && latestMa5 > latestMa20) {
    channel = "上涨通道";
    channelClass = "up";
  } else if (latestClose != null && latestMa5 != null && latestMa20 != null && latestClose < latestMa5 && latestMa5 < latestMa20) {
    channel = "下跌通道";
    channelClass = "down";
  }
  return {
    latestClose,
    pressure: highs.length ? Math.max(...highs) : null,
    support: lows.length ? Math.min(...lows) : null,
    latestMa5,
    latestMa20,
    channel,
    channelClass,
  };
}

function materialIndustryGroups() {
  const v2Holdings = state.riskDashboard?.risk_v2?.holdings || [];
  const sourceRows = v2Holdings.length ? v2Holdings : getCurrentHoldingRows().map((item) => ({
    entity_id: item.code,
    name: item.stock,
    weight: materialNumber(item.weight) || 0,
    sw_industry: { industry_code: "", industry_name: item.industry || "未识别" },
  }));
  const grouped = new Map();
  sourceRows.forEach((holding) => {
    const sw = holding.sw_industry || {};
    const name = cleanText(sw.industry_name || holding.industry || "") || "未识别行业";
    const code = cleanText(sw.industry_code || "");
    const key = code || name;
    const group = grouped.get(key) || { key, code, name, holdings: [], weight: 0 };
    group.holdings.push(holding);
    group.weight += materialNumber(holding.weight) || 0;
    grouped.set(key, group);
  });
  return [...grouped.values()];
}

function materialIndustryCorpusMatches(group, asOfDate) {
  const industryName = cleanText(group?.name || "");
  if (!industryName || industryName === "未识别行业") return [];
  const holdingNames = (group.holdings || []).map((item) => cleanText(item.name || item.stock || "")).filter(Boolean);
  const matches = [];
  (state.feedRecords || []).forEach((record) => {
    const recordDate = normalizeDateInput(record.date || record.doc_date || record.created_at || "");
    if (recordDate !== asOfDate) return;
    const exactText = cleanText(record.content || record.raw_text || record.text || record.summary || record.viewpoint || "");
    const title = cleanText(record.title || record.corpus_type || record.source_type || "当日主理人语料");
    const searchable = [title, exactText, ...(record.matched_themes || []), ...(record.focus_directions || [])].join(" ");
    if (searchable.includes(industryName) || holdingNames.some((name) => name && searchable.includes(name))) {
      matches.push({ title, text: exactText, source: record.source || record.source_type || "系统当日语料包", outlook: "" });
    }
  });
  (state.riskDashboard?.risk_v2?.industry_research || []).forEach((record) => {
    const publishedDate = normalizeDateInput(record.published_at || record.first_seen_at || "");
    if (publishedDate !== asOfDate) return;
    const news = Array.isArray(record.news) ? record.news : [];
    const searchable = [
      record.title, record.summary,
      ...news.flatMap((item) => [item.title, item.subject, item.stock]),
      ...(record.ai?.affected_industries || []), ...(record.final?.affected_industries || []),
    ].map((item) => cleanText(item || "")).join(" ");
    if (!searchable.includes(industryName) && !holdingNames.some((name) => name && searchable.includes(name))) return;
    const exactOutlook = cleanText(record.manual?.note || record.ai?.opportunity_reason || record.ai?.risk_reason || "");
    matches.push({
      title: cleanText(record.title || "当日行业研判"),
      text: cleanText(record.summary || news[0]?.title || ""),
      source: cleanText(news[0]?.source || news[0]?.organization || "系统当日语料包"),
      outlook: exactOutlook,
    });
  });
  const seen = new Set();
  return matches.filter((item) => {
    const key = `${item.title}|${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.title || item.text);
  });
}

function materialPositionDecision(journal, adviceText) {
  const total = materialNumber(journal?.total_position_pct);
  const rangeMatch = cleanText(adviceText || "").match(/(\d+(?:\.\d+)?)%\s*[-—~至]\s*(\d+(?:\.\d+)?)%/);
  if (total == null || !rangeMatch) return { label: "待确认", className: "pending", reason: cleanText(journal?.manager_note || "每日调仓记录未填写调整原因") };
  const low = Number(rangeMatch[1]);
  const high = Number(rangeMatch[2]);
  const required = total < low || total > high;
  return {
    label: required ? "是" : "否",
    className: required ? "yes" : "no",
    reason: cleanText(journal?.manager_note || adviceText || "每日调仓记录未填写调整原因"),
  };
}

function materialRiskFactorList(market, direction) {
  const rows = (market?.factors || []).filter((item) => item.direction === direction);
  if (!rows.length) return `<div class="material-trace-placeholder">暂无${direction === "positive" ? "利好" : "利空"}因素记录</div>`;
  return `<div class="material-trace-factor-list">${rows.map((item) => `<article><header><strong>${escapeHtml(item.factor_name || "未命名因子")}</strong><b>${escapeHtml(item.display_value || "暂无数值")}</b></header><p>${escapeHtml(item.explanation || "暂无推导说明")}</p><small>贡献值 ${item.contribution == null ? "—" : escapeHtml(num(item.contribution, 2))} · 数据源：${escapeHtml(item.data_source || "未标注")}</small></article>`).join("")}</div>`;
}

function renderMaterialOperationsModal(analysis) {
  const payload = state.riskDashboard || {};
  const v2 = payload.risk_v2 || {};
  const market = v2.market || {};
  const journal = payload.risk_position_journal || null;
  const workspace = state.riskWorkspace || {};
  const instrumentReview = workspace.instrument_review || {};
  const hedgeEnabled = [instrumentReview.margin_view, instrumentReview.options_view].some((value) => cleanText(value).toLowerCase() === "needed");
  const hedgeText = cleanText(instrumentReview.note || "") || "今日无对冲操作计划";
  const positionDecision = materialPositionDecision(journal, payload.position_advice);
  const indexKline = (workspace.indices || []).find((item) => item.code === "1.000001") || (workspace.indices || [])[0] || {};
  const indexStats = materialKlineStats(indexKline);
  const riskSignals = [
    ...(v2.hard_rules || []).map((item) => cleanText(item.reason || item.label || item.name || "")),
    ...(market.watch_metrics || []).filter((item) => item.status === "negative").map((item) => `${cleanText(item.name)}：${cleanText(item.value)}${item.alert ? `（${cleanText(item.alert)}）` : ""}`),
  ].filter(Boolean);
  const asOfDate = normalizeDateInput(v2.as_of_date || journal?.snapshot_date || state.selectedMaterialDate || formatDateObject(new Date()));
  const groups = materialIndustryGroups();
  return `<div class="material-trace-stack">
    <section class="material-trace-section">
      <div class="material-trace-section-head"><div><span>模块一</span><h3>每日风控留痕</h3><p>读取每日调仓记录、风控因子结果与衍生品复核记录；业务文本保持原文。</p></div><b>${escapeHtml(asOfDate || "日期待补全")}</b></div>
      ${journal ? `<div class="material-trace-metrics">
        <article><span>大盘风控得分</span><strong>${journal.market_risk_score == null ? "—" : escapeHtml(num(journal.market_risk_score, 1))}</strong><small>每日调仓记录.market_risk_score</small></article>
        <article><span>主理人总仓位</span><strong>${journal.total_position_pct == null ? "—" : `${escapeHtml(num(journal.total_position_pct, 1))}%`}</strong><small>每日调仓记录.total_position_pct</small></article>
        <article><span>持仓偏差</span><strong>${journal.position_gap == null ? "—" : `${journal.position_gap > 0 ? "+" : ""}${escapeHtml(num(journal.position_gap, 1))}`}</strong><small>每日调仓记录.position_gap</small></article>
        <article><span>是否需要调整</span><strong class="decision-${positionDecision.className}">${escapeHtml(positionDecision.label)}</strong><small>按建议仓位区间机械校验</small></article>
      </div>
      <div class="material-trace-note"><strong>调整原因 / 仓位建议原文</strong><p>${escapeHtml(positionDecision.reason)}</p></div>` : `<div class="material-trace-placeholder">当日每日调仓记录暂无数据</div>`}
      <div class="material-trace-derivation"><h4>大盘风控得分推导说明</h4><div class="material-trace-factor-grid"><div><div class="factor-title positive">全部利好因素</div>${materialRiskFactorList(market, "positive")}</div><div><div class="factor-title negative">全部利空因素</div>${materialRiskFactorList(market, "negative")}</div></div></div>
      <div class="material-trace-hedge"><div><span>期权 / 期货对冲配置</span><strong class="hedge-${hedgeEnabled ? "yes" : "no"}">${hedgeEnabled ? "是 · 已启用" : "否 · 未启用"}</strong></div><p>${escapeHtml(hedgeText)}</p><small>数据源：risk_instrument_review.options_view / margin_view / note</small></div>
    </section>

    <section class="material-trace-section">
      <div class="material-trace-section-head"><div><span>模块二</span><h3>盘面指数总览</h3><p>指数通道由最新收盘、MA5、MA20机械判定；压力和支撑为最近20个交易日高低点。</p></div><b>${escapeHtml(indexKline.name || "上证指数")}</b></div>
      <div class="material-index-grid"><div class="material-index-chart"><div class="material-chart-head"><strong>${escapeHtml(indexKline.name || "指数行情")}</strong><span class="channel-${indexStats.channelClass}">${escapeHtml(indexStats.channel)}</span></div><div id="materialMarketIndexChart" class="material-trace-kline"></div></div><div class="material-index-facts"><article><span>最新点位</span><strong>${indexStats.latestClose == null ? "—" : escapeHtml(num(indexStats.latestClose, 2))}</strong></article><article class="pressure"><span>压力位</span><strong>${indexStats.pressure == null ? "—" : escapeHtml(num(indexStats.pressure, 2))}</strong></article><article class="support"><span>支撑位</span><strong>${indexStats.support == null ? "—" : escapeHtml(num(indexStats.support, 2))}</strong></article></div></div>
      <div class="material-trace-two-col"><div><h4>当前触发的风险信号</h4>${riskSignals.length ? `<ul class="material-risk-signals">${riskSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<div class="material-trace-placeholder">当前未记录已触发风险信号</div>`}</div><div><h4>指数综合观点（系统原文）</h4><div class="material-market-view"><p>${escapeHtml(market.change_explanation || "暂无大盘综合观点")}</p>${(market.key_drivers || []).map((item) => `<div><strong>${escapeHtml(item.factor_name || "核心驱动")}</strong><span>${escapeHtml(item.explanation || "暂无说明")}</span></div>`).join("")}</div></div></div>
    </section>

    <section class="material-trace-section">
      <div class="material-trace-section-head"><div><span>模块三</span><h3>持仓对应申万二级行业分析</h3><p>按当前持仓的 SW2021 二级行业聚合；当日语料未匹配时不使用历史内容替代。</p></div><b>${groups.length} 个行业</b></div>
      <div class="material-industry-list">${groups.length ? groups.map((group, index) => renderMaterialIndustryEntry(group, index, asOfDate, v2)).join("") : `<div class="material-trace-placeholder">当前组合暂无可映射持仓行业</div>`}</div>
    </section>
  </div>`;
}

function renderMaterialIndustryEntry(group, index, asOfDate, v2) {
  const detail = state.materialSectorDetails[group.code] || {};
  const kline = detail.kline || {};
  const stats = materialKlineStats(kline);
  const sectorScore = (v2.sectors || []).find((item) => item.entity_id === group.code || item.name === group.name) || {};
  const corpus = materialIndustryCorpusMatches(group, asOfDate);
  const outlook = corpus.map((item) => item.outlook).find(Boolean) || "暂无当日行业后市展望";
  const holdingsText = (group.holdings || []).map((item) => `${cleanText(item.name || item.stock || item.entity_id)}${item.weight == null ? "" : ` ${num(item.weight, 1)}%`}`).join("、") || "暂无持仓明细";
  return `<article class="material-industry-card">
    <header><div><span>${String(index + 1).padStart(2, "0")}</span><div><h4>${escapeHtml(group.name)}</h4><small>${escapeHtml(group.code || "申万二级代码待补全")} · 当前组合 ${group.holdings.length} 只 · 合计仓位 ${escapeHtml(num(group.weight, 1))}%</small></div></div><b class="channel-${stats.channelClass}">${escapeHtml(stats.channel)}</b></header>
    <div class="material-industry-main"><div><div class="material-chart-head"><strong>${escapeHtml(group.name)} K线</strong><span>${escapeHtml(kline.latest_date || asOfDate || "日期待补全")}</span></div>${(kline.dates || []).length ? `<div id="materialIndustryChart-${index}" data-material-industry-code="${escapeHtml(group.code)}" class="material-trace-kline"></div>` : `<div class="material-trace-placeholder chart">暂无该行业K线数据</div>`}</div><div class="material-index-facts"><article class="pressure"><span>压力位</span><strong>${stats.pressure == null ? "—" : escapeHtml(num(stats.pressure, 2))}</strong></article><article class="support"><span>支撑位</span><strong>${stats.support == null ? "—" : escapeHtml(num(stats.support, 2))}</strong></article><article><span>行业风控分</span><strong>${sectorScore.score == null ? "—" : escapeHtml(num(sectorScore.score, 1))}</strong></article></div></div>
    <div class="material-industry-text-grid"><section><span>当日行业行情观点</span>${corpus.length ? corpus.map((item) => `<div class="corpus-quote"><strong>${escapeHtml(item.title)}</strong>${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}<small>${escapeHtml(item.source || "系统当日语料包")}</small></div>`).join("") : `<p class="placeholder-copy">暂无当日行业研判</p>`}</section><section><span>对当前组合的影响说明</span><p>当前组合持仓：${escapeHtml(holdingsText)}</p><p>${escapeHtml(sectorScore.change_explanation || "暂无当日行业影响说明")}</p></section><section><span>行业后市展望</span><p>${escapeHtml(outlook)}</p></section></div>
  </article>`;
}

function renderMaterialHoldingsModal() {
  const holdings = getCurrentHoldingRows();
  const portfolioId = getCurrentPortfolio()?.id || "__default__";
  const plan = state.adjustmentReasonResultByPortfolio[portfolioId] || null;
  return `<div class="material-trace-stack"><section class="material-trace-section"><div class="material-trace-section-head"><div><span>当前组合</span><h3>持仓情况</h3><p>只读展示当前组合持仓，不提供交易或下单入口。</p></div><b>${holdings.length} 只</b></div><div class="material-holdings-table"><table><thead><tr><th>证券</th><th>代码</th><th>申万行业</th><th>仓位</th><th>最新价</th><th>持有收益率</th></tr></thead><tbody>${holdings.length ? holdings.map((item) => `<tr><td><strong>${escapeHtml(item.stock || "—")}</strong></td><td>${escapeHtml(item.code || "—")}</td><td>${escapeHtml(holdingSkillInsight(item.code)?.industry || item.industry || "未识别")}</td><td>${item.weight === "" || item.weight == null ? "—" : `${escapeHtml(num(item.weight, 1))}%`}</td><td>${item.latest_price === "" || item.latest_price == null ? "—" : escapeHtml(num(item.latest_price, 2))}</td><td>${item.return_pct === "" || item.return_pct == null ? "—" : escapeHtml(String(item.return_pct))}</td></tr>`).join("") : `<tr><td colspan="6">当前组合暂无持仓</td></tr>`}</tbody></table></div></section><section class="material-trace-section"><div class="material-trace-section-head"><div><span>华泰技能 · 只读分析</span><h3>持仓压力支撑与交易策略</h3><p>每只持仓展示独立K线、压力支撑、止盈止损、基本交易计划及行业代表性理由。</p></div><b>${escapeHtml(state.holdingSkillAnalysis?.snapshot_date || "同步中")}</b></div>${renderHoldingSkillCards(holdings, "material")}</section><section class="material-trace-section"><div class="material-trace-section-head"><div><span>原调仓留痕</span><h3>最近一次调仓理由与每日计划</h3><p>展示“交易与持仓”页面最近一次生成的调仓理由，作为补充留痕。</p></div></div>${plan ? renderMaterialReadonlyPlan(plan) : `<div class="material-trace-placeholder">暂无已生成的调仓理由；当前持仓的华泰技能交易策略已在上方展示。</div>`}</section></div>`;
}

function renderMaterialReadonlyPlan(result) {
  const items = Array.isArray(result.items) ? result.items : [];
  return `<div class="material-readonly-plan">${items.map((item, index) => `<article><header><span>${index + 1}</span><strong>${escapeHtml(item.stock || "本次调仓")}</strong><b>${escapeHtml(item.action || "调仓")}</b></header><div><span>预计持有</span><p>${escapeHtml(item.expected_holding_days || "待确认")}</p></div><div><span>调仓理由</span><p>${escapeHtml(item.action_reason || "—")}</p></div><div><span>基本面逻辑</span><p>${escapeHtml(item.fundamental_logic || "—")}</p></div><div><span>技术面逻辑</span><p>${escapeHtml(item.technical_logic || "—")}</p></div><div><span>每日交易计划</span>${adjustmentReasonPlanRows(item).map((row) => `<p><strong>${escapeHtml(row.phase)}：</strong>${escapeHtml(row.plan)}</p>`).join("") || `<p>暂无可执行计划</p>`}</div></article>`).join("") || `<div class="material-trace-placeholder">本次结果没有可展示标的</div>`}</div>`;
}

function renderMaterialFrontModal(analysis) {
  if (!state.materialFrontModal) return "";
  const isOperations = state.materialFrontModal === "operations";
  let content = "";
  if (isOperations && state.materialFrontLoading) content = `<div class="material-modal-loading"><span></span><strong>正在读取每日调仓记录、风控结果和行业K线…</strong><p>首次加载行情可能需要数秒。</p></div>`;
  else if (isOperations && state.materialFrontError) content = `<div class="material-modal-error"><strong>数据读取失败</strong><p>${escapeHtml(state.materialFrontError)}</p><button class="pill-btn primary" type="button" data-material-front-retry>重新读取</button></div>`;
  else content = isOperations ? renderMaterialOperationsModal(analysis) : renderMaterialHoldingsModal();
  return `<div class="material-front-modal" role="dialog" aria-modal="true" aria-labelledby="materialFrontModalTitle"><div class="material-front-modal-window"><header class="material-front-modal-head"><div><span>股票组合每日展示</span><h2 id="materialFrontModalTitle">${isOperations ? "组合运作基本情况" : "持仓情况及交易计划"}</h2><p>${escapeHtml(analysis.name || "当前组合")} · 客户只读展示</p></div><button type="button" data-material-front-close aria-label="关闭弹窗">×</button></header><div class="material-front-modal-body">${content}</div></div></div>`;
}

function renderMaterialFrontEntries(analysis) {
  return `<section class="material-front-entries"><div class="material-front-entries-head"><div><span>客户展示工作台</span><h2>组合每日透明化展示</h2><p>固定在物料生成界面最前端；点击卡片以弹窗查看，全部为只读信息。</p></div><b>${escapeHtml(analysis.summary.latest_snapshot_date || "今日")}</b></div><div class="material-front-entry-grid"><button type="button" class="material-front-entry operations" data-material-front-open="operations"><span>01</span><div><strong>组合运作基本情况</strong><p>每日风控留痕 · 指数压力支撑 · 申万二级行业分析</p></div><b>打开展示 →</b></button><button type="button" class="material-front-entry holdings" data-material-front-open="holdings"><span>02</span><div><strong>持仓情况及交易计划</strong><p>当前持仓 · 最近调仓理由 · 每日交易计划</p></div><b>打开展示 →</b></button></div></section>`;
}

function syncMaterialFrontPortal(analysis) {
  document.getElementById("materialFrontPortal")?.remove();
  if (!state.materialFrontModal) return;
  const portal = document.createElement("div");
  portal.id = "materialFrontPortal";
  portal.innerHTML = renderMaterialFrontModal(analysis);
  document.body.appendChild(portal);
}

async function waitForMaterialRiskLoad(timeoutMs = 60000) {
  const startedAt = Date.now();
  while (state.riskDashboardLoading || state.riskWorkspaceLoading) {
    if (Date.now() - startedAt > timeoutMs) throw new Error("风控数据读取超时，请重试");
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
}

async function loadMaterialFrontData(analysis, force = false) {
  const portfolioId = state.currentPortfolioId || "";
  state.materialFrontLoading = true;
  state.materialFrontError = "";
  if (state.materialFrontPortfolioId !== portfolioId) state.materialSectorDetails = {};
  renderMaterial(analysis);
  try {
    await Promise.all([loadRiskDashboard(force), loadRiskWorkspace(force)]);
    await waitForMaterialRiskLoad();
    if (state.riskDashboardError) throw new Error(state.riskDashboardError);
    if (state.riskWorkspaceError) throw new Error(state.riskWorkspaceError);
    const codes = materialIndustryGroups().map((item) => item.code).filter(Boolean);
    const detailRows = await Promise.all(codes.map(async (code) => {
      if (state.materialSectorDetails[code] && !force) return [code, state.materialSectorDetails[code]];
      const params = new URLSearchParams({ industry_code: code });
      if (force) params.set("refresh", "1");
      const response = await fetch(`/api/v1/risk/sector-detail?${params}`, { cache: "no-store" });
      const detail = await response.json();
      if (!response.ok || detail.ok === false) return [code, { ok: false, error: detail.error || `HTTP ${response.status}` }];
      return [code, detail];
    }));
    state.materialSectorDetails = { ...state.materialSectorDetails, ...Object.fromEntries(detailRows) };
    state.materialFrontPortfolioId = portfolioId;
  } catch (error) {
    state.materialFrontError = error.message || String(error);
  } finally {
    state.materialFrontLoading = false;
    if (state.materialFrontModal === "operations" && state.activeTab === "material") renderMaterial(getCurrentAnalysis() || analysis);
  }
}

function renderMaterialFrontCharts() {
  if (typeof echarts === "undefined") return;
  if (state.materialFrontModal === "holdings") {
    renderHoldingSkillCharts("material");
    return;
  }
  if (state.materialFrontModal !== "operations") return;
  const indexKline = (state.riskWorkspace?.indices || []).find((item) => item.code === "1.000001") || (state.riskWorkspace?.indices || [])[0] || {};
  const rows = [["materialMarketIndexChart", indexKline]];
  materialIndustryGroups().forEach((group, index) => rows.push([`materialIndustryChart-${index}`, state.materialSectorDetails[group.code]?.kline || {}]));
  rows.forEach(([id, kline]) => {
    const dom = document.getElementById(id);
    if (!dom || !(kline.dates || []).length) return;
    const stats = materialKlineStats(kline);
    const annotations = [
      ...(stats.pressure == null ? [] : [{ type: "pressure", label: "压力位", price: stats.pressure }]),
      ...(stats.support == null ? [] : [{ type: "pressure", label: "支撑位", price: stats.support }]),
    ];
    const chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
    chart.setOption(riskKlineOption(kline, annotations), true);
  });
}

function bindMaterialFrontControls(scope, analysis) {
  scope.querySelectorAll("[data-material-front-open]").forEach((button) => button.addEventListener("click", () => {
    const nextModal = button.dataset.materialFrontOpen;
    const needsOperationsLoad = nextModal === "operations" && (state.materialFrontPortfolioId !== (state.currentPortfolioId || "") || !state.riskDashboard || !state.riskWorkspace);
    const needsHoldingSkillLoad = nextModal === "holdings" && (!state.holdingSkillAnalysis || state.holdingSkillAnalysisPortfolioId !== (state.currentPortfolioId || ""));
    state.materialFrontModal = nextModal;
    if (needsOperationsLoad) state.materialFrontLoading = true;
    if (needsHoldingSkillLoad) state.holdingSkillAnalysisLoading = true;
    renderMaterial(analysis);
    if (needsOperationsLoad) loadMaterialFrontData(analysis);
    if (needsHoldingSkillLoad) {
      state.holdingSkillAnalysisLoading = false;
      loadHoldingSkillAnalysis();
    }
  }));
  scope.querySelectorAll("[data-material-front-close]").forEach((button) => button.addEventListener("click", () => {
    state.materialFrontModal = "";
    renderMaterial(analysis);
  }));
  const overlay = scope.querySelector(".material-front-modal");
  if (overlay) overlay.addEventListener("click", (event) => {
    if (event.target !== overlay) return;
    state.materialFrontModal = "";
    renderMaterial(analysis);
  });
  scope.querySelectorAll("[data-material-front-retry]").forEach((button) => button.addEventListener("click", () => loadMaterialFrontData(analysis, true)));
  bindHoldingSkillControls(scope);
  if (
    (state.materialFrontModal === "operations" && !state.materialFrontLoading && !state.materialFrontError) ||
    (state.materialFrontModal === "holdings" && !state.holdingSkillAnalysisLoading && !state.holdingSkillAnalysisError)
  ) window.setTimeout(renderMaterialFrontCharts, 0);
  if (!window.__materialFrontEscapeBound) {
    window.__materialFrontEscapeBound = true;
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !state.materialFrontModal) return;
      state.materialFrontModal = "";
      if (state.activeTab === "material") renderMaterial(getCurrentAnalysis());
    });
  }
}

function renderMaterial(analysis) {
  const container = document.getElementById("view-material");
  if (!container) return;
  const scripts = buildMaterialScripts(analysis);
  const dates = getMaterialDateOptions(analysis);
  const selectedDate = state.selectedMaterialDate || dates[0] || formatDateObject(new Date());
  if (state.activeTab === "material" && state.materialSourceSummary?.requested_date !== selectedDate) {
    refreshMaterialSourceSummary(selectedDate).then(() => {
      if (state.activeTab === "material") renderMaterial(analysis);
    });
  }
  materialCopyMap = new Map(scripts.map((item) => [item.id, item.text]));
  const combined = scripts.map((item) => `【${item.title}】\n${item.text}`).join("\n\n");
  materialCopyMap.set("all", combined);
  container.innerHTML = `
    ${renderMaterialFrontEntries(analysis)}
    ${renderMaterialImagePanel(analysis, scripts)}
    <div class="panel-card" style="margin-bottom:14px;">
      <div class="section-title-row">
        <div>
          <h3>文字话术物料</h3>
          <p class="lead">基于当前组合、主理人画像、持仓变化和逻辑验证，生成多场景可复制的对客话术。</p>
        </div>
        <button class="pill-btn primary" type="button" data-material-copy="all">复制整套物料</button>
      </div>
      <div class="overview-grid" style="margin-top:12px;">
        <div class="metric-card blue">
          <div class="metric-title">当前组合</div>
          <div class="metric-value" style="font-size:22px;">${escapeHtml(analysis.name || "主理人组合")}</div>
          <div class="metric-note">${escapeHtml(analysis.profile.tradingStyle)} · ${escapeHtml(analysis.profile.boardFocus)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">持仓数量</div>
          <div class="metric-value">${analysis.summary.open_count || 0}</div>
          <div class="metric-note">${analysis.summary.latest_snapshot_date || "等待持仓日"}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">胜率样本</div>
          <div class="metric-value">${pct(analysis.summary.win_rate)}</div>
          <div class="metric-note">${analysis.summary.trade_count || 0} 笔闭环交易</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">生成场景</div>
          <div class="metric-value">${scripts.length}</div>
          <div class="metric-note">私聊/社群/朋友圈/电话/风险/复盘</div>
        </div>
      </div>
    </div>
    <div class="bento-grid">
      ${scripts.map((item) => `
        <div class="panel-card bento-col-6">
          <div class="section-title-row">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p class="lead">${escapeHtml(item.scene)}</p>
            </div>
            <button class="pill-btn secondary" type="button" data-material-copy="${escapeHtml(item.id)}">复制</button>
          </div>
          <div class="fold-copy" style="white-space:pre-wrap; margin-top:12px;">${escapeHtml(item.text)}</div>
        </div>
      `).join("")}
    </div>
  `;
  syncMaterialFrontPortal(analysis);
  bindMaterialCopyControls(container);
  bindMaterialImageControls(container, analysis, scripts);
  bindMaterialFrontControls(document, analysis);
}

function bindMaterialCopyControls(scope = document) {
  scope.querySelectorAll("[data-material-copy]").forEach((button) => {
    if (button.dataset.materialBound === "true") return;
    button.dataset.materialBound = "true";
    button.addEventListener("click", async () => {
      const textToCopy = materialCopyMap.get(button.dataset.materialCopy) || "";
      if (!textToCopy) return;
      await navigator.clipboard.writeText(textToCopy);
      const oldText = button.textContent;
      button.textContent = "已复制";
      window.setTimeout(() => {
        button.textContent = oldText;
      }, 1400);
    });
  });
}

function bindMaterialImageControls(scope, analysis, scripts) {
  const select = scope.querySelector("#materialDateSelect");
  if (select) {
    select.addEventListener("change", async () => {
      state.selectedMaterialDate = select.value;
      persistState();
      await refreshMaterialSourceSummary(select.value);
      renderMaterial(analysis);
    });
  }
  const renderStructuredImage = async (button, kind) => {
    const statusEl = scope.querySelector("#materialImageStatus");
    const oldText = button.textContent;
    const label = kind === "advisor_poster" ? "早评海报" : kind === "portfolio_review" ? "组合复盘图" : "资讯长图";
    button.disabled = true;
    button.textContent = "生成中...";
    if (statusEl) statusEl.textContent = `正在用 HTML/CSS 排版并截图生成${label}...`;
    try {
      const dates = getMaterialDateOptions(analysis);
      const targetDate = state.selectedMaterialDate || dates[0] || formatDateObject(new Date());
      if (kind === "portfolio_review") {
        if (statusEl) statusEl.textContent = "正在识别持仓与调仓明细对应的申万二级行业...";
        await ensurePortfolioReviewIndustries(targetDate);
        if (statusEl) statusEl.textContent = "申万二级行业已补全，正在生成组合复盘图...";
      }
      const latestAnalysis = getCurrentAnalysis() || analysis;
      const data = kind === "portfolio_review" ? buildPortfolioReviewPayload(latestAnalysis) : undefined;
      const result = await postJson("/api/material/render-image", {
        kind,
        date: targetDate,
        ...(data ? { data } : {})
      });
      if (!result?.ok) throw new Error(result?.error || `${label}生成失败`);
      state.materialImageResult = result;
      state.materialSourceSummary = {
        ...(result.source_summary || {}),
        requested_date: targetDate
      };
      persistState();
      renderMaterial(analysis);
      actionStatusEl.textContent = `${label}已生成。`;
    } catch (error) {
      if (statusEl) statusEl.textContent = `${label}生成失败：${error.message}`;
      actionStatusEl.textContent = `${label}生成失败：${error.message}`;
    } finally {
      const nextButton = kind === "advisor_poster"
        ? document.getElementById("renderAdvisorPosterBtn")
        : kind === "portfolio_review"
          ? document.getElementById("renderPortfolioReviewBtn")
          : document.getElementById("renderDailyDigestBtn");
      if (nextButton) {
        nextButton.disabled = false;
        nextButton.textContent = oldText;
      }
    }
  };
  const digestButton = scope.querySelector("#renderDailyDigestBtn");
  if (digestButton) {
    digestButton.addEventListener("click", () => renderStructuredImage(digestButton, "daily_digest"));
  }
  const posterButton = scope.querySelector("#renderAdvisorPosterBtn");
  if (posterButton) {
    posterButton.addEventListener("click", () => renderStructuredImage(posterButton, "advisor_poster"));
  }
  const portfolioReviewButton = scope.querySelector("#renderPortfolioReviewBtn");
  if (portfolioReviewButton) {
    portfolioReviewButton.addEventListener("click", () => renderStructuredImage(portfolioReviewButton, "portfolio_review"));
  }
  const button = scope.querySelector("#generateMaterialImageBtn");
  if (!button) return;
  button.addEventListener("click", async () => {
    const statusEl = scope.querySelector("#materialImageStatus");
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = "生成中...";
    if (statusEl) statusEl.textContent = "正在调用 Doubao-Seedream-5.0-lite 生成图片物料，可能需要几十秒...";
    try {
      const payload = buildMaterialImagePayload(analysis, scripts);
      const result = await postJson("/api/material/image", payload);
      if (!result?.ok) throw new Error(result?.error || "图片生成失败");
      state.materialImageResult = result;
      state.materialSourceSummary = {
        ...(result.source_summary || {}),
        requested_date: payload.date
      };
      persistState();
      renderMaterial(analysis);
      actionStatusEl.textContent = "图片物料已生成。请打开预览检查文字准确性后再对外发送。";
    } catch (error) {
      if (statusEl) statusEl.textContent = `图片物料生成失败：${error.message}`;
      actionStatusEl.textContent = `图片物料生成失败：${error.message}`;
    } finally {
      const nextButton = document.getElementById("generateMaterialImageBtn");
      if (nextButton) {
        nextButton.disabled = false;
        nextButton.textContent = oldText;
      }
    }
  });
}

function buildPersonaCoreMetrics(analysis) {
  const current = getCurrentPortfolio();
  const dataset = current?.dataset || {};
  const currentHoldingRows = getCurrentHoldingRows();

  // 数据源：当前组合持仓 + 申万行业映射缓存。客群匹配与对客话术共用这一份申万二级行业结果。
  const sectorMap = new Map();
  const resolveHoldingSector = (item) => {
    const code = extractCode(item.code || item.stock || "");
    const mappedIndustry = state.industryCache?.[code] || {};
    return [mappedIndustry.industry_name, item.industry, item.industry_name]
      .map(cleanText)
      .find((sector) => sector && !["未识别", "待补全", "未知"].includes(sector)) || "";
  };
  currentHoldingRows.forEach((item) => {
    const sector = resolveHoldingSector(item);
    if (!sector) return;
    const marketValue = parseMoneyValue(item.market_value) || 0;
    const explicitWeight = parseNumber(item.weight);
    const currentStat = sectorMap.get(sector) || { label: sector, count: 0, marketValue: 0, explicitWeight: 0 };
    currentStat.count += 1;
    currentStat.marketValue += marketValue;
    currentStat.explicitWeight += explicitWeight || 0;
    sectorMap.set(sector, currentStat);
  });
  const unmappedHoldingCount = currentHoldingRows.filter((item) => !resolveHoldingSector(item)).length;
  let sectorBasis = currentHoldingRows.length
    ? "当前持仓 · 申万二级行业映射库"
    : "当前暂无持仓，无法识别申万二级行业";
  let sectors = [...sectorMap.values()];
  const totalSectorMarketValue = sectors.reduce((sumValue, item) => sumValue + item.marketValue, 0);
  const totalExplicitWeight = sectors.reduce((sumValue, item) => sumValue + item.explicitWeight, 0);
  sectors = sectors
    .map((item) => ({
      ...item,
      weight: totalSectorMarketValue > 0
        ? item.marketValue / totalSectorMarketValue * 100
        : totalExplicitWeight > 0
          ? item.explicitWeight / totalExplicitWeight * 100
          : null,
    }))
    .sort((a, b) => (b.marketValue || b.count) - (a.marketValue || a.count));

  // 2. 近一年收益：按每日组合涨跌复利，绝不把平均单笔收益当成年收益。
  const snapshots = (dataset.daily_snapshots || dataset.snapshots || [])
    .map((snapshot) => ({
      date: getSnapshotDate(snapshot),
      dayPct: parseNumber(snapshot?.summary?.dayPct ?? snapshot?.summary?.day_pct),
      nav: parseNumber(snapshot?.summary?.net_value ?? snapshot?.summary?.nav),
    }))
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestDate = snapshots.at(-1)?.date || formatDateObject(new Date());
  const latestMs = toDateMs(latestDate) || Date.now();
  const cutoffMs = latestMs - 365 * 24 * 60 * 60 * 1000;
  const trailingSnapshots = snapshots.filter((item) => (toDateMs(item.date) || 0) >= cutoffMs);
  const dayReturns = trailingSnapshots.map((item) => item.dayPct).filter((value) => value != null);
  let trailingReturn = null;
  let returnMethod = "每日组合涨跌复利";
  if (dayReturns.length) {
    trailingReturn = (dayReturns.reduce((netValue, value) => netValue * (1 + value / 100), 1) - 1) * 100;
  } else {
    const navPoints = trailingSnapshots.filter((item) => item.nav != null && item.nav > 0);
    if (navPoints.length >= 2) {
      trailingReturn = (navPoints.at(-1).nav / navPoints[0].nav - 1) * 100;
      returnMethod = "组合净值区间收益";
    } else {
      const oneYearTrades = (analysis.trades || []).filter((trade) => {
        const tradeMs = toDateMs(trade.sell_date || trade.buy_date);
        return tradeMs != null && tradeMs >= cutoffMs && tradeMs <= latestMs;
      });
      const tradeReturns = oneYearTrades.map((trade) => trade.return_pct).filter((value) => value != null);
      trailingReturn = average(tradeReturns);
      returnMethod = "无连续净值时采用近一年已平仓单笔平均收益";
    }
  }
  const returnStart = trailingSnapshots[0]?.date || latestDate;
  const returnEnd = trailingSnapshots.at(-1)?.date || latestDate;
  const returnSampleDays = Math.max(1, Math.round(((toDateMs(returnEnd) || latestMs) - (toDateMs(returnStart) || latestMs)) / 86400000) + 1);

  // 3. 交易频次：后台事件账本优先；旧数据没有账本时再用闭环交易推算。
  const ledgerEvents = (dataset.transaction_ledger || [])
    .filter((item) => ["buy", "sell", "sell_all", "set", "remove"].includes(String(item.action || "").toLowerCase()))
    .filter((item) => {
      const eventMs = toDateMs(item.date || item.event_date);
      return eventMs != null && eventMs >= cutoffMs && eventMs <= latestMs;
    });
  const fallbackEvents = (analysis.trades || []).flatMap((trade) => [trade.buy_date, trade.sell_date].filter(Boolean).map((date) => ({ date })));
  const frequencyEvents = ledgerEvents.length ? ledgerEvents : fallbackEvents.filter((item) => {
    const eventMs = toDateMs(item.date);
    return eventMs != null && eventMs >= cutoffMs && eventMs <= latestMs;
  });
  const eventDates = frequencyEvents.map((item) => normalizeDateInput(item.date || item.event_date)).filter(Boolean).sort();
  const activeTradingDays = unique(eventDates).length;
  const frequencyStart = eventDates[0] || returnStart;
  const frequencyEnd = eventDates.at(-1) || returnEnd;
  const frequencySpanDays = Math.max(1, Math.round(((toDateMs(frequencyEnd) || latestMs) - (toDateMs(frequencyStart) || latestMs)) / 86400000) + 1);
  const monthlyFrequency = frequencyEvents.length / Math.max(1, frequencySpanDays / 30.44);
  const frequencyLabel = monthlyFrequency >= 20
    ? "高频交易"
    : monthlyFrequency >= 8
      ? "中高频交易"
      : monthlyFrequency >= 3
        ? "中频交易"
        : "低频交易";

  return {
    sectors,
    sectorBasis,
    holdingCount: currentHoldingRows.length,
    unmappedHoldingCount,
    trailingReturn,
    returnMethod,
    returnStart,
    returnEnd,
    returnSampleDays,
    eventCount: frequencyEvents.length,
    activeTradingDays,
    operationsPerActiveDay: frequencyEvents.length / Math.max(1, activeTradingDays),
    monthlyFrequency,
    frequencyLabel,
    frequencyStart,
    frequencyEnd,
  };
}

function buildClientScriptLiveContext(metrics) {
  // 数据源：系统当日语料库、研报热点语料与当前行情快照；只取原文摘要，不在页面端改写原始语料。
  const corpusRows = [...(state.feedRecords || []), ...(state.hotRecords || [])]
    .filter((item) => item && (item.date || item.snapshot_date))
    .sort((a, b) => String(b.date || b.snapshot_date || "").localeCompare(String(a.date || a.snapshot_date || "")));
  const latestDate = corpusRows[0]?.date || corpusRows[0]?.snapshot_date || "";
  const currentRows = latestDate
    ? corpusRows.filter((item) => (item.date || item.snapshot_date) === latestDate)
    : corpusRows;
  const sectorNames = new Set(metrics.sectors.map((item) => item.label));
  const relatedRows = currentRows.filter((item) => {
    const text = [item.theme, item.industries, item.market_view, item.core_logic, item.operation_advice, item.risk_warning, item.raw_text]
      .filter(Boolean)
      .join(" ");
    return [...sectorNames].some((sector) => text.includes(sector));
  });
  const selectedRows = (relatedRows.length ? relatedRows : currentRows).slice(0, 6);
  const corpusHighlights = unique(selectedRows.flatMap((item) => [
    item.market_view,
    item.core_logic,
    item.operation_advice,
    item.risk_warning,
    item.summary,
  ]).map(cleanText).filter(Boolean)).slice(0, 4);
  const marketSnapshot = state.marketSnapshot || {};
  const marketParts = unique([
    marketSnapshot.market_view,
    marketSnapshot.summary,
    marketSnapshot.index_view,
    marketSnapshot.risk_warning,
    ...(Array.isArray(marketSnapshot.risks) ? marketSnapshot.risks.map((item) => item?.text || item?.title || item) : []),
  ].map(cleanText).filter(Boolean)).slice(0, 3);
  return {
    latestDate,
    corpusHighlights,
    marketParts,
    text: [...corpusHighlights, ...marketParts].join("；"),
  };
}

function buildAdvisorClientCommunication(analysis, metrics) {
  const topSectors = metrics.sectors.slice(0, 3);
  const sectorNames = metrics.sectors.map((item) => item.label).join("、") || "申万二级行业映射暂未完成";
  const mainSector = topSectors[0]?.label || "当前持仓行业";
  const mainSectorWeight = topSectors[0]?.weight;
  const highFrequency = metrics.monthlyFrequency >= 20;
  const mediumFrequency = !highFrequency && metrics.monthlyFrequency >= 8;
  const concentrated = mainSectorWeight != null && mainSectorWeight >= 45;
  const returnText = metrics.trailingReturn == null ? "尚无连续净值区间" : pct(metrics.trailingReturn, 2);
  const sampleText = `${metrics.returnStart} 至 ${metrics.returnEnd}，共 ${metrics.returnSampleDays} 个自然日`;
  const frequencyText = `${metrics.frequencyLabel}，后台账本记录 ${metrics.eventCount} 次调仓、${metrics.activeTradingDays} 个活跃交易日，约 ${num(metrics.monthlyFrequency, 1)} 次/月`;
  const liveContext = buildClientScriptLiveContext(metrics);
  const holdingNames = getCurrentHoldingRows().map((item) => item.stock).filter(Boolean).join("、") || "当前持仓明细暂未同步";

  const customerTags = highFrequency
    ? ["时间充裕型", "短线/做T偏好", "执行及时", "接受高换手"]
    : mediumFrequency
      ? ["有一定盯盘时间", "轮动偏好", "接受波段换手", "执行稳定"]
      : ["忙碌型", "持有型", "偏好盘后计划", "低频执行"];
  customerTags.push("知识型/爱学习");
  if (concentrated) customerTags.push(`理解${mainSector}波动`);
  if ((metrics.trailingReturn ?? 0) < 0) customerTags.push("可承受阶段回撤");

  const avoidTags = highFrequency
    ? ["无法及时看盘", "只接受低频持有", "执行经常延迟"]
    : ["追求日内高频", "要求即时做T", "无法耐心持有"];
  if (concentrated) avoidTags.push("不能接受行业集中");
  avoidTags.push("保本或收益承诺诉求");

  const primaryMode = highFrequency || mediumFrequency
    ? "条件升佣 + 进阶服务（优先）"
    : "条件升佣 + 基础服务（优先）";
  const modeReason = highFrequency
    ? "主理人真实换手较快，客户需要及时接收并自主执行指令；先用条件升佣降低首次决策门槛，再用盘中提醒和调仓解释体现服务价值。"
    : mediumFrequency
      ? "主理人以波段和轮动为主，条件升佣便于客户先观察交易节奏，再根据全账户管理需求升级。"
      : "主理人交易节奏偏低，适合用盘后计划和阶段复盘承接忙碌型客户，先观察、再决定是否跟投。";
  const upgradeRule = "只有交易指令实现 2% 及以上收益时才收取千三佣金；如果主理人没有提示减仓或清仓、客户自行卖出持仓，也会触发千三佣金；除此之外的情况均不收取这笔佣金。";

  const serviceRights = unique([
    "盘面实时应对方案与行情解读",
    `申万二级行业与个股逻辑拆解：${sectorNames}`,
    "包含压力位、支撑位的可执行交易计划",
    "日内做T实操方法",
    "极端风险下的期权、期货对冲思路",
    "持仓、调仓与风险复盘",
  ]);

  const returnDisclosure = metrics.trailingReturn == null
    ? `组合${sampleText}尚未形成足够连续净值，不能用单笔收益代替组合业绩。`
    : metrics.trailingReturn < 0
      ? `当前可验证区间收益为 ${returnText}（${sampleText}），近期波动与回撤必须提前说明，不能包装成低波稳健组合。`
      : `当前可验证区间收益为 ${returnText}（${sampleText}），但样本尚${metrics.returnSampleDays >= 365 ? "覆盖一年" : "不足一年"}，不能外推或承诺未来收益。`;
  const concentrationDisclosure = concentrated
    ? `当前第一行业为${mainSector}，市值占比约 ${pct(mainSectorWeight, 1)}，行业景气变化会明显影响组合净值。`
    : metrics.sectors.length
      ? `当前持仓映射出 ${metrics.sectors.length} 个申万二级行业，仍需持续观察板块轮动和集中度变化。`
      : "当前持仓的申万二级行业映射暂未完成，行业判断将在数据补齐后自动更新。";

  const marketSentence = liveContext.text
    ? `结合${liveContext.latestDate || "当日"}系统语料，眼下需要重点留意的是：${liveContext.text}。`
    : "当日行情语料暂未同步，服务端会在语料到位后自动补充盘面判断，不会用历史结论冒充实时观点。";
  const serviceValueText = `服务不只是告诉您买什么、卖什么。我们会结合盘面实时变化给出应对方案和行情解读，把${sectorNames}这些持仓对应行业拆开讲清楚，也会说明${holdingNames}等个股为什么值得跟踪，帮助您逐步形成自己的选股和研判框架。落到交易上，每次都会尽量把压力位、支撑位和执行条件说清楚，形成可落地的计划；盘中有条件时会讲日内做T的具体方法，遇到极端风险，也会说明怎样借助期权、期货做对冲。这样既能帮助您看懂市场、持续学习，也能把判断落实到交易和风险控制上。`;
  const commissionText = `收费采用利益绑定的共赢方式：只有交易指令实际跑出 2% 及以上收益时，才收取千三佣金；还有一种情况是主理人没有提示减仓或清仓，但您自行卖出了持仓，也会触发千三佣金。除此之外，其余情况都不收取这笔佣金。这样设计，是希望大家一起面对市场波动，行情弱的时候先尽量控制回撤、少亏钱，机会出现时再一起把握收益。`;

  const scripts = [
    {
      id: "first_contact",
      title: "自然开场版",
      scene: "适合微信首次沟通或电话介绍",
      text: `您好，我先不讲一堆产品术语，直接说说这套服务能为您做什么。当前组合持仓主要落在${sectorNames}，真实交易节奏是${frequencyText}。${marketSentence}\n\n${serviceValueText}\n\n${commissionText}\n\n当然，组合建议不等于收益承诺，最终交易还是由您自主决定。您更想先看当前持仓和交易计划，还是先听我讲讲这些行业现在的机会和风险？`,
    },
    {
      id: "core_fit",
      title: "服务价值深聊版",
      scene: "适合客户希望了解具体能得到什么时",
      text: `如果您想判断这项服务值不值得长期用，可以先看它能不能同时解决“看不懂”和“不会做”两个问题。${marketSentence}\n\n${serviceValueText}\n\n当前组合真实覆盖${sectorNames}，${concentrationDisclosure}${returnDisclosure}这些数据都会如实展示，不会只挑好看的部分讲。\n\n${commissionText}\n\n如果您愿意，我可以接着用一只当前持仓举例，把行业逻辑、关键价位、做T和止损怎么衔接完整讲一遍。`,
    },
    {
      id: "research_client",
      title: "学习成长版",
      scene: "适合希望边做边学、提升选股能力的客户",
      text: `如果您不想长期只依赖别人报代码，这套服务更重要的价值，是把判断过程也交给您。${marketSentence}\n\n${serviceValueText}\n\n我们会把系统语料、行业变化、持仓理由和后续验证串起来，您可以慢慢看懂为什么选这些方向、什么情况下继续持有、什么情况下需要收缩风险。${returnDisclosure}\n\n${commissionText}\n\n您可以先告诉我，您现在最想提升的是看盘、选股，还是交易执行，我会从当前组合里挑最合适的例子和您讲。`,
    },
    {
      id: "mode_and_rights",
      title: "服务与收费说明版",
      scene: "适合客户直接询问服务内容和收费规则时",
      text: `可以，我把服务和收费一次说清楚。${marketSentence}\n\n${serviceValueText}\n\n${commissionText}\n\n这属于投顾建议服务，不是替您操作账户，也不承诺收益；最终是否执行由您自己决定，正式服务边界以协议为准。您如果方便，我再把当前持仓对应的行业、压力支撑和下一步交易计划发给您看，内容会更直观。`,
    },
    {
      id: "risk_close",
      title: "风险提示与合规收尾",
      scene: "适合客户准备签约或要求收益承诺时",
      text: `在您决定之前，我也把边界讲清楚。${returnDisclosure}${concentrationDisclosure}${highFrequency ? "组合换手较快，如果不能及时查看并自主执行提醒，实际体验可能与组合记录有差异。" : "组合需要按计划持有，如果频繁追涨杀跌，也可能偏离原来的节奏。"}\n\n${serviceValueText}\n\n${commissionText}\n\n过往表现不代表未来收益，这项服务提供的是研究、计划和风险应对，不是保本承诺。您可以先核对资金期限、风险承受能力和执行时间，再决定是否匹配。`,
    },
  ];

  return {
    customerTags,
    avoidTags,
    primaryMode,
    modeReason,
    upgradeRule,
    serviceRights,
    liveContext,
    scripts,
  };
}

function buildClientPersonaApiPayload(analysis, metrics, communication) {
  const portfolio = getCurrentPortfolio();
  // 数据源：当前持仓、申万二级行业聚合、系统当日语料与行情快照，一次性传给话术生成接口。
  return {
    schema_version: "client_persona_v2",
    portfolio_id: portfolio?.id || analysis.name,
    portfolio_name: analysis.name,
    portfolio_facts: {
      sectors: metrics.sectors.map((item) => ({
        name: item.label,
        weight: item.weight,
        stock_count: item.count || 0,
      })),
      sector_basis: metrics.sectorBasis,
      holding_count: metrics.holdingCount,
      unmapped_holding_count: metrics.unmappedHoldingCount,
      trailing_return: metrics.trailingReturn,
      trailing_return_text: metrics.trailingReturn == null ? "暂无足够连续净值" : pct(metrics.trailingReturn, 2),
      return_period: `${metrics.returnStart} 至 ${metrics.returnEnd}`,
      return_sample_days: metrics.returnSampleDays,
      return_method: metrics.returnMethod,
      monthly_frequency: metrics.monthlyFrequency,
      frequency_label: metrics.frequencyLabel,
      frequency_text: `${metrics.frequencyLabel}，约 ${num(metrics.monthlyFrequency, 1)} 次/月，${metrics.eventCount} 次调仓操作`,
      event_count: metrics.eventCount,
      active_trading_days: metrics.activeTradingDays,
      customer_tags: communication.customerTags,
      avoid_tags: communication.avoidTags,
      primary_mode: communication.primaryMode,
      service_rights: communication.serviceRights,
      conditional_commission_rule: communication.upgradeRule,
      style_tags: analysis.styleTags || [],
      current_holdings: (analysis.openPositions || []).slice(0, 20).map((item) => ({
        stock: item.stock || item.name || "",
        code: item.code || "",
        industry: item.industry_name || item.industry || "",
      })),
      main_risks: (analysis.risks || []).slice(0, 8).map((item) => ({ title: item.title, text: item.text })),
    },
    current_market: state.marketSnapshot || {},
    today_corpus: {
      date: communication.liveContext?.latestDate || "",
      highlights: communication.liveContext?.corpusHighlights || [],
      market_signals: communication.liveContext?.marketParts || [],
    },
    advisor_profile: state.advisorStrategyProfile?.profile || state.advisorStrategyProfile || {},
  };
}

function buildImmediateClientPersonas(metrics, communication) {
  const sectors = metrics.sectors.slice(0, 3).map((item) => item.label).join("、") || "当前重点行业";
  const returnText = metrics.trailingReturn == null ? "暂无足够连续净值" : pct(metrics.trailingReturn, 2);
  const period = `${metrics.returnStart} 至 ${metrics.returnEnd}`;
  const frequency = `${metrics.frequencyLabel}，约 ${num(metrics.monthlyFrequency, 1)} 次/月`;
  const commonRisk = `历史收益统计区间为${period}，过往表现不代表未来收益；本服务提供组合建议，交易由客户自主决定。`;
  return [
    {
      id: "balanced_industry_tilt", persona_name: "均衡配置型（压行业）", match_level: metrics.sectors.length ? "高匹配" : "条件匹配",
      profile_tags: ["均衡底仓", "行业增强", "关注轮动"], core_need: "保持整体均衡，同时在看好的行业上适度增加权重",
      communication_angle: "先展示全部申万二级行业暴露，再讲重点行业为何值得压权重和何时退出", avoid_expression: "把行业集中说成稳赚，或忽略单一行业回撤风险",
      match_reason: metrics.sectors.length ? `当前持仓覆盖${sectors}，可以用行业权重、景气和风险边界解释均衡中的重点配置。` : "当前行业映射尚未完成，需等持仓行业补齐后再判断行业倾斜是否合适。",
      full_script: `如果您希望组合不是平均撒网，而是在整体均衡的基础上对看好的行业适当提高权重，我们会先把${sectors}这些申万二级行业的真实暴露讲清楚，再结合当下行情说明为什么倾斜、关键风险在哪里、什么条件下应该收缩。交易端会同步压力位、支撑位、做T与止损计划，极端风险下也会讲期权期货对冲思路。${commonRisk}\n\n您更希望重点行业的权重偏积极一些，还是先从相对均衡的配置开始？`,
      service_focus: ["行业权重拆解", "景气与个股逻辑", "压力支撑与退出纪律"], priority: 1,
    },
    {
      id: "balanced_allocation", persona_name: "均衡配置型客户", match_level: "高匹配",
      profile_tags: ["收益风险并重", "接受波段", "关注组合结构"], core_need: "在收益弹性与风险控制之间取得平衡",
      communication_angle: "同时展示板块覆盖、组合收益和调仓节奏", avoid_expression: "只讲单只明星股或单次盈利",
      match_reason: "适合用组合层面的结构、节奏和复盘闭环进行沟通。",
      full_script: `如果您希望收益和风险之间有清楚的平衡，这个组合可以从三点判断：主要覆盖${sectors}；${period}可验证收益为${returnText}；真实节奏为${frequency}。服务会把持仓变化、板块逻辑和风险提示放在一起，不只是发股票代码。${commonRisk}\n\n您现在更看重净值稳定，还是希望保留一定成长弹性？`,
      service_focus: ["组合配置", "调仓解释", "收益复盘"], priority: 2,
    },
    {
      id: "growth_aggressive", persona_name: "进取成长型客户", match_level: "条件匹配",
      profile_tags: ["接受波动", "看重弹性", "执行及时"], core_need: "寻找有研究依据的成长机会",
      communication_angle: "突出行业能力圈、催化跟踪与退出纪律", avoid_expression: "把高波动包装成高确定性",
      match_reason: `当前重点行业为${sectors}，需确认客户能承受相关板块波动。`,
      full_script: `如果您愿意承受一定波动来争取成长弹性，关键不是追热点，而是看主理人是否熟悉相关行业、有没有明确的风险收缩条件。当前组合重点覆盖${sectors}，交易节奏为${frequency}，我们会持续跟踪研报催化、持仓变化和风险信号。${commonRisk}\n\n您能接受多大阶段波动，并且是否能及时接收调仓提醒？`,
      service_focus: ["成长主线", "催化跟踪", "风控触发"], priority: 3,
    },
    {
      id: "busy_low_frequency", persona_name: "忙碌低频型客户", match_level: metrics.monthlyFrequency >= 8 ? "低匹配" : "高匹配",
      profile_tags: ["盯盘时间少", "偏好计划", "需要重点摘要"], core_need: "确认自己投入的时间能否跟上组合",
      communication_angle: "直接说明频次、提醒方式和错过执行的影响", avoid_expression: "隐瞒执行要求或制造错过焦虑",
      match_reason: `当前组合为${frequency}，匹配度取决于客户能否及时处理提醒。`,
      full_script: `您平时盯盘时间不多，所以最先要确认的不是收益故事，而是能不能跟上真实节奏。当前组合为${frequency}。我们会尽量用重点摘要、调仓原因和风险提示减少信息负担；但如果无法在合理时间内自主执行，实际体验可能与组合记录不同。${commonRisk}\n\n您通常一天能看几次消息，能否在当日处理重要调整？`,
      service_focus: ["重点摘要", "计划提醒", "执行复盘"], priority: 4,
    },
    {
      id: "research_participant", persona_name: "研究参与型客户", match_level: "高匹配",
      profile_tags: ["关注逻辑", "愿意学习", "重视证据"], core_need: "理解每次调仓背后的依据",
      communication_angle: "展示研报、观点、持仓、调仓和复盘证据链", avoid_expression: "堆砌术语或只给代码不给原因",
      match_reason: `组合围绕${sectors}形成研究与持仓跟踪链路。`,
      full_script: `如果您不只想看买卖信号，而是想知道为什么调整，这套服务更适合从研究证据链来看。当前组合主要覆盖${sectors}，我们会把相关研报、主理人观点、真实持仓、调仓执行和后续复盘串起来，让您能判断逻辑是否真正落实。${commonRisk}\n\n您更想先看行业研究逻辑，还是主理人观点与实际持仓的一致性记录？`,
      service_focus: ["研报解读", "观点验证", "持仓证据链"], priority: 5,
    },
  ];
}

function buildImmediateDimensionScripts(metrics) {
  const sectors = metrics.sectors.slice(0, 3).map((item) => item.label).join("、") || "当前重点行业";
  const returnText = metrics.trailingReturn == null ? "暂无足够连续净值" : pct(metrics.trailingReturn, 2);
  const period = `${metrics.returnStart} 至 ${metrics.returnEnd}`;
  const frequency = `${metrics.frequencyLabel}，约 ${num(metrics.monthlyFrequency, 1)} 次/月`;
  const commonFact = `当前组合主要覆盖${sectors}，${period}可验证收益为${returnText}，实际节奏为${frequency}。`;
  const boundary = "过往表现不代表未来收益，组合建议不等于保本或收益承诺，最终交易由客户自主决定。";
  const dimensions = [
    { id: "risk_preference", title: "风险偏好", description: "客户如何看待回撤与收益弹性", variants: [
      ["risk_steady", "稳健谨慎", "先看风险、对回撤敏感", "建立风险透明度", "您更关心风险能不能看清楚，我们先把真实波动和不适配边界说在前面。", "仓位纪律、行业集中和历史区间", "淡化回撤或暗示保本", "您可接受的阶段回撤大约是多少？"],
      ["risk_growth", "进取成长", "接受波动、看重成长弹性", "说明机会来源与退出纪律", "如果您愿意承受一定波动争取成长弹性，重点要看机会是否有研究支撑和风险收缩条件。", "成长主线、催化跟踪和风控触发", "把高波动包装成高确定性", "您更看重行业弹性，还是调仓反应速度？"],
    ]},
    { id: "investment_experience", title: "投资经验", description: "新手与成熟客户需要不同的信息密度", variants: [
      ["experience_new", "投资新手", "第一次接触组合服务", "降低理解门槛", "我先不用专业术语，用板块、收益口径和调仓次数三件事把组合讲明白。", "服务如何运行、数据如何理解", "堆砌术语或直接给代码", "您想先了解组合怎么运行，还是先看风险提示？"],
      ["experience_mature", "成熟投资者", "有组合管理和市场经验", "提供可验证证据", "您有投资经验，我们直接看组合暴露、收益计算口径、换手强度和风险触发条件。", "结构、归因、频次和证据链", "泛泛讲故事或回避计算方法", "您更希望先核对行业归因，还是交易执行记录？"],
    ]},
    { id: "execution_time", title: "执行时间", description: "判断客户能否跟上真实交易节奏", variants: [
      ["time_busy", "忙碌低频", "工作忙、盯盘时间少", "确认执行是否匹配", "您平时没有太多时间看盘，所以先确认这套组合需要多高的执行频率。", "重点摘要、提醒时效和错过执行的影响", "隐瞒高频要求或制造错过焦虑", "您通常一天能查看几次重要消息？"],
      ["time_active", "可及时执行", "能关注盘面并及时处理提醒", "突出节奏服务价值", "如果您能及时处理组合提醒，这套服务的调仓解释和盘中风险提示会更有价值。", "关键位、调仓原因和风险响应", "把建议说成必须执行的指令", "您希望提醒偏及时，还是偏少而精？"],
    ]},
    { id: "decision_stage", title: "客户决策阶段", description: "首次了解、观察到正式配置逐步沟通", variants: [
      ["stage_first", "首次了解", "刚接触组合", "用三项事实建立兴趣", "我先用一分钟讲清楚这个组合投向哪里、过去可验证表现如何、交易节奏快不快。", "板块、区间收益和频次", "首次沟通堆满权益和收费", "这三项里您最想先深入哪一项？"],
      ["stage_observe", "小仓观察", "认可方向但仍需验证", "降低压力并明确观察点", "如果您暂时不想马上做完整配置，可以先观察主理人的观点、持仓和调仓是否一致。", "观察周期、真实记录和风险复盘", "催促成交或制造稀缺感", "您希望用什么指标作为观察期判断标准？"],
      ["stage_upgrade", "准备正式配置", "完成观察、准备开通服务", "确认适配与服务边界", "正式配置前，我们再核对一次您的风险承受、执行时间和对服务内容的预期。", "适配度、权益、收费和退出边界", "用口头承诺替代正式协议", "还有哪项风险或服务边界需要确认？"],
    ]},
    { id: "holding_experience", title: "持有体验", description: "盈利与回撤阶段采用不同陪伴方式", variants: [
      ["holding_profit", "持有盈利", "当前已有正收益", "管理预期而非强化贪婪", "当前已有正收益，更重要的是复盘收益来自哪里，以及后续哪些条件可能改变。", "收益归因、仓位纪律和风险变化", "暗示盈利会持续或鼓励盲目加码", "您更关心利润保护，还是后续主线是否延续？"],
      ["holding_drawdown", "持有回撤", "当前体验为亏损或回撤", "解释事实并重建判断框架", "出现回撤时不回避结果，我们先区分是市场波动、行业集中还是原有逻辑发生变化。", "回撤来源、风控条件和后续验证", "用一定会涨回来安抚客户", "您希望先看回撤归因，还是当前风控动作？"],
    ]},
    { id: "service_need", title: "服务诉求", description: "区分效率结论与研究参与两类需求", variants: [
      ["service_signal", "效率结论型", "希望信息少而关键", "提供清晰摘要与边界", "如果您更重视效率，我们会把每次信息压缩成变化、原因、风险三部分。", "重点摘要、调仓原因和风险提醒", "只发代码不解释边界", "您希望日报式摘要，还是只接收重要变化？"],
      ["service_research", "研究参与型", "希望理解行业与调仓逻辑", "展示完整研究证据链", "如果您希望知道为什么调整，我们可以从研报、观点、持仓、调仓到复盘完整展开。", "研报解读、观点验证和持仓证据", "堆砌资料却不给结论", "您更想先看行业逻辑，还是知行一致记录？"],
    ]},
  ];
  return dimensions.map((dimension) => ({
    id: dimension.id,
    title: dimension.title,
    description: dimension.description,
    variants: dimension.variants.map(([id, label, audience, goal, opening, focus, avoid, closing]) => ({
      id, label, audience, goal, opening, focus, avoid, closing,
      text: `${opening}\n\n${commonFact}针对您当前的关注点，我们会重点提供${focus}，让您依据真实记录判断是否匹配。需要避免的是：${avoid}。${boundary}\n\n${closing}`,
    })),
  }));
}

async function requestClientPersonaScripts(analysis, options = {}) {
  const portfolio = getCurrentPortfolio();
  if (!portfolio || state.clientPersonaScriptLoading) return null;
  const portfolioId = portfolio.id;
  clientPersonaAutoAttempted.add(portfolioId);
  if (
    !options.force
    && state.clientPersonaScriptsByPortfolio[portfolioId]?.schema_version === "client_persona_v2"
    && state.clientPersonaScriptsByPortfolio[portfolioId]?.mode === "deepseek"
    && state.clientPersonaScriptsByPortfolio[portfolioId]?.dimensions?.length
  ) {
    return state.clientPersonaScriptsByPortfolio[portfolioId];
  }
  const metrics = buildPersonaCoreMetrics(analysis);
  const communication = buildAdvisorClientCommunication(analysis, metrics);
  state.clientPersonaScriptLoading = true;
  renderTalk(analysis);
  try {
    const result = await postJson(
      "/api/client-persona/scripts/generate",
      buildClientPersonaApiPayload(analysis, metrics, communication),
    );
    if (!result?.ok) throw new Error(result?.error || "画像话术生成失败");
    state.clientPersonaScriptsByPortfolio[portfolioId] = result;
    persistState();
    actionStatusEl.textContent = result.mode === "deepseek"
      ? "组合小助手已按五类客户画像优化对客话术。"
      : `组合小助手暂时使用本地备用能力：${result.llm_error || "智能接口未返回内容"}`;
    return result;
  } catch (error) {
    actionStatusEl.textContent = `组合小助手画像话术生成失败：${error.message}`;
    return null;
  } finally {
    state.clientPersonaScriptLoading = false;
    if (getCurrentPortfolio()?.id === portfolioId) renderTalk(getCurrentAnalysis());
  }
}

async function askClientPersonaChat(analysis, question) {
  const portfolio = getCurrentPortfolio();
  if (!portfolio || state.clientPersonaChatLoading || !String(question || "").trim()) return;
  const portfolioId = portfolio.id;
  const history = state.clientPersonaChatsByPortfolio[portfolioId] || [];
  const userMessage = { role: "user", content: String(question).trim(), at: new Date().toISOString() };
  state.clientPersonaChatsByPortfolio[portfolioId] = [...history, userMessage];
  state.clientPersonaChatLoading = true;
  persistState();
  renderTalk(analysis);
  const metrics = buildPersonaCoreMetrics(analysis);
  const communication = buildAdvisorClientCommunication(analysis, metrics);
  try {
    const payload = buildClientPersonaApiPayload(analysis, metrics, communication);
    const result = await postJson("/api/client-persona/chat", {
      ...payload,
      question: userMessage.content,
      history: history.slice(-8).map((item) => ({ role: item.role, content: item.content })),
    });
    if (!result?.ok) throw new Error(result?.error || "组合问答失败");
    const nextHistory = state.clientPersonaChatsByPortfolio[portfolioId] || [];
    state.clientPersonaChatsByPortfolio[portfolioId] = [
      ...nextHistory,
      {
        role: "assistant",
        content: result.answer || "当前没有可用回答。",
        mode: result.mode,
        llm_error: result.llm_error || "",
        at: result.answered_at || new Date().toISOString(),
      },
    ];
    persistState();
  } catch (error) {
    const nextHistory = state.clientPersonaChatsByPortfolio[portfolioId] || [];
    state.clientPersonaChatsByPortfolio[portfolioId] = [
      ...nextHistory,
      { role: "assistant", content: `暂时无法回答：${error.message}`, mode: "error", at: new Date().toISOString() },
    ];
  } finally {
    state.clientPersonaChatLoading = false;
    if (getCurrentPortfolio()?.id === portfolioId) renderTalk(getCurrentAnalysis());
  }
}

function bindClientPersonaControls(container, analysis) {
  container.querySelector("#refreshClientPersonaScriptsBtn")?.addEventListener("click", () => {
    requestClientPersonaScripts(analysis, { force: true });
  });
  const portfolioId = getCurrentPortfolio()?.id;
  container.querySelectorAll("[data-persona-select]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!portfolioId) return;
      state.clientPersonaSelectedByPortfolio[portfolioId] = button.dataset.personaSelect || "";
      persistState();
      renderTalk(analysis);
    });
  });
  container.querySelectorAll("[data-persona-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!portfolioId) return;
      state.clientPersonaStageByPortfolio[portfolioId] = button.dataset.personaStage || "allocate";
      persistState();
      renderTalk(analysis);
    });
  });
  container.querySelectorAll("[data-persona-dimension]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!portfolioId) return;
      const dimensionId = button.dataset.personaDimension || "";
      state.clientPersonaOpenDimensionByPortfolio[portfolioId] =
        state.clientPersonaOpenDimensionByPortfolio[portfolioId] === dimensionId ? "" : dimensionId;
      persistState();
      renderTalk(analysis);
    });
  });
  container.querySelectorAll("[data-persona-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      container.querySelector(`#${button.dataset.personaScroll}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  const input = container.querySelector("#clientPersonaChatInput");
  const send = () => {
    const question = input?.value?.trim() || "";
    if (question) askClientPersonaChat(analysis, question);
  };
  container.querySelector("#sendClientPersonaChatBtn")?.addEventListener("click", send);
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });
  container.querySelectorAll("[data-client-question]").forEach((button) => {
    button.addEventListener("click", () => askClientPersonaChat(analysis, button.dataset.clientQuestion || ""));
  });
  container.querySelector("#clearClientPersonaChatBtn")?.addEventListener("click", () => {
    const portfolioId = getCurrentPortfolio()?.id;
    if (!portfolioId) return;
    state.clientPersonaChatsByPortfolio[portfolioId] = [];
    persistState();
    renderTalk(analysis);
  });
}

const CLIENT_CONVERSATION_STAGES = [
  { id: "discover", label: "初次了解", desc: "建立信任，了解需求", prompt: "先不急着推荐，确认客户最在意什么" },
  { id: "observe", label: "小仓观察", desc: "小仓体验，验证匹配", prompt: "把观察方法、执行节奏和退出边界说清楚" },
  { id: "allocate", label: "准备配置", desc: "明确方案，推动决策", prompt: "此刻客户最需要听到什么" },
  { id: "accompany", label: "持有陪伴", desc: "持续陪伴，优化体验", prompt: "用事实解释波动，并交代后续服务动作" },
];

function buildPersonaStageScript(persona, stageId, analysis, metrics) {
  const sectors = metrics.sectors.slice(0, 4).map((item) => item.label).join("、") || "当前持仓对应板块";
  const returnFact = metrics.trailingReturn == null
    ? `当前可验证区间为 ${metrics.returnStart} 至 ${metrics.returnEnd}`
    : `${metrics.returnStart} 至 ${metrics.returnEnd} 可验证收益为 ${pct(metrics.trailingReturn, 2)}`;
  const serviceText = (persona.service_focus || []).join("、") || "调仓说明、风险提示和定期复盘";
  const opening = persona.opening || `在介绍组合前，我想先了解您最关心的是收益体验、回撤控制，还是跟投时间。`;
  const core = persona.core_pitch || persona.full_script || "";
  const boundary = persona.risk_boundary || `过往表现不代表未来收益，组合建议不等同于保本或收益承诺。`;
  const closing = persona.closing_question || "您更希望先看组合的风险记录，还是先了解实际服务节奏？";
  const scripts = {
    discover: `${opening}\n\n我先不急着给您下结论。这个组合目前主要覆盖${sectors}，交易节奏为${metrics.frequencyLabel}。我想先确认您的资金期限、可接受回撤和每天能否及时查看调仓提醒，再判断是否真正适合。\n\n${closing}`,
    observe: `如果您认可组合方向，但还想验证实际体验，可以先从观察或小仓开始，不需要一次性做决定。\n\n${core}\n\n观察期重点看三件事：调仓是否跟得上、正常波动是否能接受、主理人的解释是否清楚。我们会提供${serviceText}。${boundary}\n\n两到三个月后，再依据真实体验决定是否继续配置。`,
    allocate: persona.full_script || `${opening}\n\n${core}\n\n${boundary}\n\n${closing}`,
    accompany: `最近的市场波动确实会影响持有感受，先把这次变化放回组合原本的框架里看。组合主要覆盖${sectors}，${returnFact}，交易节奏为${metrics.frequencyLabel}。\n\n接下来我们会持续提供${serviceText}，每次调仓说明原因、风险和需要关注的验证点，而不是只发一个代码。\n\n${boundary}\n\n您目前最担心的是回撤幅度、板块变化，还是调仓执行？我可以先把对应记录给您讲清楚。`,
  };
  return scripts[stageId] || scripts.allocate;
}

function renderTalk(analysis) {
  const metrics = buildPersonaCoreMetrics(analysis);
  const communication = buildAdvisorClientCommunication(analysis, metrics);
  const portfolioId = getCurrentPortfolio()?.id || analysis.name;
  const aiResult = state.clientPersonaScriptsByPortfolio[portfolioId] || null;
  const allowedPersonaIds = new Set(["balanced_industry_tilt", "balanced_allocation", "growth_aggressive", "busy_low_frequency", "research_participant"]);
  const aiPersonas = (aiResult?.personas || []).filter((item) => allowedPersonaIds.has(item.id));
  const displayPersonas = aiPersonas.length ? aiPersonas : buildImmediateClientPersonas(metrics, communication);
  const baseScripts = aiResult?.schema_version === "client_persona_v2" && Array.isArray(aiResult?.base_scenarios) && aiResult.base_scenarios.length
    ? aiResult.base_scenarios
    : communication.scripts;
  const aiDimensions = aiResult?.dimensions || [];
  const displayDimensions = aiDimensions.length ? aiDimensions : buildImmediateDimensionScripts(metrics);
  const dimensionScriptCount = displayDimensions.reduce((sum, item) => sum + (item.variants || []).length, 0);
  const chatHistory = state.clientPersonaChatsByPortfolio[portfolioId] || [];
  const returnValue = metrics.trailingReturn;
  const returnTone = returnValue == null ? "" : returnClassName(returnValue);
  const selectedPersonaId = displayPersonas.some((item) => item.id === state.clientPersonaSelectedByPortfolio[portfolioId])
    ? state.clientPersonaSelectedByPortfolio[portfolioId]
    : (displayPersonas.find((item) => item.id === "balanced_allocation")?.id || displayPersonas[0]?.id || "");
  const selectedPersona = displayPersonas.find((item) => item.id === selectedPersonaId) || displayPersonas[0] || {};
  const selectedStageId = CLIENT_CONVERSATION_STAGES.some((item) => item.id === state.clientPersonaStageByPortfolio[portfolioId])
    ? state.clientPersonaStageByPortfolio[portfolioId]
    : "allocate";
  const selectedStage = CLIENT_CONVERSATION_STAGES.find((item) => item.id === selectedStageId) || CLIENT_CONVERSATION_STAGES[2];
  const openDimensionId = displayDimensions.some((item) => item.id === state.clientPersonaOpenDimensionByPortfolio[portfolioId])
    ? state.clientPersonaOpenDimensionByPortfolio[portfolioId]
    : (displayDimensions[0]?.id || "");
  const stageScript = buildPersonaStageScript(selectedPersona, selectedStageId, analysis, metrics);
  const matchScore = String(selectedPersona.match_level || "").includes("高") ? 92
    : String(selectedPersona.match_level || "").includes("条件") ? 76
      : String(selectedPersona.match_level || "").includes("谨慎") ? 52 : 34;
  const sectorSummary = metrics.sectors.map((item) => item.label).join(" · ") || "申万二级行业映射暂未完成";
  const container = document.getElementById("view-talk");
  baseScripts.forEach((item) => materialCopyMap.set(`persona-${item.id}`, item.text));
  displayPersonas.forEach((item) => materialCopyMap.set(`ai-persona-${item.id}`, item.full_script || item.core_pitch || ""));
  if (displayPersonas.length) {
    materialCopyMap.set(
      "ai-persona-all",
      displayPersonas.map((item) => `【${item.persona_name}｜${item.match_level}】\n${item.full_script || item.core_pitch || ""}`).join("\n\n"),
    );
  }
  displayDimensions.forEach((dimension) => {
    (dimension.variants || []).forEach((variant) => {
      materialCopyMap.set(`client-dimension-${dimension.id}-${variant.id}`, variant.text || "");
    });
  });
  materialCopyMap.set(
    "client-dimension-all",
    displayDimensions.map((dimension) => (
      `【${dimension.title}】\n${(dimension.variants || []).map((variant) => `〔${variant.label}〕\n${variant.text || ""}`).join("\n\n")}`
    )).join("\n\n"),
  );
  materialCopyMap.set(
    "persona-all",
    baseScripts.map((item) => `【${item.title}】\n${item.text}`).join("\n\n"),
  );
  materialCopyMap.set("persona-current-stage", stageScript);
  container.innerHTML = `
    <div class="persona-journey-shell">
      <section class="persona-portfolio-strip">
        <div class="persona-portfolio-name"><small>当前组合</small><strong>${escapeHtml(analysis.name)}</strong><span>${escapeHtml(communication.primaryMode)}</span></div>
        <div class="persona-portfolio-fact"><small>覆盖板块方向</small><strong>${escapeHtml(sectorSummary)}</strong><span>${escapeHtml(metrics.sectorBasis)}</span></div>
        <div class="persona-portfolio-fact"><small>可验证区间收益</small><strong class="${returnTone}">${returnValue == null ? "—" : pct(returnValue, 2)}</strong><span>${escapeHtml(metrics.returnStart)} 至 ${escapeHtml(metrics.returnEnd)}</span></div>
        <div class="persona-portfolio-fact"><small>交易频次</small><strong>${escapeHtml(metrics.frequencyLabel)}</strong><span>约 ${num(metrics.monthlyFrequency, 1)} 次/月</span></div>
      </section>

      <section class="persona-profile-picker" aria-label="选择客户画像">
        <div class="persona-picker-title"><strong>选择客户画像</strong><span>基于旅程匹配沟通策略</span></div>
        <div class="persona-profile-options">
          ${displayPersonas.map((item, index) => `
            <button type="button" class="persona-profile-option ${item.id === selectedPersonaId ? "active" : ""}" data-persona-select="${escapeHtml(item.id)}" aria-pressed="${item.id === selectedPersonaId}">
              <span class="persona-profile-index">${String(index + 1).padStart(2, "0")}</span>
              <span><b>${escapeHtml(item.persona_name || "客户画像")}</b><small>${escapeHtml((item.profile_tags || []).slice(0, 2).join(" · ") || item.core_need || "差异化沟通")}</small></span>
              <em>${escapeHtml(item.match_level || "条件匹配")}</em>
            </button>
          `).join("")}
        </div>
      </section>

      <section class="persona-stage-panel">
        <div class="persona-stage-intro"><strong>客户沟通旅程</strong><span>当前阶段：${escapeHtml(selectedStage.label)}</span></div>
        <div class="persona-stage-track">
          ${CLIENT_CONVERSATION_STAGES.map((stage, index) => `
            <button type="button" class="persona-stage-step ${stage.id === selectedStageId ? "active" : ""}" data-persona-stage="${stage.id}" aria-pressed="${stage.id === selectedStageId}">
              <span>${index + 1}</span><b>${stage.label}</b><small>${stage.desc}</small>
            </button>
          `).join("")}
        </div>
        <div class="persona-stage-prompt">${escapeHtml(selectedStage.prompt)}</div>
      </section>

      <section class="persona-advice-layout">
        <main class="persona-advice-main">
          <div class="persona-ai-line">
            <span class="persona-auto-ai-badge"><i></i>${state.clientPersonaScriptLoading ? "组合小助手正在优化" : aiResult?.mode === "deepseek" ? "组合小助手已结合当前组合与客户画像优化" : "组合小助手本地话术已就绪"}</span>
            <button class="text-action" id="refreshClientPersonaScriptsBtn" type="button" ${state.clientPersonaScriptLoading ? "disabled" : ""}>${state.clientPersonaScriptLoading ? "优化中…" : "重新优化"}</button>
          </div>
          <div class="persona-advice-head">
            <div><small>本次沟通建议</small><h3>${escapeHtml(selectedPersona.persona_name || "客户画像")} · ${escapeHtml(selectedStage.label)}</h3></div>
            <button class="pill-btn primary" type="button" data-material-copy="persona-current-stage">复制本阶段话术</button>
          </div>
          <div class="persona-opening-line"><b>20秒开场白</b><p>${escapeHtml(selectedPersona.opening || stageScript.split("\n")[0])}</p></div>
          <div class="persona-dialogue-script"><b>顾问：</b>${escapeHtml(stageScript)}</div>
          <div class="persona-advice-actions">
            <button class="pill-btn secondary" type="button" data-persona-scroll="persona-full-library">展开完整话术库</button>
            <button class="pill-btn secondary" type="button" data-client-question="客户质疑近期回撤，应该怎么回答？">让组合小助手回答异议</button>
          </div>
        </main>

        <aside class="persona-profile-summary">
          <div class="persona-summary-head"><div><small>客户画像摘要</small><h3>${escapeHtml(selectedPersona.persona_name || "客户画像")}</h3></div><b>${matchScore}%</b></div>
          <div class="persona-match-meter"><span style="width:${matchScore}%"></span></div>
          <dl class="persona-summary-list">
            <div><dt>核心目标</dt><dd>${escapeHtml(selectedPersona.core_need || "先判断组合是否与资金期限和风险偏好匹配")}</dd></div>
            <div><dt>主要顾虑</dt><dd>${escapeHtml(selectedPersona.match_reason || "关注波动、执行节奏和服务是否透明")}</dd></div>
            <div><dt>推荐切入</dt><dd>${escapeHtml(selectedPersona.communication_angle || "先讲真实持仓与风险边界，再讲服务价值")}</dd></div>
            <div><dt>服务重点</dt><dd>${escapeHtml((selectedPersona.service_focus || communication.serviceRights).slice(0, 3).join("、"))}</dd></div>
            <div class="avoid"><dt>需要避免</dt><dd>${escapeHtml(selectedPersona.avoid_expression || communication.avoidTags.join("、"))}</dd></div>
          </dl>
          <div class="persona-next-questions"><strong>下一句可以问</strong><button type="button" data-client-question="您更看重收益弹性还是回撤控制？">更看重收益还是回撤？</button><button type="button" data-client-question="您一天通常能查看几次重要调仓提醒？">每天能看几次提醒？</button><button type="button" data-client-question="您准备观察多久再决定正式配置？">希望观察多久？</button></div>
        </aside>
      </section>

      <section class="persona-library" id="persona-full-library">
        <div class="persona-library-head"><div><small>完整话术库</small><h3>按客户问题逐层展开</h3><p>选择维度后，只展示与当前问题有关的两套表达，避免一次性向客户堆砌信息。</p></div><div><span>${displayDimensions.length} 个维度 · ${dimensionScriptCount} 套话术</span><button class="pill-btn secondary" type="button" data-material-copy="client-dimension-all">复制全部</button></div></div>
        <div class="persona-library-list">
          ${displayDimensions.map((dimension, index) => {
            const isOpen = dimension.id === openDimensionId;
            return `<article class="persona-library-item ${isOpen ? "open" : ""}">
              <button type="button" class="persona-library-toggle" data-persona-dimension="${escapeHtml(dimension.id)}" aria-expanded="${isOpen}">
                <span>${String(index + 1).padStart(2, "0")}</span><b>${escapeHtml(dimension.title)}</b><small>${escapeHtml(dimension.description || "")}</small><em>${(dimension.variants || []).length} 套</em>
              </button>
              ${isOpen ? `<div class="persona-library-variants">${(dimension.variants || []).map((variant) => `<section><div><b>${escapeHtml(variant.label || "客户情形")}</b><small>${escapeHtml(variant.audience || "")}</small><button class="text-action" type="button" data-material-copy="client-dimension-${escapeHtml(dimension.id)}-${escapeHtml(variant.id)}">复制</button></div><p><strong>沟通目标：</strong>${escapeHtml(variant.goal || "建立真实适配认知")}</p><blockquote>${escapeHtml(variant.text || "")}</blockquote><p class="avoid"><strong>避免：</strong>${escapeHtml(variant.avoid || "夸大收益或隐藏风险")}</p></section>`).join("")}</div>` : ""}
            </article>`;
          }).join("")}
        </div>
      </section>
    </div>
    <div class="panel-card persona-chat-panel" style="margin-top:14px;">
      <div class="persona-chat-hero">
        <div class="persona-chat-brand">
          <div class="persona-chat-avatar">组<span></span></div>
          <div>
            <div class="trade-kicker">PORTFOLIO ASSISTANT</div>
            <h3>组合小助手</h3>
            <p>只基于“${escapeHtml(analysis.name)}”的真实数据回答</p>
          </div>
        </div>
        <div class="persona-chat-hero-actions"><span class="persona-chat-online"><i></i>在线</span><button class="pill-btn secondary" id="clearClientPersonaChatBtn" type="button">清空对话</button></div>
      </div>
      <div class="persona-chat-context">
        <span>板块 ${metrics.sectors.length} 个</span><span>区间收益 ${returnValue == null ? "—" : pct(returnValue, 2)}</span><span>${escapeHtml(metrics.frequencyLabel)}</span>
      </div>
      <div class="persona-chat-suggestions">
        ${[
          "这个组合主要投哪些板块？",
          "近一年收益是怎么计算的？",
          "我平时没时间盯盘，适合这个组合吗？",
          "这个组合最大的风险是什么？",
        ].map((question) => `<button type="button" data-client-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join("")}
      </div>
      <div class="persona-chat-messages">
        ${chatHistory.length ? chatHistory.map((message) => `
          <div class="persona-chat-message ${message.role === "user" ? "user" : "assistant"}">
            <strong>${message.role === "user" ? "客户" : "组合小助手"}${message.mode === "local_rules_fallback" ? " · 备用回答" : ""}</strong>
            <p>${escapeHtml(message.content || "")}</p>
          </div>
        `).join("") : `<div class="persona-chat-welcome">您好，可以直接问我当前组合覆盖哪些板块、历史收益如何计算、交易是否频繁，以及您是否容易跟上这套服务节奏。</div>`}
        ${state.clientPersonaChatLoading ? `<div class="persona-chat-message assistant"><strong>组合小助手</strong><p>正在结合当前组合事实回答…</p></div>` : ""}
      </div>
      <div class="persona-chat-input-row">
        <textarea id="clientPersonaChatInput" rows="2" placeholder="请输入客户对当前组合的问题；Enter 发送，Shift+Enter 换行"></textarea>
        <button class="pill-btn primary" id="sendClientPersonaChatBtn" type="button" ${state.clientPersonaChatLoading ? "disabled" : ""}>${state.clientPersonaChatLoading ? "回答中…" : "发送"}</button>
      </div>
      <div class="persona-chat-disclaimer">回答仅用于解释当前建议型组合，不构成收益承诺或替客户作出的个性化买卖决定。</div>
    </div>
    <div class="panel-card persona-script-panel" style="margin-top:14px;">
      <div class="section-title-row">
        <div>
          <div class="trade-kicker">BASE SCENARIO SCRIPTS</div>
          <h3>基础场景话术</h3>
          <p class="lead">首次触达、适配深聊、服务权益与风险收尾均集中在本模块。</p>
        </div>
        <button class="pill-btn primary" type="button" data-material-copy="persona-all">复制整套话术</button>
      </div>
      <div class="persona-script-grid">
        ${baseScripts.map((item) => `
          <article class="persona-client-script">
            <div class="section-title-row">
              <div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.scene)}</p></div>
              <button class="pill-btn secondary" type="button" data-material-copy="persona-${escapeHtml(item.id)}">复制</button>
            </div>
            <div class="persona-script-copy">${escapeHtml(item.text)}</div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
  bindMaterialCopyControls(container);
  bindClientPersonaControls(container, analysis);
  if (
    state.activeTab === "talk"
    && (aiResult?.schema_version !== "client_persona_v2" || aiResult?.mode !== "deepseek" || !aiDimensions.length || !aiResult?.base_scenarios?.length)
    && !state.clientPersonaScriptLoading
    && !clientPersonaAutoAttempted.has(portfolioId)
  ) {
    window.setTimeout(() => requestClientPersonaScripts(analysis), 0);
  }
}

function buildPersonaPortfolioIntroduction(analysis, metrics, hotspotRows) {
  const sectorNames = metrics.sectors.slice(0, 5).map((item) => item.label).join("、") || "当前持仓对应行业";
  const returnSentence = metrics.trailingReturn == null
    ? `目前连续净值样本覆盖 ${metrics.returnStart} 至 ${metrics.returnEnd}，暂不对不足一年的数据做年化外推。`
    : `在 ${metrics.returnStart} 至 ${metrics.returnEnd} 的可验证区间内，组合收益为 ${pct(metrics.trailingReturn, 2)}；该数据只描述历史区间，不代表未来表现。`;
  const hotspotNames = hotspotRows.slice(0, 4).map((item) => item.theme).filter(Boolean);
  const hotspotSentence = hotspotNames.length
    ? `当前市场重点关注 ${hotspotNames.join("、")}，系统会继续核对这些热点与组合持仓板块是否形成共振。`
    : "当前热点以联网抓取与本地研报更新结果为准，暂无足够清晰的持仓相关热点时不强行关联。";
  return `这是一个主要覆盖${sectorNames}的主动管理组合。主理人的真实交易节奏属于${metrics.frequencyLabel}，近一年窗口内后台共记录 ${metrics.eventCount} 次调仓，约 ${num(metrics.monthlyFrequency, 1)} 次/月。\n\n${returnSentence}\n\n${hotspotSentence}\n\n适合先从“板块是否认可、历史波动能否接受、调仓节奏能否跟上”三个问题判断是否值得继续了解；过往表现不代表未来收益，最终交易由客户自主决定。`;
}

function renderPersona(analysis) {
  const metrics = buildPersonaCoreMetrics(analysis);
  const communication = buildAdvisorClientCommunication(analysis, metrics);
  const latestHotDate = getLatestHotDate();
  const latestHotRows = latestHotDate ? getHotRecordsByDate(latestHotDate) : [];
  const holdingSectorText = metrics.sectors.map((item) => item.label).join(" ");
  const relatedHotspots = latestHotRows
    .filter((item) => {
      const rowText = `${item.theme || ""} ${item.core_logic || ""} ${item.industries || ""}`;
      return metrics.sectors.some((sector) => rowText.includes(sector.label))
        || getThemesForStock(rowText).some((theme) => holdingSectorText.includes(theme));
    })
    .slice(0, 4);
  const displayHotspots = relatedHotspots.length ? relatedHotspots : latestHotRows.slice(0, 4);
  const returnValue = metrics.trailingReturn;
  const returnTone = returnValue == null ? "" : returnClassName(returnValue);
  const introduction = buildPersonaPortfolioIntroduction(analysis, metrics, displayHotspots);
  const container = document.getElementById("view-persona");
  materialCopyMap.set("persona-portfolio-introduction", introduction);
  container.innerHTML = `
    <section class="persona-intro-hero">
      <div>
        <div class="trade-kicker">PORTFOLIO INTRODUCTION</div>
        <h2>用三项事实介绍这个组合</h2>
        <p>先讲清楚组合投向、历史表现和真实交易节奏，再结合当前热点说明值得关注的方向。</p>
      </div>
      <span class="feed-sync-badge">当前组合：${escapeHtml(analysis.name)}</span>
    </section>

    <section class="persona-key-metrics">
      <article class="persona-key-metric sector">
        <small>组合覆盖板块</small>
        <strong>${metrics.sectors.length}<em> 个申万二级行业</em></strong>
        <div class="persona-key-sector-list">${metrics.sectors.map((item) => `<span>${escapeHtml(item.label)}${item.weight == null ? "" : ` ${pct(item.weight, 1)}`}</span>`).join("") || `<span>当前持仓行业映射暂未完成</span>`}</div>
        <p>${escapeHtml(metrics.sectorBasis)}</p>
      </article>
      <article class="persona-key-metric return">
        <small>近一年收益率</small>
        <strong class="${returnTone}">${returnValue == null ? "—" : pct(returnValue, 2)}</strong>
        <p>${escapeHtml(metrics.returnStart)} 至 ${escapeHtml(metrics.returnEnd)}</p>
        <span>${escapeHtml(metrics.returnMethod)} · 不做年化外推</span>
      </article>
      <article class="persona-key-metric frequency">
        <small>交易频次</small>
        <strong>${escapeHtml(metrics.frequencyLabel)}</strong>
        <p>约 ${num(metrics.monthlyFrequency, 1)} 次/月</p>
        <span>${metrics.eventCount} 次调仓 · ${metrics.activeTradingDays} 个活跃交易日</span>
      </article>
    </section>

    <section class="persona-sector-coverage">
      <div class="persona-sector-coverage-head">
        <div><div class="trade-kicker">SECTOR COVERAGE</div><h3>组合覆盖板块</h3><p>读取当前组合持仓并映射申万二级行业；按持仓市值统计，没有市值时按持仓数量展示。</p></div>
        <span>${metrics.sectors.length} 个申万二级行业 · ${metrics.holdingCount || 0} 只持仓</span>
      </div>
      <div class="persona-sector-coverage-grid">
        ${metrics.sectors.length ? metrics.sectors.map((item, index) => `
          <article class="${index < 3 ? "primary" : ""}">
            <div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(item.label)}</strong></div>
            <b>${item.weight == null ? `${item.count || 0} 只` : pct(item.weight, 1)}</b>
            <small>${item.weight == null ? "按持仓数量统计" : `${item.count || 0} 只持仓 · 当前市值权重`}</small>
          </article>
        `).join("") : `<div class="persona-sector-coverage-empty">${metrics.holdingCount ? `当前有 ${metrics.holdingCount} 只持仓，申万二级行业映射正在补充，完成后会自动回填。` : "当前暂无持仓数据，暂不能生成组合覆盖行业。"}</div>`}
      </div>
    </section>

    <section class="persona-intro-layout">
      <article class="persona-intro-copy">
        <div class="section-title-row">
          <div><div class="trade-kicker">CUSTOMER-FACING INTRO</div><h3>组合介绍</h3><p class="lead">内容仅引用当前持仓、可验证收益、交易账本与最新热点。</p></div>
          <button class="pill-btn primary" type="button" data-material-copy="persona-portfolio-introduction">复制组合介绍</button>
        </div>
        <div class="persona-intro-text">${escapeHtml(introduction)}</div>
      </article>
      <aside class="persona-hotspot-card">
        <div class="persona-hotspot-head"><div><small>最新市场关注</small><h3>持仓与热点</h3></div><span>${escapeHtml(latestHotDate || "今日")}</span></div>
        <div class="persona-hotspot-list">
          ${displayHotspots.length ? displayHotspots.map((item) => `<article><b>${escapeHtml(item.theme || "市场热点")}</b><p>${escapeHtml(item.core_logic || item.summary || "关注其与组合持仓板块的联动强度和持续性。")}</p></article>`).join("") : `<div class="persona-hotspot-empty">暂无足够清晰的持仓相关热点，不做强行匹配。</div>`}
        </div>
      </aside>
    </section>

    <section class="persona-service-mode">
      <div class="persona-service-mode-head"><div><div class="trade-kicker">SERVICE MODEL</div><h3>条件升佣 + 进阶服务</h3><p>${escapeHtml(communication.modeReason)}</p></div><span>${escapeHtml(communication.primaryMode)}</span></div>
      <div class="persona-service-mode-grid">
        <div><strong>进阶服务权益</strong><div>${communication.serviceRights.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>
        <div><strong>升级条件</strong><p>${escapeHtml(communication.upgradeRule)}</p></div>
      </div>
    </section>
  `;
  bindMaterialCopyControls(container);
}

function renderTradeTableRows(trades) {
  return trades.map((trade) => `
    <tr>
      <td>${trade.idx}</td>
      <td class="left">${trade.stock}</td>
      <td>${trade.industry_name || "未识别"}</td>
      <td>${text(trade.buy_date)}</td>
      <td>${num(trade.buy_price)}</td>
      <td>${text(trade.sell_date)}</td>
      <td>${num(trade.sell_price)}</td>
      <td>${num(trade.hold_days, 0)}</td>
      <td class="${(trade.return_pct ?? 0) >= 0 ? "up-text" : "down-text"}">${pct(trade.return_pct)}</td>
      <td>${trade.quantity != null ? num(trade.quantity, 0) : "—"}</td>
      <td class="${(trade.return_pct ?? 0) >= 0 ? "up-text" : "down-text"}">${trade.status}</td>
    </tr>
  `).join("");
}

function renderData(analysis) {
  const openPositionSection = analysis.openPositions.length ? `
    <div class="panel-card" style="margin-top:14px;">
      <h3>未完成头寸</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th class="left">证券名称</th>
              <th>买入日期</th>
              <th>买入价</th>
              <th>数量</th>
              <th>板块</th>
              <th class="left">备注</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.openPositions.map((item) => `
              <tr>
                <td>${item.idx}</td>
                <td class="left">${item.stock}</td>
                <td>${text(item.buy_date)}</td>
                <td>${num(item.buy_price)}</td>
                <td>${item.quantity != null ? num(item.quantity, 0) : "—"}</td>
                <td>${item.board}</td>
                <td class="left">${item.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";

  document.getElementById("view-data").innerHTML = `
    <div class="panel-card">
      <h3>闭环交易明细</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th class="left">证券名称</th>
              <th>所属行业</th>
              <th>买入日期</th>
              <th>买入价</th>
              <th>卖出日期</th>
              <th>卖出价</th>
              <th>持有天数</th>
              <th>收益率</th>
              <th>数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${analysis.trades.length ? renderTradeTableRows(analysis.trades) : `<tr><td colspan="11">当前样本没有可展示的闭环交易记录。</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    ${openPositionSection}
    <div class="template-box">
      <strong>导入数据格式参考</strong>
      <code>证券名称,调入日期,买入价,调出日期,卖出价,持股天数,收益率,状态</code>
    </div>
    <div class="footnote">系统会自动兼容主流的券商交割单、私募调仓流水、手工记录表等格式，只要包含标的名称、买卖日期与价格即可。</div>
  `;
}

function getHoldingDisplayDates() {
  const current = getCurrentPortfolio();
  const dataset = current?.dataset || {};
  const rows = getHoldingTimelineRows();
  const dates = rows.map((row) => row.date).filter(Boolean);
  const sortedDates = unique(dates).sort((a, b) => a.localeCompare(b));
  const knownTradingDates = unique((dataset.holding_trading_dates || []).map(normalizeDateInput).filter(Boolean))
    .sort((a, b) => a.localeCompare(b));
  const knownTradingSet = new Set(knownTradingDates);
  const knownStart = knownTradingDates[0] || "";
  const knownEnd = knownTradingDates[knownTradingDates.length - 1] || "";
  const rowByDate = new Map(rows.map((row) => [row.date, row]));
  const isTradingDate = (date) => {
    if (knownTradingSet.has(date)) return true;
    if (knownStart && knownEnd && date >= knownStart && date <= knownEnd) return false;
    const row = rowByDate.get(date);
    const positions = row?.positions || [];
    if (positions.some((position) => normalizeDateInput(position.quote_date) === date)) return true;
    if (positions.length && positions.every((position) => {
      const quoteDate = normalizeDateInput(position.quote_date);
      return quoteDate && quoteDate < date;
    })) return false;
    const dateMs = toDateMs(date);
    if (dateMs == null) return false;
    const weekday = new Date(dateMs).getDay();
    return weekday !== 0 && weekday !== 6;
  };
  if (!sortedDates.length) {
    const today = formatDateObject(new Date());
    return isTradingDate(today) ? [today] : [];
  }
  const startMs = toDateMs(sortedDates[0]);
  const latestDataMs = toDateMs(sortedDates[sortedDates.length - 1]);
  const todayMs = toDateMs(formatDateObject(new Date()));
  const endMs = Math.max(latestDataMs ?? 0, todayMs ?? 0);
  const start = startMs == null ? null : new Date(startMs);
  const end = endMs == null ? null : new Date(endMs);
  if (!start || !end) return sortedDates;
  const result = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = formatDateObject(cursor);
    if (isTradingDate(date)) result.push(date);
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function buildHoldingTimelineLookup() {
  const rows = getHoldingTimelineRows();
  const actualLookup = new Map(rows.map((row) => [row.date, { ...row, carried: false, source_date: row.date }]));
  const ascending = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const displayDates = getHoldingDisplayDates();
  const lookup = new Map();
  const previousByDate = new Map();
  let lastRow = null;
  let previousEffective = null;
  displayDates.forEach((date) => {
    const actualRow = actualLookup.get(date);
    let effectiveRow = null;
    if (actualRow) {
      effectiveRow = actualRow;
      lastRow = actualRow;
    } else if (lastRow) {
      effectiveRow = {
        date,
        positions: (lastRow.positions || []).map((item) => ({
          ...item,
          date,
          carried_from_date: lastRow.source_date || lastRow.date,
        })),
        carried: true,
        source_date: lastRow.source_date || lastRow.date,
      };
    } else {
      effectiveRow = { date, positions: [], carried: true, source_date: "" };
    }
    lookup.set(date, effectiveRow);
    previousByDate.set(date, previousEffective);
    previousEffective = effectiveRow;
  });
  return { lookup, previousByDate, ascending, actualLookup };
}

function getHoldingPositionKey(position) {
  return position?.code || sanitizeStockName(position?.stock || "");
}

function getHoldingCompareValue(position) {
  const quantity = parseNumber(position?.quantity);
  if (quantity != null) return quantity;
  const marketValue = parseMoneyValue(position?.market_value);
  if (marketValue != null) return marketValue;
  return null;
}

function getPreviousHoldingRowForDate(date, ascendingRows) {
  if (!date || !Array.isArray(ascendingRows)) return null;
  let previous = null;
  ascendingRows.forEach((row) => {
    if (row.date < date) previous = row;
  });
  return previous;
}

function buildHoldingChangeSummary(row, previousRow) {
  const positions = row?.positions || [];
  const previousPositions = previousRow?.positions || [];
  const previousMap = new Map(previousPositions.map((item) => [getHoldingPositionKey(item), item]).filter(([key]) => key));
  const currentMap = new Map(positions.map((item) => [getHoldingPositionKey(item), item]).filter(([key]) => key));
  const positionChangeMap = new Map();
  const added = [];
  const increased = [];
  const decreased = [];
  const unchanged = [];
  const removed = [];

  positions.forEach((item) => {
    const key = getHoldingPositionKey(item);
    const previous = previousMap.get(key);
    if (!previous) {
      const change = { action: previousRow ? "新增" : "首日记录", note: previousRow ? "上一持仓日未持有" : "首个持仓快照" };
      positionChangeMap.set(key, change);
      added.push(item);
      return;
    }
    const currentValue = getHoldingCompareValue(item);
    const previousValue = getHoldingCompareValue(previous);
    if (currentValue != null && previousValue != null && Math.abs(currentValue - previousValue) > 0.0001) {
      const action = currentValue > previousValue ? "加仓" : "减仓";
      const delta = currentValue - previousValue;
      const note = `${previousValue.toLocaleString("zh-CN")} → ${currentValue.toLocaleString("zh-CN")}（${delta > 0 ? "+" : ""}${delta.toLocaleString("zh-CN")}）`;
      const change = { action, note };
      positionChangeMap.set(key, change);
      if (action === "加仓") increased.push({ ...item, delta, previousValue, currentValue });
      else decreased.push({ ...item, delta, previousValue, currentValue });
      return;
    }
    const change = { action: "持仓延续", note: "数量/市值未见明显变化" };
    positionChangeMap.set(key, change);
    unchanged.push(item);
  });

  previousPositions.forEach((item) => {
    const key = getHoldingPositionKey(item);
    if (key && !currentMap.has(key)) removed.push(item);
  });

  return {
    positionChangeMap,
    added,
    increased,
    decreased,
    unchanged,
    removed,
    hasChange: Boolean(added.length || increased.length || decreased.length || removed.length),
  };
}

function renderHoldingChangeCell(change) {
  if (!change) return `<span class="ghost-pill">—</span>`;
  const className = change.action === "新增" || change.action === "加仓"
    ? "up-text"
    : change.action === "调出" || change.action === "减仓"
      ? "down-text"
      : "";
  return `
    <div style="display:grid; gap:4px;">
      <strong class="${className}">${escapeHtml(change.action)}</strong>
      <span style="color:var(--muted); font-size:12px;">${escapeHtml(change.note || "")}</span>
    </div>
  `;
}

function renderHoldingChangeSummary(changeSummary, selectedDate, previousRow) {
  if (!previousRow && !changeSummary.added.length) {
    return `<div class="feed-inline-status">暂无可对比的上一持仓日，当前日期按首个持仓快照展示。</div>`;
  }
  const fragments = [
    changeSummary.added.length ? `新增 ${changeSummary.added.map((item) => item.stock).join("、")}` : "",
    changeSummary.increased.length ? `加仓 ${changeSummary.increased.map((item) => item.stock).join("、")}` : "",
    changeSummary.decreased.length ? `减仓 ${changeSummary.decreased.map((item) => item.stock).join("、")}` : "",
    changeSummary.removed.length ? `调出 ${changeSummary.removed.map((item) => item.stock).join("、")}` : "",
  ].filter(Boolean);
  const textContent = fragments.length ? fragments.join("；") : "较上一持仓日未识别到明显调仓。";
  return `
    <div class="feed-inline-status">
      ${escapeHtml(selectedDate)} 调仓：${escapeHtml(textContent)}
      ${previousRow?.date ? `（对比上一持仓日 ${escapeHtml(previousRow.date)}）` : ""}
    </div>
  `;
}

function collectEffectiveHoldingRowsForBackfill() {
  const dates = getHoldingDisplayDates();
  const { lookup } = buildHoldingTimelineLookup();
  return dates.map((date) => lookup.get(date) || { date, positions: [] });
}

function buildHistoryQuoteResolver(payload) {
  const quotesByCode = new Map();
  const quoteDates = [];
  (payload?.quotes || []).forEach((quote) => {
    const code = String(quote.code || "").replace(/\D/g, "").slice(-6);
    const date = normalizeDateInput(quote.date || quote.quote_date || "");
    if (!code || !date) return;
    if (!quotesByCode.has(code)) quotesByCode.set(code, new Map());
    quotesByCode.get(code).set(date, { ...quote, date });
    quoteDates.push(date);
  });
  const tradingDates = unique([
    ...(payload?.trading_dates || []).map(normalizeDateInput),
    ...quoteDates,
  ].filter(Boolean)).sort((a, b) => a.localeCompare(b));

  const resolveTradingDate = (targetDate) => {
    let resolved = "";
    for (const tradingDate of tradingDates) {
      if (tradingDate > targetDate) break;
      resolved = tradingDate;
    }
    return resolved;
  };

  return {
    resolve(code, targetDate) {
      const cleanedCode = String(code || "").replace(/\D/g, "").slice(-6);
      const normalizedTarget = normalizeDateInput(targetDate);
      const resolvedTradeDate = resolveTradingDate(normalizedTarget);
      const codeQuotes = quotesByCode.get(cleanedCode) || new Map();
      const exactQuote = resolvedTradeDate ? codeQuotes.get(resolvedTradeDate) : null;
      if (exactQuote) {
        return {
          quote: exactQuote,
          resolvedTradeDate,
          usedPreviousTradingDay: resolvedTradeDate !== normalizedTarget,
          noTradeOnResolvedDate: false,
        };
      }
      let previousQuote = null;
      for (const [quoteDate, quote] of [...codeQuotes.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        if (!resolvedTradeDate || quoteDate >= resolvedTradeDate) break;
        previousQuote = quote;
      }
      return {
        quote: previousQuote,
        resolvedTradeDate,
        usedPreviousTradingDay: resolvedTradeDate !== normalizedTarget,
        noTradeOnResolvedDate: Boolean(resolvedTradeDate && previousQuote),
      };
    }
  };
}

function enrichHoldingPositionWithHistoryQuote(position, date, match) {
  const quote = match?.quote;
  const resolvedTradeDate = match?.resolvedTradeDate || "";
  if (!quote) {
    return {
      ...position,
      date,
      latest_price: null,
      day_pct_change: null,
      day_change: null,
      quote_date: resolvedTradeDate,
      price_source_date: "",
      quote_status: resolvedTradeDate ? "目标交易日未返回该标的行情" : "目标日期之前没有可用交易日",
      quote_source: "历史行情未匹配，已清除旧涨跌幅",
    };
  }
  const quantity = parseNumber(position.quantity);
  const costPrice = parseNumber(position.cost_price);
  const price = parseNumber(quote.price ?? quote.close);
  const noTradeOnResolvedDate = Boolean(match?.noTradeOnResolvedDate);
  const next = {
    ...position,
    date,
    latest_price: price ?? position.latest_price,
    day_pct_change: noTradeOnResolvedDate ? 0 : (quote.pct_change ?? null),
    day_change: noTradeOnResolvedDate ? 0 : (quote.change ?? null),
    quote_date: resolvedTradeDate || quote.date || date,
    price_source_date: quote.date || "",
    quote_status: noTradeOnResolvedDate
      ? "目标交易日无该标的成交，沿用最近收盘价"
      : (match?.usedPreviousTradingDay ? "非交易日，已回退至最近交易日" : "精确交易日匹配"),
    quote_source: quote.source || "东方财富历史日K",
  };
  if (quantity != null && price != null) {
    next.market_value = formatMoneyShort(quantity * price);
  }
  if (quantity != null && price != null && costPrice != null && costPrice > 0) {
    next.return_pct = `${num(((price / costPrice) - 1) * 100, 2)}%`;
    next.pnl = formatMoneyShort((price - costPrice) * quantity);
  }
  return next;
}

function applyHistoricalHoldingQuotes(payload, options = {}) {
  const current = options.portfolioId
    ? state.portfolios.find((portfolio) => portfolio.id === options.portfolioId)
    : getCurrentPortfolio();
  if (!current) return 0;
  const dataset = current.dataset || {};
  const payloadTradingDates = unique((payload?.trading_dates || []).map(normalizeDateInput).filter(Boolean));
  dataset.holding_trading_dates = unique([
    ...(dataset.holding_trading_dates || []).map(normalizeDateInput).filter(Boolean),
    ...payloadTradingDates,
  ]).sort((a, b) => a.localeCompare(b));
  const payloadTradingSet = new Set(payloadTradingDates);
  const payloadStart = normalizeDateInput(payload?.start_date || "");
  const payloadEnd = normalizeDateInput(payload?.end_date || "");
  const allowedDates = options.dates ? new Set(options.dates) : null;
  const quoteResolver = buildHistoryQuoteResolver(payload);
  const rows = (options.rows || collectEffectiveHoldingRowsForBackfill())
    .filter((row) => !allowedDates || allowedDates.has(row.date))
    .filter((row) => {
      if (!payloadTradingSet.size || !payloadStart || !payloadEnd) return true;
      if (row.date < payloadStart || row.date > payloadEnd) return true;
      return payloadTradingSet.has(row.date);
    });
  const updatedSnapshots = rows.map((row) => {
    const positions = (row.positions || []).map((position) => {
      const code = String(position.code || "").replace(/\D/g, "").slice(-6);
      return enrichHoldingPositionWithHistoryQuote(position, row.date, quoteResolver.resolve(code, row.date));
    });
    return {
      date: row.date,
      snapshot_date: row.date,
      snapshot_time: payload?.fetched_at || new Date().toISOString(),
      source: row.carried ? `持仓延续自 ${row.source_date || "上一持仓日"}，历史行情补齐` : "已导入持仓快照，历史行情补齐",
      carried: Boolean(row.carried),
      source_date: row.source_date || row.date,
      open_positions: positions,
      positions,
      summary: getHoldingSummary(positions),
      saved_at: new Date().toISOString(),
    };
  });
  const updatedDates = new Set(updatedSnapshots.map((item) => item.date));
  const existing = Array.isArray(dataset.daily_snapshots) ? dataset.daily_snapshots : [];
  dataset.daily_snapshots = [
    ...existing.filter((item) => !updatedDates.has(getSnapshotDate(item))),
    ...updatedSnapshots,
  ].sort((a, b) => (getSnapshotDate(a) || "").localeCompare(getSnapshotDate(b) || ""));
  current.dataset = dataset;
  current.analysis = computeAnalysis(dataset);
  current.meta = buildDatasetMeta(dataset, current.name);
  return updatedSnapshots.reduce((sum, snapshot) => sum + (snapshot.open_positions || []).length, 0);
}

async function backfillHoldingHistoryFromBackend() {
  const rows = collectEffectiveHoldingRowsForBackfill();
  const codes = unique(rows.flatMap((row) => (row.positions || []).map((item) => item.code).filter(Boolean)));
  const dates = rows.map((row) => row.date).filter(Boolean);
  const current = getCurrentPortfolio();
  if (!codes.length || !dates.length) {
    actionStatusEl.textContent = "暂无可补齐的历史持仓。";
    return null;
  }
  const button = document.getElementById("backfillHoldingHistoryBtn");
  const statusEl = document.getElementById("holdingQuotesStatus");
  const originalText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "补齐中...";
  }
  if (statusEl) statusEl.textContent = `正在补齐 ${dates[0]} 至 ${dates[dates.length - 1]} 的历史持仓行情...`;
  try {
    const payload = await postJson("/api/holding-sync/run", {
      portfolio_id: current.id,
      reason: "manual_history_backfill",
      force: true,
    });
    if (!payload?.portfolio?.dataset) throw new Error("后台同步未返回完整持仓账本");
    current.dataset = payload.portfolio.dataset;
    current.analysis = computeAnalysis(current.dataset);
    current.meta = buildDatasetMeta(current.dataset, current.name);
    const byCode = {};
    (payload.latest_quotes || []).forEach((quote) => {
      if (quote.code) byCode[quote.code] = quote;
    });
    state.holdingQuotes = {
      snapshot_date: current.dataset.latest_snapshot_date || formatDateObject(new Date()),
      snapshot_time: payload.synced_at || new Date().toISOString(),
      source: "后台统一同步（东方财富/腾讯/新浪）",
      byCode,
    };
    persistState();
    renderAll();
    actionStatusEl.textContent = `历史持仓行情已由后台账本补齐：${dates.length} 个持仓日期、${codes.length} 只标的，共保存 ${payload.history_rows || 0} 条 K 线。`;
    return payload;
  } catch (error) {
    actionStatusEl.textContent = `历史持仓行情补齐失败：${error.message}`;
    if (statusEl) statusEl.textContent = `历史持仓行情补齐失败：${error.message}`;
    return null;
  } finally {
    const nextButton = document.getElementById("backfillHoldingHistoryBtn");
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = originalText || "补齐历史行情";
    }
  }
}

function getHoldingRowsForMarketRefresh() {
  return collectEffectiveHoldingRowsForBackfill()
    .filter((row) => row.date && Array.isArray(row.positions) && row.positions.length);
}

async function refreshHoldingMarketDataAfterChange(reason = "holding_changed", generation = holdingMarketRefreshGeneration) {
  if (holdingMarketAutoRefreshPending) {
    holdingMarketRefreshRerunRequested = true;
    return null;
  }
  const current = getCurrentPortfolio();
  if (!current) return null;
  const portfolioId = current.id;
  const validationSignatureBefore = logicValidationDatasetSignature(current.dataset);
  const statusEl = document.getElementById("holdingQuotesStatus");
  holdingMarketAutoRefreshPending = true;
  if (statusEl) statusEl.textContent = "持仓已更新：正在抓取行情、重算每日收益，并同步一致性判断与风控 K 线...";
  try {
    const payload = await postJson("/api/holding-sync/run", {
      portfolio_id: portfolioId,
      reason,
      // 首次打开页面只做增量刷新，复用已缓存的历史 K 线；交易、换仓
      // 和人工刷新仍强制联网，避免多个浏览器标签同时重复下载全量历史。
      force: reason !== "startup_holding_reconcile",
    });
    if (generation !== holdingMarketRefreshGeneration || getCurrentPortfolio()?.id !== portfolioId) {
      holdingMarketRefreshRerunRequested = true;
      return { ok: false, stale: true };
    }
    if (!payload?.portfolio?.dataset) throw new Error("后台同步未返回组合数据");
    current.dataset = payload.portfolio.dataset;
    current.analysis = computeAnalysis(current.dataset);
    current.meta = buildDatasetMeta(current.dataset, current.name);
    const byCode = {};
    (payload.latest_quotes || []).forEach((quote) => {
      if (quote.code) byCode[quote.code] = quote;
    });
    state.holdingQuotes = {
      snapshot_date: formatDateObject(new Date()),
      snapshot_time: payload.synced_at || new Date().toISOString(),
      source: "后台统一同步（东方财富/腾讯/新浪）",
      byCode,
    };
    const validationInputsChanged = validationSignatureBefore !== logicValidationDatasetSignature(current.dataset);
    if (validationInputsChanged) state.logicValidationResult = null;
    state.riskDashboardError = "";
    state.riskDashboardLoading = true;
    persistState();
    renderAll();
    state.riskDashboardLoading = false;
    // These two endpoints may both persist cache/analysis records in SQLite;
    // run them in order to avoid a transient database lock on local machines.
    await loadRiskDashboard(true);
    if (validationInputsChanged || !state.logicValidationResult) {
      logicValidationAutoGeneration += 1;
      await validateLogicConsistencyWithLlm({
        automatic: true,
        reason: `holding_sync:${reason}`,
        generation: logicValidationAutoGeneration,
      });
    }
    const missingCount = (payload.missing_price_pairs || []).length;
    actionStatusEl.textContent = missingCount
      ? `持仓关联数据已刷新；${missingCount} 条历史价格抓取失败，系统已保留明确错误并会在下次变更时立即重试。`
      : `持仓关联数据已同步：${payload.codes?.length || 0} 只标的、${payload.history_rows || 0} 条 K 线；每日收益、言行一致性和风控图表均已刷新。`;
    return payload;
  } catch (error) {
    state.riskDashboardLoading = false;
    actionStatusEl.textContent = `持仓关联数据同步失败：${error.message}`;
    if (statusEl) statusEl.textContent = `持仓关联数据同步失败：${error.message}`;
    return null;
  } finally {
    holdingMarketAutoRefreshPending = false;
    if (holdingMarketRefreshRerunRequested || generation !== holdingMarketRefreshGeneration) {
      holdingMarketRefreshRerunRequested = false;
      window.clearTimeout(holdingMarketAutoRefreshTimer);
      holdingMarketAutoRefreshTimer = window.setTimeout(() => {
        refreshHoldingMarketDataAfterChange("holding_changed_rerun", holdingMarketRefreshGeneration);
      }, 50);
    }
  }
}

function queueHoldingMarketRefresh(reason = "holding_changed") {
  holdingMarketRefreshGeneration += 1;
  window.clearTimeout(holdingMarketAutoRefreshTimer);
  holdingMarketAutoRefreshTimer = window.setTimeout(() => {
    refreshHoldingMarketDataAfterChange(reason, holdingMarketRefreshGeneration);
  }, 180);
}

function renderHoldingStockListCell(row) {
  if (!row?.positions?.length) return `<span style="color:var(--muted);">暂无记录</span>`;
  return `
    <div style="display:grid; gap:8px; min-width:180px;">
      ${row.positions.map((item) => `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
          <span><strong>${escapeHtml(item.stock)}</strong>${item.code ? `<br><small style="color:var(--muted);">${escapeHtml(item.code)}</small>` : ""}</span>
          <span class="${returnClassName(item.day_pct_change)}">${item.day_pct_change == null || item.day_pct_change === "" ? "—" : pct(parsePctPointValue(item.day_pct_change))}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function holdingSkillInsight(code) {
  const cleanCode = String(code || "").replace(/\D/g, "").slice(-6);
  return (state.holdingSkillAnalysis?.items || []).find((item) => String(item.code || "").replace(/\D/g, "").slice(-6) === cleanCode) || null;
}

function holdingSkillKline(code) {
  const cleanCode = String(code || "").replace(/\D/g, "").slice(-6);
  return (state.riskDashboard?.holding_klines?.items || []).find((item) => String(item.code || "").replace(/\D/g, "").slice(-6) === cleanCode) || null;
}

function holdingSkillPlainText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*\|?\s*:?-{3,}/.test(line))
    .map((line) => line
      .replace(/^\s*#{1,6}\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .replace(/\s*\|\s*/g, " ｜ ")
      .trim())
    .filter(Boolean)
    .join("\n");
}

function holdingSkillLevelCards(insight) {
  const levels = insight?.levels || {};
  const configs = [
    ["support", "支撑位", "support"],
    ["pressure", "压力位", "pressure"],
    ["take_profit", "止盈参考", "take-profit"],
    ["stop_loss", "止损参考", "stop-loss"],
  ];
  return `<div class="holding-skill-levels">${configs.map(([key, label, className]) => {
    const level = levels[key] || {};
    return `<article class="${className}"><span>${label}</span><strong>${level.value == null ? "—" : `¥${escapeHtml(num(level.value, 2))}`}</strong><small>${escapeHtml(level.text || "等待华泰指标技能返回")}</small></article>`;
  }).join("")}</div>`;
}

function holdingSkillNarrative(title, value, placeholder) {
  const textContent = holdingSkillPlainText(value);
  return `<section><span>${escapeHtml(title)}</span><p>${escapeHtml(textContent || placeholder)}</p></section>`;
}

function renderHoldingSkillCards(positions, context = "holding") {
  const rows = Array.isArray(positions) ? positions : [];
  const portfolioId = state.currentPortfolioId || "";
  const loadedForCurrent = state.holdingSkillAnalysisPortfolioId === portfolioId && state.holdingSkillAnalysis;
  if (state.holdingSkillAnalysisLoading) return `<div class="holding-skill-status loading"><span></span><div><strong>正在调用华泰技能分析当前持仓…</strong><p>同步压力支撑、止盈止损、基本面和交易计划。</p></div></div>`;
  if (state.holdingSkillAnalysisError) return `<div class="holding-skill-status error"><div><strong>华泰技能分析暂时不可用</strong><p>${escapeHtml(state.holdingSkillAnalysisError)}</p></div><button class="pill-btn secondary" type="button" data-holding-skill-refresh>重新分析</button></div>`;
  if (!loadedForCurrent) return `<div class="holding-skill-status"><div><strong>等待同步华泰技能数据</strong><p>页面会自动读取当前持仓并生成压力支撑与交易计划。</p></div></div>`;
  return `<div class="holding-skill-list">${rows.map((position, index) => {
    const code = position.code || "";
    const insight = holdingSkillInsight(code);
    const kline = holdingSkillKline(code);
    const chartId = `${context === "material" ? "materialHoldingSkillKline" : "holdingSkillKline"}-${index}`;
    return `<article class="holding-skill-card">
      <header><div><span>${String(index + 1).padStart(2, "0")}</span><div><h4>${escapeHtml(position.stock || position.name || insight?.stock || code || "当前持仓")}</h4><small>${escapeHtml(code || "代码待补全")} · ${escapeHtml(insight?.industry || position.industry || "行业待识别")} · 仓位 ${position.weight == null || position.weight === "" ? "—" : `${escapeHtml(num(position.weight, 1))}%`}</small></div></div><b>${insight?.analysis_mode === "skills" ? "华泰技能同步" : "本地行情分析"}</b></header>
      <div class="holding-skill-chart-grid"><div class="holding-skill-chart"><div class="holding-skill-chart-head"><strong>日K · 压力支撑与止损表达</strong><span>${escapeHtml(kline?.latest_date || state.holdingSkillAnalysis?.snapshot_date || "")}</span></div>${(kline?.dates || []).length ? `<div id="${chartId}" class="holding-skill-kline" data-holding-skill-code="${escapeHtml(code)}"></div>` : `<div class="material-trace-placeholder chart">暂无该持仓K线</div>`}</div>${holdingSkillLevelCards(insight)}</div>
      <div class="holding-skill-narratives">
        ${holdingSkillNarrative("基本面逻辑", insight?.fundamental_logic, "暂无基本面技能分析")}
        ${holdingSkillNarrative("基本交易计划", insight?.trading_plan, "暂无基本交易计划")}
        ${holdingSkillNarrative("止损策略", insight?.stop_loss_strategy, "暂无止损策略")}
        ${holdingSkillNarrative("为什么选择它作为行业持仓", insight?.industry_selection_reason, "暂无行业代表性说明")}
      </div>
    </article>`;
  }).join("") || `<div class="material-trace-placeholder">当前组合暂无持仓</div>`}</div><div class="holding-skill-source"><span>${state.holdingSkillAnalysis?.source?.fallback ? "外部技能不可用时自动使用本地已核验行情，未补写财务数据" : "压力支撑：query-indicator / queryIndicator"}</span><span>${state.holdingSkillAnalysis?.source?.fallback ? "支撑压力取近20个有效交易日区间，仅作复核参考" : "基本面与策略：financial-analysis / marketInsight"}</span><span>生成于 ${escapeHtml(state.holdingSkillAnalysis?.generated_at || "")}</span><button class="text-action" type="button" data-holding-skill-refresh>刷新技能分析</button></div>`;
}

function holdingSkillChartOption(kline = {}, insight = {}) {
  const levels = insight.levels || {};
  const marks = [
    [levels.support, "支撑", "#168252", "insideStartTop"],
    [levels.pressure, "压力", "#c62828", "insideEndTop"],
    [levels.take_profit, "止盈", "#7c3aed", "insideStartBottom"],
    [levels.stop_loss, "止损", "#ea580c", "insideEndBottom"],
  ].filter(([item]) => materialNumber(item?.value) != null).map(([item, label, color, position]) => ({
    name: label,
    yAxis: Number(item.value),
    lineStyle: { color, type: "dashed", width: 1.5 },
    label: { formatter: `${label} ${num(item.value, 2)}`, color, position, fontSize: 10 },
  }));
  return {
    animation: false,
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["K线", "MA20", "MA60"], top: 3, right: 8, textStyle: { fontSize: 10 } },
    grid: [{ left: 52, right: 56, top: 37, height: "61%" }, { left: 52, right: 56, top: "76%", height: "11%" }],
    xAxis: [{ type: "category", data: kline.dates || [], boundaryGap: true, axisLabel: { color: "#64748b", fontSize: 9 }, axisLine: { lineStyle: { color: "#cbd5e1" } } }, { type: "category", gridIndex: 1, data: kline.dates || [], boundaryGap: true, axisLabel: { show: false }, axisTick: { show: false } }],
    yAxis: [{ scale: true, axisLabel: { color: "#64748b", fontSize: 9 }, splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } } }, { gridIndex: 1, scale: true, axisLabel: { show: false }, splitLine: { show: false } }],
    dataZoom: [{ type: "inside", xAxisIndex: [0, 1], start: 45, end: 100 }, { type: "slider", xAxisIndex: [0, 1], start: 45, end: 100, bottom: 0, height: 17 }],
    series: [
      { name: "K线", type: "candlestick", data: kline.ohlc || [], itemStyle: { color: "#c62828", color0: "#168252", borderColor: "#c62828", borderColor0: "#168252" }, markLine: { symbol: ["none", "none"], silent: true, data: marks } },
      { name: "MA20", type: "line", data: kline.ma20 || [], showSymbol: false, lineStyle: { width: 1.4, color: "#d97706" } },
      { name: "MA60", type: "line", data: kline.ma60 || [], showSymbol: false, lineStyle: { width: 1.4, color: "#2563eb" } },
      { name: "成交量", type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: kline.volumes || [], itemStyle: { color: "#94a3b8" } },
    ],
  };
}

function renderHoldingSkillCharts(context = "holding") {
  if (typeof echarts === "undefined") return;
  const prefix = context === "material" ? "materialHoldingSkillKline" : "holdingSkillKline";
  document.querySelectorAll(`[id^="${prefix}-"]`).forEach((dom) => {
    const code = dom.dataset.holdingSkillCode || "";
    const kline = holdingSkillKline(code);
    const insight = holdingSkillInsight(code);
    if (!kline || !insight || !(kline.dates || []).length) return;
    const chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
    chart.setOption(holdingSkillChartOption(kline, insight), true);
  });
}

async function loadHoldingSkillAnalysis(force = false) {
  const portfolioId = state.currentPortfolioId || "";
  if (state.holdingSkillAnalysisLoading) return;
  if (state.holdingSkillAnalysis && state.holdingSkillAnalysisPortfolioId === portfolioId && !force) return;
  state.holdingSkillAnalysisLoading = true;
  state.holdingSkillAnalysisError = "";
  renderAll();
  try {
    await loadRiskDashboard(false);
    await waitForMaterialRiskLoad();
    const params = new URLSearchParams({ portfolio_id: portfolioId });
    if (force) params.set("refresh", "1");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 180000);
    let response;
    try {
      response = await fetch(`/api/holding-analysis/htsc-skills?${params}`, { cache: "no-store", signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
    const payload = await response.json();
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP ${response.status}`);
    state.holdingSkillAnalysis = payload;
    state.holdingSkillAnalysisPortfolioId = portfolioId;
  } catch (error) {
    state.holdingSkillAnalysisError = error?.name === "AbortError" ? "技能分析超过3分钟，请稍后重试" : (error.message || String(error));
  } finally {
    state.holdingSkillAnalysisLoading = false;
    renderAll();
  }
}

function bindHoldingSkillControls(scope = document) {
  scope.querySelectorAll("[data-holding-skill-refresh]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => loadHoldingSkillAnalysis(true));
  });
}

function renderSimpleHoldingMatrix() {
  const dates = getHoldingDisplayDates();
  const { lookup, previousByDate, ascending } = buildHoldingTimelineLookup();
  const today = formatDateObject(new Date());
  if ((!holdingDateTouched && dates.includes(today)) || !state.selectedHoldingDate || !dates.includes(state.selectedHoldingDate)) {
    state.selectedHoldingDate = dates.includes(today) ? today : dates[dates.length - 1] || today;
  }
  const selectedDate = state.selectedHoldingDate;
  const minDate = dates[0] || selectedDate;
  const maxDate = dates[dates.length - 1] || selectedDate;
  const selectedRow = lookup.get(selectedDate) || { date: selectedDate, positions: [] };
  const previousRow = previousByDate.get(selectedDate) || getPreviousHoldingRowForDate(selectedDate, ascending);
  const changeSummary = buildHoldingChangeSummary(selectedRow, previousRow);
  const positionCarriedCount = (selectedRow.positions || []).filter((item) => item.is_carried).length;
  const summaryCarriedCount = Number(selectedRow.summary?.carried_position_count);
  const ledgerCarriedCount = Number.isFinite(summaryCarriedCount)
    ? summaryCarriedCount
    : positionCarriedCount;
  const ledgerManaged = getCurrentPortfolio()?.dataset?.holding_ledger?.mode === "backend_event_sourcing";
  const marketSync = getCurrentPortfolio()?.dataset?.holding_market_sync || {};
  const lastRefreshTime = marketSync.synced_at || selectedRow.snapshot_time || state.holdingQuotes?.snapshot_time || "";
  const refreshLabel = lastRefreshTime
    ? String(lastRefreshTime).replace("T", " ").replace(/\.\d+(?=Z|$)/, "").replace(/Z$/, "")
    : "待刷新";

  return `
    <div class="panel-card">
      <div class="feed-panel-heading">
        <div>
          <h3>每日持仓明细</h3>
          <p class="lead">由后台账本按日结转；只要没有明确卖出、清仓或调出，标的会持续出现在之后每日持仓中。</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="feed-sync-badge">${ledgerManaged ? `后台账本 · ${ledgerCarriedCount} 只延续 · 行情刷新 ${escapeHtml(refreshLabel)}` : selectedRow.carried ? `延续自 ${selectedRow.source_date || "上一持仓日"}` : state.holdingQuotes?.snapshot_time ? `行情 ${state.holdingQuotes.snapshot_time.replace("T", " ")}` : "行情待补齐"}</span>
          <button class="pill-btn secondary" id="backfillHoldingHistoryBtn" type="button">补齐历史行情</button>
          <button class="pill-btn primary" id="refreshHoldingQuotesBtn" type="button">刷新并保存今日涨跌</button>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:auto minmax(220px,1fr) auto; gap:10px; align-items:center; margin-top:14px;">
        <button class="pill-btn secondary holding-step-btn" type="button" data-step="-1">上一日</button>
        <div style="display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;">
          <strong style="font-size:24px; letter-spacing:0;">${escapeHtml(selectedDate)}</strong>
          <span class="feed-sync-badge">${selectedRow.positions.length ? `${selectedRow.positions.length}只持仓` : "空仓"}</span>
          <input id="holdingDateInput" type="date" value="${escapeHtml(selectedDate)}" min="${escapeHtml(minDate)}" max="${escapeHtml(maxDate)}" style="height:38px; border-radius:12px; border:1px solid var(--line-strong); padding:0 12px; color:var(--text); background:white;">
        </div>
        <button class="pill-btn secondary holding-step-btn" type="button" data-step="1">下一日</button>
      </div>
      <div class="feed-inline-status" id="holdingQuotesStatus">${escapeHtml(selectedDate)} · ${selectedRow.positions.length ? `${selectedRow.positions.length} 只持仓` : "空仓"}。${ledgerManaged ? `其中 ${ledgerCarriedCount} 只由上一日自动结转，${Math.max(0, selectedRow.positions.length - ledgerCarriedCount)} 只在本日发生调仓；行情最后刷新于 ${escapeHtml(refreshLabel)}。` : selectedRow.carried ? `本日未上传新快照，当前持仓延续自 ${escapeHtml(selectedRow.source_date || "上一持仓日")}。` : "本日存在持仓快照。"} 历史行情补齐后会保存每日涨跌和估算市值。</div>
      ${renderHoldingChangeSummary(changeSummary, selectedDate, previousRow)}
      <div class="table-wrap" style="margin-top:14px;">
        <table>
          <thead>
            <tr>
              <th class="left">证券名称</th>
              <th>代码</th>
              <th>数量</th>
              <th>仓位</th>
              <th>市值</th>
              <th>最新价</th>
              <th>当日涨跌幅</th>
              <th>行情日期</th>
              <th>成本价</th>
              <th>持有收益率</th>
              <th>持有收益</th>
              <th class="left">调仓</th>
            </tr>
          </thead>
          <tbody>
            ${selectedRow.positions.length ? selectedRow.positions.map((item) => `
              <tr>
                <td class="left"><strong>${escapeHtml(item.stock)}</strong></td>
                <td>${escapeHtml(item.code || "—")}</td>
                <td>${renderHoldingCell(item.quantity)}</td>
                <td>${renderHoldingCell(item.weight)}</td>
                <td>${renderHoldingCell(item.market_value)}</td>
                <td>${renderHoldingCell(item.latest_price)}</td>
                <td class="${returnClassName(item.day_pct_change)}">${item.day_pct_change == null || item.day_pct_change === "" ? "—" : pct(parsePctPointValue(item.day_pct_change))}</td>
                <td>${renderHoldingQuoteDate(item)}</td>
                <td>${renderHoldingCell(item.cost_price)}</td>
                <td class="${returnClassName(item.return_pct)}">${renderHoldingCell(item.return_pct)}</td>
                <td class="${returnClassName(item.pnl)}">${renderHoldingCell(item.pnl)}</td>
                <td class="left">${renderHoldingChangeCell(changeSummary.positionChangeMap.get(getHoldingPositionKey(item)))}</td>
              </tr>
            `).join("") : `<tr><td colspan="12">空仓</td></tr>`}
            ${changeSummary.removed.length ? changeSummary.removed.map((item) => `
              <tr>
                <td class="left"><strong>${escapeHtml(item.stock)}</strong></td>
                <td>${escapeHtml(item.code || "—")}</td>
                <td>${renderHoldingCell(item.quantity)}</td>
                <td>${renderHoldingCell(item.weight)}</td>
                <td>${renderHoldingCell(item.market_value)}</td>
                <td>${renderHoldingCell(item.latest_price)}</td>
                <td class="${returnClassName(item.day_pct_change)}">${item.day_pct_change == null || item.day_pct_change === "" ? "—" : pct(parsePctPointValue(item.day_pct_change))}</td>
                <td>${renderHoldingQuoteDate(item)}</td>
                <td>${renderHoldingCell(item.cost_price)}</td>
                <td class="${returnClassName(item.return_pct)}">${renderHoldingCell(item.return_pct)}</td>
                <td class="${returnClassName(item.pnl)}">${renderHoldingCell(item.pnl)}</td>
                <td class="left">${renderHoldingChangeCell({ action: "调出", note: `上一持仓日 ${previousRow?.date || "—"} 仍持有` })}</td>
              </tr>
            `).join("") : ""}
          </tbody>
        </table>
      </div>
      <div class="holding-skill-block">
        <div class="holding-skill-block-head"><div><span>华泰技能 · 当前持仓</span><h3>个股K线、压力支撑与基本交易计划</h3><p>每只持仓名称下直接展示日K，并标注压力、支撑、止盈与止损参考位。</p></div></div>
        ${renderHoldingSkillCards(getCurrentHoldingRows(), "holding")}
      </div>
    </div>
  `;
}

function holdingActionLabel(action) {
  return ({ buy: "买入", sell: "卖出", sell_all: "清仓", set: "设定持仓", remove: "删除持仓" })[action] || action || "未知";
}

function canonicalHoldingPosition(raw = {}) {
  const stock = sanitizeStockName(raw.stock || raw["证券名称"] || raw.name || "");
  const code = extractCode(raw.code || raw["证券代码"] || stock);
  const quantity = parseNumber(firstValue(raw, ["quantity", "qty", "证券数量", "持仓数量"], 0)) || 0;
  const costPrice = parseNumber(firstValue(raw, ["cost_price", "成本价", "buy_price", "买入价"], null));
  return {
    ...raw,
    stock,
    code,
    quantity,
    buy_price: costPrice,
    cost_price: costPrice,
    note: cleanText(raw.note || raw["备注"] || ""),
  };
}

function recalculateHoldingDerivedFields(rawPositions) {
  const positions = (rawPositions || []).map(canonicalHoldingPosition).filter((item) => item.stock && item.quantity > 0);
  positions.forEach((item) => {
    const latestPrice = parseNumber(item.latest_price);
    const costPrice = parseNumber(item.cost_price ?? item.buy_price);
    const valuationPrice = latestPrice ?? costPrice;
    if (valuationPrice != null) item.market_value = valuationPrice * item.quantity;
    if (latestPrice != null && costPrice != null && costPrice > 0) {
      item.unrealized_pnl = (latestPrice - costPrice) * item.quantity;
      item.pnl = item.unrealized_pnl;
      item.unrealized_return_pct = ((latestPrice - costPrice) / costPrice) * 100;
      item.return_pct = item.unrealized_return_pct;
    }
  });
  const total = positions.reduce((sum, item) => sum + (parseMoneyValue(item.market_value) || 0), 0);
  if (total > 0) {
    positions.forEach((item) => {
      item.weight = ((parseMoneyValue(item.market_value) || 0) / total) * 100;
    });
  }
  return positions;
}

function holdingOperationIssue(operation) {
  if (!operation?.action) return "缺少操作类型";
  if (!operation.stock && !operation.code) return "缺少证券名称/代码";
  if (!extractCode(operation.code || "")) return "缺少六位证券代码，无法抓取真实价格和 K 线";
  if (["buy", "sell"].includes(operation.action) && !(parseNumber(operation.quantity) > 0)) return "缺少有效数量";
  if (operation.action === "set" && parseNumber(operation.target_quantity ?? operation.quantity) == null) return "缺少目标持仓数量";
  return "";
}

function applyHoldingOperationToPositions(rawPositions, operation) {
  const positions = (rawPositions || []).map(canonicalHoldingPosition);
  const code = extractCode(operation.code || "");
  const stock = sanitizeStockName(operation.stock || "");
  const index = positions.findIndex((item) => (code && item.code === code) || (stock && item.stock === stock));
  const existing = index >= 0 ? positions[index] : null;
  const issue = holdingOperationIssue(operation);
  if (issue) throw new Error(`${holdingActionLabel(operation.action)} ${stock || code || ""}：${issue}`);
  const price = parseNumber(operation.price);
  const quantity = parseNumber(operation.quantity);

  if (operation.action === "buy") {
    const oldQuantity = parseNumber(existing?.quantity) || 0;
    const oldCost = parseNumber(existing?.cost_price ?? existing?.buy_price);
    let nextCost = oldCost;
    if (price != null) {
      nextCost = oldQuantity > 0 && oldCost != null
        ? ((oldQuantity * oldCost) + (quantity * price)) / (oldQuantity + quantity)
        : price;
    }
    const next = {
      ...(existing || {}), stock: stock || existing?.stock, code: code || existing?.code,
      quantity: oldQuantity + quantity, buy_date: existing?.buy_date || operation.date,
      buy_price: nextCost, cost_price: nextCost, note: cleanText(operation.note || existing?.note || "手工交易记录"),
    };
    if (index >= 0) positions[index] = next;
    else positions.push(next);
  } else if (operation.action === "sell" || operation.action === "sell_all") {
    if (!existing) throw new Error(`当前快照中未找到 ${stock || code}，不能执行卖出。`);
    const oldQuantity = parseNumber(existing.quantity) || 0;
    const sellQuantity = operation.action === "sell_all" ? oldQuantity : quantity;
    if (sellQuantity > oldQuantity) throw new Error(`${existing.stock} 卖出 ${sellQuantity} 股，超过可用持仓 ${oldQuantity} 股。`);
    const remaining = oldQuantity - sellQuantity;
    if (remaining <= 0) positions.splice(index, 1);
    else positions[index] = { ...existing, quantity: remaining, note: cleanText(operation.note || existing.note || "部分减仓") };
  } else if (operation.action === "set") {
    const targetQuantity = parseNumber(operation.target_quantity ?? operation.quantity);
    if (targetQuantity <= 0) {
      if (index >= 0) positions.splice(index, 1);
    } else {
      const nextCost = price ?? parseNumber(existing?.cost_price ?? existing?.buy_price);
      const next = {
        ...(existing || {}), stock: stock || existing?.stock, code: code || existing?.code,
        quantity: targetQuantity, buy_date: existing?.buy_date || operation.date,
        buy_price: nextCost, cost_price: nextCost, note: cleanText(operation.note || existing?.note || "持仓修正"),
      };
      if (index >= 0) positions[index] = next;
      else positions.push(next);
    }
  } else if (operation.action === "remove") {
    if (index >= 0) positions.splice(index, 1);
  }
  return recalculateHoldingDerivedFields(positions);
}

function buildHoldingSnapshotFromPositions(date, positions, source) {
  const normalized = recalculateHoldingDerivedFields(positions).map((item) => ({ ...item, date }));
  return {
    date,
    snapshot_date: date,
    snapshot_time: new Date().toISOString(),
    source,
    open_positions: normalized,
    positions: normalized,
    summary: getHoldingSummary(normalized),
    saved_at: new Date().toISOString(),
  };
}

async function applyHoldingOperations(operations, options = {}) {
  const current = getCurrentPortfolio();
  if (!current) throw new Error("请先创建或导入一个组合。");
  const clearHistory = Boolean(options.clearHistory);
  if (!Array.isArray(operations) || (!operations.length && !clearHistory)) throw new Error("没有可应用的持仓操作。");
  const normalizedOperations = (operations || []).map((item) => ({
    ...item,
    date: normalizeDateInput(item.date) || formatDateObject(new Date()),
  }));
  const issue = normalizedOperations.map(holdingOperationIssue).find(Boolean);
  if (issue) throw new Error(issue);
  const result = await postJson("/api/holding-ledger/apply", {
    portfolio_id: current.id,
    operations: normalizedOperations,
    clear_history: clearHistory,
    clear_scope: clearHistory ? "all_portfolios" : "current_portfolio",
    replace_all: Boolean(options.replaceAll),
    source: options.sourceKey || "manual_trade",
    source_label: options.source || "持仓交易工作台",
    intent: options.intent || "apply_trades",
    raw_text: options.rawText || "",
    end_date: formatDateObject(new Date()),
  });
  if (!result?.portfolio?.dataset) throw new Error("后台账本未返回更新后的持仓。");
  if (clearHistory && Array.isArray(result.portfolios)) {
    result.portfolios.forEach((cleared) => {
      const record = state.portfolios.find((item) => item.id === cleared.id);
      if (!record || !cleared.dataset) return;
      record.dataset = cleared.dataset;
      record.analysis = computeAnalysis(record.dataset);
      record.meta = buildDatasetMeta(record.dataset, record.name);
    });
  }
  current.dataset = result.portfolio.dataset;
  current.analysis = computeAnalysis(current.dataset);
  current.meta = buildDatasetMeta(current.dataset, current.name);
  state.selectedHoldingDate = clearHistory ? "" : normalizedOperations.map((item) => item.date).sort().at(-1) || state.selectedHoldingDate;
  holdingDateTouched = !clearHistory;
  if (clearHistory) state.holdingQuotes = null;
  persistState();
  renderAll();
  queueHoldingMarketRefresh(options.sourceKey || "holding_ledger");
  return Number(result.applied || normalizedOperations.length);
}

function renderHoldingAssistantPreview() {
  const preview = state.holdingAssistantPreview;
  if (!preview) return `<div class="holding-assistant-empty">粘贴交易软件中最近的调仓文字或完整持仓，DeepSeek 会先生成可核对的预览。</div>`;
  const operations = preview.operations || [];
  const clearHistory = Boolean(preview.clear_history || preview.intent === "clear_all_history");
  const canApply = clearHistory || (operations.length > 0 && operations.every((item) => !holdingOperationIssue(item)));
  return `
    <div class="holding-preview-head">
      <div><strong>${escapeHtml(preview.summary || "解析完成")}</strong><span>${preview.mode === "deepseek" ? "DeepSeek" : "本地规则"} · ${clearHistory ? "删除全部持仓历史" : preview.replace_all ? "完整替换快照" : "增量调仓"}</span></div>
      <span class="feed-sync-badge">${clearHistory ? "高风险待确认" : "待确认"}</span>
    </div>
    ${clearHistory ? `<div class="holding-destructive-preview"><strong>将永久清空全部模拟组合</strong><span>所有组合的当前持仓、历史调仓事件、每日持仓快照和历史交易记录都会被删除；语料库和行情缓存不受影响。</span></div>` : ""}
    <div class="holding-preview-list">
      ${clearHistory ? "" : operations.map((item) => {
        const issue = holdingOperationIssue(item);
        return `<div class="holding-preview-row ${["buy", "set"].includes(item.action) ? "is-buy" : "is-sell"}">
          <span class="trade-side">${escapeHtml(holdingActionLabel(item.action))}</span>
          <span><strong>${escapeHtml(item.stock || "名称缺失")}</strong><small>${escapeHtml(item.code || "代码缺失")}</small></span>
          <span>${escapeHtml(item.date || "—")}<small>${item.action === "set" ? `目标 ${num(parseNumber(item.target_quantity), 0)} 股` : item.action === "sell_all" ? "全部" : `${num(parseNumber(item.quantity), 0)} 股`}</small></span>
          <span>${item.price == null ? "正在自动抓取价格" : `¥${num(item.price, 3)}`}<small>${item.price_is_proxy ? `${escapeHtml(item.price_type || "交易日收盘价代理")} · ${escapeHtml(item.price_source_date || item.date || "")}` : `置信度 ${Math.round((item.confidence || 0) * 100)}%`}</small></span>
          ${issue ? `<span class="holding-preview-issue">${escapeHtml(issue)}</span>` : ""}
        </div>`;
      }).join("") || (clearHistory ? "" : `<div class="holding-assistant-empty">未识别到可执行操作，请补充代码、名称和数量后重新解析。</div>`)}
    </div>
    ${(preview.warnings || []).length ? `<div class="holding-warning-box">${preview.warnings.map((item) => `<div>• ${escapeHtml(item)}</div>`).join("")}</div>` : ""}
    <div class="holding-preview-actions">
      <button class="pill-btn secondary" id="cancelHoldingAssistantBtn" type="button">取消预览</button>
      <button class="pill-btn ${clearHistory ? "danger" : "primary"}" id="confirmHoldingAssistantBtn" type="button" ${canApply ? "" : "disabled"}>${clearHistory ? "确认清空全部持仓历史" : "确认应用到持仓"}</button>
    </div>`;
}

function adjustmentReasonPlanRows(item) {
  const rows = Array.isArray(item?.daily_trade_plan) ? item.daily_trade_plan : [];
  return rows.map((row, index) => {
    if (typeof row === "string") return { phase: `计划 ${index + 1}`, plan: row };
    return {
      phase: cleanText(row?.phase || row?.day || `计划 ${index + 1}`),
      plan: cleanText(row?.plan || row?.action || row?.content || "")
    };
  }).filter((row) => row.plan);
}

function formatAdjustmentReasonForCopy(result) {
  const items = Array.isArray(result?.items) ? result.items : [];
  const blocks = items.map((item, index) => {
    const plans = adjustmentReasonPlanRows(item);
    const risks = Array.isArray(item.invalidation_conditions) ? item.invalidation_conditions : [];
    return [
      `${index + 1}. ${item.stock || "本次调仓"}${item.code ? `（${item.code}）` : ""}｜${item.action || "调仓"}`,
      `预计持有：${item.expected_holding_days || "待结合交易计划确认"}`,
      `调仓理由：${item.action_reason || "—"}`,
      `基本面逻辑：${item.fundamental_logic || "—"}`,
      `技术面逻辑：${item.technical_logic || "—"}`,
      "每日交易计划：",
      ...(plans.length ? plans.map((row) => `- ${row.phase}：${row.plan}`) : ["- 暂无"]),
      ...(risks.length ? ["失效条件：", ...risks.map((risk) => `- ${risk}`)] : [])
    ].join("\n");
  });
  return [result?.summary || "调仓理由", ...blocks].filter(Boolean).join("\n\n");
}

function renderAdjustmentReasonResult(result) {
  if (!result) {
    return `<div class="adjustment-reason-empty">输入今天准备执行的买入、加仓、减仓或清仓计划，系统会结合最近金山语料与真实行情生成固定格式的调仓理由。</div>`;
  }
  const items = Array.isArray(result.items) ? result.items : [];
  const source = result.source_summary || {};
  return `
    <div class="adjustment-reason-result-head">
      <div><strong>${escapeHtml(result.summary || "调仓理由已生成")}</strong><span>${escapeHtml(result.mode === "llm" ? "DeepSeek 生成" : "本地规则生成")} · ${escapeHtml(result.generated_at || "")}</span></div>
      <button class="pill-btn secondary" id="copyAdjustmentReasonBtn" type="button">复制全部理由</button>
    </div>
    <div class="adjustment-reason-source">本次参考：最近金山语料 ${Number(source.advisor_doc_count || 0)} 条${source.latest_advisor_date ? `（更新至 ${escapeHtml(source.latest_advisor_date)}）` : ""} · 技术行情 ${Number(source.technical_symbol_count || 0)} 只</div>
    <div class="adjustment-reason-list">
      ${items.map((item, index) => {
        const plans = adjustmentReasonPlanRows(item);
        const risks = Array.isArray(item.invalidation_conditions) ? item.invalidation_conditions : [];
        return `<article class="adjustment-reason-item">
          <div class="adjustment-reason-item-head"><div><span>${index + 1}</span><strong>${escapeHtml(item.stock || "本次调仓")}</strong><small>${escapeHtml(item.code || "未提供代码")}</small></div><b>${escapeHtml(item.action || "调仓")}</b></div>
          <div class="adjustment-reason-holding"><span>预计持有</span><strong>${escapeHtml(item.expected_holding_days || "待确认")}</strong></div>
          <div class="adjustment-reason-grid">
            <div><span>调仓理由</span><p>${escapeHtml(item.action_reason || "—")}</p></div>
            <div><span>基本面逻辑</span><p>${escapeHtml(item.fundamental_logic || "—")}</p></div>
            <div><span>技术面逻辑</span><p>${escapeHtml(item.technical_logic || "—")}</p></div>
          </div>
          <div class="adjustment-plan"><strong>每日个股交易计划</strong>${plans.map((row) => `<div><span>${escapeHtml(row.phase)}</span><p>${escapeHtml(row.plan)}</p></div>`).join("") || `<p>暂无可执行计划。</p>`}</div>
          ${risks.length ? `<div class="adjustment-risks"><strong>失效条件 / 风险边界</strong>${risks.map((risk) => `<span>• ${escapeHtml(risk)}</span>`).join("")}</div>` : ""}
        </article>`;
      }).join("") || `<div class="adjustment-reason-empty">没有生成可展示的标的，请补充证券名称、代码和交易方向。</div>`}
    </div>
    ${(result.warnings || []).length ? `<div class="holding-warning-box">${result.warnings.map((item) => `<div>• ${escapeHtml(item)}</div>`).join("")}</div>` : ""}`;
}

function renderAdjustmentReasonWorkbench() {
  const current = getCurrentPortfolio();
  const portfolioId = current?.id || "__default__";
  const draft = state.adjustmentReasonDraftByPortfolio[portfolioId] || "";
  const status = state.adjustmentReasonStatusByPortfolio[portfolioId] || "只生成理由与计划，不会自动修改持仓；结果可一键复制。";
  const result = state.adjustmentReasonResultByPortfolio[portfolioId] || null;
  return `<section class="panel-card adjustment-reason-card">
    <div class="trade-panel-title"><div><span class="trade-kicker deepseek">AI 调仓理由工作台</span><h3>语料驱动调仓理由</h3><p>结合最近金山文档语料、当前组合与个股技术行情，生成可直接使用的固定格式理由。</p></div><span class="assistant-safe-badge">生成理由 · 不改持仓</span></div>
    <textarea id="adjustmentReasonText" class="holding-assistant-text adjustment-reason-text" placeholder="粘贴今天准备执行的交易，例如：&#10;今天计划加仓北方华创 002371，仓位从10%提高到15%；&#10;西部矿业 601168 冲高减仓5%，如果跌破近期支撑则继续降低仓位。">${escapeHtml(draft)}</textarea>
    <div class="assistant-controls adjustment-reason-controls"><span>输出：预计持有天数 / 调仓理由 / 基本面逻辑 / 技术面逻辑 / 每日交易计划</span><div><button class="pill-btn secondary" id="useHoldingAssistantDraftBtn" type="button">带入上方交易描述</button><button class="pill-btn primary" id="generateAdjustmentReasonBtn" type="button">生成调仓理由</button></div></div>
    <div class="trade-status assistant">${escapeHtml(status)}</div>
    ${renderAdjustmentReasonResult(result)}
  </section>`;
}

function renderHoldingTradingWorkbench() {
  const current = getCurrentPortfolio();
  const holdings = getCurrentHoldingRows();
  const today = formatDateObject(new Date());
  const ledger = current?.dataset?.holding_ledger || {};
  return `
    <div class="holding-trading-grid">
      <section class="panel-card trading-ticket">
        <div class="trade-panel-title"><div><span class="trade-kicker">持仓交易台</span><h3>实时买入 / 卖出</h3></div><span class="portfolio-live-dot">${escapeHtml(current?.name || "未选组合")}</span></div>
        <form id="manualHoldingTradeForm" class="trade-form">
          <label><span>交易日期</span><input id="manualTradeDate" name="date" type="date" value="${today}" required></label>
          <label><span>操作</span><select id="manualTradeAction" name="action"><option value="buy">买入 / 加仓</option><option value="sell">卖出 / 减仓</option><option value="sell_all">清仓</option></select></label>
          <label><span>证券代码</span><input id="manualTradeCode" name="code" inputmode="numeric" maxlength="6" placeholder="例：688981" required></label>
          <label><span>证券名称</span><input id="manualTradeStock" name="stock" placeholder="例：中芯国际" required></label>
          <label><span>成交价</span><input id="manualTradePrice" name="price" type="number" min="0" step="0.001" placeholder="元"></label>
          <label><span>成交数量</span><input id="manualTradeQuantity" name="quantity" type="number" min="1" step="1" placeholder="股" required></label>
          <label class="trade-form-wide"><span>备注</span><input id="manualTradeNote" name="note" placeholder="例：盘中加仓 / 止盈减仓"></label>
          <button class="trade-submit buy" id="manualTradeSubmitBtn" type="submit">确认买入</button>
        </form>
        <div class="trade-quick-picks">
          <span>快速选择当前持仓</span>
          <div>${holdings.map((item) => `<button type="button" data-trade-position data-code="${escapeHtml(item.code)}" data-stock="${escapeHtml(item.stock)}">${escapeHtml(item.stock)} <small>${escapeHtml(item.code)}</small></button>`).join("") || `<em>当前空仓，可直接录入新标的</em>`}</div>
        </div>
        <div class="trade-status">${escapeHtml(state.holdingTradeStatus || (ledger.mode === "backend_event_sourcing" ? `后台账本已接管：${ledger.rebuilt_from || "起始日"} 至 ${ledger.rebuilt_to || "今日"}，共结转 ${ledger.day_count || 0} 天。未调出的标的会持续保留。` : "成交后会写入后台调仓账本，逐日结转持仓，并刷新行情 K 线和风控分析。"))}</div>
      </section>
      <section class="panel-card holding-assistant-card">
        <div class="trade-panel-title"><div><span class="trade-kicker deepseek">AI 持仓助手</span><h3>DeepSeek 调仓解析</h3></div><span class="assistant-safe-badge">预览后落库</span></div>
        <textarea id="holdingAssistantText" class="holding-assistant-text" placeholder="直接粘贴，例如：&#10;8月12日买入中芯国际 688981 1000股，成交价54.30元；&#10;把8月12日中芯国际的持仓改为2000股；&#10;清空全部持仓记录。">${escapeHtml(state.holdingAssistantDraft || "")}</textarea>
        <div class="assistant-controls"><span>DeepSeek 只解析，不会自动改数据</span><button class="pill-btn primary" id="parseHoldingAssistantBtn" type="button">DeepSeek 解析</button></div>
        <div class="trade-status assistant">${escapeHtml(state.holdingAssistantStatus || "支持调仓、完整持仓、任意历史日期修正和清空全部持仓记录。")}</div>
        ${renderHoldingAssistantPreview()}
      </section>
    </div>
    <div style="height:14px;"></div>
    ${renderAdjustmentReasonWorkbench()}`;
}

function renderHoldingImportPanel() {
  return `
    <div class="panel-card">
      <div class="feed-panel-heading">
        <div>
          <h3>导入持仓数据</h3>
          <p class="lead">上传每日持仓、交易记录或文件夹后，数据会进入后台持仓账本。某日调入且后续没有调出的标的，会自动结转到之后每一天。</p>
        </div>
        <div class="feed-sync-badge">Excel / CSV / JSON / HTML</div>
      </div>
      <div class="feed-actions">
        <span class="natural-import-hint">持仓快照会保存到本机数据库；重新打开网页后仍可在下方时间轮盘查看。</span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="pill-btn primary" id="styleImportBtn" type="button">导入文件</button>
          <button class="pill-btn secondary" id="styleFolderImportBtn" type="button">导入文件夹</button>
          <button class="pill-btn secondary" id="styleDownloadTemplateBtn" type="button">下载模板</button>
          <button class="pill-btn secondary" id="styleRefreshIndustryBtn" type="button">刷新行业数据</button>
        </div>
      </div>
    </div>
  `;
}

function renderStyle(analysis) {
  const container = document.getElementById("view-style");
  container.innerHTML = `
    ${renderHoldingImportPanel()}
    <div style="height:14px;"></div>
    ${renderHoldingTradingWorkbench()}
    <div style="height:14px;"></div>
    ${renderSimpleHoldingMatrix()}
  `;
  bindHoldingSkillControls(container);
  if (state.activeTab === "style") {
    const needsSkillLoad = !state.holdingSkillAnalysis || state.holdingSkillAnalysisPortfolioId !== (state.currentPortfolioId || "");
    if (needsSkillLoad && !state.holdingSkillAnalysisLoading) window.setTimeout(() => loadHoldingSkillAnalysis(), 0);
    else window.setTimeout(() => renderHoldingSkillCharts("holding"), 0);
  }
}

function renderAll() {
  const riskUiSnapshot = captureRiskDashboardUiState();
  const current = getCurrentPortfolio();
  if (!tabs.some((tab) => !tab.href && tab.id === state.activeTab)) {
    state.activeTab = "overview";
  }

  // 先切换显示状态，避免图表库因 display:none 无法获取尺寸
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${state.activeTab}`);
  });

  renderTabs();
  renderPortfolioLibrary();
  renderFeed();
  if (!current) {
    renderEmptyWorkspace();
    renderFeed();
    bindFoldToggles();
    return;
  }

  renderHeroStats(current.analysis);
  renderStatus(current.analysis);
  renderOverview(current.analysis);
  renderCompare();
  renderRiskDashboard();
  renderStockAnalysisModule();
  restoreRiskDashboardUiState(riskUiSnapshot);
  renderValidation(current.analysis);
  renderStyle(current.analysis);
  renderTalk(current.analysis);
  renderMaterial(current.analysis);
  renderPersona(current.analysis);
  renderData(current.analysis);
  renderFeed();
  
  bindFoldToggles();
  bindOverviewControls();
  maybeRefreshHoldingQuotesForOverview();
}

function bindFoldToggles(scope = document) {
  scope.querySelectorAll("[data-fold-toggle]").forEach((button) => {
    if (button.dataset.foldBound === "true") return;
    button.dataset.foldBound = "true";
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      const nextOpen = button.getAttribute("aria-expanded") !== "true";
      const shell = button.closest(".fold-panel, .import-drawer");
      target.hidden = !nextOpen;
      button.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      if (shell) shell.classList.toggle("is-open", nextOpen);
      const labelEl = button.querySelector(".fold-toggle-text");
      if (labelEl) {
        labelEl.textContent = nextOpen
          ? (button.dataset.openLabel || "收起内容")
          : (button.dataset.closedLabel || "展开内容");
      }
    });
  });
}

function bindOverviewControls(scope = document) {
  const styleImportBtn = scope.querySelector("#styleImportBtn");
  if (styleImportBtn && styleImportBtn.dataset.bound !== "true") {
    styleImportBtn.dataset.bound = "true";
    styleImportBtn.addEventListener("click", () => {
      fileInput?.click();
    });
  }
  const styleFolderImportBtn = scope.querySelector("#styleFolderImportBtn");
  if (styleFolderImportBtn && styleFolderImportBtn.dataset.bound !== "true") {
    styleFolderImportBtn.dataset.bound = "true";
    styleFolderImportBtn.addEventListener("click", () => {
      folderInput?.click();
    });
  }
  const styleDownloadTemplateBtn = scope.querySelector("#styleDownloadTemplateBtn");
  if (styleDownloadTemplateBtn && styleDownloadTemplateBtn.dataset.bound !== "true") {
    styleDownloadTemplateBtn.dataset.bound = "true";
    styleDownloadTemplateBtn.addEventListener("click", () => {
      downloadCsvTemplate();
    });
  }
  const styleRefreshIndustryBtn = scope.querySelector("#styleRefreshIndustryBtn");
  if (styleRefreshIndustryBtn && styleRefreshIndustryBtn.dataset.bound !== "true") {
    styleRefreshIndustryBtn.dataset.bound = "true";
    styleRefreshIndustryBtn.addEventListener("click", () => {
      refreshCurrentPortfolioIndustries();
    });
  }
  const refreshHoldingQuotesBtn = scope.querySelector("#refreshHoldingQuotesBtn");
  if (refreshHoldingQuotesBtn && refreshHoldingQuotesBtn.dataset.bound !== "true") {
    refreshHoldingQuotesBtn.dataset.bound = "true";
    refreshHoldingQuotesBtn.addEventListener("click", () => {
      refreshHoldingQuotesFromBackend();
    });
  }
  const backfillHoldingHistoryBtn = scope.querySelector("#backfillHoldingHistoryBtn");
  if (backfillHoldingHistoryBtn && backfillHoldingHistoryBtn.dataset.bound !== "true") {
    backfillHoldingHistoryBtn.dataset.bound = "true";
    backfillHoldingHistoryBtn.addEventListener("click", () => {
      backfillHoldingHistoryFromBackend();
    });
  }
  const setHoldingDate = (date) => {
    const dates = getHoldingDisplayDates();
    if (!dates.length) return;
    holdingDateTouched = true;
    state.selectedHoldingDate = dates.includes(date) ? date : dates[dates.length - 1];
    persistState();
    renderAll();
  };
  const dateInput = scope.querySelector("#holdingDateInput");
  if (dateInput && dateInput.dataset.bound !== "true") {
    dateInput.dataset.bound = "true";
    dateInput.addEventListener("change", () => {
      setHoldingDate(dateInput.value);
    });
  }
  scope.querySelectorAll(".holding-step-btn").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const dates = getHoldingDisplayDates();
      const currentIndex = Math.max(0, dates.indexOf(state.selectedHoldingDate));
      const nextIndex = clamp(currentIndex + (Number(button.dataset.step) || 0), 0, Math.max(0, dates.length - 1));
      setHoldingDate(dates[nextIndex]);
    });
  });
  scope.querySelectorAll(".holding-date-btn").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      state.selectedHoldingDate = button.dataset.holdingDate || "";
      persistState();
      renderAll();
    });
  });

  const tradeAction = scope.querySelector("#manualTradeAction");
  const tradeQuantity = scope.querySelector("#manualTradeQuantity");
  const tradeSubmit = scope.querySelector("#manualTradeSubmitBtn");
  const syncTradeTicket = () => {
    if (!tradeAction || !tradeSubmit) return;
    const isSell = tradeAction.value === "sell" || tradeAction.value === "sell_all";
    const isSellAll = tradeAction.value === "sell_all";
    tradeSubmit.textContent = isSellAll ? "确认清仓" : isSell ? "确认卖出" : "确认买入";
    tradeSubmit.classList.toggle("buy", !isSell);
    tradeSubmit.classList.toggle("sell", isSell);
    if (tradeQuantity) {
      tradeQuantity.disabled = isSellAll;
      tradeQuantity.required = !isSellAll;
      tradeQuantity.placeholder = isSellAll ? "清仓无需填写" : "股";
    }
  };
  if (tradeAction && tradeAction.dataset.bound !== "true") {
    tradeAction.dataset.bound = "true";
    tradeAction.addEventListener("change", syncTradeTicket);
    syncTradeTicket();
  }
  scope.querySelectorAll("[data-trade-position]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const codeInput = document.getElementById("manualTradeCode");
      const stockInput = document.getElementById("manualTradeStock");
      if (codeInput) codeInput.value = button.dataset.code || "";
      if (stockInput) stockInput.value = button.dataset.stock || "";
      stockInput?.focus();
    });
  });
  const manualForm = scope.querySelector("#manualHoldingTradeForm");
  if (manualForm && manualForm.dataset.bound !== "true") {
    manualForm.dataset.bound = "true";
    manualForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(manualForm);
      const operation = {
        action: cleanText(formData.get("action")),
        date: normalizeDateInput(formData.get("date")) || formatDateObject(new Date()),
        code: extractCode(formData.get("code")),
        stock: sanitizeStockName(formData.get("stock")),
        price: parseNumber(formData.get("price")),
        quantity: parseNumber(formData.get("quantity")),
        note: cleanText(formData.get("note")),
        confidence: 1,
      };
      if (!/^\d{6}$/.test(operation.code)) {
        state.holdingTradeStatus = "交易失败：证券代码必须是 6 位数字。";
        renderAll();
        return;
      }
      const issue = holdingOperationIssue(operation);
      if (issue) {
        state.holdingTradeStatus = `交易失败：${issue}。`;
        renderAll();
        return;
      }
      state.holdingTradeStatus = `正在写入${holdingActionLabel(operation.action)}流水…`;
      if (tradeSubmit) tradeSubmit.disabled = true;
      try {
        await applyHoldingOperations([operation], {
          source: "手工实时交易",
          sourceKey: "manual_trade",
          intent: "apply_trades",
        });
        state.holdingTradeStatus = `已成功${holdingActionLabel(operation.action)} ${operation.stock}${operation.action === "sell_all" ? "全部持仓" : ` ${num(operation.quantity, 0)} 股`}，数据已持久化。`;
        actionStatusEl.textContent = state.holdingTradeStatus;
        renderAll();
      } catch (error) {
        state.holdingTradeStatus = `交易未写入：${error.message}`;
        actionStatusEl.textContent = state.holdingTradeStatus;
        renderAll();
      }
    });
  }
  const assistantText = scope.querySelector("#holdingAssistantText");
  if (assistantText && assistantText.dataset.bound !== "true") {
    assistantText.dataset.bound = "true";
    assistantText.addEventListener("input", () => {
      state.holdingAssistantDraft = assistantText.value;
    });
  }
  const parseAssistantBtn = scope.querySelector("#parseHoldingAssistantBtn");
  if (parseAssistantBtn && parseAssistantBtn.dataset.bound !== "true") {
    parseAssistantBtn.dataset.bound = "true";
    parseAssistantBtn.addEventListener("click", async () => {
      const text = cleanText(document.getElementById("holdingAssistantText")?.value || "");
      if (!text) {
        state.holdingAssistantStatus = "请先粘贴调仓或持仓文本。";
        renderAll();
        return;
      }
      state.holdingAssistantDraft = document.getElementById("holdingAssistantText")?.value || "";
      state.holdingAssistantStatus = "DeepSeek 正在识别日期、代码、数量和交易方向…";
      parseAssistantBtn.disabled = true;
      parseAssistantBtn.textContent = "解析中…";
      try {
        const current = getCurrentPortfolio();
        const result = await postJson("/api/holding-assistant/parse", {
          portfolio_id: current?.id || "",
          portfolio_name: current?.name || "",
          text: state.holdingAssistantDraft,
          current_positions: current?.dataset?.open_positions || [],
          default_date: formatDateObject(new Date()),
        });
        state.holdingAssistantPreview = result;
        state.holdingAssistantStatus = result.clear_history
          ? "已识别为清空全部持仓历史，请阅读红色警告并二次确认。"
          : `已解析 ${result.operations?.length || 0} 条操作，请核对后再确认。`;
        renderAll();
      } catch (error) {
        state.holdingAssistantPreview = null;
        state.holdingAssistantStatus = `解析失败：${error.message}`;
        renderAll();
      }
    });
  }
  const cancelAssistantBtn = scope.querySelector("#cancelHoldingAssistantBtn");
  if (cancelAssistantBtn && cancelAssistantBtn.dataset.bound !== "true") {
    cancelAssistantBtn.dataset.bound = "true";
    cancelAssistantBtn.addEventListener("click", () => {
      state.holdingAssistantPreview = null;
      state.holdingAssistantStatus = "已取消本次预览，持仓未发生变化。";
      renderAll();
    });
  }
  const confirmAssistantBtn = scope.querySelector("#confirmHoldingAssistantBtn");
  if (confirmAssistantBtn && confirmAssistantBtn.dataset.bound !== "true") {
    confirmAssistantBtn.dataset.bound = "true";
    confirmAssistantBtn.addEventListener("click", async () => {
      const preview = state.holdingAssistantPreview;
      const clearHistory = Boolean(preview?.clear_history || preview?.intent === "clear_all_history");
      if (!preview || (!preview.operations?.length && !clearHistory)) return;
      if (clearHistory) {
        const confirmed = window.confirm("确定要永久清空所有组合的全部持仓和历史记录吗？\n\n语料库和行情缓存会保留，但持仓删除不能在页面中撤销。");
        if (!confirmed) {
          state.holdingAssistantStatus = "已取消清空，持仓数据未发生变化。";
          renderAll();
          return;
        }
      }
      confirmAssistantBtn.disabled = true;
      state.holdingAssistantStatus = clearHistory ? "正在清空全部模拟组合的持仓账本…" : "正在应用并保存持仓变更…";
      try {
        const count = await applyHoldingOperations(preview.operations || [], {
          replaceAll: Boolean(preview.replace_all),
          clearHistory,
          source: preview.mode === "deepseek" ? "DeepSeek 调仓助手" : "本地规则调仓助手",
          sourceKey: "deepseek_assistant",
          intent: preview.intent,
          rawText: state.holdingAssistantDraft,
        });
        state.holdingAssistantPreview = null;
        state.holdingAssistantDraft = "";
        state.holdingAssistantStatus = clearHistory
          ? "所有模拟组合的持仓、历史调仓和每日快照已全部清空。"
          : `已确认应用 ${count} 条操作，持仓、历史快照和审计流水均已保存。`;
        actionStatusEl.textContent = state.holdingAssistantStatus;
        renderAll();
      } catch (error) {
        state.holdingAssistantStatus = `应用失败，未保存：${error.message}`;
        actionStatusEl.textContent = state.holdingAssistantStatus;
        renderAll();
      }
    });
  }
  const adjustmentReasonText = scope.querySelector("#adjustmentReasonText");
  if (adjustmentReasonText && adjustmentReasonText.dataset.bound !== "true") {
    adjustmentReasonText.dataset.bound = "true";
    adjustmentReasonText.addEventListener("input", () => {
      const portfolioId = getCurrentPortfolio()?.id || "__default__";
      state.adjustmentReasonDraftByPortfolio[portfolioId] = adjustmentReasonText.value;
    });
  }
  const useHoldingAssistantDraftBtn = scope.querySelector("#useHoldingAssistantDraftBtn");
  if (useHoldingAssistantDraftBtn && useHoldingAssistantDraftBtn.dataset.bound !== "true") {
    useHoldingAssistantDraftBtn.dataset.bound = "true";
    useHoldingAssistantDraftBtn.addEventListener("click", () => {
      const portfolioId = getCurrentPortfolio()?.id || "__default__";
      const sourceText = cleanText(state.holdingAssistantDraft || document.getElementById("holdingAssistantText")?.value || "");
      if (!sourceText) {
        state.adjustmentReasonStatusByPortfolio[portfolioId] = "上方还没有交易描述，请直接在这里输入今天的调仓计划。";
      } else {
        state.adjustmentReasonDraftByPortfolio[portfolioId] = sourceText;
        state.adjustmentReasonStatusByPortfolio[portfolioId] = "已带入上方交易描述，可以继续补充你的判断后生成。";
      }
      persistState();
      renderAll();
    });
  }
  const generateAdjustmentReasonBtn = scope.querySelector("#generateAdjustmentReasonBtn");
  if (generateAdjustmentReasonBtn && generateAdjustmentReasonBtn.dataset.bound !== "true") {
    generateAdjustmentReasonBtn.dataset.bound = "true";
    generateAdjustmentReasonBtn.addEventListener("click", async () => {
      const current = getCurrentPortfolio();
      const portfolioId = current?.id || "__default__";
      const inputText = cleanText(document.getElementById("adjustmentReasonText")?.value || "");
      if (!inputText) {
        state.adjustmentReasonStatusByPortfolio[portfolioId] = "请先输入今天准备执行的交易或调仓计划。";
        renderAll();
        return;
      }
      state.adjustmentReasonDraftByPortfolio[portfolioId] = inputText;
      state.adjustmentReasonStatusByPortfolio[portfolioId] = "正在读取最近金山语料、持仓与技术行情并生成理由…";
      generateAdjustmentReasonBtn.disabled = true;
      generateAdjustmentReasonBtn.textContent = "生成中…";
      const statusEl = scope.querySelector(".adjustment-reason-card .trade-status");
      if (statusEl) statusEl.textContent = state.adjustmentReasonStatusByPortfolio[portfolioId];
      try {
        const result = await postJson("/api/adjustment-reason/generate", {
          portfolio_id: current?.id || "",
          portfolio_name: current?.name || "",
          trade_text: inputText,
          current_positions: current?.dataset?.open_positions || [],
          selected_holding_date: state.selectedHoldingDate || "",
        });
        state.adjustmentReasonResultByPortfolio[portfolioId] = result;
        state.adjustmentReasonStatusByPortfolio[portfolioId] = `已生成 ${result.items?.length || 0} 只标的的调仓理由，可直接复制使用。`;
        persistState();
        renderAll();
      } catch (error) {
        state.adjustmentReasonStatusByPortfolio[portfolioId] = `生成失败：${error.message}`;
        renderAll();
      }
    });
  }
  const copyAdjustmentReasonBtn = scope.querySelector("#copyAdjustmentReasonBtn");
  if (copyAdjustmentReasonBtn && copyAdjustmentReasonBtn.dataset.bound !== "true") {
    copyAdjustmentReasonBtn.dataset.bound = "true";
    copyAdjustmentReasonBtn.addEventListener("click", async () => {
      const portfolioId = getCurrentPortfolio()?.id || "__default__";
      const result = state.adjustmentReasonResultByPortfolio[portfolioId];
      if (!result) return;
      try {
        await navigator.clipboard.writeText(formatAdjustmentReasonForCopy(result));
        state.adjustmentReasonStatusByPortfolio[portfolioId] = "调仓理由已复制到剪贴板。";
      } catch (error) {
        state.adjustmentReasonStatusByPortfolio[portfolioId] = "复制失败，请手动选择结果文本。";
      }
      renderAll();
    });
  }
}

async function parseLocalFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".json")) return parseJsonFile(await file.text());
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return parseHtmlFile(await file.text(), file.name);
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) return parseCsvFile(await file.text(), file.name);
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return parseWorkbookFile(file.name, await file.arrayBuffer());
  throw new Error(`暂不支持的文件类型：${file.name}`);
}

async function parseRemoteFile(path) {
  const lower = path.toLowerCase();
  const fileName = path.split("/").pop();
  if (lower.endsWith(".json")) {
    const parsed = await fetch(path, { cache: "no-store" }).then((res) => res.json());
    return { ...parsed, name: stripExtension(fileName), sourceType: "JSON" };
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const textContent = await fetch(path, { cache: "no-store" }).then((res) => res.text());
    return parseHtmlFile(textContent, fileName);
  }
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const textContent = await fetch(path, { cache: "no-store" }).then((res) => res.text());
    return parseCsvFile(textContent, fileName);
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const buffer = await fetch(path, { cache: "no-store" }).then((res) => res.arrayBuffer());
    return parseWorkbookFile(fileName, buffer);
  }
  throw new Error(`暂不支持的远程文件类型：${fileName}`);
}

async function importParsedDataset(parsed, fallbackName, message) {
  const summary = { added: 0, updated: 0, skipped: 0, total: 0, portfolio_ids: [] };
  if (parsed?.portfolios) {
    parsed.portfolios.forEach((dataset, index) => {
      const result = addPortfolio(
        normalizeImportedDataset(dataset, `${fallbackName} ${index + 1}`),
        message,
        `${fallbackName} ${index + 1}`
      );
      summary.total += 1;
      summary[result.action] += 1;
      if (result.action !== "skipped" && state.currentPortfolioId) summary.portfolio_ids.push(state.currentPortfolioId);
    });
    return summary;
  }
  const result = addPortfolio(normalizeImportedDataset(parsed, fallbackName), message, fallbackName);
  summary.total = 1;
  summary[result.action] += 1;
  if (result.action !== "skipped" && state.currentPortfolioId) summary.portfolio_ids.push(state.currentPortfolioId);
  return summary;
}

function attachPremarketTextToCurrentPortfolio(rawText) {
  const current = getCurrentPortfolio();
  if (!current) {
    actionStatusEl.textContent = "请先导入交易记录，再导入盘前洞察。";
    return false;
  }

  const parsed = parsePremarketNaturalText(rawText);
  if (!parsed.insights.length) {
    actionStatusEl.textContent = "未识别到有效盘前洞察，请粘贴更完整的文字内容。";
    return false;
  }

  const dataset = current.dataset;
  dataset.premarket_insights = unique([
    ...(dataset.premarket_insights || []),
    ...parsed.insights
  ].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
  dataset.strategy_points = unique([
    ...(dataset.strategy_points || []),
    ...parsed.strategyPoints
  ]);
  dataset.source_meta = {
    ...(dataset.source_meta || {}),
    format: unique([dataset.source_meta?.format, "盘前洞察自然语言"].filter(Boolean)).join(" + "),
    notes: unique([...(dataset.source_meta?.notes || []), "已接入自然语言盘前洞察"])
  };

  current.analysis = computeAnalysis(dataset);
  current.meta = buildDatasetMeta(dataset, current.name);
  state.activeTab = "validation";
  persistState();
  renderAll();
  actionStatusEl.textContent = `已整理并导入 ${parsed.insights.length} 条盘前洞察，已切换到逻辑验证页。`;
  return true;
}

function attachFeedDatabaseToCurrentPortfolio() {
  const current = getCurrentPortfolio();
  if (!current) {
    actionStatusEl.textContent = "请先导入交易记录，再同步观点库用于验证。";
    return false;
  }
  if (!state.feedRecords.length) {
    actionStatusEl.textContent = "观点库为空，请先在“主理人风格”页投喂主理人材料。";
    return false;
  }

  const contextRecords = getRecentFeedRecords(80);
  const dataset = current.dataset;
  dataset.premarket_insights = unique([
    ...(dataset.premarket_insights || []),
    ...contextRecords
  ].map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
  dataset.strategy_points = unique([
    ...(dataset.strategy_points || []),
    ...contextRecords.map(buildPremarketPoint)
  ]);
  dataset.source_meta = {
    ...(dataset.source_meta || {}),
    format: unique([dataset.source_meta?.format, "第一阶段观点库"].filter(Boolean)).join(" + "),
    notes: unique([...(dataset.source_meta?.notes || []), `已同步 ${contextRecords.length} 条第一阶段观点记录`])
  };

  current.analysis = computeAnalysis(dataset);
  current.meta = buildDatasetMeta(dataset, current.name);
  state.activeTab = "validation";
  persistState();
  renderAll();
  actionStatusEl.textContent = `已将 ${contextRecords.length} 条观点记录同步到当前组合验证。`;
  return true;
}

function bindFeedControls(scope = document) {
  const importBtn = scope.querySelector("#importDailyFeedBtn");
  const runStartupSyncBtn = scope.querySelector("#runStartupSyncBtn");
  const autoFetchResearchBtn = scope.querySelector("#autoFetchResearchBtn");
  const fetchMarketSnapshotBtn = scope.querySelector("#fetchMarketSnapshotBtn");
  const attachBtn = scope.querySelector("#attachFeedContextBtn");
  const exportBtn = scope.querySelector("#exportFeedDatabaseBtn");
  const copyMorningDraftBtn = scope.querySelector("#copyMorningDraftBtn");
  const generateMorningDraftBtn = scope.querySelector("#generateMorningDraftBtn");
  const updateAdvisorProfileBtn = scope.querySelector("#updateAdvisorProfileBtn");
  const refreshAdvisorReviewBtn = scope.querySelector("#refreshAdvisorReviewBtn");
  const generateAdvisorReviewSummaryBtn = scope.querySelector("#generateAdvisorReviewSummaryBtn");
  const feedInlineStatus = scope.querySelector("#feedInlineStatus");
  const setFeedInlineStatus = (text, type = "") => {
    if (!feedInlineStatus) return;
    feedInlineStatus.className = `feed-inline-status${type ? ` ${type}` : ""}`;
    feedInlineStatus.textContent = text;
  };

  runStartupSyncBtn?.addEventListener("click", async () => {
    const originalText = runStartupSyncBtn.textContent;
    runStartupSyncBtn.disabled = true;
    runStartupSyncBtn.textContent = "补同步中...";
    setFeedInlineStatus("正在补同步研报热点标题和金山共享表格主理人语料...");
    try {
      await runStartupCatchupSync();
    } finally {
      runStartupSyncBtn.disabled = false;
      runStartupSyncBtn.textContent = originalText;
    }
  });

  importBtn?.addEventListener("click", async () => {
    const rawText = scope.querySelector("#feedRawTextInput")?.value?.trim() || "";
    if (!rawText) {
      actionStatusEl.textContent = "请先粘贴需要喂养的原文内容。";
      return;
    }
    const meta = {
      date: scope.querySelector("#feedDateInput")?.value || formatDateObject(new Date()),
      source_type: scope.querySelector("#feedSourceTypeInput")?.value || "盘前洞察",
      source_title: scope.querySelector("#feedTitleInput")?.value?.trim() || "",
      speaker: scope.querySelector("#feedSpeakerInput")?.value?.trim() || "姜洪斌"
    };
    const parsed = parseDailyFeed(rawText, meta);
    upsertFeedRecords(parsed.feedRecords);
    upsertHotRecords(parsed.hotRecords);
    persistState();
    try {
      await syncKnowledgeDocs(parsed.feedRecords, parsed.hotRecords);
    } catch (error) {
      actionStatusEl.textContent = `已入库到浏览器，但同步本地数据库失败：${error.message}`;
      renderAll();
      return;
    }
    renderAll();
    actionStatusEl.textContent = `已入库 ${parsed.feedRecords.length} 条观点记录${parsed.hotRecords.length ? `、${parsed.hotRecords.length} 条热点记录，并同步到本地知识库` : "，并同步到本地知识库"}。`;
    queueLogicValidationRefresh("advisor_corpus_imported", 600);
  });

  autoFetchResearchBtn?.addEventListener("click", async () => {
    const dateValue = scope.querySelector("#feedDateInput")?.value || formatDateObject(new Date());
    actionStatusEl.textContent = "正在抓取今日研报标题，并写入本地研报热点语料库...";
    try {
      const response = await fetch(`/api/research-hotspots/fetch?date=${encodeURIComponent(dateValue)}&limit=120`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "研报标题抓取失败");
      }
      upsertHotRecords(payload.hot_records || []);
      persistState();
      renderAll();
      actionStatusEl.textContent = `已抓取 ${payload.date} 的 ${payload.report_count || 0} 条研报标题，聚合为 ${(payload.hot_records || []).length} 条热点记录，并写入本地知识库。`;
    } catch (error) {
      actionStatusEl.textContent = `自动抓取研报标题失败：${error.message}`;
    }
  });

  fetchMarketSnapshotBtn?.addEventListener("click", async () => {
    const latestDate = getLatestHotDate();
    const themes = latestDate ? getHotRecordsByDate(latestDate).map((item) => item.theme).filter(Boolean).slice(0, 8) : [];
    if (!themes.length) {
      actionStatusEl.textContent = "请先抓取或导入研报热点，再进行盘面验证。";
      setFeedInlineStatus("请先抓取或导入研报热点，再进行盘面验证。", "warn");
      return;
    }
    actionStatusEl.textContent = "正在抓取指数、行业板块和概念板块真实行情...";
    setFeedInlineStatus(`正在抓取 ${themes.join("、")} 的盘面验证数据，请等待 10-40 秒...`);
    const originalText = fetchMarketSnapshotBtn.textContent;
    fetchMarketSnapshotBtn.disabled = true;
    fetchMarketSnapshotBtn.textContent = "抓取中...";
    try {
      const payload = await postJson("/api/market-snapshot/fetch", { themes });
      state.marketSnapshot = payload;
      persistState();
      renderAll();
      actionStatusEl.textContent = payload.cached
        ? `实时行情接口暂时不稳定，已展示最近一次成功快照：覆盖 ${payload.indexes?.length || 0} 个指数、${payload.themes?.length || 0} 个热点方向。`
        : `已完成盘面验证：覆盖 ${payload.indexes?.length || 0} 个指数、${payload.themes?.length || 0} 个热点方向。`;
      const nextStatus = payload.cached
        ? `实时接口暂时失败，当前展示 ${payload.snapshot_date || "最近一次"} 成功保存的盘面快照。`
        : `已完成盘面验证：覆盖 ${payload.indexes?.length || 0} 个指数、${payload.themes?.length || 0} 个热点方向。`;
      document.querySelector("#feedInlineStatus") && (document.querySelector("#feedInlineStatus").textContent = nextStatus);
    } catch (error) {
      actionStatusEl.textContent = `盘面验证抓取失败：${error.message}`;
      setFeedInlineStatus(`盘面验证抓取失败：${error.message}`, "error");
    } finally {
      fetchMarketSnapshotBtn.disabled = false;
      fetchMarketSnapshotBtn.textContent = originalText;
    }
  });

  attachBtn?.addEventListener("click", () => {
    attachFeedDatabaseToCurrentPortfolio();
  });

  exportBtn?.addEventListener("click", () => {
    const payload = {
      exported_at: new Date().toISOString(),
      feed_records: state.feedRecords,
      hot_records: state.hotRecords,
      theme_mappings: ensureThemeMappings()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "第一阶段-观点热点数据库.json";
    link.click();
    URL.revokeObjectURL(link.href);
    actionStatusEl.textContent = "第一阶段观点库与热点库已导出。";
  });

  copyMorningDraftBtn?.addEventListener("click", async () => {
    const textContent = scope.querySelector("#morningDraftText")?.textContent?.trim() || "";
    if (!textContent || textContent === "暂无可生成的早评辅助稿。") {
      actionStatusEl.textContent = "暂无可复制的早评辅助稿，请先导入研报热点。";
      return;
    }
    try {
      await navigator.clipboard.writeText(textContent);
      actionStatusEl.textContent = "今日早评辅助稿已复制。";
    } catch (error) {
      actionStatusEl.textContent = "复制失败，请手动复制早评稿。";
    }
  });

  generateMorningDraftBtn?.addEventListener("click", async () => {
    const draftEl = scope.querySelector("#morningDraftText");
    const latestDate = getLatestHotDate();
    const latestHotRows = latestDate ? getHotRecordsByDate(latestDate) : [];
    const query = latestHotRows.length
      ? latestHotRows.slice(0, 6).map((item) => `${item.theme} ${item.core_logic || ""} ${item.risk_warning || ""}`).join("\n")
      : "今日研报热点与主理人历史早评";
    if (draftEl) draftEl.textContent = "正在从历史主理人语料库、研报热点语料库和交易反馈中检索，并生成早评辅助稿...";
    try {
      await syncAllCurrentDataToKnowledgeBase();
      const payload = await postJson("/api/generate/morning", {
        date: latestDate || formatDateObject(new Date()),
        query,
        latest_hotspots: latestHotRows,
        market_validation: state.marketSnapshot,
        local_profile: buildAdvisorLearningProfile()
      });
      if (draftEl) draftEl.textContent = payload.draft || "未生成内容。";
      actionStatusEl.textContent = payload.mode === "llm"
        ? "已使用大模型接口生成早评辅助稿。"
        : "已使用本地知识库检索生成早评辅助稿；未检测到大模型配置。";
    } catch (error) {
      if (draftEl) draftEl.textContent = buildHotspotInsightPackage().morningDraft;
      actionStatusEl.textContent = `检索增强生成失败：${error.message}`;
    }
  });

  updateAdvisorProfileBtn?.addEventListener("click", () => {
    updateAdvisorStrategyProfile();
  });

  refreshAdvisorReviewBtn?.addEventListener("click", async () => {
    const originalText = refreshAdvisorReviewBtn.textContent;
    refreshAdvisorReviewBtn.disabled = true;
    refreshAdvisorReviewBtn.textContent = "刷新中...";
    try {
      await syncAllCurrentDataToKnowledgeBase();
      await flushPortfoliosToDb();
      await loadAdvisorReview();
      actionStatusEl.textContent = "主理人交易逻辑复盘已刷新。";
    } catch (error) {
      actionStatusEl.textContent = `复盘刷新失败：${error.message}`;
    } finally {
      refreshAdvisorReviewBtn.disabled = false;
      refreshAdvisorReviewBtn.textContent = originalText || "刷新复盘";
    }
  });

  generateAdvisorReviewSummaryBtn?.addEventListener("click", () => {
    generateAdvisorReviewSummary();
  });
}

async function handleFiles(fileList) {
  const files = [...fileList].filter((file) => !file.name.startsWith("."));
  if (!files.length) return;
  const summary = { added: 0, updated: 0, skipped: 0, total: 0 };
  const reconciledPortfolioIds = new Set();
  for (const file of files) {
    const parsed = await parseLocalFile(file);
    const result = await importParsedDataset(parsed, extractPortfolioKeyName(file.name), `已导入 ${extractPortfolioKeyName(file.name)}`);
    summary.added += result.added;
    summary.updated += result.updated;
    summary.skipped += result.skipped;
    summary.total += result.total;
    (result.portfolio_ids || []).forEach((id) => reconciledPortfolioIds.add(id));
  }
  let savedResult;
  try {
    savedResult = await flushPortfoliosToDb({
      reconcileHoldingPortfolioIds: [...reconciledPortfolioIds],
    });
  } catch (error) {
    if (window.location.protocol === "file:") {
      savedResult = { saved: 0 };
      actionStatusEl.textContent = "数据已载入浏览器临时空间；要永久写入 SQLite，请通过“启动观察台.bat”打开。";
    } else {
      actionStatusEl.textContent = `数据已载入当前页面，但写入本地数据库失败：${error.message}。请不要关闭页面，确认服务器正常后重新导入。`;
      throw error;
    }
  }
  try {
    // Synchronize every imported holding universe. The currently selected one
    // additionally refreshes the visible consistency and risk panels.
    for (const portfolioId of reconciledPortfolioIds) {
      if (portfolioId === state.currentPortfolioId) continue;
      const synced = await postJson("/api/holding-sync/run", {
        portfolio_id: portfolioId,
        reason: "portfolio_imported",
        force: true,
      });
      const record = state.portfolios.find((item) => item.id === portfolioId);
      if (record && synced?.portfolio?.dataset) {
        record.dataset = synced.portfolio.dataset;
        record.analysis = computeAnalysis(record.dataset);
        record.meta = buildDatasetMeta(record.dataset, record.name);
      }
    }
    holdingMarketRefreshGeneration += 1;
    await refreshHoldingMarketDataAfterChange("portfolio_imported", holdingMarketRefreshGeneration);
    for (const portfolio of state.portfolios) {
      await syncTradeFeedbackForPortfolio(portfolio);
    }
    await loadAdvisorReview({ silent: true });
    actionStatusEl.textContent = `本次共处理 ${files.length} 个文件：新增 ${summary.added} 个组合，更新 ${summary.updated} 个组合，跳过 ${summary.skipped} 个重复样本；${savedResult.saved} 个持仓组合已保存到本地数据库，关闭服务器后不会清零。`;
  } catch (error) {
    actionStatusEl.textContent = `${savedResult.saved} 个持仓组合已保存到本地数据库；交易反馈同步失败：${error.message}`;
  }
}

function refreshCurrentPortfolioIndustries() {
  const current = getCurrentPortfolio();
  if (!current) {
    actionStatusEl.textContent = "请先导入组合数据。";
    return;
  }
  enrichPortfolioIndustries(current.id, true);
}

function downloadCsvTemplate() {
  const csv = "证券名称,调入日期,买入价,调出日期,卖出价,持股天数,收益率,状态\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "组合交易记录模板.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  actionStatusEl.textContent = "已下载 CSV 模板。";
}

function buildCurrentShareSnapshot() {
  const portfolio = getCurrentPortfolio();
  if (!portfolio) throw new Error("请先选择一个持仓组合");
  const dataset = portfolio.dataset || {};
  const journal = state.riskPositionJournal || {};
  const market = state.riskDashboard?.risk_v2?.market || {};
  const scoreRows = new Map((state.riskDashboard?.risk_v2?.holdings || []).map((item) => [String(item.entity_id || ""), item]));
  const positionRows = Array.isArray(journal.holdings) && journal.holdings.length
    ? journal.holdings
    : (dataset.open_positions || []).map((item) => ({
        stock_code: item.code || item.instrument_key,
        stock_name: item.stock,
        position_pct: Number(item.manager_position_pct ?? item.position_pct ?? item.weight ?? 0),
      }));
  const details = new Map((dataset.open_positions || []).map((item) => [String(item.code || item.instrument_key || ""), item]));
  const holdings = positionRows.map((item) => {
    const code = String(item.stock_code || "");
    const detail = details.get(code) || {};
    const score = scoreRows.get(code) || {};
    return {
      stock_code: code,
      stock_name: item.stock_name || detail.stock || code,
      position_pct: Number(item.position_pct || 0),
      latest_price: detail.latest_price ?? detail.current_price ?? null,
      cost_price: detail.cost_price ?? detail.buy_price ?? null,
      day_pct_change: detail.day_pct_change ?? null,
      return_pct: detail.return_pct ?? detail.unrealized_return_pct ?? null,
      risk_score: score.score ?? null,
      industry_name: score.sw_industry?.industry_name || detail.industry || "",
    };
  });
  const marketScore = Number(journal.market_risk_score ?? market.score);
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    portfolio_id: portfolio.id,
    portfolio_name: portfolio.name,
    snapshot_date: journal.snapshot_date || dataset.latest_snapshot_date || new Date().toISOString().slice(0, 10),
    market: {
      name: market.name || "A股市场",
      score: Number.isFinite(marketScore) ? marketScore : null,
      score_change: market.score_change ?? null,
      breadth_summary: market.breadth_summary || {},
      key_drivers: (market.key_drivers || []).slice(0, 6),
    },
    position: {
      total_position_pct: riskPositionTotal({ holdings }),
      manager_note: journal.manager_note || "",
      holdings,
    },
    disclaimer: "本页是生成时点的持仓与风控快照，仅供信息记录和复盘，不构成投资建议。过往数据不代表未来收益。",
  };
}

function encodeShareSnapshot(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function closeShareSnapshotModal() {
  if (shareSnapshotModal) shareSnapshotModal.hidden = true;
}

function closeStockShareModal() {
  if (stockShareModal) stockShareModal.hidden = true;
}

function showPublishedStockLink(url, stockName, message) {
  if (shareSnapshotTitle) shareSnapshotTitle.textContent = `分享${stockName || "个股"}分析`;
  if (shareSnapshotLink) shareSnapshotLink.value = url;
  if (openShareSnapshotLink) openShareSnapshotLink.href = url;
  if (shareSnapshotStatus) shareSnapshotStatus.textContent = message;
  closeStockShareModal();
  if (shareSnapshotModal) shareSnapshotModal.hidden = false;
}

function stockMarketUrl(code) {
  return `https://senyoasuka.github.io/tcd-share/stock_market_v84.html?code=${encodeURIComponent(String(code || "").replace(/\D/g, "").slice(-6))}`;
}

async function publishSelectedStockShare(item) {
  const code = String(item.stock_code || "");
  const name = String(item.stock_name || code);
  if (!code) return;
  const url = stockMarketUrl(code);
  showPublishedStockLink(url, name, "公开看盘链接已生成，不依赖 Vercel，打开时自动读取最新行情");
}

function renderStockShareResults(rows) {
  if (!stockShareResults) return;
  stockShareResults.innerHTML = rows.length ? rows.map((item) => `
    <article class="stock-share-result">
      <span><strong>${escapeHtml(item.stock_name || item.stock_code)}</strong><span>${escapeHtml(item.stock_code)}${item.industry_name && item.industry_name !== "未分类" ? ` · ${escapeHtml(item.industry_name)}` : ""}${item.latest_price !== null && item.latest_price !== undefined && item.latest_price !== "" && Number.isFinite(Number(item.latest_price)) ? ` · ${num(item.latest_price, 2)} 元` : ""}</span></span>
      <div class="stock-share-result-actions"><a href="${stockMarketUrl(item.stock_code)}" target="_blank" rel="noopener noreferrer">看盘</a><button type="button" data-stock-share-code="${escapeHtml(item.stock_code)}">分享</button></div>
    </article>`).join("") : `<div class="stock-share-empty">没有找到匹配股票，请检查代码或名称</div>`;
  stockShareResults.querySelectorAll("[data-stock-share-code]").forEach((button) => button.addEventListener("click", () => {
    const item = rows.find((row) => String(row.stock_code) === button.dataset.stockShareCode);
    if (item) publishSelectedStockShare(item);
  }));
}

let stockShareSearchTimer = null;
let stockShareCatalogPromise = null;
function loadStockShareCatalog() {
  if (!stockShareCatalogPromise) {
    stockShareCatalogPromise = fetch(`${STATIC_RISK_ROOT}/stock_catalog.json`, { cache: "force-cache" })
      .then((response) => readJsonResponse(response, "个股目录"))
      .then((catalog) => catalog.stocks || [])
      .catch((error) => {
        stockShareCatalogPromise = null;
        throw error;
      });
  }
  return stockShareCatalogPromise;
}

function stockSearchRank(item, query) {
  const code = String(item.stock_code || "");
  const name = String(item.stock_name || "").toLowerCase();
  if (code === query || name === query) return 0;
  if (code.startsWith(query)) return 1;
  if (name.startsWith(query)) return 2;
  if (code.includes(query)) return 3;
  return 4;
}

async function searchStocksForShare(keyword) {
  const query = String(keyword || "").trim();
  if (!query) {
    if (stockShareResults) stockShareResults.innerHTML = `<div class="stock-share-empty">输入代码或名称开始搜索<div class="stock-share-prefixes"><button type="button" data-stock-prefix="600">600</button><button type="button" data-stock-prefix="601">601</button><button type="button" data-stock-prefix="300">300</button><button type="button" data-stock-prefix="688">688</button></div></div>`;
    bindStockPrefixButtons();
    if (stockShareStatus) stockShareStatus.textContent = "";
    return;
  }
  if (stockShareResults) stockShareResults.innerHTML = `<div class="stock-share-empty">正在搜索“${escapeHtml(query)}”...</div>`;
  if (stockShareStatus) stockShareStatus.textContent = "正在读取股票目录...";
  try {
    const normalized = query.toLowerCase();
    let rows = [];
    if (isLocalServiceHost()) {
      const response = await fetch(`/api/v1/risk/stock-search?query=${encodeURIComponent(query)}`, { cache: "no-store" });
      const result = await readJsonResponse(response, "个股搜索");
      rows = result.results || [];
    }
    const catalog = await loadStockShareCatalog();
    const indexed = catalog.filter((item) => String(item.stock_code || "").includes(normalized) || String(item.stock_name || "").toLowerCase().includes(normalized));
    const merged = new Map([...rows, ...indexed].map((item) => [String(item.stock_code || ""), item]));
    rows = [...merged.values()].sort((a, b) => stockSearchRank(a, normalized) - stockSearchRank(b, normalized) || String(a.stock_code).localeCompare(String(b.stock_code))).slice(0, 20);
    renderStockShareResults(rows);
    if (stockShareStatus) stockShareStatus.textContent = rows.length ? `找到 ${rows.length} 只候选股票，可直接看盘或分享` : "没有找到匹配股票";
  } catch (error) {
    if (stockShareStatus) stockShareStatus.textContent = `搜索失败：${error.message || error}`;
    if (stockShareResults) stockShareResults.innerHTML = `<div class="stock-share-empty">搜索没有完成，请点击“搜索”重试</div>`;
  }
}

function bindStockPrefixButtons() {
  stockShareResults?.querySelectorAll("[data-stock-prefix]").forEach((button) => button.addEventListener("click", () => {
    if (stockShareSearchInput) stockShareSearchInput.value = button.dataset.stockPrefix || "";
    searchStocksForShare(button.dataset.stockPrefix || "");
  }));
}

function shareSnapshotSignature(snapshot) {
  const holdings = (snapshot.position?.holdings || []).map((item) => ({
    code: String(item.stock_code || ""),
    name: String(item.stock_name || ""),
    position: Number(item.position_pct || 0),
  })).sort((a, b) => a.code.localeCompare(b.code));
  return JSON.stringify({
    portfolio_id: snapshot.portfolio_id || "",
    snapshot_date: snapshot.snapshot_date || "",
    market_score: Number(snapshot.market?.score ?? -1),
    total_position_pct: Number(snapshot.position?.total_position_pct || 0),
    manager_note: String(snapshot.position?.manager_note || ""),
    holdings,
  });
}

async function resolveShareSnapshotUrl(snapshot) {
  const origin = "https://senyoasuka.github.io/tcd-share";
  if (state.riskPositionJournal?.source !== "browser_static_edit") {
    const manifest = await Promise.race([
      loadStaticShareManifest(),
      new Promise((resolve) => setTimeout(() => resolve(null), 300)),
    ]);
    const shareId = manifest?.portfolios?.[snapshot.portfolio_id];
    const publishedSignature = manifest?.snapshots?.[shareId]?.signature;
    if (shareId && publishedSignature && JSON.stringify(publishedSignature) === shareSnapshotSignature(snapshot)) {
      return { url: `${origin}/r/${encodeURIComponent(shareId)}`, short: true };
    }
  }
  return { url: `${origin}/r/current#data=${encodeShareSnapshot(snapshot)}`, short: false };
}

async function openCurrentShareSnapshot() {
  try {
    const snapshot = buildCurrentShareSnapshot();
    shareCurrentBtn.disabled = true;
    const resolved = await resolveShareSnapshotUrl(snapshot);
    const url = resolved.url;
    if (shareSnapshotLink) shareSnapshotLink.value = url;
    if (openShareSnapshotLink) openShareSnapshotLink.href = url;
    if (shareSnapshotStatus) shareSnapshotStatus.textContent = resolved.short
      ? `已生成 ${snapshot.snapshot_date} 的云端短链接，手机可直接打开`
      : `已即时生成 ${snapshot.snapshot_date} 的当前快照，无需等待上传`;
    if (shareSnapshotModal) {
      shareSnapshotModal.hidden = false;
      shareSnapshotLink?.focus();
      shareSnapshotLink?.select();
    }
  } catch (error) {
    actionStatusEl.textContent = `生成分享链接失败：${error.message || error}`;
  } finally {
    shareCurrentBtn.disabled = false;
  }
}

fileInput?.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files?.length) return;
  try {
    await handleFiles(files);
  } catch (error) {
    actionStatusEl.textContent = `导入失败：${error.message}`;
  } finally {
    fileInput.value = "";
  }
});

folderInput?.addEventListener("change", async (event) => {
  const files = event.target.files;
  if (!files?.length) return;
  try {
    await handleFiles(files);
  } catch (error) {
    actionStatusEl.textContent = `导入失败：${error.message}`;
  } finally {
    folderInput.value = "";
  }
});

triggerImportBtn?.addEventListener("click", () => {
  fileInput.click();
});

triggerFolderImportBtn?.addEventListener("click", () => {
  folderInput?.click();
});

resetWorkspaceBtn?.addEventListener("click", () => {
  const confirmed = window.confirm("确定清空本机保存的组合、观点库和热点库吗？这个操作不会删除项目文件，只会清掉浏览器里的导入数据。");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_RESET_FLAG);
  postJson("/api/portfolios/clear", {}).catch((error) => console.warn("portfolio db clear failed", error));
  state.portfolios = [];
  state.currentPortfolioId = null;
  state.compareIds = [];
  state.activeTab = "overview";
  state.industryCache = {};
  state.industryServiceReady = null;
  state.industryPending = new Set();
  state.feedRecords = [];
  state.hotRecords = [];
  state.advisorStrategyProfile = null;
  state.logicValidationResult = null;
  state.advisorReview = null;
  state.advisorReviewSummary = null;
  state.clientPersonaScriptsByPortfolio = {};
  state.clientPersonaChatsByPortfolio = {};
  state.clientPersonaSelectedByPortfolio = {};
  state.clientPersonaStageByPortfolio = {};
  state.clientPersonaOpenDimensionByPortfolio = {};
  clientPersonaAutoAttempted = new Set();
  state.themeMappings = getDefaultThemeMappings();
  renderAll();
  actionStatusEl.textContent = "已清空本机导入数据，工作台已回到初始空白状态。";
});

compareSelectedBtn.addEventListener("click", () => {
  if (state.compareIds.length < 2) {
    actionStatusEl.textContent = "请至少勾选 2 个组合。";
    return;
  }
  state.activeTab = "compare";
  renderAll();
    actionStatusEl.textContent = "已切换至组合对比视图。";
});

exportSummaryBtn?.addEventListener("click", () => {
  const analysis = getCurrentAnalysis();
  if (!analysis) return;
  const payload = {
    name: analysis.name,
    sourceType: analysis.sourceType,
    sourceMeta: analysis.sourceMeta,
    summary: analysis.summary,
    styleTags: analysis.styleTags,
    premarket_insights: analysis.premarket_insights,
    tradingTraits: analysis.tradingTraits,
    holdingTraits: analysis.holdingTraits,
    scripts: analysis.scripts,
    personas: analysis.personas
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${analysis.name}-摘要.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  actionStatusEl.textContent = "当前组合摘要已导出。";
});

exportDatasetBtn?.addEventListener("click", () => {
  const payload = {
    exported_at: new Date().toISOString(),
    portfolio_count: state.portfolios.length,
    feed_records: state.feedRecords,
    hot_records: state.hotRecords,
    theme_mappings: ensureThemeMappings(),
    portfolios: state.portfolios.map((item) => ({
      id: item.id,
      name: item.name,
      keySlug: item.keySlug,
      dataset: item.dataset,
      analysis: item.analysis
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "股票组合观察台-数据集.json";
  link.click();
  URL.revokeObjectURL(link.href);
  actionStatusEl.textContent = `已导出 ${state.portfolios.length} 个组合的数据集。`;
});

copyScriptBtn?.addEventListener("click", async () => {
  const analysis = getCurrentAnalysis();
  if (!analysis) return;
  const copyText = [
    analysis.scripts.position,
    analysis.scripts.customer,
    analysis.scripts.marketingFit,
    analysis.scripts.marketingAvoid,
    analysis.scripts.marketingRisk
  ].join("\n");
  try {
    await navigator.clipboard.writeText(copyText);
    actionStatusEl.textContent = "当前组合话术已复制。";
  } catch (error) {
    actionStatusEl.textContent = "复制失败，请手动复制。";
  }
});

refreshDataBtn?.addEventListener("click", () => {
  refreshCurrentPortfolioIndustries();
});

downloadCsvTemplateBtn?.addEventListener("click", () => {
  downloadCsvTemplate();
});

shareCurrentBtn?.addEventListener("click", openCurrentShareSnapshot);
stockShareBtn?.addEventListener("click", () => {
  if (stockShareModal) stockShareModal.hidden = false;
  if (stockShareStatus) stockShareStatus.textContent = "";
  searchStocksForShare(stockShareSearchInput?.value || "");
  loadStockShareCatalog().catch(() => {});
  setTimeout(() => stockShareSearchInput?.focus(), 0);
});
stockShareCloseBtn?.addEventListener("click", closeStockShareModal);
stockShareModal?.addEventListener("click", (event) => {
  if (event.target === stockShareModal) closeStockShareModal();
});
stockShareSearchInput?.addEventListener("input", (event) => {
  const keyword = event.currentTarget.value;
  clearTimeout(stockShareSearchTimer);
  if (stockShareResults) stockShareResults.innerHTML = keyword.trim()
    ? `<div class="stock-share-empty">正在准备候选股票...</div>`
    : stockShareResults.innerHTML;
  stockShareSearchTimer = setTimeout(() => searchStocksForShare(keyword), 80);
});
stockShareSearchBtn?.addEventListener("click", () => searchStocksForShare(stockShareSearchInput?.value || ""));
stockShareSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const firstLink = stockShareResults?.querySelector(".stock-share-result-actions a");
    if (firstLink) firstLink.click();
    else searchStocksForShare(event.currentTarget.value);
  }
});
shareSnapshotCloseBtn?.addEventListener("click", closeShareSnapshotModal);
shareSnapshotModal?.addEventListener("click", (event) => {
  if (event.target === shareSnapshotModal) closeShareSnapshotModal();
});
shareSnapshotModal?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeShareSnapshotModal();
});
copyShareSnapshotBtn?.addEventListener("click", async () => {
  const url = shareSnapshotLink?.value || "";
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    if (shareSnapshotStatus) shareSnapshotStatus.textContent = "链接已复制，可直接发给其他人";
  } catch (_) {
    shareSnapshotLink?.focus();
    shareSnapshotLink?.select();
    if (shareSnapshotStatus) shareSnapshotStatus.textContent = "请长按或手动复制上方链接";
  }
});

publishWebSnapshotBtn?.addEventListener("click", async () => {
  if (!isLocalServiceHost()) {
    connectionStatusEl.textContent = "云端已生成当前页面快照，可直接分享给手机或其他人。";
    await openCurrentShareSnapshot();
    return;
  }
  const originalText = publishWebSnapshotBtn.textContent;
  publishWebSnapshotBtn.disabled = true;
  publishWebSnapshotBtn.textContent = "正在导出并发布...";
  connectionStatusEl.textContent = "正在固化当天持仓与风控数据，完成后 Vercel 会自动更新。";
  try {
    const result = await postJson("/api/web-publish", { portfolio_id: state.currentPortfolioId || "" });
    staticShareManifestPromise = null;
    const publishedShareUrl = result.public_share?.share_url || result.share_url || "";
    if (publishedShareUrl) {
      if (shareSnapshotLink) shareSnapshotLink.value = publishedShareUrl;
      if (openShareSnapshotLink) openShareSnapshotLink.href = publishedShareUrl;
      if (shareSnapshotStatus) shareSnapshotStatus.textContent = "当前持仓已发布，可直接复制发给手机";
      if (shareSnapshotModal) shareSnapshotModal.hidden = false;
    }
    connectionStatusEl.className = "online";
    connectionStatusEl.textContent = result.sync_pending
      ? "本机快照已生成，GitHub 暂时不可用；已保留在本机，稍后可再次同步。"
      : result.published
      ? `已发布到云端：${String(result.generated_at || "").replace("T", " ").slice(0, 16)}，分享链接通常数秒内生效。`
      : "当天静态数据没有变化，无需重复发布。";
  } catch (error) {
    connectionStatusEl.className = "online";
    connectionStatusEl.textContent = "GitHub 暂时连接失败，已改为生成当前持仓分享快照；稍后可再次同步公共主页。";
    await openCurrentShareSnapshot();
  } finally {
    publishWebSnapshotBtn.disabled = false;
    publishWebSnapshotBtn.textContent = originalText;
  }
});

const requestedTab = new URLSearchParams(window.location.search).get("tab");
if (requestedTab && tabs.some((item) => item.id === requestedTab && !item.href)) {
  state.activeTab = requestedTab;
}
renderTabs();
bindFoldToggles();
clearStoredPortfoliosOnce();

async function initializeWorkbench() {
  hydrateStateFromStorage();
  if (requestedTab && tabs.some((item) => item.id === requestedTab && !item.href)) {
    state.activeTab = requestedTab;
  }
  await refreshConnectionStatus();
  const restoredFromDb = await hydratePortfoliosFromDb();
  if (restoredFromDb) {
    await loadLatestLogicValidation();
    await Promise.all(state.portfolios.map((portfolio) => enrichPortfolioIndustries(portfolio.id)));
    await flushPortfoliosToDb();
    queueHoldingMarketRefresh("startup_holding_reconcile");
  } else {
    const restoredFromStaticSeed = await hydratePortfoliosFromStaticSeed();
    if (restoredFromStaticSeed) {
      await loadLatestLogicValidation();
    } else if (hydrateStateFromStorage()) {
      renderAll();
      actionStatusEl.textContent = `已恢复 ${state.portfolios.length} 个组合、${state.feedRecords.length} 条观点记录。`;
      await syncPortfoliosToDb();
    } else {
      state.themeMappings = getDefaultThemeMappings();
      renderAll();
      actionStatusEl.textContent = "当前为空工作台，可直接导入持仓或交易数据。";
    }
    await loadLatestLogicValidation();
  }
  syncLatestAutoResearchHotspots();
  syncLatestAutoMarketSnapshot();
  await Promise.all([
    runStartupCatchupSync(),
    loadAdvisorStrategyProfile(),
    loadAdvisorReview({ silent: true })
  ]);
  const currentValidation = state.logicValidationResult;
  if (!currentValidation || currentValidation.portfolio_id !== getCurrentPortfolio()?.id) {
    queueLogicValidationRefresh("workbench_opened", 500);
  }
  if (!window.__holdingMarketAutoRefresh) {
    window.__holdingMarketAutoRefresh = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || holdingMarketAutoRefreshPending) return;
      const restored = await hydratePortfoliosFromDb({ silent: true });
      if (restored) {
        // 静默重算：不清空正在查看的指标、板块详情和K线。
        loadRiskDashboard(true);
      }
    }, 5 * 60 * 1000);
  }
  if (!window.__riskDashboardAutoRefresh) {
    window.__riskDashboardAutoRefresh = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadRiskDashboard(true);
      }
    }, 10 * 60 * 1000);
  }
}

initializeWorkbench();
