/**
 * app/_layout.jsx
 *
 * Root layout for Expo Router. Configures the navigation stack,
 * safe area provider, and status bar.
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: Colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: "Expense Tracker", headerShown: false }}
          />
          <Stack.Screen
            name="scan"
            options={{ title: "Scan Receipt", headerShown: true }}
          />
          <Stack.Screen
            name="review"
            options={{ title: "Review Expense", headerShown: true }}
          />
          <Stack.Screen
            name="expenses"
            options={{ title: "My Expenses", headerShown: true }}
          />
          <Stack.Screen
            name="summary"
            options={{ title: "Monthly Summary", headerShown: true }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
