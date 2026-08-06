// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
let timelineDataEdit = null; //timelineDataEdit is the current working copy of the chart
let flatEvents = [];
let flatTimelines = [];
let hashedEvents = new Map();
let hashedTimelines = new Map();
    
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
  // Create working copy of timeline data
  timelineDataEdit = structuredClone(timelineData);
  
  // Make sure all my variables are blank
  flatEvents = [];
  flatTimelines = [];
  hashedEvents.clear();
  hashedTimelines.clear();
  
  // Add all real and virtual events to the hashmap, and handle subtimeline replationships
  flatRecurse(timelineDataEdit, [null, null]);
  
  // 2. Synchronise every event relationship with each other in the hashmap
  //   2a. For events that are contemp with a timeline, simply add special relationship rules for follows timelineIDEntryA and prior to timelineIDExitA, and then ad the recipricals to the entry and exit events.
  // 3. Find all events that are contemp, and asign them to groups (create another hashmap where each ID contains a pointer to its group, so that I can look up any event ID and it will either return null if it is not yet asigned a group or it will return the group object).
  // 4. Find all events that have no relations, save them to another hash map.
  // 5. Fine all events that have no contemporaries, and save them to the groups hashmap.
  // (3, 4, and 5 can be done at the same time, I think)
  // }
  
  // drawEvents() {
  // 1. Create an array to store the current position of each column.
  // 2. For ever entry in the groups hashmap, count/save their priors and add any events with zero priors to a queue to be placed.
  // 3. Place an event, update the column psition record, and remove the event from the groups hashmap.
  // 4. Reduce the prior count of its followers, and if any of those followers now have no priors, add them to the queue.
  // 5. Place a new event, and so on.
  // 6. If the queue is empty and the groups hashmap is not, then you have a circular dependancy. (Optional: Itterate through the remaining events to find which ones have the least remaining priors, and display them to the user to be fixed)
  // }

  //for (const timeline of flatTimelines) {
  //  syncData(getById(timeline.id));
  //}
  //for (const event of flatEvents) {
  //  syncData(getById(event.id));
  //}
}

function flatRecurse(node, parentEntryExit) { // Only gets called one timeline nodes, not Events.
  if (node.id) { // If the timeline has a valid ID:
    //Insert virtual entry/exit events
    let currentEntryExit = handleVirtualEvents(node, parentEntryExit)
    
    // Insert real events between them.
    handleSubtimelineEvents(node, handleVirtualEvents(node, currentEntryExit));
    
    // Repeat for all timelines inside node
    for (const timeline of node.timelines) {
      flatRecurse(timeline, currentEntryExit);
    }
  }
}
  
