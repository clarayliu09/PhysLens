import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

type Force = {
  type: "gravity" | "normal" | "tension" | "friction";
  direction: "up" | "down" | "left" | "right"; //simple cases for now
  label: string;
};

type ObjectPhysics = {
  index: number;
  forces: Force[];
};


const DISPLAY_HEIGHT = 450;
const DISPLAY_WIDTH = DISPLAY_HEIGHT * 3/4; //4:3 ratio

export default function ResultScreen() {

  const { imageUri, objects, physics} = useLocalSearchParams<{
    imageUri: string;
    objects: string;
    physics: string;
  }>();

  const detectedObjects: DetectedObject[] = JSON.parse(objects);
  const physicsResults: ObjectPhysics[] = JSON.parse(physics);

  console.log(
    "Physics in results screen:",
    JSON.stringify(physicsResults, null, 2)
  );

  const numObjects = detectedObjects.length;

  const [imageSize, setImageSize] = useState({width:0, height:0});

  useEffect(() => {
    if (!imageUri) return;

    Image.getSize(imageUri, (width, height) => setImageSize({width:width, height:height}))
  }, [imageUri]); //runs this code whenever the imageUri changes

  let scale = 0;
  if (imageSize.width > 0 && imageSize.height > 0) {
    scale = Math.min(DISPLAY_WIDTH/imageSize.width, DISPLAY_HEIGHT/imageSize.height);
  }

  const w = imageSize.width * scale;
  const h = imageSize.height * scale;

  // calculate offsets because resizeMode preserves the original image's ratio
  //    only one side (length or width) reaches the set DISPLAY_WIDTH/DISPLAY_HEIGHT values
  //    actual x and y values of the photo begin at xoff and yoff
  const xoff = (DISPLAY_WIDTH - w) / 2; // display_width - w --> unused horiz space
  const yoff = (DISPLAY_HEIGHT - h) /2;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }}
          style = {styles.image}
        ></Image>

        {detectedObjects.map((object, index) => {
          const left = object.box.xmin * scale + xoff;
          const top = object.box.ymin * scale + yoff;

          const width =
            (object.box.xmax - object.box.xmin) * scale;

          const height =
            (object.box.ymax - object.box.ymin) * scale;

          return (
            <View
              key={index}
              style={[
                styles.boundingBox,
                {
                  left,
                  top,
                  width,
                  height,
                },
              ]}
            >
              <Text style={styles.boxLabel}>
                {object.label /*object {index+1}*/}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.visControls}>
        <Text style={styles.sectionTitle}>
          Detected Objects ({numObjects})
        </Text>

        {detectedObjects.map((object, index) => (
          <View key={index} style={styles.objectRow}>
            <Text style={styles.objectLabel}>
              {object.label /*object {index+1}*/} 
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

  imageContainer: {
  width: DISPLAY_WIDTH,
  height: DISPLAY_HEIGHT,
  position: "relative",
},

  visControls: {
    marginTop: 20,
  },

  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#FF3B30",
  },

  boxLabel: {
    alignSelf: "flex-start",
    backgroundColor: "#FF3B30",
    color: "white",
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
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
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    borderRadius: 20,
    resizeMode: "contain", //shrink the entire photo until it fits in the container
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