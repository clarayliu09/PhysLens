import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, {
  Line,
  Polygon,
  Text as SvgText,
  TSpan,
} from "react-native-svg";

import LinkedExplanation from "../components/LinkedExplanation";
import ScreenBackground from "../components/ScreenBg";
import { COLORS } from "../constants/theme";
import { pickImage } from "../utils/imagePicker";

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

type ObjectExplanation = {
  index: number;
  summary: string;
}

type ForceLabel = {
  symbol: string;
  subscript: string;
};

function getForceLabel(force: Force, forces: Force[]): ForceLabel {
  if (force.type === "gravity") {
    return { symbol: "F", subscript: "g" };
  }

  const sameTypeForces = forces.filter(
    (f) => f.type === force.type
  );

  const forceNumber =
    sameTypeForces.findIndex((f) => f.id === force.id) + 1;

  const subscript =
    sameTypeForces.length === 1
      ? ""
      : String(forceNumber);

  switch (force.type) {
    case "normal":
      return { symbol: "N", subscript };

    case "tension":
      return { symbol: "T", subscript };

    case "friction":
      return { symbol: "f", subscript };

    default:
      return { symbol: "F", subscript };
  }
}

function getForceDescription(force: Force): string {
  if (force.type === "gravity") {
    return "Gravitational force from Earth";
  }

  const source = force.id.split("_on_")[0].replaceAll("_", " ");

  switch (force.type) {
    case "normal":
      return `Normal force from ${source}`;

    case "tension":
      return `Tension force from ${source}`;

    case "friction":
      return `Friction force from ${source}`;

    default:
      return `Force from ${source}`;
  }
}

const DISPLAY_HEIGHT = 450;
const DISPLAY_WIDTH = DISPLAY_HEIGHT * 3/4; //4:3 ratio
const FORCE_PADDING = 110;


