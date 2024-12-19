import {
  calculateConsecutiveDownWeeks,
  calculateInvestmentPercentage,
  calculateInvestmentAmount,
  calculateNextInvestmentDate,
  defaultIncreaseRate,
  calculateConsecutiveUpMonths,
} from "./investmentStrategy.js";

const nasdaqSymbol = "QQQ_weekly";
const sp500Symbol = "SPY_weekly";
const investmentFrequency = "weekly"; // 默认每周

let investmentDay;

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  loadIncreaseRate();
  loadInvestmentDay();
  displayInvestmentInfo();
  displayETFTrends();
  document
    .getElementById("executeInvestment")
    .addEventListener("click", executeInvestment);

  document
    .getElementById("toggleSettings")
    .addEventListener("click", toggleSettings);
  document
    .getElementById("saveSettings")
    .addEventListener("click", saveSettings);
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
  const nasdaqURL = `https://etf-pal-weekly-data-getter.digitalboyzone.workers.dev/?etf=${nasdaqSymbol}`;
  const sp500URL = `https://etf-pal-weekly-data-getter.digitalboyzone.workers.dev/?etf=${sp500Symbol}`;

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
      document.getElementById("nasdaqMonthlyTrends").innerText = "加载失败";
      document.getElementById("sp500MonthlyTrends").innerText = "加载失败";
      logStatus(`加载ETF趋势数据失败: ${error.message}`, "error");
    });
}
function updateETFTrendsUI(data) {
    const nasdaqEntries = Object.entries(data.nasdaq);
    const sp500Entries = Object.entries(data.sp500);
    const nasdaqRefreshed = data.nasdaqRefreshed;
    const sp500Refreshed = data.sp500Refreshed;

  const updateCards = (entries, containerId, lastRefreshed, isMonthly = false) => {
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
           const diffInMonths = (lastRefreshedDate.getFullYear() - entryDate.getFullYear()) * 12 + (lastRefreshedDate.getMonth() - entryDate.getMonth());

          if (index === 0) {
            return "本月";
          } else if (diffInMonths === 1 && index === 1) {
            return "上月";
          } else if (diffInMonths === 2 && index === 2) {
            return "上上月";
          } else if (diffInMonths < 2 && index === 1) {
              return "上月";
          } else if (diffInMonths < 3 && index === 2) {
               return "上上月"
          }else {
              return '更早'
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

        const label = getLabel(
          entries[index][0],
          lastRefreshedDate,
          index
        );
          const arrow = priceChange > 0 ? '<span class="arrow up">▲</span>' : priceChange < 0 ? '<span class="arrow down">▼</span>' : '';
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

    const monthlyNasdaqEntries = Object.entries(data.nasdaq).filter((entry, index) => index === 0 || new Date(entry[0]).getDate() <=7 );
    const monthlySP500Entries =  Object.entries(data.sp500).filter((entry, index) => index === 0 || new Date(entry[0]).getDate() <=7 );

    updateCards(monthlyNasdaqEntries, "nasdaqMonthlyTrends", nasdaqRefreshed, true);
    updateCards(monthlySP500Entries, "sp500MonthlyTrends", sp500Refreshed,true);

  const consecutiveDownWeeks = calculateConsecutiveDownWeeks(
    nasdaqEntries,
    sp500Entries,
    investmentFrequency
  );
  document.getElementById("consecutiveDownDays").innerText =
    consecutiveDownWeeks;

  const consecutiveUpMonths = calculateConsecutiveUpMonths(
      nasdaqEntries,
      sp500Entries
  );
  document.getElementById("consecutiveUpMonths").innerText = consecutiveUpMonths;
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
function loadIncreaseRate() {
  chrome.storage.local.get(
    ["increaseRate", "monthlyIncreaseRate"],
    function (result) {
      const increaseRate = result.increaseRate || defaultIncreaseRate;
      const monthlyIncreaseRate =
        result.monthlyIncreaseRate || defaultIncreaseRate;
      document.getElementById("increaseRate").value = increaseRate;
      document.getElementById("monthlyIncreaseRate").value =
        monthlyIncreaseRate;
      document.getElementById("currentWeeklyIncreaseRate").innerText =
        increaseRate + "%";
      document.getElementById("currentMonthlyIncreaseRate").innerText =
        monthlyIncreaseRate + "%";
    }
  );
}
function loadInvestmentDay() {
  chrome.storage.local.get(["investmentDay"], function (result) {
    investmentDay = result.investmentDay || 2;
    document.getElementById("investmentDay").value = investmentDay;
  });
}
function displayInvestmentInfo() {
  chrome.storage.local.get(
    ["investments", "increaseRate", "monthlyIncreaseRate", "investmentDay"],
    function (result) {
      const investments = result.investments || [];
      const increaseRate = result.increaseRate || defaultIncreaseRate;
      const monthlyIncreaseRate =
        result.monthlyIncreaseRate || defaultIncreaseRate;
      investmentDay = result.investmentDay || 2;
      const lastInvestment = investments[investments.length - 1];
      const today = getLocalDate();
      const lastInvestmentDate = lastInvestment ? lastInvestment.date : null;

      if (lastInvestmentDate) {
        document.getElementById("lastInvestmentDate").innerText =
          lastInvestmentDate;
      } else {
        document.getElementById("lastInvestmentDate").innerText = "暂无记录";
      }

      const nextDate = calculateNextInvestmentDate(
        lastInvestmentDate,
        today,
        investmentFrequency,
        investmentDay
      );
      document.getElementById("nextInvestmentDate").innerText = nextDate;

      const consecutiveDownDays = parseInt(
        document.getElementById("consecutiveDownDays").innerText,
        10
      );
      const investmentPercentage = calculateInvestmentPercentage(
        consecutiveDownDays,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );
      document.getElementById("currentInvestmentPercentage").innerText =
        investmentPercentage + "%";
    }
  );
}

function executeInvestment() {
  const consecutiveDownDays = parseInt(
    document.getElementById("consecutiveDownDays").innerText,
    10
  );
  chrome.storage.local.get(
    ["increaseRate", "monthlyIncreaseRate", "investmentDay"],
    function (result) {
      const increaseRate = result.increaseRate || defaultIncreaseRate;
      const monthlyIncreaseRate =
        result.monthlyIncreaseRate || defaultIncreaseRate;
      investmentDay = result.investmentDay || 2;
      const investmentPercentage = calculateInvestmentPercentage(
        consecutiveDownDays,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );
      const investmentAmount = calculateInvestmentAmount(investmentPercentage);
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
  );
}

function toggleSettings() {
  const settingsContainer = document.getElementById("settingsContainer");
  settingsContainer.classList.toggle("hidden");
}

function saveSettings() {
  const increaseRate = document.getElementById("increaseRate").value;
  const monthlyIncreaseRate = document.getElementById(
    "monthlyIncreaseRate"
  ).value;
  const investmentDay = document.getElementById("investmentDay").value;
  chrome.storage.local.set(
    {
      increaseRate: parseInt(increaseRate),
      monthlyIncreaseRate: parseInt(monthlyIncreaseRate),
      investmentDay: parseInt(investmentDay),
    },
    function () {
      const status = document.getElementById("settingsStatus");
      status.textContent = "设置已保存。";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
      loadIncreaseRate();
      loadInvestmentDay();
    }
  );
}