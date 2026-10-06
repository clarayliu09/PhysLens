import { File } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, StyleSheet, Text, View } from "react-native";

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

  const [progress, setProgress] = useState(0);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const [loadingText, setLoadingText] = useState(
    LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]
  );

  const API_URL = "http://MacBook-Pro-2022.local:8000";

  // send image to backend for object detection

  useEffect(() => {
    const analyzeImage = async () => {

      try {

        console.log("1. imageUri =", imageUri);
        // Get the image stored at the local image URI
        console.log("2. Creating File from image URI");
        
        // turn URI into file and assign to imageFile
        const imageFile = new File(imageUri);

        console.log("3. File created:", imageFile.uri);
        console.log("4. File size:", imageFile.size);

        // create empty FormData object
        const formData = new FormData();

        // "fill" formData with info
        formData.append("file", imageFile);

        console.log("5. FormData SUCCESS");

        console.log("6. About to fetch FASTAPI");

        // send HTTP request to FastAPI
        // first arg: URL to go to
        // {} creates JS object with method (POST request) and the body
        const response = await fetch(
          `${API_URL}/detect`,
          {
            method: "POST",
            body: formData, //actual data that i want to send
          }
        );

        /*
        response contains info about HTTP response
        if response.status is 200, HTTP request succeeded
        */

        console.log("7. FastAPI fetch SUCCESS:", response.status);

        // if HTTP request was unsuccessful
        if (!response.ok) {
          const errorText = await response.text();
          console.error("FastAPI error:", errorText);
          throw new Error("Object detection failed");
        }
        
        // store JSON response in data variable
        const data = await response.json();
        
        // finish progress bar
        setProgress(1);
        
        // give progress bar time to reach 100% before leaving page
        await new Promise((resolve) => setTimeout(resolve, 400));

        console.log("8. Detected objects:", data.objects);
        console.log("9. Physics results:", data.physics);

        // navigate to results screen (removes the /analyzing screen from history too)
        router.replace({
          pathname: "/results",
          params: {
            imageUri,
            objects: JSON.stringify(data.objects), //data.objects is js array, but params have to be in string form
            physics: JSON.stringify(data.physics),
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

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= 0.9) {
          return current;
        }

        const remaining = 0.9 - current;
        return current + remaining * 0.15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setLoadingText(
        LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]
      );
    }, 3000); // change every 3 seconds

    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

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

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {loadingText}
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

  progressContainer: {
  width: "75%",
  alignItems: "center",
  gap: 10,
},

  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#263241",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },

  progressText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});