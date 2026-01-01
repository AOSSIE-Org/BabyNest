import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateResponse } from '../model/model';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext';
import { BASE_URL } from "@env";

export const useChatEngine = (isInitialized, context, refreshContext) => {
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chat_history');
        if (storedChats) {
          const parsedChats = JSON.parse(storedChats);
          if (Array.isArray(parsedChats)) {
            setConversation(parsedChats);
            // Hydrate context
            parsedChats.forEach(msg => {
              if (msg?.role && msg?.content) {
                conversationContext.addMessage(msg.role, msg.content);
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to load chats", error);
      }
    };
    loadChats();
  }, []);

  // Sync to storage
  const saveChats = async (newConversation) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(newConversation));
    } catch (error) {
      console.error("Failed to save chats", error);
    }
  };

  const clearConversation = useCallback(() => {
    setConversation([]);
    saveChats([]);
    conversationContext.clearConversationHistory();
  }, []);

  const sendMessage = async (text, useRAGMode, initializeContext) => {
    if (!text || !text.trim()) return;

    // Ensure context is initialized
    if (!isInitialized) {
      try {
        await initializeContext();
      } catch (error) {
        console.warn('Failed to initialize context:', error);
      }
    }

    const userMessage = { id: Date.now().toString(), role: "user", content: text };
    const updatedConversation = [...conversation, userMessage];
    
    setConversation(updatedConversation);
    saveChats(updatedConversation);
    setIsGenerating(true);
    
    conversationContext.addMessage('user', text);

    try {
      let response = null;
      let result = null;

      await ragService.initialize();
      conversationContext.setUserContext(context);

      if (useRAGMode) {
        if (conversationContext.hasPendingFollowUp()) {
          console.log('🤖 Processing follow-up response with RAG...');
          result = await conversationContext.processFollowUpResponse(text, ragService);
        } else {
          console.log('🤖 Processing new query with RAG...');
          result = await ragService.processQuery(text, context);
        }
      } else {
        console.log('📞 Processing with local model...');
        const startTime = Date.now();
        response = await generateResponse(updatedConversation);
        const endTime = Date.now();
        console.log(`⏱️ Model Response Latency: ${endTime - startTime}ms`);
        
        result = { message: response, intent: 'general_chat', action: null };
      }

      // Handle RAG Result
      if (result && typeof result === 'object') {
        response = result.message;

        if (result.requiresFollowUp && result.intent && result.partialData && result.missingFields) {
          conversationContext.setPendingFollowUp(
            result.intent,
            result.partialData,
            result.missingFields
          );
        } else {
          conversationContext.clearPendingFollowUp();
        }

        // Return result for UI-side effects (navigation, etc)
        // Note: Actual navigation should be handled by the component
      } else {
        // Fallback to backend agent
        try {
          const agentResponse = await fetch(`${BASE_URL}/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text, user_id: "default" }),
          });
          
          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            response = agentData.response;
          } else {
            throw new Error('Backend agent failed');
          }
        } catch (backendError) {
          console.warn('Backend fallback failed, using local model:', backendError.message);
          response = await generateResponse(updatedConversation);
        }
      }

      if (response) {
        const botMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
        const newHistory = [...updatedConversation, botMessage];
        setConversation(newHistory);
        saveChats(newHistory);
        conversationContext.addMessage('assistant', response);
      }

      return result; // Return result for secondary effects in screen

    } catch (error) {
      Alert.alert("Error", "Failed to generate response: " + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    conversation,
    isGenerating,
    sendMessage,
    clearConversation
  };
};
