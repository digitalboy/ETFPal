// options.js
document.addEventListener("DOMContentLoaded", function () {
  loadIncreaseRate();
  document.getElementById("save").addEventListener("click", saveOptions);
});

function loadIncreaseRate() {
  chrome.storage.local.get(
    ["increaseRate", "monthlyIncreaseRate"],
    function (data) {
      document.getElementById("increaseRate").value = data.increaseRate || 10;
      document.getElementById("monthlyIncreaseRate").value =
        data.monthlyIncreaseRate || 10;
    }
  );
}
function saveOptions() {
  const increaseRate = document.getElementById("increaseRate").value;
  const monthlyIncreaseRate = document.getElementById(
    "monthlyIncreaseRate"
  ).value;

  chrome.storage.local.set(
    {
      increaseRate: parseInt(increaseRate),
      monthlyIncreaseRate: parseInt(monthlyIncreaseRate),
    },
    function () {
      const status = document.getElementById("status");
      status.textContent = "设置已保存。";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}
