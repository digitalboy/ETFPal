// popup.js

const nasdaqSymbol = "QQQ";
const sp500Symbol = "SPY";
const baseInvestmentAmount = 100;
const investmentDay = 2; // Tuesday

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  displayInvestmentInfo();
  displayETFTrends();
  document
    .getElementById("executeInvestment")
    .addEventListener("click", executeInvestment);
}

function logStatus(message, type = "info") {
  const statusBox = document.getElementById("statusBox");
  const logMessage = document.createElement("li");
  switch (type) {
    case "error":
      logMessage.textContent = `[错误]: ${message}`;
      logMessage.classList.add("error-message");
      break;
    case "warning":
      logMessage.textContent = `[警告]: ${message}`;
      logMessage.classList.add("warning-message");
      break;
    case "success":
      logMessage.textContent = `[成功]: ${message}`;
      logMessage.classList.add("success-message");
      break;
    default:
      logMessage.textContent = `[信息]: ${message}`;
      logMessage.classList.add("info-message");
  }

  statusBox.appendChild(logMessage);
  statusBox.scrollTop = statusBox.scrollHeight;
}

function getLocalDate() {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Date();
  const options = {
    timeZone: userTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return new Date(date.toLocaleString("en-US", options));
}

function validateAPIResponse(response) {
  if (response["Error Message"]) {
    logStatus(`API密钥错误，请检查密钥：${response["Error Message"]}`, "error");
    return false;
  }
  if (response["Note"]) {
    logStatus(`API请求频率过高，请稍后重试：${response["Note"]}`, "warning");
    return false;
  }
  if (
    !response["Weekly Time Series"] ||
    typeof response["Weekly Time Series"] !== "object"
  ) {
    logStatus("API返回数据无效，缺少 Weekly Time Series。", "error");
    return false;
  }
  return true;
}

function fetchWeeklyETFData() {
  const nasdaqURL = `https://eft-pal-data-provider.digitalboyzone.workers.dev/?etf=${nasdaqSymbol}`;
  const sp500URL = `https://eft-pal-data-provider.digitalboyzone.workers.dev/?etf=${sp500Symbol}`;

  return Promise.all([
    fetch(nasdaqURL).then((response) => response.json()),
    fetch(sp500URL).then((response) => response.json()),
  ]).then((data) => {
    if (!validateAPIResponse(data[0]) || !validateAPIResponse(data[1])) {
      throw new Error("API 返回数据无效");
    }

    const nasdaqData = data[0]["Weekly Time Series"];
    const sp500Data = data[1]["Weekly Time Series"];
    const nasdaqRefreshed = data[0]["Meta Data"]["3. Last Refreshed"];
    const sp500Refreshed = data[1]["Meta Data"]["3. Last Refreshed"];

    const sortedNasdaqData = Object.entries(nasdaqData).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
    const sortedSP500Data = Object.entries(sp500Data).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );

    return {
      nasdaq: Object.fromEntries(sortedNasdaqData),
      sp500: Object.fromEntries(sortedSP500Data),
      nasdaqRefreshed,
      sp500Refreshed,
    };
  });
}

function displayETFTrends() {
  logStatus("正在加载ETF趋势数据...", "info");
  fetchWeeklyETFData()
    .then((data) => {
      updateETFTrendsUI(data);
      logStatus("成功加载ETF趋势数据。", "success");
    })
    .catch((error) => {
      document.getElementById("nasdaqTrends").innerText = "加载失败";
      document.getElementById("sp500Trends").innerText = "加载失败";
      logStatus(`加载ETF趋势数据失败: ${error.message}`, "error");
    });
}

function updateETFTrendsUI(data) {
  const nasdaqEntries = Object.entries(data.nasdaq);
  const sp500Entries = Object.entries(data.sp500);
  const nasdaqRefreshed = data.nasdaqRefreshed;
  const sp500Refreshed = data.sp500Refreshed;

  const nasdaqTrends = getTrendString(nasdaqEntries, nasdaqRefreshed);
  const sp500Trends = getTrendString(sp500Entries, sp500Refreshed);

  document.getElementById("nasdaqTrends").innerText = nasdaqTrends;
  document.getElementById("sp500Trends").innerText = sp500Trends;

  const consecutiveDownDays = calculateConsecutiveDownDays(
    nasdaqEntries,
    sp500Entries
  );
  document.getElementById("consecutiveDownDays").innerText =
    consecutiveDownDays;
}

