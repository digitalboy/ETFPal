// ui.js
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

function updateETFTrendsUI(weeklyData, monthlyData) {
  const nasdaqEntries = Object.entries(weeklyData.nasdaq);
  const sp500Entries = Object.entries(weeklyData.sp500);
  const nasdaqRefreshed = weeklyData.nasdaqRefreshed;
  const sp500Refreshed = weeklyData.sp500Refreshed;

  const monthlyNasdaqEntries = Object.entries(monthlyData.nasdaq);
  const monthlySP500Entries = Object.entries(monthlyData.sp500);
  const monthlyNasdaqRefreshed = monthlyData.nasdaqRefreshed;
  const monthlySP500Refreshed = monthlyData.sp500Refreshed;

  const updateCards = (
    entries,
    containerId,
    lastRefreshed,
    isMonthly = false
  ) => {
    const cards = document.querySelectorAll(`#${containerId} .trend-card`);
    if (entries.length < 3) {
      cards.forEach((card) => (card.textContent = "数据不足"));
      return;
    }

    const lastRefreshedDate = new Date(lastRefreshed);
    const getLabel = (date, lastRefreshedDate, index) => {
      const entryDate = new Date(date);
      const diffInDays = Math.round(
        (lastRefreshedDate - entryDate) / (1000 * 60 * 60 * 24)
      );
      if (isMonthly) {
        const diffInMonths =
          (lastRefreshedDate.getFullYear() - entryDate.getFullYear()) * 12 +
          (lastRefreshedDate.getMonth() - entryDate.getMonth());

        if (index === 0) {
          return "本月";
        } else if (diffInMonths === 1 && index === 1) {
          return "上月";
        } else if (diffInMonths === 2 && index === 2) {
          return "上上月";
        } else if (diffInMonths < 2 && index === 1) {
          return "上月";
        } else if (diffInMonths < 3 && index === 2) {
          return "上上月";
        } else {
          return "更早";
        }
      } else {
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
      }
    };
    cards.forEach((card, index) => {
      if (entries[index]) {
        const currentDate = entries[index][0].split("-").slice(1).join("-");
        const currentPrice = parseFloat(entries[index][1]["4. close"]);

        let priceChange = 0;
        let percentageChange = 0;
        if (index < entries.length - 1 && entries[index + 1]) {
          const previousPrice = parseFloat(entries[index + 1][1]["4. close"]);
          priceChange = currentPrice - previousPrice;
          percentageChange = ((priceChange / previousPrice) * 100).toFixed(2);
        }

        const label = getLabel(entries[index][0], lastRefreshedDate, index);
        const arrow =
          priceChange > 0
            ? '<span class="arrow up">▲</span>'
            : priceChange < 0
            ? '<span class="arrow down">▼</span>'
            : "";
        card.innerHTML = `${label} (${currentDate}):<br>${formatPrice(
          currentPrice
        )} ${arrow} ${Math.abs(percentageChange)}%`;

        // 根据价格变化添加类名
        card.classList.remove("positive", "negative");
        if (priceChange > 0) {
          card.classList.add("positive");
        } else if (priceChange < 0) {
          card.classList.add("negative");
        }
      } else {
        card.textContent = "数据不足";
        card.classList.remove("positive", "negative");
      }
    });
  };

  updateCards(nasdaqEntries, "nasdaqTrends", nasdaqRefreshed);
  updateCards(sp500Entries, "sp500Trends", sp500Refreshed);

  updateCards(
    monthlyNasdaqEntries,
    "nasdaqMonthlyTrends",
    monthlyNasdaqRefreshed,
    true
  );
  updateCards(
    monthlySP500Entries,
    "sp500MonthlyTrends",
    monthlySP500Refreshed,
    true
  );
}
function displayETFTrends(weeklyData, monthlyData) {
  logStatus("正在加载ETF趋势数据...", "info");
  if (weeklyData && monthlyData) {
    updateETFTrendsUI(weeklyData, monthlyData);
    logStatus("成功加载ETF趋势数据。", "success");
  } else {
    document.getElementById("nasdaqTrends").innerText = "加载失败";
    document.getElementById("sp500Trends").innerText = "加载失败";
    document.getElementById("nasdaqMonthlyTrends").innerText = "加载失败";
    document.getElementById("sp500MonthlyTrends").innerText = "加载失败";
    logStatus("加载ETF趋势数据失败", "error");
  }
}
function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

function displayInvestmentInfo(
  nextInvestmentDate,
  investmentPercentageQQQ,
  investmentPercentageSPY
) {
  document.getElementById("nextInvestmentDate").innerText = nextInvestmentDate;
  document.getElementById("currentInvestmentPercentageQQQ").innerText =
    investmentPercentageQQQ + "%";
  document.getElementById("currentInvestmentPercentageSPY").innerText =
    investmentPercentageSPY + "%";
}
export { logStatus, displayETFTrends, formatPrice, displayInvestmentInfo };
