import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import GraphPaperBackground from "../components/GraphPaperBackground";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <GraphPaperBackground />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        {/* Keep your existing Stack.Screen components here */}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF00FF",
  },
});
