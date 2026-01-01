import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Markdown from "react-native-markdown-display";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function MessageList({ conversation, flatListRef, theme, footer, onScrollPositionChange }) {
  const markdownStyles = useMemo(() => ({
    body: { color: "#000000", fontSize: 16, lineHeight: 24 },
    heading1: { color: "rgb(218,79,122)", fontWeight: "bold", marginVertical: 10 },
    heading2: { color: "rgb(218,79,122)", fontWeight: "bold", marginVertical: 8 },
    strong: { fontWeight: "bold", color: "rgb(218,79,122)" },
    list_item: { marginVertical: 5 },
  }), [theme]);

  return (
    <FlatList
      ref={flatListRef}
      data={conversation}
      ListFooterComponent={footer}
      renderItem={({ item }) => {
        const isUser = item.role === "user";
        return (
          <View style={[styles.messageRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
            {!isUser && (
               <View style={styles.botAvatar}>
                  <Icon name="smart-toy" size={20} color="rgb(218,79,122)" />
               </View>
            )}
            <View style={[
              isUser ? styles.userMessageContainer : styles.botMessageContainer,
              !isUser && styles.messageContent
            ]}>
              {isUser ? (
                <Text style={styles.userMessageText}>{item.content}</Text>
              ) : (
                <Markdown style={markdownStyles}>
                  {item.content}
                </Markdown>
              )}
            </View>
          </View>
        );
      }}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.chatArea}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}
      onScroll={({ nativeEvent }) => {
        const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
        // Threshold can be adjusted, e.g., 20 or 50 pixels
        const threshold = 20; 
        const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;
        
        if (onScrollPositionChange) {
          // If NOT near bottom, show button (true). If near bottom, hide button (false).
          onScrollPositionChange(!isNearBottom);
        }
      }}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  chatArea: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  messageRow: {
    marginBottom: 25,
    flexDirection: 'row',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218,79,122,0.2)',
    marginRight: 10,
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#FCE4EC', // Light Pink
    borderRadius: 25,
    paddingHorizontal: 15, // Comfortable padding
    paddingVertical: 10,
    maxWidth: '75%', // Allow text to grow up to 75% screen width
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: 'rgba(218,79,122,0.1)',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingTop: 5,
  },
  userMessageText: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 24,
    textAlign: 'right',
  },
});
