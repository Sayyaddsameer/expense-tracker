/**
 * app/expenses.jsx — Expense List Screen
 *
 * Displays all stored expenses with category badges and pull-to-refresh.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../constants/Colors";
import { fetchExpenses } from "../lib/api";

const CATEGORY_COLORS = {
  Groceries: "#22c55e",
  Food: "#f97316",
  Coffee: "#a78bfa",
  Gas: "#3b82f6",
  Healthcare: "#ec4899",
  Transport: "#06b6d4",
  Shopping: "#f59e0b",
  Entertainment: "#8b5cf6",
  Utilities: "#64748b",
  Travel: "#10b981",
  Other: "#6b7280",
};

function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function ExpenseCard({ expense }) {
  const catColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;
  return (
    <View style={styles.card}>
      <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
      <View style={styles.cardBody}>
        <Text style={styles.merchant}>{expense.merchant}</Text>
        <Text style={styles.date}>{expense.purchase_date}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + "22" }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>
            {expense.category}
          </Text>
        </View>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatCurrency(expense.total)}</Text>
        {expense.tax != null && (
          <Text style={styles.tax}>Tax: {formatCurrency(expense.tax)}</Text>
        )}
      </View>
    </View>
  );
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading expenses…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}></Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Scan a receipt to add your first expense</Text>
          </View>
        }
        ListHeaderComponent={
          expenses.length > 0 ? (
            <Text style={styles.count}>{expenses.length} expense{expenses.length !== 1 ? "s" : ""}</Text>
          ) : null
        }
      />
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background, gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  list: { padding: Spacing.md, paddingBottom: 40 },
  count: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.sm },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    ...Shadow.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  cardBody: { flex: 1 },
  merchant: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  categoryBadge: {
    alignSelf: "flex-start",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  categoryText: { fontSize: FontSize.xs, fontWeight: "600" },
  amountContainer: { alignItems: "flex-end" },
  amount: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.secondary },
  tax: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center" },

  errorBar: {
    backgroundColor: Colors.danger + "22",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: { color: Colors.danger, textAlign: "center" },
});
