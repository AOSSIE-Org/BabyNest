import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Animated } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

export default function ChatScreen() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([{ id: "1", text: "Hello! How can I help you?", sender: "bot" }]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = () => {
        if (input.trim() === "") return;

        const userMessage = { id: Date.now().toString(), text: input, sender: "user" };
        setMessages([...messages, userMessage]);
        setInput("");

        // Simulate AI typing before response
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const botResponse = { id: Date.now().toString(), text: "This is a sample AI response.", sender: "bot" };
            setMessages((prevMessages) => [...prevMessages, botResponse]);
        }, 1500);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat with BabyNest AI</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.messageContainer, item.sender === "user" ? styles.userMessage : styles.botMessage]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                )}
                contentContainerStyle={styles.chatArea}
                showsVerticalScrollIndicator={false}
            />

            {/* Typing Indicator */}
            {isTyping && (
                <View style={[styles.messageContainer, styles.botMessage]}>
                    <TypingIndicator />
                </View>
            )}

            {/* Input Field */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#888"
                    value={input}
                    onChangeText={setInput}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Icon name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Typing Indicator (Minimalist Dots Animation)
const TypingIndicator = () => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.typingContainer}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
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
        backgroundColor: "#ff4081",
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
    sendButton: {
        marginLeft: 10,
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
});

