// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
    
document.getElementById("timeline-button-load-file").addEventListener("click", handleLoadTimeline);

document.getElementById("timeline-button-save-file").addEventListener("click", handleSaveTimeline);
    
function handleLoadTimeline() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
      
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
        
    const text = await file.text();
        
    try {
      timelineData = JSON.parse(text); // timelineData becomes the raw JSON from the file
      
      flattenData(timelineData);
      
      // renderTimeline(timelineData);
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };
      
  input.click();
}

function handleSaveTimeline() { // Saves the current state of timelineData to a file
  if (!timelineData) {
    alert("No timeline loaded.");
    return;
  }
  
  const json = JSON.stringify(timelineData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "timeline.json";
  a.click();
  
  URL.revokeObjectURL(url);
}

function flattenData(data) {
  
}