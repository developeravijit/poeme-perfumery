document.addEventListener("DOMContentLoaded", () => {
  console.log("index.js loaded");
  /* ===========================
      Profile Dropdown
  =========================== */

  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      console.log("Profile button clicked");

      profileDropdown.style.display =
        profileDropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
      profileDropdown.style.display = "none";
    });

    profileDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  /* ===========================
      Swiper
  =========================== */

  if (
    document.querySelector(".collectionSwiper") &&
    typeof Swiper !== "undefined"
  ) {
    new Swiper(".collectionSwiper", {
      loop: true,
      speed: 900,
      grabCursor: true,
      centeredSlides: false,
      spaceBetween: 35,

      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },

      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },

      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },

      breakpoints: {
        0: {
          slidesPerView: 1,
        },
        640: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
        1400: {
          slidesPerView: 3,
        },
      },
    });
  }
});
