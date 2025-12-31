import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatInput({ 
  userInput, 
  setUserInput, 
  handleSendMessage,
  isGenerating, 
  isModelReady,
  useRAGMode,
  handlePaste 
}) {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.inputWrapper}>
        <View style={styles.inputCard}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePaste}>
            <Icon name="content-paste" size={20} color="rgba(0,0,0,0.4)"/>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { opacity: (!useRAGMode && !isModelReady) ? 0.5 : 1 }]}
            value={userInput}
            onChangeText={setUserInput}
            editable={useRAGMode || isModelReady}
            placeholder={
              !useRAGMode && !isModelReady 
                ? "Loading model..." 
                : (useRAGMode ? "Ask Agent..." : "Ask Anything...")
            }
            placeholderTextColor="#999"
            multiline
          />

           {userInput.length > 0 && (
            <TouchableOpacity 
              style={[styles.sendButton, { marginLeft: 8 }, (!useRAGMode && !isModelReady) && { opacity: 0.5 }]} 
              onPress={handleSendMessage}
              disabled={isGenerating || (!useRAGMode && !isModelReady)}
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    marginLeft: 5,
  },
});
