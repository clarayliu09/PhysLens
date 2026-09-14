import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ResultScreen() {

  return (
    <View style={styles.container}>
      <Pressable style={styles.primaryButton} onPress={() => router.replace("/")}>
        <Text style={styles.primaryButtonText}>Return to home</Text>
      </Pressable>

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

  primaryButton: {
    width: 250,
    marginTop: 40,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: "center",
    backgroundColor: "#D00003",
    gap: '20px',
    shadowColor: "#0037AF",
    shadowOffset: {
      width: 0,
      height:5,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  primaryButtonText: {
    fontSize: 15,
    color: "white",
    textAlign: "center",
  },

});