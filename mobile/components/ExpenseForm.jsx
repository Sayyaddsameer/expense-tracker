/**
 * ExpenseForm.jsx
 *
 * Controlled form for reviewing and editing parsed receipt data before
 * submitting to the backend.
 *
 * Key requirements:
 *   - data-testid attributes on every required field
 *   - Fields with low confidence get an amber border + modified testid
 *     e.g., data-testid="total-input-low-confidence"
 *   - Line items rendered with data-testid="line-item-{index}"
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../constants/Colors";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the testid for a field, appending "-low-confidence" when needed.
 * @param {string} base   e.g. "total-input"
 * @param {string} level  "high" | "medium" | "low"
 */
function testId(base, level) {
  return level === "low" ? `${base}-low-confidence` : base;
}

/**
 * Return the border style override for a field based on confidence level.
 */
function confidenceBorder(level) {
  if (level === "low") return { borderColor: Colors.warning, borderWidth: 2 };
  if (level === "medium") return { borderColor: Colors.warning, borderWidth: 1.5, opacity: 0.75 };
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ label, confidence }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {confidence === "low" && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}> Low Confidence</Text>
        </View>
      )}
      {confidence === "medium" && (
        <View style={[styles.badge, styles.badgeMedium]}>
          <Text style={styles.badgeText}>Review</Text>
        </View>
      )}
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  confidence = "high",
  placeholder,
  keyboardType = "default",
  testIDBase,
  multiline = false,
}) {
  const level = confidence || "high";
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={label} confidence={level} />
      <TextInput
        testID={testId(testIDBase, level)}
        accessible
        accessibilityLabel={label}
        style={[styles.input, confidenceBorder(level), multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function LineItemRow({ item, index, onUpdate, onRemove }) {
  return (
    <View
      testID={`line-item-${index}`}
      style={styles.lineItemRow}
    >
      <TextInput
        testID={`line-item-${index}-description`}
        style={[styles.input, styles.lineItemDesc]}
        value={item.description}
        onChangeText={(text) => onUpdate(index, "description", text)}
        placeholder="Item description"
        placeholderTextColor={Colors.textMuted}
      />
      <TextInput
        testID={`line-item-${index}-price`}
        style={[styles.input, styles.lineItemPrice]}
        value={String(item.price)}
        onChangeText={(text) => onUpdate(index, "price", text)}
        placeholder="0.00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="decimal-pad"
      />
      <TouchableOpacity
        testID={`line-item-${index}-remove`}
        onPress={() => onRemove(index)}
        style={styles.removeBtn}
        accessibilityLabel={`Remove ${item.description}`}
      >
        <Text style={styles.removeBtnText}></Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object}   parsedData  - Output from parseReceipt()
 * @param {function} onSubmit    - Called with the validated expense payload
 * @param {function} onCancel    - Called when user dismisses the form
 * @param {boolean}  isSubmitting
 */
export function ExpenseForm({ parsedData, onSubmit, onCancel, isSubmitting = false }) {
  const [merchant, setMerchant] = useState(parsedData?.merchant ?? "");
  const [date, setDate] = useState(parsedData?.date ?? "");
  const [total, setTotal] = useState(
    parsedData?.total != null ? String(parsedData.total) : ""
  );
  const [tax, setTax] = useState(
    parsedData?.tax != null ? String(parsedData.tax) : ""
  );
  const [lineItems, setLineItems] = useState(
    (parsedData?.lineItems ?? []).map((item) => ({
      description: item.description,
      price: String(item.price),
    }))
  );

  const confidence = parsedData?.confidence ?? {
    merchant: "high",
    date: "high",
    total: "high",
    tax: "high",
  };

  // ── Line item handlers ────────────────────────────────────────────────────

  const handleUpdateItem = useCallback((index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddItem = useCallback(() => {
    setLineItems((prev) => [...prev, { description: "", price: "" }]);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    const totalNum = parseFloat(total);
    if (!merchant.trim()) {
      Alert.alert("Validation Error", "Merchant name is required.");
      return;
    }
    if (!date.trim()) {
      Alert.alert("Validation Error", "Purchase date is required.");
      return;
    }
    if (isNaN(totalNum) || totalNum < 0) {
      Alert.alert("Validation Error", "Please enter a valid total amount.");
      return;
    }

    const payload = {
      merchant: merchant.trim(),
      purchase_date: date.trim(),
      line_items: lineItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description.trim(),
          price: parseFloat(item.price) || 0,
        })),
      total: totalNum,
      tax: tax ? parseFloat(tax) : null,
    };

    onSubmit(payload);
  }, [merchant, date, total, tax, lineItems, onSubmit]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Review Expense</Text>
        <Text style={styles.subtitle}>
          Fields marked with  may need correction.
        </Text>
      </View>

      {/* Core fields */}
      <View style={styles.card}>
        <FormInput
          label="Merchant"
          value={merchant}
          onChangeText={setMerchant}
          confidence={confidence.merchant}
          placeholder="Store or restaurant name"
          testIDBase="merchant-input"
        />
        <FormInput
          label="Purchase Date"
          value={date}
          onChangeText={setDate}
          confidence={confidence.date}
          placeholder="YYYY-MM-DD"
          testIDBase="date-input"
        />
        <FormInput
          label="Total ($)"
          value={total}
          onChangeText={setTotal}
          confidence={confidence.total}
          placeholder="0.00"
          keyboardType="decimal-pad"
          testIDBase="total-input"
        />
        <FormInput
          label="Tax ($)"
          value={tax}
          onChangeText={setTax}
          confidence={confidence.tax}
          placeholder="0.00"
          keyboardType="decimal-pad"
          testIDBase="tax-input"
        />
      </View>

      {/* Line items */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        {lineItems.map((item, index) => (
          <LineItemRow
            key={index}
            item={item}
            index={index}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
          />
        ))}
        <TouchableOpacity
          testID="add-line-item-btn"
          onPress={handleAddItem}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          testID="cancel-btn"
          onPress={onCancel}
          style={[styles.btn, styles.cancelBtn]}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="submit-btn"
          onPress={handleSubmit}
          style={[styles.btn, styles.submitBtn]}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.submitBtnText}>Save Expense</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginRight: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.warning + "33",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMedium: {
    backgroundColor: Colors.warning + "22",
  },
  badgeText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  multiline: {
    height: 80,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  lineItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  lineItemDesc: {
    flex: 1,
  },
  lineItemPrice: {
    width: 80,
  },
  removeBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.danger + "22",
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: Colors.danger,
    fontWeight: "700",
    fontSize: 12,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  addBtnText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: FontSize.sm,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  cancelBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: FontSize.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    ...Shadow.md,
  },
  submitBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: "700",
    fontSize: FontSize.md,
  },
});

export default ExpenseForm;
