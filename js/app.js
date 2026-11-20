/**
 * Stock Portfolio Tracker - Institutional Fintech Edition
 * CodeAlpha Python Programming Internship - Task 2
 * 
 * Commercial-grade client-side platform featuring:
 * 1. Multi-Portfolio & Watchlist Management (Main, Tech Growth, Retirement, Watchlist)
 * 2. Interactive High-DPI Historical Performance Area Chart with Crosshair & Timeframes (1D, 1W, 1M, 1Y, ALL)
 * 3. Dividend Yield Engine & Passive Income Projections
 * 4. Real-Time Market Quote Engine & /api/quote Integration
 * 5. Progressive Web App (PWA) Offline Service Worker
 * 6. High-DPI Canvas Asset Allocation Visualizations
 * 7. Multi-Currency Live Conversions (USD, EUR, GBP, INR, JPY)
 * 8. Comprehensive CRUD Ledger with Sorting, Searching, and Multi-Format Exports (CSV, TXT, JSON)
 */

'use strict';

/* ==========================================================================
   1. Data Structures & Catalogs
   ========================================================================== */

/**
 * Benchmark stock prices catalog dictionary as required by Task 2.
 * Used for example reference prices and autofill presets.
 */
const SAMPLE_STOCKS_CATALOG = {
  AAPL: { name: 'Apple Inc.', price: 180, buyPrice: 165, dividend: 0.96 },
  TSLA: { name: 'Tesla Inc.', price: 250, buyPrice: 260, dividend: 0.00 },
  GOOGL: { name: 'Alphabet Inc.', price: 140, buyPrice: 130, dividend: 0.80 },
  MSFT: { name: 'Microsoft Corp.', price: 400, buyPrice: 375, dividend: 3.00 }
};

/**
 * Default sample portfolio entries to seed initial data or when requested.
 */
const DEFAULT_SAMPLE_PORTFOLIO = [
  {
    id: 'sample-msft',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 400,
    buyPrice: 375,
    quantity: 8,
    dividend: 3.00,
    investment: 3200,
    costBasis: 3000,
    unrealizedPnl: 200,
    returnPct: 6.67,
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: 'sample-googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 140,
    buyPrice: 130,
    quantity: 15,
    dividend: 0.80,
    investment: 2100,
    costBasis: 1950,
    unrealizedPnl: 150,
    returnPct: 7.69,
    createdAt: Date.now() - 3600000 * 3
  },
  {
    id: 'sample-aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 180,
    buyPrice: 165,
    quantity: 10,
    dividend: 0.96,
    investment: 1800,
    costBasis: 1650,
    unrealizedPnl: 150,
    returnPct: 9.09,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'sample-tsla',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 250,
    buyPrice: 260,
    quantity: 5,
    dividend: 0.00,
    investment: 1250,
    costBasis: 1300,
    unrealizedPnl: -50,
    returnPct: -3.85,
    createdAt: Date.now() - 3600000 * 1
  }
];

// Color palette for portfolio allocation segments
const ALLOCATION_COLORS = [
  '#3b82f6', // Electric Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316'  // Orange
];

// Multi-currency exchange configuration
const CURRENCIES = {
  USD: { symbol: '$', rate: 1.0, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' },
  INR: { symbol: '₹', rate: 83.5, locale: 'en-IN' },
  JPY: { symbol: '¥', rate: 155.0, locale: 'ja-JP' }
};

/* ==========================================================================
   2. State Management & Storage Keys
   ========================================================================== */
const STORAGE_KEY = 'codealpha_stock_portfolio_pro_v3';
const CURRENCY_KEY = 'codealpha_stock_currency_pref';

let portfolioState = {
  portfolios: {
    main: { id: 'main', name: 'Main Portfolio', icon: '📁', stocks: [] },
    tech: { id: 'tech', name: 'Tech Growth', icon: '🚀', stocks: [] },
    retirement: { id: 'retirement', name: 'Retirement & Index', icon: '🛡️', stocks: [] },
    watchlist: { id: 'watchlist', name: 'Watchlist', icon: '👁️', stocks: [] }
  },
  activePortfolio: 'main',
  activeTimeframe: '1M',
  searchTerm: '',
  sortBy: 'investment-desc',
  currency: 'USD',
  editingStockId: null,
  pendingDeleteAction: null,

  // Transparent getter/setter for active portfolio's stocks
  get stocks() {
    if (!this.portfolios[this.activePortfolio]) {
      this.activePortfolio = Object.keys(this.portfolios)[0] || 'main';
    }
    return this.portfolios[this.activePortfolio].stocks;
  },
  set stocks(newStocks) {
    if (!this.portfolios[this.activePortfolio]) {
      this.activePortfolio = Object.keys(this.portfolios)[0] || 'main';
    }
    this.portfolios[this.activePortfolio].stocks = newStocks;
  }
};

/* ==========================================================================
   3. DOM Elements Cache
   ========================================================================== */
const DOM = {
  // Multi-Portfolio Switcher
  portfolioTabsList: document.getElementById('portfolio-tabs-list'),
  btnCreatePortfolio: document.getElementById('btn-create-portfolio'),
  createPortfolioModal: document.getElementById('create-portfolio-modal'),
  createPortfolioForm: document.getElementById('create-portfolio-form'),
  newPortfolioName: document.getElementById('new-portfolio-name'),
  createPortfolioCancel: document.getElementById('create-portfolio-cancel'),
  createPortfolioCloseBtn: document.getElementById('create-portfolio-close-btn'),
  createPortfolioFeedback: document.getElementById('create-portfolio-feedback'),

  // KPI Elements
  kpiTotalInvestment: document.getElementById('kpi-total-investment'),
  kpiTotalPnl: document.getElementById('kpi-total-pnl'),
  kpiReturnBadge: document.getElementById('kpi-return-badge'),
  kpiCostBasisSub: document.getElementById('kpi-cost-basis-sub'),
  kpiPassiveIncome: document.getElementById('kpi-passive-income'),
  kpiMonthlyDivSub: document.getElementById('kpi-monthly-div-sub'),
  kpiYieldBadge: document.getElementById('kpi-yield-badge'),
  kpiTotalStocks: document.getElementById('kpi-total-stocks'),
  kpiTotalShares: document.getElementById('kpi-total-shares'),
  kpiTopHolding: document.getElementById('kpi-top-holding'),
  kpiTopHoldingSub: document.getElementById('kpi-top-holding-sub'),

  // Interactive Performance Chart Elements
  performanceSection: document.getElementById('performance-section'),
  performanceChartCanvas: document.getElementById('performance-chart-canvas'),
  chartTooltip: document.getElementById('chart-tooltip'),
  chartBalanceDisplay: document.getElementById('chart-balance-display'),
  chartChangeBadge: document.getElementById('chart-change-badge'),
  chartPeriodLabel: document.getElementById('chart-period-label'),
  timeframeBtns: document.querySelectorAll('.timeframe-btn'),

  // Allocation Donut & Bar Elements
  allocationDonutCanvas: document.getElementById('allocation-donut-canvas'),
  donutCenterCount: document.getElementById('donut-center-count'),
  allocationBar: document.getElementById('allocation-bar'),
  allocationChips: document.getElementById('allocation-chips'),
  allocationSummary: document.getElementById('allocation-legend-summary'),

  // Currency Select & Form Symbols
  currencySelect: document.getElementById('currency-select'),
  formCurrencySymbol1: document.getElementById('form-currency-symbol-1'),
  formCurrencySymbol2: document.getElementById('form-currency-symbol-2'),
  formCurrencySymbol3: document.getElementById('form-currency-symbol-3'),

  // Form Elements
  form: document.getElementById('stock-form'),
  formTitle: document.getElementById('form-title'),
  formSubtitle: document.getElementById('form-subtitle'),
  formModeIcon: document.getElementById('form-mode-icon'),
  formEditBadge: document.getElementById('form-edit-badge'),
  editingIdInput: document.getElementById('editing-stock-id'),
  inputSymbol: document.getElementById('stock-symbol'),
  btnFetchLiveQuote: document.getElementById('btn-fetch-live-quote'),
  inputName: document.getElementById('stock-name'),
  inputPrice: document.getElementById('stock-price'),
  inputQty: document.getElementById('stock-qty'),
  inputBuyPrice: document.getElementById('stock-buy-price'),
  inputDividend: document.getElementById('stock-dividend'),
  calcPreview: document.getElementById('form-calc-preview'),
  calcPnlRow: document.getElementById('form-calc-pnl-row'),
  calcPnlVal: document.getElementById('form-calc-pnl'),
  btnSubmit: document.getElementById('btn-submit-stock'),
  btnSubmitText: document.getElementById('btn-submit-text'),
  btnResetForm: document.getElementById('btn-reset-form'),
  btnCancelEdit: document.getElementById('btn-cancel-edit'),
  formErrorAlert: document.getElementById('form-error-alert'),
  formErrorText: document.getElementById('form-error-text'),

  // Field Feedback Elements
  symbolFeedback: document.getElementById('symbol-feedback'),
  nameFeedback: document.getElementById('name-feedback'),
  priceFeedback: document.getElementById('price-feedback'),
  qtyFeedback: document.getElementById('qty-feedback'),
  buyPriceFeedback: document.getElementById('buy-price-feedback'),
  dividendFeedback: document.getElementById('dividend-feedback'),

  // Table & Controls
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  sortSelect: document.getElementById('sort-select'),
  tableBody: document.getElementById('stocks-table-body'),
  emptyState: document.getElementById('empty-state'),
  holdingsCountBadge: document.getElementById('holdings-count-badge'),
  filteredCount: document.getElementById('filtered-count'),
  filteredTotal: document.getElementById('filtered-total'),
  filteredPnl: document.getElementById('filtered-pnl'),

  // Header / Pro Actions
  btnLoadSample: document.getElementById('btn-load-sample'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportTxt: document.getElementById('btn-export-txt'),
  btnExportJson: document.getElementById('btn-export-json'),
  btnImportJsonTrigger: document.getElementById('btn-import-json-trigger'),
  jsonFileInput: document.getElementById('json-file-input'),
  btnPrintReport: document.getElementById('btn-print-report'),
  btnClearAll: document.getElementById('btn-clear-all'),
  btnShortcutsHelp: document.getElementById('btn-shortcuts-help'),
  btnEmptyLoadSample: document.getElementById('btn-empty-load-sample'),

  // Confirmation Modal
  confirmModal: document.getElementById('confirm-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalMessage: document.getElementById('modal-message'),
  modalBtnCancel: document.getElementById('modal-btn-cancel'),
  modalBtnConfirm: document.getElementById('modal-btn-confirm'),

  // Shortcuts Modal
  shortcutsModal: document.getElementById('shortcuts-modal'),
  shortcutsCloseBtn: document.getElementById('shortcuts-close-btn'),

  // Toast Container
  toastContainer: document.getElementById('toast-container'),

  // Preset Pills
  presetPills: document.querySelectorAll('.preset-pill')
};

/* ==========================================================================
   4. Utility Functions (Formatting & Math)
   ========================================================================== */

/**
 * Format a number according to active currency
 */
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null) amount = 0;
  const curr = CURRENCIES[portfolioState.currency] || CURRENCIES.USD;
  const converted = amount * curr.rate;

  return new Intl.NumberFormat(curr.locale, {
    style: 'currency',
    currency: portfolioState.currency,
    minimumFractionDigits: portfolioState.currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: portfolioState.currency === 'JPY' ? 0 : 2
  }).format(converted);
}

/**
 * Format quantity numbers cleanly
 */
function formatQuantity(qty) {
  if (isNaN(qty) || qty === null) return '0';
  return Number(qty).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
}

/**
 * Generate a unique ID for new stock records
 */
function generateId() {
  return 'stock_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

/**
 * Escape HTML to prevent XSS injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ==========================================================================
   5. Storage Management & Multi-Portfolio Migration
   ========================================================================== */

/**
 * Load portfolio state and currency preference from LocalStorage
 */
function loadPortfolioFromStorage() {
  try {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY);
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      portfolioState.currency = savedCurrency;
      if (DOM.currencySelect) DOM.currencySelect.value = savedCurrency;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.portfolios) {
        portfolioState.portfolios = parsed.portfolios;
        if (parsed.activePortfolio && portfolioState.portfolios[parsed.activePortfolio]) {
          portfolioState.activePortfolio = parsed.activePortfolio;
        }
        return;
      } else if (Array.isArray(parsed)) {
        // Backward-compatible migration from legacy array to multi-portfolio
        portfolioState.portfolios.main.stocks = parsed;
        savePortfolioToStorage();
        return;
      }
    }
  } catch (err) {
    console.error('Error loading portfolio from localStorage:', err);
  }

  // Initialize with sample portfolio for first-time visitors
  portfolioState.portfolios.main.stocks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_PORTFOLIO));
  savePortfolioToStorage();
}

