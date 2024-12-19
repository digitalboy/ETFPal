// options.js
document.addEventListener("DOMContentLoaded", function () {
  loadIncreaseRate();
  document.getElementById("save").addEventListener("click", saveOptions);
});

function loadIncreaseRate() {
  chrome.storage.local.get("increaseRate", function (data) {
    document.getElementById("increaseRate").value = data.increaseRate || 10;
  });
}
function saveOptions() {
  const increaseRate = document.getElementById("increaseRate").value;
  chrome.storage.local.set(
    { increaseRate: parseInt(increaseRate) },
    function () {
      const status = document.getElementById("status");
      status.textContent = "设置已保存。";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    }
  );
}
