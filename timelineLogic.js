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
  
  drawAllEvents(); // Render all events to the SVG, save their heights to flatEvents.
  // Group all contemporary events into group objects, then save those groups to their own array and mark individual events in flatEvents as being members of a contemporary group.
  // Place events 1 by one into an array (Gemini chat JavaScript Object and Array Manipulation).
    // call pushEvent() if there are overlaps.
    // call reorderEvent() if events hapen to be out of order when you place a new one.
  // When everything is organized, clear the SVG and draw everything top to bottom.
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

function groupContemporaries() {
  // For every event in flatEvents:
    //  If an event has contemporaries and it not already in a group:
      // Create an group entry in an object or array
      // call checkContemporaries() passing the group entry to it.
}

function checkContemporaries() { // Receives a pointer to a contemporary group
  // If the event is NOT a member of the group:
    addToContemporaryGroup() // Asign the event as a member of the passed group
    // for all of their contemporarys:
      // call checkContemporaries() passing on the same group object
}

function addToContemporaryGroup() { // Receives an event node and a ContemporaryGroup
  // Add group memeber info to the flatEvents object
  // Add ID to the contemporaryGroup object
}

function pushEvent() {
  // Check whether there is room to push the event
  // if not:
    // Call push() on the overlapping event by the amount overlapped
  // Call push() on the event's contemproaries
  // Check if the event's followers would no longer be valid if it moved
  // If so: call push() by the difference
  // Move the event
}

function drawAllEvents() {
  // For every event in flatEvents:
    // call drawEvent() on it
}

function drawEvent() {
  // read column and vertical position from flatEvents
  // draw the event into the SVG
}