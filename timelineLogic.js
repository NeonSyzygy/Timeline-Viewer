// Saving and loading the json
    
let timelineData = null;
    
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
      timelineData = JSON.parse(text);
      populateSubtimelineList();
      
      console.log("Loaded timeline:", timelineData);
          
      // renderTimeline(timelineData);
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };
      
  input.click();
}

function handleSaveTimeline() {
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
    
// Handle Subtimelines

// Detect double click on <select>
const select = document.getElementById("subtimeline-select");
const renameInput = document.getElementById("subtimeline-rename-input");

select.addEventListener("dblclick", () => {
  const name = select.value;
  if (!name) return;
  
  // Show input
  renameInput.value = name;
  renameInput.style.display = "block";
  select.style.display = "none";
  
  renameInput.focus();
  renameInput.select();
});

// Handle rename confirmation
renameInput.addEventListener("blur", commitRename);
renameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") commitRename();
});

function commitRename() {
  const oldName = select.value;
  const newName = renameInput.value.trim();
  
  if (newName && newName !== oldName) {
    renameSubtimeline(timelineData, oldName, newName);
  }
  
  // Restore UI
  renameInput.style.display = "none";
  select.style.display = "block";
  
  // Rebuild list
  populateSubtimelineList();
  
  // Re-render timeline
  refreshTimeline();
}

// Recursively rename the subtimeline in the json
function renameSubtimeline(node, oldName, newName) {
  if (!node || !node.subTimelines) return false;
  
  if (node.subTimelines[oldName]) {
    node.subTimelines[newName] = node.subTimelines[oldName];
    delete node.subTimelines[oldName];
    return true;
  }
  
  for (const child of Object.values(node.subTimelines)) {
    if (renameSubtimeline(child, oldName, newName)) return true;
  }
  
  return false;
}

// Refresh the timeline logic
function refreshTimeline() {
  // Rebuild UI lists
  populateSubtimelineList();
  
  // Re-render the timeline
  renderTimeline(timelineData);
}

function collectSubtimelineNames(node, list) {
  if (!node || !node.subTimelines) return;
  
  for (const name of Object.keys(node.subTimelines)) {
    list.push(name);
    collectSubtimelineNames(node.subTimelines[name], list);
  }
}
    
function populateSubtimelineList() {
  const select = document.getElementById("subtimeline-select");
  select.innerHTML = "";
  
  // Add a blank option to allow deselection
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "(none)";
  select.appendChild(blank);
  
  // Recursively collect names
  const names = [];
  collectSubtimelineNames(timelineData, names);
  
  // Add each discovered sub-timeline
  for (const name of names) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
  
  // Default selection
  select.value = "";
}
    
// Add new subtimeline

// Add Subtimeline Event Listener
document.getElementById("timeline-button-add-subtimeline").addEventListener("click", handleAddSubtimeline);

function handleAddSubtimeline() {
  const select = document.getElementById("subtimeline-select");
  const parentName = select.value;
  
  // If nothing is selected, treat this as adding to the root
  const isRoot = !parentName;
  
  const newName = prompt("Enter a name for the new sub-timeline:");
  if (!newName || !newName.trim()) return;
  
  // Insert into JSON
  if (isRoot) {
    // Add directly under the root
    timelineData.subTimelines[newName.trim()] = {
      events: [],
      subTimelines: {}
    };
  } else {
    // Add under the selected parent
    addSubtimeline(timelineData, parentName, newName.trim());
  }
  
  // Refresh UI
  populateSubtimelineList();
  renderTimeline(timelineData);
}
    
function addSubtimeline(node, targetName, newName) {
  if (!node || !node.subTimelines) return false;
  
  if (node.subTimelines[targetName]) {
    node.subTimelines[targetName].subTimelines[newName] = {
      events: [],
      subTimelines: {}
    };
    return true;
  }
    
  for (const child of Object.values(node.subTimelines)) {
    if (addSubtimeline(child, targetName, newName)) return true;
  }
  
  return false;
}