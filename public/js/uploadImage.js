const fileInput = document.getElementById("images");
const uploadBox = document.getElementById("uploadBox");
const uploadIcon = document.getElementById("uploadIcon");
const uploadTitle = document.getElementById("uploadTitle");
const uploadDescription = document.getElementById("uploadDescription");
const browseButton = document.getElementById("browseButton");

const previewContainer = document.getElementById("previewContainer");
const totalImages = document.getElementById("totalImages");
const imageCountBadge = document.getElementById("imageCountBadge");

let selectedFiles = [];

// Open file picker
browseButton.addEventListener("click", () => fileInput.click());
uploadBox.addEventListener("click", () => fileInput.click());

// Drag Events
["dragenter", "dragover"].forEach((event) => {
  uploadBox.addEventListener(event, (e) => {
    e.preventDefault();
    uploadBox.classList.add("drag-active");
  });
});

["dragleave", "dragend"].forEach((event) => {
  uploadBox.addEventListener(event, () => {
    uploadBox.classList.remove("drag-active");
  });
});

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadBox.classList.remove("drag-active");

  const files = Array.from(e.dataTransfer.files);

  addFiles(files);
});

// Browse Files
fileInput.addEventListener("change", function () {
  addFiles(Array.from(this.files));
});

// Add Files
function addFiles(files) {
  files.forEach((file) => {
    if (!file.type.startsWith("image/")) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} exceeds 5MB.`);
      return;
    }

    selectedFiles.push(file);
  });

  updateInputFiles();
  renderPreview();
}

// Sync input with selected files
function updateInputFiles() {
  const dt = new DataTransfer();

  selectedFiles.forEach((file) => dt.items.add(file));

  fileInput.files = dt.files;
}

// Render Preview
function renderPreview() {
  previewContainer.innerHTML = "";

  totalImages.textContent = selectedFiles.length;

  if (selectedFiles.length) {
    imageCountBadge.classList.remove("hidden");

    imageCountBadge.textContent = `${selectedFiles.length} Image${selectedFiles.length > 1 ? "s" : ""}`;

    uploadIcon.innerHTML = `<i class="fa-solid fa-circle-check text-5xl text-green-600"></i>`;

    uploadTitle.textContent = "Images Ready";

    uploadDescription.innerHTML = `<span class="text-green-600 font-medium">
                ${selectedFiles.length} image(s) selected
            </span>`;
  } else {
    imageCountBadge.classList.add("hidden");

    uploadIcon.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-5xl text-[#B68D40]"></i>`;

    uploadTitle.textContent = "Drag & Drop Images";

    uploadDescription.textContent =
      "Drop your product images here or browse from your device.";
  }

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const card = document.createElement("div");

      card.className =
        "bg-white rounded-3xl overflow-hidden shadow-premium border border-stone-200";

      card.innerHTML = `

                <div class="relative">

                    <img
                        src="${e.target.result}"
                        class="w-full h-60 object-cover">

                    <button
                        type="button"
                        class="remove-image absolute top-3 right-3 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                        data-index="${index}">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

                <div class="p-5">

                    <h3 class="font-semibold text-slate-800 truncate">

                        ${file.name}

                    </h3>

                    <p class="text-slate-500 mt-2">

                        ${(file.size / 1024 / 1024).toFixed(2)} MB

                    </p>

                </div>

            `;

      previewContainer.appendChild(card);
    };

    reader.readAsDataURL(file);
  });
}

// Remove Image
previewContainer.addEventListener("click", function (e) {
  const btn = e.target.closest(".remove-image");

  if (!btn) return;

  const index = Number(btn.dataset.index);

  selectedFiles.splice(index, 1);

  updateInputFiles();

  renderPreview();
});

// Prevent browser opening dropped image
window.addEventListener("dragover", (e) => e.preventDefault());

window.addEventListener("drop", (e) => e.preventDefault());
