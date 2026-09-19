import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type DetectedObject = {
  label: string,
  confidence: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
};

export default function ResultScreen() {

  const { imageUri, objects} = useLocalSearchParams<{
    imageUri: string;
    objects: string;
  }>();

  const detectedObjects: DetectedObject[] = JSON.parse(objects);
  const numObjects = detectedObjects.length;

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: imageUri }}
        style = {styles.image}
      ></Image>


      <View style={styles.visControls}>
        <Text style={styles.sectionTitle}>
          Detected Objects ({numObjects})
        </Text>

        {detectedObjects.map((object, index) => (
          <View key={index} style={styles.objectRow}>
            <Text style={styles.objectLabel}>
              {object.label}
            </Text>

            <Text style={styles.confidence}>
              {Math.round(object.confidence * 100)}%
            </Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.dismissAll()}> 
        <Ionicons
          name="return-up-back"
          size={30}
          color="white"
        />
        <Text style={styles.primaryButtonText}>Return</Text>
      </Pressable>   

    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#07111F", //cream: C7C3BD",
  },

  visControls: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },

  objectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 10,
  },

  objectLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#07111F",
  },

  confidence: {
    fontSize: 15,
    color: "#555",
  },

  image: {
    width: 350,
    height: 350,
    borderRadius: 20,
    resizeMode: "contain",
  },

  primaryButton: {
    width: 120,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: "center",
    backgroundColor: "#D00003",
    gap: 20,
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