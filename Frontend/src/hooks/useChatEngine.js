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

  const sendMessage = useCallback(async (text, useRAGMode, initializeContext) => {
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
    
    // Add message to conversation context immediately
    conversationContext.addMessage('user', text);
    setIsGenerating(true);

    let currentConversation;
    setConversation(prev => {
      currentConversation = [...prev, userMessage];
      saveChats(currentConversation);
      return currentConversation;
    });

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
        response = await generateResponse(currentConversation);
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
      } else {
        // Fallback to backend agent
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
          const agentResponse = await fetch(`${BASE_URL}/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text, user_id: "default" }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            response = agentData.response;
          } else {
            throw new Error('Backend agent failed');
          }
        } catch (backendError) {
          clearTimeout(timeoutId);
          console.warn('Backend fallback failed or timed out, using local model:', backendError.message);
          response = await generateResponse(currentConversation);
        }
      }

      if (response) {
        const botMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
        setConversation(prev => {
          const newHistory = [...prev, botMessage];
          saveChats(newHistory);
          return newHistory;
        });
        conversationContext.addMessage('assistant', response);
      }

      return result;

    } catch (error) {
      Alert.alert("Error", "Failed to generate response: " + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized, context, saveChats]);

  return {
    conversation,
    isGenerating,
    sendMessage,
    clearConversation
  };
};