function oldFlatRecurse(node) { // Leftover stuff I haven't replaced yet
  // Set all of the relations for the flat timeline.
  if (Array.isArray(node.priors)) {
    for (let p = 0, p < node.priors.length(), p++) { //const prior of node.priors) { // Needs to be converted to a regular integer for loop, this just gets the actual data object for the property
      flatTimelines[nodeIndex-1].priors.push(node.priors[prior]) // This pushes the data from timelineData and duplicates (links?) it to flatTimelines.
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
  
  for (let i = 0; i < (Array.isArray(node.timelines) ? node.timelines : []).length; i++) {
    flatRecurse(node.timelines[i], pathString + ".timelines[" + i + "]");
  }
  
  for (let i = 0; i < (Array.isArray(node.events) ? node.events : []).length; i++) {
    flatEvents.push({ id: node.events[i].id, path: pathString + ".events[" + i + "]",  height: 0, group: -1 });
  }
}

function handleVirtualEvents(node, entryExit) { // Returns entryExit. Only gets called one timeline nodes, not Events.
  // Save current timeline to the timelines hash map.
  hashedTimelines.set(node.id, node);
  
  // Initialize a variable to remember the last event added
  let lastVirtualEntryNode = null;
  let lastVirtualExitNode = null;
  let currentVirtualNode = null;
  
  // Set entry and exit to be the parent timeline virtual events if any are passed
  if (entryExit[0] != null) { lastVirtualEntryNode = entryExit[0]; }
  if (entryExit[1] != null) { lastVirtualExitNode = entryExit[1]; }
  
  // Add virtual entry events
  // For every column in the timeline:
  for (let c = 0, c < node.width, c++) {
    // Add new entry event to the current timeline, and save that object to currentVirtualNode
    currentVirtualNode = node.events[node.events.push({ id: '${node.id} Entry Node ${c}', type: "entry", priors: [], followers: [], contemporaries: [] })-1];
    
    // If it isn't the first virtual entry node:
    if (lastVirtualEntryNode != null) {
      // add the previous entry node as contemporary
      currentVirtualNode.contemporaries.push(lastVirtualEntryNode);
    }
    
    // Add event to the hashmap
    hashedEvents.set(currentVirtualNode.id, currentVirtualNode);
    
    // Save finished entry node as last node
    lastVirtualEntryNode = currentVirtualNode;
  }
  
  // Add virtual exit events
  // For every column in the timeline:
  for (let c = 0, c < node.width, c++) {
    // Add new exit event to the current timeline, and save that object to currentVirtualNode
    currentVirtualNode = node.events[node.events.push({ id: '${node.id} Exit Node ${c}', type: "exit", priors: [], followers: [], contemporaries: [] })-1];
    
    // If it isn't the first virtual exit node:
    if (lastVirtualExitNode != null) {
      // add the previous exit node as contemporary
      currentVirtualNode.contemporaries.push(lastVirtualExitNode);
    }
    
    // Add last entry as a prior of current event
    currentVirtualNode.priors.push(lastVirtualEntryNode);
    
    // Add event to the hashmap
    hashedEvents.set(currentVirtualNode.id, currentVirtualNode);
    
    // Save finished entry node as last node
    lastVirtualExitNode = currentVirtualNode;
  }
  
  // Return the last entry and exit events so i can mark real events as between them later
  return [lastVirtualEntryNode, lastVirtualExitNode];
}

function handleSubtimelineEvents(node, entryExitNodes) { // Only gets called one timeline nodes, not Events.
  // For every event in the current timeline:
  for (const event of node.events) {
    // Set entry/exit as Prior/follower
    event.priors.push(entryExitNodes[0]);
    event.followers.push(entryExitNodes[1]);
    
    // Add event to the hashmap
    hashedEvents.set(event.id, event);
  }
}

function deduplicate() {
  // For every event in the hashmap:
  for (const node of hashedEvents.values()) {
    // Expand the property array into a set (which removes duplicates) and then colapse back into an array
    if (Array.isArray(node.priors)) {
      node.priors = [...new Set(node.priors)];
    }
    if (Array.isArray(node.followers)) {
      node.followers = [...new Set(node.followers)];
    }
    if (Array.isArray(node.contemporaries)) {
      node.contemporaries = [...new Set(node.contemporaries)];
    }
  }
}

function syncData(node) { // Old, rewrite this
  // Check to make sure node actually has fields
  if (!Array.isArray(node.priors)) {
    node.priors = [];
  }
  if (!Array.isArray(node.followers)) {
    node.followers = [];
  }
  if (!Array.isArray(node.contemporaries)) {
    node.contemporaries = [];
  }
  
  // Check priors and assign follower
  for (const prior of node.priors) {
    const target = getById(priors);
    if (!target) continue;
    if (!Array.isArray(target.followers)) {
      target.followers = [];
    }
    if (!target.followers.includes(node.id)) {
      target.followers.push(node.id);
    }
  }
  
  // Check follower and assign prior
  for (const follower of node.followers) {
    const target = getById(followers);
    if (!target) continue;
    if (!Array.isArray(target.priors)) {
      target.priors = [];
    }
    if (!target.priors.includes(node.id)) {
      target.priors.push(node.id);
    }
  }
  
  // Check and assign contemporary
  for (const contemporary of node.contemporaries) {
    const target = getById(contemporaries);
    if (!target) continue;
    if (!Array.isArray(target.contemporaries)) {
      target.contemporaries = [];
    }
    if (!target.contemporaries.includes(node.id)) {
      target.contemporaries.push(node.id);
    }
  }
}
