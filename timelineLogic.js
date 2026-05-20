// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
let flatEvents = [];
let flatTimelines = [];
    
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
      
      buildTimeline();
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

function buildTimeline() { // Run this any time timelineData has changes that you want to show.
  flattenData(timelineData);
}

function flattenData(data) {
  flatEvents = [];
  flatTimelines = [];
  
  parseData(data, flatEvents, flatTimelines, "timelineData");
}

parseData(node, eventsList, timelinesList, pathString) {
  timelinesList.push({ id: node.id, path: pathString });
  
  if (!Array.isArray(node.timelines)) { // Logs an error if node.timelines is not a valid array.
    console.warn(`[TimelineParser] "timelines" missing or invalid at node "${node.id}". Treating as empty.`);
  }
  for (let i = 0; i < (Array.isArray(node.timelines) ? node.timelines : []).length; i++) {
    parseData(timeline, eventsList, timelinesList, pathString + ".timelines[" + i + "]");
  }
  
  if (!Array.isArray(node.events)) { // Logs an error if node.events is not a valid array.
    console.warn(`[TimelineParser] "events" missing or invalid at node "${node.id}". Treating as empty.`);
  }
  for (let i = 0; i < (Array.isArray(node.events) ? node.events : []).length; i++) {
    eventsList.push({ id: event.id, path: pathString + ".events[" + i + "]" });
  }
  
  return { data, flatEvents, flatTimelines };
}

function getById(id) { // This always returns the first matching ID, and treats timelines as higher priorety than events. Additionla matching ID obejcts will be invisible.
  let entry = flatTimelines.find(x => x.id === id);
  if (entry) return eval(entry.path);
  entry = flatEvents.find(x => x.id === id);
  if (entry) return eval(entry.path);
  return null;
}

