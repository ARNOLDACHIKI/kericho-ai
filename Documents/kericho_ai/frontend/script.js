// Configure these values for your backend deployment.
// Use the local server URL while developing.
const API_BASE_URL =
  window.API_BASE_URL ||
  (window.location && window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : "http://localhost:3000");
const TOKEN_STORAGE_KEY = "admin_auth_token";

const connectionStatus = document.getElementById("connectionStatus");
const lastUpdated = document.getElementById("lastUpdated");
const errorBanner = document.getElementById("errorBanner");
const messagesTableBody = document.getElementById("messagesTableBody");
const emergencyList = document.getElementById("emergencyList");
const activityLog = document.getElementById("activityLog");
const webhookStatus = document.getElementById("webhookStatus");
const webhookStatusDetails = document.getElementById("webhookStatusDetails");
const logFileCount = document.getElementById("logFileCount");
const logStatsDetails = document.getElementById("logStatsDetails");
const recentErrorCount = document.getElementById("recentErrorCount");
const recentErrorDetails = document.getElementById("recentErrorDetails");
const backendReady = document.getElementById("backendReady");
const backendReadyDetails = document.getElementById("backendReadyDetails");
const logTimestamp = document.getElementById("logTimestamp");
const logoutButton = document.getElementById("logoutButton");

