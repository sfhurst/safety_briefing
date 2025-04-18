document.addEventListener("DOMContentLoaded", function () {
  // Populate duration dropdown
  const durationSelect = document.getElementById("duration");
  if (durationSelect) {
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${i} hour(s)`;
      durationSelect.appendChild(option);
    }
  }

  // Set defaults for the form fields
  setDefaults();

  populateStartTimeOptions();
  setDefaultStartTime();

  // Watch specific fields for changes and save to localStorage
  const fieldsToWatch = ["employee-name", "work-assignment", "safety-contact", "district"];
  fieldsToWatch.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener("input", saveToLocalStorage);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("input, [contenteditable]");
  const button = document.getElementById("generate-pdf");

  // Set the button to yellow (confirm edits)
  function setYellow() {
    button.classList.add("pending");
    button.textContent = "Record Edits";
  }

  // Set the button to blue (open PDF)
  function setBlue() {
    button.classList.remove("pending");
    button.textContent = "Open PDF";
  }

  // Trigger yellow state when input or contenteditable is focused or edited
  inputs.forEach((el) => {
    el.addEventListener("input", setYellow);
    el.addEventListener("focus", setYellow);
  });

  // Button click listener
  button.addEventListener("click", (e) => {
    e.preventDefault();

    if (button.classList.contains("pending")) {
      if (!validateRequiredFields(button)) return; // Stop if missing fields
      setBlue(); // All fields filled, allow PDF on next click
    } else {
      setYellow(); // Reset state
      generatePDF(); // Actually generate the PDF
    }
  });

  // Initial state
  setYellow(); // Start in the yellow state
});

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
    button.textContent = "Record Edits";

    return false; // Validation failed
  }

  return true; // All good
}

function generatePDF() {
  // Set default value for additional notes if blank
  const additionalNotes = document.getElementById("additional-notes");
  if (additionalNotes && additionalNotes.value.trim() === "") {
    additionalNotes.value = "No notes.";
  }

  // Close the iPhone keyboard if it is open
  document.activeElement.blur(); // Kills keyboard if it's up

  // Clone the form to avoid altering the original
  const form = document.getElementById("job-safety-form");
  const clone = form.cloneNode(true); // Create a deep copy of the form

  // Loop through each input and select field inside the cloned form
  const fields = clone.querySelectorAll("input, select");
  fields.forEach((field) => {
    const div = document.createElement("div"); // Create a div to hold the field's value for PDF rendering

    // Apply the same styling to the div
    div.style.marginBottom = "0.5rem"; // Style the div with some margin
    div.style.fontSize = "12px"; // Set font size to 16px for readability in the PDF

    // Get the original field in the form to access its value
    const originalField = document.getElementById(field.id);
    if (originalField) {
      // Handle 'select' dropdowns
      if (field.tagName === "SELECT") {
        const selectedValue = originalField.value; // Get the selected value of the dropdown
        const selectedOption = [...field.options].find((o) => o.value.trim() === selectedValue.trim()); // Find the option that matches the selected value
        div.textContent = selectedOption ? selectedOption.textContent : ""; // Set the div text to the option's text content
      }
      // Handle 'date' input fields
      else if (field.type === "date") {
        const iso = originalField.value; // Get the ISO date format from the original field
        const parts = iso.split("-"); // Split the date into its components (year, month, day)
        div.textContent = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : ""; // Format the date as MM/DD/YYYY
      }

      // Handle other field types (inputs, textareas)
      else {
        div.textContent = originalField.value || ""; // Use the field value or an empty string if it's empty
      }

      field.replaceWith(div); // Replace the original form field with the new div containing the value
    } else {
      // Log an error if the original field is not found in the form
      console.error(`Original field with ID ${field.id} not found.`);
    }
  });

  // Style the cloned form to ensure it renders nicely in the PDF
  clone.style.padding = "0"; // Add padding around the form for better readability
  clone.style.maxWidth = "8in"; // Set a max width of 8 inches (standard letter size) for PDF output
  clone.style.width = "100%"; // Ensure the form spans the full width within the max width
  clone.style.boxSizing = "border-box"; // Ensure padding is included in the width calculation

  // Apply global font styling inside the clone
  clone.querySelectorAll("h2").forEach((h2) => {
    h2.style.fontSize = "20px";
  });
  clone.querySelectorAll("h3").forEach((h3) => {
    h3.style.fontSize = "14px";
  });
  clone.querySelectorAll("label").forEach((label) => {
    label.style.fontSize = "12px";
  });
  clone.querySelectorAll("div").forEach((div) => {
    div.style.marginBottom = "0.5rem";
    div.style.fontSize = "12px";
  });
  clone.querySelectorAll("p").forEach((p) => {
    p.style.fontSize = "12px";
    p.style.marginBottom = "0.5rem";
    p.style.lineHeight = "1.4";
  });

  // Use html2pdf to generate and open the PDF
  html2pdf()
    .set({
      margin: [0.75, 0.5, 0.5, 0.5], // Set margins for the PDF (top, right, bottom, left)
      filename: "Job Safety Briefing.pdf", // Set the default filename for the PDF
      image: { type: "jpeg", quality: 0.98 }, // Set image quality and format
      html2canvas: {
        scale: 2, // Increase scale for better image quality
        useCORS: true, // Enable CORS to allow loading images from different origins
        windowWidth: 850, // Limit the width of the rendered page (this ensures the PDF doesn't get too wide)
      },
      jsPDF: {
        unit: "in", // Set the unit of measurement to inches
        format: "letter", // Set the PDF format to letter size
        orientation: "portrait", // Set the orientation to portrait (vertical)
      },
    })
    .from(clone) // Use the cloned form to generate the PDF
    .output("bloburl") // Output the PDF as a blob URL (used to open in a new window)
    .then((url) => {
      window.open(url, "_blank"); // Open the PDF in a new tab
    });
}
