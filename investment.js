// investment.js
import { getLocalDate } from "./utils.js";
import { fetchETFData } from "./api.js";
import { calculateInvestmentPercentage } from "./investmentStrategy.js";

const defaultWeeklyIncreaseRate = 10;

function calculateInvestmentAmount(investmentPercentage) {
  return investmentPercentage; // For now, the amount is the percentage.
}

async function executeInvestment(
  investmentPercentage,
  investmentFrequency,
  weeklyData
) {
  const investmentAmount = calculateInvestmentAmount(investmentPercentage);
  const today = getLocalDate();

  try {
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
  defaultWeeklyIncreaseRate,
  executeInvestment,
};
