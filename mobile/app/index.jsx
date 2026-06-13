/**
 * app/index.jsx — Home / Dashboard screen
 *
 * Entry point of the app. Displays a hero section, quick stats,
 * and navigation buttons to the core features.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../constants/Colors";
import { fetchExpenses } from "../lib/api";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, accent }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionCard, accent && { borderColor: accent }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionIcon, accent && { color: accent }]}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = getCurrentMonth();
  const monthLabel = (() => {
    const [y, m] = currentMonth.split("-");
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
  })();

  const loadExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (_) {
      // Backend may not be running — show empty state
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, [loadExpenses]);

  // Stats for the current month
  const thisMonthExpenses = expenses.filter((e) =>
    e.purchase_date.startsWith(currentMonth)
  );
  const monthTotal = thisMonthExpenses.reduce((s, e) => s + e.total, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroGradientDot} />
          <Text style={styles.heroLabel}>Expense Tracker</Text>
          <Text style={styles.heroTitle}>{monthLabel}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(monthTotal)}</Text>
          <Text style={styles.heroSub}>
            {thisMonthExpenses.length} expense{thisMonthExpenses.length !== 1 ? "s" : ""} this month
          </Text>
        </View>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            label="All Time"
            value={formatCurrency(expenses.reduce((s, e) => s + e.total, 0))}
            icon=""
          />
          <StatCard label="Records" value={String(expenses.length)} icon="" />
          <StatCard label="This Month" value={String(thisMonthExpenses.length)} icon="" />
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon=""
            label="Scan Receipt"
            onPress={() => router.push("/scan")}
            accent={Colors.primary}
          />
          <QuickAction
            icon=""
            label="My Expenses"
            onPress={() => router.push("/expenses")}
            accent={Colors.secondary}
          />
          <QuickAction
            icon=""
            label="Summary"
            onPress={() => router.push("/summary")}
            accent="#f59e0b"
          />
        </View>

        {/* ── Recent expenses ───────────────────────────────────────── */}
        {expenses.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Recent Expenses</Text>
            {expenses.slice(0, 5).map((expense) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseMerchant}>{expense.merchant}</Text>
                  <Text style={styles.expenseDate}>{expense.purchase_date}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.total)}
                  </Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Scan CTA ──────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/scan")}
          style={styles.ctaBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>  Scan a Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadow.lg,
  },
  heroGradientDot: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  heroLabel: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Quick actions
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  actionIcon: { fontSize: 24, marginBottom: 6, color: Colors.textPrimary },
  actionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "600" },

  // Recent expenses
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseLeft: { flex: 1 },
  expenseMerchant: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  expenseDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  expenseRight: { alignItems: "flex-end" },
  expenseAmount: { fontSize: FontSize.md, fontWeight: "700", color: Colors.secondary },
  expenseCategory: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    backgroundColor: Colors.primary + "22",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  ctaBtnText: { color: Colors.textOnPrimary, fontWeight: "700", fontSize: FontSize.lg },
});