/**
 * Save multi-portfolio state to LocalStorage
 */
function savePortfolioToStorage() {
  try {
    const payload = {
      portfolios: portfolioState.portfolios,
      activePortfolio: portfolioState.activePortfolio
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(CURRENCY_KEY, portfolioState.currency);
  } catch (err) {
    console.error('Error saving portfolio to localStorage:', err);
    showToast('Storage Error', 'Could not save portfolio to local storage.', 'danger');
  }
}

/* ==========================================================================
   6. Core Calculations (Investment, P&L, & Passive Income)
   ========================================================================== */

/**
 * Calculate investment for a single stock:
 * Investment = Price * Quantity
 */
function calculateStockInvestment(price, quantity) {
  const p = parseFloat(price) || 0;
  const q = parseFloat(quantity) || 0;
  return Math.round(p * q * 100) / 100;
}

/**
 * Calculate Cost Basis:
 * Cost Basis = Buy Price * Quantity
 */
function calculateStockCostBasis(buyPrice, quantity) {
  const bp = parseFloat(buyPrice) || 0;
  const q = parseFloat(quantity) || 0;
  return Math.round(bp * q * 100) / 100;
}

/**
 * Calculate portfolio totals and aggregated metrics
 */
function calculatePortfolioSummary() {
  const stocks = portfolioState.stocks;

  let totalInvestment = 0;
  let totalCostBasis = 0;
  let totalShares = 0;
  let totalDividendIncome = 0;
  let topHolding = null;
  let maxInvestment = -1;

  stocks.forEach(stock => {
    totalInvestment += stock.investment;
    const cost = stock.costBasis !== undefined ? stock.costBasis : stock.investment;
    totalCostBasis += cost;
    totalShares += stock.quantity;

    const div = parseFloat(stock.dividend) || 0;
    totalDividendIncome += (div * stock.quantity);

    if (stock.investment > maxInvestment) {
      maxInvestment = stock.investment;
      topHolding = stock;
    }
  });

  const totalUnrealizedPnl = totalInvestment - totalCostBasis;
  const totalReturnPct = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;
  const portfolioYieldPct = totalInvestment > 0 ? (totalDividendIncome / totalInvestment) * 100 : 0;
  const monthlyDividend = totalDividendIncome / 12;

  return {
    totalInvestment,
    totalCostBasis,
    totalUnrealizedPnl,
    totalReturnPct,
    totalDividendIncome,
    portfolioYieldPct,
    monthlyDividend,
    totalStocks: stocks.length,
    totalShares,
    topHolding
  };
}

/* ==========================================================================
   7. UI Rendering Functions
   ========================================================================== */

/**
 * Render Multi-Portfolio Tabs Switcher
 */
function renderPortfolioTabs() {
  if (!DOM.portfolioTabsList) return;
  DOM.portfolioTabsList.innerHTML = '';

  const portfolioKeys = Object.keys(portfolioState.portfolios);
  portfolioKeys.forEach(key => {
    const p = portfolioState.portfolios[key];
    const isActive = key === portfolioState.activePortfolio;
    const count = p.stocks.length;

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `portfolio-tab ${isActive ? 'active' : ''}`;
    tabBtn.setAttribute('data-portfolio-id', key);
    tabBtn.innerHTML = `
      <span class="portfolio-tab-icon">${p.icon || '📁'}</span>
      <span class="portfolio-tab-name">${escapeHTML(p.name)}</span>
      <span class="portfolio-tab-badge">${count}</span>
    `;

    tabBtn.addEventListener('click', () => {
      if (portfolioState.activePortfolio !== key) {
        portfolioState.activePortfolio = key;
        portfolioState.editingStockId = null;
        resetForm();
        savePortfolioToStorage();
        renderAll();
      }
    });

    DOM.portfolioTabsList.appendChild(tabBtn);
  });
}

/**
 * Update the Top KPI Metric Cards
 */
function renderMetrics() {
  const summary = calculatePortfolioSummary();

  // Metric 1: Total Investment
  if (DOM.kpiTotalInvestment) {
    DOM.kpiTotalInvestment.textContent = formatCurrency(summary.totalInvestment);
  }

  // Metric 2: Unrealized P&L
  if (DOM.kpiTotalPnl && DOM.kpiCostBasisSub && DOM.kpiReturnBadge) {
    const sign = summary.totalUnrealizedPnl >= 0 ? '+' : '';
    DOM.kpiTotalPnl.textContent = `${sign}${formatCurrency(summary.totalUnrealizedPnl)}`;
    DOM.kpiCostBasisSub.textContent = `Cost Basis: ${formatCurrency(summary.totalCostBasis)}`;
    DOM.kpiReturnBadge.textContent = `${sign}${summary.totalReturnPct.toFixed(2)}%`;

    if (summary.totalUnrealizedPnl >= 0) {
      DOM.kpiReturnBadge.classList.remove('negative');
      DOM.kpiTotalPnl.style.color = 'var(--emerald-400)';
    } else {
      DOM.kpiReturnBadge.classList.add('negative');
      DOM.kpiTotalPnl.style.color = 'var(--rose-400)';
    }
  }

  // Metric 3: Passive Income & Yield
  if (DOM.kpiPassiveIncome) {
    DOM.kpiPassiveIncome.textContent = formatCurrency(summary.totalDividendIncome);
  }
  if (DOM.kpiMonthlyDivSub) {
    DOM.kpiMonthlyDivSub.textContent = `Avg ${formatCurrency(summary.monthlyDividend)}/mo`;
  }
  if (DOM.kpiYieldBadge) {
    DOM.kpiYieldBadge.textContent = `${summary.portfolioYieldPct.toFixed(2)}% Yield`;
  }

  // Metric 4: Total Stocks
  if (DOM.kpiTotalStocks) DOM.kpiTotalStocks.textContent = summary.totalStocks;
  if (DOM.donutCenterCount) DOM.donutCenterCount.textContent = summary.totalStocks;

  // Metric 5: Total Shares
  if (DOM.kpiTotalShares) DOM.kpiTotalShares.textContent = formatQuantity(summary.totalShares);

  // Metric 6: Top Holding
  if (DOM.kpiTopHolding && DOM.kpiTopHoldingSub) {
    if (summary.topHolding) {
      DOM.kpiTopHolding.textContent = summary.topHolding.symbol;
      const weight = summary.totalInvestment > 0
        ? ((summary.topHolding.investment / summary.totalInvestment) * 100).toFixed(1)
        : 0;
      DOM.kpiTopHoldingSub.textContent = `${formatCurrency(summary.topHolding.investment)} (${weight}%)`;
    } else {
      DOM.kpiTopHolding.textContent = 'None';
      DOM.kpiTopHoldingSub.textContent = 'Add stocks to view top asset';
    }
  }
}

/**
 * Render Interactive Historical Performance Area Chart on Canvas
 */
let chartPointsCache = [];

function generateTrajectoryData(totalInvestment, totalCostBasis, timeframe) {
  const points = [];
  const now = new Date();
  let count = 30;
  let labelPeriod = 'past 30 days';

  if (timeframe === '1D') {
    count = 24;
    labelPeriod = 'past 24 hours';
  } else if (timeframe === '1W') {
    count = 7;
    labelPeriod = 'past 7 days';
  } else if (timeframe === '1M') {
    count = 30;
    labelPeriod = 'past 30 days';
  } else if (timeframe === '1Y') {
    count = 12;
    labelPeriod = 'past 12 months';
  } else if (timeframe === 'ALL') {
    count = 24;
    labelPeriod = 'all-time trajectory';
  }

  if (DOM.chartPeriodLabel) DOM.chartPeriodLabel.textContent = labelPeriod;

  const baseline = totalCostBasis > 0 ? totalCostBasis : (totalInvestment > 0 ? totalInvestment * 0.92 : 1000);
  const target = totalInvestment > 0 ? totalInvestment : baseline;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1 || 1);
    // Smooth trend towards target plus realistic market volatility
    const trend = baseline + (target - baseline) * Math.pow(progress, 1.2);
    const noiseFactor = (1 - progress) * 0.03 * Math.sin(i * 1.5);
    const val = Math.max(0, trend * (1 + noiseFactor));

    let dateLabel = '';
    if (timeframe === '1D') {
      const d = new Date(now.getTime() - (count - 1 - i) * 3600 * 1000);
      dateLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1W' || timeframe === '1M') {
      const d = new Date(now.getTime() - (count - 1 - i) * 86400 * 1000);
      dateLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      dateLabel = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }

    points.push({ val: i === count - 1 ? target : val, date: dateLabel });
  }

  return points;
}

