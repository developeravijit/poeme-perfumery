const previewButtons = document.querySelectorAll(".previewBtn");
const copyButtons = document.querySelectorAll(".copyCode");

const previewModal = document.getElementById("previewModal");
const closeModal = document.getElementById("closeModal");

const modalImage = document.getElementById("modalImage");
const modalCode = document.getElementById("modalCode");
const modalName = document.getElementById("modalName");
const modalSize = document.getElementById("modalSize");
const modalResolution = document.getElementById("modalResolution");
const modalDate = document.getElementById("modalDate");

const downloadImage = document.getElementById("downloadImage");

const copyModalCode = document.getElementById("copyModalCode");
const copyCodeBtn = document.getElementById("copyCodeBtn");

const toast = document.getElementById("toast");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const gridView = document.getElementById("gridView");
const listView = document.getElementById("listView");

const gallery = document.getElementById("galleryContainer");

let currentImageCode = "";

/*=========================
Preview Modal
=========================*/

previewButtons.forEach((button) => {
  button.addEventListener("click", function () {
    modalImage.src = this.dataset.url;

    modalCode.textContent = this.dataset.code;

    modalName.textContent = this.dataset.name;

    modalSize.textContent = (this.dataset.size / 1024).toFixed(2) + " KB";

    modalResolution.textContent = `${this.dataset.width} × ${this.dataset.height}`;

    modalDate.textContent = new Date(this.dataset.date).toLocaleDateString();

    downloadImage.href = this.dataset.url;

    currentImageCode = this.dataset.code;

    previewModal.classList.remove("hidden");

    previewModal.classList.add("flex");

    document.body.style.overflow = "hidden";
  });
});

/*=========================
Close Modal
=========================*/

function closePreview() {
  previewModal.classList.add("hidden");

  previewModal.classList.remove("flex");

  document.body.style.overflow = "";
}

closeModal.addEventListener("click", closePreview);

previewModal.addEventListener("click", function (e) {
  if (e.target === previewModal) {
    closePreview();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closePreview();
  }
});

/*=========================
Toast
=========================*/

function showToast(message) {
  toast.innerHTML = `
        <i class="fa-solid fa-circle-check mr-2"></i>
        ${message}
    `;

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/*=========================
Copy Image Code
=========================*/

copyButtons.forEach((button) => {
  button.addEventListener("click", function () {
    navigator.clipboard.writeText(this.dataset.code);

    showToast("Image code copied.");
  });
});

copyModalCode.addEventListener("click", function () {
  navigator.clipboard.writeText(currentImageCode);

  showToast("Image code copied.");
});

copyCodeBtn.addEventListener("click", function () {
  navigator.clipboard.writeText(currentImageCode);

  showToast("Image code copied.");
});

/*=========================
Search
=========================*/

searchInput.addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  document.querySelectorAll(".image-card").forEach((card) => {
    const text = card.innerText.toLowerCase();

    card.style.display = text.includes(value) ? "" : "none";
  });
});

/*=========================
Sort
=========================*/

sortSelect.addEventListener("change", function () {
  const cards = [...document.querySelectorAll(".image-card")];

  cards.sort((a, b) => {
    if (this.value === "name") {
      return a.innerText.localeCompare(b.innerText);
    }

    if (this.value === "code") {
      return a.innerText.localeCompare(b.innerText);
    }

    return 0;
  });

  cards.forEach((card) => gallery.appendChild(card));
});

/*=========================
Grid View
=========================*/

gridView.addEventListener("click", () => {
  gallery.className =
    "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-10";

  gridView.classList.add("bg-[#B68D40]", "text-white");

  listView.classList.remove("bg-[#B68D40]", "text-white");

  listView.classList.add("bg-white");
});

/*=========================
List View
=========================*/

listView.addEventListener("click", () => {
  gallery.className = "grid grid-cols-1 gap-6 mt-10";

  listView.classList.add("bg-[#B68D40]", "text-white");

  gridView.classList.remove("bg-[#B68D40]", "text-white");

  gridView.classList.add("bg-white");
});

/*=========================
Image Animation
=========================*/

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-up");
      }
    });
  },
  {
    threshold: 0.15,
  }
);

document.querySelectorAll(".image-card").forEach((card) => {
  observer.observe(card);
});