export default function ResultScreen() {

  const { imageUri, objects, physics, explanations} = useLocalSearchParams<{
    imageUri: string;
    objects: string;
    physics: string;
    explanations: string;
  }>();

  const detectedObjects: DetectedObject[] = JSON.parse(objects);
  const physicsResults: ObjectPhysics[] = JSON.parse(physics);
  const numObjects = detectedObjects.length;

  const parsedExplanations: ObjectExplanation[] = (() => {
    try {
      const raw = JSON.parse(typeof explanations == "string" ? explanations: "{}");

      return Array.isArray(raw?.explanations)
        ? raw.explanations
        : [];
    } catch {
      return[];
    }
  })();

  // function that takes in the index and returns the label of an object
  // (also makes sure objects with the same label get different names)
  const getObjectName = (index: number) => {
    const label = detectedObjects[index].label;

    // Find all objects with the same label
    const matchingIndices = detectedObjects
      .map((object, i) => object.label === label ? i : -1)
      .filter(i => i !== -1);
      // .map produces a new array of same length: [0, -1, 2, -1, 4] ( -1 means that the item isn't a match )
      // .filter results: [0, 2, 4] (these are the detection indices of the items that have the same label)
      // matchingIndices = [0, 2, 4]

    // No numbering needed if the object is unique
    if (matchingIndices.length === 1) {
      return label; // "vase"
    }

    // Number duplicates starting from 1
    const number = matchingIndices.indexOf(index) + 1;

    return `${label} ${number}`; // eg "vase 1"
  };

  const [visibleObjects, setVisibleObjects] = useState<
    Record<number, boolean>
  >({});

  const [selectedObjectIndices, setSelectedObjectIndices] = useState<number[]>([0, 1, 2]);
  const [showAllObjects, setShowAllObjects] = useState(false);
  const [showForceLegend, setShowForceLegend] = useState(false);

  useEffect(() => {
    const firstThree = detectedObjects
      .slice(0, 3)
      .map((_, index) => index);

    setSelectedObjectIndices(firstThree);

    const initialVisibility: Record<number, boolean> = {};

    firstThree.forEach(index => {
      initialVisibility[index] = true;
    });

    setVisibleObjects(initialVisibility);
    setVisibleForces({});
    setExpandedObjects({});
    setShowAllObjects(false);
  }, [objects]);

  const [visibleForces, setVisibleForces] = useState<
    Record<string, boolean>
  >({});
  // use "Record<string, boolean" to store whether each object is visible, indexed by detection index

  const [expandedObjects, setExpandedObjects] =
    useState<Record<number, boolean>>({});

  const toggleExpanded = (index: number) => {
    setExpandedObjects(prev => ({
      ...prev,
      [index]: !(prev[index] === true),
    }));
  };
  
  // Whether the object is displayed on the image
  const isObjectVisible = (index: number) =>
    visibleObjects[index] === true;

  const isForceVisible = (index: number, id: string) =>
    visibleForces[`${index}:${id}`] !== false;

  const toggleForce = (index: number, id: string) => {
    const key = `${index}:${id}`;

    setVisibleForces(prev => ({
      ...prev,
      [key]: !(prev[key] !== false),
    }));
  };

  // Checkbox: show/hide object and automatically enable its forces
  const toggleObject = (index: number) => {
    const nextVisible = !isObjectVisible(index);

    setVisibleObjects(prev => ({
      ...prev,
      [index]: nextVisible,
    }));

    // When the object is checked, reset all its forces to ON
    if (nextVisible) {
      setVisibleForces(prev => {
        const updated = { ...prev };

        const objectPhysics = physicsResults.find(
          p => p.index === index
        );

        objectPhysics?.forces.forEach(force => {
          updated[`${index}:${force.id}`] = true;
        });

        return updated;
      });
    }
  };

  // Add an object to the selected list, checked by default
  const addObject = (index: number) => {
    setSelectedObjectIndices(prev =>
      prev.includes(index) ? prev : [...prev, index]
    );

    // Automatically check the object
    setVisibleObjects(prev => ({
      ...prev,
      [index]: true,
    }));

    // Automatically enable all its forces
    setVisibleForces(prev => {
      const updated = { ...prev };

      const objectPhysics = physicsResults.find(
        p => p.index === index
      );

      objectPhysics?.forces.forEach(force => {
        updated[`${index}:${force.id}`] = true;
      });

      return updated;
    });
  };

  // Remove an object from the selected list
  const removeObject = (index: number) => {
    setSelectedObjectIndices(prev =>
      prev.filter(i => i !== index)
    );

    setVisibleObjects(prev => ({
      ...prev,
      [index]: false,
    }));
  };

  // Objects in the selected controls list
  const selectedObjects = selectedObjectIndices
    .filter(index => detectedObjects[index] !== undefined)
    .map(index => ({
      object: detectedObjects[index],
      index,
    }));

  // Objects available to add
  const hiddenObjects = detectedObjects
    .map((object, index) => ({ object, index }))
    .filter(({ index }) => !selectedObjectIndices.includes(index));

  const [imageSize, setImageSize] = useState({width:0, height:0});

  useEffect(() => {
    if (!imageUri) return;

    Image.getSize(imageUri, (width, height) => setImageSize({width:width, height:height}))
  }, [imageUri]); //runs this code whenever the imageUri changes

  let scale = 0;
  if (imageSize.width > 0 && imageSize.height > 0) {
    scale = Math.min(DISPLAY_WIDTH/imageSize.width, DISPLAY_HEIGHT/imageSize.height);
  }

  // scaled image dimensions
  const w = imageSize.width * scale;
  const h = imageSize.height * scale;

  const xoff = 0;
  const yoff = 0;
  
  const arrowLength = 90;

  // Find the lowest endpoint of any downward force arrow
  const lowestArrowY = physicsResults.reduce((lowest, objectPhysics) => {
    if (!isObjectVisible(objectPhysics.index)) return lowest;

    const hasDownwardForce = objectPhysics.forces.some(
      (force) =>
        force.direction === "down" &&
        isForceVisible(objectPhysics.index, force.id)
    );

    if (!hasDownwardForce) return lowest;

    const object = detectedObjects[objectPhysics.index];
    if (!object) return lowest;

    const centerY =
      ((object.box.ymin + object.box.ymax) / 2) * scale + yoff;

    return Math.max(lowest, centerY + arrowLength);
  }, h);

  // Space needed below the image for arrows and labels
  const bottomArrowOverflow = Math.max(0, lowestArrowY - h);

  // Extra room between arrows and the next section
  const bottomSpacing = bottomArrowOverflow + 10;

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
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.imageContainer, {width: w || DISPLAY_WIDTH, height: h || DISPLAY_HEIGHT, marginBottom: bottomSpacing,},]}>
          <Image 
            source={{ uri: imageUri }}
            style = {{
              width: w || DISPLAY_WIDTH,
              height: h || DISPLAY_HEIGHT,
            }}
            resizeMode = "contain"
          ></Image>

          {/* Visualization Overlays (bounding boxes, forces) */}
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
                  {getObjectName(index) /*object {index+1}*/}
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

              const svgCenterX = centerX + FORCE_PADDING;
              const svgCenterY = centerY + FORCE_PADDING;

              return (
                <View
                  key={`forces-${objectPhysics.index}`}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                >
                  {/* Force arrow */}
                  <Svg
                    width={w + FORCE_PADDING * 2}
                    height={h + FORCE_PADDING * 2}
                    style={{
                      position: "absolute",
                      left: -FORCE_PADDING,
                      top: -FORCE_PADDING,
                    }}
                  >
                    {objectPhysics.forces.filter(force => isForceVisible(objectPhysics.index, force.id)).map((force, forceIndex) => {
                      // force-arrow rendering will only process enabled forces

                      //all forces on this object pointing in the same direction
                      const sameDirectionForces = objectPhysics.forces.filter(
                        (f) =>
                          isForceVisible(objectPhysics.index, f.id) &&
                          f.direction === force.direction
                      );

                      //find which one this specific force is
                      const directionIndex = sameDirectionForces.findIndex(
                        (f) => f.id === force.id
                      )

                      // calc horiz offset
                      const spacing = 35;
                      const offX = (directionIndex - (sameDirectionForces.length-1)/2) * spacing
                      const startX = svgCenterX + offX;


                      let endX = startX;
                      let endY = svgCenterY;
                      let arrowPoints = "";

                      const label = getForceLabel(force, objectPhysics.forces);

                      //label = force.id // overrides it for now (debugging purposes)

                      if (force.direction === "down") {
                        endY = svgCenterY + arrowLength;

                        arrowPoints = `
                          ${endX},${endY}
                          ${endX - 6},${endY - 10}
                          ${endX + 6},${endY - 10}
                        `;
                      }

                      else if (force.direction === "up") {
                        endY = svgCenterY - arrowLength;

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
                            y1={svgCenterY}
                            x2={startX}
                            y2={endY}
                            stroke={objectColor}
                            strokeWidth={3}
                          />

                          <Polygon
                            points={arrowPoints}
                            fill={objectColor}
                          />

                          {/* White outline behind the force label */}
                          <SvgText
                            x={startX + 8}
                            y={endY}
                            fill="#FFFFFF"
                            stroke="#FFFFFF"
                            strokeWidth={3}
                            strokeLinejoin="round"
                            fontSize={16}
                            fontWeight="bold"
                          >
                            {label.symbol}
                            <TSpan dy={5} fontSize={10} fontWeight="500">
                              {label.subscript}
                            </TSpan>
                          </SvgText>

                          {/* Colored force label on top */}
                          <SvgText
                            x={startX + 8}
                            y={endY}
                            fill={objectColor}
                            fontSize={16}
                            fontWeight="bold"
                          >
                            {label.symbol}
                            <TSpan dy={5} fontSize={10} fontWeight="500">
                              {label.subscript}
                            </TSpan>
                          </SvgText>

                        </Fragment>
                      );
                    })}
                  </Svg>

                  {/* Center marker */}
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

            {/* Floating force legend button */}
            <Pressable
              style={styles.legendFloatingButton}
              onPress={() => setShowForceLegend(true)}
              accessibilityRole="button"
              accessibilityLabel="Open force legend"
            >
              <Ionicons
                name="list-outline"
                size={23}
                color="#FFFFFF"
              />
              </Pressable>
        </View>

          <Modal
            visible={showForceLegend}
            transparent
            animationType="fade"
            onRequestClose={() => setShowForceLegend(false)}
            statusBarTranslucent
          >
            <View style={styles.legendOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowForceLegend(false)}
                accessibilityLabel="Close force legend"
              />

              <View style={styles.legendModal}>
                <View style={styles.legendModalHeader}>
                  <View style={styles.legendModalTitleRow}>
                    <Ionicons
                      name="list-outline"
                      size={23}
                      color={COLORS.green}
                      marginBottom="14"
                    />
                    <Text style={styles.legendModalTitle}>
                      Force Legend
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setShowForceLegend(false)}
                    hitSlop={12}
                    accessibilityLabel="Close force legend"
                  >
                    <Ionicons
                      name="close"
                      size={25}
                      color="#718475"
                    />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.legendScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedObjects
                    .filter(({ index }) => isObjectVisible(index))
                    .map(({ index }) => {
                      const objectPhysics = physicsResults.find(
                        p => p.index === index
                      );

                      const activeForces = (objectPhysics?.forces ?? []).filter(
                        force => isForceVisible(index, force.id)
                      );

                      return (
                        <View key={index} style={styles.legendObject}>
                          <View style={styles.legendObjectHeader}>
                            <View
                              style={[
                                styles.legendColor,
                                { backgroundColor: getObjectColor(index) },
                              ]}
                            />

                            <Text style={styles.legendObjectName}>
                              {getObjectName(index)}
                            </Text>
                          </View>

                          {activeForces.length === 0 ? (
                    <Text style={styles.legendDescription}>
                      No forces currently displayed
                    </Text>
                  ) : (
                    activeForces.map(force => {
                            const label = getForceLabel(
                              force,
                              objectPhysics!.forces
                            );

                            return (
                              <View
                                key={force.id}
                                style={styles.legendForceRow}
                              >
                                <View style={styles.legendSymbolRow}>
                                  <Text
                                    style={[
                                      styles.legendSymbol,
                                      { color: getObjectColor(index) },
                                    ]}
                                  >
                                    {label.symbol}
                                  </Text>
                                  {label.subscript !== "" && (
                                    <Text
                                      style={[
                                        styles.legendSubscript,
                                        { color: getObjectColor(index) },
                                      ]}
                                    >
                                      {label.subscript}
                                    </Text>
                                  )}
                                </View>

                                <Text style={styles.legendDescription}>
                                  {getForceDescription(force)}
                                </Text>
                              </View>
                            );
                          })
                  )}
                        </View>
                      );
                    })}
                </ScrollView>

                <Text style={styles.legendNote}>
                  Arrow colors identify objects. Arrow lengths do not
                  represent measured force magnitudes.
                </Text>
              </View>
            </View>
          </Modal>

        <View style={styles.visControls}>
          <Text style={styles.sectionTitle}>
            Detected Objects ({numObjects})
          </Text>
          
          {/*Object cards */}
          {selectedObjects.map(({object, index}) => {
            const checked = isObjectVisible(index);
            const expanded = expandedObjects[index] === true;
            const objectColor = getObjectColor(index);
            const explanation = parsedExplanations.find((item) => item.index === index);

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
                      color={checked ? objectColor : "#718475"}
                    />
                  </Pressable>

                  <Pressable
                    style={styles.objectCardTitle}
                    onPress={() => toggleExpanded(index)}
                  >
                    <Text style={styles.cardObjectName}>
                      {getObjectName(index)}
                    </Text>

                    {/*
                    <Text style={styles.cardConfidence}>
                      {Math.round(object.confidence * 100)}%
                    </Text>
                    */}

                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#718475"
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => removeObject(index)}
                    hitSlop={10}
                    accessibilityLabel={`Remove ${object.label} from selected objects`}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color="#718475"
                    />
                  </Pressable>
                </View>

                {/*Expanded section */}
                {checked && expanded && (
                  <View style={styles.forceList}>
                    <Text style={styles.forceSectionTitle}>
                      FORCES
                    </Text>

                    {(objectPhysics?.forces ?? []).map(force => (
                      <Pressable
                        key={force.id}
                        style={styles.forceRow}
                        onPress={() => toggleForce(index, force.id)}
                      >
                        <Ionicons
                          name={
                            isForceVisible(index, force.id)
                              ? "checkbox"
                              : "square-outline"
                          }
                          size={21}
                          color={
                            isForceVisible(index, force.id)
                              ? objectColor
                              : "#718475"
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

                    {explanation?.summary ? (
                      <View style={styles.explanationContainer}>
                        <View style={styles.explanationHeader}>
                          <Ionicons
                            name="book-outline"
                            size={17}
                            color={COLORS.green}
                          />
                          <Text style={styles.explanationTitle}>
                            Physics explanation
                          </Text>
                        </View>

                        <LinkedExplanation text={explanation.summary} />
                      </View>
                    ) : null}

                  </View>
                )}
              </View>
            );
          })}

          {/* Show/hide the list of unselected objects */}
          {hiddenObjects.length > 0 && (
            <Pressable
              style={styles.showMoreButton}
              onPress={() => setShowAllObjects(prev => !prev)}
            >
              <Ionicons
                name={showAllObjects ? "chevron-up" : "chevron-down"}
                size={20}
                color="#2c6451ff"
              />

              <Text style={styles.showMoreText}>
                {showAllObjects
                  ? "Hide other objects"
                  : `Show other objects (${hiddenObjects.length})`}
              </Text>
            </Pressable>
          )}

          {/* List of currently hidden objects */}
          {showAllObjects && hiddenObjects.map(({ object, index }) => (
            <Pressable
              key={index}
              style={styles.hiddenObjectRow}
              onPress={() => addObject(index)}
            >
              <Ionicons
                name="square-outline"
                size={23}
                color="#718475"
              />

              <Text style={styles.hiddenObjectName}>
                {getObjectName(index)}
              </Text>

              {/*
              <Text style={styles.cardConfidence}>
                {Math.round(object.confidence * 100)}%
              </Text>
              */}

              <Ionicons
                name="add"
                size={20}
                color="#2c6451ff"
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.analyzeAnotherButton}
          onPress={() => {void pickImage();}}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.analyzeAnotherButtonText}>
            Analyze Another Image
          </Text>
        </Pressable>
          
        <Pressable style={styles.returnButton} onPress={() => router.replace("/")}> 
          <Ionicons
            name="return-up-back"
            size={30}
            color={COLORS.green}
          />
          <Text style={styles.returnButtonText}>Return</Text>
        </Pressable>   

      </ScrollView>
    </ScreenBackground>
  );
} 



// STYLING
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  image: {
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    resizeMode: "contain",
  },

  scrollContent: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },

  imageContainer: {
    position: "relative",
    overflow: "visible",
    marginTop: 20,
    marginBottom: 10,
  },

  visControls: {
    width: "100%",
    gap: 5,
  },

  showMoreButton: {
    width: "100%",
    backgroundColor: "#E6ECE3",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.grid,
  },

  showMoreText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "600",
  },

  hiddenObjectRow: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.grid,
  },

  hiddenObjectName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },

  objectCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.grid,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    fontWeight: "700",
    color: COLORS.text,
  },

  cardConfidence: {
    fontSize: 14,
    color: "#718475",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: COLORS.text,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grid,
    gap: 10,
  },

  forceSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718475",
    letterSpacing: 1,
  },

  forceName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  forceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  forceOrigin: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },

  explanationContainer: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#F8F7F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE4DA",
  },

  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 7,
  },

  explanationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
  },

  returnButton: {
    width: "100%",
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    gap: 20,
    shadowColor: COLORS.green,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  returnButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.green,
    textAlign: "center",
  },

  analyzeAnotherButton: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLORS.green,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 10,
  },

  analyzeAnotherButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },

  legendFloatingButton: {
  position: "absolute",
  right: 12,
  bottom: 12,
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(10, 35, 28, 0.78)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.3)",
},

legendOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.48)",
  justifyContent: "center",
  paddingHorizontal: 24,
},

legendModal: {
  backgroundColor: COLORS.white,
  borderRadius: 20,
  padding: 22,
  maxHeight: "75%",
},

legendModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

legendModalTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

legendModalTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: COLORS.text,
  marginBottom:14,
},

legendScroll: {
  flexGrow: 0,
},

legendObject: {
  borderTopWidth: 1,
  borderTopColor: COLORS.grid,
  paddingVertical: 14,
  gap: 10,
},

legendObjectHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 9,
},

legendColor: {
  width: 12,
  height: 12,
  borderRadius: 3,
},

legendObjectName: {
  fontSize: 15,
  fontWeight: "700",
  color: COLORS.text,
},

legendForceRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingLeft: 20,
},

legendSymbolRow: {
  width: 42,
  flexDirection: "row",
  alignItems: "flex-end",
},

legendSymbol: {
  fontSize: 18,
  fontWeight: "700",
},

legendSubscript: {
  fontSize: 11,
  marginBottom: -2,
},

legendDescription: {
  flex: 1,
  fontSize: 14,
  color: COLORS.text,
  lineHeight: 20,
},

legendNote: {
  fontSize: 12,
  color: "#718475",
  lineHeight: 18,
  borderTopWidth: 1,
  borderTopColor: COLORS.grid,
  paddingTop: 12,
  marginTop: 8,
},

});

