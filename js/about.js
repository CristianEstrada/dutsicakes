// js/about.js
function applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    const lang = window.i18n.getPreferredLanguage();
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = window.i18n.t(key, lang);
      if (val && val !== key) el.textContent = val;
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    try { applyTranslations(); } catch (e) { console.error(e); }
  
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.value = window.i18n.getPreferredLanguage();
    }
  });
  