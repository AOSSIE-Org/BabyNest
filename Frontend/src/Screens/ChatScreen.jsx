import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Animated, Alert, ActivityIndicator, Keyboard,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  SafeAreaView
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { fetchAvailableGGUFs, downloadModel, generateResponse } from "../model/model";
import { GGUF_FILE } from "@env";
import Markdown from "react-native-markdown-display";

export default function ChatScreen() {
  const navigation = useNavigation();
  const [conversation, setConversation] = useState([]);
  const [availableGGUFs, setAvailableGGUFs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userInput, setUserInput] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Fetching available GGUFs...");
        const files = await fetchAvailableGGUFs();
        setAvailableGGUFs(files);

        if (files.includes(GGUF_FILE)) {
          console.log(`Found model ${GGUF_FILE}, downloading...`);
          setIsDownloading(true);
          setProgress(0);

          await downloadModel(GGUF_FILE, setProgress);
          setIsDownloading(false);

          console.log("Model downloaded successfully!");
        } else {
          console.warn("Model file not found in Hugging Face repo.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load model: " + error.message);
        console.error(error);
      }
    };
    loadModel();
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      Alert.alert("Input Error", "Please enter a message.");
      return;
    }

    const userMessage = { id: Date.now().toString(), role: "user", content: userInput };
    const updatedConversation = [...conversation, userMessage];

    setConversation(updatedConversation);
    setUserInput("");
    setIsGenerating(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);


    try {
        const botMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
        setConversation([...updatedConversation, botMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Stream response
        for await (const chunk of generateResponse(updatedConversation)) {
          setConversation((prevConversation) =>
          prevConversation.map((msg) =>
          msg.id === botMessage.id ? { ...msg, content: msg.content + chunk } : msg
        ))}

        if (!showScrollToBottom) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
    } catch (error) {
      Alert.alert("Error", "Failed to generate response: " + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (message) => {
    Clipboard.setString(message);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    setUserInput(text);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with BabyNest AI</Text>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={conversation}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleCopyMessage(item.content)}>
            <View style={[styles.messageContainer, item.role === "user" ? styles.userMessage : styles.botMessage]}>
              {item.role === "assistant" ? (
                <Markdown style={markdownStyles}>{item.content}</Markdown>
              ) : (
                <Text style={styles.messageText}>{item.content}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chatArea}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const isBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          setShowScrollToBottom(!isBottom);
        }}
      />

      {/* Floating Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
          <Icon name="keyboard-arrow-down" size={30} color="black" />
        </TouchableOpacity>
      )}

      {/* Typing Indicator */}
      {isGenerating && (
        <View style={[styles.messageContainer, styles.botMessage]}>
          <TypingIndicator />
        </View>
      )}

      {/* Input Field */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            scrollEnabled
            value={userInput}
            onChangeText={setUserInput}
            onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
          />
          <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
            <Icon name="content-paste" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={isGenerating}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

}

// Typing Indicator (Minimalist Dots Animation)
const TypingIndicator = () => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4081",
    padding: 15,
    elevation: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  chatArea: {
    flexGrow: 1,
    padding: 10,
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#F36196",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    borderRadius: 25,
    backgroundColor: "#f8f8f8",
  },
  pasteButton: {
    marginHorizontal: 5,
    backgroundColor: "#ff4081",
    padding: 10,
    borderRadius: 25,
  },
  sendButton: {
    backgroundColor: "#ff4081",
    padding: 10,
    borderRadius: 25,
  },
  typingContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#888",
    marginHorizontal: 2,
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 40,
    right: '45%',
    backgroundColor: "white",
    padding: 5,
    borderRadius: 30,
    elevation: 5,
    zIndex:1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const markdownStyles = {
  body: { 
    color: "#333", 
    fontSize: 16 
  },
  strong: { 
    fontWeight: "bold" 
  },
  em: { 
    fontStyle: "italic" 
  },
  blockquote: { 
    backgroundColor: "#f1f1f1", 
    padding: 5, 
    borderLeftWidth: 3, 
    borderLeftColor: "#ccc" 
  },
  code_block: { 
    backgroundColor: "#eee", 
    padding: 10, 
    borderRadius: 5, 
    fontFamily: "monospace" 
  },
  link: { 
    color: "#ff4081", 
    textDecorationLine: "underline" 
  },
  list_item: { 
    marginVertical: 5 
  },
};