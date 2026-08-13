// Saving and loading the json
    
let timelineData = null; //timelineData is always the JSON text representation of the chart
let timelineDataEdit = null; //timelineDataEdit is the current working copy of the chart
let hashedEvents = new Map();
let hashedTimelines = new Map();
let hashedContempGroups = new Map();
let contempGroups = [0]; // index 0 is an int that counts how many groups I've created, to use as unique names

const COLUMN_WIDTH = 220; // width of a column in pixels
const COLUMN_SPACING = 0; // Vertical spacing between events in a column
let columnBottoms = {}; // Tracks current bottom Y coordinate per column index

let drawQueue = []; // The array holding the events ready to be drawn
    
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
    handleSubtimelineEvents(node, currentEntryExit);
    
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
  for (let c = 0; c < node.width; c++) {
    // Add new entry event to the current timeline, and save that object to currentVirtualNode
    currentVirtualNode = node.events[node.events.push({ id: `${node.id} Entry Node ${c}`, type: "event", subtype: "entry", priors: [], followers: [], contemporaries: [] })-1];
    
    // If it isn't the first virtual entry node:
    if (lastVirtualEntryNode != null) {
      // add the previous entry node as contemporary
      currentVirtualNode.contemporaries.push(lastVirtualEntryNode.id);
    }
    
    // Add event to the hashmap
    hashedEvents.set(currentVirtualNode.id, currentVirtualNode);
    
    // Save finished entry node as last node
    lastVirtualEntryNode = currentVirtualNode;
  }
  
  // Add virtual exit events
  // For every column in the timeline:
  for (let c = 0; c < node.width; c++) {
    // Add new exit event to the current timeline, and save that object to currentVirtualNode
    currentVirtualNode = node.events[node.events.push({ id: `${node.id} Exit Node ${c}`, type: "event", subtype: "exit", priors: [], followers: [], contemporaries: [] })-1];
    
    // If it isn't the first virtual exit node:
    if (lastVirtualExitNode != null) {
      // add the previous exit node as contemporary
      currentVirtualNode.contemporaries.push(lastVirtualExitNode.id);
    }
    
    // Add last entry as a prior of current event
    currentVirtualNode.priors.push(lastVirtualEntryNode.id);
    
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

function syncData() { // Synchronizes relationships across events and groups contemporaries 
  // For every node in both hashmaps:
  for (const node of [...hashedEvents.values(), ...hashedTimelines.values()]) {
    // For every relationship in node:
    for (const prior of node.priors) {
      // Add node as a follower of prior
      addRelationship(prior, node.id, 1);
    }
    for (const follower of node.followers) {
      // Add node as a prior of follower
      addRelationship(follower, node.id, 0);
    }
    for (const contemporary of node.contemporaries) {
      // Add node as a contemporaries of contemporary
      addRelationship(contemporary, node.id, 2);
    }
  }
  // relationships are now synced
  
  // Create all contemporary groups
  contempGroups = [0] // just in case
  
  // For every node in hashmap:
  for (const node of hashedEvents.values()) {
    let tempGroups = []; // This will store all related groups discovered, to be merged later
    
    // if node has a group: add group to tempGroups
    if (node.contemporaryGroup) { tempGroups.push(hashedContempGroups.get(node.contemporaryGroup)); }
    
    // For every contemp in node:
    for (const contemp of node.contemporaries) {
      // If contemp has a group: add group to tempGroups
      let thisEvent = hashedEvents.get(contemp).contemporaryGroup
      if (thisEvent) { tempGroups.push(hashedContempGroups.get(thisEvent)); }
    }
    
    let newGroup;
    switch (true) {
      // if no contemps have a group:
      case (tempGroups.length === 0): // Create new group, add node and all contemps to new group, update all node group pointers
        newGroup = addContemporaryGroup();
        
        // Set current node
        newGroup.members.push(node);
        node.contemporaryGroup = newGroup.id;
        
        for (const contemp of node.contemporaries) {
          // add contemp to group as memeber
          newGroup.members.push(hashedEvents.get(contemp));
          
          // update contemp's group value to be newGroup
          hashedEvents.get(contemp).contemporaryGroup = newGroup.id;
        }
        
        newGroup.members = deduplicateSingle(newGroup.members);
        break;
      
      // if contemps only have 1 group between them:
      case (tempGroups.length === 1): // add all events that arent already to group, addnode group pointers
        newGroup = tempGroups[0];
        
        // Set current node
        newGroup.members.push(node);
        node.contemporaryGroup = newGroup.id;
        
        for (const contemp of node.contemporaries) {
          // add contemp to group as memeber
          newGroup.members.push(hashedEvents.get(contemp));
          
          // update contemp's group value to be newGroup
          hashedEvents.get(contemp).contemporaryGroup = newGroup.id;
        }
        
        newGroup.members = deduplicateSingle(newGroup.members);
        break;
      
      // if contemps have more than 1 group:
      case ( tempGroups.length > 1): // Create new group, add all events (from groups, and current node, and node.contemp) to new group, set all members of new group to point to new group.
        newGroup = addContemporaryGroup();
        
        // For every contemp of every member of every group involved:
        for (const oldGroup of tempGroups) {
          for (const member of oldGroup.members) {
            // add member to group as memeber
            newGroup.members.push(member);
            
            // update member's group value to be newGroup
            member.contemporaryGroup = newGroup.id;
            
            for (const contemp of member.contemporaries) {
              // add contemp to group as memeber
              newGroup.members.push(hashedEvents.get(contemp));
              
              // update contemp's group value to be newGroup
              hashedEvents.get(contemp).contemporaryGroup = newGroup.id;
            }
          }
        }
        
        // Set current node
        newGroup.members.push(node);
        node.contemporaryGroup = newGroup.id;
        
        // For every contemp of the active event:
        for (const contemp of node.contemporaries) {
          // add contemp to group as memeber
          newGroup.members.push(hashedEvents.get(contemp));
          
          // update contemp's group value to be newGroup
          hashedEvents.get(contemp).contemporaryGroup = newGroup.id;
        }
        
        newGroup.members = deduplicateSingle(newGroup.members);
        for (const group of tempGroups) { hashedContempGroups.delete(group.id); }
        break;
    }
  }
  // Events are now grouped
  
  let eventDeleteQueue = [];
  // For all groups:
  for (const group of hashedContempGroups.values()) {
    // Add group to the hashmap
    hashedEvents.set(group.id, group);
    
    // For all members of the gorup
    for (const member of group.members) {
      // Add it's priors and followers to the group obejct
      group.priors = [...new Set([...group.priors, ...member.priors])]; // This prevents duplicates, consider making this a fucntion .-.
      group.followers = [...new Set([...group.followers, ...member.followers])];
      
      // Update the targets of those relationships to point to the group object instead.
      for (const prior of member.priors) {
        // Remove member from the prior's list of followers
        hashedEvents.get(prior).followers = hashedEvents.get(prior).followers.filter(id => id !== member.id);
        
        // Add group.id to the prior's followers
        hashedEvents.get(prior).followers.push(group.id);
      }
      
      for (const follower of member.followers) {
        // Remove member from the follower's list of priors
        hashedEvents.get(follower).priors = hashedEvents.get(follower).priors.filter(id => id !== member.id);
        
        // Add group.id to the follower's priors
        hashedEvents.get(follower).priors.push(group.id);
      }
      
      // Queue up event for deletion later
      eventDeleteQueue.push(member.id);
    }
  }
  
  // Delete all events that were members of groups
  eventDeleteQueue = deduplicateSingle(eventDeleteQueue);
  for (eventID of eventDeleteQueue) { hashedEvents.delete(eventID); }
  
  // All that remains should be groups of contemporary events and single events. Ready to count priors and draw.
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
    console.log("addRelationship() called with invalid target ID.");
    return
  }
  // targetNode is now the correct event/timeline object
  
  // Check if relationshipid is a timeline
  let relationshipNode = hashedTimelines.get(relationshipId);
  // If not, then check if it's an event
  if (relationshipNode == undefined) { relationshipNode = hashedEvents.get(relationshipId); }
  // if not, then log an error and exit the funciton
  if (relationshipNode == undefined) {
    console.log("addRelationship() called with invalid relationship ID.");
    return
  }
  // targetNode is now the correct event/timeline object
  
  // Check what kind of relationship we are adding
  switch (relationshipType) {
    case 0: // add as priors
      switch (targetNode.type) {
        case "event":
          targetNode.priors.push(relationshipId);
          break;
          
        case "timeline":
          hashedEvents.get(`${targetId} Entry Node 0`).priors.push(relationshipId);
          break;
      }
      break;
      
    case 1: // add as followers
      switch (targetNode.type) {
        case "event":
          targetNode.followers.push(relationshipId);
          break;
          
        case "timeline":
          hashedEvents.get(`${targetId} Exit Node 0`).followers.push(relationshipId);
          break;
      }
      break;
      
    case 2: // add as contemporaries
      switch (targetNode.type) {
        case "event":
          targetNode.contemporaries.push(relationshipId);
          break;
          
        case "timeline":
          if (relationshipNode.type == "event") { // If the target is a timeline and the value is an event
            hashedEvents.get(`${targetId} Entry Node 0`).followers.push(relationshipId);
            hashedEvents.get(`${targetId} Exit Node 0`).priors.push(relationshipId);
          }
          else if (relationshipNode.type == "timeline") { // If both target and value are timelines
            hashedEvents.get(`${targetId} Entry Node 0`).followers.push(`${relationshipId} Exit Node 0`);
            hashedEvents.get(`${targetId} Exit Node 0`).priors.push(`${relationshipId} Entry Node 0`);
          }
          break;
      }
      break;
  }
}

