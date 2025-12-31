import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from "react";
import {
  View, StyleSheet, Animated, Alert, SafeAreaView, TouchableOpacity, Text, LogBox
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { fetchAvailableGGUFs, downloadModel, generateResponse } from "../model/model";
import { GGUF_FILE, BASE_URL } from "@env";
import { useTheme } from '../theme/ThemeContext';
import { useAgentContext } from '../context/AgentContext';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext'; 


// Components
import ChatHeader from '../Components/ChatScreen/ChatHeader';
import EmptyState from '../Components/ChatScreen/EmptyState';
import ChatInput from '../Components/ChatScreen/ChatInput';
import MessageList from '../Components/ChatScreen/MessageList';
import QuickReplies from '../Components/ChatScreen/QuickReplies';
import TypingIndicator from '../Components/ChatScreen/TypingIndicator';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { context, refreshContext, initializeContext, isInitialized } = useAgentContext();

  const [conversation, setConversation] = useState([]);
  const [availableGGUFs, setAvailableGGUFs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [useRAGMode, setUseRAGMode] = useState(true); 
  
  const flatListRef = useRef(null);

  const [isModelReady, setIsModelReady] = useState(false);
  


  // Clear conversation
  const clearConversation = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setConversation([]);
            saveChats([]); // Clear from storage
            setUserInput("");
            conversationContext.clearConversationHistory();
          }
        }
      ]
    );
  };
  
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chat_history');
        if (storedChats) {
          const parsedChats = JSON.parse(storedChats);
          setConversation(parsedChats);
          
          // Hydrate conversation context for memory
          parsedChats.forEach(msg => {
            conversationContext.addMessage(msg.role, msg.content);
          });
        }
      } catch (error) {
        console.error("Failed to load chats", error);
      }
    };
    loadChats();
  }, []);

  // Helper to save chats
  const saveChats = async (newConversation) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(newConversation));
    } catch (error) {
      console.error("Failed to save chats", error);
    }
  };
  
  useEffect(() => {
    const initModel = async () => {
      try {
        setIsModelReady(false);
        // Direct initialization - downloadModel handles local check internally
        console.log(`Initializing model ${GGUF_FILE}...`);
        
        // We set downloading true just in case it needs to download, 
        // but if it's local it will clear quickly.
        // Ideally downloadModel could return 'loaded_from_cache' but boolean is fine.
        setIsDownloading(true);
        setProgress(0);

        const success = await downloadModel(GGUF_FILE, setProgress);
        setIsDownloading(false);
        
        if (success) {
          setIsModelReady(true);
          console.log("Model initialized successfully!");
        } else {
           console.warn("Model initialization failed.");
        }

      } catch (error) {
        Alert.alert("Error", "Failed to init model: " + error.message);
        console.error(error);
        setIsDownloading(false);
      }
    };
    initModel();
  }, []);


  // Modified to optionally accept content directly (for auto-send)
  const handleSendMessage = async (content = null) => {
    // Ensure content is a string (ignore event objects from UI presses)
    const validContent = (typeof content === 'string') ? content : null;
    const textToSend = validContent || userInput;
    
    if (!textToSend || !textToSend.trim()) {
      Alert.alert("Input Error", "Please enter a message.");
      return;
    }

    // Initialize context if not already done
    if (!isInitialized) {
      try {
        await initializeContext();
      } catch (error) {
        console.warn('Failed to initialize context:', error);
      }
    }

    const userMessage = { id: Date.now().toString(), role: "user", content: textToSend };
    const updatedConversation = [...conversation, userMessage];

    setConversation(updatedConversation);
    saveChats(updatedConversation); // Save user message
    
    // Clear input
    setUserInput("");  
    
    setIsGenerating(true);

    // Add message to conversation context
    conversationContext.addMessage('user', textToSend);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let response = null;
      let result = null;

      // Initialize RAG service
      await ragService.initialize();
      
      // Set user context
      conversationContext.setUserContext(context);

      // Check toggle mode first
      if (useRAGMode) {
        // RAG Mode (Robot) - Process structured commands
        if (conversationContext.hasPendingFollowUp()) {
          console.log('🤖 Processing follow-up response with RAG...');
          result = await conversationContext.processFollowUpResponse(textToSend, ragService);
        } else {
          console.log('🤖 Processing new query with RAG...');
          result = await ragService.processQuery(textToSend, context);
        }
      } else {
        // Model Mode (Phone) - Use backend model for general chat
        console.log('📞 Processing with backend model...');
        response = await generateResponse(updatedConversation);
        result = {
          message: response,
          intent: 'general_chat',
          action: null
        };
      }

      // 🔍 DEBUGGING: Log result before processing
      console.log('🔍 Result processing debug:', {
        result: result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'N/A',
        hasMessage: result && result.message !== undefined,
        hasIntent: result && result.intent !== undefined,
        hasPartialData: result && result.partialData !== undefined
      });
      
      // Additional debugging for undefined errors
      if (!result) {
        console.error('❌ RESULT IS NULL/UNDEFINED!');
        console.error('User input:', userInput);
        console.error('Context:', context);
      }

      if (result && typeof result === 'object') {
        response = result.message;

        // Handle follow-up context with safety checks
        if (result.requiresFollowUp && result.intent && result.partialData && result.missingFields) {
          conversationContext.setPendingFollowUp(
            result.intent,
            result.partialData,
            result.missingFields
          );
        } else {
          conversationContext.clearPendingFollowUp();
        }

        // Handle navigation commands
        if (result.action === 'navigate' && result.screen) {
          console.log('🧭 Navigation Debug:', {
            action: result.action,
            screen: result.screen,
            screenType: typeof result.screen,
            resultObject: result
          });
          setTimeout(() => {
            navigation.navigate(result.screen);
          }, 1000);
        }

        // Handle logout commands
        if (result.action === 'logout') {
          setTimeout(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              })
            );
          }, 1500);
        }

        // Handle emergency commands
        if (result.emergency) {
          setTimeout(() => {
            navigation.navigate('SOSAlert');
          }, 500);
        }
          
          // Refresh context after successful command execution
        if (result.success) {
            await refreshContext();
          }
        } else {
        // Fallback to general chat if RAG doesn't understand
        try {
          const agentResponse = await fetch(`${BASE_URL}/agent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: userInput,
              user_id: "default"
            }),
          });
          
          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            response = agentData.response;
          } else {
            throw new Error('Backend agent request failed');
          }
        } catch (backendError) {
          console.warn('Backend agent failed, falling back to local model:', backendError.message);
          // Fallback to local model if backend is unavailable
          response = await generateResponse(updatedConversation);
        }
      }
      
      if (response) {
        const botMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
        const newHistory = [...updatedConversation, botMessage];
        setConversation(newHistory);
        saveChats(newHistory); // Save bot response
        
        // Add bot response to conversation context
        conversationContext.addMessage('assistant', response);

        
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
    handleInputChange(text);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  // Get quick replies based on pending follow-up context
  const getQuickReplies = () => {
    if (!conversationContext.hasPendingFollowUp()) return [];
    
    const pendingFollowUp = conversationContext.pendingFollowUp;
    const missingFields = pendingFollowUp?.missingFields || [];
    
    let replies = [];
    
    // Generate quick replies based on missing fields
    missingFields.forEach(field => {
      switch (field) {
        case 'time': // Add generic time
        case 'appointment_time':
          replies.push('Morning', 'Afternoon', 'Evening', '9:00 AM', '2:00 PM');
          break;
        
        case 'name':
        case 'medicine_name':
          replies.push('Paracetamol', 'Iron', 'Folic Acid', 'Calcium');
          break;
        case 'mood':
          replies.push('Happy', 'Anxious', 'Calm', 'Tired');
          break;
        case 'intensity':
          replies.push('Low', 'Medium', 'High');
          break;
        case 'duration':
          replies.push('8 hours', '7 hours', '6 hours', '9 hours');
          break;
        case 'quality':
          replies.push('Excellent', 'Good', 'Fair', 'Poor');
          break;
        case 'weight':
          replies.push('65kg', '70kg', '60kg', '75kg');
          break;
        case 'location':
          replies.push('Delhi', 'City Hospital', 'Home', 'Clinic');
          break;
        case 'title':
          replies.push('Checkup', 'Ultrasound', 'Blood Test', 'Consultation');
          break;
        case 'metric':
          replies.push('Weight', 'Sleep', 'Mood', 'Symptoms');
          break;
        case 'timeframe':
          replies.push('This week', 'This month', 'Today', 'All time');
          break;
        case 'action_type':
          replies.push('Last', 'Weight', 'Appointment', 'Sleep');
          break;
        case 'medicine_name':
          replies.push('Paracetamol', 'Iron', 'Folic Acid', 'Calcium');
          break;
        case 'frequency':
          replies.push('Twice daily', 'Once daily', 'As needed', 'Three times');
          break;
        case 'dose':
          replies.push('500mg', '1 tablet', '2 tablets', '1 spoon');
          break;
        case 'start_date':
          replies.push('Today', 'Tomorrow', 'Last week', 'This month');
          break;
        case 'end_date':
          replies.push('Next week', 'This month', 'When better', 'Continue');
          break;
        case 'systolic':
          replies.push('120', '110', '130', '140');
          break;
        case 'diastolic':
          replies.push('80', '70', '90', '85');
          break;
        case 'pressure_reading':
          replies.push('120/80', '110/70', '130/85', '140/90');
          break;
        case 'discharge_type':
          replies.push('Normal', 'Spotting', 'Bleeding', 'Heavy');
          break;
        case 'symptom':
          replies.push('Nausea', 'Headache', 'Dizziness', 'Fatigue');
          break;
        case 'date':
        case 'update_date':
          replies.push('Today', 'Tomorrow', 'Day after tomorrow');
          break;
        case 'update_time':
          replies.push('Morning', 'Afternoon', 'Evening', 'Night');
          break;
      }
    });
    
    // Remove duplicates and limit to 4 replies
    return [...new Set(replies)].slice(0, 4);
  };

  const handleQuickReply = (reply) => {
    setUserInput(reply);
  };

  const handleInputChange = (text) => {
    setUserInput(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader 
        navigation={navigation}
        useRAGMode={useRAGMode}
        setUseRAGMode={setUseRAGMode}
        clearConversation={clearConversation}
        conversationLength={conversation.length}
      />

      {conversation.length === 0 ? (
        <EmptyState handleQuickReply={handleQuickReply} useRAGMode={useRAGMode} />
      ) : (
        <MessageList 
          conversation={conversation}
          flatListRef={flatListRef}
          theme={theme}
          footer={
            isGenerating ? (
              <View style={styles.typingContainer}>
                <TypingIndicator />
              </View>
            ) : null
          }
        />
      )}



      {showScrollToBottom && (
        <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
          <Icon name="keyboard-arrow-down" size={30} color="#333" />
        </TouchableOpacity>
      )}

      {conversationContext.hasPendingFollowUp() && !isGenerating && (
        <QuickReplies 
          replies={getQuickReplies()}
          handleQuickReply={handleQuickReply}
        />
      )}

      <ChatInput 
        userInput={userInput}
        setUserInput={handleInputChange}
        handleSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        isModelReady={isModelReady}
        useRAGMode={useRAGMode}
        handlePaste={handlePaste}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F8", // Keep app theme background
  },
  typingContainer: {
    paddingLeft: 10, // Match message padding roughly
    marginBottom: 20,
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
