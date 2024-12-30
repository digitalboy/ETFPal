// ui.js
import { getMessage } from "./language.js";
function logStatus(message, type = "info") {
  const statusBox = document.getElementById("statusBox");
  const logMessage = document.createElement("li");
  switch (type) {
    case "error":
      logMessage.textContent = `[${getMessage("errorLabel")}]: ${message}`;
      logMessage.classList.add("error-message");
      break;
    case "warning":
      logMessage.textContent = `[${getMessage("warningLabel")}]: ${message}`;
      logMessage.classList.add("warning-message");
      break;
    case "success":
      logMessage.textContent = `[${getMessage("successLabel")}]: ${message}`;
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
      cards.forEach((card) => (card.textContent = getMessage("notEnoughData")));
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
          return getMessage("thisMonth");
        } else if (diffInMonths === 1 && index === 1) {
          return getMessage("lastMonth");
        } else if (diffInMonths === 2 && index === 2) {
          return getMessage("lastLastMonth");
        } else if (diffInMonths < 2 && index === 1) {
          return getMessage("lastMonth");
        } else if (diffInMonths < 3 && index === 2) {
          return getMessage("lastLastMonth");
        } else {
          return getMessage("moreEarly");
        }
      } else {
        if (index === 0) {
          return getMessage("thisWeek");
        } else if (diffInDays < 7 && index === 1) {
          return getMessage("lastWeek");
        } else if (diffInDays < 14 && index === 2) {
          return getMessage("lastLastWeek");
        } else if (diffInDays < 14 && index === 1) {
          return getMessage("lastWeek");
        } else if (diffInDays < 21 && index === 2) {
          return getMessage("lastLastWeek");
        } else {
          return getMessage("moreEarly");
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
        card.textContent = getMessage("notEnoughData");
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
  logStatus(getMessage("loadingData"), "info");
  if (weeklyData && monthlyData) {
    updateETFTrendsUI(weeklyData, monthlyData);
    logStatus(
      getMessage("successLabel") + " " + getMessage("loadETFTrendsSuccess"),
      "success"
    );
  } else {
    document.getElementById("nasdaqTrends").innerText =
      getMessage("errorLabel");
    document.getElementById("sp500Trends").innerText = getMessage("errorLabel");
    document.getElementById("nasdaqMonthlyTrends").innerText =
      getMessage("errorLabel");
    document.getElementById("sp500MonthlyTrends").innerText =
      getMessage("errorLabel");
    logStatus(getMessage("loadETFTrendsFailed"), "error");
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
