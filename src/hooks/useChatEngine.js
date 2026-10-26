import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateResponse } from '../model/model';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext';

export const useChatEngine = (isInitialized, context, refreshContext) => {
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const cancellationRef = useRef(0);

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
  const saveChats = useCallback(async (newConversation) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(newConversation));
    } catch (error) {
      console.error("Failed to save chats", error);
    }
  }, []);

  const generateID = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const clearConversation = useCallback(async () => {
    cancellationRef.current += 1; // Block pending responses
    setConversation([]);
    conversationContext.clearConversationHistory();
    await saveChats([]);
  }, [saveChats]);

  const sendMessage = useCallback(async (text, useRAGMode, initializeContext) => {
    if (!text || !text.trim()) return;

    const cancellationId = cancellationRef.current;

    // Load the context for every message, since the data may have changed on
    // another screen while the chat stayed open. It comes from an in-memory
    // cache that is cleared on every change, so this is cheap. If it can't be
    // loaded, send an empty context rather than the older one.
    let latestContext = {};
    try {
      latestContext = (await initializeContext()) ?? {};
    } catch (error) {
      console.warn('Failed to load context:', error);
    }

    // Don't send the message if the conversation was cleared meanwhile.
    if (cancellationId !== cancellationRef.current) {
      return;
    }

    const formatTime = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const userMessage = { 
      id: generateID(), 
      role: "user", 
      content: text,
      timestamp: formatTime()
    };

    // Add message to conversation context immediately
    conversationContext.addMessage('user', text);
    setIsGenerating(true);

    // We use functional update to ensure we always have the latest state, 
    // even if clearConversation was called just before this.
    setConversation(prev => {
      const newHistory = [...prev, userMessage];
      saveChats(newHistory);
      return newHistory;
    });

    try {
      let response = null;
      let result = null;

      // Prepare the history for the model. 
      // Important: We use the most recent history available in this render cycle plus the new message.
      const updatedConversationForModel = [...conversation, userMessage];

      conversationContext.setUserContext(latestContext);

      if (useRAGMode) {
        if (conversationContext.hasPendingFollowUp()) {
          if (__DEV__) console.log('🤖 Processing follow-up response with RAG...');
          result = await conversationContext.processFollowUpResponse(text, ragService);
        } else {
          if (__DEV__) console.log('🤖 Processing new query with RAG...');
          result = await ragService.processQuery(text, latestContext);
        }
      } else {
        if (__DEV__) console.log('📞 Processing with local model...');
        const startTime = Date.now();
        response = await generateResponse(updatedConversationForModel);
        if (__DEV__) {
            const endTime = Date.now();
            console.log(`⏱️ Model Response Latency: ${endTime - startTime}ms`);
        }
        
        result = { message: response, intent: 'general_chat', action: null };
      }

      // Handle RAG Result
      if (result && typeof result === 'object') {
        response = result.message;

        if (
          result.requiresFollowUp &&
          result.intent &&
          result.partialData &&
          result.missingFields
        ) {
          conversationContext.setPendingFollowUp(
            result.intent,
            result.partialData,
            result.missingFields,
          );
        } else {
          conversationContext.clearPendingFollowUp();
        }
      } else {
        // Fallback to backend agent
          if (__DEV__) {
            console.warn(
              '⚠️ Invalid result from RAG/local processing. Falling back to local model.',
            );
          }

          try {
            const startTime = Date.now();

            response = await generateResponse(updatedConversationForModel);

            if (__DEV__) {
              console.log(
                `⏱️ Local Model Fallback Latency: ${Date.now() - startTime}ms`,
              );
            }
          } catch (error) {
            console.error('❌ Local model fallback failed:', error);

            response = "I'm sorry, I couldn't process your request right now.";
          }
      }

      // 🛡️ Cancellation Guard: If the conversation was cleared while thinking, discard the response.
      if (cancellationId !== cancellationRef.current) {
        if (__DEV__) console.log('🚫 AI response blocked: Conversation was cleared.');
        return;
      }

      if (response || result.metric) {
        const botMessage = {
          id: generateID(),
          role: "assistant",
          content: result.metric ? result : response,
          timestamp: formatTime()
        };
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
  }, [saveChats, conversation]); // conversation added as dependency to avoid stale closure

  return {
    conversation,
    isGenerating,
    sendMessage,
    clearConversation
  };
};
