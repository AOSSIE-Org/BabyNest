import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function QuickReplies({ replies, handleQuickReply }) {
  if (!replies || replies.length === 0) return null;

  return (
    <View style={styles.quickRepliesContainer}>
      <Text style={styles.quickRepliesTitle}>Suggested:</Text>
      <View style={styles.quickRepliesRow}>
        {replies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReplyButton}
            onPress={() => handleQuickReply(reply)}
          >
            <Text style={styles.quickReplyText}>
              {reply}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickRepliesContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  quickRepliesTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    marginLeft: 5,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(218,79,122,0.2)',
  },
  quickReplyText: {
    fontSize: 13,
    color: 'rgb(218,79,122)',
  },
});
