/**
 * Design tokens and theme constants for the Expense Tracker mobile app.
 * All colors, spacing, font sizes, and border radii are defined here.
 */

export const Colors = {
  // ── Base palette ─────────────────────────────────────────────────────────
  background: "#0f0f1a",        // deep navy-black
  surface: "#1a1a2e",          // card background
  surfaceElevated: "#16213e",  // elevated card
  border: "#2a2a4a",           // subtle border
  borderFocus: "#6c63ff",      // focused input border

  // ── Accent ───────────────────────────────────────────────────────────────
  primary: "#6c63ff",          // indigo
  primaryLight: "#8b83ff",
  primaryDark: "#4a43d4",
  secondary: "#00d4aa",        // teal
  secondaryDark: "#00a085",

  // ── Semantic ─────────────────────────────────────────────────────────────
  success: "#00d4aa",
  warning: "#f59e0b",          // amber (low-confidence highlight)
  warningBorder: "#f59e0b",
  danger: "#ef4444",

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary: "#f0f0ff",
  textSecondary: "#9090b0",
  textMuted: "#5a5a7a",
  textOnPrimary: "#ffffff",

  // ── Gradient stops ───────────────────────────────────────────────────────
  gradientStart: "#6c63ff",
  gradientEnd: "#00d4aa",

  // ── Overlays ─────────────────────────────────────────────────────────────
  overlay: "rgba(0, 0, 0, 0.6)",
  cameraGuide: "rgba(0, 0, 0, 0.5)",
  cameraGuideStroke: "#6c63ff",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