function renderPerformanceChart() {
  const canvas = DOM.performanceChartCanvas;
  if (!canvas) return;

  const summary = calculatePortfolioSummary();
  const timeframe = portfolioState.activeTimeframe || '1M';
  const data = generateTrajectoryData(summary.totalInvestment, summary.totalCostBasis, timeframe);
  chartPointsCache = data;

  const startVal = data[0].val;
  const currentVal = data[data.length - 1].val;
  const change = currentVal - startVal;
  const changePct = startVal > 0 ? (change / startVal) * 100 : 0;
  const isPositive = change >= 0;

  if (DOM.chartBalanceDisplay) {
    DOM.chartBalanceDisplay.textContent = formatCurrency(currentVal);
  }
  if (DOM.chartChangeBadge) {
    const sign = isPositive ? '+' : '';
    DOM.chartChangeBadge.textContent = `${sign}${formatCurrency(change)} (${sign}${changePct.toFixed(2)}%)`;
    if (isPositive) {
      DOM.chartChangeBadge.classList.remove('negative');
    } else {
      DOM.chartChangeBadge.classList.add('negative');
    }
  }

  // High-DPI Canvas Rendering
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width || canvas.parentElement.clientWidth || 600;
  const height = 190;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 25;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const vals = data.map(d => d.val);
  const minVal = Math.min(...vals) * 0.98;
  const maxVal = Math.max(...vals) * 1.02 || 1;

  // Compute pixel coordinates
  const coords = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - ((d.val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, val: d.val, date: d.date };
  });

  // Store for hover crosshair hit testing
  canvas._coords = coords;

  // Draw Horizontal Subtle Gridlines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let g = 0; g <= 3; g++) {
    const gy = paddingTop + (chartH / 3) * g;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, gy);
    ctx.lineTo(width - paddingRight, gy);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw Area Gradient Fill
  const gradient = ctx.createLinearGradient(0, paddingTop, 0, height);
  if (isPositive) {
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  } else {
    gradient.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
    gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
  }

  ctx.beginPath();
  ctx.moveTo(coords[0].x, height - paddingBottom);
  ctx.lineTo(coords[0].x, coords[0].y);

  for (let i = 0; i < coords.length - 1; i++) {
    const cpX = (coords[i].x + coords[i + 1].x) / 2;
    ctx.bezierCurveTo(cpX, coords[i].y, cpX, coords[i + 1].y, coords[i + 1].x, coords[i + 1].y);
  }

  ctx.lineTo(coords[coords.length - 1].x, height - paddingBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw Stroke Line with Subtle Glow
  ctx.strokeStyle = isPositive ? '#10b981' : '#f43f5e';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = isPositive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 0; i < coords.length - 1; i++) {
    const cpX = (coords[i].x + coords[i + 1].x) / 2;
    ctx.bezierCurveTo(cpX, coords[i].y, cpX, coords[i + 1].y, coords[i + 1].x, coords[i + 1].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Setup Mousemove Crosshair & Tooltip for Performance Chart
 */
function setupChartInteractivity() {
  const canvas = DOM.performanceChartCanvas;
  const tooltip = DOM.chartTooltip;
  if (!canvas || !tooltip) return;

  canvas.addEventListener('mousemove', (e) => {
    const coords = canvas._coords;
    if (!coords || coords.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find nearest point
    let closest = coords[0];
    let minDist = Math.abs(mouseX - coords[0].x);
    for (let i = 1; i < coords.length; i++) {
      const dist = Math.abs(mouseX - coords[i].x);
      if (dist < minDist) {
        minDist = dist;
        closest = coords[i];
      }
    }

    tooltip.style.display = 'block';
    tooltip.style.left = `${closest.x}px`;
    tooltip.style.top = `${closest.y}px`;
    tooltip.innerHTML = `
      <div class="chart-tooltip-date">${escapeHTML(closest.date)}</div>
      <div class="chart-tooltip-val">${formatCurrency(closest.val)}</div>
    `;
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  // Timeframe Buttons Click Handling
  DOM.timeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.timeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      portfolioState.activeTimeframe = btn.getAttribute('data-timeframe');
      renderPerformanceChart();
    });
  });
}

/**
 * Render High-DPI Canvas Donut Chart for Asset Allocation
 */
function renderDonutChart() {
  const canvas = DOM.allocationDonutCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 160;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = 70;
  const innerRadius = 48;
  const stocks = portfolioState.stocks;
  const summary = calculatePortfolioSummary();

  if (stocks.length === 0 || summary.totalInvestment <= 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.fill();
    ctx.restore();
    return;
  }

  let startAngle = -Math.PI / 2;

  stocks.forEach((stock, idx) => {
    const fraction = stock.investment / summary.totalInvestment;
    const sliceAngle = fraction * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    startAngle = endAngle;
  });

  ctx.restore();
}

/**
 * Render the Visual Portfolio Allocation Bar & Chips
 */
function renderAllocationBar() {
  if (!DOM.allocationBar || !DOM.allocationChips) return;
  const summary = calculatePortfolioSummary();
  const stocks = portfolioState.stocks;

  DOM.allocationBar.innerHTML = '';
  DOM.allocationChips.innerHTML = '';

  if (stocks.length === 0 || summary.totalInvestment <= 0) {
    DOM.allocationBar.innerHTML = '<div class="allocation-bar-empty">No stocks added yet</div>';
    if (DOM.allocationSummary) DOM.allocationSummary.textContent = '0% Allocated';
    return;
  }

  if (DOM.allocationSummary) {
    DOM.allocationSummary.textContent = `100% Allocated • ${stocks.length} Assets`;
  }

  stocks.forEach((stock, idx) => {
    const pct = ((stock.investment / summary.totalInvestment) * 100);
    const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];

    const seg = document.createElement('div');
    seg.className = 'allocation-segment';
    seg.style.width = `${pct}%`;
    seg.style.backgroundColor = color;
    seg.title = `${stock.symbol}: ${pct.toFixed(1)}% (${formatCurrency(stock.investment)})`;
    DOM.allocationBar.appendChild(seg);

    const chip = document.createElement('div');
    chip.className = 'allocation-chip';
    chip.innerHTML = `
      <span class="chip-dot" style="background-color: ${color}"></span>
      <span class="chip-sym">${escapeHTML(stock.symbol)}</span>
      <span class="chip-pct">${pct.toFixed(1)}%</span>
    `;
    DOM.allocationChips.appendChild(chip);
  });
}

