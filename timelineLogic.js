// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
let timelineDataEdit = null; //timelineDataEdit is the current working copy of the chart
let hashedEvents = new Map();
let hashedTimelines = new Map();
let contempGroups = [];
    
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
  hashedEvents.clear();
  hashedTimelines.clear();
  
  // Add all real and virtual events to the hashmap, and handle subtimeline replationships
  flatRecurse(timelineDataEdit, [null, null]);
  
  // Sync all relationships across all events, create contemporary groups
  syncData();
  
  // Find all 0 priors, add to draw queue, and set aside all 0 relationship events
  buildDrawQueue();
  
  // While there are events in the queue: draw them, add new ones, remove finished ones
  processQueue();
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
    // Add event to the hashmap
    hashedEvents.set(event.id, event);
    
    // Set entry/exit as Prior/follower
    addRelationship(event.id, entryExitNodes[0].id, 0);
    addRelationship(event.id, entryExitNodes[1].id, 1);
  }
}

function syncData() { // WIP
  // For every node in hashedTimelines
  For (node of hashedTimelines.values()) {
    // For every relationship in node:
      // If relationship is an event:
        // If target does not already have this relationship:
          // Add recipricol relationships on target
      // Else if relationship is a timeline:
        // If target does not already have this relationship:
          // Contemp: virtual entry nodes need to come prior to virtual exits on target, and vice versa
          // Prior/Follower: prior's exit nodes need to be priors of the follower's entry nodes.
        // All relationships here must be asigned to virtual events
  }
  
  // For every node in hashmap:
  For (node of hashedEvents.values()) {
    // For every relationship in node:
    For (prior of node.priors) {
      // If relationship is an event:
      if (prior.type == "event") {
        // If target does not already have this relationship:
          // Add recipricol relationships on target
      }
      // Else if relationship is a timeline:
      else { if (prior.type == "timeline") {
        // If target does not already have this relationship:
          // Add recipricol relatioships to entry0 and exit0
      }}
    }
    
    For (follower of node.followers) {
      
    }
    
    For (contemporary of node.contemporaries) {
      
    }
  }
  // relationships are now synced
  
  // Set contempGroups = [] just in case
  // For every node in hashmap:
    // let tempGroups = [];
    // if node has a group: add group to tempGroups
    // For every contemp in node:
      // If contemp has a group: add group to tempGroups
    // Switch (tempGroups.length()) {
      // case 0: Create new group, add node and all contemps to new group, update all node group pointers
      // case 1: add all events that arent already to group, addnode group pointers
      // case > 1 Create new group, add all events (from groups, and current node, and node.contemp) to new group, set all members of new group to point to new group.
    // In any case where an event is added to a group, new or merge:
      // Add it's relationships to the group obejct
      // Update the targets of those relationships to point to the group object instead.
  // Events are now grouped
  
  // For all groups:
    // Remove all events in groups from normal hashmap
    // Add virtual "group" type event (which contains it's events) to the hashmap
}

function addRelationship(targetId, relationshipId, relationshipType) { // Assumes virtual events have been built and all events are in hashmap
  // Check that we are not trying to asign a relationship to itself, and exit if so
  if (targetId == relationshipId) { return }
  // Check if targetId is a timeline
  let targetNode = hashedTimelines.get(targetId);
  // If not, then check if it's an event
  if (targetNode == undefined) { targetNode = hashedEvents.get(targetId); }
  // if not, then log an error and exit the funciton
  if (targetNode == undefined) {
    console.log("addRelationship() called on invalid node ID.");
    return
  }
  // targetNode is now the correct event/timeline object
  
  // Check what kind of relationship we are adding
  switch (relationshipType) {
    case 0: // add as priors
      switch (targetNode.type) {
        case "event": targetNode.priors.push(relationshipId);
        case "timeline": hashedEvents.get('${targetId} Entry Node 0').priors.push(relationshipId);
      }
    case 1: // add as followers
      switch (targetNode.type) {
        case "event": targetNode.followers.push(relationshipId);
        case "timeline": hashedEvents.get('${targetId} Exit Node 0').followers.push(relationshipId);
      }
    case 2: // add as contemporaries
      switch (targetNode.type) {
        case "event": targetNode.contemporaries.push(relationshipId);
        case "timeline":
      }
  }
}

function buildDrawQueue() {
  // For every event in hashmap:
    // If (node.priors.length() == 0) { add node to queue, remove from hashmap }
    // Else
      // If node.followers.length() == 0 { add to noRelations hashmap, remove from main hashmap }
}

function processQueue() {
  // Create an array to store the current position of each column.
  // while (queue.length > 0) {
    // let currentEvent = queue.shift();
    // for all in followers:
      // remove event from priors
      // If follower now has 0 priors: Add to queue
    // drawEvent(currentEvent);
  // If hashMap still has stuff in it: Something is wrong
  // Else: For every event in noRelations hashmap: drawEvent()
}

function drawEvent(node) {
  // Draw the event, idk
  // This will need to:
    // A) Get the column from the event itself, which likely includes checking the event's parent timeline starting column
    // B) handle groups, I guess by calling itself for every event in the group?
    // C) Read and update the posiiton of each column in the array created from processQueue()
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

