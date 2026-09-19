import { File } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

let LOADING_TEXTS: string[] = [
  "PhysLens is identifying objects, forces and physics concepts",
  "Letting Force = mass x acceleration",
  "Neglecting negligable things...",
  "Currently doing positive work...",
  "Consulting Newton...",
  "Did you know? An object can be moving even when the net force is zero",
]

export default function AnalyzingScreen() {
  // get imageUri from home screen
  const { imageUri } = useLocalSearchParams<{
    imageUri: string;
  }>();

  // send image to backend for object detection

  useEffect(() => {
    const analyzeImage = async () => {

      try {

        console.log("1. imageUri =", imageUri);
        // Get the image stored at the local image URI
        console.log("2. Creating File from image URI");

        const imageFile = new File(imageUri);

        console.log("3. File created:", imageFile.uri);
        console.log("4. File size:", imageFile.size);

        const formData = new FormData();
        formData.append("file", imageFile);

        console.log("5. FormData SUCCESS");

        console.log("6. About to fetch FASTAPI");

        const response = await fetch(
          "http://192.168.4.32:8000/detect",
          {
            method: "POST",
            body: formData,
          }
        );

        console.log("7. FastAPI fetch SUCCESS:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("FastAPI error:", errorText);
          throw new Error("Object detection failed");
        }

        const data = await response.json();

        console.log("8. Detected objects:", data.objects);

        router.replace({
          pathname: "/results",
          params: {
            imageUri,
            objects: JSON.stringify(data.objects),
          },
        });
        

      } catch (error) {
        console.error("Analysis error:", error);

        Alert.alert(
          "Analysis Failed",
          "PhysLens couldn't analyze this image."
        );

        // go back to home
        router.dismissAll();
      }
    };

    analyzeImage();

  }, [imageUri]);

  /*
  // fake 4-sec loading screen for now
  useEffect(() => {
    //start and save timer
    const timer = setTimeout(() => { 
      // replace analyzing screen with results screen and send imageUri
      router.replace({
        pathname: "/results", 
        params: {imageUri}
      });
    }, 4000);

    //cancel the timer if effect ends early
    return () => clearTimeout(timer); 
  }, []);
  */

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Analyzing scene...</Text>

      <ActivityIndicator size="large" color="white" />

      <Text style={styles.subtitle}>
        {LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111F", //cream: #C7C3BD
  },

  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 20,
    margin: 16,
    textAlign: "center",
    color: "white",
  },
});