function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function redirectToLogin() {
  window.location.href = "login.html";
}

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function setError(message) {
  console.error(message);
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
  connectionStatus.textContent = "Offline";
  connectionStatus.style.background = "rgba(185, 28, 28, 0.12)";
  connectionStatus.style.color = "#7f1d1d";
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

function renderStats(statsPayload) {
  const summary = statsPayload?.data?.summary || {};
  const topTopics = statsPayload?.data?.topTopics || [];

  document.getElementById("totalUsers").textContent = summary.totalUsers ?? "0";
  document.getElementById("totalMessages").textContent = summary.totalMessages ?? "0";
  document.getElementById("emergencyCount").textContent = summary.emergencyCount ?? "0";
  document.getElementById("emergencyRate").textContent = `Rate: ${summary.emergencyRate ?? "0"}%`;

  const topTopicText = topTopics.length
    ? topTopics.slice(0, 3).map((topic) => topic.topic).join(", ")
    : "No topics yet";
  document.getElementById("topTopics").textContent = topTopicText;

  const topTopicsDetails = topTopics.length
    ? topTopics.slice(0, 3).map((topic) => `${topic.topic} (${topic.count})`).join(" • ")
    : "Most common health topics";
  document.getElementById("topTopicsDetails").textContent = topTopicsDetails;
}

function renderMessages(messagesPayload) {
  const messages = messagesPayload?.data || [];

  if (!messages.length) {
    messagesTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No recent messages found.</td></tr>';
    return;
  }

  messagesTableBody.innerHTML = messages
    .map((message) => {
      const isEmergency = message.escalated || String(message.source || "").toLowerCase() === "emergency";
      const statusLabel = isEmergency ? "Emergency" : "Normal";
      const statusClass = isEmergency ? "emergency" : "normal";
      const rowClass = isEmergency ? "row-emergency" : "";

      return `
        <tr class="${rowClass}">
          <td>${formatDate(message.timestamp)}</td>
          <td>${message.userPhone || "unknown"}</td>
          <td>${message.topic || "general"}</td>
          <td>${message.content || ""}</td>
          <td><span class="status-chip ${statusClass}">${statusLabel}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderEmergencies(emergenciesPayload) {
  const emergencies = emergenciesPayload?.data || [];

  if (!emergencies.length) {
    emergencyList.innerHTML = '<div class="empty-state compact">No emergency alerts found.</div>';
    return;
  }

  emergencyList.innerHTML = emergencies
    .slice(0, 6)
    .map((entry) => {
      return `
        <article class="alert-item fade-in">
          <strong>${entry.userPhone || "Unknown user"}</strong>
          <span>${entry.message || entry.content || "Emergency case"}</span>
          <small>${formatDate(entry.timestamp)}</small>
        </article>
      `;
    })
    .join("");
}

function renderMonitoring(healthPayload, logsPayload) {
  const health = healthPayload?.data || {};
  const logs = logsPayload?.data || {};

  const databaseStatus = String(health.database || "unknown");
  const whatsappStatus = String(health.whatsapp || "unknown");
  const combinedStatus = `${databaseStatus} / ${whatsappStatus}`;

  if (webhookStatus) {
    webhookStatus.textContent = health.ok ? "Healthy" : "Degraded";
    webhookStatus.style.color = health.ok ? "#166534" : "#7f1d1d";
  }
  if (webhookStatusDetails) {
    webhookStatusDetails.textContent = `Webhook ${health.ok ? "responding" : "needs attention"} • WhatsApp: ${whatsappStatus}`;
  }

  if (logFileCount) {
    logFileCount.textContent = String(logs.filesCount ?? 0);
  }
  if (logStatsDetails) {
    logStatsDetails.textContent = logs.active ? `${logs.filesCount ?? 0} log files detected` : "No log files detected";
  }

  const totalErrors = logs.errorStats?.totalErrors ?? 0;
  if (recentErrorCount) {
    recentErrorCount.textContent = String(totalErrors);
  }
  if (recentErrorDetails) {
    recentErrorDetails.textContent = totalErrors > 0 ? "Errors captured in the error log" : "No current error log entries";
  }

  if (backendReady) {
    backendReady.textContent = health.ok ? "Ready" : "Check";
    backendReady.style.color = health.ok ? "#166534" : "#b91c1c";
  }
  if (backendReadyDetails) {
    backendReadyDetails.textContent = `Database: ${databaseStatus} • WhatsApp: ${whatsappStatus}`;
  }

  if (activityLog) {
    const recentCombined = logs.recentCombined || [];
    if (!recentCombined.length) {
      activityLog.innerHTML = '<div class="empty-state compact">No recent log activity found.</div>';
    } else {
      activityLog.innerHTML = recentCombined
        .slice(-12)
        .reverse()
        .map((line) => {
          const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("failed");
          return `<div class="log-line ${isError ? "error" : ""}">${line}</div>`;
        })
        .join("");
    }
  }

  if (logTimestamp) {
    logTimestamp.textContent = `Last refreshed: ${new Date().toLocaleString()} • ${combinedStatus}`;
  }
}

function renderQueue(queuePayload) {
  const queue = queuePayload?.data || {};
  const summary = queue.summary || {};

  document.getElementById("queueTotal").textContent = String(summary.total ?? 0);
  document.getElementById("queueTotalDetails").textContent = "Messages in queue";

  document.getElementById("queuePending").textContent = String(summary.pending ?? 0);
  document.getElementById("queuePendingDetails").textContent = "Waiting to process";

  document.getElementById("queueProcessing").textContent = String(summary.processing ?? 0);
  document.getElementById("queueProcessingDetails").textContent = "Currently being handled";

  document.getElementById("queueCompleted").textContent = String(summary.completed ?? 0);
  document.getElementById("queueCompletedDetails").textContent = "Successfully processed";

  document.getElementById("queueFailed").textContent = String(summary.failed ?? 0);
  document.getElementById("queueFailedDetails").textContent = "Errors and retries";
}

async function fetchJson(endpoint) {
  const token = getAuthToken();

  if (!token) {
    redirectToLogin();
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    redirectToLogin();
    throw new Error(`Unauthorized request to ${endpoint}`);
  }

  if (!response.ok) {
    throw new Error(`Request to ${endpoint} failed with status ${response.status}`);
  }

  return response.json();
}

async function loadDashboard() {
  try {
    clearError();
    connectionStatus.textContent = "Loading...";

    const [statsPayload, messagesPayload, emergenciesPayload, healthPayload, logsPayload, queuePayload] = await Promise.all([
      fetchJson("/admin/stats"),
      fetchJson("/admin/messages?limit=12"),
      fetchJson("/admin/emergencies?days=30&limit=6"),
      fetchJson("/admin/health"),
      fetchJson("/admin/logs?limit=40"),
      fetchJson("/admin/queue"),
    ]);

    renderStats(statsPayload);
    renderMessages(messagesPayload);
    renderEmergencies(emergenciesPayload);
    renderMonitoring(healthPayload, logsPayload);
    renderQueue(queuePayload);

    connectionStatus.textContent = "Connected";
    connectionStatus.style.background = "rgba(22, 101, 52, 0.1)";
    connectionStatus.style.color = "#166534";
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    setError(
      "Unable to load dashboard data. Check the backend URL, API key, and ensure the admin endpoints are reachable."
    );
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!getAuthToken()) {
    redirectToLogin();
    return;
  }

  logoutButton?.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    redirectToLogin();
  });

  loadDashboard();
  setInterval(loadDashboard, 60000);
});
