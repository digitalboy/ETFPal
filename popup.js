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

  let logMessage;
  switch (type) {
    case "error":
      logMessage = `[错误]: ${message}`;
      break;
    case "warning":
      logMessage = `[警告]: ${message}`;
      break;
    case "success":
      logMessage = `[成功]: ${message}`;
      break;
    default:
      logMessage = `[信息]: ${message}`;
  }

  statusBox.value += logMessage + "\n";
  statusBox.scrollTop = statusBox.scrollHeight;
}

function getLocalDate() {
  const userTimeZone = "Asia/Shanghai";
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
    logStatus("API密钥错误，请检查密钥。", "error");
    return false;
  }
  if (response["Note"]) {
    logStatus("API请求频率过高，请稍后重试。", "warning");
    return false;
  }
  if (!response["Global Quote"] || !response["Global Quote"]["05. price"]) {
    logStatus("API返回数据无效。", "error");
    return false;
  }
  return true;
}

function fetchETFPrices() {
  const nasdaqSymbol = "QQQ";
  const sp500Symbol = "SPY";
  const apiKey = "YOUR_ALPHA_VANTAGE_API_KEY";

  const nasdaqURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${nasdaqSymbol}&apikey=${apiKey}`;
  const sp500URL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sp500Symbol}&apikey=${apiKey}`;

  return Promise.all([
    fetch(nasdaqURL).then((response) => response.json()),
    fetch(sp500URL).then((response) => response.json()),
  ])
    .then((data) => {
      if (!validateAPIResponse(data[0]) || !validateAPIResponse(data[1])) {
        throw new Error("API返回无效数据");
      }

      const nasdaqPrice = parseFloat(data[0]["Global Quote"]["05. price"]);
      const sp500Price = parseFloat(data[1]["Global Quote"]["05. price"]);
      const prices = { nasdaq: nasdaqPrice, sp500: sp500Price };

      logStatus("成功获取ETF数据。", "success");
      return prices;
    })
    .catch((error) => {
      logStatus(`获取ETF价格失败: ${error.message}`, "error");
      throw error;
    });
}

function displayInvestmentInfo() {
  chrome.storage.local.get(["investments"], function (result) {
    const investments = result.investments || [];
    const lastInvestment = investments[investments.length - 1];

    if (lastInvestment) {
      document.getElementById("lastInvestmentDate").innerText =
        lastInvestment.date;
    } else {
      document.getElementById("lastInvestmentDate").innerText = "暂无记录";
    }

    const nextDate = calculateNextInvestmentDate(
      lastInvestment ? lastInvestment.date : null
    );
    document.getElementById("nextInvestmentDate").innerText = nextDate;

    document.getElementById("currentInvestmentPercentage").innerText = "100%";
  });
}

function executeInvestment() {
  const baseInvestmentAmount = 100;
  const investmentAmount = baseInvestmentAmount;

  getETFPrices()
    .then((prices) => {
      chrome.storage.local.get(["investments"], function (result) {
        const investments = result.investments || [];
        investments.push({
          date: new Date().toISOString().split("T")[0],
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

function calculateNextInvestmentDate(lastDateStr) {
  const investmentDay = 2;
  let nextDate = new Date();

  if (lastDateStr) {
    nextDate = new Date(lastDateStr);
    nextDate.setDate(nextDate.getDate() + 7);
  }

  while (nextDate.getDay() !== investmentDay) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${nextDate.getDate().toString().padStart(2, "0")}`;
}

function displayETFTrends() {
  logStatus("正在加载ETF趋势数据...", "info");
  fetchETFPrices()
    .then((prices) => {
      document.getElementById(
        "nasdaqTrends"
      ).innerText = `当前价格: $${prices.nasdaq}`;
      document.getElementById(
        "sp500Trends"
      ).innerText = `当前价格: $${prices.sp500}`;
      logStatus("成功加载ETF趋势数据。", "success");
    })
    .catch((error) => {
      document.getElementById("nasdaqTrends").innerText = "加载失败";
      document.getElementById("sp500Trends").innerText = "加载失败";
      logStatus(`加载ETF趋势数据失败: ${error.message}`, "error");
    });
}