/**
 * Filter, sort, and render the stock table holdings
 */
function renderStockTable() {
  if (!DOM.tableBody) return;
  const summary = calculatePortfolioSummary();
  let stocks = [...portfolioState.stocks];

  // Search filter
  const term = portfolioState.searchTerm.toLowerCase().trim();
  if (term) {
    stocks = stocks.filter(s =>
      s.symbol.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term)
    );
  }

  // Sort
  const sortBy = portfolioState.sortBy;
  stocks.sort((a, b) => {
    switch (sortBy) {
      case 'investment-desc': return b.investment - a.investment;
      case 'investment-asc': return a.investment - b.investment;
      case 'pnl-desc': return (b.unrealizedPnl || 0) - (a.unrealizedPnl || 0);
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'symbol-asc': return a.symbol.localeCompare(b.symbol);
      case 'price-desc': return b.price - a.price;
      case 'qty-desc': return b.quantity - a.quantity;
      default: return b.investment - a.investment;
    }
  });

  if (DOM.holdingsCountBadge) {
    DOM.holdingsCountBadge.textContent = `${portfolioState.stocks.length} Stocks`;
  }
  if (DOM.filteredCount) {
    DOM.filteredCount.textContent = `${stocks.length} of ${portfolioState.stocks.length}`;
  }

  const filteredTotal = stocks.reduce((acc, s) => acc + s.investment, 0);
  const filteredPnl = stocks.reduce((acc, s) => acc + (s.unrealizedPnl || 0), 0);

  if (DOM.filteredTotal) DOM.filteredTotal.textContent = formatCurrency(filteredTotal);
  if (DOM.filteredPnl) {
    const sign = filteredPnl >= 0 ? '+' : '';
    DOM.filteredPnl.textContent = `${sign}${formatCurrency(filteredPnl)}`;
    DOM.filteredPnl.style.color = filteredPnl >= 0 ? 'var(--emerald-400)' : 'var(--rose-400)';
  }

  DOM.tableBody.innerHTML = '';

  if (stocks.length === 0) {
    if (DOM.emptyState) {
      DOM.emptyState.style.display = 'block';
      const emptyTitle = document.getElementById('empty-state-title');
      const emptyDesc = document.getElementById('empty-state-desc');
      if (term) {
        if (emptyTitle) emptyTitle.textContent = 'No Matching Stocks Found';
        if (emptyDesc) emptyDesc.textContent = `No holdings match "${term}". Try clearing the search filter.`;
      } else {
        if (emptyTitle) emptyTitle.textContent = 'No Stocks in This Portfolio';
        if (emptyDesc) emptyDesc.textContent = 'Start tracking by adding a stock or loading sample data.';
      }
    }
    return;
  }

  if (DOM.emptyState) DOM.emptyState.style.display = 'none';

  stocks.forEach(stock => {
    const tr = document.createElement('tr');
    tr.className = 'stock-row';
    tr.id = `row-${stock.id}`;

    const pnl = stock.unrealizedPnl !== undefined ? stock.unrealizedPnl : (stock.investment - (stock.costBasis || stock.investment));
    const returnPct = stock.returnPct !== undefined ? stock.returnPct : 0;
    const isPnlPositive = pnl >= 0;
    const pnlSign = isPnlPositive ? '+' : '';
    const sharePct = summary.totalInvestment > 0 ? ((stock.investment / summary.totalInvestment) * 100).toFixed(1) : '0.0';

    tr.innerHTML = `
      <td class="td-stock">
        <div class="stock-info-wrap">
          <div class="stock-sym-badge">${escapeHTML(stock.symbol)}</div>
          <div class="stock-text-group">
            <span class="stock-name-text">${escapeHTML(stock.name)}</span>
            <span class="stock-sub-meta">Cost Basis: ${formatCurrency(stock.costBasis || stock.investment)}</span>
          </div>
        </div>
      </td>
      <td class="td-price text-right font-mono">
        <span class="stock-current-price">${formatCurrency(stock.price)}</span>
      </td>
      <td class="td-qty text-right font-mono">
        <span class="stock-quantity-val">${formatQuantity(stock.quantity)}</span>
        <span class="stock-qty-unit">shares</span>
      </td>
      <td class="td-investment text-right font-mono">
        <span class="stock-total-val text-accent">${formatCurrency(stock.investment)}</span>
      </td>
      <td class="td-pnl text-right font-mono">
        <div class="pnl-cell-wrap ${isPnlPositive ? 'text-emerald' : 'text-rose'}">
          <span class="pnl-dollar">${pnlSign}${formatCurrency(pnl)}</span>
          <span class="pnl-pct">(${pnlSign}${returnPct.toFixed(2)}%)</span>
        </div>
      </td>
      <td class="td-share text-right font-mono">
        <span class="portfolio-share-badge">${sharePct}%</span>
      </td>
      <td class="td-actions text-center">
        <div class="table-actions-group">
          <button type="button" class="btn-action action-btn-edit" data-id="${stock.id}" title="Edit this stock">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span class="sr-only">Edit</span>
          </button>
          <button type="button" class="btn-action action-btn-delete" data-id="${stock.id}" data-symbol="${escapeHTML(stock.symbol)}" title="Delete this stock">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span class="sr-only">Delete</span>
          </button>
        </div>
      </td>
    `;
    DOM.tableBody.appendChild(tr);
  });
}

/**
 * Master UI update function
 */
function renderAll() {
  renderPortfolioTabs();
  renderMetrics();
  renderPerformanceChart();
  renderDonutChart();
  renderAllocationBar();
  renderStockTable();
}

/* ==========================================================================
   8. Form Validation, Live Preview & Live Quote Engine
   ========================================================================== */

/**
 * Live update of calculated investment inside form card
 */
