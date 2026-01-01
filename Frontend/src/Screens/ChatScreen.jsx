import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from "react";
import {
  View, StyleSheet, Animated, Alert, SafeAreaView, TouchableOpacity, Text, LogBox
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { downloadModel, generateResponse, unloadModel } from "../model/model";
import { GGUF_FILE, BASE_URL } from "@env";
import { useTheme } from '../theme/ThemeContext';
import { useAgentContext } from '../context/AgentContext';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext'; 
import { useChatEngine } from '../hooks/useChatEngine';

// Components
import ChatHeader from '../Components/ChatScreen/ChatHeader';
import EmptyState from '../Components/ChatScreen/EmptyState';
import ChatInput from '../Components/ChatScreen/ChatInput';
import MessageList from '../Components/ChatScreen/MessageList';
import QuickReplies from '../Components/ChatScreen/QuickReplies';
import TypingIndicator from '../Components/ChatScreen/TypingIndicator';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Reducer for model state
const initialModelState = {
  isDownloading: false,
  progress: 0,
  isModelReady: false,
  error: null,
};

function modelReducer(state, action) {
  switch (action.type) {
    case 'START_INIT':
      return { ...state, isModelReady: false, error: null };
    case 'SET_DOWNLOADING':
      return { ...state, isDownloading: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'INIT_SUCCESS':
      return { ...state, isDownloading: false, isModelReady: true, error: null };
    case 'INIT_FAILURE':
      return { ...state, isDownloading: false, isModelReady: false, error: action.payload || "Initialization failed" };
    default:
      return state;
  }
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { context, refreshContext, initializeContext, isInitialized } = useAgentContext();

  const [modelState, dispatch] = React.useReducer(modelReducer, initialModelState);
  const { isDownloading, progress, isModelReady, error: modelError } = modelState;
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [useRAGMode, setUseRAGMode] = useState(true); 
  
  const flatListRef = useRef(null);

  const { 
    conversation, 
    isGenerating, 
    sendMessage, 
    clearConversation: baseClearConversation 
  } = useChatEngine(isInitialized, context, refreshContext);

  // Wrap clear for UI confirmation
  const clearConversation = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: baseClearConversation }
      ]
    );
  };
  
  const initModel = React.useCallback(async () => {
    try {
      if (isDownloading) return; // Prevention suggested in review
      dispatch({ type: 'START_INIT' });
      dispatch({ type: 'SET_DOWNLOADING', payload: true });
      dispatch({ type: 'SET_PROGRESS', payload: 0 });

      const success = await downloadModel(GGUF_FILE, (p) => {
        dispatch({ type: 'SET_PROGRESS', payload: p });
      });
      
      dispatch({ type: 'SET_DOWNLOADING', payload: false });
      
      if (success) {
        dispatch({ type: 'INIT_SUCCESS' });
      } else {
         dispatch({ type: 'INIT_FAILURE', payload: "Failed to load model." });
      }

    } catch (error) {
      console.error(error);
      dispatch({ type: 'INIT_FAILURE', payload: error.message });
    }
  }, [isDownloading]);

  useEffect(() => {
    initModel();
    // Cleanup on unmount
    return () => {
      unloadModel();
    };
  }, []); // Only run on mount, but returns cleanup


  // handleSendMessage now focuses on UI-side effects after core logic runs in the hook
  const handleSendMessage = async (content = null) => {
    const textToSend = (typeof content === 'string') ? content : userInput;
    if (!textToSend?.trim()) return;

    setUserInput("");

    // Message sending and core logic handled by hook
    const result = await sendMessage(textToSend, useRAGMode, initializeContext);

    // Secondary UI effects (navigation, SOS, etc) remain in the screen
    if (result && typeof result === 'object') {
      // Handle navigation commands
      if (result.action === 'navigate' && result.screen) {
        setTimeout(() => navigation.navigate(result.screen), 500);
      }

      // Handle logout
      if (result.action === 'logout') {
        setTimeout(() => {
          navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          }));
        }, 1500);
      }

      // Handle emergency
      if (result.emergency) {
        setTimeout(() => navigation.navigate('SOSAlert'), 500);
      }

      // Refresh data context if needed
      if (result.success) {
        await refreshContext();
      }
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
        case 'time': 
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
          onScrollPositionChange={setShowScrollToBottom}
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
        modelError={modelError}
        onRetryModel={initModel}
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
