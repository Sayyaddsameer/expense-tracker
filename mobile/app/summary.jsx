/**
 * app/summary.jsx — Monthly Summary Screen
 *
 * Shows a monthly breakdown of expenses by category.
 * Includes a CSV export button.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../constants/Colors";
import { fetchSummary, getExportUrl } from "../lib/api";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPrevMonth(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

const CATEGORY_COLORS = {
  Groceries: "#22c55e", Food: "#f97316", Coffee: "#a78bfa",
  Gas: "#3b82f6", Healthcare: "#ec4899", Transport: "#06b6d4",
  Shopping: "#f59e0b", Entertainment: "#8b5cf6", Utilities: "#64748b",
  Travel: "#10b981", Other: "#6b7280",
};

export default function SummaryScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (m) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const data = await fetchSummary(m);
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const handleExport = useCallback(() => {
    const url = getExportUrl(month);
    Linking.openURL(url).catch(() =>
      Alert.alert("Export Failed", "Could not open the export URL.")
    );
  }, [month]);

  const categoryEntries = summary
    ? Object.entries(summary.category_summary).sort((a, b) => b[1] - a[1])
    : [];

  const maxValue = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Month picker */}
        <View style={styles.monthPicker}>
          <TouchableOpacity
            onPress={() => setMonth(getPrevMonth(month))}
            style={styles.arrowBtn}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <TouchableOpacity
            onPress={() => setMonth(getNextMonth(month))}
            style={styles.arrowBtn}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {summary && !loading && (
          <>
            {/* Total card */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Spent</Text>
              <Text style={styles.totalAmount}>
                ${summary.total_expenses.toFixed(2)}
              </Text>
            </View>

            {/* Category breakdown */}
            {categoryEntries.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>By Category</Text>
                {categoryEntries.map(([cat, amount]) => {
                  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                  const pct = (amount / maxValue) * 100;
                  return (
                    <View key={cat} style={styles.categoryRow}>
                      <View style={styles.catLabelRow}>
                        <View style={[styles.catDot, { backgroundColor: color }]} />
                        <Text style={styles.catName}>{cat}</Text>
                        <Text style={styles.catAmount}>${amount.toFixed(2)}</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${pct}%`, backgroundColor: color },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}></Text>
                <Text style={styles.emptyTitle}>No data</Text>
                <Text style={styles.emptySub}>No expenses recorded for this month.</Text>
              </View>
            )}

            {/* Export button */}
            <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
              <Text style={styles.exportBtnText}> Export CSV</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  centered: { paddingVertical: 60, alignItems: "center" },

  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  arrowBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowText: { color: Colors.textPrimary, fontSize: 24, fontWeight: "300" },
  monthLabel: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },

  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textOnPrimary + "cc", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  totalAmount: { fontSize: 44, fontWeight: "800", color: Colors.textOnPrimary, letterSpacing: -1, marginTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },

  categoryRow: { marginBottom: Spacing.md },
  catLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: "500" },
  catAmount: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  barBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },

  empty: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center" },

  exportBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  exportBtnText: { color: Colors.textOnPrimary, fontWeight: "700", fontSize: FontSize.md },

  errorBox: { backgroundColor: Colors.danger + "22", borderRadius: BorderRadius.md, padding: Spacing.md },
  errorText: { color: Colors.danger, textAlign: "center" },
});
