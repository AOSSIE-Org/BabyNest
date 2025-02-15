import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello Jenny</Text>
                <Image source={{ uri: "https://via.placeholder.com/40" }} style={styles.avatar} />
            </View>

            {/* Pregnancy Week Info */}
            <Text style={styles.title}>16th Week of Pregnancy</Text>

            <View style={styles.weekContainer}>
                {["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20", "Sat 21", "Sun 22"].map((day, index) => (
                    <TouchableOpacity key={index} style={[styles.dayBox, index === 2 && styles.selectedDay]}>
                        <Text style={[styles.dayText, index === 2 && styles.selectedDayText]}>{day}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Baby Info */}
            <View style={styles.infoCard}>
                <Icon name="child-care" size={50} color="#ff4081" />
                <Text style={styles.infoText}>Your baby is the size of a pear</Text>
                <View style={styles.stats}>
                    <Text>Baby Height: <Text style={styles.boldText}>17 cm</Text></Text>
                    <Text>Baby Weight: <Text style={styles.boldText}>110 gr</Text></Text>
                    <Text>Days Left: <Text style={styles.boldText}>168 days</Text></Text>
                </View>
            </View>

            {/* Menu Grid */}
            <View style={styles.grid}>
                {[
                    { name: "Medicines", icon: "local-pharmacy" },
                    { name: "Medicines", icon: "local-pharmacy" },
                    { name: "Food", icon: "restaurant" },
                    { name: "Appointments", icon: "event"},
                    { name: "Vaccines", icon: "local-hospital" },
                ].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.gridItem}>
                        <Icon name={item.icon} size={30} color="#ff4081" />
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Chatbot Floating Button */}
            <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("ChatScreen")}>
                <Icon name="chat" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    greeting: { fontSize: 18, fontWeight: "bold" },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
    weekContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    dayBox: { padding: 10, borderRadius: 10, backgroundColor: "#f5f5f5", alignItems: "center" },
    selectedDay: { backgroundColor: "#ff4081" },
    dayText: { color: "#333" },
    selectedDayText: { color: "#fff", fontWeight: "bold" },
    infoCard: { backgroundColor: "#fce4ec", padding: 20, borderRadius: 10, alignItems: "center", marginBottom: 20 },
    infoText: { fontSize: 16, fontWeight: "bold", marginVertical: 10 },
    stats: { alignItems: "center" },
    boldText: { fontWeight: "bold" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    gridItem: { width: "30%", backgroundColor: "#f5f5f5", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 10 },

    // Chatbot Floating Button
    chatButton: {
        position: "absolute",
        bottom: 30,
        right: 20,
        backgroundColor: "#ff4081",
        padding: 15,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
});