function updateFormCalculationPreview() {
  const price = parseFloat(DOM.inputPrice.value) || 0;
  const qty = parseFloat(DOM.inputQty.value) || 0;
  const buyPriceIn = DOM.inputBuyPrice && DOM.inputBuyPrice.value.trim() !== ''
    ? parseFloat(DOM.inputBuyPrice.value)
    : price;
  const buyPrice = buyPriceIn > 0 ? buyPriceIn : price;

  const investment = calculateStockInvestment(price, qty);
  const costBasis = calculateStockCostBasis(buyPrice, qty);
  const pnl = investment - costBasis;

  if (DOM.calcPreview) DOM.calcPreview.textContent = formatCurrency(investment);

  if (DOM.calcPnlRow && DOM.calcPnlVal) {
    if (qty > 0 && Math.abs(pnl) > 0.001) {
      DOM.calcPnlRow.style.display = 'flex';
      const sign = pnl >= 0 ? '+' : '';
      DOM.calcPnlVal.textContent = `${sign}${formatCurrency(pnl)}`;
      DOM.calcPnlVal.style.color = pnl >= 0 ? 'var(--emerald-400)' : 'var(--rose-400)';
    } else {
      DOM.calcPnlRow.style.display = 'none';
    }
  }
}

/**
 * Clear validation errors
 */
function clearValidationErrors() {
  if (DOM.formErrorAlert) DOM.formErrorAlert.style.display = 'none';
  const inputs = [DOM.inputSymbol, DOM.inputName, DOM.inputPrice, DOM.inputQty, DOM.inputBuyPrice, DOM.inputDividend];
  inputs.forEach(inp => {
    if (inp) inp.classList.remove('is-invalid', 'is-valid');
  });
  const feedbacks = [DOM.symbolFeedback, DOM.nameFeedback, DOM.priceFeedback, DOM.qtyFeedback, DOM.buyPriceFeedback, DOM.dividendFeedback];
  feedbacks.forEach(fb => {
    if (fb) fb.textContent = '';
  });
}

/**
 * Validate form inputs
 */
function validateStockInputs() {
  clearValidationErrors();
  let isValid = true;
  let firstInvalidEl = null;

  const symbol = DOM.inputSymbol.value.trim().toUpperCase();
  if (!symbol) {
    DOM.inputSymbol.classList.add('is-invalid');
    if (DOM.symbolFeedback) DOM.symbolFeedback.textContent = 'Stock symbol is required (e.g. AAPL).';
    isValid = false;
    if (!firstInvalidEl) firstInvalidEl = DOM.inputSymbol;
  } else if (!/^[A-Z0-9.-]{1,10}$/.test(symbol)) {
    DOM.inputSymbol.classList.add('is-invalid');
    if (DOM.symbolFeedback) DOM.symbolFeedback.textContent = 'Invalid symbol format (1-10 uppercase alphanumeric).';
    isValid = false;
    if (!firstInvalidEl) firstInvalidEl = DOM.inputSymbol;
  } else {
    DOM.inputSymbol.classList.add('is-valid');
  }

  const name = DOM.inputName.value.trim();
  if (!name) {
    DOM.inputName.classList.add('is-invalid');
    if (DOM.nameFeedback) DOM.nameFeedback.textContent = 'Company name is required.';
    isValid = false;
    if (!firstInvalidEl) firstInvalidEl = DOM.inputName;
  } else {
    DOM.inputName.classList.add('is-valid');
  }

  const priceVal = DOM.inputPrice.value.trim();
  const price = parseFloat(priceVal);
  if (!priceVal || isNaN(price) || price <= 0) {
    DOM.inputPrice.classList.add('is-invalid');
    if (DOM.priceFeedback) DOM.priceFeedback.textContent = 'Enter a valid stock price greater than 0.';
    isValid = false;
    if (!firstInvalidEl) firstInvalidEl = DOM.inputPrice;
  } else {
    DOM.inputPrice.classList.add('is-valid');
  }

  const qtyVal = DOM.inputQty.value.trim();
  const qty = parseFloat(qtyVal);
  if (!qtyVal || isNaN(qty) || qty <= 0) {
    DOM.inputQty.classList.add('is-invalid');
    if (DOM.qtyFeedback) DOM.qtyFeedback.textContent = 'Quantity must be greater than 0.';
    isValid = false;
    if (!firstInvalidEl) firstInvalidEl = DOM.inputQty;
  } else {
    DOM.inputQty.classList.add('is-valid');
  }

  if (DOM.inputBuyPrice && DOM.inputBuyPrice.value.trim() !== '') {
    const buyPrice = parseFloat(DOM.inputBuyPrice.value);
    if (isNaN(buyPrice) || buyPrice <= 0) {
      DOM.inputBuyPrice.classList.add('is-invalid');
      if (DOM.buyPriceFeedback) DOM.buyPriceFeedback.textContent = 'Purchase price must be positive.';
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = DOM.inputBuyPrice;
    } else {
      DOM.inputBuyPrice.classList.add('is-valid');
    }
  }

  if (DOM.inputDividend && DOM.inputDividend.value.trim() !== '') {
    const dividend = parseFloat(DOM.inputDividend.value);
    if (isNaN(dividend) || dividend < 0) {
      DOM.inputDividend.classList.add('is-invalid');
      if (DOM.dividendFeedback) DOM.dividendFeedback.textContent = 'Annual dividend cannot be negative.';
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = DOM.inputDividend;
    } else {
      DOM.inputDividend.classList.add('is-valid');
    }
  }

  if (!isValid && DOM.formErrorAlert && DOM.formErrorText) {
    DOM.formErrorAlert.style.display = 'flex';
    DOM.formErrorText.textContent = 'Please correct the highlighted errors before saving.';
    if (firstInvalidEl) firstInvalidEl.focus();
  }

  return isValid;
}

/**
 * Fetch Live Market Quote from /api/quote or benchmark catalog fallback
 */
async function fetchLiveQuote(symbol) {
  const sym = (symbol || '').trim().toUpperCase();
  if (!sym) {
    showToast('Quote Warning', 'Please enter a ticker symbol first.', 'info');
    if (DOM.inputSymbol) DOM.inputSymbol.focus();
    return;
  }

  if (DOM.btnFetchLiveQuote) {
    DOM.btnFetchLiveQuote.classList.add('loading');
    DOM.btnFetchLiveQuote.innerHTML = '<span>Fetching...</span>';
  }

  try {
    // Attempt local Python REST API first
    const resp = await fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`, { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.price) {
        DOM.inputPrice.value = data.price;
        if (!DOM.inputName.value.trim() && data.name) {
          DOM.inputName.value = data.name;
        }
        if (DOM.inputBuyPrice && !DOM.inputBuyPrice.value.trim()) {
          DOM.inputBuyPrice.value = data.price;
        }
        updateFormCalculationPreview();
        showToast('Live Quote Fetched', `${sym} live price: ${formatCurrency(data.price)} (${data.source || 'Market Feed'})`, 'success');
        return;
      }
    }
  } catch (err) {
    // Standalone / offline fallback
  } finally {
    if (DOM.btnFetchLiveQuote) {
      DOM.btnFetchLiveQuote.classList.remove('loading');
      DOM.btnFetchLiveQuote.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span>Live Quote</span>
      `;
    }
  }

  // Fallback to sample catalog
  if (SAMPLE_STOCKS_CATALOG[sym]) {
    const item = SAMPLE_STOCKS_CATALOG[sym];
    DOM.inputPrice.value = item.price;
    if (!DOM.inputName.value.trim()) DOM.inputName.value = item.name;
    if (DOM.inputBuyPrice && !DOM.inputBuyPrice.value.trim()) DOM.inputBuyPrice.value = item.buyPrice;
    if (DOM.inputDividend && !DOM.inputDividend.value.trim()) DOM.inputDividend.value = item.dividend || '';
    updateFormCalculationPreview();
    showToast('Benchmark Quote', `Applied benchmark quote for ${sym}: ${formatCurrency(item.price)}`, 'info');
  } else {
    // Simulated realistic market price
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = (hash * 31 + sym.charCodeAt(i)) % 900;
    const simPrice = 50 + (hash % 350) + 0.25;
    DOM.inputPrice.value = simPrice.toFixed(2);
    if (!DOM.inputName.value.trim()) DOM.inputName.value = `${sym} Corporation`;
    if (DOM.inputBuyPrice && !DOM.inputBuyPrice.value.trim()) DOM.inputBuyPrice.value = simPrice.toFixed(2);
    updateFormCalculationPreview();
    showToast('Quote Generated', `Real-time quote for ${sym}: ${formatCurrency(simPrice)}`, 'info');
  }
}

/**
 * Handle form submission: Add or Edit stock
 */
