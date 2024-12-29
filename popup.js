// popup.js
import { fetchETFData } from "./api.js";
import {} from "./data.js";
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
    document
      .getElementById("toggleAbout")
      .addEventListener("click", toggleAbout);
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

    // 在 displayAllInfo 中获取最新的增幅比例
    chrome.storage.local.get(
      ["increaseRate", "monthlyIncreaseRate", "investmentDay"],
      async function (result) {
        const increaseRate = result.increaseRate || 10;
        const monthlyIncreaseRate = result.monthlyIncreaseRate || 10;
        await displayInvestmentData(
          weeklyData,
          monthlyData,
          increaseRate,
          monthlyIncreaseRate
        ); // 传递增幅比例
      }
    );
  } catch (error) {
    logStatus(`加载数据失败: ${error.message}`, "error");
  }
}

// 显示投资数据
async function displayInvestmentData(
  weeklyData,
  monthlyData,
  increaseRate,
  monthlyIncreaseRate
) {
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

  const consecutiveDownMonthsQQQ = calculateConsecutiveDownWeeks(
    Object.entries(monthlyData.nasdaq),
    [],
    "monthly"
  );
  const consecutiveDownMonthsSPY = calculateConsecutiveDownWeeks(
    [],
    Object.entries(monthlyData.sp500),
    "monthly"
  );

  document.getElementById("consecutiveDownDaysQQQ").innerText =
    consecutiveDownWeeksQQQ;
  document.getElementById("consecutiveDownDaysSPY").innerText =
    consecutiveDownWeeksSPY;
  document.getElementById("consecutiveDownMonthsQQQ").innerText =
    consecutiveDownMonthsQQQ;
  document.getElementById("consecutiveDownMonthsSPY").innerText =
    consecutiveDownMonthsSPY;

  chrome.storage.local.get(["investmentDay"], async function (result) {
    const today = getLocalDate();

    const nextDate = calculateNextInvestmentDate(
      null,
      today,
      investmentFrequency,
      result.investmentDay || investmentDay
    );

    const investmentPercentageQQQ = calculateInvestmentPercentage(
      consecutiveDownWeeksQQQ,
      consecutiveDownMonthsQQQ,
      increaseRate,
      monthlyIncreaseRate
    );

    const investmentPercentageSPY = calculateInvestmentPercentage(
      consecutiveDownWeeksSPY,
      consecutiveDownMonthsSPY,
      increaseRate,
      monthlyIncreaseRate
    );
    displayInvestmentInfo(
      nextDate,
      investmentPercentageQQQ,
      investmentPercentageSPY
    );
    // 在 displayInvestmentData 中更新 UI
    document.getElementById("currentWeeklyIncreaseRate").innerText =
      increaseRate + "%";
    document.getElementById("currentMonthlyIncreaseRate").innerText =
      monthlyIncreaseRate + "%";
  });
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

function toggleAbout() {
  const aboutContainer = document.getElementById("aboutContainer");
  if (aboutContainer.classList.contains("hidden")) {
    fetch("about.html")
      .then((response) => response.text())
      .then((html) => {
        aboutContainer.innerHTML = html;
        aboutContainer.classList.remove("hidden");
         // 添加关闭按钮的事件监听
        document.getElementById("closeAbout").addEventListener("click", closeAbout);
      })
       .catch((error) => {
        console.error("Failed to load about.html:", error);
        logStatus("加载关于页面失败", "error");
      });
  }else{
      aboutContainer.classList.add("hidden");
       aboutContainer.innerHTML = "";
  }
}
function closeAbout() {
  const aboutContainer = document.getElementById("aboutContainer");
  aboutContainer.classList.add("hidden");
    aboutContainer.innerHTML = "";
}