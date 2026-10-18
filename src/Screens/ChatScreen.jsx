import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {downloadModel, unloadModel} from '../model/model';
import {GGUF_FILE} from '@env';
import {useTheme} from '../theme/ThemeContext';
import {useAgentContext} from '../context/AgentContext';
import {conversationContext} from '../services/ConversationContext';
import {useChatEngine} from '../hooks/useChatEngine';

// Components
import ChatHeader from '../Components/ChatScreen/ChatHeader';
import EmptyState from '../Components/ChatScreen/EmptyState';
import ChatInput from '../Components/ChatScreen/ChatInput';
import MessageList from '../Components/ChatScreen/MessageList';
import QuickReplies from '../Components/ChatScreen/QuickReplies';
import TypingIndicator from '../Components/ChatScreen/TypingIndicator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {deleteProfile} from '../storage/profile';

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
      return {...state, isModelReady: false, error: null};
    case 'SET_DOWNLOADING':
      return {...state, isDownloading: action.payload};
    case 'SET_PROGRESS':
      return {...state, progress: action.payload};
    case 'INIT_SUCCESS':
      return {...state, isDownloading: false, isModelReady: true, error: null};
    case 'INIT_FAILURE':
      return {
        ...state,
        isDownloading: false,
        isModelReady: false,
        error: action.payload || 'Initialization failed',
      };
    default:
      return state;
  }
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const {context, refreshContext, initializeContext, isInitialized} =
    useAgentContext();

  const [modelState, dispatch] = React.useReducer(
    modelReducer,
    initialModelState,
  );
  const {isDownloading, isModelReady, error: modelError} = modelState;

  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [useRAGMode, setUseRAGMode] = useState(true);
  const pendingQueryRef = useRef(null);
  const flatListRef = useRef(null);

  const {
    conversation,
    isGenerating,
    sendMessage,
    clearConversation: baseClearConversation,
  } = useChatEngine(isInitialized, context, refreshContext);

  // Wrap clear for UI confirmation
  const clearConversation = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to delete all messages?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          baseClearConversation();
          setShowScrollToBottom(false);
        },
      },
    ]);
  };

  const initModel = React.useCallback(async () => {
    try {
      if (isDownloading) return; // Prevention suggested in review
      dispatch({type: 'START_INIT'});
      dispatch({type: 'SET_DOWNLOADING', payload: true});
      dispatch({type: 'SET_PROGRESS', payload: 0});

      const success = await downloadModel(GGUF_FILE, p => {
        dispatch({type: 'SET_PROGRESS', payload: p});
      });

      dispatch({type: 'SET_DOWNLOADING', payload: false});

      if (success) {
        dispatch({type: 'INIT_SUCCESS'});
      } else {
        dispatch({type: 'INIT_FAILURE', payload: 'Failed to load model.'});
      }
    } catch (error) {
      console.error(error);
      dispatch({type: 'INIT_FAILURE', payload: error.message});
    }
  }, [isDownloading]);

  useEffect(() => {
    initModel();
    initializeContext();
    // Cleanup on unmount
    return () => {
      unloadModel();
    };
  }, []); // Only run on mount, but returns cleanup

  // handleSendMessage now focuses on UI-side effects after core logic runs in the hook
  const handleSendMessage = async (content = null, isQuickReply = false) => {
    const textToSend = typeof content === 'string' ? content : userInput;

    if (!textToSend?.trim()) return;

    let finalMessage = textToSend.trim();

    if (isQuickReply && pendingQueryRef.current) {
      finalMessage = `${pendingQueryRef.current}. ${finalMessage}`;
    }

    // Store this query as context for a possible follow-up.
    pendingQueryRef.current = finalMessage;

    setUserInput('');

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
        setTimeout(async () => {
          try {
            const user_id = await AsyncStorage.getItem('user_id');
            console.log('userid', user_id);
            const delete_user_res = await deleteProfile(user_id);

            if (!delete_user_res.success) {
              Alert.alert('Logout Failed', delete_user_res.error.message);
              return;
            }

            AsyncStorage.removeItem(user_id);
            AsyncStorage.clear();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{name: 'Onboarding'}],
              }),
            );
          } catch {
            Alert.alert('Logout Error', 'Unable to logout. Please try again.');
          }
        }, 1000);
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

  const handleCopyMessage = message => {
    Clipboard.setString(message);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    handleInputChange(text);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({animated: true});
    setShowScrollToBottom(false);
  };

  // Get quick replies based on pending follow-up context
  const getQuickReplies = () => {
    if (!conversationContext.hasPendingFollowUp()) {
      return [];
    }

    const pendingFollowUp = conversationContext.pendingFollowUp;
    const missingFields = pendingFollowUp?.missingFields || [];

    // Use the pending intent to resolve fields with different meanings.
    const intentName =
      pendingFollowUp?.intent?.name ||
      pendingFollowUp?.intentName ||
      pendingFollowUp?.intent ||
      '';

    const intent = String(intentName).toLowerCase();

    const repliesByField = {
      title: ['Ultrasound', 'Blood Test', 'Checkup', 'Consultation'],

      date: ['Today', 'Tomorrow', 'Day after tomorrow', 'Next week'],

      update_date: ['Today', 'Tomorrow', 'Day after tomorrow', 'Next week'],

      start_date: ['Today', 'Tomorrow', 'Next week', 'Choose a date'],

      end_date: ['Next week', 'Next month', 'Choose a date'],

      time: ['Morning', 'Afternoon', 'Evening', '9:00 AM'],

      appointment_time: ['Morning', 'Afternoon', 'Evening', '9:00 AM'],

      update_time: ['Morning', 'Afternoon', 'Evening', 'Night'],

      location: ['Home', 'Clinic', 'Hospital', 'Enter location'],

      appointment_identifier: [
        'My next appointment',
        'My last appointment',
        'Today’s appointment',
        'Choose by date',
      ],

      // Profile fields
      field: ['Name', 'Age', 'Phone', 'Due Date'],

      // Weight
      weight: ['Enter weight in kg', 'Enter weight in lbs'],

      // Symptoms
      symptom: ['Nausea', 'Headache', 'Dizziness', 'Fatigue'],

      // Medicine
      name: ['Iron', 'Folic Acid', 'Calcium', 'Enter medicine name'],

      medicine_name: ['Iron', 'Folic Acid', 'Calcium', 'Enter medicine name'],

      dose: ['Enter prescribed dose', 'Skip'],

      frequency: ['Once daily', 'Twice daily', 'As prescribed', 'Other'],

      intensity: ['Low', 'Medium', 'High'],

      duration: ['6 hours', '7 hours', '8 hours', '9 hours'],

      quality: ['Excellent', 'Good', 'Fair', 'Poor'],

      // Analytics and data retrieval
      metric: ['Weight', 'Sleep', 'Mood', 'Symptoms'],

      timeframe: ['Today', 'This week', 'This month', 'All time'],

      action_type: ['Weight', 'Sleep', 'Appointment', 'Symptoms'],

      type: intent.includes('discharge')
        ? ['Normal', 'Spotting', 'Bleeding', 'Heavy']
        : ['Appointments', 'Weight', 'Symptoms', 'Medicine'],

      // Blood pressure
      systolic: ['110', '120', '130', 'Enter reading'],

      diastolic: ['70', '80', '85', 'Enter reading'],

      pressure_reading: ['120/80', '110/70', 'Enter reading'],

      // Discharge
      type: ['Normal', 'Spotting', 'Bleeding', 'Heavy'],

      color: ['Clear', 'White', 'Yellow', 'Brown'],

      bleeding: ['Yes', 'No'],

      // Other fields
      week: ['Current week', 'Enter week number'],

      week_number: ['Current week', 'Enter week number'],

      priority: ['Low', 'Medium', 'High'],

      limit: ['5', '10', '20', 'All'],

      screen: ['Home', 'Calendar', 'Timeline', 'Chat'],

      // Medicine date fields
      startDate: ['Today', 'Tomorrow', 'Choose a date'],

      endDate: ['Next week', 'Next month', 'Choose a date'],
    };

    const replies = [];

    for (const field of missingFields) {
      const options = repliesByField[field];

      if (options) {
        replies.push(...options);
      }
    }

    return [...new Set(replies)].slice(0, 4);
  };

  const handleQuickReply = reply => {
    handleSendMessage(reply, true);
  };

  const handleInputChange = text => {
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
        <EmptyState
          handleQuickReply={handleQuickReply}
          useRAGMode={useRAGMode}
        />
      ) : (
        <MessageList
          conversation={conversation}
          flatListRef={flatListRef}
          theme={theme}
          onScrollPositionChange={setShowScrollToBottom}
          onCopyMessage={handleCopyMessage}
          footer={
            isGenerating ? (
              <View style={styles.typingContainer}>
                <TypingIndicator />
              </View>
            ) : null
          }
        />
      )}

      {showScrollToBottom && conversation.length > 0 && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}>
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
    backgroundColor: '#FFF5F8', // Keep app theme background
  },
  typingContainer: {
    paddingLeft: 10, // Match message padding roughly
    marginBottom: 20,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
