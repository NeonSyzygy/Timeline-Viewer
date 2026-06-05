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
  for (const timeline of flatTimelines) {
    syncData(getById(timeline.id));
  }
  for (const event of flatEvents) {
    syncData(getById(event.id));
  }
}

function flattenData(data) {
  flatEvents = [];
  flatTimelines = [];
  
  flatRecurse(data, "timelineData");
}

function flatRecurse(node, pathString) {
  flatTimelines.push({ id: node.id, path: pathString });
  
  if (!Array.isArray(node.timelines)) { // Logs an error if node.timelines is not a valid array.
    console.warn(`[TimelineParser] "timelines" missing or invalid at node "${node.id}". Treating as empty.`);
  }
  for (let i = 0; i < (Array.isArray(node.timelines) ? node.timelines : []).length; i++) {
    flatRecurse(node.timelines[i], pathString + ".timelines[" + i + "]");
  }
  
  if (!Array.isArray(node.events)) { // Logs an error if node.events is not a valid array.
    console.warn(`[TimelineParser] "events" missing or invalid at node "${node.id}". Treating as empty.`);
  }
  for (let i = 0; i < (Array.isArray(node.events) ? node.events : []).length; i++) {
    flatEvents.push({ id: node.events[i].id, path: pathString + ".events[" + i + "]" });
  }
}

function getById(id) { // This always returns the first timelineData object matching the ID, and treats timelines as higher priorety than events. Additional matching ID obejcts will be invisible.
  let entry = flatTimelines.find(x => x.id === id);
  if (entry) return eval(entry.path);
  entry = flatEvents.find(x => x.id === id);
  if (entry) return eval(entry.path);
  return null;
}

function syncData(node) {
  // Check to make sure node actually has fields
  if (!Array.isArray(node.prior)) {
    node.prior = [];
  }
  if (!Array.isArray(node.follower)) {
    node.follower = [];
  }
  if (!Array.isArray(node.contemporary)) {
    node.contemporary = [];
  }
  
  // Check priors and assign follower
  for (const prior of node.prior) {
    const target = getById(prior);
    if (!target) continue;
    if (!Array.isArray(target.follower)) {
      target.follower = [];
    }
    if (!target.follower.includes(node.id)) {
      target.follower.push(node.id);
    }
  }
  
  // Check follower and assign prior
  for (const follower of node.follower) {
    const target = getById(follower);
    if (!target) continue;
    if (!Array.isArray(target.prior)) {
      target.prior = [];
    }
    if (!target.prior.includes(node.id)) {
      target.prior.push(node.id);
    }
  }
  
  // Check and assign contemporary
  for (const contemporary of node.contemporary) {
    const target = getById(contemporary);
    if (!target) continue;
    if (!Array.isArray(target.contemporary)) {
      target.contemporary = [];
    }
    if (!target.contemporary.includes(node.id)) {
      target.contemporary.push(node.id);
    }
  }
}

// v Organize events and timelines into a single flat grid v //

// The psedocode that follows is only half thought out. Its close, but wrong. I need to group events into contemprary groups, which actually means i need to group EVENTS first and then also group THOSE groups as being contemproary with timelines. It might be useful to think of events that are contemproary but oputside a timeline as actually inside the timeline for the purposes of placing them.

function drawTimeline() {
  // For every event in flatEvents:
    // Check if the event has already been drawn
    // If not: call drawEvent() on it
}

function drawEvent() {
  // Check if the event has relations
    // If not: Put it in unconstrainedArray
    // Else: try to draw it in the SVG
      // If there is not room for it: Call push() to make room (See chats with Gemini)
      // Else: Draw it
    // Mark event as drawn, somehow
    // call drawEvent() for all of it's relations
}

function push() {
  // Check whether there is room to push the event
  // if not:
    // Call push() on the overlapping event by the amount overlapped
  // Call push() on the event's contemproaries
  // Check if the event's followers would no longer be valid if it moved
  // If so: call push() by the difference
  // Move the event
}

function drawTimelineBorder() {
  // The start and end positions, as well as the width, of the tiemlines are defined by the virtual arrow guide input and output events that every internal column of every timelne has. These virtual events will be listed in flatEvents.
}