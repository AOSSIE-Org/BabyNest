import React, { useRef, useState , useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {BASE_URL} from "@env";

const { width:initialWidth, height: initialHeight } = Dimensions.get("window");
const scale = size =>(initialWidth / 375) * size;
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

  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });

  const check = async () =>{
    try{
      const res = await fetch(`${BASE_URL}/get_profile`);
      const data = await res.json();
      return !data.error
    }
    catch(err){
      console.error("Error fetching profile data:", err);
      return false;
    }
  }

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height
      });
    });

    const init = async () => {
      const hasProfile = await check();
      if (hasProfile) {
        navigation.replace("MainTabs");
      }
    };
  
    init();
      
    return () => subscription?.remove();
  }, []);
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

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({
            length: dimensions.width,
            offset: dimensions.width * index,
            index,
          })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: dimensions.width}]}> 
            <Text style={styles.title}>
              {item.title} <Text style={styles.highlight}>{item.highlight}</Text>
            </Text>
            <Image source={item.image} style={[
                  styles.image,
                  {
                    width: dimensions.width * 0.8,
                    height: Math.min(dimensions.height * 0.4, scale(300)),
                  }
                ]} 
                resizeMode="contain" 
                />
            <View style={styles.paginationContainer}>
              {onboardingData.map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentIndex ? "#ff4081" : "#ddd",
                      width: index === currentIndex ? scale(12) : scale(8),
                      height: scale(8),
                      borderRadius: scale(4),
                      marginHorizontal: scale(4),
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.description,{ width: dimensions.width * 0.85 }]}>
            {item.description}
            </Text>
          </View>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={[
        styles.buttonContainer,
        {
            bottom: Platform.OS === 'ios' ? scale(40) : scale(30),
            paddingHorizontal: dimensions.width * 0.05
          }
          ]}>
        <TouchableOpacity onPress={handleSkip}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop:scale(90),
  },
  title: {
    fontSize: scale(26),
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginBottom: scale(15),
    paddingHorizontal: scale(10),
  },
  highlight: {
    color: "#ff4081",
  },
  image: {
    marginVertical: scale(15),
  },
  paginationContainer: {
    flexDirection: "row",
    marginBottom: scale(15),
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  description: {
    fontSize: scale(14),
    textAlign: "center",
    color: "#666",
    paddingHorizontal: scale(15),
    marginTop: scale(15),
    lineHeight: scale(20),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: scale(20),
    width: "100%",
    paddingHorizontal: scale(20),
  },
  skipText: {
    fontSize: scale(16),
    color: "#666",
  },
  nextButton: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  getStartedButton: {
    backgroundColor: "#ff4081",
    borderRadius: scale(20),
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  nextText: {
    fontSize:scale(16),
    color: "#ff4081",
    fontWeight: "bold",
  },
  getStartedText: {
    color: "#fff",
  },
});
