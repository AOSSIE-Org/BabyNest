import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ChatHeader({ 
  navigation, 
  useRAGMode, 
  setUseRAGMode, 
  clearConversation, 
  conversationLength 
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={{padding: 8}} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={"rgb(218,79,122)"}/>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>BabyNest AI</Text>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => setUseRAGMode(!useRAGMode)}
      >
        <Icon 
          name={useRAGMode ? "smart-toy" : "stay-current-portrait"} 
          size={20} 
          color={"rgb(218,79,122)"}
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.headerButton, { marginLeft: 8, opacity: conversationLength > 0 ? 1 : 0.5 }]}
        onPress={clearConversation}
        disabled={!conversationLength || conversationLength === 0}
      >
           <Icon 
            name="delete" 
            size={24} 
            color={"rgb(218,79,122)"}
          />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,79,122,0.05)',
  },
  headerTitle: {
    color: "rgb(218,79,122)",
    fontSize: 18,
    fontWeight: "700",
    textAlign: 'center',
    flex: 1,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(218,79,122,0.1)',
  },
});
