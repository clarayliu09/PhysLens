import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

let LOADING_TEXTS: String[] = [
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
        const formData = new FormData();

        formData.append("file", {
          uri: imageUri, //image location on phone
          name: "scene.jpg",
          type: "image/jpeg",
        } as any);

        //send image to FastAPI
        const response = await fetch(
          "http://YOUR_COMPUTER_IP:8000/detect",
            {
              method: "POST",
              body: formData,
            }
        );

        //make sure no errors happen
        if (!response.ok) {
          throw new Error("Object detection failed");
        }

        const data = await response.json();
        console.log("Detected objects:", data.objects);

        //move on to results page after detection is finished
        router.replace({
          pathname: "/results",
          params: {imageUri, objects: JSON.stringify(data.objects)},
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

  });

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
    backgroundColor: "#C7C3BD", //dark navy: 07111F
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