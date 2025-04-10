// Function to set default values
function setDefaults() {
  const today = new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const day = ("0" + today.getDate()).slice(-2);
  const formattedDate = `${year}-${month}-${day}`;

  document.getElementById("date").value = formattedDate;
  document.getElementById("start-time").value = "9:00";
  document.getElementById("speed-limit").value = "30-55";

  // Restore specific values from localStorage
  const fields = ["employee-name", "work-assignment", "safety-contact", "district"];
  fields.forEach((fieldId) => {
    const saved = localStorage.getItem(fieldId);
    if (saved !== null) {
      const element = document.getElementById(fieldId);
      if (element) element.value = saved;
    }
  });
}

// Save form data to local storage
function saveToLocalStorage() {
  const fields = ["employee-name", "work-assignment", "safety-contact", "district"];
  fields.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) localStorage.setItem(fieldId, element.value);
  });
}

// Save data on any input change for specified fields
window.onload = () => {
  setDefaults();

  const fieldsToWatch = ["employee-name", "work-assignment", "safety-contact", "start-time", "district", "speed-limit"];
  fieldsToWatch.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener("input", saveToLocalStorage);
    }
  });
};

function generatePDF() {
  // Force default values for certain form fields if they are empty
  document.getElementById("date").value ||= new Date().toISOString().split("T")[0]; // Default date to today's date
  document.getElementById("start-time").value ||= "9:00"; // Default start time
  document.getElementById("speed-limit").value ||= "30-55"; // Default speed limit range
  document.getElementById("duration").value ||= "4"; // Default duration value
  document.getElementById("district").value ||= "Crawfordsville"; // Default district value

  // Clone the form to avoid altering the original
  const form = document.getElementById("job-safety-form");
  const clone = form.cloneNode(true); // Create a deep copy of the form

  // Loop through each input, select, and div#editable field inside the cloned form
  const fields = clone.querySelectorAll("input, select, div#editable"); // Replace textarea with div#editable
  fields.forEach((field) => {
    const div = document.createElement("div"); // Create a div to hold the field's value for PDF rendering

    // Leave other inputs/selects unstyled — use your CSS or existing layout
    div.style.marginBottom = "0.5rem"; // Style the div with some margin
    div.style.fontSize = "16px"; // Set font size to 16px for readability in the PDF

    // Check if the current field is the editable div
    if (field.id === "editable") {
      div.style.border = "1px solid #ccc"; // Add border to div#editable
      div.style.padding = "0.5rem"; // Add padding for a better appearance
      div.style.boxSizing = "border-box"; // Ensure padding is included in the element's width/height
      div.style.minHeight = "96px"; // Set a minimum height of 4 rows (assuming each row is ~24px)
      div.style.lineHeight = "1.5"; // Set the line height for readability
      div.style.fontSize = "16px"; // Ensure the font size is the same as the rest of the form
      div.style.whiteSpace = "pre-wrap"; // Allow the div to respect line breaks and wrap text
      div.style.overflowY = "auto"; // Enable scrolling if content exceeds the minimum height
      div.style.wordWrap = "break-word"; // Ensure long words break and wrap properly
    }

    // Get the original field in the form to access its value
    const originalField = document.getElementById(field.id);
    if (originalField) {
      // Handle special case for editable div (e.g. #editable) separately
      if (field.id === "editable") {
        div.textContent = originalField.innerText || originalField.innerHTML; // Get content from the editable div
      }
      // Check if the field is a select dropdown and handle it accordingly
      else if (field.tagName === "SELECT") {
        const selectedValue = originalField.value; // Get the selected value of the dropdown
        const selectedOption = field.querySelector(`option[value="${selectedValue}"]`); // Find the option that matches the selected value
        div.textContent = selectedOption ? selectedOption.textContent : ""; // Set the div text to the option's text content
      }
      // Check if the field is a date input and format it into MM/DD/YYYY
      else if (field.type === "date") {
        const iso = originalField.value; // Get the ISO date format from the original field
        const parts = iso.split("-"); // Split the date into its components (year, month, day)
        div.textContent = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : ""; // Format the date as MM/DD/YYYY
      }
      // For other field types, simply set the div's text content to the field's value
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
  clone.style.fontSize = "16px"; // Set font size for the entire form
  clone.style.padding = "2rem"; // Add padding around the form for better readability
  clone.style.maxWidth = "8in"; // Set a max width of 8 inches (standard letter size) for PDF output
  clone.style.width = "100%"; // Ensure the form spans the full width within the max width
  clone.style.boxSizing = "border-box"; // Ensure padding is included in the width calculation

  // Insert a page break before the "Additional Comments" section (if it exists)
  const commentsSection = clone.querySelector("#additional-comments")?.closest(".form-section");
  if (commentsSection) {
    commentsSection.style.pageBreakBefore = "always"; // Force a page break before this section
    commentsSection.style.marginTop = "1in"; // Add some margin on top for spacing
  }

  // Use html2pdf to generate and open the PDF
  html2pdf()
    .set({
      margin: [0.2, 0.25, 0.2, 0.25], // Set margins for the PDF (top, right, bottom, left)
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

// Remove the previous code related to textareas since it's no longer used
document.querySelectorAll("div#editable").forEach((editableDiv) => {
  editableDiv.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
});