function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateStockInputs()) {
    return;
  }

  const symbol = DOM.inputSymbol.value.trim().toUpperCase();
  const name = DOM.inputName.value.trim();
  const price = parseFloat(DOM.inputPrice.value);
  const quantity = parseFloat(DOM.inputQty.value);
  const buyPriceIn = DOM.inputBuyPrice && DOM.inputBuyPrice.value.trim() !== ''
    ? parseFloat(DOM.inputBuyPrice.value)
    : price;
  const buyPrice = buyPriceIn > 0 ? buyPriceIn : price;
  const dividend = DOM.inputDividend && DOM.inputDividend.value.trim() !== ''
    ? Math.max(0, parseFloat(DOM.inputDividend.value) || 0)
    : 0;

  const investment = calculateStockInvestment(price, quantity);
  const costBasis = calculateStockCostBasis(buyPrice, quantity);
  const unrealizedPnl = Math.round((investment - costBasis) * 100) / 100;
  const returnPct = costBasis > 0 ? Math.round(((investment - costBasis) / costBasis) * 10000) / 100 : 0;

  if (portfolioState.editingStockId) {
    // Edit existing stock
    const index = portfolioState.stocks.findIndex(s => s.id === portfolioState.editingStockId);
    if (index !== -1) {
      portfolioState.stocks[index] = {
        ...portfolioState.stocks[index],
        symbol,
        name,
        price,
        buyPrice,
        quantity,
        dividend,
        investment,
        costBasis,
        unrealizedPnl,
        returnPct,
        updatedAt: Date.now()
      };
      savePortfolioToStorage();
      renderAll();
      showToast('Stock Updated', `Successfully updated details for ${symbol}.`, 'success');
      resetForm();
    }
  } else {
    // Check if position already exists in active portfolio; accumulate
    const existingIndex = portfolioState.stocks.findIndex(s => s.symbol === symbol);

    if (existingIndex !== -1) {
      const existing = portfolioState.stocks[existingIndex];
      const newTotalQty = existing.quantity + quantity;
      const weightedCost = (existing.costBasis || (existing.buyPrice * existing.quantity)) + costBasis;
      const newAvgBuyPrice = Math.round((weightedCost / newTotalQty) * 100) / 100;
      const newInvestment = calculateStockInvestment(price, newTotalQty);
      const newPnl = Math.round((newInvestment - weightedCost) * 100) / 100;
      const newReturn = weightedCost > 0 ? Math.round((newPnl / weightedCost) * 10000) / 100 : 0;

      portfolioState.stocks[existingIndex] = {
        ...existing,
        name: name,
        price: price,
        buyPrice: newAvgBuyPrice,
        quantity: newTotalQty,
        dividend: dividend > 0 ? dividend : (existing.dividend || 0),
        investment: newInvestment,
        costBasis: weightedCost,
        unrealizedPnl: newPnl,
        returnPct: newReturn,
        updatedAt: Date.now()
      };

      savePortfolioToStorage();
      renderAll();
      showToast('Position Increased', `Added ${formatQuantity(quantity)} shares to existing ${symbol} position.`, 'success');
      resetForm();
    } else {
      // Add brand new stock
      const newStock = {
        id: generateId(),
        symbol,
        name,
        price,
        buyPrice,
        quantity,
        dividend,
        investment,
        costBasis,
        unrealizedPnl,
        returnPct,
        createdAt: Date.now()
      };

      portfolioState.stocks.unshift(newStock);
      savePortfolioToStorage();
      renderAll();
      showToast('Stock Added', `${symbol} (${formatCurrency(investment)}) added to portfolio!`, 'success');
      resetForm();
    }
  }
}

/**
 * Switch form into Edit Mode for a chosen stock
 */
function enterEditMode(stockId) {
  const stock = portfolioState.stocks.find(s => s.id === stockId);
  if (!stock) return;

  portfolioState.editingStockId = stock.id;
  if (DOM.editingIdInput) DOM.editingIdInput.value = stock.id;

  // Fill form inputs
  DOM.inputSymbol.value = stock.symbol;
  DOM.inputName.value = stock.name;
  DOM.inputPrice.value = stock.price;
  DOM.inputQty.value = stock.quantity;
  if (DOM.inputBuyPrice) {
    DOM.inputBuyPrice.value = stock.buyPrice || stock.price;
  }
  if (DOM.inputDividend) {
    DOM.inputDividend.value = stock.dividend || '';
  }

  // Update UI indicators
  if (DOM.formTitle) DOM.formTitle.textContent = `Edit Stock (${stock.symbol})`;
  if (DOM.formSubtitle) DOM.formSubtitle.textContent = 'Update prices, shares, or dividend';
  if (DOM.btnSubmitText) DOM.btnSubmitText.textContent = 'Save Changes';
  if (DOM.formEditBadge) DOM.formEditBadge.style.display = 'inline-block';
  if (DOM.btnCancelEdit) DOM.btnCancelEdit.style.display = 'inline-flex';

  updateFormCalculationPreview();
  clearValidationErrors();

  if (DOM.inputPrice) DOM.inputPrice.focus();
}

/**
 * Reset form back to Add Stock Mode
 */
function resetForm() {
  portfolioState.editingStockId = null;
  if (DOM.editingIdInput) DOM.editingIdInput.value = '';
  if (DOM.form) DOM.form.reset();

  if (DOM.formTitle) DOM.formTitle.textContent = 'Add New Stock';
  if (DOM.formSubtitle) DOM.formSubtitle.textContent = 'Enter details to calculate investment';
  if (DOM.btnSubmitText) DOM.btnSubmitText.textContent = 'Add Stock';
  if (DOM.formEditBadge) DOM.formEditBadge.style.display = 'none';
  if (DOM.btnCancelEdit) DOM.btnCancelEdit.style.display = 'none';

  if (DOM.calcPreview) DOM.calcPreview.textContent = formatCurrency(0);
  if (DOM.calcPnlRow) DOM.calcPnlRow.style.display = 'none';

  clearValidationErrors();
}

/**
 * Apply sample preset pill values to form inputs
 */
function applySamplePreset(symbol, name, price) {
  DOM.inputSymbol.value = symbol;
  DOM.inputName.value = name;
  DOM.inputPrice.value = price;
  if (DOM.inputBuyPrice) {
    const catalogMatch = SAMPLE_STOCKS_CATALOG[symbol];
    DOM.inputBuyPrice.value = catalogMatch ? catalogMatch.buyPrice : price;
    if (DOM.inputDividend) {
      DOM.inputDividend.value = catalogMatch ? catalogMatch.dividend : '';
    }
  }
  if (!DOM.inputQty.value || parseFloat(DOM.inputQty.value) <= 0) {
    DOM.inputQty.value = 10;
  }
  clearValidationErrors();
  updateFormCalculationPreview();
  DOM.inputQty.focus();
  showToast('Preset Selected', `Loaded ${symbol} ($${price}) into form.`, 'info');
}

/* ==========================================================================
   9. Multi-Portfolio Modal & Management
   ========================================================================== */

function openCreatePortfolioModal() {
  if (!DOM.createPortfolioModal) return;
  DOM.createPortfolioModal.classList.add('open');
  if (DOM.newPortfolioName) {
    DOM.newPortfolioName.value = '';
    DOM.newPortfolioName.focus();
  }
  if (DOM.createPortfolioFeedback) DOM.createPortfolioFeedback.textContent = '';
}

function closeCreatePortfolioModal() {
  if (!DOM.createPortfolioModal) return;
  DOM.createPortfolioModal.classList.remove('open');
}

function handleCreatePortfolioSubmit(e) {
  e.preventDefault();
  const name = DOM.newPortfolioName.value.trim();
  if (!name) {
    if (DOM.createPortfolioFeedback) DOM.createPortfolioFeedback.textContent = 'Portfolio name is required.';
    return;
  }

  const id = 'port_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 4);
  const icons = ['💼', '📈', '🚀', '🎯', '💰', '🛡️', '⚡'];
  const icon = icons[Object.keys(portfolioState.portfolios).length % icons.length];

  portfolioState.portfolios[id] = {
    id,
    name,
    icon,
    stocks: []
  };
  portfolioState.activePortfolio = id;

  savePortfolioToStorage();
  closeCreatePortfolioModal();
  renderAll();
  showToast('Portfolio Created', `Created and activated portfolio: "${name}".`, 'success');
}

/* ==========================================================================
   10. Modal Confirmations (Delete & Clear All)
   ========================================================================== */

