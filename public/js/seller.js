const passwordTab = document.getElementById("passwordTab");
const otpTab = document.getElementById("otpTab");

const passwordForm = document.getElementById("passwordForm");
const otpForm = document.getElementById("otpForm");

passwordTab.addEventListener("click", () => {
  passwordForm.classList.remove("hidden");
  otpForm.classList.add("hidden");

  passwordTab.classList.add("bg-indigo-600", "text-white");

  passwordTab.classList.remove("text-slate-600");

  otpTab.classList.remove("bg-indigo-600", "text-white");

  otpTab.classList.add("text-slate-600");
});

otpTab.addEventListener("click", () => {
  otpForm.classList.remove("hidden");
  passwordForm.classList.add("hidden");

  otpTab.classList.add("bg-indigo-600", "text-white");

  otpTab.classList.remove("text-slate-600");

  passwordTab.classList.remove("bg-indigo-600", "text-white");

  passwordTab.classList.add("text-slate-600");
});

const password = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

toggle.addEventListener("click", () => {
  const icon = toggle.querySelector("i");

  if (password.type === "password") {
    password.type = "text";

    icon.classList.remove("fa-eye");

    icon.classList.add("fa-eye-slash");
  } else {
    password.type = "password";

    icon.classList.remove("fa-eye-slash");

    icon.classList.add("fa-eye");
  }
});
