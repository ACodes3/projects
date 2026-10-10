import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./assets/styles/body.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { applyTheme } from "./utils/theme.js";

// ✅ Apply saved theme before rendering
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
