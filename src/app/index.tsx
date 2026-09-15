import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

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
      allowsEditing: true, //lets users edit the image (crop/rotate)
      quality: 1, //compress for max quality
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
      allowsEditing: true,
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
    <View style={styles.container}>

      <Image
        source={require("../../assets/images/home-icon.png")}
        style={styles.icon}
      />

      <Text style={styles.title}>PhysLens</Text>
      <Text style={styles.subtitle}>See the physics around you</Text>

      {/* HOW IT WORKS */}
      <Pressable style={styles.button} onPress={pressed}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color="white"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111F",
  },

  icon: {
    width: 400,
    height: 400,
  },

  title: {
    marginTop: -150,
    fontSize: 80,
    fontWeight: "700",
    color: "white",
  },

  subtitle: {
    fontSize: 25,
    margin: 8,
    textAlign: "center",
    color: "white",
  },

  button: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  primaryButton: {
    width: 250,
    marginTop: 40,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D00003",
    gap: 20,
    shadowColor: "#0037AF",
    shadowOffset: {
      width: 0,
      height: 5,
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
