// popup.js
import { fetchETFData } from "./api.js";
import { calculateConsecutiveUpMonths } from "./data.js";
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
import { getLocalDate, calculateConsecutiveDownWeeks } from "./utils.js";

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
      if (request.action === "settingsChanged") {
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
  const consecutiveDownWeeksQQQ = calculateConsecutiveDownWeeks(
    Object.entries(weeklyData.nasdaq),
    [], // 传入空数组，只计算QQQ
    investmentFrequency
  );
  const consecutiveDownWeeksSPY = calculateConsecutiveDownWeeks(
    [],
    Object.entries(weeklyData.sp500), // 传入空数组，只计算SPY
    investmentFrequency
  );

  document.getElementById("consecutiveDownDaysQQQ").innerText =
    consecutiveDownWeeksQQQ;
  document.getElementById("consecutiveDownDaysSPY").innerText =
    consecutiveDownWeeksSPY;

  const consecutiveUpMonths = calculateConsecutiveUpMonths(
    monthlyData.nasdaq,
    monthlyData.sp500
  );

  document.getElementById("consecutiveUpMonths").innerText =
    consecutiveUpMonths;

  chrome.storage.local.get(
    ["increaseRate", "monthlyIncreaseRate", "investmentDay"],
    async function (result) {
      const increaseRate = result.increaseRate || 10;
      const monthlyIncreaseRate = result.monthlyIncreaseRate || 10;
      const today = getLocalDate();

      const nextDate = calculateNextInvestmentDate(
        null,
        today,
        investmentFrequency,
        result.investmentDay || investmentDay
      );

      const investmentPercentageQQQ = calculateInvestmentPercentage(
        consecutiveDownWeeksQQQ,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );

      const investmentPercentageSPY = calculateInvestmentPercentage(
        consecutiveDownWeeksSPY,
        investmentFrequency,
        increaseRate,
        monthlyIncreaseRate
      );
      displayInvestmentInfo(
        nextDate,
        investmentPercentageQQQ,
        investmentPercentageSPY
      );
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
