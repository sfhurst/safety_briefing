// :::: (DOM Listener) /////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("generate-pdf");

  setupDurationDropdown();
  setDefaults();
  populateStartTimeOptions();
  setDefaultStartTime();
  linkContactMethodAndFrequency();
  linkTemperatureToSeasonalHazards();
  linkWeatherToSurfaceCondition();
  linkSurfaceConditionToHazards();
  monitorInputChanges(button);
  monitorSpecificFields(["employee-name", "work-assignment", "safety-contact", "district"]);
  monitorShortcutsForFields(["employee-name", "safety-contact"], button);
  setupButtonBehavior(button);

  setYellow(button);
});

// :::: (Text Shortcuts) /////////////////////////////

const shortcutMap = {
  sy: "Chris Everman, Dustin Gay, Stephen Hurst, Jessica Waggoner",
  "sy-c": "Dustin Gay, Stephen Hurst, Jessica Waggoner",
  "sy-d": "Chris Everman, Stephen Hurst, Jessica Waggoner",
  "sy-j": "Chris Everman, Dustin Gay, Stephen Hurst",
  "sy-s": "Chris Everman, Dustin Gay, Jessica Waggoner",
};

function monitorShortcutsForFields(fieldIds, button) {
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        applyShortcuts(input, button);
        e.preventDefault();
      }
    });

    input.addEventListener("blur", () => {
      applyShortcuts(input, button);
    });
  });
}

function applyShortcuts(input, button) {
  const value = input.value.trim().toLowerCase();
  if (shortcutMap[value]) {
    input.value = shortcutMap[value];
    input.select();
    setYellow(button);
    saveToLocalStorage();
  }
}

// :::: (Button State) /////////////////////////////

// --- Set the button to yellow (confirm edits) ---
function setYellow(button) {
  button.classList.add("pending");
  button.textContent = "Confirm Edits";
}

// --- Set the button to blue (open PDF) ---
function setBlue(button) {
  button.classList.remove("pending");
  button.textContent = "Open PDF";
}

// :::: (Button Behavior) /////////////////////////////

function setupButtonBehavior(button) {
  button.addEventListener("click", (e) => {
    e.preventDefault();

    if (button.classList.contains("pending")) {
      if (!validateRequiredFields(button)) return;
      setBlue(button);
    } else {
      setYellow(button);
      generatePDF();
    }
  });
}

// :::: (Save Inputs Monitoring) /////////////////////////////

function monitorSpecificFields(fieldIds) {
  fieldIds.forEach((fieldId) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.addEventListener("input", saveToLocalStorage);
    }
  });
}

// :::: (Input Monitoring) /////////////////////////////

function monitorInputChanges(button) {
  const inputs = document.querySelectorAll("input, [contenteditable]");
  inputs.forEach((el) => {
    el.addEventListener("input", () => {
      setYellow(button);
      saveToLocalStorage();
    });
    el.addEventListener("focus", () => setYellow(button));
  });
}

/// :::: (Duration Dropdown) /////////////////////////////

function setupDurationDropdown() {
  const durationSelect = document.getElementById("duration");
  if (!durationSelect) return;

  // Clear any existing options
  durationSelect.innerHTML = "";

  const durations = [
    { value: 0.5, label: "30 minutes" },
    { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" },
    { value: 3, label: "3 hours" },
    { value: 4, label: "4 hours" },
    { value: 5, label: "5 hours" },
    { value: 6, label: "6 hours" },
  ];

  durations.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    durationSelect.appendChild(option);
  });
}

// :::: (Link Weather & Surface Condition) /////////////////////////////

function linkWeatherToSurfaceCondition() {
  const weatherSel = document.getElementById("weather");
  const surfaceSel = document.getElementById("surface");
  const hazSel = document.getElementById("seasonal-hazards");
  if (!weatherSel || !surfaceSel || !hazSel) return;

  weatherSel.addEventListener("change", () => {
    const w = weatherSel.value;

    if (w === "Light Rain" || w === "Light Snow") {
      surfaceSel.value = "Wet";
      surfaceSel.dispatchEvent(new Event("change"));
    }

    let hazard = "";
    if (w === "Light Snow") {
      hazard = "Ice, Snow, Slippery Surfaces";
    } else if (w === "Light Rain") {
      hazard = "Slippery Slopes, Mud";
    }

    if (hazard) {
      hazSel.value = hazard;
      hazSel.dispatchEvent(new Event("change"));
    }
  });
}

