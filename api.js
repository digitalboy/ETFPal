// api.js
const nasdaqSymbol = "QQQ_weekly";
const sp500Symbol = "SPY_weekly";
const nasdaqMonthlySymbol = "QQQ_monthly";
const sp500MonthlySymbol = "SPY_monthly";

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
    (!response["Weekly Time Series"] && !response["Monthly Time Series"]) ||
    (response["Weekly Time Series"] &&
      typeof response["Weekly Time Series"] !== "object") ||
    (response["Monthly Time Series"] &&
      typeof response["Monthly Time Series"] !== "object")
  ) {
    logStatus("API返回数据无效，缺少 Time Series。", "error");
    return false;
  }
  return true;
}

async function fetchETFData(frequency) {
  let nasdaqURL;
  let sp500URL;
  if (frequency === "weekly") {
    nasdaqURL = `https://eft-pal-weekly-data-provider.digitalboyzone.workers.dev/?etf=${nasdaqSymbol}`;
    sp500URL = `https://eft-pal-weekly-data-provider.digitalboyzone.workers.dev/?etf=${sp500Symbol}`;
  } else if (frequency === "monthly") {
    nasdaqURL = `https://eft-pal-monthly-data-provider.digitalboyzone.workers.dev/?etf=${nasdaqMonthlySymbol}`;
    sp500URL = `https://eft-pal-monthly-data-provider.digitalboyzone.workers.dev/?etf=${sp500MonthlySymbol}`;
  } else {
    throw new Error("Invalid frequency: " + frequency);
  }

  try {
    const [nasdaqResponse, sp500Response] = await Promise.all([
      fetch(nasdaqURL).then((response) => response.json()),
      fetch(sp500URL).then((response) => response.json()),
    ]);
    if (
      !validateAPIResponse(nasdaqResponse) ||
      !validateAPIResponse(sp500Response)
    ) {
      throw new Error("API 返回数据无效");
    }

    const nasdaqData =
      frequency === "weekly"
        ? nasdaqResponse["Weekly Time Series"]
        : nasdaqResponse["Monthly Time Series"];
    const sp500Data =
      frequency === "weekly"
        ? sp500Response["Weekly Time Series"]
        : sp500Response["Monthly Time Series"];
    const nasdaqRefreshed = nasdaqResponse["Meta Data"]["3. Last Refreshed"];
    const sp500Refreshed = sp500Response["Meta Data"]["3. Last Refreshed"];

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
  } catch (error) {
    logStatus(`获取 ${frequency} ETF 数据失败: ${error.message}`, "error");
    throw error;
  }
}
export { fetchETFData };
