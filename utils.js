// utils.js
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

function getUTCDate(date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * 计算连续下跌周期数（周/月），以阴线为标准
 * @param {Array<Array<[string, Object]>>} nasdaqEntries - 纳斯达克 ETF 的每周/月数据
 * @param {Array<Array<[string, Object]>>} sp500Entries - 标普500 ETF 的每周/月数据
 * @param {string} frequency - 定投周期，可选值 'weekly', 'monthly'
 * @returns {number} 最小连续下跌周期数
 */
function calculateConsecutiveDownWeeks(
  nasdaqEntries,
  sp500Entries,
  frequency = "weekly"
) {
  if (!nasdaqEntries || !sp500Entries) {
    return 0;
  }
  if (nasdaqEntries.length < 2 || sp500Entries.length < 2) {
    return 0;
  }
  let nasdaqDownPeriods = 0;
  let sp500DownPeriods = 0;

  // 计算纳斯达克连续下跌周期数
  for (let i = 1; i < nasdaqEntries.length; i++) {
    const currentOpen = parseFloat(nasdaqEntries[i][1]["1. open"]);
    const currentClose = parseFloat(nasdaqEntries[i][1]["4. close"]);

    if (isNaN(currentOpen) || isNaN(currentClose)) {
      console.error("Invalid price data:", nasdaqEntries[i][1]);
      break;
    }
    // 判断是否为阴线
    if (currentClose < currentOpen) {
      nasdaqDownPeriods++;
    } else {
      break; // 只要出现不是阴线的周，就停止计数
    }
  }

  // 计算标普500连续下跌周期数
  for (let i = 1; i < sp500Entries.length; i++) {
    const currentOpen = parseFloat(sp500Entries[i][1]["1. open"]);
    const currentClose = parseFloat(sp500Entries[i][1]["4. close"]);

    if (isNaN(currentOpen) || isNaN(currentClose)) {
      console.error("Invalid price data:", sp500Entries[i][1]);
      break;
    }
    // 判断是否为阴线
    if (currentClose < currentOpen) {
      sp500DownPeriods++;
    } else {
      break; // 只要出现不是阴线的周，就停止计数
    }
  }

  // 返回纳斯达克和标普500中连续下跌周期数的最小值
  return Math.min(nasdaqDownPeriods, sp500DownPeriods);
}

export { getLocalDate, getUTCDate, calculateConsecutiveDownWeeks };
