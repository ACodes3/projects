export const applyTheme = (theme) => {
  // Resolve a safe theme string
  let selected = (theme ?? localStorage.getItem("theme") ?? "light")
    .toString()
    .trim()
    .toLowerCase();

  // Map common synonyms
  if (selected === "system" || selected === "system default" || selected === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    selected = prefersDark ? "dark" : "light";
  }

  // Fallback in case of unexpected values
  if (selected !== "dark" && selected !== "light") {
    selected = "light";
  }

  document.documentElement.setAttribute("data-theme", selected);
  localStorage.setItem("theme", selected);
};
