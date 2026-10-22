import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { pickImage, takePhoto } from "../utils/imagePicker";

import ScreenBackground from "../components/ScreenBg";
import { COLORS } from "../constants/theme";

export default function HomeScreen() {

  const [showInfo, setShowInfo] = useState(false);


  return (
    <ScreenBackground>
      <View style={styles.container}>

        <Image
          source={require("../../assets/images/icon-1.png")}
          style={styles.icon}
        />

        <Text style={styles.title}>PhysLens</Text>
        <Text style={styles.subtitle}>See the physics around you</Text>

        {/* HOW IT WORKS */}
        <Pressable style={styles.button} onPress={() => setShowInfo(true)}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.text}
          />

          <Text style={styles.buttonText}>How it works</Text>
        </Pressable>

        {/* UPLOAD BUTTON */}
        <Pressable
          style={styles.primaryButton}
          onPress={pickImage}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={30}
            color="white"
          />

          <Text style={styles.primaryButtonText}>
            Upload Image/Video
          </Text>
        </Pressable>

        {/* CAMERA BUTTON */}
        <Pressable
          style={styles.primaryButton}
          onPress={takePhoto}
        >
          <Ionicons
            name="camera-outline"
            size={30}
            color="white"
          />

          <Text style={styles.primaryButtonText}>
            Open Camera
          </Text>
        </Pressable>

      </View>

      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/*close button */}
            <Pressable style={styles.modalClose} onPress={()=>setShowInfo(false)}>
              <Ionicons name="close" size={24} color={COLORS.text}/>
            </Pressable>

            <Text style={styles.modalTitle}>How PhysLens Works</Text>

            <Text style={styles.disclaimerText}>
              DISCLAIMER: AI can make mistakes.
            </Text>

            <View style={styles.featureRow}>
              <Ionicons name="camera-outline" size={26} color={COLORS.green} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>1. Capture a Scene</Text>
                <Text style={styles.featureDescription}>
                  Take a photo or upload an image of objects around you. Make sure the images are clearly in the frame for better accuracy
                </Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="scan-outline" size={26} color={COLORS.green} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>2. Detect Objects</Text>
                <Text style={styles.featureDescription}>
                  PhysLens uses AI to identify objects and how they interact with each other.
                </Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="git-branch-outline" size={26} color={COLORS.green} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>3. Visualize Forces</Text>
                <Text style={styles.featureDescription}>
                  Explore force diagrams showing gravity, normal forces, and other
                  forces acting on the detected objects.
                </Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="book-outline" size={26} color={COLORS.green} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>4. Learn the Physics</Text>
                <Text style={styles.featureDescription}>
                  Read explanations and tap linked physics terms to learn more.
                </Text>
              </View>
            </View>

          </View>
        </View>
      </Modal>
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

  icon: {
    width: 300,
    height: 300,
  },

  title: {
    marginTop: -75,
    fontSize: 75,
    fontWeight: "800",
    letterSpacing: -3,
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 25,
    margin: 8,
    textAlign: "center",
    color: COLORS.text,
  },

  button: {
    marginTop: 20,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: COLORS.text,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
  },

  primaryButton: {
    width: 280,
    marginTop: 40,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.green,
    gap: 20,
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.75,
    shadowRadius: 12,
    elevation: 5,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.white,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  modalClose: {
    alignSelf: "flex-end",
    padding: 4,
  },

  modalTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 10,
  },

  disclaimerText: {
    fontSize: 15,
    color: COLORS.green,
    marginBottom: 26,
    lineHeight: 22,
    fontStyle: "italic",
    textAlign: "center",
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 22,
  },

  featureTextContainer: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    opacity: 0.8,
  },

  modalButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },

  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
