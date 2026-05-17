document.addEventListener("DOMContentLoaded", () => {

  const viewport = document.querySelector(".timeline-visual-viewport");
  const content = document.getElementById("timeline-panzoom-container");
  
  // Current transform state
  let scale = 1;
  let originX = 0;
  let originY = 0;
  
  // Drag state
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  
  // Apply transform
  function updateTransform() {
    content.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
  }
  
  // === DESKTOP DRAG PAN ===
  viewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    originX += dx;
    originY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    updateTransform();
  });
  
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
  
  // === DESKTOP WHEEL ZOOM ===
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
  
    const zoomFactor = 1.1;
    const mouseX = e.clientX - viewport.getBoundingClientRect().left;
    const mouseY = e.clientY - viewport.getBoundingClientRect().top;
  
    const oldScale = scale;
    scale *= e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
  
    // Keep zoom centered on cursor
    originX = mouseX - (mouseX - originX) * (scale / oldScale);
    originY = mouseY - (mouseY - originY) * (scale / oldScale);
  
    updateTransform();
  }, { passive: false });
  
  // === MOBILE TOUCH PAN + PINCH ZOOM ===
  let touchMode = false;
  let lastTouchDist = 0;
  
  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }
  
  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      // Single finger drag
      touchMode = "drag";
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch zoom
      touchMode = "pinch";
      lastTouchDist = getTouchDist(e.touches);
    }
  });
  
  viewport.addEventListener("touchmove", (e) => {
    e.preventDefault();
  
    if (touchMode === "drag" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      originX += dx;
      originY += dy;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      updateTransform();
    }
  
    if (touchMode === "pinch" && e.touches.length === 2) {
      const newDist = getTouchDist(e.touches);
      const zoomFactor = newDist / lastTouchDist;
      lastTouchDist = newDist;
      
      const oldScale = scale;
      scale *= zoomFactor;
      
      // Zoom around midpoint
      const rect = viewport.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      
      originX = midX - (midX - originX) * (scale / oldScale);
      originY = midY - (midY - originY) * (scale / oldScale);
      
      updateTransform();
     }
  }, { passive: false });
  
  viewport.addEventListener("touchend", () => {
    touchMode = false;
  });
});