import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

let LOADING_TEXTS: String[] = [
  "PhysLens is identifying objects, forces and physics concepts",
  "Letting Force = mass x acceleration",
  "Neglecting negligable things...",
  "Currently doing positive work...",
  "Consulting Newton...",
  "Did you know? An object can be moving even when the net force is zero",
]

export default function AnalyzingScreen() {
  // fake loading screen for now
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/results");
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>

      <ActivityIndicator size="large" />

      <Text style={styles.title}>Analyzing scene...</Text>

      <Text style={styles.subtitle}>
        {LOADING_TEXTS[Math.floor(Math.random() * (Math.floor(LOADING_TEXTS.length)))]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111F",
  },

  title: {
    fontSize: 75,
    fontWeight: "700",
    color: "white",
  },

  subtitle: {
    fontSize: 25,
    margin: 16,
    textAlign: "center",
    color: "white",
  },
});