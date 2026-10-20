import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Alert } from "react-native";

export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permission Needed",
      "Allow access to your photo library to continue."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled && result.assets.length > 0) {
    router.replace({
      pathname: "/analyzing",
      params: { imageUri: result.assets[0].uri },
    });
  }
}

export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Camera Permission Required",
      "PhysLens needs camera access to take a photo."
    );
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled && result.assets.length > 0) {
    router.replace({
      pathname: "/analyzing",
      params: { imageUri: result.assets[0].uri },
    });
  }
}