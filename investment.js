// investment.js
import { getLocalDate } from "./utils.js";

const defaultWeeklyIncreaseRate = 10;

function calculateInvestmentPercentage(
  consecutiveDownWeeks,
  investmentFrequency,
  increaseRate,
  monthlyIncreaseRate
) {
  if (investmentFrequency === "weekly") {
    return (
      100 + consecutiveDownWeeks * (increaseRate || defaultWeeklyIncreaseRate)
    );
  } else if (investmentFrequency === "monthly") {
    return (
      100 +
      consecutiveDownWeeks * (monthlyIncreaseRate || defaultWeeklyIncreaseRate)
    );
  } else {
    return 100;
  }
}

function calculateInvestmentAmount(investmentPercentage) {
  return investmentPercentage; // For now, the amount is the percentage.
}

function calculateNextInvestmentDate(
  lastInvestmentDate,
  today,
  investmentFrequency,
  investmentDay
) {
  let nextDate = new Date(today);
  if (lastInvestmentDate) {
    nextDate = new Date(lastInvestmentDate);
  }

  if (investmentFrequency === "weekly") {
    nextDate.setDate(
      nextDate.getDate() + ((7 + investmentDay - nextDate.getDay()) % 7)
    );
  } else if (investmentFrequency === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(investmentDay);
    // 如果计算出来的日期小于当前日期，则月份再加 1
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options = {
    timeZone: userTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return nextDate.toLocaleString("en-US", options);
}
async function executeInvestment(investmentPercentage, investmentFrequency) {
  const investmentAmount = calculateInvestmentAmount(investmentPercentage);
  const today = getLocalDate();

  try {
    const weeklyData = await fetchETFData("weekly");
    const nasdaqLatest = Object.entries(weeklyData.nasdaq)[0];
    const sp500Latest = Object.entries(weeklyData.sp500)[0];
    const prices = {
      nasdaq: parseFloat(nasdaqLatest[1]["4. close"]),
      sp500: parseFloat(sp500Latest[1]["4. close"]),
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["investments"], function (result) {
        const investments = result.investments || [];
        investments.push({
          date: today.toISOString().split("T")[0],
          amount: investmentAmount,
          prices,
        });
        chrome.storage.local.set({ investments }, function () {
          logStatus("定投成功完成。", "success");
          resolve();
        });
      });
    });
  } catch (error) {
    logStatus(`定投操作失败: ${error.message}`, "error");
    throw error;
  }
}

export {
  calculateInvestmentPercentage,
  calculateInvestmentAmount,
  calculateNextInvestmentDate,
  defaultWeeklyIncreaseRate,
  executeInvestment,
};
