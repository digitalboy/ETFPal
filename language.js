export function detectAndSetLanguage() {
  // 获取浏览器语言
  const browserLang = navigator.language.toLowerCase();

  // 支持的语言列表
  const supportedLanguages = ["en", "zh"];

  // 确定使用哪种语言
  let targetLang = "en"; // 默认英语
  if (browserLang === "zh") {
    targetLang = "zh";
  }

  // 保存语言设置
  chrome.storage.local.set({ language: targetLang }, () => {
    console.log("Language set to:", targetLang); // add log
    updatePageContent(targetLang); // 确保在这里调用
  });

  return targetLang;
}

export function updatePageContent(lang) {
  console.log("Updating page content for language:", lang); // add log
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const messageKey = element.getAttribute("data-i18n");
    console.log("Processing element with key:", messageKey); //add log
    const translation = chrome.i18n.getMessage(messageKey);
    console.log("Translation for key:", messageKey, "is:", translation);
    if (translation) {
      element.textContent = translation;
    }
  });
}

export function getMessage(key, ...params) {
  return chrome.i18n.getMessage(key, params) || key;
}
