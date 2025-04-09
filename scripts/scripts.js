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
  // Force default values
  document.getElementById("date").value ||= new Date().toISOString().split("T")[0];
  document.getElementById("start-time").value ||= "9:00";
  document.getElementById("speed-limit").value ||= "30-55";
  document.getElementById("duration").value ||= "4"; // Default value
  document.getElementById("district").value ||= "Crawfordsville";

  const form = document.getElementById("job-safety-form");
  const clone = form.cloneNode(true);

  // Loop through each input/select/textarea field
  const fields = clone.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    const div = document.createElement("div");
    div.style.marginBottom = "0.5rem";
    div.style.fontSize = "16px";

    // Find the original field by ID and get its value
    const originalField = document.getElementById(field.id); // Get the original field by ID

    if (originalField) {
      if (field.tagName === "SELECT") {
        const selectedValue = originalField.value; // Use the value directly from the original field
        const selectedOption = field.querySelector(`option[value="${selectedValue}"]`);
        div.textContent = selectedOption ? selectedOption.textContent : ""; // Use the option text for the selected value
      } else if (field.type === "date") {
        const iso = originalField.value;
        const parts = iso.split("-");
        div.textContent = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : "";
      } else {
        div.textContent = originalField.value || ""; // For inputs and textareas, grab the value from the original field
      }

      // Replace the input/select/textarea field with its visible text
      field.replaceWith(div);
    } else {
      console.error(`Original field with ID ${field.id} not found.`);
    }
  });

  // Optional styling to increase font size
  clone.style.fontSize = "16px";
  clone.style.padding = "2rem";

  // Open the PDF in a new tab
  // Adjusting the PDF output settings
  html2pdf()
    .set({
      margin: [0.2, 0.25, 0.2, 0.25], // Top, Right, Bottom, Left margins
      filename: "job-safety-briefing.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: "in", // Use inches for units
        format: "letter", // Use letter size (8.5x11 inches), or 'a4' for A4 size
        orientation: "portrait", // or 'landscape'
        font: "helvetica", // Change to preferred font
        fontSize: 12, // Control the font size for PDF
      },
    })
    .from(clone)
    .output("bloburl")
    .then((url) => {
      window.open(url, "_blank");
    });
}

document.querySelectorAll("textarea").forEach((textarea) => {
  textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
});
