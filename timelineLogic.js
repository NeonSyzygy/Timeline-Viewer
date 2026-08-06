// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
let timelineDataEdit = null; //timelineDataEdit is the current working copy of the chart
let flatEvents = [];
let flatTimelines = [];
let hashedEvents = new Map();
let hashedtimelines = new Map();
    
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
  // prepData() {
  // 1. Build a copy of timelineData, and build a hashmap of every event in the copy by ID
  //   1a. Save the timeline to a timeline hashmap
  //   1b. For every timeline, place entry events where each is contemp with the previous.
  //   1c. Place exit events where each is contemporary with the last, and where at least one follows the entry events.
  //   1d. Place the timeline's internal events also marked as folowing the last entry event and prior to the exit events.
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
  
  prepData();
  for (const timeline of flatTimelines) {
    syncData(getById(timeline.id));
  }
  for (const event of flatEvents) {
    syncData(getById(event.id));
  }
}

function prepData() {
  timelineDataEdit = structuredClone(timelineData);
  hashedEvents.clear();
  flatEvents = [];
  flatTimelines = [];
  
  flatRecurse(timelineDataEdit, "timelineDataEdit");
}

//function flattenData(data) {
//  flatEvents = [];
//  flatTimelines = [];
//  
//  flatRecurse(data, "timelineData");
//}

function flatRecurse(node) { // Only gets called one timeline nodes, not Events.
  if (node.id) { // If the timeline has a valid ID:
    // Save it to the timelines hash map.
    hashedtimelines.set(node.id, node);
    
    // Initialize a variable to remember the last event added
    let lastVirtualNode = null;
    let currentVirtualNode = null;
    
    // For every column in the timeline:
    for (let c = 0, c < node.width, c++) {
      // Add new event to the current timeline, and save that object to currentEntryNode
      currentVirtualNode = node.events[node.events.push({ id: '${node.id} Entry Node ${c}', priors: [], followers: [], contemporaries: [] })-1];
      
      // If it isn't the first virtual entry node:
      if (lastVirtualNode != null) {
        // add the previous entry node as contemporary
        currentVirtualNode.contemporaries.push(lastVirtualNode);
      }
      
      // Add event to the hashmap
      hashedEvents.set(currentVirtualNode.id, currentVirtualNode);
      
      // Save finished entry node as last node
      lastVirtualNode = currentVirtualNode;
    }
  }
  
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
