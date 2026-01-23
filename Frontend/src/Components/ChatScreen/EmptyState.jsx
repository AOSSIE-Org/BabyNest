import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function EmptyState({ handleQuickReply, useRAGMode }) {
  const AGENT_TASKS = [
    { title: "Weight Tracking", subtitle: "Record progress", query: "Record my weight" },
    { title: "Medicine Tracking", subtitle: "Record pills", query: "Record medicine" },
    { title: "Symptoms Tracking", subtitle: "Record health", query: "Record symptoms" },
    { title: "Visits", subtitle: "Next checkup", query: "When is my next appointment?" }
  ];

  const MODEL_TASKS = [
    { title: "Pregnancy Stages", subtitle: "Learn basics", query: "Explain the stages of pregnancy" },
    { title: "Baby Names", subtitle: "Get ideas", query: "Suggest some unique baby names" },
    { title: "Hospital Bag", subtitle: "Be prepared", query: "What should I pack in my hospital bag?" },
    { title: "Relaxation", subtitle: "Reduce stress", query: "Give me some relaxation techniques for pregnancy" }
  ];

  const tasks = useRAGMode ? AGENT_TASKS : MODEL_TASKS;

  return (
    <ScrollView 
      style={{flex: 1}}
      contentContainerStyle={styles.emptyStateContainer}
      showsVerticalScrollIndicator={false}
    >
      <Icon name={useRAGMode ? "smart-toy" : "smartphone"} size={60} color="rgba(218,79,122,0.2)" style={{marginBottom: 20}} />
      <Text style={styles.emptyStateTitle}>
        {useRAGMode ? "How can I help you?" : "Chat with AI Model"}
      </Text>
      <View style={styles.suggestionGrid}>
         {tasks.map((task, index) => (
           <TouchableOpacity key={index} style={styles.suggestionCard} onPress={() => handleQuickReply(task.query)}>
             <Text style={styles.suggestionTitle}>{task.title}</Text>
             <Text style={styles.suggestionSubtitle}>{task.subtitle}</Text>
           </TouchableOpacity>
         ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  emptyStateLogo: {
    width: 60,
    height: 60,
    marginBottom: 20,
    tintColor: 'rgb(218,79,122)',
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#888',
  },
});
