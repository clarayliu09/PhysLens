import { StyleSheet } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

import { COLORS } from "../constants/theme";

export default function GraphPaperBackground() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id="graphGrid"
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
        >
          <Line
            x1={24}
            y1={0}
            x2={24}
            y2={24}
            stroke={COLORS.grid}
            strokeWidth={0.7}
          />

          <Line
            x1={0}
            y1={24}
            x2={24}
            y2={24}
            stroke={COLORS.grid}
            strokeWidth={0.7}
          />
        </Pattern>
      </Defs>

      <Rect
        width="100%"
        height="100%"
        fill="url(#graphGrid)"
      />
    </Svg>
  );
}