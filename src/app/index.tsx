import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import ScreenBackground from "../components/ScreenBg";
import { COLORS } from "../constants/theme";

export default function HomeScreen() {

  function pressed() {
    // TODO: add popup window explaining the app
  }

  // open photo library to choose image
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Allow access to media library to continue')
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, //dont let users edit the image
      quality: 1, // max quality
    })
    
    if (!result.canceled) {
      const imageUri = result.assets[0].uri; //address that points to location of file

      // Send selected image to analyzing screen
      router.push({
        pathname: "/analyzing",
        params: { imageUri },
      });
    }
  }
  
  // opens camera
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert("Camera Permission Required", "PhysLens needs camera access to take a photo");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      // Send camera image to analyzing screen; adds analyzing screen to nav history
      router.push({
        pathname: "/analyzing",
        params: { imageUri },
      });
    }
  }

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
        <Pressable style={styles.button} onPress={pressed}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.text}
          />

          <Text style={styles.buttonText}>How it works.</Text>
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
});
