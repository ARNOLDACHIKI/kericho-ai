const API_BASE_URL =
  window.API_BASE_URL ||
  (window.location && window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : "http://localhost:3000");
const TOKEN_STORAGE_KEY = "admin_auth_token";

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const togglePasswordBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

// Toggle password visibility
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", (event) => {
    event.preventDefault();
    if (!passwordInput) {
      return;
    }

    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    const eyeIcon = togglePasswordBtn.querySelector(".eye-icon");
    if (eyeIcon) {
      eyeIcon.textContent = isPassword ? "🙈" : "👁️";
    }

    togglePasswordBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    togglePasswordBtn.setAttribute("aria-pressed", String(isPassword));
  });
}
function showError(message) {
  console.error(message);
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

function clearError() {
  loginError.textContent = "";
  loginError.classList.add("hidden");
}

async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.token) {
    throw new Error(payload?.error || "Invalid username or password");
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    showError("Username and password are required");
    return;
  }

  try {
    await login(username, password);
    window.location.href = "index.html";
  } catch (error) {
    showError(error.message || "Login failed");
  }
});
