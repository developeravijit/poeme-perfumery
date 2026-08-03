const fileInput = document.getElementById("csvFile");
const uploadBox = document.getElementById("uploadBox");
const uploadIcon = document.getElementById("uploadIcon");
const uploadTitle = document.getElementById("uploadTitle");
const uploadDescription = document.getElementById("uploadDescription");
const browseButton = document.getElementById("browseButton");
const uploadBtn = document.getElementById("uploadBtn");

fileInput.addEventListener("change", function () {
  if (!this.files.length) return;

  const file = this.files[0];

  // Only CSV allowed
  if (!file.name.toLowerCase().endsWith(".csv")) {
    uploadBox.classList.remove("border-green-500", "bg-green-50");
    uploadBox.classList.add("border-red-500", "bg-red-50");

    uploadIcon.innerHTML = `
            <i class="fa-solid fa-circle-xmark text-5xl text-red-600"></i>
        `;

    uploadTitle.textContent = "Invalid File";

    uploadDescription.innerHTML = `
            <span class="text-red-600 font-semibold">
                Please select a CSV file only.
            </span>
        `;

    browseButton.innerHTML = `
            <i class="fa-solid fa-folder-open mr-2"></i>
            Browse Again
        `;

    uploadBtn.disabled = true;
    uploadBtn.className =
      "mt-8 w-full bg-slate-300 text-slate-600 cursor-not-allowed px-8 py-4 rounded-xl font-semibold";

    fileInput.value = "";

    return;
  }

  // Success UI

  uploadBox.classList.remove("border-slate-300", "border-red-500", "bg-red-50");

  uploadBox.classList.add("border-green-500", "bg-green-50");

  uploadIcon.innerHTML = `
        <i class="fa-solid fa-circle-check text-5xl text-green-600"></i>
    `;

  uploadTitle.textContent = "CSV Ready to Upload";

  uploadDescription.innerHTML = `
        <div class="mt-4 space-y-2">

            <div class="text-xl font-semibold text-slate-800">
                ${file.name}
            </div>

            <div class="text-slate-500">
                ${(file.size / 1024).toFixed(2)} KB
            </div>

            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium mt-3">
                <i class="fa-solid fa-check"></i>
                File selected successfully
            </div>

        </div>
    `;

  browseButton.innerHTML = `
        <i class="fa-solid fa-rotate mr-2"></i>
        Change File
    `;

  uploadBtn.disabled = false;

  uploadBtn.className =
    "mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition";
});

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".add-to-cart-btn");

  buttons.forEach((btn) => {
    const productId = btn.dataset.id;

    // If already added
    if (localStorage.getItem(`cart_${productId}`)) {
      btn.href = "/poeme-perfumery/cart";
      btn.querySelector("span").textContent = "Go To Cart";
      btn.querySelector("i").className = "fa-solid fa-cart-shopping mr-2";
    }

    btn.addEventListener("click", () => {
      localStorage.setItem(`cart_${productId}`, "true");

      btn.href = "/poeme-perfumery/cart";
      btn.querySelector("span").textContent = "Go To Cart";
      btn.querySelector("i").className = "fa-solid fa-cart-shopping mr-2";
    });
  });
});
