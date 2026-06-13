/**
 * app/scan.jsx — Receipt Camera Screen
 *
 * Provides a camera view with a receipt crop guide overlay.
 * On capture, it:
 *   1. Runs on-device OCR via ML Kit
 *   2. Parses the text with the receipt parsing engine
 *   3. Navigates to the review screen with the parsed data
 */

import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from "../constants/Colors";
import { ReceiptGuideOverlay } from "../components/ReceiptGuideOverlay";
import { useOCR } from "../hooks/useOCR";
import { parseReceipt } from "../lib/receiptParser";

export default function ScanScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const { recognizeText, isProcessing } = useOCR();

  const isBusy = isCapturing || isProcessing;

  // ── Permission gate ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}></Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            Expense Tracker needs camera access to scan your receipts. All OCR
            processing happens on-device — your images never leave your phone.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionBtn}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Capture & process ────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isBusy) return;
    setIsCapturing(true);

    try {
      // 1. Take the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });

      setIsCapturing(false);

      // 2. On-device OCR
      const rawText = await recognizeText(photo.uri);

      // 3. Parse the text
      const parsedData = parseReceipt(rawText);

      // 4. Navigate to review screen, passing parsed data as params
      router.push({
        pathname: "/review",
        params: {
          parsedData: JSON.stringify(parsedData),
          imageUri: photo.uri,
        },
      });
    } catch (err) {
      setIsCapturing(false);
      Alert.alert(
        "Processing Failed",
        err?.message || "Could not process the receipt. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [isBusy, recognizeText]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        autofocus="on"
      />

      {/* Receipt crop guide overlay */}
      <ReceiptGuideOverlay />

      {/* Processing overlay */}
      {isBusy && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.processingText}>
            {isCapturing ? "Capturing…" : "Reading receipt…"}
          </Text>
        </View>
      )}

      {/* Top hint */}
      <SafeAreaView style={styles.topHint} edges={["top"]}>
        <View style={styles.hintPill}>
          <Text style={styles.hintText}>
            Align receipt within the guide
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom controls */}
      <SafeAreaView style={styles.bottomControls} edges={["bottom"]}>
        <TouchableOpacity
          testID="capture-btn"
          onPress={handleCapture}
          disabled={isBusy}
          style={[styles.captureBtn, isBusy && styles.captureBtnDisabled]}
          activeOpacity={0.8}
        >
          <View style={styles.captureBtnInner} />
        </TouchableOpacity>
        <Text style={styles.captureHint}>Tap to scan receipt</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  permissionIcon: { fontSize: 64, marginBottom: Spacing.lg },
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  permissionSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    ...Shadow.md,
  },
  permissionBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: "700",
    fontSize: FontSize.md,
  },

  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  processingText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: "600",
  },

  // Hint
  topHint: { position: "absolute", top: 0, left: 0, right: 0 },
  hintPill: {
    alignSelf: "center",
    marginTop: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary + "66",
  },
  hintText: { color: Colors.textPrimary, fontSize: FontSize.sm },

  // Capture button
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.primary,
    ...Shadow.lg,
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  captureHint: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
});
