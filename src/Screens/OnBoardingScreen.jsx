import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    title: "Baby",
    highlight: "Nest",
    description:
      "Welcome to Baby Nest, your AI-Powered trusted partner for a safe and healthy pregnancy journey.",
    image: require("../assets/onboarding1.png"),
  },
  {
    id: "2",
    title: "Tracking",
    highlight: "Tools",
    description:
      "The app will provide tracking tools to help users monitor their pregnancy and postpartum progress.",
    image: require("../assets/onboarding2.png"),
  },
  {
    id: "3",
    title: "AI",
    highlight: "Assistant",
    description:
      "Our intelligent assistant provides personalized resources, including articles, timelines, to support you through every stage of pregnancy and beyond",
    image: require("../assets/onboarding3.png"),
  }
];

export default function OnBoardingScreen() {
  const navigation = useNavigation();
  const flatListRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate("BasicDetails");
    }
  };

  const handleSkip = () => {
    navigation.navigate("BasicDetails");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}> 
            <Text style={styles.title}>
              {item.title} <Text style={styles.highlight}>{item.highlight}</Text>
            </Text>
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <View style={styles.paginationContainer}>
              {onboardingData.map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentIndex ? "#ff4081" : "#ddd",
                      width: index === currentIndex ? 12 : 8,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextButton, currentIndex === onboardingData.length - 1 && styles.getStartedButton]}
        >
          <Text style={[styles.nextText, currentIndex === onboardingData.length - 1 && styles.getStartedText]}>
            {currentIndex === onboardingData.length - 1 ? "GET STARTED" : "NEXT"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginBottom: 10,
  },
  highlight: {
    color: "#ff4081",
  },
  image: {
    width: "80%",
    height: 300,
    marginBottom: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 15,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    position: "absolute",
    bottom: 40,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
  },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: "#ff4081",
    borderRadius: 20,
  },
  nextText: {
    fontSize: 16,
    color: "#ff4081",
    fontWeight: "bold",
  },
  getStartedText: {
    color: "#fff",
  },
});