// :::: (Link Temperature to Seasonal Hazards) /////////////////////////////

function linkTemperatureToSeasonalHazards() {
  const tempSel = document.getElementById("temperature");
  const weatherSel = document.getElementById("weather");
  const hazSel = document.getElementById("seasonal-hazards");
  if (!tempSel || !weatherSel || !hazSel) return;

  tempSel.addEventListener("change", () => {
    const t = tempSel.value;
    const w = weatherSel.value;
    let hazard = "";

    // Weather overrides first
    if (w === "Light Snow") {
      hazard = "Ice, Snow, Slippery Surfaces";
    } else if (w === "Light Rain") {
      hazard = "Slippery Slopes, Mud";
    } else {
      // Then fall back to temperature logic
      if (t === "90-100" || t === "80-90") {
        hazard = "Sunburn, Dehydration, Heat Stroke, Air Quality";
      } else if (t === "20-30") {
        hazard = "Wind Chill, Frostbite, Hypothermia";
      } else if (t === "30-40") {
        hazard = "Ice, Snow, Slippery Surfaces";
      } else if (t === "40-50") {
        hazard = "Slippery Slopes, Mud";
      } else if (t === "50-60") {
        hazard = "Allergens, Pollen";
      } else if (t === "60-70" || t === "70-80") {
        hazard = "Insects, Ticks, Snakes, Wildlife";
      }
    }

    if (hazard) {
      hazSel.value = hazard;
      hazSel.dispatchEvent(new Event("change"));
    }
  });
}

// :::: (Link Surface Condition to Seasonal Hazards using Temp) /////////////////////////////

function linkSurfaceConditionToHazards() {
  const surfaceSel = document.getElementById("surface");
  const tempSel = document.getElementById("temperature");
  const hazSel = document.getElementById("seasonal-hazards");
  if (!surfaceSel || !tempSel || !hazSel) return;

  surfaceSel.addEventListener("change", () => {
    const surface = surfaceSel.value;
    const temp = tempSel.value;
    let hazard = "";

    if (!surface || !temp) return;

    const coldTemps = ["20-30", "30-40", "40-50"];
    const warmTemps = ["40-50", "50-60", "60-70", "70-80", "80-90"];

    // Ice/Snow logic for Icy or Snow Covered surfaces (cold temps up to 50)
    if ((surface === "Icy" || surface === "Snow Covered") && coldTemps.includes(temp)) {
      hazard = "Ice, Snow, Slippery Surfaces";
    }

    // Slippery logic for Wet surfaces
    if (surface === "Wet") {
      if (["20-30", "30-40"].includes(temp)) {
        hazard = "Ice, Snow, Slippery Surfaces"; // Too cold → ice
      } else if (warmTemps.includes(temp)) {
        hazard = "Slippery Slopes, Mud"; // Warm enough → mud
      }
    }

    if (hazard) {
      hazSel.value = hazard;
      hazSel.dispatchEvent(new Event("change"));
    }
  });
}

// :::: (Link Contact Method & Frequency) /////////////////////////////

function linkContactMethodAndFrequency() {
  const contactMethod = document.getElementById("contact-method");
  const contactFrequency = document.getElementById("contact-frequency");

  if (!contactMethod || !contactFrequency) return;

  contactMethod.addEventListener("change", () => {
    const method = contactMethod.value;

    let defaultFrequency = "";

    if (method === "Paired Work") {
      defaultFrequency = "Continuous Contact";
    } else if (method === "Text, Location Sharing" || method === "Group Text, Location Sharing") {
      defaultFrequency = "Check-In Every Hour";
    } else if (method === "Text" || method === "Group Text") {
      defaultFrequency = "Check-In Every 30 Minutes";
    }

    // Always update frequency based on method
    contactFrequency.value = defaultFrequency;
    contactFrequency.dispatchEvent(new Event("change"));
  });
}

