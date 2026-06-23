let trendsChart = null;
let performanceChart = null;
let analyticsData = null;
let analyticsWebSocket = null;
let analyticsView = "daily"; // 'daily' or 'weekly'
let currentUserId = null;
let profileData = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/auth.html";
  } else {
    loadAnalytics();
  }
});

// Clean up WebSocket when page unloads
window.addEventListener("beforeunload", () => {
  if (analyticsWebSocket) {
    analyticsWebSocket.close();
  }
});

async function loadAnalytics() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "/auth.html";
    return;
  }

  try {
    currentUserId = user.id;
    console.log("Loading analytics for user:", currentUserId);

    // Fetch profile data first
    const profileResponse = await fetch(`/api/profiles/me/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (profileResponse.ok) {
      profileData = await profileResponse.json();

      // Try to fetch analytics via HTTP first (fallback if WebSocket fails)
      try {
        const analyticsResponse = await fetch(`/api/analytics/profile/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          console.log("Analytics data loaded via HTTP:", data);
          processAnalyticsData(data);
        }
      } catch (httpError) {
        console.warn("HTTP analytics fetch failed, will rely on WebSocket:", httpError);
      }

      // Connect to WebSocket for real-time updates
      connectAnalyticsWebSocket();
    } else if (profileResponse.status === 401) {
      window.location.href = "/auth.html";
    } else {
      throw new Error("Failed to load profile");
    }
  } catch (error) {
    console.error("Error loading analytics:", error);
    document.getElementById("main-content").innerHTML = `
            <div class="error-container">
                <h2>Error Loading Analytics</h2>
                <p>${error.message}</p>
                <a href="/dashboard.html" class="btn btn-primary">Back to Dashboard</a>
            </div>
        `;
  }
}

