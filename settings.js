// settings.js
import { defaultWeeklyIncreaseRate } from "./investment.js";
let investmentDay;

function loadIncreaseRate(increaseRateElementId, monthlyIncreaseRateElementId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(
      ["increaseRate", "monthlyIncreaseRate"],
      function (result) {
        const increaseRate = result.increaseRate || defaultWeeklyIncreaseRate;
        const monthlyIncreaseRate =
          result.monthlyIncreaseRate || defaultWeeklyIncreaseRate;
        document.getElementById(increaseRateElementId).value = increaseRate;
        document.getElementById(monthlyIncreaseRateElementId).value =
          monthlyIncreaseRate;
        document.getElementById("currentWeeklyIncreaseRate").innerText =
          increaseRate + "%";
        document.getElementById("currentMonthlyIncreaseRate").innerText =
          monthlyIncreaseRate + "%";
        resolve({ increaseRate, monthlyIncreaseRate });
      }
    );
  });
}

function loadInvestmentDay(investmentDayElementId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["investmentDay"], function (result) {
      investmentDay = result.investmentDay || 2;
      document.getElementById(investmentDayElementId).value = investmentDay;
      resolve(investmentDay);
    });
  });
}
function saveSettings(
  increaseRateElementId,
  monthlyIncreaseRateElementId,
  investmentDayElementId
) {
  const increaseRate = document.getElementById(increaseRateElementId).value;
  const monthlyIncreaseRate = document.getElementById(
    monthlyIncreaseRateElementId
  ).value;
  const investmentDay = document.getElementById(investmentDayElementId).value;
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(
      {
        increaseRate: parseInt(increaseRate),
        monthlyIncreaseRate: parseInt(monthlyIncreaseRate),
        investmentDay: parseInt(investmentDay),
      },
      function () {
        const status = document.getElementById("settingsStatus");
        status.textContent = "设置已保存。";
        setTimeout(function () {
          status.textContent = "";
        }, 750);
        resolve();
      }
    );
  });
}

function toggleSettings() {
  const settingsContainer = document.getElementById("settingsContainer");
  settingsContainer.classList.toggle("hidden");
}

export {
  loadIncreaseRate,
  loadInvestmentDay,
  saveSettings,
  toggleSettings,
  investmentDay,
};