// :::: (Highlight Incomplete Fields) /////////////////////////////

// Attach real-time highlight check for select fields
document.querySelectorAll("select").forEach((select) => {
  select.addEventListener("change", updateSelectHighlights);
});

// Attach real-time highlight check for input fields
document.querySelectorAll('input[type="text"], input[type="date"]').forEach((input) => {
  if (input.id !== "additional-notes") {
    input.addEventListener("input", updateSelectHighlights);
  }
});

function updateSelectHighlights() {
  // Highlight select fields
  document.querySelectorAll("select").forEach((select) => {
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption.text.includes("Select")) {
      select.style.backgroundColor = "#ffeeba"; // light yellow
    } else {
      select.style.backgroundColor = ""; // reset
    }
  });

  // Highlight blank input fields (excluding #additional-notes)
  document.querySelectorAll('input[type="text"], input[type="date"]').forEach((input) => {
    if (input.id === "additional-notes") return; // exclude

    if (input.value.trim() === "") {
      input.style.backgroundColor = "#ffeeba"; // light yellow
    } else {
      input.style.backgroundColor = ""; // reset
    }
  });
}

// :::: (Set Defaults) /////////////////////////////

// Function to set default values
function setDefaults() {
  const today = new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const day = ("0" + today.getDate()).slice(-2);
  const formattedDate = `${year}-${month}-${day}`; // Local-safe

  document.getElementById("date").value = formattedDate;
  // document.getElementById("start-time").value = "9:00 AM";
  document.getElementById("duration").value = "3";
  document.getElementById("speed-limit").value = "30-55";

  // Only restore text input fields that may have been edited
  const fieldsToRestore = ["employee-name", "work-assignment", "safety-contact", "district"];
  fieldsToRestore.forEach((fieldId) => {
    const saved = localStorage.getItem(fieldId);
    if (saved !== null) {
      const field = document.getElementById(fieldId);
      if (field) field.value = saved;
    }
  });

  updateSelectHighlights(); // Re-check highlights after setting values
}

// :::: (Save to Local Storage) /////////////////////////////

// Save specific fields to localStorage
function saveToLocalStorage() {
  const fieldsToSave = ["employee-name", "work-assignment", "safety-contact", "district"];
  fieldsToSave.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      localStorage.setItem(fieldId, field.value);
    }
  });
}

// :::: (Format & Set Time Field) /////////////////////////////

// Populate start time dropdown (6:00 AM to 5:30 PM)
function populateStartTimeOptions() {
  const startTimeSelect = document.getElementById("start-time");
  if (!startTimeSelect) return;

  const times = [];
  for (let hour = 6; hour <= 17; hour++) {
    times.push({ hour, minute: 0 });
    if (hour !== 17) times.push({ hour, minute: 30 });
  }

  times.forEach(({ hour, minute }) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = ((hour + 11) % 12) + 1;
    const displayMinutes = minute === 0 ? "00" : "30";
    const timeStr = `${displayHour}:${displayMinutes} ${period}`;

    const option = document.createElement("option");
    option.value = timeStr;
    option.textContent = timeStr;
    startTimeSelect.appendChild(option);
  });
}

function setDefaultStartTime() {
  const startTimeSelect = document.getElementById("start-time");
  if (!startTimeSelect) return;

  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  // Round to nearest 30-minute increment
  if (minutes >= 45) {
    hours++;
    minutes = 0;
  } else if (minutes >= 15) {
    minutes = 30;
  } else {
    minutes = 0;
  }

  // Clamp to allowed time range
  if (hours > 17 || (hours === 17 && minutes > 30)) {
    hours = 17;
    minutes = 30;
  }
  if (hours < 6) {
    hours = 6;
    minutes = 0;
  }

  // Convert to 12-hour format with AM/PM
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = ((hours + 11) % 12) + 1;
  const displayMinutes = minutes === 0 ? "00" : "30";
  const timeString = `${displayHour}:${displayMinutes} ${period}`;

  // Check if timeString exists in the options
  const optionExists = Array.from(startTimeSelect.options).some((opt) => opt.value === timeString);

  // Set the time to the closest valid option, or default to 9:00 AM if not found
  startTimeSelect.value = optionExists ? timeString : "9:00 AM";

  updateSelectHighlights(); // Re-check highlights after setting values
}

