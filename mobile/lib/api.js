/**
 * API client for the FastAPI backend.
 * All network calls are isolated here so the rest of the app stays testable.
 */

import { Platform } from "react-native";

// In development: use localhost (Android emulator needs 10.0.2.2 for host)
const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "8000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:${API_PORT}`;

/**
 * Generic fetch wrapper with JSON serialisation and error handling.
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || JSON.stringify(body) || message;
    } catch (_) {
      // ignore
    }
    throw new Error(message);
  }

  // Some responses (e.g., CSV) are not JSON
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response;
}

/**
 * Create a new expense.
 * @param {object} expense - ExpenseCreate payload
 * @returns {Promise<object>} Created expense with id and category
 */
export async function createExpense(expense) {
  return apiFetch("/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

/**
 * Fetch all expenses.
 * @returns {Promise<Array>}
 */
export async function fetchExpenses() {
  return apiFetch("/expenses");
}

/**
 * Fetch monthly summary.
 * @param {string} month - YYYY-MM format
 * @returns {Promise<object>}
 */
export async function fetchSummary(month) {
  return apiFetch(`/expenses/summary?month=${encodeURIComponent(month)}`);
}

/**
 * Get the export URL for a given month.
 * Used by Linking.openURL to trigger a CSV download.
 * @param {string} month - YYYY-MM format
 * @returns {string} Full URL
 */
export function getExportUrl(month) {
  return `${API_BASE_URL}/expenses/export?month=${encodeURIComponent(month)}`;
}
