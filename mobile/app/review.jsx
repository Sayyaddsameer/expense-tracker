/**
 * app/review.jsx — Expense Review & Correction Screen
 *
 * Receives parsed receipt data via navigation params and renders the
 * ExpenseForm for user review. On submit, calls POST /expenses.
 */

import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ExpenseForm } from "../components/ExpenseForm";
import { createExpense } from "../lib/api";

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse the stringified data passed from the scan screen
  let parsedData = null;
  try {
    if (params.parsedData) {
      parsedData = JSON.parse(params.parsedData);
    }
  } catch (_) {
    parsedData = null;
  }

  const handleSubmit = useCallback(
    async (payload) => {
      setIsSubmitting(true);
      try {
        const created = await createExpense(payload);
        Alert.alert(
          "Expense Saved ",
          `"${created.merchant}" saved under ${created.category}.`,
          [{ text: "View Expenses", onPress: () => router.replace("/expenses") }]
        );
      } catch (err) {
        Alert.alert(
          "Save Failed",
          err?.message || "Could not save the expense. Check your connection.",
          [{ text: "OK" }]
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  return (
    <ExpenseForm
      parsedData={parsedData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
}
