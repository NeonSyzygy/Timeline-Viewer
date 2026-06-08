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
  
  // For every event in flatEvents:
    // draw it off screen.
  // For every event in flatEvents:
    // If the event has no relations: Save it to noRelationships
    // If contemporaryGroup is false:
      // If the event has contemporaries:
        // Create a new group in contemporaryGroups
        // call assignContemporaries() for that event (which will set contemporaryGroup to be True in flat events, then recursively call assignContemporaries() again for all contemporaries.
      // Else (If no contemporaries):
        // save the event to noContemporaries
        // Set it's number of priors in noContemporaries
    // Else (If contemporaryGroup is True):
      // Do nothing, I guess
  // I now have 3 arrays: noRelationships, contemporaryGroups, and noContemporaries.
  // addToQueue()
    // for every entry in contemporaryGroups:
      // If the group has zero priors:
        // Add the group to the queue
        // Reduce all followers of the group
}

function flattenData(data) {
  flatEvents = [];
  flatTimelines = [];
  
  flatRecurse(data, "timelineData");
}

function flatRecurse(node, pathString) { // Only gets called one timeline nodes
  // Create the flat timeline get it's index, and prep its fields.
  const nodeIndex = flatTimelines.push({ id: node.id, path: pathString, priors: [], followers: [], contemporaries: [] });
  
  // Set all of the relations for the flat timeline.
  if (Array.isArray(node.priors)) {
    for (const prior of node.priors) { // Needs to be converted to a regular integer for loop, this just gets the actual data object for the property
      flatTimelines[nodeIndex].priors.push(node.priors[prior])
    }
  }
  if (Array.isArray(node.followers)) {
    for (const follower of node.followers) { // Needs to be converted to a regular integer for loop, this just gets the actual data object for the property
      flatTimelines[nodeIndex].followers.push(node.followers[follower])
    }
  }
  if (Array.isArray(node.contemporaries)) {
    for (const contemporary of node.contemporaries) { // Needs to be converted to a regular integer for loop, this just gets the actual data object for the property
      flatTimelines[nodeIndex].contemporaries.push(node.contemporaries[contemporary])
    }
  }
  
  // create entry virtual events, and put them in flatEvents.
  let entryNodes = [];
  for (const entry of node.columns) {
    entryNodes.push({ id: entry + "Entry", type: "entry", column: entry, priors: [], followers: [], contemporaries: [] }); 
  }
  for (let i = 0; i < entryNodes.length; i++) {
    for (const prior of node.priors) {
      entryNodes[i].priors.push(prior); // Add the timeline's priors to each entry node.
    }
    for (let c = 0; c < entryNodes.length; c++) {
      if (c != i) {
        entryNodes[c].contemporaries.push(entryNodes[i].id); // Add contemporaries for every entry.
      }
    }
  }
  flatEvents.concat(entryNodes);
  
  // create exit virtual events, and put them in flatEvents.
  let exitNodes = [];
  for (const exit of node.columns) {
    entryNodes.push({ id: exit + "Exit", type: "exit", column: entry, priors: [], followers: [], contemporaries: [] }); 
  }
  for (let i = 0; i < exitNodes.length; i++) {
    for (const prior of node.priors) {
      exitNodes[i].priors.push(prior); // Add the timeline's priors to each entry node.
    }
    for (let c = 0; c < exitNodes.length; c++) {
      if (c != i) {
        exitNodes[c].contemporaries.push(exitNodes[i].id); // Add contemporaries for every entry.
      }
    }
  }
  flatEvents.concat(exitNodes);
  
  for (let i = 0; i < (Array.isArray(node.timelines) ? node.timelines : []).length; i++) {
    flatRecurse(node.timelines[i], pathString + ".timelines[" + i + "]");
  }
  
  for (let i = 0; i < (Array.isArray(node.events) ? node.events : []).length; i++) {
    flatEvents.push({ id: node.events[i].id, path: pathString + ".events[" + i + "]",  height: 0, group: -1 });
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