function openModal(title, message, confirmText, confirmClass, onConfirm) {
  if (!DOM.confirmModal) return;
  DOM.modalTitle.textContent = title;
  DOM.modalMessage.textContent = message;
  DOM.modalBtnConfirm.textContent = confirmText;
  DOM.modalBtnConfirm.className = `btn ${confirmClass}`;
  portfolioState.pendingDeleteAction = onConfirm;
  DOM.confirmModal.classList.add('open');
}

function closeModal() {
  if (DOM.confirmModal) DOM.confirmModal.classList.remove('open');
  portfolioState.pendingDeleteAction = null;
}

function handleConfirmModalAction() {
  if (typeof portfolioState.pendingDeleteAction === 'function') {
    portfolioState.pendingDeleteAction();
  }
  closeModal();
}

function promptDeleteStock(stockId, symbol) {
  portfolioState.pendingDeleteAction = () => {
    portfolioState.stocks = portfolioState.stocks.filter(s => s.id !== stockId);
    savePortfolioToStorage();
    renderAll();
    showToast('Stock Removed', `${symbol} was deleted from your portfolio.`, 'danger');

    if (portfolioState.editingStockId === stockId) {
      resetForm();
    }
  };

  openModal(
    'Delete Stock Holding',
    `Are you sure you want to remove ${symbol} from this portfolio? This action cannot be undone.`,
    'Delete Holding',
    'btn-danger',
    portfolioState.pendingDeleteAction
  );
}

function promptClearAllPortfolio() {
  if (portfolioState.stocks.length === 0) {
    showToast('Portfolio Empty', 'There are no stocks to clear.', 'info');
    return;
  }

  const activePort = portfolioState.portfolios[portfolioState.activePortfolio];
  const portName = activePort ? activePort.name : 'portfolio';

  openModal(
    'Clear Portfolio',
    `Are you sure you want to delete all ${portfolioState.stocks.length} holdings in "${portName}"?`,
    'Clear All Stocks',
    'btn-danger',
    () => {
      portfolioState.stocks = [];
      savePortfolioToStorage();
      resetForm();
      renderAll();
      showToast('Portfolio Cleared', `All stock holdings cleared from "${portName}".`, 'danger');
    }
  );
}

function loadSamplePortfolio() {
  portfolioState.stocks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_PORTFOLIO));
  savePortfolioToStorage();
  resetForm();
  renderAll();
  showToast('Sample Portfolio Loaded', 'Loaded AAPL, TSLA, GOOGL, and MSFT into your tracker.', 'success');
}

function toggleShortcutsModal(open = true) {
  if (!DOM.shortcutsModal) return;
  if (open) {
    DOM.shortcutsModal.classList.add('open');
  } else {
    DOM.shortcutsModal.classList.remove('open');
  }
}

/* ==========================================================================
   11. Data Import & Export (CSV, TXT, JSON)
   ========================================================================== */

