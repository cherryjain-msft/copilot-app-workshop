// Builds Ford-GitHub-Copilot-Whats-New.pptx
// Run: cd deck && npm install && node build-deck.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const C = {
  dark: "0B1426",
  navy: "003478",
  blue: "1F6FEB",
  violet: "7C3AED",
  violetLight: "EDE9FE",
  cyan: "22D3EE",
  green: "16A34A",
  amber: "D97706",
  amberLight: "FEF3C7",
  ink: "0F172A",
  body: "334155",
  muted: "64748B",
  bg: "F8FAFC",
  card: "FFFFFF",
  border: "E2E8F0",
  white: "FFFFFF",
};
const FONT = "Segoe UI";
const HFONT = "Segoe UI Semibold";
const MONO = "Consolas";
const FOOTER = "Ford × GitHub  |  What's new in GitHub Copilot";

const iconCache = {};
async function icon(name, color = C.white) {
  const key = `${name}-${color}`;
  if (iconCache[key]) return iconCache[key];
  const Comp = fa[name];
  if (!Comp) throw new Error(`Missing icon: ${name}`);
  const svg = renderToStaticMarkup(React.createElement(Comp, { color: `#${color}`, size: "256" }));
  const png = await sharp(Buffer.from(svg))
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  iconCache[key] = `image/png;base64,${png.toString("base64")}`;
  return iconCache[key];
}

const shadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.1 });

