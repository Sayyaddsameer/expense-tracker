/**
 * ReceiptGuideOverlay.jsx
 *
 * Draws a semi-opaque camera overlay with a centred crop guide rectangle.
 * The guide maintains a fixed 1.585 aspect ratio (standard credit-card / receipt).
 *
 * The surrounding dark mask is achieved via four rectangles (top, bottom, left,
 * right) rather than a single path with a hole — this avoids SVG fill-rule
 * complexity and works reliably across Android and iOS.
 */

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Rect, Line, ClipPath } from "react-native-svg";
import { Colors, Spacing } from "../constants/Colors";

/** Receipt crop-guide aspect ratio (width / height). */
const GUIDE_ASPECT_RATIO = 1.585;
/** Width of the guide box as a fraction of screen width. */
const GUIDE_WIDTH_FRACTION = 0.88;

export function ReceiptGuideOverlay() {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  if (!layout.width || !layout.height) {
    return <View style={styles.container} onLayout={handleLayout} />;
  }

  const { width: W, height: H } = layout;

  // Guide box dimensions
  const guideW = W * GUIDE_WIDTH_FRACTION;
  const guideH = guideW / GUIDE_ASPECT_RATIO;
  const guideX = (W - guideW) / 2;
  const guideY = (H - guideH) / 2;

  // Corner accent length
  const cornerLen = 20;
  const strokeW = 3;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {/* Dark mask — four rectangles around the guide */}
        {/* Top */}
        <Rect x={0} y={0} width={W} height={guideY} fill="rgba(0,0,0,0.55)" />
        {/* Bottom */}
        <Rect
          x={0}
          y={guideY + guideH}
          width={W}
          height={H - guideY - guideH}
          fill="rgba(0,0,0,0.55)"
        />
        {/* Left */}
        <Rect
          x={0}
          y={guideY}
          width={guideX}
          height={guideH}
          fill="rgba(0,0,0,0.55)"
        />
        {/* Right */}
        <Rect
          x={guideX + guideW}
          y={guideY}
          width={W - guideX - guideW}
          height={guideH}
          fill="rgba(0,0,0,0.55)"
        />

        {/* Guide rectangle outline */}
        <Rect
          x={guideX}
          y={guideY}
          width={guideW}
          height={guideH}
          fill="transparent"
          stroke={Colors.primary}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />

        {/* Corner accents — top-left */}
        <Line
          x1={guideX}
          y1={guideY + cornerLen}
          x2={guideX}
          y2={guideY}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <Line
          x1={guideX}
          y1={guideY}
          x2={guideX + cornerLen}
          y2={guideY}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* top-right */}
        <Line
          x1={guideX + guideW - cornerLen}
          y1={guideY}
          x2={guideX + guideW}
          y2={guideY}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <Line
          x1={guideX + guideW}
          y1={guideY}
          x2={guideX + guideW}
          y2={guideY + cornerLen}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* bottom-left */}
        <Line
          x1={guideX}
          y1={guideY + guideH - cornerLen}
          x2={guideX}
          y2={guideY + guideH}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <Line
          x1={guideX}
          y1={guideY + guideH}
          x2={guideX + cornerLen}
          y2={guideY + guideH}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* bottom-right */}
        <Line
          x1={guideX + guideW - cornerLen}
          y1={guideY + guideH}
          x2={guideX + guideW}
          y2={guideY + guideH}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <Line
          x1={guideX + guideW}
          y1={guideY + guideH - cornerLen}
          x2={guideX + guideW}
          y2={guideY + guideH}
          stroke={Colors.secondary}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ReceiptGuideOverlay;