function addContemporaryGroup() { // creates, and then returns, an empty group object with a unique name
  // Increment the number of created groups so that I have a unique value
  contempGroups[0]++;
  
  // Add the new group object to the group array
  contempGroups.push(
    {
      "id": `contemporaryGroup${contempGroups[0]}`,
      "type": "contemporaryGroup",
      "members": [],
      "priors": [],
      "followers": [],
      "contemporaries": []
    }
  )
  
  // Save the group to the group hashmap
  hashedContempGroups.set(`contemporaryGroup${contempGroups[0]}`, contempGroups.at(-1));
  
  // Return the group object so that I can add members to it more eaisly
  return contempGroups.at(-1);
}

function buildDrawQueue() {
  drawQueue = [] // Just in case
  let deleteQueue = [] // Nodes to be deleted from the hashmap
  
  // For every event in hashmap:
  for (node of hashedEvents.values()) {
    // If a node has no priors:
    if (node.priors.length == 0) {
      // add node to queue
      drawQueue.push(node);
      // add node to delete queue
      deleteQueue.push(node);
    }
  }
  
  // Until the delete queue is empty:
  while (deleteQueue.length > 0) {
    // Remove node from the hashmap
    hashedEvents.delete(deleteQueue[0].id)
    // Remove node from delete queue
    deleteQueue.splice(0, 1);
  }
}