// :::: (Check Form Completion) /////////////////////////////

// Check for missing fields
function validateRequiredFields(button) {
  const requiredFields = [
    "employee-name",
    "work-assignment",
    "safety-contact",
    "date",
    "start-time",
    "duration",
    "district",
    "route",
    "speed-limit",
    "weather",
    "temperature",
    "surface",
    "traffic",
    "seasonal-hazards",
  ];

  const missingFields = requiredFields.filter((fieldId) => {
    const el = document.getElementById(fieldId);
    return !el || !el.value?.trim();
  });

  if (missingFields.length > 0) {
    const missingFieldNames = missingFields.map((fieldId) =>
      fieldId
        .replace("-", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );

    alert(`Please fill in the following fields: ${missingFieldNames.join(", ")}`);

    // Set button to pending/yellow
    button.classList.add("pending");
    button.textContent = "Confirm Edits";

    return false; // Validation failed
  }

  return true; // All good
}

// ::::: (Clone and Style Form for PDF) :::::::::::::::::

function cloneFormForPDF() {
  const form = document.getElementById("job-safety-form");
  const clone = form.cloneNode(true);

  // Replace inputs/selects with styled divs
  const fields = clone.querySelectorAll("input, select");
  fields.forEach((field) => {
    const div = document.createElement("div");
    div.style.marginBottom = "0.5rem";
    div.style.fontSize = "12px";

    const originalField = document.getElementById(field.id);
    if (originalField) {
      if (field.tagName === "SELECT") {
        const selectedValue = originalField.value;
        const selectedOption = [...field.options].find((o) => o.value.trim() === selectedValue.trim());
        div.textContent = selectedOption ? selectedOption.textContent : "";
      } else if (field.type === "date") {
        const iso = originalField.value;
        const parts = iso.split("-");
        div.textContent = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : "";
      } else {
        div.textContent = originalField.value || "";
      }

      field.replaceWith(div);
    } else {
      console.error(`Original field with ID ${field.id} not found.`);
    }
  });

  // Global styling
  clone.style.padding = "0";
  clone.style.maxWidth = "8in";
  clone.style.width = "100%";
  clone.style.boxSizing = "border-box";

  clone.querySelectorAll("h2").forEach((el) => (el.style.fontSize = "20px"));
  clone.querySelectorAll("h3").forEach((el) => (el.style.fontSize = "14px"));
  clone.querySelectorAll("label").forEach((el) => (el.style.fontSize = "12px"));
  clone.querySelectorAll("div").forEach((el) => {
    el.style.marginBottom = "0.5rem";
    el.style.fontSize = "12px";
  });
  clone.querySelectorAll("p").forEach((p) => {
    p.style.fontSize = "12px";
    p.style.marginBottom = "0.5rem";
    p.style.lineHeight = "1.4";
  });

  return clone;
}

// ::::: (PDF Options and Metadata) :::::::::::::::::

function getPDFOptions() {
  return {
    margin: [0.75, 0.5, 0.5, 0.5],
    filename: "Job Safety Briefing.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      windowWidth: 850,
    },
    jsPDF: {
      unit: "in",
      format: "letter",
      orientation: "portrait",
    },
    // You can add custom metadata here if you switch to using jsPDF directly
    // e.g., after generating blob, pass to jsPDF and use doc.setProperties({ ... })
  };
}

// ::::: (Generate PDF) ::::::::::::::::::::::::::::::

function generatePDF() {
  const additionalNotes = document.getElementById("additional-notes");
  if (additionalNotes && additionalNotes.value.trim() === "") {
    additionalNotes.value = "No notes.";
  }

  document.activeElement.blur(); // Kill iPhone keyboard

  const styledClone = cloneFormForPDF(); // Get cleaned/styled clone
  const options = getPDFOptions(); // Get PDF settings

  html2pdf()
    .set(options)
    .from(styledClone)
    .output("bloburl")
    .then((url) => {
      window.open(url, "_blank");
    });
}