function connectAnalyticsWebSocket() {
  if (analyticsWebSocket && analyticsWebSocket.readyState === WebSocket.OPEN) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/analytics/${currentUserId}`;

  console.log("Connecting to WebSocket:", wsUrl);
  analyticsWebSocket = new WebSocket(wsUrl);

  analyticsWebSocket.onopen = () => {
    console.log("Analytics WebSocket connected");
    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
      if (
        analyticsWebSocket &&
        analyticsWebSocket.readyState === WebSocket.OPEN
      ) {
        analyticsWebSocket.send("ping");
      }
    }, 30000);
  };

  analyticsWebSocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "initial" || message.type === "update") {
        console.log("WebSocket received:", message.type);
        processAnalyticsData(message.data);
      }
    } catch (e) {
      console.error("Error parsing WebSocket message:", e);
    }
  };

  analyticsWebSocket.onclose = () => {
    console.log("Analytics WebSocket disconnected, reconnecting...");
    setTimeout(() => {
      if (currentUserId) {
        connectAnalyticsWebSocket();
      }
    }, 5000);
  };

  analyticsWebSocket.onerror = (error) => {
    console.error("Analytics WebSocket error:", error);
  };
}

function processAnalyticsData(data) {
  console.log("Processing analytics data:", data);
  
  // Enrich links with titles from profile
  if (profileData && profileData.profile && profileData.profile.links) {
    const linkMap = {};
    profileData.profile.links.forEach((link) => {
      linkMap[link.id] = link.title;
    });

    if (data.links) {
      data.links.forEach((link) => {
        link.title = linkMap[link.link_id] || link.link_id;
      });
    }
  }

  // Check if data changed
  const dataChanged = JSON.stringify(data) !== JSON.stringify(analyticsData);
  analyticsData = data;

  if (dataChanged || !analyticsData) {
    console.log(
      "Analytics updated:",
      new Date().toLocaleTimeString(),
      "Total clicks:", data.total_clicks
    );
    displayAnalytics();
  }
}

function updateSummaryCards() {
  if (!analyticsData) return;

  // Update metrics with enhanced data
  updateMetricCard("total-clicks", analyticsData.total_clicks);
  updateMetricCard("total-visitors", analyticsData.total_unique_visitors);

  // Update top link with proper formatting
  const topLinkEl = document.getElementById("top-link");
  const topLinkClicksEl = document.getElementById("top-link-clicks");

  if (analyticsData.links && analyticsData.links.length > 0) {
    const topLink = analyticsData.links[0];
    const displayTitle = topLink.title || topLink.link_id;
    const shortenedTitle =
      displayTitle.length > 20
        ? displayTitle.substring(0, 20) + "..."
        : displayTitle;

    if (topLinkEl) topLinkEl.textContent = shortenedTitle;
    if (topLinkClicksEl)
      topLinkClicksEl.textContent = `${topLink.clicks} clicks`;
  } else {
    if (topLinkEl) topLinkEl.textContent = "No links yet";
    if (topLinkClicksEl) topLinkClicksEl.textContent = "0 clicks";
  }

  // Calculate and update CTR
  const avgCtrEl = document.getElementById("avg-ctr");
  if (avgCtrEl && analyticsData.links) {
    const totalLinks = analyticsData.links.length;
    const avgClicks =
      totalLinks > 0 ? analyticsData.total_clicks / totalLinks : 0;
    const ctr =
      totalLinks > 0
        ? (avgClicks / Math.max(analyticsData.total_unique_visitors, 1)) * 100
        : 0;
    avgCtrEl.textContent = `${ctr.toFixed(1)}%`;
  }
}

function updateMetricCard(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const oldValue = parseInt(element.textContent) || 0;
  const change = newValue - oldValue;

  // Update value with animation
  if (oldValue !== newValue) {
    element.style.transform = "scale(1.05)";
    element.style.color = "#00ff41";

    setTimeout(() => {
      element.textContent = newValue;
      element.style.transform = "scale(1)";
      element.style.color = "";
    }, 150);
  }

  // Update change indicators
  const changeElement = document.getElementById(
    elementId.replace("total-", "") + "-change",
  );
  if (changeElement && change !== 0) {
    const isPositive = change > 0;
    changeElement.className = `metric-change ${isPositive ? "positive" : "negative"}`;
    changeElement.innerHTML = `
            <span class="change-icon">${isPositive ? "↗" : "↘"}</span>
            <span>${isPositive ? "+" : ""}${change}</span>
        `;
  }
}

function displayAnalytics() {
  if (!analyticsData) {
    console.warn("No analytics data available");
    return;
  }

  console.log("Displaying analytics:", {
    totalClicks: analyticsData.total_clicks,
    totalVisitors: analyticsData.total_unique_visitors,
    linksCount: analyticsData.links?.length || 0
  });

  // Update summary cards with enhanced styling
  updateSummaryCards();

  // Display charts with improved animations
  displayTrendsChart();
  displayPerformanceChart();
  displayLinksTable();

  // Remove loading state
  removeLoadingState();
}

function removeLoadingState() {
  const loadingRow = document.querySelector(".loading-row");
  if (loadingRow) {
    loadingRow.style.opacity = "0";
    setTimeout(() => {
      if (loadingRow.parentNode) {
        loadingRow.parentNode.removeChild(loadingRow);
      }
    }, 300);
  }
}

function setAnalyticsView(view) {
  analyticsView = view;

  // Update button states
  document
    .getElementById("daily-btn")
    .classList.toggle("active", view === "daily");
  document
    .getElementById("weekly-btn")
    .classList.toggle("active", view === "weekly");

  // Fade out charts
  document.getElementById("trends").classList.add("fade-out");
  document.getElementById("performance").classList.add("fade-out");

  // Redraw charts after fade-out completes
  setTimeout(() => {
    document.getElementById("trends").classList.remove("fade-out");
    document.getElementById("performance").classList.remove("fade-out");

    displayTrendsChart();
    displayPerformanceChart();
  }, 200);
}

function aggregateWeeklyData(dailyData) {
  // Aggregate daily data into weekly buckets
  const weeklyData = {};

  if (!dailyData || typeof dailyData !== "object") {
    return { weeks: [], data: [] };
  }

  const dates = Object.keys(dailyData).sort();
  if (dates.length === 0) {
    return { weeks: [], data: [] };
  }

  // Group by week
  dates.forEach((dateStr) => {
    const date = new Date(dateStr);
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 86400000,
    );
    const weekNumber = Math.ceil(dayOfYear / 7);
    const weekKey = `Week ${weekNumber}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = 0;
    }
    weeklyData[weekKey] += dailyData[dateStr];
  });

  const weeks = Object.keys(weeklyData).sort((a, b) => {
    const aNum = parseInt(a.split(" ")[1]);
    const bNum = parseInt(b.split(" ")[1]);
    return aNum - bNum;
  });

  const data = weeks.map((week) => weeklyData[week]);

  return { weeks, data };
}

