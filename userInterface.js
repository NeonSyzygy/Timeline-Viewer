document.addEventListener("DOMContentLoaded", () => {

  // Buttons
  const settingsButton = document.getElementById("timeline-button-open-settings");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsBackdrop = document.getElementById("settings-backdrop");
  const settingsClose = document.getElementById("settings-close-button");
  
  const sidebarLeftCheckbox = document.getElementById("setting-sidebar-left");
  
  // === SETTINGS PANEL OPEN/CLOSE ===
  
  settingsButton.addEventListener("click", () => {
    document.body.classList.add("settings-open");
  });
  
  settingsClose.addEventListener("click", () => {
    document.body.classList.remove("settings-open");
  });
  
  settingsBackdrop.addEventListener("click", () => {
    document.body.classList.remove("settings-open");
  });
  
  // === SIDEBAR LEFT/RIGHT SETTING ===
  
  sidebarLeftCheckbox.addEventListener("change", () => {
    if (sidebarLeftCheckbox.checked) {
      document.body.classList.add("sidebar-left");
    } else {
      document.body.classList.remove("sidebar-left");
    }
  });
  
  // === SIDEBAR SHOW/HIDE ===
  // You will later call these from your timeline logic:
  window.showSidebar = () => document.body.classList.remove("sidebar-hidden");
  window.hideSidebar = () => document.body.classList.add("sidebar-hidden");

});
    
// Make top bar scroll horizontally
const scrollArea = document.querySelector('.topbar-scroll-buttons');

scrollArea.addEventListener('wheel', (e) => {
  if (e.deltaY !== 0) {
    e.preventDefault();
    scrollArea.scrollLeft += e.deltaY;
  }
}, { passive: false });