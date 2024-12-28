// popup.js
import { fetchETFData } from "./api.js";
import {
  calculateConsecutiveDownWeeks,
  calculateConsecutiveUpMonths,
} from "./data.js";
import {
  calculateInvestmentPercentage,
  executeInvestment,
} from "./investment.js";
import { calculateNextInvestmentDate } from "./investmentStrategy.js";
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

    // 监听来自 settings.js 的消息
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      if (request.action === "settingsUpdated") {
        displayAllInfo();
      }
    });
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

// 显示投资数据
async function displayInvestmentData(weeklyData, monthlyData) {
  const consecutiveDownWeeks = calculateConsecutiveDownWeeks(
    weeklyData.nasdaq,
    weeklyData.sp500,
    investmentFrequency
  );
  document.getElementById("consecutiveDownDaysQQQ").innerText =
    consecutiveDownWeeks.nasdaq;
  document.getElementById("consecutiveDownDaysSPY").innerText =
    consecutiveDownWeeks.sp500;

  const consecutiveUpMonths = calculateConsecutiveUpMonths(
    monthlyData.nasdaq,
    monthlyData.sp500
  );

  // 使用较小值来计算投资比例
  const consecutiveDownWeeksMin = Math.min(
    consecutiveDownWeeks.nasdaq,
    consecutiveDownWeeks.sp500
  );

  document.getElementById("consecutiveUpMonths").innerText =
    consecutiveUpMonths;

  chrome.storage.local.get(
    ["increaseRate", "monthlyIncreaseRate", "investmentDay"],
    function (result) {
      const increaseRate = result.increaseRate || 10;
      const monthlyIncreaseRate = result.monthlyIncreaseRate || 10;
      const today = getLocalDate();

      const nextDate = calculateNextInvestmentDate(
        null,
        today,
        investmentFrequency,
        investmentDay
      );
      const investmentPercentage = calculateInvestmentPercentage(
        consecutiveDownWeeksMin,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );
      displayInvestmentInfo(nextDate, investmentPercentage);
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
  const weeklyData = await fetchETFData("weekly");

  const investmentPercentage = calculateInvestmentPercentage(
    consecutiveDownDays,
    investmentFrequency,
    increaseRate,
    monthlyIncreaseRate
  );
  try {
    await executeInvestment(
      investmentPercentage,
      investmentFrequency,
      weeklyData
    );
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
