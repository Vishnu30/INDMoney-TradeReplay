let currentTab = "replay";
let chart;

const ctx = () => {
  const el = document.getElementById("main-chart");
  return el ? el.getContext("2d") : null;
};

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  switchTab("replay");
});

function bindTabs() {
  document.querySelectorAll("#main-tabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#main-tabs .tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  renderControlPanel();
  renderInsightPanel();
  renderMiniTools();
  renderNudgePanel();
  const { labels, series } = generateInitialSeries();
  renderChart(labels, series);
  renderMetrics(series);
}

/* Layout sections */

function renderControlPanel() {
  const el = document.getElementById("control-panel");
  if (!el) return;
  if (currentTab === "replay") {
    el.innerHTML = replayControls();
    bindReplay();
  } else if (currentTab === "compare") {
    el.innerHTML = compareControls();
    bindCompare();
  } else if (currentTab === "stress") {
    el.innerHTML = stressControls();
    bindStress();
  } else if (currentTab === "dca") {
    el.innerHTML = dcaControls();
    bindDca();
  }
}

function renderInsightPanel() {
  const el = document.getElementById("insight-panel");
  if (!el) return;
  if (currentTab === "replay") {
    el.innerHTML = `
      <h2>Replay a simple US stock trade</h2>
      <p>
        Pick a rough market regime and notional size. The replay engine builds a stylised price path, then we compute
        return, drawdown and volatility. In production this would plug into real OHLC data.
      </p>
    `;
  } else if (currentTab === "compare") {
    el.innerHTML = `
      <h2>Lump sum vs SIP for the same stock</h2>
      <p>
        Many first‑time investors hesitate between &quot;go all in&quot; vs &quot;spread it out&quot;. This pane lets them
        see how a normalised lump sum behaves versus a monthly dollar‑cost‑averaging path.
      </p>
    `;
  } else if (currentTab === "stress") {
    el.innerHTML = `
      <h2>Stress test drawdowns and recoveries</h2>
      <p>
        Simulate crisis‑style crashes (COVID, 2022 tech sell‑off, flash crash) to set expectations on depth and
        duration of drawdowns. This makes users less likely to panic sell in real downturns.
      </p>
    `;
  } else if (currentTab === "dca") {
    el.innerHTML = `
      <h2>Visualise dollar‑cost averaging</h2>
      <p>
        The DCA view tracks how average cost evolves when you invest the same amount every month. For INDMoney this can
        map directly into US stock SIPs and recurring INR→USD conversions.
      </p>
    `;
  }
}

function renderMiniTools() {
  const el = document.getElementById("mini-tools");
  if (!el) return;
  if (currentTab === "replay") {
    el.innerHTML = `
      <h3>Quick what‑ifs</h3>
      <ul class="tool-list">
        <li>• &quot;What if I sold after the first +15% upswing?&quot;</li>
        <li>• &quot;Show the worst 3‑step streak in this replay.&quot;</li>
        <li>• &quot;Highlight the lowest point from which the trade still ended positive.&quot;</li>
      </ul>
    `;
  } else if (currentTab === "compare") {
    el.innerHTML = `
      <h3>Strategy presets</h3>
      <ul class="tool-list">
        <li>• 3‑year NVDA: lump sum vs \$200/month.</li>
        <li>• Aggressive vs conservative SIP schedules.</li>
        <li>• &quot;Stay invested&quot; vs &quot;try to time bottoms&quot;.</li>
      </ul>
    `;
  } else if (currentTab === "stress") {
    el.innerHTML = `
      <h3>Scenario ideas</h3>
      <ul class="tool-list">
        <li>• COVID‑style crash followed by fast rebound.</li>
        <li>• Prolonged grind down in growth stocks.</li>
        <li>• Single‑day flash crash and recovery.</li>
      </ul>
    `;
  } else if (currentTab === "dca") {
    el.innerHTML = `
      <h3>DCA scenarios</h3>
      <ul class="tool-list">
        <li>• ₹10,000/month into NASDAQ for 5 years.</li>
        <li>• Missing the &quot;best 10 days&quot; vs never timing.</li>
        <li>• Short 18‑month vs long 7‑year DCA horizons.</li>
      </ul>
    `;
  }
}

function renderNudgePanel() {
  const el = document.getElementById("nudge-panel");
  if (!el) return;
  let html = "<h3>How this could move business metrics</h3>";
  if (currentTab === "replay") {
    html += `
      <p>
        • Converts curious app visitors into confident first‑time traders.<br/>
        • Encourages small test trades, increasing funded USD wallets.<br/>
        • Reduces fear of volatility by showing realistic drawdowns.
      </p>`;
  } else if (currentTab === "compare") {
    html += `
      <p>
        • Helps users pick a strategy they can stick with.<br/>
        • Direct on‑ramp into US stock SIP flows (recurring revenue).<br/>
        • Segments users by style for better personalisation.
      </p>`;
  } else if (currentTab === "stress") {
    html += `
      <p>
        • Reduces panic exits during real crashes.<br/>
        • Supports a long‑term, stay‑invested behaviour pattern.<br/>
        • Protects AUM and improves lifetime value of serious investors.
      </p>`;
  } else if (currentTab === "dca") {
    html += `
      <p>
        • Positions recurring SIPs as default way to enter US markets.<br/>
        • Drives predictable INR→USD flows and stable wallet balances.<br/>
        • Makes &quot;doing nothing but sticking to plan&quot; feel smart.
      </p>`;
  }
  el.innerHTML = html;
}

/* Controls + binding */

function replayControls() {
  return `
    <h2>Replay a Trade</h2>
    <p>Choose a regime and notional; we build a stylised path to illustrate risk and payoff.</p>
    <div class="field-row">
      <div class="field">
        <label>Market regime</label>
        <select id="replay-regime">
          <option value="trend">Steady uptrend</option>
          <option value="volatile">High volatility</option>
          <option value="choppy">Sideways / choppy</option>
          <option value="drawdown">Sharp drawdown then recovery</option>
        </select>
      </div>
      <div class="field">
        <label>Notional size (USD)</label>
        <input id="replay-notional" type="number" min="100" value="1000" />
      </div>
    </div>
    <div class="chip-row">
      <button class="chip primary" data-preset="calm">Calm tech stock</button>
      <button class="chip" data-preset="roller">High‑beta &quot;rollercoaster&quot;</button>
      <button class="chip" data-preset="crash">Crash + recovery</button>
    </div>
    <div class="btn-row">
      <button class="btn" id="replay-random">Randomise</button>
      <button class="btn primary" id="replay-run">Replay trade</button>
    </div>
  `;
}

function bindReplay() {
  document.querySelectorAll("#control-panel .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const regimeSel = document.getElementById("replay-regime");
      if (!regimeSel) return;
      if (chip.dataset.preset === "calm") regimeSel.value = "trend";
      if (chip.dataset.preset === "roller") regimeSel.value = "volatile";
      if (chip.dataset.preset === "crash") regimeSel.value = "drawdown";
    });
  });
  document.getElementById("replay-random").addEventListener("click", () => {
    const { labels, series } = generateRandomSeries();
    renderChart(labels, series);
    renderMetrics(series);
  });
  document.getElementById("replay-run").addEventListener("click", () => {
    const regime = document.getElementById("replay-regime").value;
    const { labels, series } = generateRegimeSeries(regime);
    renderChart(labels, series);
    renderMetrics(series);
  });
}

