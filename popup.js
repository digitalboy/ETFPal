// popup.js
import { fetchETFData } from "./api.js";
import {
  calculateConsecutiveDownWeeks,
  calculateConsecutiveUpMonths,
} from "./data.js";
import {
  calculateInvestmentPercentage,
  calculateNextInvestmentDate,
  executeInvestment,
} from "./investment.js";
import { logStatus, displayETFTrends, displayInvestmentInfo } from "./ui.js";
import {
  loadIncreaseRate,
  loadInvestmentDay,
  saveSettings,
  toggleSettings,
  investmentDay,
} from "./settings.js";
import { getLocalDate } from "./utils.js";

const investmentFrequency = "weekly"; // 默认每周
const increaseRateElementId = "increaseRate";
const monthlyIncreaseRateElementId = "monthlyIncreaseRate";
const investmentDayElementId = "investmentDay";

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  try {
    await loadIncreaseRate(increaseRateElementId, monthlyIncreaseRateElementId);
    await loadInvestmentDay(investmentDayElementId);
    await displayAllInfo();

    document
      .getElementById("executeInvestment")
      .addEventListener("click", executeInvestmentHandler);
    document
      .getElementById("toggleSettings")
      .addEventListener("click", toggleSettings);
    document
      .getElementById("saveSettings")
      .addEventListener("click", saveSettingsHandler);
  } catch (error) {
    logStatus(`初始化失败: ${error.message}`, "error");
  }
}

async function displayAllInfo() {
  try {
    logStatus("正在加载数据...", "info");
    const [weeklyData, monthlyData] = await Promise.all([
      fetchETFData("weekly"),
      fetchETFData("monthly"),
    ]);

    displayETFTrends(weeklyData, monthlyData);
    await displayInvestmentData(weeklyData, monthlyData);
  } catch (error) {
    logStatus(`加载数据失败: ${error.message}`, "error");
  }
}
async function displayInvestmentData(weeklyData, monthlyData) {
  const consecutiveDownWeeks = calculateConsecutiveDownWeeks(
    weeklyData.nasdaq,
    weeklyData.sp500,
    investmentFrequency
  );
  document.getElementById("consecutiveDownDays").innerText =
    consecutiveDownWeeks;

  const consecutiveUpMonths = calculateConsecutiveUpMonths(
    monthlyData.nasdaq,
    monthlyData.sp500
  );
  document.getElementById("consecutiveUpMonths").innerText =
    consecutiveUpMonths;
  chrome.storage.local.get(
    ["investments", "increaseRate", "monthlyIncreaseRate"],
    function (result) {
      const investments = result.investments || [];
      const increaseRate = result.increaseRate || 10;
      const monthlyIncreaseRate = result.monthlyIncreaseRate || 10;
      const lastInvestment = investments[investments.length - 1];
      const today = getLocalDate();
      const lastInvestmentDate = lastInvestment ? lastInvestment.date : null;

      const nextDate = calculateNextInvestmentDate(
        lastInvestmentDate,
        today,
        investmentFrequency,
        investmentDay
      );
      const investmentPercentage = calculateInvestmentPercentage(
        consecutiveDownWeeks,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );
      displayInvestmentInfo(lastInvestmentDate, nextDate, investmentPercentage);
    }
  );
}

async function executeInvestmentHandler() {
  const consecutiveDownDays = parseInt(
    document.getElementById("consecutiveDownDays").innerText,
    10
  );
  const { increaseRate, monthlyIncreaseRate } = await loadIncreaseRate(
    increaseRateElementId,
    monthlyIncreaseRateElementId
  );

  const investmentPercentage = calculateInvestmentPercentage(
    consecutiveDownDays,
    investmentFrequency,
    increaseRate,
    monthlyIncreaseRate
  );
  try {
    await executeInvestment(investmentPercentage, investmentFrequency);
    displayAllInfo();
  } catch (error) {
    logStatus(`执行定投失败: ${error.message}`, "error");
  }
}

async function saveSettingsHandler() {
  try {
    await saveSettings(
      increaseRateElementId,
      monthlyIncreaseRateElementId,
      investmentDayElementId
    );
  } catch (error) {
    logStatus(`保存设置失败: ${error.message}`, "error");
  }
}
