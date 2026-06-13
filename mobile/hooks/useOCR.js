/**
 * useOCR.js
 *
 * Custom hook that wraps ML Kit Text Recognition for on-device OCR.
 * No data leaves the device — all processing happens locally.
 */

import { useState, useCallback } from "react";

/**
 * Lazy-import ML Kit to avoid breaking the app on platforms where the
 * native module isn't available (e.g., Expo Go / web).
 */
async function getTextRecognition() {
  try {
    const module = await import("@react-native-ml-kit/text-recognition");
    return module.default || module.TextRecognition;
  } catch (err) {
    console.warn(
      "[useOCR] @react-native-ml-kit/text-recognition not available. " +
        "Make sure you have run `expo prebuild` and built a development client.",
      err
    );
    return null;
  }
}

/**
 * Sort ML Kit text blocks by their vertical position (top coordinate)
 * so the joined string reads top-to-bottom, matching the receipt layout.
 */
function sortBlocksByPosition(blocks) {
  return [...blocks].sort((a, b) => {
    const aTop = a.frame?.top ?? a.cornerPoints?.[0]?.y ?? 0;
    const bTop = b.frame?.top ?? b.cornerPoints?.[0]?.y ?? 0;
    return aTop - bTop;
  });
}

/**
 * @returns {{
 *   recognizeText: (imageUri: string) => Promise<string>,
 *   isProcessing: boolean,
 *   error: string | null,
 * }}
 */
export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const recognizeText = useCallback(async (imageUri) => {
    if (!imageUri) throw new Error("imageUri is required");

    setIsProcessing(true);
    setError(null);

    try {
      const TextRecognition = await getTextRecognition();

      if (!TextRecognition) {
        // In Expo Go / web environment: return a mock for development
        console.warn("[useOCR] Returning mock OCR result for development.");
        return "MOCK STORE\n123 DEMO ST\n04/01/2024\nSAMPLE ITEM    5.99\nANOTHER ITEM   3.49\nSUBTOTAL       9.48\nTAX            0.76\nTOTAL         10.24";
      }

      const result = await TextRecognition.recognize(imageUri);

      if (!result || !result.blocks || result.blocks.length === 0) {
        throw new Error(
          "No text detected. Please ensure the receipt is well-lit and in focus."
        );
      }

      const sortedBlocks = sortBlocksByPosition(result.blocks);
      const rawText = sortedBlocks.map((block) => block.text).join("\n");

      return rawText;
    } catch (err) {
      const message = err?.message || "Failed to recognize text";
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { recognizeText, isProcessing, error };
}

export default useOCR;
