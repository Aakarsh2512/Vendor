(() => {
  const STORAGE_KEY = "asa-vendor-intake-runs-v1";
  const DB_NAME = "asa-vendor-intake-files";
  const DB_VERSION = 1;
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const THEME_STORAGE_KEY = "asa-vendor-intake-theme-v1";
  const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";
  const DEMO_BATCH_NORMAL = "asa-review-hub-normal-v1";
  const DEMO_BATCH_EDGE = "asa-review-hub-edge-v1";
  const DEMO_BOOTSTRAP_KEY = "asa-review-hub-demo-bootstrap-v1";
  const DEMO_DATASET = window.ASA_DEMO_DATASET || { normalCases: [], edgeCases: [] };
  const IS_LOCAL_DEMO = window.location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const IS_PRESENTATION_MODE = IS_LOCAL_DEMO || new URLSearchParams(window.location.search).get("demo") === "1";
  const FILE_FIELDS = [
    ["registration-file", "Registration document"],
    ["tax-file", "Tax document"],
    ["bank-file", "Bank proof"],
  ];
  const KNOWLEDGE_BASE = window.ASA_KNOWLEDGE_BASE || { countries: [], documents: [], reviewedOn: "" };

  const form = document.querySelector("#submission-form");
  const newView = document.querySelector("#new-view");
  const queueView = document.querySelector("#queue-view");
  const toast = document.querySelector("#toast");
  const dialog = document.querySelector("#run-dialog");
  let toastTimer;

  function applyTheme(theme, persist = false) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    const button = document.querySelector("#theme-toggle");
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to night mode");
    document.querySelector("#theme-toggle-label").textContent = dark ? "Light mode" : "Night mode";
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = dark ? "#101923" : "#eef4f5";
    if (persist) localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  }

  function readRuns() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function writeRuns(runs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }

  function openFileDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("This browser does not support local document storage."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("documents")) {
          db.createObjectStore("documents", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open local document storage."));
    });
  }

  async function saveFiles(runId, files) {
    if (!files.length) return;
    const db = await openFileDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("documents", "readwrite");
      const store = transaction.objectStore("documents");
      files.forEach(({ kind, file }) => store.put({
        id: `${runId}:${kind}`,
        runId,
        kind,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        blob: file,
      }));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save the attachments."));
      transaction.onabort = () => reject(transaction.error || new Error("Saving attachments was interrupted."));
    });
    db.close();
  }

  async function readFiles(runId) {
    const db = await openFileDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction("documents", "readonly");
        const request = transaction.objectStore("documents").getAll();
        request.onsuccess = () => resolve(request.result.filter((document) => document.runId === runId));
        request.onerror = () => reject(request.error || new Error("Could not load the saved attachments."));
      });
    } finally {
      db.close();
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function shortDate(iso) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  }

  function fullDate(iso) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function statusClass(status) {
    if (status === "Approved") return "approved";
    if (status === "Pending") return "pending";
    if (status === "Rejected") return "rejected";
    if (["Information extracted", "Checks complete", "Comparison complete"].includes(status)) return "extracted";
    if (["Needs document review", "Checks need attention", "Comparison needs review"].includes(status)) return "attention";
    return "received";
  }

  function timeAfter(iso, hours) {
    return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
  }

  function makeSyntheticField(key, label, value) {
    return { key, label, value, page: 1, evidence: label + ": " + value, method: "Synthetic demo dataset" };
  }

  function makeSyntheticRun(template, index, batchId, kind) {
    const id = kind === "normal" ? "SAMPLE-N-" + String(index + 1).padStart(3, "0") : "SAMPLE-E-" + String(index + 1).padStart(2, "0");
    const daysAgo = kind === "normal" ? (DEMO_DATASET.normalCases.length - index) * 3 : DEMO_DATASET.edgeCases.length - index - 1;
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);
    created.setHours(9 + (index % 7), (index * 11) % 60, 0, 0);
    const createdAt = created.toISOString();
    const missing = new Set(template.missingDocuments || []);
    const allDocumentSpecs = [
      { kind: "Registration document", suffix: "registration", fields: [
        makeSyntheticField("legalName", "Legal business name", template.legalName),
        makeSyntheticField("country", "Country or region", template.country),
        makeSyntheticField("taxId", "Tax or registration ID", template.taxId),
      ] },
      { kind: "Tax document", suffix: "tax", fields: [
        makeSyntheticField("country", "Country or region", template.country),
        makeSyntheticField("taxId", "Tax or registration ID", template.taxId),
      ] },
      { kind: "Bank proof", suffix: "bank", fields: [
        makeSyntheticField("accountHolder", "Bank account holder", template.accountHolder),
      ] },
    ];
    const includedDocuments = allDocumentSpecs.filter((spec) => !missing.has(spec.kind));
    const documents = includedDocuments.map((spec) => ({
      kind: spec.kind,
      name: id + "-" + spec.suffix + "-SYNTHETIC.txt",
      type: "text/plain",
      size: 0,
    }));
    const extractedDocuments = includedDocuments.map((spec) => ({
      kind: spec.kind,
      filename: id + "-" + spec.suffix + "-SYNTHETIC.txt",
      contentType: "text/plain",
      status: "read",
      message: "Synthetic presentation evidence; no source file is attached.",
      pageCount: 0,
      textCharacters: spec.fields.reduce((sum, field) => sum + field.evidence.length, 0),
      fields: spec.fields,
      preview: spec.fields.map((field) => field.evidence).join("\n"),
    }));

    return {
      id,
      demoCase: true,
      demoKind: kind,
      demoBatchId: batchId,
      demoScenario: template.scenario || "normal_complete_packet",
      demoScenarioLabel: template.scenarioLabel || "Normal complete packet",
      legalName: template.legalName,
      country: template.country,
      taxId: template.taxId,
      email: template.email,
      accountHolder: template.accountHolder,
      documents,
      extraction: {
        runId: id,
        processedAt: timeAfter(createdAt, 1),
        documents: extractedDocuments,
      },
      createdAt,
      stage: 2,
      status: "Information extracted",
      auditEvents: [
        { stage: 1, title: "Submission received", summary: "Synthetic presentation case created.", at: createdAt },
        { stage: 2, title: "Document reading", summary: extractedDocuments.length + " synthetic evidence record(s) prepared.", at: timeAfter(createdAt, 1) },
      ],
    };
  }

  function processSyntheticRuns(records, existingRuns, kind) {
    const comparisonScope = existingRuns.concat(records);
    records.forEach((run, index) => {
      const checkedAt = timeAfter(run.createdAt, 2);
      run.validation = { checkedAt, checks: evaluateRun(run) };
      run.comparison = { checkedAt: timeAfter(run.createdAt, 3), checks: evaluateComparison(run, comparisonScope) };
      const proposal = automaticDecision(run);
      const decidedAt = timeAfter(run.createdAt, 4);
      run.decision = {
        status: proposal.status,
        automaticStatus: proposal.status,
        source: "Rule-based decision",
        reason: proposal.reason,
        overrideReason: "",
        decidedAt,
      };
      run.stage = kind === "normal" ? 7 : 5;
      run.status = proposal.status;
      run.auditEvents.push(
        { stage: 3, title: "Completeness and format checks", summary: run.validation.checks.filter((check) => check.state === "review").length + " review signal(s) found.", at: checkedAt },
        { stage: 4, title: "Cross-document comparison", summary: run.comparison.checks.filter((check) => check.state === "review").length + " comparison signal(s) found.", at: timeAfter(run.createdAt, 3) },
        { stage: 5, title: "Onboarding decision", summary: proposal.status + " · synthetic presentation result.", at: decidedAt },
      );
      if (kind === "normal") {
        const followUpAt = timeAfter(run.createdAt, 5);
        run.followUp = { required: false, subject: "", body: "", createdAt: followUpAt, updatedAt: followUpAt };
        run.finalizedAt = timeAfter(run.createdAt, 6);
        run.auditEvents.push(
          { stage: 6, title: "Vendor follow-up", summary: "No message required for this sample case.", at: followUpAt },
          { stage: 7, title: "Run completed", summary: "Synthetic sample run finalized.", at: run.finalizedAt },
        );
      }
    });
    return records;
  }

  function renderDemoDataControls(runs) {
    const panel = document.querySelector("#demo-data-panel");
    if (!panel) return;
    panel.classList.toggle("hidden", !IS_PRESENTATION_MODE);
    if (!IS_PRESENTATION_MODE) return;

    const demoRuns = runs.filter((run) => run.demoCase);
    const normalCount = demoRuns.filter((run) => run.demoKind === "normal").length;
    const edgeCount = demoRuns.filter((run) => run.demoKind === "edge").length;
    const normalButton = document.querySelector("#load-normal-demo");
    const edgeButton = document.querySelector("#load-edge-demo");
    const clearButton = document.querySelector("#clear-demo-data");
    normalButton.disabled = normalCount >= DEMO_DATASET.normalCases.length;
    normalButton.textContent = normalCount ? "Normal portfolio loaded · " + normalCount : "Load 50 normal cases";
    edgeButton.disabled = normalCount < DEMO_DATASET.normalCases.length || edgeCount > 0;
    clearButton.disabled = demoRuns.length === 0;
    document.querySelector("#demo-data-status").textContent = normalCount + " normal sample case(s) and " + edgeCount + " of " + DEMO_DATASET.edgeCases.length + " edge scenario(s) loaded. Dashboard facts are calculated from this browser's saved records.";
  }

  function loadNormalDemoDataset(showMessage = true) {
    const runs = readRuns();
    if (runs.some((run) => run.demoBatchId === DEMO_BATCH_NORMAL)) {
      if (showMessage) showToast("The normal sample portfolio is already loaded.");
      return;
    }
    const records = DEMO_DATASET.normalCases.map((item, index) => makeSyntheticRun(item, index, DEMO_BATCH_NORMAL, "normal"));
    processSyntheticRuns(records, runs, "normal");
    writeRuns(runs.concat(records));
    localStorage.setItem(DEMO_BOOTSTRAP_KEY, "loaded");
    renderQueue();
    if (showMessage) showToast(records.length + " fictional normal cases added to the dashboard.");
  }

  function loadEdgeDemoDataset() {
    const runs = readRuns();
    const normalCount = runs.filter((run) => run.demoBatchId === DEMO_BATCH_NORMAL).length;
    if (normalCount < DEMO_DATASET.normalCases.length) {
      showToast("Load the normal portfolio first, then add the edge cases.");
      return;
    }
    if (runs.some((run) => run.demoBatchId === DEMO_BATCH_EDGE)) {
      showToast("The four edge scenarios are already loaded.");
      return;
    }
    const normalExamples = runs.filter((run) => run.demoBatchId === DEMO_BATCH_NORMAL);
    const records = DEMO_DATASET.edgeCases.map((item, index) => {
      const template = item.duplicateOf === undefined ? item : Object.assign({}, item, {
        country: normalExamples[item.duplicateOf].country,
        taxId: normalExamples[item.duplicateOf].taxId,
        email: normalExamples[item.duplicateOf].email,
      });
      return makeSyntheticRun(template, index, DEMO_BATCH_EDGE, "edge");
    });
    processSyntheticRuns(records, runs, "edge");
    writeRuns(runs.concat(records));
    renderQueue();
    showToast("Four edge cases added: missing document, invalid ID shape, name mismatch, and possible duplicate.");
  }

  function clearDemoDataset() {
    const runs = readRuns();
    const remaining = runs.filter((run) => !run.demoCase);
    const removedCount = runs.length - remaining.length;
    if (!removedCount) return;
    writeRuns(remaining);
    localStorage.setItem(DEMO_BOOTSTRAP_KEY, "cleared");
    renderQueue();
    showToast(removedCount + " synthetic sample case(s) removed. Your manually entered cases remain.");
  }

  function bootstrapLocalDemoDataset() {
    if (!IS_PRESENTATION_MODE || localStorage.getItem(DEMO_BOOTSTRAP_KEY)) return;
    if (readRuns().length === 0 && DEMO_DATASET.normalCases.length >= 50) loadNormalDemoDataset(false);
    localStorage.setItem(DEMO_BOOTSTRAP_KEY, localStorage.getItem(DEMO_BOOTSTRAP_KEY) || "checked");
  }

  function configureWorkspaceEnvironment() {
    const isHosted = !IS_LOCAL_DEMO;
    document.querySelector("#workspace-label").textContent = isHosted ? "HOSTED PREVIEW" : "LOCAL WORKSPACE";
    document.querySelector("#workspace-privacy-label").textContent = isHosted
      ? "Public prototype · use fictional data only"
      : "Private to this browser";
    document.querySelector("#workspace-status-icon").classList.toggle("hidden", isHosted);
    document.querySelector("#hosted-demo-warning").classList.toggle("hidden", !isHosted);
  }

  function documentCountLabel(run) {
    const count = (run.documents || []).length;
    if (run.demoCase) return count + " synthetic evidence record" + (count === 1 ? "" : "s");
    return count + " file" + (count === 1 ? "" : "s");
  }

  function renderQueue() {
    const runs = readRuns().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const body = document.querySelector("#submission-rows");
    const empty = document.querySelector("#empty-state");
    const docTotal = runs.reduce((count, run) => count + (run.documents || []).length, 0);

    document.querySelector("#nav-count").textContent = String(runs.length);
    document.querySelector("#recent-count").textContent = String(runs.length);
    document.querySelector("#metric-total").textContent = String(runs.length);
    document.querySelector("#metric-received").textContent = String(runs.filter((run) => run.status === "Received").length);
    document.querySelector("#metric-documents").textContent = String(docTotal);
    document.querySelector("#table-count").textContent = `Showing ${runs.length} submission${runs.length === 1 ? "" : "s"}`;
    const furthestStage = runs.length ? Math.max(...runs.map((run) => run.stage || 1)) : 1;
    document.querySelector("#workflow-stage").textContent = `Stage ${furthestStage} of 7`;
    document.querySelector("#workflow-progress").style.width = `${Math.max(15, (furthestStage / 7) * 100)}%`;
    document.querySelector("#workflow-note").textContent = runs.length ? `Furthest submission reached stage ${furthestStage}.` : "Submission intake is ready.";
    renderDemoDataControls(runs);

    body.innerHTML = runs.map((run) => `
      <tr>
        <td><div class="vendor-cell"><span class="vendor-avatar">${escapeHtml(initials(run.legalName || "V"))}</span><span>${escapeHtml(run.legalName)}</span>${run.demoCase ? '<span class="demo-row-tag">SAMPLE</span>' : ""}</div></td>
        <td>${escapeHtml(run.country)}</td>
        <td><span class="run-code">${escapeHtml(run.id)}</span></td>
        <td>${escapeHtml(shortDate(run.createdAt))}</td>
        <td><span class="document-count"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5h4l3 3v7.75H5a1 1 0 0 1-1-1v-8.75a1 1 0 0 1 1-1Z"/><path d="M9 3v3h3"/></svg>${escapeHtml(documentCountLabel(run))}</span></td>
        <td><span class="status-badge ${statusClass(run.status)}"><i></i>${escapeHtml(run.status || "Received")}</span></td>
        <td><button class="row-action" type="button" data-open-run="${escapeHtml(run.id)}">View</button></td>
      </tr>`).join("");

    empty.classList.toggle("hidden", runs.length > 0);
    document.querySelector("table").classList.toggle("hidden", runs.length === 0);
    renderOverview();
    renderAnalytics();
    renderOutputs();
    renderCopilotSummary();
  }

  function nextCaseAction(run) {
    if (run.finalizedAt) return null;
    if (!run.extraction) return { title: "Read documents", detail: "Capture fields and source evidence from the packet." };
    if (!run.validation) return { title: "Run completeness checks", detail: "Check required details, formats, and readable files." };
    if (!run.comparison) return { title: "Compare case details", detail: "Check values against the source documents and local history." };
    if (!run.decision) return { title: "Record a decision", detail: "Review the matched values and unresolved signals." };
    if (!run.followUp) {
      return run.decision.status === "Approved"
        ? { title: "Record no follow-up", detail: "The approved case is ready for its final record." }
        : { title: "Prepare a follow-up draft", detail: "Review the outstanding items and draft a vendor request." };
    }
    return { title: "Complete run", detail: "Record the final outcome and activity timeline." };
  }

  function caseActionPriority(run) {
    if (run.decision?.status === "Pending") return 0;
    if (/needs review|needs attention/i.test(run.status || "")) return 1;
    if ((run.stage || 1) >= 5 && !run.followUp) return 2;
    return 3;
  }

  function renderOverview() {
    const runs = readRuns().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const active = runs.filter((run) => !run.finalizedAt);
    const approved = runs.filter((run) => run.decision?.status === "Approved").length;
    const needsReview = runs.filter((run) => run.decision?.status === "Pending" || /needs review|needs attention/i.test(run.status || "")).length;
    document.querySelector("#overview-total").textContent = String(runs.length);
    document.querySelector("#overview-active").textContent = String(active.length);
    document.querySelector("#overview-approved").textContent = String(approved);
    document.querySelector("#overview-review").textContent = String(needsReview);
    document.querySelector("#overview-priority-count").textContent = String(active.length);

    const priorities = active.sort((a, b) => caseActionPriority(a) - caseActionPriority(b) || new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 5);
    document.querySelector("#overview-priorities").innerHTML = priorities.length
      ? priorities.map((run) => {
        const action = nextCaseAction(run);
        return '<article class="overview-case-row"><div class="overview-case-avatar">' + escapeHtml(initials(run.legalName || "V")) + '</div>'
          + '<div class="overview-case-copy"><strong>' + escapeHtml(run.legalName) + '</strong><span>' + escapeHtml(action.title) + ' · ' + escapeHtml(run.status || "Received") + '</span></div>'
          + '<button class="row-action" type="button" data-open-run="' + escapeHtml(run.id) + '">Open</button></article>';
      }).join("")
      : '<div class="overview-empty">No open cases. Start a vendor review to add one to the queue.</div>';
    document.querySelector("#overview-recent").innerHTML = runs.length
      ? runs.slice(0, 5).map((run) => '<article class="overview-case-row"><div class="overview-case-avatar">' + escapeHtml(initials(run.legalName || "V")) + '</div>'
        + '<div class="overview-case-copy"><strong>' + escapeHtml(run.legalName) + '</strong><span>' + escapeHtml(run.country) + ' · ' + escapeHtml(run.status || "Received") + '</span></div>'
        + '<button class="row-action" type="button" data-open-run="' + escapeHtml(run.id) + '">View</button></article>').join("")
      : '<div class="overview-empty">No cases recorded yet. Create a review case to see activity here.</div>';
  }

  function renderAnalyticsBars(container, rows, maxValue) {
    container.innerHTML = rows.map((row) => {
      const width = maxValue ? Math.round((row.value / maxValue) * 100) : 0;
      return '<div class="analytics-bar-row"><div class="analytics-bar-label"><span>' + escapeHtml(row.label) + '</span><strong>' + row.value + '</strong></div>'
        + '<div class="analytics-track"><span class="' + escapeHtml(row.color || "teal") + '" style="width:' + width + '%"></span></div></div>';
    }).join("");
  }

  function casesByMonth(runs, monthsBack = 5) {
    const now = new Date();
    const buckets = [];
    for (let offset = monthsBack; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      buckets.push({
        key,
        label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
        value: 0,
        color: "teal",
      });
    }
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    runs.forEach((run) => {
      const date = new Date(run.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const bucket = byKey.get(key);
      if (bucket) bucket.value += 1;
    });
    return buckets;
  }

  function renderAnalytics() {
    const runs = readRuns();
    const decisions = runs.filter((run) => run.decision);
    const approved = decisions.filter((run) => run.decision.status === "Approved").length;
    const pending = decisions.filter((run) => run.decision.status === "Pending").length;
    const rejected = decisions.filter((run) => run.decision.status === "Rejected").length;
    const active = runs.filter((run) => !run.finalizedAt).length;
    const documentComplete = runs.filter((run) => ["Registration document", "Tax document", "Bank proof"].every((kind) => (run.documents || []).some((document) => document.kind === kind))).length;
    const reviewChecks = runs.flatMap((run) => (run.validation?.checks || []).concat(run.comparison?.checks || []))
      .filter((check) => check.state === "review");
    const signalCounts = new Map();
    reviewChecks.forEach((check) => signalCounts.set(check.label, (signalCounts.get(check.label) || 0) + 1));
    const topSignal = Array.from(signalCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const approvalRate = decisions.length ? Math.round((approved / decisions.length) * 100) : 0;
    const docCoverage = runs.length ? Math.round((documentComplete / runs.length) * 100) : 0;
    const completed = runs.filter((run) => run.finalizedAt).length;
    document.querySelector("#analytics-total").textContent = String(runs.length);
    document.querySelector("#analytics-active").textContent = String(active);
    document.querySelector("#analytics-approval-rate").textContent = approvalRate + "%";
    document.querySelector("#analytics-doc-coverage").textContent = docCoverage + "%";
    document.querySelector("#analytics-insight-summary").textContent = !runs.length
      ? "No submissions are saved in this browser yet. Add or load cases to see workflow performance."
      : decisions.length
        ? `${approved} of ${decisions.length} recorded decisions are Approved (${approvalRate}%). ${pending} Pending; ${active} case${active === 1 ? "" : "s"} still need${active === 1 ? "s" : ""} action.`
        : `${runs.length} submission${runs.length === 1 ? " is" : "s are"} saved, with no decisions recorded yet.`;
    document.querySelector("#analytics-insight-status").textContent = !runs.length ? "NO CASES" : active ? `${active} NEED ACTION` : "ALL CASES CLOSED";
    document.querySelector("#analytics-insight-decisions").textContent = `${decisions.length} decision${decisions.length === 1 ? "" : "s"}`;
    document.querySelector("#analytics-insight-decision-note").textContent = `${approved} Approved · ${pending} Pending · ${rejected} Rejected`;
    const topSignalLabel = document.querySelector("#analytics-insight-top-signal");
    topSignalLabel.textContent = topSignal ? topSignal[0] : "None";
    topSignalLabel.title = topSignal ? topSignal[0] : "No open review flags";
    document.querySelector("#analytics-insight-signal-note").textContent = topSignal
      ? `${topSignal[1]} flag${topSignal[1] === 1 ? "" : "s"} · ${reviewChecks.length} total open flags`
      : "No open review flags";
    document.querySelector("#analytics-insight-closed").textContent = `${completed} / ${runs.length}`;
    document.querySelector("#analytics-insight-closed-note").textContent = `${active} case${active === 1 ? "" : "s"} still active`;
    document.querySelector("#analytics-insight-docs").textContent = docCoverage + "%";
    document.querySelector("#analytics-insight-doc-note").textContent = `${documentComplete} of ${runs.length} cases have all three types`;
    const normalSamples = runs.filter((run) => run.demoKind === "normal");
    const edgeSamples = runs.filter((run) => run.demoKind === "edge");
    document.querySelector("#analytics-normal-count").textContent = String(normalSamples.length);
    document.querySelector("#analytics-edge-count").textContent = String(edgeSamples.length);
    document.querySelector("#analytics-normal-approved").textContent = String(normalSamples.filter((run) => run.decision?.status === "Approved").length);

    const stageNames = ["Intake", "Read", "Validate", "Compare", "Decision", "Follow-up", "Finalize"];
    const stageRows = stageNames.map((label, index) => ({
      label,
      value: runs.filter((run) => (run.stage || 1) >= index + 1).length,
      color: "teal",
    }));
    renderAnalyticsBars(document.querySelector("#analytics-stage-bars"), stageRows, Math.max(runs.length, 1));
    renderAnalyticsBars(document.querySelector("#analytics-outcome-bars"), [
      { label: "Approved", value: approved, color: "approved" },
      { label: "Pending", value: pending, color: "pending" },
      { label: "Rejected", value: rejected, color: "rejected" },
      { label: "Not decided", value: runs.length - decisions.length, color: "neutral" },
    ], Math.max(runs.length, 1));
    renderAnalyticsBars(document.querySelector("#analytics-month-bars"), casesByMonth(runs), Math.max(...casesByMonth(runs).map((row) => row.value), 1));
    const countries = new Map();
    runs.forEach((run) => countries.set(run.country || "Unspecified", (countries.get(run.country || "Unspecified") || 0) + 1));
    const countryRows = Array.from(countries, ([label, value]) => ({ label, value, color: "purple" })).sort((a, b) => b.value - a.value).slice(0, 8);
    renderAnalyticsBars(document.querySelector("#analytics-country-bars"), countryRows, Math.max(...countryRows.map((row) => row.value), 1));
    const edgeRows = DEMO_DATASET.edgeCases.map((scenario) => ({
      label: scenario.scenarioLabel,
      value: edgeSamples.filter((run) => run.demoScenario === scenario.scenario).length,
      color: "pending",
    }));
    renderAnalyticsBars(document.querySelector("#analytics-edge-bars"), edgeRows, Math.max(...edgeRows.map((row) => row.value), 1));

    const reviewSignals = reviewChecks.length;
    document.querySelector("#analytics-review-signal-count").textContent = String(reviewSignals);
    const followUps = runs.filter((run) => run.followUp?.required).length;
    const health = [
      ["Open review signals", String(reviewSignals), "Completeness and comparison checks marked for review"],
      ["Follow-up drafts", String(followUps), "Editable drafts saved locally; none are sent"],
      ["Finalized cases", String(completed), "Decision and audit history recorded"],
    ];
    document.querySelector("#analytics-health-grid").innerHTML = health.map(([label, value, detail]) => '<article class="health-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(detail) + '</small></article>').join("");
  }

  function renderOutputs() {
    const runs = readRuns();
    const decisions = runs.filter((run) => run.decision).sort((a, b) => new Date(b.decision.decidedAt) - new Date(a.decision.decidedAt));
    const approved = decisions.filter((run) => run.decision.status === "Approved").length;
    const pending = decisions.filter((run) => run.decision.status === "Pending").length;
    const rejected = decisions.filter((run) => run.decision.status === "Rejected").length;
    document.querySelector("#outputs-total").textContent = String(decisions.length);
    document.querySelector("#outputs-approved").textContent = String(approved);
    document.querySelector("#outputs-pending").textContent = String(pending);
    document.querySelector("#outputs-rejected").textContent = String(rejected);
    document.querySelector("#outputs-count").textContent = "Showing " + decisions.length + " decision" + (decisions.length === 1 ? "" : "s");
    const ruleBased = decisions.filter((run) => run.decision.source !== "Reviewer override").length;
    const overrides = decisions.length - ruleBased;
    const drafts = runs.filter((run) => run.followUp?.required).length;
    document.querySelector("#outputs-rule-based").textContent = String(ruleBased);
    document.querySelector("#outputs-overrides").textContent = String(overrides);
    document.querySelector("#outputs-drafts").textContent = String(drafts);
    renderAnalyticsBars(document.querySelector("#outputs-decision-bars"), [
      { label: "Approved", value: approved, color: "approved" },
      { label: "Pending", value: pending, color: "pending" },
      { label: "Rejected", value: rejected, color: "rejected" },
    ], Math.max(decisions.length, 1));
    document.querySelector("#output-rows").innerHTML = decisions.map((run) => {
      const followUp = !run.followUp ? (run.decision.status === "Approved" ? "Not required yet" : "Draft not prepared")
        : run.followUp.required ? "Draft saved · not sent" : "Not required";
      return '<tr><td><div class="vendor-cell"><span class="vendor-avatar">' + escapeHtml(initials(run.legalName || "V")) + '</span><span>' + escapeHtml(run.legalName) + '</span>' + (run.demoCase ? '<span class="demo-row-tag">SAMPLE</span>' : "") + '</div></td>'
        + '<td><span class="status-badge ' + statusClass(run.decision.status) + '"><i></i>' + escapeHtml(run.decision.status) + '</span></td>'
        + '<td class="output-reason">' + escapeHtml(run.decision.reason) + '</td><td>' + escapeHtml(followUp) + '</td>'
        + '<td>' + escapeHtml(shortDate(run.decision.decidedAt)) + '</td><td><button class="row-action" type="button" data-open-run="' + escapeHtml(run.id) + '">Details</button></td></tr>';
    }).join("");
    document.querySelector("#outputs-empty").classList.toggle("hidden", decisions.length > 0);
    document.querySelector(".output-table").classList.toggle("hidden", decisions.length === 0);
  }

  function workspaceBrief(runs) {
    const active = runs.filter((run) => !run.finalizedAt);
    const pending = runs.filter((run) => run.decision?.status === "Pending");
    const checks = active.flatMap((run) => (run.validation?.checks || []).concat(run.comparison?.checks || []).filter((check) => check.state === "review"));
    const issueCounts = new Map();
    checks.forEach((check) => issueCounts.set(check.label, (issueCounts.get(check.label) || 0) + 1));
    const topIssue = Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!runs.length) return "No cases are saved yet. Start a review to let the copilot summarize your team's workload and next actions.";
    let brief = runs.length + " case" + (runs.length === 1 ? "" : "s") + " recorded; " + active.length + " still need a workflow action. " + pending.length + " are Pending.";
    brief += topIssue ? " The most frequent open signal is “" + topIssue[0] + "” (" + topIssue[1] + ")." : " No unresolved check signals are recorded for open cases.";
    return brief;
  }

  function renderCopilotSummary() {
    const runs = readRuns().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const active = runs.filter((run) => !run.finalizedAt);
    const pending = runs.filter((run) => run.decision?.status === "Pending");
    const ready = runs.filter((run) => run.decision && run.followUp && !run.finalizedAt);
    document.querySelector("#copilot-total").textContent = String(runs.length);
    document.querySelector("#copilot-active").textContent = String(active.length);
    document.querySelector("#copilot-pending").textContent = String(pending.length);
    document.querySelector("#copilot-ready").textContent = String(ready.length);
    document.querySelector("#workspace-summary").textContent = workspaceBrief(runs);
    renderKnowledgeLibrary();

    const issueCounts = new Map();
    runs.filter((run) => !run.finalizedAt).forEach((run) => {
      (run.validation?.checks || []).concat(run.comparison?.checks || []).filter((check) => check.state === "review")
        .forEach((check) => issueCounts.set(check.label, (issueCounts.get(check.label) || 0) + 1));
    });
    const issues = Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
    document.querySelector("#workspace-issues").innerHTML = issues.length
      ? issues.map(([label, count]) => '<div class="copilot-issue-row"><span>' + escapeHtml(label) + '</span><strong>' + count + '</strong></div>').join("")
      : '<div class="copilot-no-issues">No unresolved review signals in the open cases.</div>';

    const priorityRuns = active.slice().sort((a, b) => caseActionPriority(a) - caseActionPriority(b) || new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 6);
    document.querySelector("#workspace-priorities").innerHTML = priorityRuns.length
      ? priorityRuns.map((run) => {
        const action = nextCaseAction(run);
        return '<article class="copilot-priority-row"><div class="priority-dot ' + statusClass(run.status) + '"></div><div class="copilot-priority-copy"><strong>' + escapeHtml(run.legalName) + '</strong><span>' + escapeHtml(action.title) + '</span><small>' + escapeHtml(run.status || "Received") + '</small></div><button class="row-action" type="button" data-open-run="' + escapeHtml(run.id) + '">Open</button></article>';
      }).join("")
      : '<div class="copilot-no-issues">All recorded cases are finalized. Create a new review when a vendor packet arrives.</div>';
  }

  function countryKnowledge(country) {
    return KNOWLEDGE_BASE.countries.find((entry) => entry.country === country) || null;
  }

  function renderKnowledgeLibrary(preferredCountry) {
    const picker = document.querySelector("#copilot-country-picker");
    const detail = document.querySelector("#copilot-knowledge-detail");
    const intakeCountry = form.elements.country.value;
    const selected = preferredCountry || picker.value || (countryKnowledge(intakeCountry) ? intakeCountry : "");
    if (selected && countryKnowledge(selected)) picker.value = selected;

    document.querySelector("#knowledge-updated").textContent = KNOWLEDGE_BASE.reviewedOn
      ? "Reference pages reviewed " + new Date(KNOWLEDGE_BASE.reviewedOn + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
      : "Curated static references";

    const guide = countryKnowledge(picker.value);
    if (!guide) {
      detail.innerHTML = '<div class="knowledge-empty"><strong>Country guidance will appear here.</strong><span>Pick the vendor\'s country to see the local reference and reviewer cue.</span></div>';
      return;
    }

    const taxValue = form.elements.country.value === guide.country
      ? String(form.elements.taxId.value || "").trim().toUpperCase().replace(/[\s.-]/g, "")
      : "";
    const rule = taxIdRule(guide.country);
    let shapeStatus = "Manual confirmation";
    if (rule && taxValue) shapeStatus = rule.pattern.test(taxValue) ? "Current entry matches the basic shape" : "Current entry needs a format check";
    else if (rule) shapeStatus = "Basic shape check available";
    const sources = guide.sources.length
      ? guide.sources.map((source) => '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(source.title) + '<span aria-hidden="true"> ↗</span></a>').join("")
      : '<span class="knowledge-no-source">No configured source for this location.</span>';
    const documents = KNOWLEDGE_BASE.documents.map((item) => '<article><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.reviewerCue) + '</span></article>').join("");
    detail.innerHTML = '<div class="knowledge-country-result"><div class="knowledge-id-summary"><div class="knowledge-result-top"><div><span class="knowledge-meta-label">IDENTIFIER REFERENCE</span><h3>' + escapeHtml(guide.identifier) + '</h3></div><span class="knowledge-shape-status">' + escapeHtml(shapeStatus) + '</span></div><p class="knowledge-format">' + escapeHtml(guide.format) + '</p><p class="knowledge-review-cue"><strong>Reviewer cue:</strong> ' + escapeHtml(guide.reviewerCue) + '</p><div class="knowledge-source-links"><span class="knowledge-meta-label">OFFICIAL REFERENCES</span>' + sources + '</div></div><div class="knowledge-documents"><span class="knowledge-meta-label">PROTOTYPE PACKET CHECKLIST</span><div class="knowledge-doc-grid">' + documents + '</div></div></div>';
  }

  function countryGuidanceAnswer(country) {
    if (!country) return "Choose a country in the reference library first. The country guide will show its configured identifier hint and official source links.";
    const guide = countryKnowledge(country);
    if (!guide) return "There is no country record for " + country + ". Record the identifier exactly as shown and send it for manual reviewer confirmation.";
    const rule = taxIdRule(country);
    const value = form.elements.country.value === country
      ? String(form.elements.taxId.value || "").trim().toUpperCase().replace(/[\s.-]/g, "")
      : "";
    let result = country + " — " + guide.identifier + ". " + guide.format + " ";
    if (rule && value) result += "The current intake value " + (rule.pattern.test(value) ? "matches" : "does not match") + " the configured basic shape. ";
    else if (!rule) result += "This prototype leaves the format to manual review. ";
    result += guide.reviewerCue;
    if (guide.sources.length) result += " Reference: " + guide.sources.map((source) => source.title).join("; ") + ".";
    return result;
  }

  function answerWorkspaceCopilot(question) {
    const query = String(question || "").toLowerCase();
    const runs = readRuns();
    const pending = runs.filter((run) => run.decision?.status === "Pending");
    const active = runs.filter((run) => !run.finalizedAt);
    const attention = active.filter((run) => /needs review|needs attention/i.test(run.status || "") || run.decision?.status === "Pending");
    const outcomes = ["Approved", "Pending", "Rejected"].map((status) => status + ": " + runs.filter((run) => run.decision?.status === status).length);
    const guideCountry = document.querySelector("#copilot-country-picker").value || form.elements.country.value;
    let answer;
    if (/\b(document|packet|upload|attach|proof|registration document)\b/.test(query)) {
      const attachedKinds = new Set(copilotSnapshot().documents.map((item) => item.kind));
      const missing = KNOWLEDGE_BASE.documents.map((item) => item.name).filter((name) => !attachedKinds.has(name));
      answer = "The prototype packet checklist is: " + KNOWLEDGE_BASE.documents.map((item) => item.name).join(", ") + ". " +
        (missing.length ? "The current new-review form still needs: " + missing.join(", ") + ". " : "All three file types are attached in the new-review form. ") +
        "Compare names and identifiers with the source documents. This checklist supports ASA's review workflow; it is not a universal legal requirement.";
    } else if (/\b(tax|id|identifier|registration id|ein|vat|gstin|pan|abn|uen|business number|format)\b/.test(query)) {
      answer = countryGuidanceAnswer(guideCountry);
    } else if (/\b(pending|follow.?up)\b/.test(query)) {
      answer = pending.length ? pending.map((run) => run.legalName + ": " + (run.decision?.reason || "Pending review") + (run.followUp?.required ? " · follow-up draft saved, not sent." : " · prepare a follow-up draft.")).join(" ") : "There are no Pending decisions in this browser's saved cases.";
    } else if (/\b(attention|issue|block|priority|urgent)\b/.test(query)) {
      answer = attention.length ? attention.map((run) => run.legalName + ": " + (nextCaseAction(run)?.title || "Review case") + " (" + (run.status || "Received") + ").").join(" ") : "No saved cases are currently marked for extra review. Check the priority list for the next workflow actions.";
    } else if (/\b(approved|approval|rejected|outcome|decision)\b/.test(query)) {
      answer = "Recorded outcomes: " + outcomes.join(" · ") + ". Open Decision outputs to review each result and its recorded reason.";
    } else {
      answer = workspaceBrief(runs);
      if (active.length) answer += " The next action for " + active.slice(0, 3).map((run) => run.legalName + " is " + nextCaseAction(run).title).join("; ") + ".";
    }
    document.querySelector("#workspace-copilot-reply").textContent = answer;
  }

  function setView(view) {
    const copy = {
      overview: ["Operations overview", "Track vendor cases, decisions, and the next actions for your team.", "WORKSPACE OVERVIEW"],
      new: ["Start a vendor review", "Record the vendor details and documents your team received.", "NEW REVIEW"],
      queue: ["Review queue", "Open a case to continue its checks, decision, or follow-up.", "CASE QUEUE"],
      analytics: ["Operations analytics", "Understand workflow progress, outcomes, and review workload.", "ANALYTICS"],
      outputs: ["Decision outputs", "Review outcomes, reasons, and follow-up state in one register.", "DECISION REGISTER"],
      copilot: ["Analyst Copilot", "Local help for packet review, country ID guidance, and prioritized case actions.", "COPILOT ASSISTANCE"],
    }[view];
    if (!copy) return;
    document.querySelectorAll(".view").forEach((section) => section.classList.toggle("hidden", section.id !== view + "-view"));
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
    document.querySelector("#page-title").textContent = copy[0];
    document.querySelector("#page-subtitle").textContent = copy[1];
    document.querySelector("#page-stage-label").textContent = copy[2];
    document.querySelector("#heading-action").classList.toggle("hidden", view !== "new");
    renderQueue();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    document.querySelector("#toast-message").textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3400);
  }

  function copilotSnapshot() {
    const data = new FormData(form);
    const fields = [
      ["legalName", "Legal business name"],
      ["country", "Country or region"],
      ["taxId", "Tax or registration ID"],
      ["email", "Primary contact email"],
      ["accountHolder", "Bank account holder"],
    ].map(([name, label]) => ({ name, label, value: String(data.get(name) || "").trim() }));
    const documents = FILE_FIELDS.flatMap(([inputId, kind]) => {
      const file = document.getElementById(inputId).files[0];
      return file ? [{ kind, file }] : [];
    });
    return { fields, documents };
  }

  function updateCopilotReadiness() {
    const snapshot = copilotSnapshot();
    const completed = snapshot.fields.filter((field) => field.value).length;
    const attachedKinds = new Set(snapshot.documents.map((document) => document.kind));
    const missingFields = snapshot.fields.filter((field) => !field.value);
    const missingDocuments = FILE_FIELDS.map(([, kind]) => kind).filter((kind) => !attachedKinds.has(kind));
    const email = snapshot.fields.find((field) => field.name === "email").value;
    const country = snapshot.fields.find((field) => field.name === "country").value;
    const taxId = snapshot.fields.find((field) => field.name === "taxId").value;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    const rule = taxIdRule(country);
    const normalizedTaxId = taxId.toUpperCase().replace(/[\s.-]/g, "");

    document.querySelector("#copilot-field-count").textContent = completed + " / 5";
    document.querySelector("#copilot-document-count").textContent = attachedKinds.size + " / 3";
    document.querySelector("#copilot-read-button").disabled = snapshot.documents.length === 0;

    let guidance;
    if (email && !emailValid) {
      guidance = "Check the vendor contact email format before opening this review case.";
    } else if (taxId && rule && !rule.pattern.test(normalizedTaxId)) {
      guidance = "The vendor ID may not match the basic " + country + " format. Check it against the source before continuing.";
    } else if (missingFields.length) {
      guidance = "Next case action: record the " + missingFields[0].label.toLowerCase() + " from the vendor packet.";
    } else if (missingDocuments.length) {
      guidance = "Details are recorded. Add " + missingDocuments.join(", ") + " so your team can complete the later checks.";
    } else {
      guidance = "The case details and packet are ready. Read the files and confirm any suggested values before creating the review case.";
    }
    document.querySelector("#copilot-guidance").textContent = guidance;
  }

  function copilotFormSummary() {
    const snapshot = copilotSnapshot();
    const missingFields = snapshot.fields.filter((field) => !field.value).map((field) => field.label);
    const attachedKinds = new Set(snapshot.documents.map((document) => document.kind));
    const missingDocuments = FILE_FIELDS.map(([, kind]) => kind).filter((kind) => !attachedKinds.has(kind));
    const email = snapshot.fields.find((field) => field.name === "email").value;
    const country = snapshot.fields.find((field) => field.name === "country").value;
    const taxId = snapshot.fields.find((field) => field.name === "taxId").value;
    const parts = [];

    parts.push("Case intake: " + (5 - missingFields.length) + " of 5 fields recorded" + (missingFields.length ? " (still needed: " + missingFields.join(", ") + ")" : "") + ".");
    if (email) parts.push("Contact email: " + (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "basic shape looks valid." : "check its basic email format."));
    if (taxId && country) {
      const rule = taxIdRule(country);
      if (!rule) {
        parts.push("Tax ID: this prototype has no format rule for " + country + ", so it needs manual confirmation.");
      } else {
        const normalized = taxId.toUpperCase().replace(/[\s.-]/g, "");
        parts.push("Tax ID: " + (rule.pattern.test(normalized) ? "matches the configured basic shape. " : "does not match the configured basic shape. ") + rule.description);
      }
    }
    parts.push("Supporting documents: " + (3 - missingDocuments.length) + " of 3 attached" + (missingDocuments.length ? " (still needed for later checks: " + missingDocuments.join(", ") + ")" : "."));
    parts.push("These are triage hints for your review team; they do not verify the vendor or decide approval.");
    return parts.join(" ");
  }

  function answerCopilot(question) {
    const query = String(question || "").trim().toLowerCase();
    const snapshot = copilotSnapshot();
    const country = snapshot.fields.find((field) => field.name === "country").value;
    const taxId = snapshot.fields.find((field) => field.name === "taxId").value;
    let answer;

    if (!query) return;
    if (/\b(document|upload|attach|file|proof|registration document)\b/.test(query)) {
      const attachedKinds = new Set(snapshot.documents.map((document) => document.kind));
      const missing = FILE_FIELDS.map(([, kind]) => kind).filter((kind) => !attachedKinds.has(kind));
      answer = "The ASA prototype packet checklist is: " + KNOWLEDGE_BASE.documents.map((item) => item.name).join(", ") + ". " +
        (missing.length ? "Still missing: " + missing.join(", ") + ". " : "All three document types are attached. ") +
        "Compare the name and ID values with their source documents. Selectable-text PDF, DOCX, TXT, and CSV files can be read; scanned PDFs or images need manual review because OCR is not included.";
    } else if (/\b(tax|id|identifier|registration id|ein|vat|gstin|pan|abn|uen|business number)\b/.test(query)) {
      const rule = taxIdRule(country);
      if (!country) {
        answer = "Choose the vendor's country first to see the configured basic ID shape. This helps your team spot typos; it does not verify the ID with a government registry.";
      } else if (!rule) {
        answer = "There is no configured format rule for " + country + " in this prototype. Enter the value exactly as shown on the source document and have a reviewer confirm it.";
      } else if (!taxId) {
        answer = country + ": " + rule.description + " Compare the value with the vendor's source document; this is only a syntax hint. Reference: " + (rule.source?.title || "official guidance") + ".";
      } else {
        const normalized = taxId.toUpperCase().replace(/[\s.-]/g, "");
        answer = country + ": " + (rule.pattern.test(normalized) ? "the current value matches" : "the current value does not match") + " the configured basic shape. " + rule.description + " Confirm it against the source document. Reference: " + (rule.source?.title || "official guidance") + ".";
      }
    } else if (/\b(how|process|workflow|help your team|what can you do)\b/.test(query)) {
      answer = "For the ASA onboarding team: I read labelled values from the incoming packet and show their source; after the case is created, the workflow compares those values and flags gaps; for Pending or Rejected outcomes, it can prepare a follow-up draft for an analyst to review. Your team makes the decision.";
    } else if (/\b(check|review|ready|complete|missing|next)\b/.test(query)) {
      answer = copilotFormSummary() + " Read the packet for source-linked suggestions, then choose the next review action.";
    } else if (/\b(private|privacy|local|online|internet|data|account|free|cost|api|ai)\b/.test(query)) {
      answer = "This analyst copilot uses local rules and the document reader on this device. No account or API key is needed. Selected files go only to the local reader at 127.0.0.1; no external AI service is used.";
    } else if (/\b(fill|suggest|read|extract|prefill)\b/.test(query)) {
      answer = snapshot.documents.length
        ? "Choose “Review packet and suggest fields.” I will show detected values with their source and evidence. You decide whether to apply each suggestion."
        : "Attach a supported vendor document first, then choose “Review packet and suggest fields.” No field is filled until you choose a suggestion.";
    } else if (/\b(account number|bank number|routing number)\b/.test(query)) {
      answer = "Do not enter an account number in this prototype. The bank account holder field should contain the name shown on the bank proof.";
    } else {
      answer = "I can help your team check required evidence, review an ID format, see case completeness, or read the packet for source-linked suggestions. Try one of those topics.";
    }
    document.querySelector("#copilot-reply").textContent = answer;
  }

  function comparableCopilotValue(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function renderCopilotSuggestions(documents) {
    const results = document.querySelector("#copilot-doc-results");
    const groups = new Map();
    documents.forEach((document) => {
      (document.fields || []).forEach((field) => {
        if (!field.key || !field.value) return;
        const candidates = groups.get(field.key) || [];
        candidates.push({
          key: field.key,
          label: field.label || field.key,
          value: field.value,
          evidence: field.evidence || "",
          kind: document.kind || "Supporting document",
          filename: document.filename || "Attached document",
          page: field.page,
        });
        groups.set(field.key, candidates);
      });
    });

    if (!groups.size) {
      results.innerHTML = '<div class="copilot-result-note">No labelled fields were found. Enter values manually, or use readable files with labels such as “Legal business name:” or “Tax ID:”. Scanned images need OCR, which is not included.</div>';
      return 0;
    }

    results.innerHTML = Array.from(groups.values()).map((candidates) => {
      const uniqueValues = new Set(candidates.map((candidate) => comparableCopilotValue(candidate.value)));
      const hasConflict = uniqueValues.size > 1;
      return '<section class="copilot-suggestion-group' + (hasConflict ? ' has-conflict' : '') + '">'
        + '<div class="copilot-suggestion-title"><strong>' + escapeHtml(candidates[0].label) + '</strong><span>' + (hasConflict ? "COMPARE VALUES" : candidates.length + (candidates.length === 1 ? " SOURCE" : " SOURCES")) + '</span></div>'
        + candidates.map((candidate) => '<article class="copilot-suggestion">'
          + '<div><strong>' + escapeHtml(candidate.value) + '</strong><small>' + escapeHtml(candidate.kind) + ' · ' + escapeHtml(candidate.filename) + (candidate.page ? ' · page ' + escapeHtml(candidate.page) : '') + '</small>'
          + (candidate.evidence ? '<blockquote>' + escapeHtml(candidate.evidence) + '</blockquote>' : '') + '</div>'
          + '<button type="button" data-copilot-apply="' + escapeHtml(candidate.key) + '" data-copilot-value="' + escapeHtml(candidate.value) + '">Use</button>'
          + '</article>').join("")
        + (hasConflict ? '<p class="copilot-conflict-note">The documents show different values. Compare the source files before choosing one.</p>' : '')
        + '</section>';
    }).join("");
    return Array.from(groups.values()).reduce((count, candidates) => count + candidates.length, 0);
  }

  async function readCopilotDocuments() {
    const snapshot = copilotSnapshot();
    const button = document.querySelector("#copilot-read-button");
    const reply = document.querySelector("#copilot-reply");
    const results = document.querySelector("#copilot-doc-results");
    if (!snapshot.documents.length) {
      reply.textContent = "Attach at least one document before asking me to read it.";
      return;
    }
    const tooLarge = snapshot.documents.find((document) => document.file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      reply.textContent = tooLarge.file.name + " is over the 10 MB per-file limit.";
      return;
    }

    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Reading on this device...";
    reply.textContent = "The local reader is checking the attached files. Values will appear with their source so you can confirm them.";
    results.innerHTML = '<div class="copilot-result-note">Reading the selected documents locally...</div>';
    try {
      const payload = new FormData();
      payload.append("run_id", "DRAFT-" + Date.now());
      snapshot.documents.forEach(({ kind, file }) => {
        payload.append("files", file, file.name);
        payload.append("kinds", kind);
      });
      const response = await fetch(API_BASE + "/api/extract", { method: "POST", body: payload });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseBody.detail || "Local reader returned " + response.status + ".");

      const suggestions = renderCopilotSuggestions(responseBody.documents || []);
      const needsManualReview = (responseBody.documents || []).filter((document) => document.status !== "read").length;
      reply.textContent = suggestions
        ? "Found " + suggestions + " labelled value" + (suggestions === 1 ? "" : "s") + ". Review each source and choose Use only for values you confirm." + (needsManualReview ? " Some files need manual review or OCR." : "")
        : "I couldn't find labelled values in the readable text. Enter them manually and check any scanned files yourself.";
    } catch (error) {
      results.innerHTML = "";
      reply.textContent = (error.message || "The local reader could not open these files.") + " Keep the local app running at 127.0.0.1:8000 and try again.";
    } finally {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }

  function recordAudit(run, stage, title, summary, at) {
    if (!Array.isArray(run.auditEvents)) run.auditEvents = [];
    run.auditEvents.push({ stage, title, summary, at: at || new Date().toISOString() });
  }

  function renderReportInsights(run) {
    const validationChecks = run.validation?.checks || [];
    const comparisonChecks = run.comparison?.checks || [];
    const reviewChecks = validationChecks.concat(comparisonChecks).filter((check) => check.state === "review");
    const documentKinds = new Set((run.documents || []).map((item) => item.kind));
    const documentCoverage = Math.min(3, documentKinds.size);
    const metrics = [
      { label: "Completeness passed", passed: validationChecks.filter((check) => check.state !== "review").length, total: validationChecks.length },
      { label: "Evidence checks matched", passed: comparisonChecks.filter((check) => check.state !== "review").length, total: comparisonChecks.length },
      { label: "Document types attached", passed: documentCoverage, total: 3 },
    ];
    const status = run.decision?.status || (reviewChecks.length ? "Review needed" : run.status || "In progress");
    const summary = run.decision?.reason || (reviewChecks.length
      ? `${reviewChecks.length} review flag${reviewChecks.length === 1 ? "" : "s"}: ${reviewChecks[0].label}. ${reviewChecks[0].detail}`
      : "No review flags are recorded yet. Continue the workflow to build the full report.");
    document.querySelector("#report-insight-status").textContent = status;
    document.querySelector("#report-insight-status").className = `report-insight-status ${statusClass(status)}`;
    document.querySelector("#report-insight-bars").innerHTML = metrics.map((metric) => {
      const percentage = metric.total ? Math.round((metric.passed / metric.total) * 100) : 0;
      const value = metric.total ? `${metric.passed} / ${metric.total}` : "Not run";
      const detail = metric.total ? `${percentage}%` : "Complete the previous stage first";
      return `<div class="report-insight-metric"><div class="report-insight-metric-label"><span>${escapeHtml(metric.label)}</span><strong>${value}</strong></div><div class="report-insight-track" role="img" aria-label="${escapeHtml(metric.label)}: ${escapeHtml(detail)}"><i style="width:${percentage}%"></i></div></div>`;
    }).join("");
    document.querySelector("#report-insight-summary").textContent = summary;
  }

  function showRunDetails(runId) {
    const run = readRuns().find((item) => item.id === runId);
    if (!run) return;
    document.querySelector("#dialog-title").textContent = run.legalName;
    document.querySelector("#dialog-run-id").textContent = run.id;
    document.querySelector("#dialog-created").textContent = fullDate(run.createdAt);
    const demoBanner = document.querySelector("#demo-case-banner");
    demoBanner.classList.toggle("hidden", !run.demoCase);
    demoBanner.textContent = run.demoCase
      ? "Synthetic presentation case. The extracted evidence and stage results are simulated; no source-file bytes are attached."
      : "";
    const details = [
      ["Country / region", run.country],
      ["Tax / registration ID", run.taxId],
      ["Contact email", run.email],
      ["Bank account holder", run.accountHolder],
    ];
    document.querySelector("#dialog-details").innerHTML = details.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
    const docs = run.documents || [];
    document.querySelector("#dialog-doc-list").innerHTML = docs.length
      ? docs.map((doc) => `<div class="dialog-doc-item"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5h4l3 3v7.75H5a1 1 0 0 1-1-1v-8.75a1 1 0 0 1 1-1Z"/><path d="M9 3v3h3"/></svg><span>${escapeHtml(doc.kind)} · ${escapeHtml(doc.name)} · ${formatSize(doc.size)}</span></div>`).join("")
      : '<p class="dialog-doc-empty">No documents attached to this submission.</p>';
    if (run.demoCase) {
      [...document.querySelectorAll("#dialog-doc-list .dialog-doc-item span")].forEach((label, index) => {
        label.textContent = docs[index].kind + " · Synthetic evidence record; no file attached";
      });
    }
    renderReportInsights(run);
    const progress = [...document.querySelectorAll("#dialog-progress span")];
    const currentStage = run.stage || 1;
    progress.forEach((step, index) => {
      step.classList.toggle("done", index < currentStage);
      step.classList.toggle("active", index === currentStage && currentStage < progress.length);
    });
    document.querySelector(".dialog-stage").textContent = currentStage >= 7
      ? "Stage 7 complete · Final output recorded in run history"
      : currentStage >= 6
        ? "Stage 6 complete · Ready to finalize the run"
        : currentStage >= 5
          ? "Stage 5 complete · Ready to prepare vendor follow-up"
          : currentStage >= 4
            ? "Stage 4 complete · Ready for the onboarding decision"
      : currentStage >= 3
        ? "Stage 3 complete · Ready for cross-document comparison"
        : currentStage >= 2
          ? "Stage 2 complete · Review extracted fields and source evidence"
          : "Stage 1 complete · Ready for information extraction";
    const badge = document.querySelector("#dialog-status");
    badge.className = `status-badge ${statusClass(run.status)}`;
    badge.innerHTML = `<i></i>${escapeHtml(run.status || "Received")}`;
    document.querySelector("#extract-button").dataset.runId = run.id;
    renderExtraction(run);
    document.querySelector("#validate-button").dataset.runId = run.id;
    renderValidation(run);
    document.querySelector("#compare-button").dataset.runId = run.id;
    renderComparison(run);
    document.querySelector("#decision-button").dataset.runId = run.id;
    renderDecision(run);
    document.querySelector("#followup-button").dataset.runId = run.id;
    renderFollowUp(run);
    document.querySelector("#finalize-button").dataset.runId = run.id;
    renderFinalization(run);
    if (!dialog.open) dialog.showModal();
  }

  function renderExtraction(run) {
    const status = document.querySelector("#extraction-status");
    const results = document.querySelector("#extraction-results");
    const button = document.querySelector("#extract-button");
    const extraction = run.extraction;
    if (!extraction) {
      status.textContent = (run.documents || []).length
        ? "Documents have not been read yet."
        : "No documents are attached to this submission.";
      button.textContent = "Read documents";
      button.disabled = false;
      results.innerHTML = "";
      return;
    }

    const readCount = extraction.documents.filter((doc) => doc.status === "read").length;
    status.textContent = extraction.documents.length
      ? `${readCount} of ${extraction.documents.length} document${extraction.documents.length === 1 ? "" : "s"} readable · ${fullDate(extraction.processedAt)}`
      : `No documents attached · ${fullDate(extraction.processedAt)}`;
    button.innerHTML = run.demoCase ? "Synthetic evidence" : 'Read again <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>';
    button.disabled = Boolean(run.demoCase);
    if (run.demoCase) status.textContent = `${readCount} synthetic evidence record${readCount === 1 ? "" : "s"} shown; no files attached.`;
    results.innerHTML = extraction.documents.length ? extraction.documents.map((doc) => {
      const fields = (doc.fields || []).map((field) => `
        <div class="extracted-field">
          <div class="extracted-field-top"><strong>${escapeHtml(field.label)}</strong><span>${field.page ? `Page ${escapeHtml(field.page)}` : "Document text"} · ${escapeHtml(field.method || "Text match")}</span></div>
          <div class="extracted-value">${escapeHtml(field.value)}</div>
          <blockquote>${escapeHtml(field.evidence)}</blockquote>
        </div>`).join("");
      const preview = doc.preview && !fields
        ? `<details class="extract-preview"><summary>Show text preview</summary><pre>${escapeHtml(doc.preview)}</pre></details>`
        : "";
      return `
        <article class="extract-doc">
          <div class="extract-doc-head">
            <div class="extract-doc-title"><strong>${escapeHtml(doc.kind)} · ${escapeHtml(doc.filename)}</strong><small>${doc.pageCount ? `${escapeHtml(doc.pageCount)} page${doc.pageCount === 1 ? "" : "s"}` : "Attachment"} · ${escapeHtml(doc.textCharacters || 0)} characters read</small></div>
            <span class="extract-doc-state ${escapeHtml(doc.status)}">${doc.status === "read" ? "READ" : doc.status === "needs_ocr" ? "OCR NEEDED" : doc.status === "unsupported" ? "UNSUPPORTED" : "UNREADABLE"}</span>
          </div>
          ${doc.message ? `<p class="extract-doc-message">${escapeHtml(doc.message)}</p>` : ""}
          ${fields ? `<div class="extracted-fields">${fields}</div>` : ""}
          ${preview}
        </article>`;
    }).join("") : '<div class="extraction-empty">No files were attached. Stage 2 recorded this so the completeness checks can flag the missing documents.</div>';
  }

  function makeCheck(label, state, detail) {
    return { label, state, detail };
  }

  function taxIdRule(country) {
    const guide = countryKnowledge(country);
    return guide?.pattern ? { pattern: new RegExp(guide.pattern), description: guide.ruleDescription, source: guide.sources[0] || null } : null;
  }

  function evaluateRun(run) {
    const fields = [
      ["Legal business name", run.legalName],
      ["Country or region", run.country],
      ["Tax or registration ID", run.taxId],
      ["Primary contact email", run.email],
      ["Bank account holder", run.accountHolder],
    ];
    const missingFields = fields.filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
    const checks = [makeCheck(
      "Required vendor details",
      missingFields.length ? "review" : "pass",
      missingFields.length ? `Missing: ${missingFields.join(", ")}.` : "All five required intake fields are present.",
    )];

    const email = String(run.email || "").trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    checks.push(makeCheck(
      "Contact email format",
      validEmail ? "pass" : "review",
      validEmail ? "The contact address has a basic email shape." : "The contact email is missing or does not match a basic email shape.",
    ));

    const taxId = String(run.taxId || "").trim().toUpperCase().replace(/[\s.-]/g, "");
    const rule = taxIdRule(run.country);
    if (!taxId) {
      checks.push(makeCheck("Tax or registration ID format", "review", "No ID was supplied."));
    } else if (!rule) {
      checks.push(makeCheck("Tax or registration ID format", "review", `No format rule is configured for ${run.country || "this country"}; confirm the ID manually.`));
    } else {
      checks.push(makeCheck(
        "Tax or registration ID format",
        rule.pattern.test(taxId) ? "pass" : "review",
        rule.pattern.test(taxId) ? rule.description : `The value does not match this basic shape. ${rule.description}`,
      ));
    }

    const requiredDocuments = ["Registration document", "Tax document", "Bank proof"];
    const attachedKinds = (run.documents || []).map((document) => document.kind);
    const missingDocuments = requiredDocuments.filter((kind) => !attachedKinds.includes(kind));
    checks.push(makeCheck(
      "Required supporting documents",
      missingDocuments.length ? "review" : "pass",
      missingDocuments.length ? `Missing: ${missingDocuments.join(", ")}.` : "Registration, tax, and bank-proof documents are attached.",
    ));

    const extractedDocuments = run.extraction?.documents || [];
    const unreadableDocuments = extractedDocuments.filter((document) => document.status !== "read");
    const allFilesRead = (run.documents || []).length > 0
      && extractedDocuments.length === (run.documents || []).length
      && unreadableDocuments.length === 0;
    const readabilityDetail = !(run.documents || []).length
      ? "No documents were attached, so there is no document text to read."
      : unreadableDocuments.length
        ? `${unreadableDocuments.length} attachment(s) need manual review or OCR.`
        : "Text was read from every attached document.";
    checks.push(makeCheck("Document text readability", allFilesRead ? "pass" : "review", readabilityDetail));

    return checks;
  }

  function renderValidation(run) {
    const button = document.querySelector("#validate-button");
    const status = document.querySelector("#validation-status");
    const results = document.querySelector("#validation-results");
    const validation = run.validation;
    if (!validation) {
      button.disabled = (run.stage || 1) < 2;
      button.textContent = "Run checks";
      status.textContent = button.disabled ? "Read or record the document stage first." : "Ready to check required details, formats, and documents.";
      results.innerHTML = button.disabled
        ? '<div class="validation-empty">Complete Stage 2 first. If there are no attachments, use “Read documents” to record that and continue.</div>'
        : "";
      return;
    }

    const reviewCount = validation.checks.filter((check) => check.state === "review").length;
    const passCount = validation.checks.length - reviewCount;
    status.textContent = `Completed ${fullDate(validation.checkedAt)} · ${passCount} passed, ${reviewCount} need review.`;
    button.disabled = false;
    button.textContent = "Run checks again";
    results.innerHTML = `
      <div class="validation-summary ${reviewCount ? "review" : ""}">
        <strong>${reviewCount ? "Review needed" : "All configured checks passed"}</strong>
        <span>This is a completeness and syntax result, not an onboarding approval.</span>
      </div>
      <div class="validation-checks">${validation.checks.map((check) => `
        <article class="validation-check ${check.state === "review" ? "review" : "pass"}">
          <span class="check-mark">${check.state === "review" ? "!" : "✓"}</span>
          <div class="validation-check-copy"><strong>${escapeHtml(check.label)}</strong><p>${escapeHtml(check.detail)}</p></div>
          <span class="check-state">${check.state === "review" ? "REVIEW" : "PASS"}</span>
        </article>`).join("")}</div>`;
  }

  function runValidation(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0) return;
    if ((runs[index].stage || 1) < 2) {
      renderValidation(runs[index]);
      return;
    }

    const checks = evaluateRun(runs[index]);
    const reviewCount = checks.filter((check) => check.state === "review").length;
    runs[index].validation = { checkedAt: new Date().toISOString(), checks };
    delete runs[index].comparison;
    delete runs[index].decision;
    delete runs[index].followUp;
    delete runs[index].finalizedAt;
    runs[index].stage = 3;
    runs[index].status = reviewCount ? "Checks need attention" : "Checks complete";
    recordAudit(runs[index], 3, "Completeness and format checks", checks.length - reviewCount + " passed; " + reviewCount + " need review.", runs[index].validation.checkedAt);
    writeRuns(runs);
    renderQueue();
    showRunDetails(runId);
    showToast(reviewCount ? `${reviewCount} check(s) need review.` : "All configured Stage 3 checks passed.");
  }

  function normalizeComparable(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function normalizeCountry(value) {
    const normalized = normalizeComparable(value);
    const aliases = {
      us: "unitedstates",
      usa: "unitedstates",
      unitedstatesofamerica: "unitedstates",
      uk: "unitedkingdom",
      gb: "unitedkingdom",
      greatbritain: "unitedkingdom",
    };
    return aliases[normalized] || normalized;
  }

  function extractedCandidates(run, fieldKey, allowedKinds) {
    return (run.extraction?.documents || [])
      .filter((document) => allowedKinds.includes(document.kind))
      .flatMap((document) => (document.fields || [])
        .filter((field) => field.key === fieldKey)
        .map((field) => Object.assign({}, field, { sourceKind: document.kind, sourceName: document.filename })));
  }

  function evidenceLabel(candidate) {
    const location = candidate.page ? "page " + candidate.page : "document text";
    return candidate.sourceKind + " · " + candidate.sourceName + " · " + location + ": " + candidate.evidence;
  }

  function compareSubmittedField(run, label, submittedValue, fieldKey, allowedKinds, normalizer) {
    const candidates = extractedCandidates(run, fieldKey, allowedKinds);
    const supplied = String(submittedValue || "").trim();
    if (!candidates.length) {
      return makeCheck(label, "review", "No labelled " + label.toLowerCase() + " was extracted from " + allowedKinds.join(" or ") + ".");
    }
    if (!supplied) {
      return makeCheck(label, "review", "The submitted " + label.toLowerCase() + " is missing.");
    }
    const normalize = normalizer || normalizeComparable;
    const suppliedNormalized = normalize(supplied);
    if (!suppliedNormalized) {
      return makeCheck(label, "review", "The submitted " + label.toLowerCase() + " could not be normalized for comparison.");
    }
    const mismatches = candidates.filter((candidate) => normalize(candidate.value) !== suppliedNormalized);
    const sources = candidates.map(evidenceLabel).join(" | ");
    if (!mismatches.length) {
      const check = makeCheck(label, "pass", "All extracted values match the submission.");
      check.evidence = sources;
      return check;
    }
    const values = mismatches.map((candidate) => candidate.value + " (" + candidate.sourceName + ")").join("; ");
    const check = makeCheck(label, "review", "The submission says \"" + supplied + "\"; extracted value(s) differ: " + values + ".");
    check.evidence = sources;
    return check;
  }

  function compareCompanyAndBankNames(run) {
    const legalNames = extractedCandidates(run, "legalName", ["Registration document"]);
    const accountHolders = extractedCandidates(run, "accountHolder", ["Bank proof"]);
    if (!legalNames.length || !accountHolders.length) {
      return makeCheck(
        "Registered name vs bank account holder",
        "review",
        "A name could not be read from the registration document or bank proof, so this comparison needs manual review.",
      );
    }
    const normalizedLegal = normalizeComparable(run.legalName);
    const normalizedHolders = normalizeComparable(run.accountHolder);
    const normalizedDocumentNames = legalNames.map((field) => normalizeComparable(field.value));
    const normalizedDocumentHolders = accountHolders.map((field) => normalizeComparable(field.value));
    const matches = normalizedLegal && normalizedHolders && normalizedLegal === normalizedHolders
      && normalizedDocumentNames.every((value) => value === normalizedLegal)
      && normalizedDocumentHolders.every((value) => value === normalizedHolders);
    const evidence = legalNames.concat(accountHolders).map(evidenceLabel).join(" | ");
    const check = matches
      ? makeCheck("Registered name vs bank account holder", "pass", "The submitted names and extracted document names match after ignoring case and punctuation.")
      : makeCheck("Registered name vs bank account holder", "review", "The registered business name and bank account holder differ. Confirm whether the difference is expected.");
    check.evidence = evidence;
    return check;
  }

  function evaluateComparison(run, allRuns) {
    const checks = [
      compareSubmittedField(run, "Legal business name", run.legalName, "legalName", ["Registration document"]),
      compareSubmittedField(run, "Bank account holder", run.accountHolder, "accountHolder", ["Bank proof"]),
      compareSubmittedField(run, "Tax or registration ID", run.taxId, "taxId", ["Tax document", "Registration document"], normalizeComparable),
      compareSubmittedField(run, "Country or region", run.country, "country", ["Registration document", "Tax document"], normalizeCountry),
      compareCompanyAndBankNames(run),
    ];

    const valuesByField = new Map();
    for (const document of run.extraction?.documents || []) {
      for (const field of document.fields || []) {
        const values = valuesByField.get(field.key) || new Map();
        const normalizer = field.key === "country" ? normalizeCountry : normalizeComparable;
        const normalized = normalizer(field.value);
        if (normalized) {
          const source = evidenceLabel(Object.assign({}, field, { sourceKind: document.kind, sourceName: document.filename }));
          values.set(normalized, { value: field.value, source: source });
        }
        valuesByField.set(field.key, values);
      }
    }
    const conflicts = Array.from(valuesByField.entries()).filter((entry) => entry[1].size > 1);
    if (conflicts.length) {
      const detail = conflicts.map((entry) => {
        const key = entry[0];
        const items = Array.from(entry[1].values());
        const label = items[0]?.source.split(" · ")[0] || key;
        return label + ": " + items.map((item) => item.value + " (" + item.source.split(" · ")[1] + ")").join(" vs ");
      }).join("; ");
      checks.push(makeCheck("Conflicting values across documents", "review", detail));
    } else {
      const valueCount = Array.from(valuesByField.values()).reduce((sum, values) => sum + values.size, 0);
      checks.push(makeCheck(
        "Conflicting values across documents",
        valueCount ? "pass" : "review",
        valueCount ? "No conflicting values were found among the extracted fields." : "No field-level values were extracted to compare across documents.",
      ));
    }

    const currentTaxId = normalizeComparable(run.taxId);
    const currentName = normalizeComparable(run.legalName);
    const currentCountry = normalizeCountry(run.country);
    const currentEmail = String(run.email || "").trim().toLowerCase();
    const possibleDuplicates = allRuns
      .filter((other) => other.id !== run.id)
      .map((other) => {
        const reasons = [];
        const sameCountry = currentCountry && normalizeCountry(other.country) === currentCountry;
        if (currentTaxId && sameCountry && normalizeComparable(other.taxId) === currentTaxId) reasons.push("same country and tax ID");
        if (currentName && sameCountry && normalizeComparable(other.legalName) === currentName) reasons.push("same country and legal name");
        if (currentEmail && String(other.email || "").trim().toLowerCase() === currentEmail) reasons.push("same contact email");
        return reasons.length ? { id: other.id, legalName: other.legalName, reasons: reasons } : null;
      })
      .filter(Boolean);
    const duplicateDetail = possibleDuplicates.length
      ? possibleDuplicates.map((item) => item.legalName + " (" + item.id + "; " + item.reasons.join(", ") + ")").join(" | ")
      : "No matching tax ID, legal name, or contact email was found in this browser's submission history.";
    checks.push(makeCheck(
      "Possible duplicate submission",
      possibleDuplicates.length ? "review" : "pass",
      duplicateDetail,
    ));
    return checks;
  }

  function renderComparison(run) {
    const button = document.querySelector("#compare-button");
    const status = document.querySelector("#comparison-status");
    const results = document.querySelector("#comparison-results");
    const comparison = run.comparison;
    if (!comparison) {
      button.disabled = (run.stage || 1) < 3;
      button.textContent = "Compare details";
      status.textContent = button.disabled ? "Complete Stage 3 checks first." : "Ready to compare extracted fields and local submission history.";
      results.innerHTML = button.disabled
        ? '<div class="validation-empty">Run the completeness and format checks first.</div>'
        : "";
      return;
    }

    const reviewCount = comparison.checks.filter((check) => check.state === "review").length;
    const passCount = comparison.checks.length - reviewCount;
    status.textContent = "Completed " + fullDate(comparison.checkedAt) + " · " + passCount + " matched, " + reviewCount + " need review.";
    button.disabled = false;
    button.textContent = "Compare again";
    const checkHtml = comparison.checks.map((check) => {
      const evidence = check.evidence
        ? '<blockquote class="comparison-evidence">' + escapeHtml(check.evidence) + '</blockquote>'
        : "";
      return '<article class="comparison-check ' + (check.state === "review" ? "review" : "pass") + '">'
        + '<div class="comparison-check-top"><strong>' + escapeHtml(check.label) + '</strong><span>' + (check.state === "review" ? "REVIEW" : "MATCH") + '</span></div>'
        + '<p>' + escapeHtml(check.detail) + '</p>' + evidence + '</article>';
    }).join("");
    results.innerHTML = '<div class="comparison-summary ' + (reviewCount ? "review" : "") + '">'
      + '<strong>' + (reviewCount ? "Review mismatches or possible duplicates" : "No mismatches found in the available evidence") + '</strong>'
      + '<span>Compare each value and evidence line before moving to the decision stage.</span>'
      + '</div><div class="comparison-checks">' + checkHtml + '</div>';
  }

  function runComparison(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0) return;
    if ((runs[index].stage || 1) < 3) {
      renderComparison(runs[index]);
      return;
    }
    const checks = evaluateComparison(runs[index], runs);
    const reviewCount = checks.filter((check) => check.state === "review").length;
    runs[index].comparison = { checkedAt: new Date().toISOString(), checks: checks };
    delete runs[index].decision;
    delete runs[index].followUp;
    delete runs[index].finalizedAt;
    runs[index].stage = 4;
    runs[index].status = reviewCount ? "Comparison needs review" : "Comparison complete";
    recordAudit(runs[index], 4, "Cross-document comparison", checks.length - reviewCount + " matched; " + reviewCount + " need review.", runs[index].comparison.checkedAt);
    writeRuns(runs);
    renderQueue();
    showRunDetails(runId);
    showToast(reviewCount ? reviewCount + " comparison item(s) need review." : "No mismatches found in the available evidence.");
  }

  function automaticDecision(run) {
    const checks = (run.validation?.checks || []).concat(run.comparison?.checks || []);
    const reviewItems = checks.filter((check) => check.state === "review");
    if (!checks.length) {
      return { status: "Pending", reason: "Required completeness and comparison results are not available.", reviewItems: [] };
    }
    if (!reviewItems.length) {
      return { status: "Approved", reason: "All configured completeness, format, and comparison checks passed.", reviewItems: [] };
    }
    const reasons = reviewItems.map((check) => check.label + ": " + check.detail);
    return { status: "Pending", reason: "Review required: " + reasons.join(" | "), reviewItems: reviewItems };
  }

  function renderDecision(run) {
    const button = document.querySelector("#decision-button");
    const status = document.querySelector("#decision-status");
    const hint = document.querySelector("#decision-hint");
    const results = document.querySelector("#decision-results");
    const override = document.querySelector("#decision-override");
    const reason = document.querySelector("#decision-reason");
    const ready = (run.stage || 1) >= 4;
    button.disabled = !ready;
    override.disabled = !ready;
    reason.disabled = !ready;
    if (!ready) {
      override.value = "";
      reason.value = "";
      reason.required = false;
      status.textContent = "Complete Stage 4 comparison first.";
      hint.textContent = "The rule-based decision uses the Stage 3 and Stage 4 results.";
      button.textContent = "Make decision";
      results.innerHTML = '<div class="validation-empty">Run the completeness checks and compare the submission before deciding.</div>';
      return;
    }

    const decision = run.decision;
    if (!decision) {
      const proposed = automaticDecision(run);
      override.value = "";
      reason.value = "";
      reason.required = Boolean(override.value);
      status.textContent = "Rule-based result: " + proposed.status + " · Select an override only after reviewer assessment.";
      hint.textContent = override.value
        ? "A reviewer override needs a clear reason and will be recorded in the audit history."
        : "Any unresolved check produces Pending. Rejection is available only as a reasoned reviewer override.";
      button.textContent = "Make decision";
      results.innerHTML = '<div class="decision-outcome ' + proposed.status.toLowerCase() + '">'
        + '<div class="decision-outcome-head"><strong>Proposed: ' + escapeHtml(proposed.status) + '</strong><span class="decision-source">Rule-based</span></div>'
        + '<p>' + escapeHtml(proposed.reason) + '</p></div>';
      return;
    }

    override.value = decision.source === "Reviewer override" ? decision.status : "";
    reason.value = decision.overrideReason || "";
    reason.required = Boolean(override.value);
    status.textContent = "Decision recorded " + fullDate(decision.decidedAt) + ".";
    hint.textContent = decision.source === "Reviewer override"
      ? "Reviewer override saved with a reason in the run history."
      : "This is the rule-based outcome from the saved Stage 3 and Stage 4 checks.";
    button.disabled = false;
    button.textContent = "Update decision";
    results.innerHTML = '<div class="decision-outcome ' + decision.status.toLowerCase() + '">'
      + '<div class="decision-outcome-head"><strong>' + escapeHtml(decision.status) + '</strong><span class="decision-source">' + escapeHtml(decision.source) + '</span></div>'
      + '<p>' + escapeHtml(decision.reason) + '</p></div>';
  }

  function saveDecision(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0 || (runs[index].stage || 1) < 4) return;
    const override = document.querySelector("#decision-override").value;
    const overrideReason = document.querySelector("#decision-reason").value.trim();
    if (override && !overrideReason) {
      showToast("Add a reason before saving a reviewer override.");
      document.querySelector("#decision-reason").focus();
      return;
    }

    const automatic = automaticDecision(runs[index]);
    const status = override || automatic.status;
    const decidedAt = new Date().toISOString();
    const decision = {
      status: status,
      automaticStatus: automatic.status,
      source: override ? "Reviewer override" : "Rule-based decision",
      reason: override ? overrideReason : automatic.reason,
      overrideReason: override ? overrideReason : "",
      decidedAt: decidedAt,
    };
    runs[index].decision = decision;
    delete runs[index].followUp;
    delete runs[index].finalizedAt;
    runs[index].stage = 5;
    runs[index].status = status;
    recordAudit(runs[index], 5, "Onboarding decision", status + " · " + decision.source + " · " + decision.reason, decidedAt);
    writeRuns(runs);
    renderQueue();
    showRunDetails(runId);
    showToast(status + " decision recorded.");
  }

  function followUpRequests(run) {
    const requests = [];
    const reviews = (run.validation?.checks || []).concat(run.comparison?.checks || []).filter((check) => check.state === "review");
    const add = (request) => { if (request && !requests.includes(request)) requests.push(request); };
    reviews.forEach((check) => {
      switch (check.label) {
        case "Required vendor details":
          add("Please provide any missing vendor details listed in our submission form.");
          break;
        case "Contact email format":
          add("Please confirm the primary contact email address.");
          break;
        case "Tax or registration ID format":
        case "Tax or registration ID":
          add("Please confirm the tax or registration ID and provide a clear supporting tax document.");
          break;
        case "Required supporting documents":
          add("Please provide the missing registration, tax, or bank-proof document(s): " + check.detail.replace(/^Missing:\s*/, ""));
          break;
        case "Document text readability":
          add("Please provide a clearer, text-readable copy of any document that could not be read.");
          break;
        case "Legal business name":
          add("Please confirm the legal business name shown on the registration document.");
          break;
        case "Bank account holder":
          add("Please confirm the bank account holder name shown on the bank proof.");
          break;
        case "Country or region":
          add("Please confirm the country or region shown on the registration or tax document.");
          break;
        case "Registered name vs bank account holder":
          add("Please clarify the relationship between the registered business name and the bank account holder.");
          break;
        case "Conflicting values across documents":
          add("Please confirm which conflicting information is current and provide a corrected supporting document.");
          break;
        case "Possible duplicate submission":
          add("Please confirm whether this is a new vendor submission or an update to an existing vendor record.");
          break;
        default:
          add("Please provide clarification for: " + check.label + ".");
      }
    });
    return requests;
  }

  function makeFollowUpDraft(run) {
    const greeting = "Hello " + (run.legalName || "there") + ",";
    if (run.decision.status === "Rejected") {
      return {
        required: true,
        subject: "Vendor onboarding update — " + run.legalName,
        body: greeting + "\n\nThank you for submitting your vendor information. We are unable to proceed with onboarding at this time.\n\nReason: " + run.decision.reason + "\n\nIf you believe this decision needs another review, please reply to this message.\n\nRegards,\nProcurement team",
      };
    }
    const requests = followUpRequests(run);
    const checklist = requests.length
      ? requests.map((request) => "• " + request).join("\n")
      : "• Please reply with the clarification or supporting information requested by our reviewer.";
    return {
      required: true,
      subject: "Information needed to complete vendor onboarding — " + run.legalName,
      body: greeting + "\n\nWe are reviewing your vendor submission and need a few details before we can continue:\n\n" + checklist + "\n\nPlease reply to this message with the requested information. Your submission will remain pending while we review it.\n\nRegards,\nProcurement team",
    };
  }

  function renderFollowUp(run) {
    const button = document.querySelector("#followup-button");
    const status = document.querySelector("#followup-status");
    const results = document.querySelector("#followup-results");
    const followUp = run.followUp;
    const hasDecision = Boolean(run.decision);
    button.disabled = !hasDecision;
    if (!hasDecision) {
      status.textContent = "Create a decision first.";
      button.textContent = "Prepare follow-up";
      results.innerHTML = '<div class="followup-note">Stage 6 uses the saved decision and review reasons to prepare a vendor message.</div>';
      return;
    }
    button.textContent = followUp ? "Regenerate draft" : run.decision.status === "Approved" ? "Record no follow-up" : "Prepare follow-up";
    if (!followUp) {
      status.textContent = run.decision.status === "Approved" ? "Approved · no message is required." : "Ready to draft a message from the open review items.";
      results.innerHTML = "";
      return;
    }
    if (!followUp.required) {
      status.textContent = "No follow-up needed · recorded " + fullDate(followUp.updatedAt || followUp.createdAt) + ".";
      results.innerHTML = '<div class="followup-note">This approved vendor does not need a follow-up message.</div>';
      return;
    }
    status.textContent = "Draft saved " + fullDate(followUp.updatedAt || followUp.createdAt) + " · review before sending.";
    results.innerHTML = '<div class="followup-editor">'
      + '<label>To<input id="draft-to" type="email" readonly value="' + escapeHtml(run.email) + '"></label>'
      + '<label>Subject<input id="draft-subject" type="text" maxlength="180" value="' + escapeHtml(followUp.subject) + '"></label>'
      + '<label>Message<textarea id="draft-body" maxlength="5000">' + escapeHtml(followUp.body) + '</textarea></label>'
      + '<div class="followup-actions"><button class="button-secondary" type="button" data-followup-action="copy">Copy draft</button><button class="button-primary compact" type="button" data-followup-action="save">Save draft</button></div>'
      + '</div>';
  }

  function prepareFollowUp(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0 || !runs[index].decision) return;
    const now = new Date().toISOString();
    const draft = runs[index].decision.status === "Approved"
      ? { required: false, subject: "", body: "", createdAt: now, updatedAt: now }
      : Object.assign(makeFollowUpDraft(runs[index]), { createdAt: now, updatedAt: now });
    runs[index].followUp = draft;
    runs[index].stage = 6;
    recordAudit(runs[index], 6, "Vendor follow-up", draft.required ? "Editable follow-up draft prepared; not sent." : "No follow-up required for this approved vendor.", now);
    writeRuns(runs);
    renderQueue();
    showRunDetails(runId);
    showToast(draft.required ? "Follow-up draft prepared." : "No follow-up is needed.");
  }

  function saveFollowUp(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0 || !runs[index].followUp?.required) return;
    const subject = document.querySelector("#draft-subject").value.trim();
    const body = document.querySelector("#draft-body").value.trim();
    if (!subject || !body) {
      showToast("Add a subject and message before saving the draft.");
      return;
    }
    const now = new Date().toISOString();
    runs[index].followUp.subject = subject;
    runs[index].followUp.body = body;
    runs[index].followUp.updatedAt = now;
    runs[index].stage = 6;
    recordAudit(runs[index], 6, "Follow-up draft updated", "Reviewer saved edits to the unsent vendor message.", now);
    writeRuns(runs);
    renderQueue();
    showRunDetails(runId);
    showToast("Follow-up draft saved.");
  }

  function auditEventsFor(run) {
    if (Array.isArray(run.auditEvents) && run.auditEvents.length) return run.auditEvents;
    const events = [{ stage: 1, title: "Submission received", summary: "Intake run created.", at: run.createdAt }];
    if (run.extraction) events.push({ stage: 2, title: "Document reading", summary: "Extraction results saved.", at: run.extraction.processedAt });
    if (run.validation) events.push({ stage: 3, title: "Completeness and format checks", summary: "Check results saved.", at: run.validation.checkedAt });
    if (run.comparison) events.push({ stage: 4, title: "Cross-document comparison", summary: "Comparison results saved.", at: run.comparison.checkedAt });
    if (run.decision) events.push({ stage: 5, title: "Onboarding decision", summary: run.decision.status + " · " + run.decision.source, at: run.decision.decidedAt });
    if (run.followUp) events.push({ stage: 6, title: "Vendor follow-up", summary: run.followUp.required ? "Draft prepared; not sent." : "No message required.", at: run.followUp.updatedAt || run.followUp.createdAt });
    if (run.finalizedAt) events.push({ stage: 7, title: "Run completed", summary: "Final result recorded.", at: run.finalizedAt });
    return events.filter((event) => event.at);
  }

  function renderFinalization(run) {
    const button = document.querySelector("#finalize-button");
    const status = document.querySelector("#audit-status");
    const results = document.querySelector("#audit-results");
    const events = auditEventsFor(run);
    if (!run.followUp) {
      button.disabled = true;
      button.textContent = "Complete run";
      status.textContent = "Prepare the follow-up stage first.";
      results.innerHTML = '<div class="audit-empty">The run history will be shown here after the follow-up stage.</div>';
      return;
    }
    if (!run.finalizedAt) {
      button.disabled = false;
      button.textContent = "Complete run";
      status.textContent = "Ready to record the final outcome and activity history.";
    } else {
      button.disabled = true;
      button.textContent = "Run finalized";
      status.textContent = "Completed " + fullDate(run.finalizedAt) + ".";
    }
    const decision = run.decision || { status: run.status, reason: "No decision details available." };
    const timeline = events.map((event) => '<li class="audit-item"><span class="audit-node"></span><div class="audit-copy"><strong>Stage ' + escapeHtml(event.stage) + ' · ' + escapeHtml(event.title) + '</strong><p>' + escapeHtml(event.summary) + '</p></div><time class="audit-time">' + escapeHtml(fullDate(event.at)) + '</time></li>').join("");
    results.innerHTML = '<article class="final-result-card"><div class="final-result-top"><strong>' + escapeHtml(run.legalName) + '</strong><span class="status-badge ' + statusClass(decision.status) + '"><i></i>' + escapeHtml(decision.status) + '</span></div>'
      + '<p><strong>Run:</strong> ' + escapeHtml(run.id) + '</p><p><strong>Decision:</strong> ' + escapeHtml(decision.reason) + '</p>'
      + '<p><strong>Follow-up:</strong> ' + (run.followUp.required ? "Draft saved; not sent." : "Not required.") + '</p></article>'
      + '<ol class="audit-list">' + timeline + '</ol>';
  }

  function completeRun(runId) {
    const runs = readRuns();
    const index = runs.findIndex((item) => item.id === runId);
    if (index < 0 || !runs[index].followUp) return;
    if (!runs[index].finalizedAt) {
      const now = new Date().toISOString();
      runs[index].finalizedAt = now;
      runs[index].stage = 7;
      recordAudit(runs[index], 7, "Run completed", "Final decision and activity history recorded.", now);
      writeRuns(runs);
    }
    renderQueue();
    showRunDetails(runId);
    showToast("Run history finalized.");
  }

  async function extractRunDocuments(runId) {
    const run = readRuns().find((item) => item.id === runId);
    if (!run) return;
    const button = document.querySelector("#extract-button");
    const status = document.querySelector("#extraction-status");
    const results = document.querySelector("#extraction-results");
    if (!(run.documents || []).length) {
      const runs = readRuns();
      const index = runs.findIndex((item) => item.id === runId);
      if (index >= 0) {
        runs[index].extraction = { runId, processedAt: new Date().toISOString(), documents: [] };
        delete runs[index].validation;
        delete runs[index].comparison;
        delete runs[index].decision;
        delete runs[index].followUp;
        delete runs[index].finalizedAt;
        runs[index].stage = 2;
        runs[index].status = "Needs document review";
        recordAudit(runs[index], 2, "Document reading", "No documents were attached; manual review will be needed.", runs[index].extraction.processedAt);
        writeRuns(runs);
        renderQueue();
        showRunDetails(runId);
      }
      showToast("No documents attached; you can continue to the completeness checks.");
      return;
    }

    button.disabled = true;
    button.textContent = "Reading documents…";
    status.textContent = "Reading files on this device…";
    results.innerHTML = '<div class="extraction-empty">The local reader is opening each attachment and looking for labelled vendor fields.</div>';
    document.querySelector(".dialog-stage").textContent = "Stage 2 running · Reading attached documents";
    document.querySelectorAll("#dialog-progress span")[1].classList.add("active");

    try {
      const savedFiles = await readFiles(runId);
      if (!savedFiles.length) throw new Error("The saved attachments are unavailable. Recreate this submission and attach the files again.");
      const payload = new FormData();
      payload.append("run_id", runId);
      savedFiles.forEach((document) => {
        payload.append("files", document.blob, document.name);
        payload.append("kinds", document.kind);
      });
      const response = await fetch(`${API_BASE}/api/extract`, { method: "POST", body: payload });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseBody.detail || `Local reader returned ${response.status}.`);

      const runs = readRuns();
      const index = runs.findIndex((item) => item.id === runId);
      if (index < 0) throw new Error("This submission is no longer in the local queue.");
      runs[index].extraction = responseBody;
      delete runs[index].validation;
      delete runs[index].comparison;
      delete runs[index].decision;
      delete runs[index].followUp;
      delete runs[index].finalizedAt;
      runs[index].stage = 2;
      const hasReadableDocuments = responseBody.documents.some((document) => document.status === "read");
      runs[index].status = hasReadableDocuments ? "Information extracted" : "Needs document review";
      const readableCount = responseBody.documents.filter((document) => document.status === "read").length;
      const fieldCount = responseBody.documents.reduce((count, document) => count + (document.fields || []).length, 0);
      recordAudit(runs[index], 2, "Document reading", readableCount + " of " + responseBody.documents.length + " attachment(s) readable; " + fieldCount + " field(s) extracted.", responseBody.processedAt);
      writeRuns(runs);
      renderQueue();
      showRunDetails(runId);
      showToast(hasReadableDocuments ? "Document text extracted and saved locally." : "Documents need a manual review.");
    } catch (error) {
      status.textContent = "Extraction did not complete.";
      results.innerHTML = `<div class="extraction-error">${escapeHtml(error.message || "Could not read these documents.")} Start the local reader with <code>py server.py</code>, then retry.</div>`;
      document.querySelector(".dialog-stage").textContent = "Stage 2 could not run · Start the local reader and try again";
      button.disabled = false;
      button.textContent = "Try again";
    }
  }

  function formatSize(bytes) {
    if (!bytes) return "0 KB";
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  FILE_FIELDS.forEach(([inputId]) => {
    const input = document.getElementById(inputId);
    input.addEventListener("change", () => {
      const card = input.closest(".upload-card");
      const label = card.querySelector(".file-name");
      const file = input.files[0];
      card.classList.toggle("has-file", Boolean(file));
      label.textContent = file ? `${file.name} · ${formatSize(file.size)}` : "PDF, image, DOCX, TXT, or CSV";
    });
  });

  form.addEventListener("input", (event) => {
    updateCopilotReadiness();
    if (event.target.name === "taxId") renderKnowledgeLibrary();
  });
  form.addEventListener("change", (event) => {
    updateCopilotReadiness();
    if (event.target.name === "country" && countryKnowledge(event.target.value)) {
      document.querySelector("#copilot-country-picker").value = event.target.value;
      renderKnowledgeLibrary(event.target.value);
    }
  });
  document.querySelector("#copilot-country-picker").addEventListener("change", (event) => renderKnowledgeLibrary(event.target.value));
  document.querySelectorAll("[data-workspace-prompt]").forEach((button) => {
    button.addEventListener("click", () => answerWorkspaceCopilot(button.dataset.workspacePrompt));
  });
  document.querySelector("#workspace-question-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#workspace-question");
    answerWorkspaceCopilot(input.value);
    input.value = "";
  });
  document.querySelector("#refresh-copilot").addEventListener("click", () => {
    renderCopilotSummary();
    document.querySelector("#workspace-copilot-reply").textContent = "Summary refreshed from the cases saved in this browser.";
  });
  document.querySelector("#copilot-read-button").addEventListener("click", readCopilotDocuments);
  document.querySelector("#copilot-doc-results").addEventListener("click", (event) => {
    const button = event.target.closest("[data-copilot-apply]");
    if (!button) return;
    const fieldName = button.dataset.copilotApply;
    const value = button.dataset.copilotValue;
    const target = form.elements.namedItem(fieldName);
    if (!target) return;
    if (target.tagName === "SELECT") {
      const option = Array.from(target.options).find((item) => comparableCopilotValue(item.value) === comparableCopilotValue(value));
      if (!option) {
        document.querySelector("#copilot-reply").textContent = "The document says “" + value + "”, which is not one of the available country options. Choose the closest matching country manually.";
        return;
      }
      target.value = option.value;
    } else {
      target.value = value;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#copilot-reply").textContent = "Filled " + (target.labels?.[0]?.innerText?.split("*")[0].trim() || fieldName) + " from the selected source. Please confirm the value before submitting.";
    target.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const chosenFiles = FILE_FIELDS.flatMap(([inputId, kind]) => {
      const file = document.getElementById(inputId).files[0];
      return file ? [{ kind, file }] : [];
    });
    const tooLarge = chosenFiles.find(({ file }) => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      showToast(`${tooLarge.file.name} is over the 10 MB limit.`);
      return;
    }

    const data = new FormData(form);
    const createdAt = new Date().toISOString();
    const id = `VND-${createdAt.slice(2, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const run = {
      id,
      legalName: String(data.get("legalName")).trim(),
      country: String(data.get("country")),
      taxId: String(data.get("taxId")).trim(),
      email: String(data.get("email")).trim(),
      accountHolder: String(data.get("accountHolder")).trim(),
      documents: chosenFiles.map(({ kind, file }) => ({ kind, name: file.name, type: file.type, size: file.size })),
      status: "Received",
      createdAt,
      stage: 1,
      auditEvents: [{ stage: 1, title: "Submission received", summary: `Run created with ${chosenFiles.length} attachment(s).`, at: createdAt }],
    };

    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Saving submission…";
    try {
      await saveFiles(id, chosenFiles);
      const runs = readRuns();
      runs.push(run);
      writeRuns(runs);
      form.reset();
      document.querySelector("#copilot-doc-results").innerHTML = "";
      document.querySelector("#copilot-reply").textContent = "Review case created. Open it from Submissions to check evidence, compare values, and prepare any follow-up.";
      updateCopilotReadiness();
      document.querySelectorAll(".upload-card").forEach((card) => {
        card.classList.remove("has-file");
        card.querySelector(".file-name").textContent = "PDF, image, DOCX, TXT, or CSV";
      });
      renderQueue();
      setView("queue");
      showToast(`Submission created · ${id}`);
    } catch (error) {
      showToast(error.message || "Could not save this submission in the browser.");
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Create review case";
    }
  });

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-run]");
    if (button) showRunDetails(button.dataset.openRun);
  });
  document.querySelector("#extract-button").addEventListener("click", () => {
    extractRunDocuments(document.querySelector("#extract-button").dataset.runId);
  });
  document.querySelector("#validate-button").addEventListener("click", () => {
    runValidation(document.querySelector("#validate-button").dataset.runId);
  });
  document.querySelector("#compare-button").addEventListener("click", () => {
    runComparison(document.querySelector("#compare-button").dataset.runId);
  });
  document.querySelector("#decision-button").addEventListener("click", () => {
    saveDecision(document.querySelector("#decision-button").dataset.runId);
  });
  document.querySelector("#decision-override").addEventListener("change", (event) => {
    const reason = document.querySelector("#decision-reason");
    const hint = document.querySelector("#decision-hint");
    reason.required = Boolean(event.target.value);
    hint.textContent = event.target.value
      ? "A reviewer override needs a clear reason and will be recorded in the audit history."
      : "Any unresolved check produces Pending. Rejection is available only as a reasoned reviewer override.";
  });
  document.querySelector("#followup-button").addEventListener("click", () => {
    prepareFollowUp(document.querySelector("#followup-button").dataset.runId);
  });
  document.querySelector("#followup-results").addEventListener("click", async (event) => {
    const action = event.target.closest("[data-followup-action]");
    if (!action) return;
    const runId = document.querySelector("#followup-button").dataset.runId;
    if (action.dataset.followupAction === "save") {
      saveFollowUp(runId);
      return;
    }
    if (action.dataset.followupAction === "copy") {
      const message = document.querySelector("#draft-body").value;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
        await navigator.clipboard.writeText(message);
        showToast("Draft copied to clipboard.");
      } catch {
        showToast("Select and copy the draft text manually.");
      }
    }
  });
  document.querySelector("#finalize-button").addEventListener("click", () => {
    completeRun(document.querySelector("#finalize-button").dataset.runId);
  });
  document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelector("#load-normal-demo").addEventListener("click", () => loadNormalDemoDataset());
  document.querySelector("#load-edge-demo").addEventListener("click", loadEdgeDemoDataset);
  document.querySelector("#clear-demo-data").addEventListener("click", clearDemoDataset);
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });

  applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  configureWorkspaceEnvironment();
  bootstrapLocalDemoDataset();
  updateCopilotReadiness();
  renderQueue();
})();