function loadClaimsBySegment() {
  const csvPath = path.join(__dirname, "..", "demo-assets", "excel", "warranty-claims.csv");
  const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const segIdx = header.indexOf("Vehicle Segment");
  const claimIdx = header.indexOf("Claims");
  const totals = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    totals[cols[segIdx]] = (totals[cols[segIdx]] || 0) + Number(cols[claimIdx]);
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
  pres.author = "Cherry Jain";
  pres.company = "GitHub";
  pres.title = "What's new in GitHub Copilot — Ford session";

  let slideNo = 0;

  function lightSlide() {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    slideNo += 1;
    return s;
  }

  function title(s, text, sub) {
    s.addText(text, {
      x: 0.5, y: 0.28, w: 7.3, h: 0.7, fontFace: HFONT, fontSize: 32, color: C.ink, margin: 0, valign: "middle",
    });
    if (sub) {
      s.addText(sub, {
        x: 0.5, y: 0.98, w: 9.0, h: 0.38, fontFace: FONT, fontSize: 15, color: C.muted, margin: 0, valign: "top",
      });
    }
  }

  function footer(s, text = FOOTER) {
    s.addText(text, { x: 0.5, y: 5.24, w: 8.2, h: 0.25, fontFace: FONT, fontSize: 9, color: C.muted, margin: 0 });
    s.addText(String(slideNo), {
      x: 8.9, y: 5.24, w: 0.6, h: 0.25, fontFace: FONT, fontSize: 9, color: C.muted, align: "right", margin: 0,
    });
  }

  function badge(s, text, color) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 7.85, y: 0.43, w: 1.65, h: 0.36, rectRadius: 0.18, fill: { color }, line: { color },
    });
    s.addText(text, {
      x: 7.85, y: 0.43, w: 1.65, h: 0.36, fontFace: HFONT, fontSize: 10.5, color: C.white, align: "center",
      valign: "middle", margin: 0,
    });
  }

  function card(s, x, y, w, h, fill = C.card) {
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: C.border, width: 0.75 }, shadow: shadow() });
  }

  async function iconCircle(s, x, y, d, iconName, bg, fg = C.white) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg } });
    const pad = d * 0.25;
    s.addImage({ data: await icon(iconName, fg), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
  }

  function arrow(s, x1, y1, x2, y2, color = C.muted, width = 1.5) {
    const flipH = (x2 - x1) * (y2 - y1) < 0;
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2), maxY = Math.max(y1, y2);
    // A line shape runs (minX,minY)->(maxX,maxY), or (maxX,minY)->(minX,maxY) when flipped.
    const headAtEnd = flipH ? (x2 === minX && y2 === maxY) : (x2 === maxX && y2 === maxY);
    s.addShape(pres.shapes.LINE, {
      x: minX, y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH,
      line: { color, width, ...(headAtEnd ? { endArrowType: "triangle" } : { beginArrowType: "triangle" }) },
    });
  }

  function line(s, x1, y1, x2, y2, color = C.border, width = 1.5) {
    const flipH = (x2 - x1) * (y2 - y1) < 0;
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH,
      line: { color, width },
    });
  }

  // ---------------------------------------------------------------- 1. Title
  {
    const s = pres.addSlide();
    slideNo += 1;
    s.background = { color: C.dark };
    s.addText("FORD  ×  GITHUB   ·   NOVEMBER 2026", {
      x: 0.6, y: 0.85, w: 5.4, h: 0.35, fontFace: HFONT, fontSize: 12, color: C.cyan, charSpacing: 2, margin: 0,
    });
    s.addText("What's new in\nGitHub Copilot", {
      x: 0.6, y: 1.3, w: 5.4, h: 1.65, fontFace: HFONT, fontSize: 44, color: C.white, margin: 0, valign: "top",
    });
    s.addText("From AI pair programmer to agent-first software delivery", {
      x: 0.6, y: 3.05, w: 5.0, h: 0.75, fontFace: FONT, fontSize: 18, color: "CBD5E1", margin: 0, valign: "top",
    });
    s.addText("Beginner → intermediate   ·   ~75 minutes   ·   Live demos", {
      x: 0.6, y: 3.95, w: 5.4, h: 0.3, fontFace: FONT, fontSize: 13, color: "94A3B8", margin: 0,
    });
    s.addText("Presented by Cherry Jain", {
      x: 0.6, y: 4.6, w: 5.0, h: 0.3, fontFace: HFONT, fontSize: 13, color: C.white, margin: 0,
    });
    // Orbit visual
    const cx = 7.8, cy = 2.75, R = 1.8;
    s.addShape(pres.shapes.OVAL, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, fill: { color: C.navy }, line: { color: "1E3A8A", width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: cx - 1.15, y: cy - 1.15, w: 2.3, h: 2.3, fill: { color: C.violet }, line: { color: C.violet } });
    s.addImage({ data: await icon("FaGithub", C.white), x: cx - 0.65, y: cy - 0.65, w: 1.3, h: 1.3 });
    const orbit = [
      ["FaPlug", 225], ["FaTableColumns", 315], ["FaBolt", 45], ["FaClock", 135],
    ];
    for (const [ic, deg] of orbit) {
      const rad = (deg * Math.PI) / 180;
      const ox = cx + R * Math.cos(rad) - 0.36;
      const oy = cy - R * Math.sin(rad) - 0.36;
      s.addShape(pres.shapes.OVAL, { x: ox, y: oy, w: 0.72, h: 0.72, fill: { color: C.dark }, line: { color: C.cyan, width: 1.5 } });
      s.addImage({ data: await icon(ic, C.cyan), x: ox + 0.2, y: oy + 0.2, w: 0.32, h: 0.32 });
    }
    s.addNotes(
      "Welcome everyone. Today is a beginner-to-intermediate tour of what's new in GitHub Copilot, announced between Build and Universe 2026.\n" +
      "The big idea: Copilot has moved from suggesting code to completing work. We'll see the new Copilot app, connectors and canvases, Copilot Fusion, a live Jira + Figma demo, Excel for business users, and automations. We'll leave 10 minutes for Q&A.\n" +
      "Ask: 'Quick show of hands — who uses Copilot daily today? Who has tried agent mode or the coding agent?' Use the answers to calibrate depth."
    );
  }

  // ---------------------------------------------------------------- 2. Agenda
  {
    const s = lightSlide();
    title(s, "Today's agenda", "Concepts first, then live demos you can repeat on your own");
    const items = [
      ["What is the Copilot app?", "10 min", C.navy],
      ["The agent-first shift", "5 min", C.navy],
      ["Connectors & canvases", "10 min", C.blue],
      ["Copilot Fusion & 30% offer", "8 min", C.blue],
      ["Demo: Jira + Figma → PR", "15 min", C.violet],
      ["Excel for business users", "8 min", C.violet],
      ["Automations", "9 min", C.green],
      ["Q&A", "10 min", C.green],
    ];
    for (let i = 0; i < items.length; i++) {
      const col = Math.floor(i / 4);
      const row = i % 4;
      const x = 0.5 + col * 4.6;
      const y = 1.55 + row * 0.88;
      card(s, x, y, 4.4, 0.74);
      s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.12, w: 0.5, h: 0.5, fill: { color: items[i][2] }, line: { color: items[i][2] } });
      s.addText(String(i + 1), { x: x + 0.15, y: y + 0.12, w: 0.5, h: 0.5, fontFace: HFONT, fontSize: 16, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addText(items[i][0], { x: x + 0.8, y: y + 0.12, w: 2.75, h: 0.5, fontFace: HFONT, fontSize: 15, color: C.ink, valign: "middle", margin: 0 });
      s.addText(items[i][1], { x: x + 3.5, y: y + 0.12, w: 0.75, h: 0.5, fontFace: FONT, fontSize: 12, color: C.muted, align: "right", valign: "middle", margin: 0 });
    }
    footer(s);
    s.addNotes(
      "Roughly 75 minutes. The first half builds vocabulary — app, agents, connectors, canvases, Fusion. The second half is demos: Jira + Figma to a pull request, Excel for business users, and automations.\n" +
      "Everything shown is in the session repo so teams can repeat the demos afterwards. Several features are in public preview — I'll call that out as we go."
    );
  }

  // ---------------------------------------------------------------- 3. Evolution
  {
    const s = lightSlide();
    title(s, "From code to completed work", "How the way we work with Copilot has changed");
    const stages = [
      ["2021–22", "Code completion", "You type. Copilot suggests the next lines.", "FaKeyboard"],
      ["2023", "Chat", "You ask. Copilot explains, fixes and generates.", "FaComments"],
      ["2025", "Coding agent", "You assign an issue. Copilot opens a pull request.", "FaRobot"],
      ["2026", "Agent-first", "You set the goal. Agents plan, build, review and merge.", "FaRocket"],
    ];
    line(s, 0.9, 1.75, 9.1, 1.75, C.border, 2);
    for (let i = 0; i < stages.length; i++) {
      const x = 0.5 + i * 2.3;
      const last = i === stages.length - 1;
      const accent = last ? C.violet : C.navy;
      await iconCircle(s, x + 0.75, 1.42, 0.66, stages[i][3], accent);
      card(s, x, 2.3, 2.1, 1.8, last ? C.violet : C.card);
      s.addText(stages[i][0], { x: x + 0.18, y: 2.42, w: 1.8, h: 0.3, fontFace: HFONT, fontSize: 12, color: last ? "DDD6FE" : C.muted, margin: 0 });
      s.addText(stages[i][1], { x: x + 0.18, y: 2.72, w: 1.8, h: 0.5, fontFace: HFONT, fontSize: 16, color: last ? C.white : C.ink, margin: 0, valign: "top" });
      s.addText(stages[i][2], { x: x + 0.18, y: 3.25, w: 1.8, h: 0.8, fontFace: FONT, fontSize: 12, color: last ? C.white : C.body, margin: 0, valign: "top" });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.35, w: 9.0, h: 0.68, fill: { color: C.dark }, line: { color: C.dark } });
    s.addText([
      { text: "“Completed work, not more code.”", options: { fontFace: HFONT, fontSize: 18, color: C.white, italic: true } },
      { text: "   — GitHub Universe 2026", options: { fontFace: FONT, fontSize: 12, color: C.cyan } },
    ], { x: 0.7, y: 4.35, w: 8.6, h: 0.68, valign: "middle", margin: 0 });
    footer(s);
    s.addNotes(
      "Set context for beginners. Copilot started as autocomplete, then added chat, then in 2025 the coding agent that can take an issue and open a PR.\n" +
      "2026 is the agent-first year: you describe the outcome and many agents work in parallel — planning, building, reviewing and merging — while you steer.\n" +
      "Universe 2026 framing: GitHub wants to deliver completed work, not more code. Keep humans in charge of goals, review and merge."
    );
  }

  // ---------------------------------------------------------------- 4. What is the app
  {
    const s = lightSlide();
    title(s, "What is the GitHub Copilot app?");
    badge(s, "GA · June 2026", C.green);
    s.addText("The desktop home for agent-driven development — built natively on GitHub.", {
      x: 0.5, y: 1.2, w: 3.5, h: 1.15, fontFace: HFONT, fontSize: 19, color: C.navy, margin: 0, valign: "top",
    });
    s.addText([
      { text: "macOS, Windows and Linux", options: { bullet: true, breakLine: true } },
      { text: "Start from an issue, PR, prompt — or a Jira ticket", options: { bullet: true, breakLine: true } },
      { text: "Run many sessions in parallel", options: { bullet: true, breakLine: true } },
      { text: "Uses your existing checks, reviews and merge rules", options: { bullet: true, breakLine: true } },
      { text: "Pro, Pro+, Business, Enterprise", options: { bullet: true } },
    ], { x: 0.5, y: 2.45, w: 3.5, h: 2.5, fontFace: FONT, fontSize: 13, color: C.body, paraSpaceAfter: 6, valign: "top", margin: 0 });
    const feats = [
      ["My Work", "Sessions, issues, PRs and automations in one view", "FaHouse", C.navy],
      ["Parallel sessions", "Each agent on its own branch and git worktree", "FaCodeBranch", C.navy],
      ["Sandboxes", "Local or cloud — cloud keeps going when your laptop sleeps", "FaCloud", C.blue],
      ["Agent Merge", "Shepherds PRs through CI and review to merge", "FaCodeMerge", C.blue],
      ["Projects", "Preview · one goal → many agents across repos → PRs", "FaDiagramProject", C.violet],
      ["Computer use", "Preview · drives desktop apps with no API, with your approval", "FaComputerMouse", C.violet],
    ];
    for (let i = 0; i < feats.length; i++) {
      const x = 4.3 + (i % 2) * 2.65;
      const y = 1.25 + Math.floor(i / 2) * 1.25;
      card(s, x, y, 2.5, 1.1);
      await iconCircle(s, x + 0.13, y + 0.14, 0.44, feats[i][2], feats[i][3]);
      s.addText(feats[i][0], { x: x + 0.65, y: y + 0.14, w: 1.8, h: 0.44, fontFace: HFONT, fontSize: 12.5, color: C.ink, valign: "middle", margin: 0 });
      s.addText(feats[i][1], { x: x + 0.15, y: y + 0.62, w: 2.25, h: 0.44, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    footer(s);
    s.addNotes(
      "The Copilot app went GA on June 17, 2026 for macOS, Windows and Linux. Think of it as mission control for agents rather than an editor.\n" +
      "My Work shows every session, issue, PR and automation. Each session runs on its own branch and git worktree, so several agents can work in parallel without stepping on each other.\n" +
      "Agent Merge takes a PR through CI and review to merge. Projects (public preview) lets you give Copilot a goal plus context and it runs as many agents as needed across repos. Computer use (public preview) lets Copilot operate desktop apps that have no API — it always asks before taking control, and admins can disable it.\n" +
      "Admin note: on Business/Enterprise, the admin must enable the Copilot CLI policy for users to access the app."
    );
  }

  // ---------------------------------------------------------------- 5. Flow
  {
    const s = lightSlide();
    title(s, "How work flows in the app", "Every step is visible and steerable — you approve what matters");
    const steps = [
      ["Start", "Issue, PR, prompt or Jira ticket", "FaPlay"],
      ["Plan", "Agent drafts a plan; you steer it in a canvas", "FaListCheck"],
      ["Build", "Isolated worktree, terminal and tools", "FaCode"],
      ["Validate", "Tests, diff review, live browser preview", "FaVial"],
      ["Pull request", "Your team's checks and rules apply", "FaCodePullRequest"],
      ["Merge", "Agent Merge drives CI and review to done", "FaCodeMerge"],
    ];
    const colors = [C.navy, C.navy, C.blue, C.blue, C.violet, C.violet];
    for (let i = 0; i < steps.length; i++) {
      const cx = 1.25 + i * 1.5;
      await iconCircle(s, cx - 0.42, 1.65, 0.84, steps[i][2], colors[i]);
      if (i < steps.length - 1) arrow(s, cx + 0.5, 2.07, cx + 1.0, 2.07, C.muted, 1.5);
      s.addText(steps[i][0], { x: cx - 0.7, y: 2.62, w: 1.4, h: 0.35, fontFace: HFONT, fontSize: 14, color: C.ink, align: "center", margin: 0 });
      s.addText(steps[i][1], { x: cx - 0.7, y: 2.98, w: 1.4, h: 0.9, fontFace: FONT, fontSize: 11, color: C.body, align: "center", valign: "top", margin: 0 });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.15, w: 9.0, h: 0.8, fill: { color: C.violetLight }, line: { color: C.violetLight } });
    s.addImage({ data: await icon("FaShieldHalved", C.violet), x: 0.75, y: 4.33, w: 0.44, h: 0.44 });
    s.addText([
      { text: "You stay in control:  ", options: { fontFace: HFONT, color: C.violet } },
      { text: "approve the plan  ·  review the diff  ·  require checks  ·  you merge", options: { fontFace: FONT, color: C.ink } },
    ], { x: 1.35, y: 4.15, w: 8.0, h: 0.8, fontSize: 14, valign: "middle", margin: 0 });
    footer(s);
    s.addNotes(
      "Walk the lifecycle. A session can start from an issue, a PR, a plain prompt or — with connectors — a Jira ticket.\n" +
      "The agent proposes a plan that you can edit in the plan canvas. It builds in an isolated worktree with its own terminal, so your main checkout is untouched.\n" +
      "Validation happens in the app: run tests, review the diff, preview the UI in the built-in browser. The PR goes through your normal branch protection and reviewers. Agent Merge can then shepherd it through CI and review.\n" +
      "Key message for a beginner audience: the human is still the decision-maker at every gate."
    );
  }

  // ---------------------------------------------------------------- 6. Agent first
  {
    const s = lightSlide();
    title(s, "The agent-first shift", "One agent runtime across every surface — start anywhere, continue anywhere");
    const hx = 3.0, hy = 3.15;
    const nodes = [
      ["Copilot app", "FaDesktop", 3.0, 1.62],
      ["VS Code", "FaCode", 4.75, 2.38],
      ["Copilot CLI", "FaTerminal", 4.75, 3.92],
      ["Cloud agent", "FaCloud", 3.0, 4.68],
      ["Slack & Teams", "FaComments", 1.25, 3.92],
      ["Copilot SDK", "FaCubes", 1.25, 2.38],
    ];
    for (const n of nodes) line(s, hx, hy, n[2], n[3], "94A3B8", 1.5);
    s.addShape(pres.shapes.OVAL, { x: hx - 0.72, y: hy - 0.72, w: 1.44, h: 1.44, fill: { color: C.violet }, line: { color: C.violet } });
    s.addText("Copilot\nagent\nruntime", { x: hx - 0.72, y: hy - 0.72, w: 1.44, h: 1.44, fontFace: HFONT, fontSize: 12, color: C.white, align: "center", valign: "middle", margin: 0 });
    for (const [label, ic, nx, ny] of nodes) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx - 0.8, y: ny - 0.22, w: 1.6, h: 0.44, rectRadius: 0.22, fill: { color: C.card }, line: { color: C.navy, width: 1 }, shadow: shadow() });
      s.addImage({ data: await icon(ic, C.navy), x: nx - 0.68, y: ny - 0.12, w: 0.24, h: 0.24 });
      s.addText(label, { x: nx - 0.4, y: ny - 0.22, w: 1.15, h: 0.44, fontFace: HFONT, fontSize: 10.5, color: C.ink, valign: "middle", margin: 0 });
    }
    const pillars = [
      ["Velocity", "Hand off whole tasks: parallel agents, Projects, automations", "FaGaugeHigh", C.navy],
      ["Intelligence", "Fusion routes each step to the right model; connectors and memory add context", "FaBrain", C.blue],
      ["Quality", "Code review tiers, Agent Merge, and your rules and checks", "FaShieldHalved", C.violet],
    ];
    for (let i = 0; i < pillars.length; i++) {
      const y = 1.55 + i * 1.15;
      card(s, 6.1, y, 3.4, 1.0);
      await iconCircle(s, 6.25, y + 0.25, 0.5, pillars[i][2], pillars[i][3]);
      s.addText(pillars[i][0], { x: 6.9, y: y + 0.08, w: 2.5, h: 0.32, fontFace: HFONT, fontSize: 14, color: C.ink, margin: 0 });
      s.addText(pillars[i][1], { x: 6.9, y: y + 0.4, w: 2.5, h: 0.56, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    footer(s);
    s.addNotes(
      "'Agent first' is GitHub's strategy: the agent is the primary way work gets done, and every surface — the app, VS Code, the CLI, github.com cloud agent, Slack and Teams, and the Copilot SDK — shares the same agent runtime.\n" +
      "That means session continuity: start a session in the app, continue it from the CLI or VS Code, check on it from Slack.\n" +
      "Universe 2026 framed this as three pillars: Velocity (hand off whole tasks), Intelligence (right model, right context), and Quality (code review tiers including Max, Agent Merge, your existing guardrails).\n" +
      "Also worth mentioning: the Copilot SDK is GA, so Ford teams can embed the same agent runtime in internal tools."
    );
  }

  // ---------------------------------------------------------------- 7. Connectors
  {
    const s = lightSlide();
    title(s, "Connectors: connect once", "Bring Jira, Figma, Slack and more into every session — no MCP setup");
    badge(s, "Public preview", C.amber);
    const steps = [
      ["Pick a GitHub-verified connector", "Customize → MCP → filter “GitHub verified”  (CLI: /mcp)"],
      ["Sign in once", "GitHub manages the MCP configuration and auth for you"],
      ["Just ask", "Copilot calls the tool when relevant — even if you don't name it"],
    ];
    for (let i = 0; i < steps.length; i++) {
      const y = 1.6 + i * 0.85;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: y + 0.05, w: 0.48, h: 0.48, fill: { color: C.navy }, line: { color: C.navy } });
      s.addText(String(i + 1), { x: 0.5, y: y + 0.05, w: 0.48, h: 0.48, fontFace: HFONT, fontSize: 15, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addText(steps[i][0], { x: 1.12, y, w: 3.5, h: 0.32, fontFace: HFONT, fontSize: 14, color: C.ink, margin: 0 });
      s.addText(steps[i][1], { x: 1.12, y: y + 0.32, w: 3.5, h: 0.42, fontFace: FONT, fontSize: 11, color: C.body, valign: "top", margin: 0 });
    }
    const tiles = [
      ["Atlassian Rovo", "FaAtlassian"], ["Figma", "FaFigma"], ["Slack", "FaSlack"],
      ["Work IQ (M365)", "FaMicrosoft"], ["Sentry", "FaBug"], ["Linear", "FaListUl"],
      ["Notion", "FaBook"], ["Miro", "FaChalkboard"], ["Grafana Cloud", "FaChartLine"],
      ["Azure Data Explorer", "FaDatabase"], ["Microsoft Learn", "FaGraduationCap"], ["Postman", "FaPaperPlane"],
    ];
    for (let i = 0; i < tiles.length; i++) {
      const x = 4.95 + (i % 3) * 1.53;
      const y = 1.5 + Math.floor(i / 3) * 0.66;
      const hl = i < 2;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.43, h: 0.55, fill: { color: hl ? C.violetLight : C.card }, line: { color: hl ? C.violet : C.border, width: 1 } });
      s.addImage({ data: await icon(tiles[i][1], hl ? C.violet : C.navy), x: x + 0.1, y: y + 0.15, w: 0.25, h: 0.25 });
      s.addText(tiles[i][0], { x: x + 0.42, y, w: 0.98, h: 0.55, fontFace: FONT, fontSize: 9.5, color: C.ink, valign: "middle", margin: 0 });
    }
    s.addText("26 GitHub-verified connectors today — highlighted: used in our demo", {
      x: 4.95, y: 4.15, w: 4.55, h: 0.25, fontFace: FONT, fontSize: 10, color: C.muted, italic: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.48, w: 9.0, h: 0.58, fill: { color: C.amberLight }, line: { color: C.amberLight } });
    s.addText([
      { text: "Admin checklist:  ", options: { fontFace: HFONT, color: C.amber } },
      { text: "Editor preview features ON  ·  MCP servers in Copilot ON  ·  MCP access “Allow all” + allowlist URLs", options: { fontFace: FONT, color: C.ink } },
    ], { x: 0.7, y: 4.48, w: 8.7, h: 0.58, fontSize: 11.5, valign: "middle", margin: 0 });
    footer(s);
    s.addNotes(
      "Connectors are GitHub-verified MCP servers. Before, every developer had to install and configure MCP servers and manage tokens themselves. Now you connect a service once and GitHub handles configuration and auth.\n" +
      "Where: in the app go to Customize → MCP → filter 'GitHub verified'. In the CLI use /mcp → Connectors. Also in the VS Code Agents window and github.com/copilot/customize.\n" +
      "Copilot uses connector tools whenever they help — you can say 'implement the story about EV charging' and it will search Jira.\n" +
      "26 services today including Atlassian Rovo (Jira and Confluence), Figma, Slack, Work IQ for Microsoft 365, Sentry, Linear, Notion, Azure Data Explorer and Microsoft Learn.\n" +
      "Works in local and cloud sandboxes, not Actions-based sessions. Admins need: editor preview features on, MCP servers in Copilot on, MCP access set to 'Allow all' (not 'Registry only'), and connector URLs on the allowlist."
    );
  }

  // ---------------------------------------------------------------- 8. Canvases
  {
    const s = lightSlide();
    title(s, "Canvases: see & steer the work", "Chat is where you instruct — canvases are where you inspect, steer and verify");
    // You <-> Canvas <-> Agent
    const trio = [["You", "FaUser", 0.75, C.navy], ["Canvas", "FaTableColumns", 2.25, C.violet], ["Agent", "FaRobot", 3.75, C.blue]];
    for (const [label, ic, x, col] of trio) {
      await iconCircle(s, x, 1.55, 0.7, ic, col);
      s.addText(label, { x: x - 0.25, y: 2.28, w: 1.2, h: 0.28, fontFace: HFONT, fontSize: 12, color: C.ink, align: "center", margin: 0 });
    }
    for (const [x1, x2] of [[1.5, 2.2], [3.0, 3.7]]) {
      s.addShape(pres.shapes.LINE, { x: x1, y: 1.9, w: x2 - x1, h: 0, line: { color: C.muted, width: 1.5, beginArrowType: "triangle", endArrowType: "triangle" } });
    }
    s.addText("Both sides edit the same live surface", { x: 0.5, y: 2.58, w: 4.3, h: 0.28, fontFace: FONT, fontSize: 11, color: C.muted, align: "center", italic: true, margin: 0 });
    const kinds = [
      ["Plan", "FaListCheck"], ["Browser", "FaGlobe"], ["Terminal", "FaTerminal"], ["Editor", "FaPenToSquare"],
      ["Excel", "FaFileExcel"], ["Word", "FaFileWord"], ["PowerPoint", "FaFilePowerpoint"], ["Dashboards", "FaChartPie"],
    ];
    for (let i = 0; i < kinds.length; i++) {
      const x = 0.5 + (i % 4) * 1.08;
      const y = 3.0 + Math.floor(i / 4) * 1.0;
      card(s, x, y, 0.98, 0.88);
      s.addImage({ data: await icon(kinds[i][1], C.navy), x: x + 0.32, y: y + 0.12, w: 0.34, h: 0.34 });
      s.addText(kinds[i][0], { x, y: y + 0.52, w: 0.98, h: 0.3, fontFace: FONT, fontSize: 10, color: C.ink, align: "center", margin: 0 });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 5.0, y: 1.5, w: 4.5, h: 3.5, fill: { color: C.dark }, line: { color: C.dark } });
    s.addText("Build your own canvas", { x: 5.25, y: 1.65, w: 4.0, h: 0.4, fontFace: HFONT, fontSize: 16, color: C.white, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.25, y: 2.12, w: 4.0, h: 1.12, fill: { color: "111C33" }, line: { color: "1E2A44" } });
    s.addText([
      { text: "/create-canvas", options: { color: C.cyan, breakLine: true } },
      { text: "A kanban board for our release checklist", options: { color: "E2E8F0", breakLine: true } },
      { text: "with add, move and close card actions", options: { color: "E2E8F0" } },
    ], { x: 5.4, y: 2.15, w: 3.8, h: 1.06, fontFace: MONO, fontSize: 11, valign: "middle", margin: 0 });
    s.addText([
      { text: "Repo scope: .github/extensions — share with the team", options: { bullet: true, breakLine: true } },
      { text: "User scope: ~/.copilot/extensions", options: { bullet: true, breakLine: true } },
      { text: "Also from plugins: Azure DevOps, Jira dashboards, security", options: { bullet: true } },
    ], { x: 5.25, y: 3.38, w: 4.1, h: 1.5, fontFace: FONT, fontSize: 11.5, color: "CBD5E1", paraSpaceAfter: 6, valign: "top", margin: 0 });
    footer(s);
    s.addNotes(
      "Canvases are interactive surfaces in the right-side panel of the app. They're bidirectional: you and the agent work on the same plan, browser page, spreadsheet, document or dashboard.\n" +
      "Examples: the plan canvas to edit the agent's plan, the browser canvas to preview a web app, the terminal, and Office canvases for Excel, Word and PowerPoint. Plugins add more, such as Azure DevOps and Jira dashboards.\n" +
      "You can build your own with /create-canvas — describe what you want, and Copilot scaffolds an extension (package.json, extension.mjs, JSON state). Put it in .github/extensions to share with your repo, or ~/.copilot/extensions for just you.\n" +
      "Line to land: chat is where you instruct, canvases are where you inspect, steer and verify."
    );
  }

  // ---------------------------------------------------------------- 9. Fusion
  {
    const s = lightSlide();
    title(s, "Copilot Fusion", "Pick an effort level — Fusion picks the models and the pattern for each step");
    badge(s, "GA · Oct 2026", C.green);
    const levels = [
      ["Fusion Standard", "Everyday work. Balances cost, quality and latency — usually one model.", "FaGaugeSimple", C.navy],
      ["Fusion High", "Complex bugs and multi-file changes. Adds review steps when worth it.", "FaGauge", C.blue],
      ["Fusion Max", "Hardest problems. Deepest reasoning, still token-efficient.", "FaGaugeHigh", C.violet],
    ];
    for (let i = 0; i < levels.length; i++) {
      const x = 0.5 + i * 3.05;
      card(s, x, 1.5, 2.9, 1.15);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 2.9, h: 0.07, fill: { color: levels[i][3] }, line: { color: levels[i][3] } });
      s.addImage({ data: await icon(levels[i][2], levels[i][3]), x: x + 0.15, y: 1.7, w: 0.34, h: 0.34 });
      s.addText(levels[i][0], { x: x + 0.58, y: 1.68, w: 2.2, h: 0.38, fontFace: HFONT, fontSize: 14, color: C.ink, valign: "middle", margin: 0 });
      s.addText(levels[i][1], { x: x + 0.15, y: 2.1, w: 2.65, h: 0.52, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    s.addText("Execution patterns Fusion chooses per prompt", { x: 0.5, y: 2.85, w: 9, h: 0.3, fontFace: HFONT, fontSize: 13, color: C.navy, margin: 0 });
    const pats = [
      ["Single", "One model completes the task — like a normal request."],
      ["Cascade", "Efficient model drafts; a judge accepts it or escalates."],
      ["Critique", "One model drafts; critics review in parallel; it revises."],
    ];
    const box = (x, y, w, h, t, col) => {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: col }, line: { color: col } });
      s.addText(t, { x, y, w, h, fontFace: FONT, fontSize: 9, color: C.white, align: "center", valign: "middle", margin: 0 });
    };
    for (let i = 0; i < pats.length; i++) {
      const x = 0.5 + i * 3.05;
      card(s, x, 3.22, 2.9, 1.8);
      s.addText(pats[i][0], { x: x + 0.15, y: 3.3, w: 2.6, h: 0.32, fontFace: HFONT, fontSize: 13, color: C.ink, margin: 0 });
      const dy = 3.75;
      if (i === 0) {
        box(x + 0.35, dy, 0.85, 0.42, "Model", C.navy);
        arrow(s, x + 1.25, dy + 0.21, x + 1.62, dy + 0.21);
        box(x + 1.67, dy, 0.85, 0.42, "Answer", C.green);
      } else if (i === 1) {
        box(x + 0.12, dy, 0.75, 0.42, "Draft", C.blue);
        arrow(s, x + 0.9, dy + 0.21, x + 1.05, dy + 0.21);
        box(x + 1.08, dy, 0.7, 0.42, "Judge", C.navy);
        arrow(s, x + 1.81, dy + 0.21, x + 1.96, dy + 0.21);
        box(x + 1.99, dy - 0.02, 0.8, 0.2, "Accept", C.green);
        box(x + 1.99, dy + 0.24, 0.8, 0.2, "Escalate", C.violet);
      } else {
        box(x + 0.12, dy, 0.72, 0.42, "Draft", C.blue);
        for (let k = 0; k < 3; k++) {
          arrow(s, x + 0.87, dy + 0.21, x + 1.05, dy - 0.03 + k * 0.2 + 0.08, C.muted, 1);
          box(x + 1.08, dy - 0.03 + k * 0.2, 0.72, 0.16, "Critic", C.navy);
        }
        arrow(s, x + 1.83, dy + 0.21, x + 2.0, dy + 0.21);
        box(x + 2.03, dy, 0.75, 0.42, "Revise", C.violet);
      }
      s.addText(pats[i][1], { x: x + 0.15, y: 4.35, w: 2.6, h: 0.6, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    footer(s);
    s.addNotes(
      "Copilot Fusion went GA on October 28, 2026. Instead of picking a model, you pick 'Copilot Fusion' in the model picker and an effort level: Standard, High or Max.\n" +
      "Fusion is a runtime router and orchestrator. For each prompt it picks an execution pattern: Single (one model), Cascade (a cheaper model drafts, a judge accepts or escalates to a stronger model), or Critique (one model drafts, several critics review in parallel, the drafter revises).\n" +
      "It only adds model calls when the task warrants it, routes on cache boundaries to avoid extra cost, and considers real-time model health. Hover the effort level under a response to see which models were used.\n" +
      "Available on all plans in VS Code, the CLI, the Copilot app and JetBrains. Local model routing (for example MAI Code 1.1 Flash on Windows) is in preview for Fusion Standard."
    );
  }

  // ---------------------------------------------------------------- 10. Fusion value
  {
    const s = lightSlide();
    title(s, "Fusion: better value, 30% off", "Frontier-level results without paying frontier prices on every step");
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 3.1, h: 3.5, fill: { color: C.violet }, line: { color: C.violet }, shadow: shadow() });
    s.addText("30%", { x: 0.7, y: 1.6, w: 2.7, h: 1.15, fontFace: HFONT, fontSize: 66, color: C.white, margin: 0, valign: "middle" });
    s.addText("off model costs when you use Copilot Fusion", { x: 0.7, y: 2.78, w: 2.75, h: 0.65, fontFace: HFONT, fontSize: 15, color: C.white, margin: 0, valign: "top" });
    s.addText("Paid Copilot plans · through Nov 30, 2026", { x: 0.7, y: 3.5, w: 2.75, h: 0.5, fontFace: FONT, fontSize: 12, color: "DDD6FE", margin: 0, valign: "top" });
    s.addText("Billed per model at its standard rate — no separate Fusion fee", { x: 0.7, y: 4.15, w: 2.75, h: 0.7, fontFace: FONT, fontSize: 11, color: C.white, italic: true, margin: 0, valign: "top" });

    s.addChart(pres.charts.BAR, [{
      name: "Relative cost",
      labels: ["Top frontier model (max)", "Fusion Max", "Fusion Max + 30% offer"],
      values: [100, 50, 35],
    }], {
      x: 3.85, y: 1.4, w: 5.65, h: 2.3, barDir: "bar",
      chartColors: ["94A3B8", C.blue, C.violet],
      chartColorsOpacity: 100,
      showValue: true, dataLabelColor: C.ink, dataLabelFontSize: 10, dataLabelFormatCode: "0",
      catAxisLabelColor: C.body, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showTitle: true, title: "Relative cost per coding-agent task (illustrative, top model = 100)",
      titleFontSize: 11, titleColor: C.muted, titleFontFace: FONT,
      barGapWidthPct: 60, showLegend: false,
    });
    const stats = [
      ["60", "Fusion Max score — within 2 pts of the top frontier model"],
      ["~½", "the cost of the top frontier model on the same index"],
      ["~40%", "less time to complete the benchmark tasks"],
    ];
    for (let i = 0; i < stats.length; i++) {
      const x = 3.85 + i * 1.92;
      card(s, x, 3.85, 1.8, 1.15);
      s.addText(stats[i][0], { x: x + 0.12, y: 3.9, w: 1.6, h: 0.5, fontFace: HFONT, fontSize: 24, color: C.violet, margin: 0, valign: "middle" });
      s.addText(stats[i][1], { x: x + 0.12, y: 4.4, w: 1.6, h: 0.56, fontFace: FONT, fontSize: 9.5, color: C.body, margin: 0, valign: "top" });
    }
    footer(s, "Source: GitHub changelog & docs, Oct 2026 — Artificial Analysis Coding Agent Index. Chart is illustrative; actual cost varies by task.");
    s.addNotes(
      "Billing: Fusion has no separate charge. You're billed for each model it uses at that model's standard rate. Fusion High and Max may use more than one model per task, so a task can cost more credits than Fusion Standard.\n" +
      "Launch offer: through November 30, 2026, paid Copilot plans get a 30% discount on model costs when using Fusion. That's the '30% Fusion' — it's live right now, so this is a good time to pilot it.\n" +
      "Benchmark: GitHub reported Fusion Max scored 60 on the Artificial Analysis Coding Agent Index — within 2 points of the top frontier model at max effort — at about half the cost and about 40% less time. The chart is illustrative: 100 vs ~50, then ~35 with the 30% offer applied.\n" +
      "Admin controls: Fusion only uses models enabled by policy; admins can exclude models from Fusion only, and can make Fusion the default via enterprise managed settings. If Fusion Max is missing from the picker, a required model is disabled."
    );
  }

  // ---------------------------------------------------------------- 11. Jira + Figma demo
  {
    const s = lightSlide();
    title(s, "Live demo: Jira + Figma → PR", "Scenario: Dealer Service Booking app — add an EV charging-bay option");
    const steps = [
      ["Read the story", "Atlassian Rovo connector pulls FORD-101 and its acceptance criteria", "FaJira", C.blue],
      ["Read the design", "Figma connector reads the frame, layout and colors", "FaFigma", C.violet],
      ["Plan in a canvas", "Agent proposes the change; you edit the plan", "FaListCheck", C.navy],
      ["Build & validate", "Fusion High · worktree · tests · browser preview", "FaCode", C.navy],
      ["PR + Jira update", "Opens the PR, comments on FORD-101, moves it to In Review", "FaCodePullRequest", C.green],
    ];
    for (let i = 0; i < steps.length; i++) {
      const x = 0.5 + i * 1.83;
      card(s, x, 1.5, 1.65, 1.95);
      await iconCircle(s, x + 0.55, 1.62, 0.55, steps[i][2], steps[i][3]);
      s.addText(steps[i][0], { x: x + 0.08, y: 2.22, w: 1.5, h: 0.32, fontFace: HFONT, fontSize: 12, color: C.ink, align: "center", margin: 0 });
      s.addText(steps[i][1], { x: x + 0.1, y: 2.55, w: 1.45, h: 0.85, fontFace: FONT, fontSize: 9.5, color: C.body, align: "center", valign: "top", margin: 0 });
      if (i < steps.length - 1) arrow(s, x + 1.66, 2.47, x + 1.82, 2.47, C.muted, 1.5);
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.65, w: 9.0, h: 1.38, fill: { color: C.dark }, line: { color: C.dark } });
    s.addText("PROMPT", { x: 0.7, y: 3.75, w: 2, h: 0.25, fontFace: HFONT, fontSize: 10, color: C.cyan, charSpacing: 2, margin: 0 });
    s.addText(
      "Implement Jira story FORD-101 in this repo. Use the Figma frame “Booking – EV charging bay” for layout and colors. " +
      "Show me a plan first, add tests, preview the page in the browser, then open a PR and comment the PR link on FORD-101.",
      { x: 0.7, y: 4.02, w: 8.6, h: 0.95, fontFace: MONO, fontSize: 11.5, color: "E2E8F0", valign: "top", margin: 0 }
    );
    footer(s);
    s.addNotes(
      "Demo time — follow demos/04-jira-figma.md. Scenario: a sample Dealer Service Booking web app (in the repo's app/ folder). Story FORD-101: EV owners can reserve a charging bay during service.\n" +
      "1) In the Copilot app, start a session on the repo with Copilot Fusion (High).\n" +
      "2) Paste the prompt. Point out the Atlassian Rovo connector call that reads FORD-101 and the Figma connector call that reads the frame.\n" +
      "3) Edit the plan in the plan canvas — e.g. add: 'reject evCharging for non-EV vehicles with a 400, and test it'. This shows you steer before any code is written.\n" +
      "4) Watch it build in its worktree, run npm test, and open the page in the browser canvas.\n" +
      "5) It opens a PR and comments on the Jira issue. Show the Jira issue updated.\n" +
      "Fallback: if a connector isn't available, paste the story from demo-assets/jira/FORD-101.md and attach the mockup image from demo-assets/figma."
    );
  }

  // ---------------------------------------------------------------- 12. Excel
  {
    const s = lightSlide();
    title(s, "Excel for business users", "No code required — describe the analysis; Copilot builds it in the Excel canvas");
    const personas = [["Plant quality engineer", "FaIndustry"], ["Finance analyst", "FaCoins"], ["Program manager", "FaUsers"]];
    for (let i = 0; i < personas.length; i++) {
      const x = 0.5 + i * 1.47;
      card(s, x, 1.5, 1.37, 0.95);
      s.addImage({ data: await icon(personas[i][1], C.navy), x: x + 0.53, y: 1.6, w: 0.32, h: 0.32 });
      s.addText(personas[i][0], { x: x + 0.05, y: 1.97, w: 1.27, h: 0.44, fontFace: FONT, fontSize: 10, color: C.ink, align: "center", valign: "middle", margin: 0 });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.65, w: 4.3, h: 2.38, fill: { color: C.dark }, line: { color: C.dark } });
    s.addText("TRY THESE PROMPTS", { x: 0.7, y: 2.75, w: 3.9, h: 0.25, fontFace: HFONT, fontSize: 10, color: C.cyan, charSpacing: 2, margin: 0 });
    s.addText([
      { text: "“Summarize claims by vehicle segment and quarter, with a chart.”", options: { bullet: true, breakLine: true } },
      { text: "“Highlight where cost per claim is 20% above average.”", options: { bullet: true, breakLine: true } },
      { text: "“Find anything unusual in the last 6 months and explain it.”", options: { bullet: true, breakLine: true } },
      { text: "“What if claims drop 15% after the fix? Show savings.”", options: { bullet: true } },
    ], { x: 0.7, y: 3.05, w: 3.95, h: 1.9, fontFace: FONT, fontSize: 11.5, color: "E2E8F0", paraSpaceAfter: 5, valign: "top", margin: 0 });

    const seg = loadClaimsBySegment();
    s.addChart(pres.charts.BAR, [{ name: "Claims", labels: seg.map((d) => d[0]), values: seg.map((d) => d[1]) }], {
      x: 5.05, y: 1.45, w: 4.45, h: 3.25, barDir: "col",
      chartColors: [C.navy], showValue: true, dataLabelFontSize: 9, dataLabelColor: C.ink, dataLabelFormatCode: "#,##0",
      catAxisLabelFontSize: 9, catAxisLabelColor: C.body, catAxisLabelFontFace: FONT,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showTitle: true, title: "Warranty claims by vehicle segment (synthetic)", titleFontSize: 11, titleColor: C.muted, titleFontFace: FONT,
      showLegend: false, barGapWidthPct: 50,
    });
    s.addText("Built live from demo-assets/excel/warranty-claims.xlsx (1,260 rows)", {
      x: 5.05, y: 4.75, w: 4.45, h: 0.28, fontFace: FONT, fontSize: 9.5, color: C.muted, italic: true, align: "center", margin: 0,
    });
    footer(s);
    s.addNotes(
      "Copilot isn't only for developers. In the Copilot app, open the Excel canvas on a workbook and ask in plain English.\n" +
      "Demo (demos/05-excel-business-users.md): open demo-assets/excel/warranty-claims.xlsx — 1,260 rows of synthetic warranty data. Ask for a summary by segment and quarter with a chart, then conditional formatting, then 'find anything unusual'. Copilot should find the planted spike in Compact SUV infotainment claims in Mar–May 2026.\n" +
      "Copilot writes real formulas (SUMIFS etc.), so the result is auditable and refreshable — not a pasted answer.\n" +
      "Fallback: open warranty-analysis-completed.xlsx to show the finished state.\n" +
      "Note: Microsoft 365 Copilot in Excel is a separate product; this shows GitHub Copilot operating on the workbook through the canvas."
    );
  }

  // ---------------------------------------------------------------- 13. Automations
  {
    const s = lightSlide();
    title(s, "Automations", "Copilot cloud agent works on a schedule, on events, or via API — no laptop needed");
    badge(s, "Cloud automations", C.green);
    const trig = [
      ["Schedule", "Hourly, daily or weekly", "FaCalendarDays", C.navy],
      ["Events", "Issues, PRs, discussions and security alerts — with filters", "FaBolt", C.blue],
      ["API", "Trigger from Jira, Sentry, PagerDuty or your own systems", "FaCode", C.violet],
    ];
    for (let i = 0; i < trig.length; i++) {
      const x = 0.5 + i * 3.05;
      card(s, x, 1.5, 2.9, 1.2);
      await iconCircle(s, x + 0.15, 1.65, 0.5, trig[i][2], trig[i][3]);
      s.addText(trig[i][0], { x: x + 0.78, y: 1.65, w: 2.0, h: 0.5, fontFace: HFONT, fontSize: 15, color: C.ink, valign: "middle", margin: 0 });
      s.addText(trig[i][1], { x: x + 0.15, y: 2.2, w: 2.65, h: 0.48, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    s.addText("Anatomy of an automation", { x: 0.5, y: 2.88, w: 9, h: 0.3, fontFace: HFONT, fontSize: 13, color: C.navy, margin: 0 });
    const parts = ["Name", "Prompt", "Triggers", "Tools: GitHub + MCP", "Model & reasoning", "AI-credit limit"];
    for (let i = 0; i < parts.length; i++) {
      const x = 0.5 + i * 1.52;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.25, w: 1.42, h: 0.42, rectRadius: 0.1, fill: { color: C.violetLight }, line: { color: C.violet, width: 0.75 } });
      s.addText(parts[i], { x, y: 3.25, w: 1.42, h: 0.42, fontFace: FONT, fontSize: 10, color: C.ink, align: "center", valign: "middle", margin: 0 });
    }
    const kinds = [
      ["Personal", "Runs as you · billed to you", "FaUser"],
      ["Shared", "Runs as Copilot · billed to the org · survives team changes", "FaUsers"],
      ["Self-improving groups", "Related automations share context and propose improvements", "FaWandMagicSparkles"],
    ];
    for (let i = 0; i < kinds.length; i++) {
      const x = 0.5 + i * 3.05;
      card(s, x, 3.88, 2.9, 1.15);
      s.addImage({ data: await icon(kinds[i][2], C.navy), x: x + 0.15, y: 4.0, w: 0.3, h: 0.3 });
      s.addText(kinds[i][0], { x: x + 0.55, y: 3.97, w: 2.25, h: 0.36, fontFace: HFONT, fontSize: 13, color: C.ink, valign: "middle", margin: 0 });
      s.addText(kinds[i][1], { x: x + 0.15, y: 4.38, w: 2.65, h: 0.6, fontFace: FONT, fontSize: 10.5, color: C.body, valign: "top", margin: 0 });
    }
    footer(s);
    s.addNotes(
      "Automations run Copilot cloud agent without you starting a session. Triggers: a schedule (hourly, daily, weekly); events across issues, pull requests, discussions and security alerts (Universe added 24 more, e.g. PR review submitted, merge conflict, Dependabot alert); or the REST API, so Jira, Sentry or PagerDuty can start one. Automations can also chain — 'Automation run succeeded/failed' triggers the next one.\n" +
      "Each automation has a name, a prompt, triggers, the tools it can use (GitHub tools plus MCP tools configured on the repo), and optionally a model, reasoning level and AI-credit limits (per run, daily, weekly, monthly).\n" +
      "Personal automations run as you and bill you. Shared automations run under Copilot's identity, bill the org and keep running if the creator leaves.\n" +
      "Automation groups share context and propose improvements to themselves based on outcomes.\n" +
      "Requirements: private or internal repo, Copilot cloud agent enabled, write access; Pro, Pro+, Max, Business or Enterprise. The Copilot app also has local automations (manual, hourly, daily, weekly or cron) that start a new session each run."
    );
  }

  // ---------------------------------------------------------------- 14. Automation ideas
  {
    const s = lightSlide();
    title(s, "Automation ideas for Ford", "Start small: one shared automation per pilot team");
    const ideas = [
      ["Morning issue triage", "Daily · 7:00", "Label, de-duplicate and route new issues; post a summary"],
      ["PR standards check", "On PR opened", "Review against our coding and security checklist; suggest fixes"],
      ["Dependency health", "Weekly · Mon", "Find outdated or vulnerable packages; open a PR with safe upgrades"],
      ["Sprint digest", "Weekly · Fri", "Pull sprint status from Jira via connector; publish a status issue"],
    ];
    for (let i = 0; i < ideas.length; i++) {
      const x = 0.5 + (i % 2) * 2.85;
      const y = 1.5 + Math.floor(i / 2) * 1.8;
      card(s, x, y, 2.7, 1.62);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: 1.62, fill: { color: C.violet }, line: { color: C.violet } });
      s.addText(ideas[i][0], { x: x + 0.22, y: y + 0.12, w: 2.4, h: 0.36, fontFace: HFONT, fontSize: 14, color: C.ink, margin: 0 });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.22, y: y + 0.52, w: 1.35, h: 0.28, rectRadius: 0.14, fill: { color: C.violetLight }, line: { color: C.violetLight } });
      s.addText(ideas[i][1], { x: x + 0.22, y: y + 0.52, w: 1.35, h: 0.28, fontFace: HFONT, fontSize: 9, color: C.violet, align: "center", valign: "middle", margin: 0 });
      s.addText(ideas[i][2], { x: x + 0.22, y: y + 0.9, w: 2.38, h: 0.65, fontFace: FONT, fontSize: 11, color: C.body, valign: "top", margin: 0 });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 6.3, y: 1.5, w: 3.2, h: 3.42, fill: { color: C.dark }, line: { color: C.dark } });
    s.addImage({ data: await icon("FaShieldHalved", C.cyan), x: 6.5, y: 1.68, w: 0.36, h: 0.36 });
    s.addText("Built-in guardrails", { x: 6.95, y: 1.66, w: 2.45, h: 0.4, fontFace: HFONT, fontSize: 15, color: C.white, valign: "middle", margin: 0 });
    s.addText([
      { text: "Private or internal repos only", options: { bullet: true, breakLine: true } },
      { text: "Ignores events from users without write access", options: { bullet: true, breakLine: true } },
      { text: "Choose tools, model and AI-credit cap", options: { bullet: true, breakLine: true } },
      { text: "Every run is a reviewable session or PR", options: { bullet: true, breakLine: true } },
      { text: "Manage in the repo Agents tab, the app, VS Code or REST API", options: { bullet: true } },
    ], { x: 6.5, y: 2.18, w: 2.9, h: 2.65, fontFace: FONT, fontSize: 11.5, color: "CBD5E1", paraSpaceAfter: 6, valign: "top", margin: 0 });
    footer(s);
    s.addNotes(
      "Concrete ideas Ford teams can start with. Prompts for each are in demo-assets/automations/automation-prompts.md.\n" +
      "Demo (demos/06-automations.md): create the 'PR standards check' automation on the demo repo, trigger it by opening a PR, and show the review comment.\n" +
      "Guardrails: automations only run on private or internal repos. By default, events from users without write access are ignored — that protects against prompt injection through public issues. You control tools, model and a credit cap, and every run produces a reviewable session or PR."
    );
  }

  // ---------------------------------------------------------------- 15. Getting started
  {
    const s = lightSlide();
    title(s, "Getting started at Ford", "Enable → pilot → scale");
    const phases = [
      ["Enable", "Weeks 1–2", "FaToggleOn", C.navy, [
        "Copilot CLI policy on (needed for the app)",
        "Editor preview features + MCP policy",
        "Allowlist connectors: Atlassian, Figma",
        "Model policy; consider Fusion as default",
        "Enable Copilot cloud agent",
      ]],
      ["Pilot", "Weeks 3–6", "FaFlask", C.blue, [
        "1–2 teams, 3 use cases",
        "Jira → PR in the Copilot app",
        "Tests and code review with Fusion",
        "One shared automation per team",
        "Track PR cycle time and AI credits",
      ]],
      ["Scale", "Week 7+", "FaRocket", C.violet, [
        "Champions network and office hours",
        "Shared automations and custom canvases",
        "Repo instructions and custom agents",
        "Business users: Excel and reporting",
        "Quarterly value review",
      ]],
    ];
    for (let i = 0; i < phases.length; i++) {
      const [name, when, ic, col, bullets] = phases[i];
      const x = 0.5 + i * 3.05;
      card(s, x, 1.45, 2.9, 2.95);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 2.9, h: 0.75, fill: { color: col }, line: { color: col } });
      s.addImage({ data: await icon(ic, C.white), x: x + 0.18, y: 1.63, w: 0.4, h: 0.4 });
      s.addText(name, { x: x + 0.72, y: 1.5, w: 2.0, h: 0.38, fontFace: HFONT, fontSize: 16, color: C.white, margin: 0, valign: "middle" });
      s.addText(when, { x: x + 0.72, y: 1.86, w: 2.0, h: 0.28, fontFace: FONT, fontSize: 11, color: "E2E8F0", margin: 0 });
      s.addText(bullets.map((b, k) => ({ text: b, options: { bullet: true, breakLine: k < bullets.length - 1 } })), {
        x: x + 0.15, y: 2.32, w: 2.65, h: 2.0, fontFace: FONT, fontSize: 11, color: C.body, paraSpaceAfter: 4, valign: "top", margin: 0,
      });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.55, w: 9.0, h: 0.5, fill: { color: C.violetLight }, line: { color: C.violetLight } });
    s.addText([
      { text: "New at Universe:  ", options: { fontFace: HFONT, color: C.violet } },
      { text: "GitHub Enterprise customers get all Copilot features, no separate subscription — pay for AI credits used.", options: { fontFace: FONT, color: C.ink } },
    ], { x: 0.7, y: 4.55, w: 8.7, h: 0.5, fontSize: 11, valign: "middle", margin: 0 });
    footer(s);
    s.addNotes(
      "A practical path. Enable: admin policies first — the Copilot CLI policy is required for Business/Enterprise users to use the app; editor preview features and MCP policies for connectors; allowlist the Atlassian and Figma connectors; set model policy and consider Fusion as the default via managed settings; enable cloud agent for automations.\n" +
      "Pilot: one or two teams, three use cases. Measure PR cycle time, review time, and AI credit spend.\n" +
      "Scale: champions, shared automations, custom canvases, repo instructions and custom agents, plus business-user scenarios like Excel reporting.\n" +
      "Commercial note: at Universe, GitHub announced that GitHub Enterprise customers can use all Copilot features without a separate Copilot subscription and pay for AI credits used — available through Sales now, self-serve later. Offer to follow up with the account team."
    );
  }

  // ---------------------------------------------------------------- 16. Q&A
  {
    const s = pres.addSlide();
    slideNo += 1;
    s.background = { color: C.dark };
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: 1.25, w: 1.3, h: 1.3, fill: { color: C.violet }, line: { color: C.violet } });
    s.addImage({ data: await icon("FaCircleQuestion", C.white), x: 0.92, y: 1.57, w: 0.66, h: 0.66 });
    s.addText("Questions?", { x: 0.6, y: 2.75, w: 4.4, h: 0.95, fontFace: HFONT, fontSize: 48, color: C.white, margin: 0, valign: "middle" });
    s.addText("Thank you, Ford!", { x: 0.6, y: 3.7, w: 4.4, h: 0.45, fontFace: FONT, fontSize: 18, color: "CBD5E1", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.4, y: 1.05, w: 4.1, h: 3.15, fill: { color: "111C33" }, line: { color: "1E2A44" } });
    s.addText("RESOURCES", { x: 5.65, y: 1.22, w: 3.6, h: 0.3, fontFace: HFONT, fontSize: 11, color: C.cyan, charSpacing: 2, margin: 0 });
    const res = [
      ["Copilot app", "github.com/features/ai/github-app"],
      ["Docs", "docs.github.com/copilot"],
      ["Supported connectors", "docs.github.com/copilot/reference/supported-connectors"],
      ["Copilot Fusion", "docs.github.com/copilot/concepts/models/copilot-fusion"],
      ["What's new", "github.blog/changelog"],
    ];
    const runs = [];
    res.forEach(([k, v], i) => {
      runs.push({ text: k, options: { fontFace: HFONT, fontSize: 12, color: C.white, breakLine: true } });
      runs.push({ text: v, options: { fontFace: FONT, fontSize: 10, color: "94A3B8", breakLine: i < res.length - 1, paraSpaceAfter: 8 } });
    });
    s.addText(runs, { x: 5.65, y: 1.6, w: 3.7, h: 2.45, valign: "top", margin: 0 });
    s.addNotes(
      "Open the floor. Likely questions and answers are in qa/faq.md — pricing and AI credits, the Fusion discount end date, admin policies for connectors, security of computer use and automations, preview vs GA status, and how this relates to Microsoft 365 Copilot.\n" +
      "Close with an offer: help set up a pilot, and share the demo repo with the teams that want to repeat the demos."
    );
  }

  const out = path.join(__dirname, "Ford-GitHub-Copilot-Whats-New.pptx");
  await pres.writeFile({ fileName: out });
  console.log(`Wrote ${out} (${slideNo} slides)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