function displayTrendsChart() {
  const daily_summary = analyticsData.daily_summary;

  let labels, clicksData;

  if (analyticsView === "weekly") {
    // Use weekly aggregated data
    const weeklyData = aggregateWeeklyData(daily_summary);
    labels = weeklyData.weeks;
    clicksData = weeklyData.data;
  } else {
    // Use daily data
    labels = Object.keys(daily_summary).sort();
    clicksData = labels.map((date) => daily_summary[date]);
  }

  const ctx = document.getElementById("trendsChart").getContext("2d");

  if (trendsChart) {
    trendsChart.destroy();
  }

  trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length > 0 ? labels : ["No data"],
      datasets: [
        {
          label: analyticsView === "weekly" ? "Weekly Clicks" : "Daily Clicks",
          data: clicksData.length > 0 ? clicksData : [0],
          borderColor: "#00ff41",
          backgroundColor: "rgba(0, 255, 65, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#00ff41",
          pointBorderColor: "#0a0e27",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: "#e0e0e0",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#e0e0e0",
          },
          grid: {
            color: "rgba(0, 255, 65, 0.1)",
          },
        },
        x: {
          ticks: {
            color: "#e0e0e0",
          },
          grid: {
            color: "rgba(0, 255, 65, 0.1)",
          },
        },
      },
    },
  });
}

