const STORAGE_KEY = "acte-theme";

export function isLightMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

export function setThemeLight(light: boolean): void {
  document.documentElement.classList.toggle("light", light);
  try {
    localStorage.setItem(STORAGE_KEY, light ? "light" : "dark");
  } catch {
    // localStorage unavailable (private mode) — theme just won't persist.
  }
}