function processQueue() {
  columnBottoms = []; // just in case
  
  // Until the draw queue is empty:
  while (drawQueue.length > 0) {
    // Remove the first event in drawQueue and save it
    let currentEvent = drawQueue.shift();
    
    // for all of currentEvent's followers:
    for (follower of currentEvent.followers) {
      // remove currentEvent from follower's priors
      follower.priors.filter(currentEvent.id);
      
      // If follower now has 0 priors:
      if (follower.priors.length == 0) {
        // Add to queue
        drawQueue.push(follower);
        // Remove from hashmap
        hashedEvents.delete(follower.id);
      }
    }
    
    // Draw the event
    drawEvent(currentEvent);
  }
  
  // If hashMap still has stuff in it:
  if (hashedEvents.values().length > 0) {
    console.log("circular dependancy in events likely");
  }
}

function drawEvent(node) {
  // get pan and zoom container
  const panZoomContainer = document.getElementById("timeline-panzoom-container");
  
  const columnIndex = getColumnIndex(node);
  const xPosition = columnIndex * COLUMN_WIDTH;
  
  // Initialize vertical tracker for this column if needed
  if (columnBottoms[columnIndex] === undefined) {
    columnBottoms[columnIndex] = 0;
  }
  const yPosition = columnBottoms[columnIndex];
  
  // Create the event container
  const eventContainer = document.createElement("div");
  eventContainer.className = "timeline-event-box";
  eventContainer.style.position = "absolute";
  eventContainer.style.left = `${xPosition}px`;
  eventContainer.style.top = `${yPosition}px`;
  eventContainer.style.width = `${COLUMN_WIDTH}px`;
  
  // Add event content
  eventContainer.textContent = node.id;
  
  // Add event to the Pan and Zoom container
  panZoomContainer.appendChild(eventContainer);
  
  // Read event height
  const measuredHeight = eventContainer.offsetHeight;
  
  // Update the column's bottom tracker
  columnBottoms[columnIndex] += measuredHeight + COLUMN_SPACING;
}

function getColumnIndex(node) {
  // If the node is not root, add its column and continue the chain
  if (node.subtype != "root") { return node.column + getColumnIndex(hashedEvents.get(node.parent)); }
  // Else, if the node is root, Return 0 and complete the chain
  else if (node.subtype == "root") { return 0; }
}

function deduplicateFull() {
  // For every event in the event hashmap:
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
  
  // For every group in the contemp group hashmap:
  for (const node of hashedContempGroups.values()) {
    // Expand its members array to a set, then colapse
    node.members = [...new Set(node.members)];
  }
}

function deduplicateSingle(list) { // Send any spreadable thing to this and it will deduplicate it and return it
  return [...new Set(list)];
}