function calculateConsecutiveDownDays(nasdaqEntries, sp500Entries) {
  let nasdaqDownDays = 0;
  let sp500DownDays = 0;

  for (let i = 1; i < nasdaqEntries.length; i++) {
    const prevClose = parseFloat(nasdaqEntries[i - 1][1]["4. close"]);
    const currClose = parseFloat(nasdaqEntries[i][1]["4. close"]);
    if (currClose < prevClose) {
      nasdaqDownDays++;
    } else {
      break;
    }
  }
  for (let i = 1; i < sp500Entries.length; i++) {
    const prevClose = parseFloat(sp500Entries[i - 1][1]["4. close"]);
    const currClose = parseFloat(sp500Entries[i][1]["4. close"]);
    if (currClose < prevClose) {
      sp500DownDays++;
    } else {
      break;
    }
  }

  return Math.max(nasdaqDownDays, sp500DownDays);
}

function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

function getTrendString(entries, lastRefreshed) {
  if (entries.length < 3) {
    return "数据不足";
  }

  const lastRefreshedDate = new Date(lastRefreshed);
  const getWeekLabel = (date, lastRefreshedDate, index) => {
    const entryDate = new Date(date);
    const diffInDays = Math.round(
      (lastRefreshedDate - entryDate) / (1000 * 60 * 60 * 24)
    );
    if (index === 0) {
      return "本周";
    } else if (diffInDays < 7 && index === 1) {
      return "上周";
    } else if (diffInDays < 14 && index === 2) {
      return "上上周";
    } else if (diffInDays < 14 && index === 1) {
      return "上周";
    } else if (diffInDays < 21 && index === 2) {
      return "上上周";
    } else {
      return "更早";
    }
  };

  const formatData = (entry, index) => {
    return `${getWeekLabel(entry[0], lastRefreshedDate, index)} (${
      entry[0]
    }): ${formatPrice(entry[1]["4. close"])}`;
  };

  return `${formatData(entries[0], 0)} | ${formatData(
    entries[1],
    1
  )} | ${formatData(entries[2], 2)}`;
}

function displayInvestmentInfo() {
  chrome.storage.local.get(["investments"], function (result) {
    const investments = result.investments || [];
    const lastInvestment = investments[investments.length - 1];
    const today = getLocalDate();

    if (lastInvestment) {
      document.getElementById("lastInvestmentDate").innerText =
        lastInvestment.date;
    } else {
      document.getElementById("lastInvestmentDate").innerText = "暂无记录";
    }

    const nextDate = calculateNextInvestmentDate(
      lastInvestment ? lastInvestment.date : null,
      today
    );
    document.getElementById("nextInvestmentDate").innerText = nextDate;

    const consecutiveDownDays = parseInt(
      document.getElementById("consecutiveDownDays").innerText,
      10
    );
    const investmentPercentage =
      calculateInvestmentPercentage(consecutiveDownDays);
    document.getElementById("currentInvestmentPercentage").innerText =
      investmentPercentage + "%";
  });
}

function calculateInvestmentPercentage(consecutiveDownDays) {
  if (consecutiveDownDays <= 0) {
    return 100;
  }
  return 100 + consecutiveDownDays * 10;
}

function executeInvestment() {
  const consecutiveDownDays = parseInt(
    document.getElementById("consecutiveDownDays").innerText,
    10
  );
  const investmentPercentage =
    calculateInvestmentPercentage(consecutiveDownDays);
  const investmentAmount = (baseInvestmentAmount * investmentPercentage) / 100;
  const today = getLocalDate();
  fetchWeeklyETFData()
    .then((data) => {
      const nasdaqLatest = Object.entries(data.nasdaq)[0];
      const sp500Latest = Object.entries(data.sp500)[0];

      const prices = {
        nasdaq: parseFloat(nasdaqLatest[1]["4. close"]),
        sp500: parseFloat(sp500Latest[1]["4. close"]),
      };

      chrome.storage.local.get(["investments"], function (result) {
        const investments = result.investments || [];
        investments.push({
          date: today.toISOString().split("T")[0],
          amount: investmentAmount,
          prices,
        });

        chrome.storage.local.set({ investments }, function () {
          logStatus("定投成功完成。", "success");
          displayInvestmentInfo();
        });
      });
    })
    .catch((error) => {
      logStatus(`定投操作失败: ${error.message}`, "error");
    });
}

function calculateNextInvestmentDate(lastDateStr, today) {
  let nextDate = today;

  if (lastDateStr) {
    nextDate = new Date(lastDateStr);
    nextDate.setDate(nextDate.getDate() + 7);
  }

  const dayOfWeek = nextDate.getDay();
  const daysUntilTuesday = (investmentDay - dayOfWeek + 7) % 7;
  nextDate.setDate(nextDate.getDate() + daysUntilTuesday);

  return `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${nextDate.getDate().toString().padStart(2, "0")}`;
}