function displayPerformanceChart() {
  const links = analyticsData.links;
  const linkLabels = links.map((l) => l.title || l.link_id.substring(0, 20));
  const clickData = links.map((l) => l.clicks);
  const visitorData = links.map((l) => l.unique_visitors);

  const ctx = document.getElementById("performanceChart").getContext("2d");

  if (performanceChart) {
    performanceChart.destroy();
  }

  // Create horizontal gradient for bars
  const gradient1 = ctx.createLinearGradient(0, 0, 400, 0);
  gradient1.addColorStop(0, "rgba(0, 255, 65, 0.8)");
  gradient1.addColorStop(0.5, "rgba(0, 200, 100, 0.9)");
  gradient1.addColorStop(1, "rgba(0, 255, 150, 1)");

  const gradient2 = ctx.createLinearGradient(0, 0, 400, 0);
  gradient2.addColorStop(0, "rgba(138, 43, 226, 0.8)");
  gradient2.addColorStop(0.5, "rgba(186, 85, 211, 0.9)");
  gradient2.addColorStop(1, "rgba(218, 112, 214, 1)");

  performanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: linkLabels.length > 0 ? linkLabels : ["No links yet"],
      datasets: [
        {
          label: "🔥 Clicks",
          data: clickData.length > 0 ? clickData : [0],
          backgroundColor: gradient1,
          borderColor: "rgba(0, 255, 65, 1)",
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 24,
          hoverBackgroundColor: "rgba(0, 255, 65, 1)",
          hoverBorderWidth: 0,
        },
        {
          label: "👥 Unique Visitors",
          data: visitorData.length > 0 ? visitorData : [0],
          backgroundColor: gradient2,
          borderColor: "rgba(138, 43, 226, 1)",
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 24,
          hoverBackgroundColor: "rgba(186, 85, 211, 1)",
          hoverBorderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: "y",
      layout: {
        padding: {
          left: 10,
          right: 20,
          top: 10,
          bottom: 10,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#e0e0e0",
            font: {
              size: 13,
              weight: "600",
              family: "'Segoe UI', sans-serif",
            },
            padding: 20,
            boxWidth: 16,
            boxHeight: 16,
            useBorderRadius: true,
            borderRadius: 4,
          },
          display: true,
          position: "top",
        },
        tooltip: {
          backgroundColor: "rgba(10, 14, 39, 0.95)",
          titleColor: "#00ff41",
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyColor: "#e0e0e0",
          bodyFont: {
            size: 13,
          },
          borderColor: "rgba(0, 255, 65, 0.5)",
          borderWidth: 1,
          padding: 14,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: function (context) {
              const value = context.parsed.x;
              const label = context.dataset.label.replace(/^[^\s]+\s/, "");
              return ` ${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: "#a0a0a0",
            font: {
              size: 11,
              weight: "500",
            },
            stepSize: 1,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: "#e0e0e0",
            font: {
              size: 12,
              weight: "600",
            },
            padding: 8,
          },
          grid: {
            display: false,
          },
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
    },
  });
}

function displayLinksTable() {
  const tbody = document.getElementById("links-table-body");
  tbody.innerHTML = "";

  if (analyticsData.links.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-message">
            <span class="empty-icon">📊</span>
            <h3>No Analytics Data Yet</h3>
            <p>Start sharing your links to see analytics here</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  analyticsData.links.forEach((link, index) => {
    const lastClicked = link.last_clicked
      ? formatRelativeTime(new Date(link.last_clicked))
      : "Never";

    const displayTitle = link.title || link.link_id;
    const truncatedTitle =
      displayTitle.length > 30
        ? displayTitle.substring(0, 30) + "..."
        : displayTitle;

    const clickTrend = getClickTrend(link.clicks, index);
    const ctrRate =
      link.unique_visitors > 0
        ? ((link.clicks / link.unique_visitors) * 100).toFixed(1)
        : 0;

    const row = document.createElement("tr");
    row.className = "table-row";
    row.style.animationDelay = `${index * 0.1}s`;

    row.innerHTML = `
      <td class="link-cell">
        <div class="link-info">
          <code class="link-title" title="${displayTitle}">${truncatedTitle}</code>
        </div>
      </td>
      <td class="metric-cell">
        <div class="metric-display">
          <span class="metric-number">${link.clicks}</span>
          ${clickTrend.icon ? `<span class="trend-indicator ${clickTrend.class}">${clickTrend.icon}</span>` : ""}
        </div>
      </td>
      <td class="metric-cell">
        <div class="metric-display">
          <span class="metric-number">${link.unique_visitors}</span>
          <span class="ctr-rate">${ctrRate}% CTR</span>
        </div>
      </td>
      <td class="time-cell">
        <span class="time-display ${lastClicked === "Never" ? "never" : ""}">${lastClicked}</span>
      </td>
      <td class="action-cell">
        <div class="action-buttons">
          <button class="btn-icon" onclick="copyLinkUrl('${link.link_id}')" title="Copy Link">
            <span>📋</span>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getClickTrend(clicks, index) {
  if (index === 0) return { icon: "🔥", class: "hot" };
  if (clicks > 10) return { icon: "↗", class: "positive" };
  if (clicks > 5) return { icon: "→", class: "neutral" };
  if (clicks > 0) return { icon: "↘", class: "low" };
  return { icon: null, class: "" };
}

function copyLinkUrl(linkId) {
  const user = JSON.parse(localStorage.getItem("user"));
  const linkUrl = `${window.location.origin}/${user.id}`;
  navigator.clipboard
    .writeText(linkUrl)
    .then(() => {
      showToast("Link copied to clipboard!");
    })
    .catch(() => {
      showToast("Failed to copy link", "error");
    });
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

function viewLinkDetails(linkId) {
  alert(
    "Detailed analytics for link: " +
      linkId +
      "\n\nThis would show a detailed breakdown.",
  );
}

function confirmReset() {
  if (
    confirm(
      "Are you sure you want to reset all analytics? This cannot be undone.",
    )
  ) {
    resetAnalytics();
  }
}

async function resetAnalytics() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const response = await fetch(`/api/analytics/reset/${user.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert("Analytics reset successfully");
      loadAnalytics();
    }
  } catch (error) {
    alert("Error resetting analytics: " + error.message);
  }
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    closeSidebar();
    element.scrollIntoView({ behavior: "smooth" });

    // Update active menu item
    const menuItems = document.querySelectorAll(".sidebar-item");
    menuItems.forEach((item) => item.classList.remove("active"));
    event.target.closest(".sidebar-item")?.classList.add("active");
  }
}