function compareControls() {
  return `
    <h2>Compare strategies</h2>
    <p>Normalised view of a one‑time lump sum vs a monthly SIP for the same underlying.</p>
    <div class="field-row">
      <div class="field">
        <label>Horizon (years)</label>
        <input id="cmp-years" type="number" min="1" max="10" value="3" />
      </div>
      <div class="field">
        <label>Relative aggression</label>
        <select id="cmp-style">
          <option value="balanced">Balanced</option>
          <option value="volatile">More volatility</option>
        </select>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn primary" id="cmp-run">Run comparison</button>
    </div>
  `;
}

function bindCompare() {
  document.getElementById("cmp-run").addEventListener("click", () => {
    const years = parseInt(document.getElementById("cmp-years").value || "3", 10);
    const style = document.getElementById("cmp-style").value;
    const { labels, series } = generateDcaVsLump(years, style);
    renderChart(labels, series);
    renderMetrics(series);
  });
}

function stressControls() {
  return `
    <h2>Market stress test</h2>
    <p>Simulate different crisis shapes to teach users how deep drawdowns can go.</p>
    <div class="field-row">
      <div class="field">
        <label>Scenario</label>
        <select id="stress-scenario">
          <option value="covid">COVID‑style crash</option>
          <option value="techbear">2022 tech bear</option>
          <option value="flash">Flash crash</option>
        </select>
      </div>
      <div class="field">
        <label>Risk appetite</label>
        <select id="stress-risk">
          <option value="moderate">Moderate</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn primary" id="stress-run">Run stress test</button>
    </div>
  `;
}

