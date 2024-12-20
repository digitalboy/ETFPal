// data.js
import { getLocalDate } from "./utils.js";

function calculateConsecutiveDownWeeks(
  nasdaqData,
  sp500Data,
  investmentFrequency
) {
  if (!nasdaqData || !sp500Data) {
    return { nasdaq: 0, sp500: 0 };
  }
  const nasdaqEntries = Object.entries(nasdaqData);
  const sp500Entries = Object.entries(sp500Data);
  if (nasdaqEntries.length < 2 || sp500Entries.length < 2) {
    return { nasdaq: 0, sp500: 0 };
  }

  let nasdaqDownWeeks = 0;
  let sp500DownWeeks = 0;

  // 计算纳斯达克连续下跌周数 (从上周开始，不包括本周)
  for (let i = 1; i < nasdaqEntries.length - 1; i++) {
    const currentPrice = parseFloat(nasdaqEntries[i][1]["4. close"]);
    const previousPrice = parseFloat(nasdaqEntries[i + 1][1]["4. close"]);

    if (currentPrice < previousPrice) {
      nasdaqDownWeeks++;
    } else {
      break;
    }
  }

  // 计算标普500连续下跌周数 (从上周开始，不包括本周)
  for (let i = 1; i < sp500Entries.length - 1; i++) {
    const currentPrice = parseFloat(sp500Entries[i][1]["4. close"]);
    const previousPrice = parseFloat(sp500Entries[i + 1][1]["4. close"]);

    if (currentPrice < previousPrice) {
      sp500DownWeeks++;
    } else {
      break;
    }
  }

  return { nasdaq: nasdaqDownWeeks, sp500: sp500DownWeeks };
}

function calculateConsecutiveUpMonths(nasdaqData, sp500Data) {
  if (!nasdaqData || !sp500Data) {
    return 0;
  }
  const nasdaqEntries = Object.entries(nasdaqData);
  const sp500Entries = Object.entries(sp500Data);
  if (nasdaqEntries.length < 2 || sp500Entries.length < 2) {
    return 0;
  }

  let consecutiveUpMonths = 0;
  for (let i = 0; i < nasdaqEntries.length - 1; i++) {
    const currentNasdaqPrice = parseFloat(nasdaqEntries[i][1]["4. close"]);
    const previousNasdaqPrice = parseFloat(nasdaqEntries[i + 1][1]["4. close"]);

    const currentSP500Price = parseFloat(sp500Entries[i][1]["4. close"]);
    const previousSP500Price = parseFloat(sp500Entries[i + 1][1]["4. close"]);

    if (
      currentNasdaqPrice > previousNasdaqPrice &&
      currentSP500Price > previousSP500Price
    ) {
      consecutiveUpMonths++;
    } else {
      break;
    }
  }
  return consecutiveUpMonths;
}

export { calculateConsecutiveDownWeeks, calculateConsecutiveUpMonths };
