import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../constants/theme";
import GraphPaperBackground from "./GraphPaperBackground";

export default function ScreenBackground({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <GraphPaperBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});