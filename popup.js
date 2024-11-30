document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  displayInvestmentInfo();
  displayETFTrends(); // 显示ETF行情趋势
  document
    .getElementById("executeInvestment")
    .addEventListener("click", executeInvestment);
}

// 获取当前日期并根据时区转换为目标日期
function getLocalDate() {
  const userTimeZone = "Asia/Shanghai"; // 用户的时区（可以通过获取用户时区自动化）
  const date = new Date();
  const options = {
    timeZone: userTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const localDate = new Date(date.toLocaleString("en-US", options));
  return localDate;
}

// 从本地存储获取ETF数据（如果过期则重新拉取）
function getETFData() {
  const lastFetchedDate = localStorage.getItem("lastFetchedDate");
  const today = getLocalDate();

  // 检查数据是否已经过期，假设缓存过期时间为1周
  if (
    lastFetchedDate &&
    new Date(lastFetchedDate).getDate() === today.getDate()
  ) {
    // 数据不需要更新
    return JSON.parse(localStorage.getItem("etfPrices"));
  }

  // 否则需要重新拉取
  return fetchETFPrices();
}

// 保存ETF数据到本地
function saveETFData(prices) {
  const today = getLocalDate();
  localStorage.setItem("etfPrices", JSON.stringify(prices));
  localStorage.setItem("lastFetchedDate", today.toISOString());
}

// 获取ETF数据的函数
function fetchETFPrices() {
  const nasdaqSymbol = "QQQ"; // 纳斯达克ETF
  const sp500Symbol = "SPY"; // 标普500ETF
  const apiKey = "YOUR_ALPHA_VANTAGE_API_KEY"; // API密钥

  // 调用Alpha Vantage API获取ETF价格
  const nasdaqURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${nasdaqSymbol}&apikey=${apiKey}`;
  const sp500URL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sp500Symbol}&apikey=${apiKey}`;

  return Promise.all([
    fetch(nasdaqURL).then((response) => response.json()),
    fetch(sp500URL).then((response) => response.json()),
  ])
    .then((data) => {
      const nasdaqPrice = data[0]["Global Quote"]["05. price"];
      const sp500Price = data[1]["Global Quote"]["05. price"];
      const prices = {
        nasdaq: parseFloat(nasdaqPrice),
        sp500: parseFloat(sp500Price),
      };

      // 保存数据到本地
      saveETFData(prices);

      return prices;
    })
    .catch((error) => {
      console.error("获取ETF价格失败：", error);
      throw new Error("获取ETF价格失败");
    });
}

// 将时间转换为美国东部时间
function convertToEST(date) {
  const estTimeZone = "America/New_York";
  return new Date(date.toLocaleString("en-US", { timeZone: estTimeZone }));
}

// 检查当前时间是否符合交易时间
function isInMarketHours() {
  const currentDate = getLocalDate();
  const estDate = convertToEST(currentDate);

  const marketOpen = new Date(estDate.setHours(9, 30, 0)); // 9:30 AM EST
  const marketClose = new Date(estDate.setHours(16, 0, 0)); // 4:00 PM EST

  // 检查当前时间是否在交易时段内
  return currentDate >= marketOpen && currentDate <= marketClose;
}

// 显示投资信息
function displayInvestmentInfo() {
  chrome.storage.local.get(["investments"], function (result) {
    const investments = result.investments || [];
    const lastInvestment = investments[investments.length - 1];

    // 显示上次定投信息
    if (lastInvestment) {
      document.getElementById("lastInvestmentDate").innerText =
        lastInvestment.date;
    } else {
      document.getElementById("lastInvestmentDate").innerText = "暂无记录";
    }

    // 计算并显示下个定投日
    const nextDate = calculateNextInvestmentDate(
      lastInvestment ? lastInvestment.date : null
    );
    document.getElementById("nextInvestmentDate").innerText = nextDate;

    // 显示当前定投比例
    const currentPercentage = calculateCurrentInvestmentPercentage(investments);
    document.getElementById(
      "currentInvestmentPercentage"
    ).innerText = `${currentPercentage}%`;
  });
}

// 执行定投操作
function executeInvestment() {
  const baseInvestmentAmount = 100; // 基础定投金额
  const currentPercentage = getCurrentInvestmentPercentage(); // 获取当前定投比例
  const investmentAmount = (baseInvestmentAmount * currentPercentage) / 100;

  // 获取当前日期
  const today = new Date();
  const formattedDate = formatDate(today);

  // 获取ETF价格数据
  getETFData()
    .then((prices) => {
      // 检查是否在市场交易时间内
      if (!isInMarketHours()) {
        console.log("当前不在交易时间内，定投操作被跳过");
        return;
      }

      // 记录定投操作
      chrome.storage.local.get(["investments"], function (result) {
        const investments = result.investments || [];
        investments.push({
          date: formattedDate,
          amount: investmentAmount,
          prices: prices, // 可选，记录当日价格
        });
        chrome.storage.local.set({ investments: investments }, function () {
          document.getElementById("statusMessage").innerText = "定投成功！";
          displayInvestmentInfo();
        });
      });
    })
    .catch((error) => {
      document.getElementById("statusMessage").innerText =
        "定投失败，请稍后重试。";
      console.error("获取ETF价格失败：", error);
    });
}

// 计算下个定投日
function calculateNextInvestmentDate(lastDateStr) {
  const investmentDay = 2; // 周二 (0=周日, 1=周一, ..., 6=周六)
  let nextDate = new Date();

  if (lastDateStr) {
    nextDate = new Date(lastDateStr);
    nextDate.setDate(nextDate.getDate() + 7);
  }

  // 确保下个定投日为周二
  while (nextDate.getDay() !== investmentDay) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return formatDate(nextDate);
}

// 格式化日期为 yyyy-mm-dd 格式
function formatDate(date) {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

// 计算当前定投比例
function calculateCurrentInvestmentPercentage(investments) {
  // 第一阶段：固定100%
  // 后续阶段可根据趋势分析动态调整比例
  return 100;
}

function getCurrentInvestmentPercentage() {
  // 获取当前定投比例，默认100%
  return 100;
}

// 显示ETF行情趋势
function displayETFTrends() {
  const nasdaqSymbol = "QQQ"; // 纳斯达克ETF示例
  const sp500Symbol = "SPY"; // 标普500ETF示例
  const apiKey = "UVBRSRYRE9MIZ5JK"; // 请替换为您的API密钥

  // 获取纳斯达克和标普500的历史数据
  Promise.all([
    fetchETFFromWeekly(nasdaqSymbol, apiKey),
    fetchETFFromWeekly(sp500Symbol, apiKey),
  ])
    .then(([nasdaqData, sp500Data]) => {
      const nasdaqTrends = calculateTrends(nasdaqData);
      const sp500Trends = calculateTrends(sp500Data);

      // 更新纳斯达克趋势
      const nasdaqTrendsElement = document.getElementById("nasdaqTrends");
      nasdaqTrendsElement.innerHTML = nasdaqTrends.map(formatTrend).join(" | ");

      // 更新标普500趋势
      const sp500TrendsElement = document.getElementById("sp500Trends");
      sp500TrendsElement.innerHTML = sp500Trends.map(formatTrend).join(" | ");
    })
    .catch((error) => {
      document.getElementById("nasdaqTrends").innerText = "获取失败";
      document.getElementById("sp500Trends").innerText = "获取失败";
      console.error("获取ETF历史数据失败：", error);
    });
}

function fetchETFFromWeekly(symbol, apiKey) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      return data["Weekly Time Series"];
    })
    .catch((error) => {
      console.error(`获取${symbol}历史数据失败：`, error);
      throw new Error(`获取${symbol}历史数据失败`);
    });
}

function calculateTrends(data) {
  const trends = [];
  for (let date in data) {
    if (data.hasOwnProperty(date)) {
      const closePrice = parseFloat(data[date]["4. close"]);
      trends.push({ date, closePrice });
    }
  }
  return trends.reverse(); // 反转，以便最近的时间在前
}

function formatTrend({ date, closePrice }, index) {
  if (index === 0) return `${date}: 最新数据`;

  const previousClosePrice = trends[index - 1].closePrice;
  const percentageChange =
    ((closePrice - previousClosePrice) / previousClosePrice) * 100;
  const trend = percentageChange > 0 ? "涨" : "跌";
  const trendPercentage = percentageChange.toFixed(2);

  return `${date}: ${trend} ${Math.abs(trendPercentage)}%`;
}