function bindStress() {
  document.getElementById("stress-run").addEventListener("click", () => {
    const scenario = document.getElementById("stress-scenario").value;
    const risk = document.getElementById("stress-risk").value;
    const { labels, series } = generateStress(scenario, risk);
    renderChart(labels, series);
    renderMetrics(series);
  });
}

function dcaControls() {
  return `
    <h2>DCA visualiser</h2>
    <p>Plot how average entry cost moves as you invest the same amount every month.</p>
    <div class="field-row">
      <div class="field">
        <label>Duration (years)</label>
        <input id="dca-years" type="number" min="1" max="10" value="3" />
      </div>
      <div class="field">
        <label>Volatility profile</label>
        <select id="dca-vol">
          <option value="calm">Calm</option>
          <option value="normal">Normal</option>
          <option value="stormy">Stormy</option>
        </select>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn primary" id="dca-run">Simulate DCA</button>
    </div>
  `;
}

function bindDca() {
  document.getElementById("dca-run").addEventListener("click", () => {
    const years = parseInt(document.getElementById("dca-years").value || "3", 10);
    const vol = document.getElementById("dca-vol").value;
    const { labels, series } = generateDcaCost(years, vol);
    renderChart(labels, series);
    renderMetrics(series);
  });
}

/* Chart + metrics */

