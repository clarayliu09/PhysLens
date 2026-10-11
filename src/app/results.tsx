import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, {
  Line,
  Polygon,
  Text as SvgText
} from "react-native-svg";

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
  direction: "up" | "down" | "left" | "right"; //simple cases for now --> later: angles
  id: string;
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
  const numObjects = detectedObjects.length;

  const [visibleObjects, setVisibleObjects] = useState<
    Record<number, boolean>
  >({});

  const [visibleForces, setVisibleForces] = useState<
    Record<string, boolean>
  >({});
  // use "Record<number, boolean" to store whether each object is visible, indexed by detection index

  const [expandedObjects, setExpandedObjects] =
    useState<Record<number, boolean>>({});

  const toggleExpanded = (index: number) => {
    setExpandedObjects(prev => ({
      ...prev,
      [index]: !(prev[index] === true),
    }));
  };

  const isObjectVisible = (index: number) =>
    visibleObjects[index] !== false;

  const isForceVisible = (id: string) =>
    visibleForces[id] !== false;

  const toggleObject = (index: number) => {
    setVisibleObjects(prev => ({
      ...prev,
      [index]: !isObjectVisible(index),
    }));
  };

  const toggleForce = (id: string) => {
    setVisibleForces(prev => ({
      ...prev,
      [id]: !isForceVisible(id),
    }));
  };

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

  const OBJECT_COLORS = [
    "#FF453A", // 0: red
    "#0A84FF", // 1: blue
    "#30D158", // 2: green
    "#BF5AF2", // 3: purple
    "#FF9F0A", // 4: orange
    "#64D2FF", // 5: cyan
    "#FFD60A", // 6: yellow
    "#FF6482", // 7: pink
  ];

  const getObjectColor = (index: number) =>
    OBJECT_COLORS[index % OBJECT_COLORS.length];

  // /* Debugging 
  physicsResults.forEach((objectPhysics) => {
    const detectedObject = detectedObjects[objectPhysics.index];
    
    if (!detectedObject) {
      console.warn(
        `No detected object for physics index ${objectPhysics.index}`
      );
      return;
    }

    const centerX = ((detectedObject.box.xmin + detectedObject.box.xmax) /2) * scale + xoff;
    const centerY = ((detectedObject.box.ymin + detectedObject.box.ymax)/2) * scale + yoff;

    console.log("Force origin:", {x: centerX, y: centerY});

    console.log("Physics object index:", objectPhysics.index);
    console.log("Matched detected object:", detectedObject);
    console.log(
      "Forces:",
      JSON.stringify(objectPhysics.forces, null, 2)
    )
  })


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }}
          style = {styles.image}
        ></Image>

        {detectedObjects.map((object, index) => {
          if (!isObjectVisible(index)) return null;

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
                  borderColor: getObjectColor(index),
                },
              ]}
            >
              <Text style={[styles.boxLabel, {backgroundColor: getObjectColor(index)}]}>
                {object.label /*object {index+1}*/}
              </Text>
            </View>
          );
        })}

        {imageSize.width > 0 && imageSize.height > 0 &&
          physicsResults.map((objectPhysics) => {
            if (!isObjectVisible(objectPhysics.index)) {
              return null;
            }

            const detectedObject =
              detectedObjects[objectPhysics.index];

            const objectColor = getObjectColor(objectPhysics.index);

            if (!detectedObject) {
              return null;
            }

            const centerX =
              ((detectedObject.box.xmin +
                detectedObject.box.xmax) / 2) *
                scale +
              xoff;

            const centerY =
              ((detectedObject.box.ymin +
                detectedObject.box.ymax) / 2) *
                scale +
              yoff;

            const arrowLength = 90;


            return (
              <View
                key={`forces-${objectPhysics.index}`}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {/* Force arrow */}
                <Svg
                  width={DISPLAY_WIDTH}
                  height={DISPLAY_HEIGHT}
                  style={StyleSheet.absoluteFill}
                >
                  {objectPhysics.forces.filter(force => isForceVisible(force.id)).map((force, forceIndex) => {
                    // force-arrow rendering will only process enabled forces

                    //all forces on this object pointing in the same direction
                    const sameDirectionForces = objectPhysics.forces.filter(
                      (f) =>
                        isForceVisible(f.id) &&
                        f.direction === force.direction
                    );

                    //find which one this specific force is
                    const directionIndex = sameDirectionForces.findIndex(
                      (f) => f.id === force.id
                    )

                    // calc horiz offset
                    const spacing = 18;
                    const offX = (directionIndex - (sameDirectionForces.length-1)/2) * spacing
                    const startX = centerX + offX;


                    let endX = startX;
                    let endY = centerY;
                    let label = "";
                    let arrowPoints = "";

                    // short force labels
                    if (force.type === "gravity") {
                      label = "Fg";
                    } else if (force.type === "normal") {
                      label = "FN";
                    } else if (force.type === "tension") {
                      label = "FT";
                    } else if (force.type === "friction") {
                      label = "Ff";
                    }

                    //label = force.id // overrides it for now (debugging purposes)

                    if (force.direction === "down") {
                      endY = centerY + arrowLength;

                      arrowPoints = `
                        ${endX},${endY}
                        ${endX - 6},${endY - 10}
                        ${endX + 6},${endY - 10}
                      `;
                    }

                    else if (force.direction === "up") {
                      endY = centerY - arrowLength;

                      arrowPoints = `
                        ${endX},${endY}
                        ${endX - 6},${endY + 10}
                        ${endX + 6},${endY + 10}
                      `;
                    }

                    return (
                      <Fragment key={forceIndex}>

                        <Line
                          x1={startX}
                          y1={centerY}
                          x2={startX}
                          y2={endY}
                          stroke={objectColor}
                          strokeWidth={3}
                        />

                        <Polygon
                          points={arrowPoints}
                          fill={objectColor}
                        />

                        <SvgText
                          x={startX + 8}
                          y={endY}
                          fill={objectColor}
                          fontSize="15"
                          fontWeight="bold"
                        >
                          {label}
                        </SvgText>

                      </Fragment>
                    );
                  })}
                </Svg>

                {/* Debugging marker */}
                <View
                  style={[
                    styles.forceOrigin,
                    {
                      left: centerX - 5,
                      top: centerY - 5,
                      backgroundColor: objectColor,
                    },
                  ]}
                />
              </View>

            );
          })}

      </View>

      <View style={styles.visControls}>
        <Text style={styles.sectionTitle}>
          Detected Objects ({numObjects})
        </Text>

        {detectedObjects.map((object, index) => {
          const checked = isObjectVisible(index);
          const expanded = expandedObjects[index] === true;
          const objectColor = getObjectColor(index);

          const objectPhysics = physicsResults.find(
            p => p.index === index
          );

          return (
            <View key={index} style={styles.objectCard}>
              <View style={styles.objectCardHeader}>
                <Pressable onPress={() => toggleObject(index)}>
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={26}
                    color={checked ? objectColor : "#8895A7"}
                  />
                </Pressable>

                <Pressable
                  style={styles.objectCardTitle}
                  onPress={() => toggleExpanded(index)}
                >
                  <Text style={styles.cardObjectName}>
                    {object.label}
                  </Text>

                  <Text style={styles.cardConfidence}>
                    {Math.round(object.confidence * 100)}%
                  </Text>

                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#A9B8C9"
                  />
                </Pressable>
              </View>

              {checked && expanded && (
                <View style={styles.forceList}>
                  <Text style={styles.forceSectionTitle}>
                    SHOW FORCES
                  </Text>

                  {(objectPhysics?.forces ?? []).map(force => (
                    <Pressable
                      key={force.id}
                      style={styles.forceRow}
                      onPress={() => toggleForce(force.id)}
                    >
                      <Ionicons
                        name={
                          isForceVisible(force.id)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={21}
                        color={
                          isForceVisible(force.id)
                            ? objectColor
                            : "#8895A7"
                        }
                      />

                      <Text style={styles.forceName}>
                        {force.type === "gravity"
                          ? "Gravity"
                          : `${force.type.charAt(0).toUpperCase()}${force.type.slice(1)} · ${force.id.split("_on_")[0]}`}
                      </Text>

                      <Ionicons
                        name={
                          force.direction === "up"
                            ? "arrow-up"
                            : force.direction === "down"
                              ? "arrow-down"
                              : force.direction === "left"
                                ? "arrow-back"
                                : "arrow-forward"
                        }
                        size={19}
                        color={objectColor}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>


      <Pressable style={styles.primaryButton} onPress={() => router.dismissAll()}> 
        <Ionicons
          name="return-up-back"
          size={30}
          color="white"
        />
        <Text style={styles.primaryButtonText}>Return</Text>
      </Pressable>   

    </ScrollView>
  );
} 



// <---------------------STYLING-------------------------->
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F", //cream: C7C3BD",
  },

  scrollContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 24,
  },


  imageContainer: {
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    position: "relative",
  },

  visControls: {
    width: "100%",
    gap: 12,
  },

  objectCard: {
    width: "100%",
    backgroundColor: "#172638",
    borderRadius: 14,
    padding: 16,
  },

  objectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  objectCardTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardObjectName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },

  cardConfidence: {
    fontSize: 14,
    color: "#A9B8C9",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
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

    forceList: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#34465B",
    gap: 14,
  },

  forceSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A9B8C9",
    letterSpacing: 1,
  },

  forceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  forceName: {
    flex: 1,
    fontSize: 14,
    color: "#E4EAF1",
  },

  forceOrigin: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
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
    resizeMode: "contain", 
  },

  primaryButton: {
    width: "100%",
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
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