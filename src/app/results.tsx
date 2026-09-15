import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const NUM_OBJECTS = 2; // will later be a value passed in by the object detection data

export default function ResultScreen() {

  const { imageUri, objects} = useLocalSearchParams<{
    imageUri: string;
    objects: string;
  }>();

  const detectedObjects = JSON.parse(objects);
  console.log(detectedObjects);

  return (
    <View style={styles.container}>
       <Pressable style={styles.primaryButton} onPress={() => router.dismissAll()}> 
        <Ionicons
          name="return-up-back"
          size={30}
          color="white"
        />
        <Text style={styles.primaryButtonText}>Return</Text>
      </Pressable> 

      <View style={styles.imgContainer}>
         <Image 
          source={{ uri: imageUri }}
          style = {styles.image}
        ></Image>
      </View>

      <View style={styles.visControls}>

      </View>


    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //alignItems: "center",
    padding: 40,
    backgroundColor: "#C7C3BD", //dark navy: 07111F",
  },

  imgContainer: {
    height: 500,
    backgroundColor: '#07111F',
  },

  visControls: {

  },

  image: {
    width: 350,
    height: 350,
    borderRadius: 20,
    resizeMode: "contain",
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