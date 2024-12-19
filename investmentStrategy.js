// investmentStrategy.js

const baseInvestmentAmount = 100; // 基础定投金额

/**
 * 计算连续下跌周数
 * @param {Array<Array<[string, Object]>>} nasdaqEntries - 纳斯达克 ETF 的每周数据
 * @param {Array<Array<[string, Object]>>} sp500Entries - 标普500 ETF 的每周数据
 * @returns {number} 最小连续下跌周数
 */
function calculateConsecutiveDownDays(nasdaqEntries, sp500Entries) {
  let nasdaqDownDays = 0;
  let sp500DownDays = 0;

  // 计算纳斯达克连续下跌周数
  for (let i = 1; i < nasdaqEntries.length; i++) {
    const prevClose = parseFloat(nasdaqEntries[i - 1][1]["4. close"]);
    const currClose = parseFloat(nasdaqEntries[i][1]["4. close"]);
    if (currClose < prevClose) {
      nasdaqDownDays++;
    } else {
      break;
    }
  }
  // 计算标普500连续下跌周数
  for (let i = 1; i < sp500Entries.length; i++) {
    const prevClose = parseFloat(sp500Entries[i - 1][1]["4. close"]);
    const currClose = parseFloat(sp500Entries[i][1]["4. close"]);
    if (currClose < prevClose) {
      sp500DownDays++;
    } else {
      break;
    }
  }

  // 返回纳斯达克和标普500中连续下跌周数的最小值
  return Math.min(nasdaqDownDays, sp500DownDays);
}

/**
 * 根据连续下跌周数计算投资百分比
 * @param {number} consecutiveDownDays - 连续下跌周数
 * @returns {number} 投资百分比
 */
function calculateInvestmentPercentage(consecutiveDownDays) {
  if (consecutiveDownDays <= 0) {
    return 100;
  }
  return 100 + consecutiveDownDays * 10;
}

/**
 * 根据投资百分比计算投资金额
 * @param {number} investmentPercentage - 投资百分比
 *  @returns {number} 投资金额
 */
function calculateInvestmentAmount(investmentPercentage) {
  return (baseInvestmentAmount * investmentPercentage) / 100;
}

/**
 * 计算下个投资日期的函数，根据定投周期和上一次投资日期，计算下次投资日期
 * @param {Date|string} lastDateStr - 上次投资日期
 * @param {Date} today - 今天日期
 * @param {string} investmentFrequency - 定投周期，可选值 'weekly', 'daily', 'monthly'
 * @param {number} investmentDay - 定投日，每周几（0-6） 或 每月几号(1-31)
 * @returns {string} 下一个投资日期
 */
function calculateNextInvestmentDate(
  lastDateStr,
  today,
  investmentFrequency,
  investmentDay
) {
  let nextDate = today;

  if (lastDateStr) {
    nextDate = new Date(lastDateStr);
    //处理字符串
    if (isNaN(nextDate)) {
      nextDate = new Date(lastDateStr.replace(/-/g, "/"));
    }
    switch (investmentFrequency) {
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        // 默认每周
        nextDate.setDate(nextDate.getDate() + 7);
    }
  }

  let daysUntilTargetDay = 0;
  let dayOfWeek; // 在switch语句之前声明
  switch (investmentFrequency) {
    case "weekly":
      dayOfWeek = nextDate.getDay(); //赋值
      daysUntilTargetDay = (investmentDay - dayOfWeek + 7) % 7;
      break;
    case "monthly":
      const dayOfMonth = nextDate.getDate();
      daysUntilTargetDay = investmentDay - dayOfMonth;
      if (daysUntilTargetDay < 0) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        const dayOfMonth = nextDate.getDate();
        daysUntilTargetDay = investmentDay - dayOfMonth;
      }
      break;
    case "daily":
      break;
    default:
      dayOfWeek = nextDate.getDay(); //赋值
      daysUntilTargetDay = (investmentDay - dayOfWeek + 7) % 7;
  }

  nextDate.setDate(nextDate.getDate() + daysUntilTargetDay);

  return `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${nextDate.getDate().toString().padStart(2, "0")}`;
}

export {
  calculateConsecutiveDownDays,
  calculateInvestmentPercentage,
  calculateInvestmentAmount,
  calculateNextInvestmentDate,
};