function renderChart(labels, series) {
  const context = ctx();
  if (!context) return;
  if (chart) chart.destroy();
  chart = new Chart(context, {
    type: "line",
    data: {
      labels,
      datasets: series.map((s) => ({
        label: s.label,
        data: s.values,
        borderColor: s.color,
        borderWidth: 1.7,
        tension: 0.3,
        fill: false,
        pointRadius: 0,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
            font: { size: 10 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#9ca3af", maxTicksLimit: 6 },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#9ca3af", maxTicksLimit: 5 },
          grid: { color: "rgba(148,163,184,0.3)" },
        },
      },
    },
  });
}

function renderMetrics(series) {
  const el = document.getElementById("metrics-grid");
  if (!el || !series || !series.length) return;
  const primary = series[0].values;
  if (!primary.length) return;

  const start = primary[0];
  const end = primary[primary.length - 1];
  const ret = ((end - start) / start) * 100;
  const max = Math.max(...primary);
  const min = Math.min(...primary);
  const dd = ((min - max) / max) * 100;
  const vol = estimateVol(primary);

  const tiles = [
    {
      label: "Simulated return",
      value: `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%`,
      tag: ret >= 0 ? "Trade would have ended in profit" : "Trade would have ended in loss",
    },
    {
      label: "Worst drawdown",
      value: `${dd.toFixed(1)}%`,
      tag: "Peak‑to‑trough fall in this path",
    },
    {
      label: "Approx. volatility",
      value: `${vol.toFixed(1)}%`,
      tag: "Rough daily swing estimate in this replay",
    },
  ];

  if (series.length > 1) {
    tiles.push({
      label: "Strategies compared",
      value: `${series[0].label} vs ${series[1].label}`,
      tag: "Shape of curves hints which style is smoother",
    });
  } else {
    tiles.push({
      label: "Steps in replay",
      value: `${primary.length}`,
      tag: "Could be mapped to real days/weeks in production",
    });
  }

  el.innerHTML = tiles
    .map(
      (t) => `
      <div class="metric-tile">
        <div class="metric-label">${t.label}</div>
        <div class="metric-value">${t.value}</div>
        <div class="metric-tag">${t.tag}</div>
      </div>`
    )
    .join("");
}

function estimateVol(arr) {
  if (!arr || arr.length < 2) return 0;
  const rets = [];
  for (let i = 1; i < arr.length; i++) {
    rets.push((arr[i] - arr[i - 1]) / arr[i - 1]);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rets.length;
  return Math.sqrt(variance) * 100;
}

/* Mock series generators */

function generateInitialSeries() {
  return generateRegimeSeries("trend");
}

function generateRandomSeries() {
  const regimes = ["trend", "volatile", "choppy", "drawdown"];
  const pick = regimes[Math.floor(Math.random() * regimes.length)];
  return generateRegimeSeries(pick);
}

function generateRegimeSeries(regime) {
  const len = 40;
  const labels = Array.from({ length: len }, (_, i) => "Step " + (i + 1));
  const values = [];
  let price = 100;
  for (let i = 0; i < len; i++) {
    let drift = 0.1;
    let vol = 0.8;
    if (regime === "trend") {
      drift = 0.35;
      vol = 0.5;
    } else if (regime === "volatile") {
      drift = 0.2;
      vol = 1.5;
    } else if (regime === "choppy") {
      drift = 0.02;
      vol = 0.9;
    } else if (regime === "drawdown") {
      if (i < 10) drift = 0.2;
      else if (i < 20) drift = -1.8;
      else drift = 0.6;
      vol = 1.1;
    }
    const shock = (Math.random() - 0.5) * vol;
    price = price * (1 + (drift + shock) / 100);
    values.push(parseFloat(price.toFixed(2)));
  }
  return {
    labels,
    series: [{ label: "Simulated path", values, color: "#4ade80" }],
  };
}

function generateDcaVsLump(years, style) {
  const steps = years * 12;
  const labels = Array.from({ length: steps }, (_, i) => "M" + (i + 1));
  let price = 100;
  const lump = [];
  const dca = [];
  let dcaUnits = 0;
  let totalInvested = 0;
  const volMul = style === "volatile" ? 1.6 : 1.0;

  for (let i = 0; i < steps; i++) {
    const drift = 0.08 / 12;
    const vol = 0.12 * volMul;
    const shock = (Math.random() - 0.5) * vol;
    price = price * (1 + drift + shock);
    lump.push(price);
    const monthly = 1;
    totalInvested += monthly;
    dcaUnits += monthly / price;
    dca.push(dcaUnits * price);
  }
  return {
    labels,
    series: [
      { label: "Lump sum (normalised)", values: lump, color: "#38bdf8" },
      { label: "DCA (normalised)", values: dca, color: "#a855f7" },
    ],
  };
}

function generateStress(scenario, risk) {
  const len = 40;
  const labels = Array.from({ length: len }, (_, i) => "Step " + (i + 1));
  const values = [];
  let price = 100;
  const riskMul = risk === "aggressive" ? 1.4 : 1.0;

  for (let i = 0; i < len; i++) {
    let drift = 0;
    if (scenario === "covid") {
      if (i < 8) drift = 0.1;
      else if (i < 16) drift = -2.5;
      else drift = 0.9;
    } else if (scenario === "techbear") {
      if (i < 5) drift = 0.2;
      else if (i < 25) drift = -1.1;
      else drift = 0.3;
    } else if (scenario === "flash") {
      if (i === 12) drift = -8;
      else if (i > 12 && i < 20) drift = 1.7;
      else drift = 0.1;
    }
    const vol = 1.2 * riskMul;
    const shock = (Math.random() - 0.5) * vol;
    price = price * (1 + (drift + shock) / 100);
    values.push(parseFloat(price.toFixed(2)));
  }
  return { labels, series: [{ label: "Stress scenario path", values, color: "#fb7185" }] };
}

function generateDcaCost(years, volProfile) {
  const steps = years * 12;
  const labels = Array.from({ length: steps }, (_, i) => "M" + (i + 1));
  let price = 100;
  const avgCost = [];
  let totalUnits = 0;
  let totalInvest = 0;
  let volMul = 1;
  if (volProfile === "calm") volMul = 0.6;
  if (volProfile === "stormy") volMul = 1.6;

  for (let i = 0; i < steps; i++) {
    const drift = 0.06 / 12;
    const vol = 0.16 * volMul;
    const shock = (Math.random() - 0.5) * vol;
    price = price * (1 + drift + shock);
    const invest = 1;
    totalInvest += invest;
    totalUnits += invest / price;
    avgCost.push(totalInvest / totalUnits);
  }
  return {
    labels,
    series: [{ label: "Average cost (normalised)", values: avgCost, color: "#4ade80" }],
  };
}
