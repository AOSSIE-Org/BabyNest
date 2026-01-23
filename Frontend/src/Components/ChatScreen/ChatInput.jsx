import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatInput({ 
  userInput, 
  setUserInput, 
  handleSendMessage,
  isGenerating, 
  isModelReady,
  useRAGMode,
  handlePaste,
  modelError,
  onRetryModel
}) {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.inputWrapper}>
        <View style={styles.inputCard}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handlePaste} 
            accessibilityLabel="Paste from clipboard"
          >
            <Icon name="content-paste" size={20} color="rgba(218,79,122,0.4)"/>
          </TouchableOpacity>
          
          {(!useRAGMode && !isModelReady && modelError) ? (
            <TouchableOpacity onPress={onRetryModel} style={styles.errorContainer}>
               <Text style={styles.errorText}>Model Failed. Tap to Retry</Text>
               <Icon name="refresh" size={20} color="#D32F2F" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[
                styles.input, 
                { opacity: (!useRAGMode && !isModelReady) ? 0.5 : 1 }
              ]}
              value={userInput}
              onChangeText={setUserInput}
              editable={useRAGMode || isModelReady}
              placeholder={
                !useRAGMode && !isModelReady 
                  ? "Loading model..." 
                  : (useRAGMode ? "Ask Agent..." : "Ask Anything...")
              }
              placeholderTextColor="rgba(0,0,0,0.3)"
              multiline
            />
          )}

            {userInput?.length > 0 && (
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!useRAGMode && !isModelReady) && { opacity: 0.5 }
              ]} 
              onPress={() => handleSendMessage()}
              disabled={isGenerating || (!useRAGMode && !isModelReady)}
              accessibilityLabel="Send message"
            >
              <Icon name="arrow-upward" size={20} color="#fff" />
            </TouchableOpacity>
           )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    padding: 15,
    backgroundColor: "#FFF5F8",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30, // Capsule shape
    paddingHorizontal: 10,
    paddingVertical: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(218,79,122,0.1)',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
    maxHeight: 100,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  sendButton: {
    backgroundColor: "rgb(218,79,122)",
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  errorText: {
    color: '#D32F2F',
    marginRight: 8,
    fontWeight: 'bold',
  },
});
