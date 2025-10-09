import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Animated, Alert, ActivityIndicator, Keyboard,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  SafeAreaView, Vibration
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { fetchAvailableGGUFs, downloadModel, generateResponse } from "../model/model";
import { GGUF_FILE, BASE_URL } from "@env";
import Markdown from "react-native-markdown-display";
import { useTheme } from '../theme/ThemeContext';
import { useAgentContext } from '../context/AgentContext';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext'; 
export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { context, refreshContext, initializeContext, isInitialized } = useAgentContext();

  // Toggle command examples with animation
  const toggleCommandExamples = () => {
    const toValue = showCommandExamples ? 0 : 1;
    setShowCommandExamples(!showCommandExamples);
    
    Animated.timing(commandExamplesHeight, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Toggle between RAG and Model mode
  const toggleMode = () => {
    setUseRAGMode(!useRAGMode);
  };

  // Clear conversation with cool animation
  const clearConversation = () => {
    // Add immediate haptic feedback for button press
    
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Start the cool delete animation sequence
            const animationSequence = Animated.sequence([
              // Step 1: Fade out conversation
              Animated.timing(conversationOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              // Step 2: Bin lid opening animation
              Animated.timing(deleteAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              // Step 3: Bin lid closing animation
              Animated.timing(deleteAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              // Step 4: Reset conversation opacity
              Animated.timing(conversationOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]);

            animationSequence.start(() => {
              // Clear the conversation after animation
              setConversation([]);
              setUserInput("");
              // Reset command examples to collapsed state
              setShowCommandExamples(false);
              commandExamplesHeight.setValue(0);
              // Clear any pending follow-up context
              conversationContext.clearConversationHistory();
            });
          }
        }
      ]
    );
  };
  const [conversation, setConversation] = useState([]);
  const [availableGGUFs, setAvailableGGUFs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [showCommandExamples, setShowCommandExamples] = useState(false); // New state for command examples
  const [useRAGMode, setUseRAGMode] = useState(true); // Toggle between RAG (robot) and Model (phone) mode
  const commandExamplesHeight = useRef(new Animated.Value(0)).current; // Animated height
  const pulseAnimation = useRef(new Animated.Value(1)).current; // Pulse animation
  const deleteAnimation = useRef(new Animated.Value(0)).current; // Delete animation
  const conversationOpacity = useRef(new Animated.Value(1)).current; // Conversation fade animation
  // Removed manual toggle - agent will automatically decide based on input
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

  // Pulse animation for command examples when chat is empty
  useEffect(() => {
    if (conversation.length === 0 && !showCommandExamples) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [conversation.length, showCommandExamples]);


  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      Alert.alert("Input Error", "Please enter a message.");
      return;
    }

    // Initialize context if not already done
    if (!isInitialized) {
      try {
        await initializeContext();
      } catch (error) {
        console.warn('Failed to initialize context:', error);
        // Continue with the message even if context initialization fails
      }
    }

    const userMessage = { id: Date.now().toString(), role: "user", content: userInput };
    const updatedConversation = [...conversation, userMessage];

    setConversation(updatedConversation);
    setUserInput("");
    setIsGenerating(true);

    // Add message to conversation context
    conversationContext.addMessage('user', userInput);

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
          result = await conversationContext.processFollowUpResponse(userInput, ragService);
        } else {
          console.log('🤖 Processing new query with RAG...');
          result = await ragService.processQuery(userInput, context);
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
        setConversation([...updatedConversation, botMessage]);
        
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
    setUserInput(text);
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
          replies.push('9:00', '14:00', 'Morning', 'Afternoon');
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
        
        // Medicine quick replies
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
          replies.push('Today', 'Yesterday', 'Last week', 'This month');
          break;
        case 'end_date':
          replies.push('Next week', 'This month', 'When better', 'Continue');
          break;
        
        // Blood Pressure CRUD quick replies
        case 'systolic':
          replies.push('120', '110', '130', '140');
          break;
        case 'diastolic':
          replies.push('80', '70', '90', '85');
          break;
        case 'pressure_reading':
          replies.push('120/80', '110/70', '130/85', '140/90');
          break;
        
        // Discharge CRUD quick replies
        case 'discharge_type':
          replies.push('Normal', 'Spotting', 'Bleeding', 'Heavy');
          break;
        
        // Symptoms CRUD quick replies
        case 'symptom':
          replies.push('Nausea', 'Headache', 'Dizziness', 'Fatigue');
          break;
        
        // Common CRUD quick replies
        case 'date':
        case 'update_date':
          replies.push('Today', 'Yesterday', 'This week', 'Last week');
          break;
        case 'update_time':
          replies.push('Morning', 'Afternoon', 'Evening', 'Night');
          break;
      }
    });
    
    // Remove duplicates and limit to 4 replies
    return [...new Set(replies)].slice(0, 4);
  };

  // Handle quick reply selection
  const handleQuickReply = (reply) => {
    setUserInput(reply);
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header,{ backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.iconText || "#fff"}/>
        </TouchableOpacity>
        <Text style={[styles.headerTitle,{ color: theme.iconText || "#fff" }]}>Chat with BabyNest AI</Text>
        
        {/* Mode Toggle Button */}
        <TouchableOpacity 
          onPress={toggleMode}
          style={[
            styles.modeToggleButton,
            { 
              backgroundColor: useRAGMode 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,255,255,0.15)'
            }
          ]}
        >
          <Icon 
            name={useRAGMode ? "smart-toy" : "stay-current-portrait"} 
            size={20} 
            color={theme.iconText || "#fff"}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={clearConversation}
          style={[
            styles.deleteButton,
            { 
              backgroundColor: conversation.length === 0 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.2)',
              opacity: conversation.length === 0 ? 0.5 : 1
            }
          ]}
          disabled={conversation.length === 0}
        >
          <Animated.View
            style={{
              transform: [
                { 
                  rotate: deleteAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '15deg']
                  })
                },
                { 
                  scale: deleteAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1]
                  })
                }
              ]
            }}
          >
            <Icon 
              name="delete" 
              size={24} 
              color={conversation.length === 0 ? theme.iconText + '40' : theme.iconText || "#fff"}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Compact Command Examples - Always Visible */}
      <Animated.View
        style={{
          transform: [{ scale: conversation.length === 0 && !showCommandExamples ? pulseAnimation : 1 }]
        }}
      >
        <TouchableOpacity 
          onPress={toggleCommandExamples}
          style={[styles.commandExamplesToggle, { backgroundColor: theme.factcardprimary }]}
        >
        <View style={styles.commandExamplesHeader}>
          <Icon 
            name={showCommandExamples ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color={theme.text} 
          />
          <Text style={[styles.commandExamplesTitle, { color: theme.text }]}>
            💬 Try these commands
          </Text>
          {!showCommandExamples && (
            <Text style={[styles.commandExamplesHint, { color: theme.text }]}>
              Tap to expand
            </Text>
          )}
        </View>
        
        <Animated.View 
          style={[
            styles.commandExamplesContent,
            {
              height: commandExamplesHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200], // Adjust height as needed
              }),
              opacity: commandExamplesHeight,
            }
          ]}
        >
            <Text style={[styles.exampleText, { color: theme.text }]}>• "make an appointment at 2pm" (I'll ask for details)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "my weight is 65kg" (I'll ask for the week)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "took paracetamol" (I'll ask for dose, time, week)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "I have nausea" (I'll ask for the week)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "blood pressure 120/80" (I'll ask for the week)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "need ultrasound scan" (I'll ask for week, priority)</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "go to weight screen"</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "update my due date to June 24, 2026"</Text>
            <Text style={[styles.exampleText, { color: theme.text }]}>• "Emergency" or "Logout"</Text>
        </Animated.View>
      </TouchableOpacity>
      </Animated.View>

      {/* Chat Messages */}
      <Animated.View style={{ flex: 1, opacity: conversationOpacity }}>
      <FlatList
        ref={flatListRef}
        data={conversation}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleCopyMessage(item.content)}>
            <View style={[styles.messageContainer, item.role === "user" ? [styles.userMessage , { backgroundColor: theme.primary }]: [styles.botMessage,{ backgroundColor: theme.factcardprimary }]]}>
              {item.role === "assistant" ? (
                <Markdown style={createMarkdownStyles(theme)}>{item.content}</Markdown>
              ) : (
                <Text style={[styles.messageText, { color: item.role === "user" ? theme.iconText || "#fff" : theme.text }]}>{item.content}</Text>
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
      </Animated.View>

      {/* Floating Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity style={[styles.scrollToBottomButton,{ backgroundColor: theme.background }]} onPress={scrollToBottom}>
          <Icon name="keyboard-arrow-down" size={30} color={theme.text} />
        </TouchableOpacity>
      )}

      {/* Typing Indicator */}
      {isGenerating && (
        <View style={[styles.messageContainer, styles.botMessage,{ backgroundColor: theme.factcardprimary }]}>
          <TypingIndicator />
        </View>
      )}

      {/* Quick Reply Buttons */}
      {conversationContext.hasPendingFollowUp() && (
        <View style={styles.quickRepliesContainer}>
          <Text style={[styles.quickRepliesTitle, { color: theme.text }]}>Quick replies:</Text>
          <View style={styles.quickRepliesRow}>
            {getQuickReplies().map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickReplyButton, { backgroundColor: theme.button }]}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={[styles.quickReplyText, { color: theme.iconText || "#fff" }]}>
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Field */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : undefined}>
        <View style={[styles.inputContainer, { borderColor: theme.factcardsecondary || "#ddd" }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.factcardsecondary || "#f8f8f8",
              color: theme.text
            }]}
            placeholder={useRAGMode ? "Ask me to book appointments, track health..." : "Chat with me about anything..."}
            placeholderTextColor={theme.placeholderText}
            multiline
            scrollEnabled
            value={userInput}
            onChangeText={setUserInput}
            onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)}
          />
          <TouchableOpacity style={[styles.pasteButton, { backgroundColor: theme.button }]} onPress={handlePaste}>
            <Icon name="content-paste" size={24} color={theme.iconText || "#fff"}/>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.button }]} onPress={handleSendMessage} disabled={isGenerating}>
            <Icon name="send" size={24} color={theme.iconText || "#fff"} />
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
      <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
      <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
      <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
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
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as the back button to center the title
  },
  modeToggleButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  commandExamplesToggle: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  commandExamplesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commandExamplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  commandExamplesHint: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  commandExamplesContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
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
  quickRepliesContainer: {
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#6c757d",
  },
  quickRepliesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});

const createMarkdownStyles =(theme)=>( {
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
    backgroundColor:  theme.factcardsecondary ,
    padding: 5, 
    borderLeftWidth: 3, 
    borderLeftColor: "#ccc" 
  },
  code_block: { 
    backgroundColor: theme.factcardsecondary , 
    padding: 10, 
    borderRadius: 5, 
    fontFamily: "monospace" 
  },
  link: { 
    color:  theme.primary,
    textDecorationLine: "underline" 
  },
  list_item: { 
    marginVertical: 5 
  },
});
