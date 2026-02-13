import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/MaterialIcons";
import { generateResponse } from "../model/model";
import { BASE_URL } from "@env";
import Markdown from "react-native-markdown-display";
import { useTheme } from '../theme/ThemeContext';
import { useAgentContext } from '../context/AgentContext';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext'; 

// FIXED: Added full URL validation as requested by bot
const validateBaseUrl = (url) => {
  if (!url) return 'http://127.0.0.1:5000';
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('http') ? url : 'http://127.0.0.1:5000';
  } catch {
    return 'http://127.0.0.1:5000';
  }
};
const VALID_BASE_URL = validateBaseUrl(BASE_URL);

export default function ChatScreen() {
  const { theme } = useTheme();
  const { context, refreshContext, initializeContext, isInitialized } = useAgentContext();
  
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [userId, setUserId] = useState("default");
  const flatListRef = useRef(null);

  // FIXED: Load or generate a persistent Unique User ID for privacy
  useEffect(() => {
    const getPersistentId = async () => {
      try {
        let id = await AsyncStorage.getItem('user_device_id');
        if (!id) {
          id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('user_device_id', id);
        }
        setUserId(id);
      } catch (e) { console.warn('ID retrieval failed'); }
    };
    getPersistentId();
  }, []);

  const callBackendAgent = async (query, timeoutMs = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(`${VALID_BASE_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: userId }), // FIXED: Dynamic ID
        signal: controller.signal,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
      return null;
    } catch (e) {
      if (e.name === 'AbortError') throw e; 
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;
    
    if (trimmedInput.length > 1000) {
      Alert.alert("Input Too Long", "Message must be under 1000 characters.");
      return;
    }

    if (!isInitialized) {
      try { await initializeContext(); } catch (err) { console.warn(err); }
    }

    // FIXED: Added entropy to message IDs to prevent collisions
    const userMessage = { 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, 
      role: "user", 
      content: trimmedInput 
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput("");
    setIsGenerating(true);
    conversationContext.addMessage('user', trimmedInput);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let response = await callBackendAgent(trimmedInput);

      // FIXED: Added a simple retry mechanism for transient failures
      if (!response) {
        await new Promise(res => setTimeout(res, 1000));
        response = await callBackendAgent(trimmedInput, 15000);
      }

      if (!response) {
        if (!ragService.isInitialized) await ragService.initialize();
        const result = await ragService.processQuery(trimmedInput, context);
        response = result?.message || await generateResponse([...conversation, userMessage]);
      }

      if (response) {
        const botMessage = { id: `${Date.now()}-bot`, role: "assistant", content: response };
        setConversation(prev => [...prev, botMessage]);
        conversationContext.addMessage('assistant', response);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        
        try {
          await refreshContext();
        } catch (refreshErr) {
          console.warn('Context refresh failed:', refreshErr.message);
        }
      } else {
        Alert.alert("Response Error", "Unable to generate a response. Please try again.");
      }
    } catch (error) { 
      const message = error.name === 'AbortError' 
        ? "Request timed out. Please try again."
        : "Something went wrong. Please check your connection.";
      Alert.alert("Chat Error", message); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header,{ backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle,{ color: "#fff" }]}>Chat with BabyNest AI</Text>
      </View>
      
      <FlatList 
        ref={flatListRef} 
        data={conversation} 
        keyExtractor={(item) => item.id} 
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.role === "user" ? [styles.userMessage , { backgroundColor: theme.primary }]: [styles.botMessage,{ backgroundColor: theme.factcardprimary }]]}>
            {item.role === "assistant" ? (
              <Markdown style={{ body: { color: theme.text } }}>{item.content}</Markdown>
            ) : (
              <Text style={{ color: "#fff" }}>{item.content}</Text>
            )}
          </View>
        )} 
        contentContainerStyle={styles.chatArea} 
      />
      
      {isGenerating && <View style={styles.typingIndicator}><Text style={{color: theme.text}}>BabyNest is typing...</Text></View>}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.factcardsecondary, color: theme.text }]} 
            placeholder="Type..." 
            value={userInput} 
            onChangeText={setUserInput} 
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: theme.button }]} 
            onPress={handleSendMessage} 
            disabled={isGenerating}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 15, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  chatArea: { padding: 10 },
  messageContainer: { maxWidth: "80%", padding: 12, marginVertical: 5, borderRadius: 15 },
  userMessage: { alignSelf: "flex-end" },
  botMessage: { alignSelf: "flex-start" },
  inputContainer: { flexDirection: "row", padding: 10, alignItems: "center" },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, height: 40 },
  sendButton: { marginLeft: 10, padding: 8, borderRadius: 20 },
  typingIndicator: { padding: 10, marginLeft: 10 }
});