import { router } from "expo-router"; //router allows nav between different screens based on ur structure of files/folder
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  
  function pressed() {
    // TODO: add popup window explaining the app
  }

  return (
    <View style={styles.container}>

      <Image source={require('../../assets/images/home-icon.png')} style={styles.icon}/>

      <Text style={styles.title}>PhysLens</Text>
      <Text style={styles.subtitle}>See the physics around you</Text>

      <Pressable style={styles.button} onPress={pressed}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
        </svg>
        <Text style={styles.buttonText}>How it works.</Text>
      </Pressable>

      {/* TODO: UPLOAD PIPELINE */}
      <Pressable style={styles.primaryButton} onPress={() => router.push("/analyzing")}>
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
        </svg>
        <Text style={styles.primaryButtonText}>Upload Image/Video</Text>
      </Pressable>

      {/* TODO: CAMERA PIPELINE */}
      <Pressable style={styles.primaryButton} onPress={() => router.push("/capture")}>
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" viewBox="0 0 16 16">
          <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
          <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
        </svg>
        <Text style={styles.primaryButtonText}>Open Camera</Text>
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
    width:500,
    height:500,
  },

  title: {
    marginTop: -150,
    fontSize: 100,
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
    display: 'flex',
    flexDirection: 'row',
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
