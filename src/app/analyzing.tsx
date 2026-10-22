import { File } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, StyleSheet, Text, View } from "react-native";

import ScreenBackground from "../components/ScreenBg";
import { COLORS } from "../constants/theme";

let LOADING_TEXTS: string[] = [
  "PhysLens is identifying objects, forces and physics concepts",
  "Letting Force = mass x acceleration",
  "Neglecting negligable things...",
  "Currently doing positive work...",
  "Consulting Newton...",
  "Did you know? An object can be moving even when the net force is zero",
  "Making sure gravity is still working...",
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
        console.log("10. Explanations results:", data.explanations);

        // navigate to results screen (removes the /analyzing screen from history too)
        router.replace({
          pathname: "/results",
          params: {
            imageUri,
            objects: JSON.stringify(data.objects), //data.objects is js array, but params have to be in string form
            physics: JSON.stringify(data.physics),
            explanations: JSON.stringify(data.explanations),
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
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;

      // starst off fast then gradually slows down
      // approaches 99% but only reaches 100% when analysis finishes
      const estimatedProgress = Math.min(
        0.99,
        0.99 * (1 - Math.exp(-elapsed / 22))
      );

      setProgress((current) =>
        current === 1 ? 1 : estimatedProgress
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setLoadingText((previous) => {
        // prevent the same msg from appearing 2x in a row
        const alts = LOADING_TEXTS.filter(
          (text) => text !== previous
        );

        return alts[
          Math.floor(Math.random() * alts.length)
        ];
      });
    }, 5000); // change every 5s

    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <ScreenBackground>
      <View style={styles.container}>

        <Text style={styles.title}>Analyzing scene...</Text>

        <Text style={styles.disclaimer}>
          This may take 1–2 minutes
        </Text>

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
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  title: {
    fontSize: 40,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 20,
    margin: 16,
    textAlign: "center",
    color: COLORS.text,
  },

  disclaimer: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.65,
    textAlign: "center",
    marginBottom: 15,
  },

  progressContainer: {
    width: "75%",
    alignItems: "center",
    gap: 10,
  },

  progressTrack: {
    width: "100%",
    height: 30,
    backgroundColor: COLORS.text,
    borderRadius: 8,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 8,
  },

  progressText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});