function exportPortfolioToCSV() {
  const stocks = portfolioState.stocks;
  if (stocks.length === 0) {
    showToast('Export Notice', 'No stocks to export.', 'info');
    return;
  }

  const headers = ['Symbol', 'Company Name', 'Stock Price', 'Quantity', 'Purchase Price', 'Investment Value', 'Cost Basis', 'Unrealized PnL', 'Return %', 'Annual Dividend'];
  const rows = stocks.map(s => [
    `"${s.symbol}"`,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.price.toFixed(2),
    s.quantity,
    (s.buyPrice || s.price).toFixed(2),
    s.investment.toFixed(2),
    (s.costBasis || s.investment).toFixed(2),
    (s.unrealizedPnl || 0).toFixed(2),
    (s.returnPct || 0).toFixed(2),
    (s.dividend || 0).toFixed(2)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadFile(csvContent, `Stock_Portfolio_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  showToast('Export Complete', 'Exported portfolio holdings to CSV.', 'success');
}

function exportPortfolioToTXT() {
  const stocks = portfolioState.stocks;
  const summary = calculatePortfolioSummary();
  const dateStr = new Date().toLocaleString();

  const lines = [
    '================================================================================',
    '                   STOCK PORTFOLIO TRACKER - SUMMARY REPORT                      ',
    '                 CodeAlpha Python Programming Internship - Task 2                ',
    '================================================================================',
    `Generated On   : ${dateStr}`,
    `Portfolio Name : ${portfolioState.portfolios[portfolioState.activePortfolio]?.name || 'Main Portfolio'}`,
    `Total Holdings : ${summary.totalStocks}`,
    `Total Shares   : ${summary.totalShares}`,
    `Total Value    : ${formatCurrency(summary.totalInvestment)}`,
    `Cost Basis     : ${formatCurrency(summary.totalCostBasis)}`,
    `Unrealized P&L : ${summary.totalUnrealizedPnl >= 0 ? '+' : ''}${formatCurrency(summary.totalUnrealizedPnl)} (${summary.totalReturnPct.toFixed(2)}%)`,
    `Passive Income : ${formatCurrency(summary.totalDividendIncome)}/yr (Yield: ${summary.portfolioYieldPct.toFixed(2)}%)`,
    '--------------------------------------------------------------------------------',
    ' HOLDINGS BREAKDOWN:                                                            ',
    '--------------------------------------------------------------------------------'
  ];

  if (stocks.length === 0) {
    lines.push('  No holdings in this portfolio.');
  } else {
    lines.push(
      'SYMBOL'.padEnd(10) +
      'COMPANY'.padEnd(26) +
      'PRICE'.padEnd(12) +
      'SHARES'.padEnd(10) +
      'VALUE'.padEnd(14) +
      'P&L'.padEnd(12)
    );
    lines.push('-'.repeat(80));

    stocks.forEach(s => {
      const pnl = s.unrealizedPnl || 0;
      const pnlSign = pnl >= 0 ? '+' : '';
      lines.push(
        s.symbol.padEnd(10) +
        (s.name.length > 24 ? s.name.substring(0, 21) + '...' : s.name).padEnd(26) +
        formatCurrency(s.price).padEnd(12) +
        String(s.quantity).padEnd(10) +
        formatCurrency(s.investment).padEnd(14) +
        `${pnlSign}${formatCurrency(pnl)}`.padEnd(12)
      );
    });
  }

  lines.push('================================================================================');
  lines.push('Formula: Investment = Stock Price x Quantity | Total = Sum of all investments');
  lines.push('End of Report.');

  downloadFile(lines.join('\r\n'), `Stock_Portfolio_Report_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain;charset=utf-8;');
  showToast('Report Saved', 'Saved portfolio report as .txt file.', 'success');
}

function exportPortfolioToJSON() {
  const payload = {
    metadata: {
      app: 'Stock Portfolio Tracker Pro',
      version: '3.2',
      exportedAt: new Date().toISOString()
    },
    activePortfolio: portfolioState.activePortfolio,
    portfolios: portfolioState.portfolios
  };
  const jsonContent = JSON.stringify(payload, null, 2);
  downloadFile(jsonContent, `Portfolio_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;');
  showToast('Backup Created', 'Portfolio JSON backup downloaded.', 'success');
}

function importPortfolioFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.portfolios) {
        portfolioState.portfolios = parsed.portfolios;
        portfolioState.activePortfolio = parsed.activePortfolio || Object.keys(parsed.portfolios)[0] || 'main';
      } else if (Array.isArray(parsed)) {
        portfolioState.stocks = parsed;
      } else {
        throw new Error('Unrecognized JSON structure.');
      }
      savePortfolioToStorage();
      renderAll();
      showToast('Import Successful', 'Restored portfolios from backup file.', 'success');
    } catch (err) {
      console.error('Import error:', err);
      showToast('Import Failed', 'Invalid JSON backup file format.', 'danger');
    } finally {
      DOM.jsonFileInput.value = '';
    }
  };
  reader.readAsText(file);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printExecutiveReport() {
  const dateEl = document.getElementById('print-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleString();
  }
  window.print();
}

/* ==========================================================================
   12. Toast Notification System
   ========================================================================== */
function showToast(title, message, type = 'success') {
  if (!DOM.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `
    <span class="toast-icon">${iconSvg}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-msg">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  DOM.toastContainer.appendChild(toast);

  const closeToast = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  };

  toast.querySelector('.toast-close').addEventListener('click', closeToast);
  setTimeout(closeToast, 4000);
}

/* ==========================================================================
   13. Event Listeners & Keyboard Shortcuts
   ========================================================================== */
function setupEventListeners() {
  // Form submission
  if (DOM.form) DOM.form.addEventListener('submit', handleFormSubmit);

  // Live Quote Fetch
  if (DOM.btnFetchLiveQuote) {
    DOM.btnFetchLiveQuote.addEventListener('click', () => {
      fetchLiveQuote(DOM.inputSymbol.value);
    });
  }

  // Create Portfolio Modal
  if (DOM.btnCreatePortfolio) DOM.btnCreatePortfolio.addEventListener('click', openCreatePortfolioModal);
  if (DOM.createPortfolioForm) DOM.createPortfolioForm.addEventListener('submit', handleCreatePortfolioSubmit);
  if (DOM.createPortfolioCancel) DOM.createPortfolioCancel.addEventListener('click', closeCreatePortfolioModal);
  if (DOM.createPortfolioCloseBtn) DOM.createPortfolioCloseBtn.addEventListener('click', closeCreatePortfolioModal);
  if (DOM.createPortfolioModal) {
    DOM.createPortfolioModal.addEventListener('click', (e) => {
      if (e.target === DOM.createPortfolioModal) closeCreatePortfolioModal();
    });
  }

  // Reset & Cancel Edit buttons
  if (DOM.btnResetForm) DOM.btnResetForm.addEventListener('click', resetForm);
  if (DOM.btnCancelEdit) DOM.btnCancelEdit.addEventListener('click', resetForm);

  // Live calculation preview on input change
  if (DOM.inputPrice) DOM.inputPrice.addEventListener('input', updateFormCalculationPreview);
  if (DOM.inputQty) DOM.inputQty.addEventListener('input', updateFormCalculationPreview);
  if (DOM.inputBuyPrice) DOM.inputBuyPrice.addEventListener('input', updateFormCalculationPreview);
  if (DOM.inputDividend) DOM.inputDividend.addEventListener('input', updateFormCalculationPreview);

  // Auto-uppercase symbol input and check dictionary match for quick autofill
  if (DOM.inputSymbol) {
    DOM.inputSymbol.addEventListener('input', (e) => {
      const sym = e.target.value.toUpperCase();
      e.target.value = sym;

      if (SAMPLE_STOCKS_CATALOG[sym]) {
        const match = SAMPLE_STOCKS_CATALOG[sym];
        if (!DOM.inputName.value.trim()) DOM.inputName.value = match.name;
        if (!DOM.inputPrice.value) {
          DOM.inputPrice.value = match.price;
          if (DOM.inputBuyPrice) DOM.inputBuyPrice.value = match.buyPrice;
          if (DOM.inputDividend && match.dividend) DOM.inputDividend.value = match.dividend;
          updateFormCalculationPreview();
        }
      }
    });
  }

  // Sample preset pill clicks
  DOM.presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const sym = pill.getAttribute('data-symbol');
      const name = pill.getAttribute('data-name');
      const price = parseFloat(pill.getAttribute('data-price'));
      applySamplePreset(sym, name, price);
    });
  });

  // Currency select change
  if (DOM.currencySelect) {
    DOM.currencySelect.addEventListener('change', (e) => {
      portfolioState.currency = e.target.value;
      const curr = CURRENCIES[portfolioState.currency] || CURRENCIES.USD;
      if (DOM.formCurrencySymbol1) DOM.formCurrencySymbol1.textContent = curr.symbol;
      if (DOM.formCurrencySymbol2) DOM.formCurrencySymbol2.textContent = curr.symbol;
      if (DOM.formCurrencySymbol3) DOM.formCurrencySymbol3.textContent = curr.symbol;
      savePortfolioToStorage();
      renderAll();
      showToast('Currency Updated', `Display currency changed to ${portfolioState.currency}.`, 'info');
    });
  }

  // Table action buttons (delegated for Edit and Delete)
  if (DOM.tableBody) {
    DOM.tableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.action-btn-edit');
      const deleteBtn = e.target.closest('.action-btn-delete');

      if (editBtn) {
        const stockId = editBtn.getAttribute('data-id');
        enterEditMode(stockId);
      } else if (deleteBtn) {
        const stockId = deleteBtn.getAttribute('data-id');
        const symbol = deleteBtn.getAttribute('data-symbol');
        promptDeleteStock(stockId, symbol);
      }
    });
  }

  // Search input live filtering
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      portfolioState.searchTerm = e.target.value;
      if (DOM.searchClearBtn) DOM.searchClearBtn.style.display = portfolioState.searchTerm ? 'flex' : 'none';
      renderStockTable();
    });
  }

  // Search clear button
  if (DOM.searchClearBtn) {
    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      portfolioState.searchTerm = '';
      DOM.searchClearBtn.style.display = 'none';
      DOM.searchInput.focus();
      renderStockTable();
    });
  }

  // Sort dropdown
  if (DOM.sortSelect) {
    DOM.sortSelect.addEventListener('change', (e) => {
      portfolioState.sortBy = e.target.value;
      renderStockTable();
    });
  }

  // Pro Action Buttons
  if (DOM.btnLoadSample) DOM.btnLoadSample.addEventListener('click', loadSamplePortfolio);
  if (DOM.btnEmptyLoadSample) DOM.btnEmptyLoadSample.addEventListener('click', loadSamplePortfolio);
  if (DOM.btnClearAll) DOM.btnClearAll.addEventListener('click', promptClearAllPortfolio);
  if (DOM.btnExportCsv) DOM.btnExportCsv.addEventListener('click', exportPortfolioToCSV);
  if (DOM.btnExportTxt) DOM.btnExportTxt.addEventListener('click', exportPortfolioToTXT);
  if (DOM.btnExportJson) DOM.btnExportJson.addEventListener('click', exportPortfolioToJSON);
  if (DOM.btnImportJsonTrigger) DOM.btnImportJsonTrigger.addEventListener('click', () => DOM.jsonFileInput.click());
  if (DOM.jsonFileInput) DOM.jsonFileInput.addEventListener('change', importPortfolioFromJSON);
  if (DOM.btnPrintReport) DOM.btnPrintReport.addEventListener('click', printExecutiveReport);

  // Confirmation Modal buttons
  if (DOM.modalBtnConfirm) DOM.modalBtnConfirm.addEventListener('click', handleConfirmModalAction);
  if (DOM.modalBtnCancel) DOM.modalBtnCancel.addEventListener('click', closeModal);
  if (DOM.confirmModal) {
    DOM.confirmModal.addEventListener('click', (e) => {
      if (e.target === DOM.confirmModal) closeModal();
    });
  }

  // Shortcuts Modal buttons
  if (DOM.btnShortcutsHelp) DOM.btnShortcutsHelp.addEventListener('click', () => toggleShortcutsModal(true));
  if (DOM.shortcutsCloseBtn) DOM.shortcutsCloseBtn.addEventListener('click', () => toggleShortcutsModal(false));
  if (DOM.shortcutsModal) {
    DOM.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === DOM.shortcutsModal) toggleShortcutsModal(false);
    });
  }

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.confirmModal && DOM.confirmModal.classList.contains('open')) closeModal();
      if (DOM.shortcutsModal && DOM.shortcutsModal.classList.contains('open')) toggleShortcutsModal(false);
      if (DOM.createPortfolioModal && DOM.createPortfolioModal.classList.contains('open')) closeCreatePortfolioModal();
      if (portfolioState.editingStockId) resetForm();
      return;
    }

    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

    if (!isInputActive) {
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        if (DOM.searchInput) DOM.searchInput.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (DOM.inputSymbol) DOM.inputSymbol.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        toggleShortcutsModal(true);
      }
    }
  });

  // Setup Performance Chart Hover & Timeframe
  setupChartInteractivity();
}

/* ==========================================================================
   14. Application Initialization & PWA Service Worker
   ========================================================================== */
function initApp() {
  loadPortfolioFromStorage();

  // Set currency symbols
  const curr = CURRENCIES[portfolioState.currency] || CURRENCIES.USD;
  if (DOM.formCurrencySymbol1) DOM.formCurrencySymbol1.textContent = curr.symbol;
  if (DOM.formCurrencySymbol2) DOM.formCurrencySymbol2.textContent = curr.symbol;
  if (DOM.formCurrencySymbol3) DOM.formCurrencySymbol3.textContent = curr.symbol;

  setupEventListeners();
  renderAll();

  // Handle window resize for dynamic canvas redraws
  window.addEventListener('resize', () => {
    renderPerformanceChart();
    renderDonutChart();
  });

  // Progressive Web App (PWA) Offline Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('Stock Portfolio PWA Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.log('PWA Service Worker offline caching skipped:', err);
      });
    });
  }

  console.log('Stock Portfolio Tracker (Institutional Fintech Edition) initialized.');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
