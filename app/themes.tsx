import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useNavigation } from "expo-router";
import React from "react";
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemeName, themes, useTheme } from "../context/ThemeContext";

// --- Responsive scaling ---
const { width } = Dimensions.get("window");
const cardWidth = width / 2 - 24; // Two cards per row with padding

// A simple map to hold our beautiful preview backgrounds
const themePreviews = {
    light: {
        // A simple gradient for a clean look
        type: 'gradient',
        colors: ['#EFEFEF', '#FFFFFF'],
        textColor: '#333333',
        day: '24',
        month: 'Sun',
    },
    dark: {
        // Using an image for a more dynamic feel
        type: 'image',
        source: { uri: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcS7IvYc5OhmuHiez0svyj_fypmrf_eDJVpvQlJC_GWFYfy2DOKDmbxQk4p5dBqCjdf7HbF2BL_ooiyWniKKbpSQLQ' },
        textColor: '#FFFFFF',
        day: '15',
        month: 'Wed',
    },
    classic: {
        // A rich, dark gradient
        type: 'gradient',
        colors: ['#1D2B4A', '#0B111D'],
        textColor: '#EAEAEA',
        day: '08',
        month: 'Mon',
    },
};


const ThemePreviewCard = ({
    themeName,
    currentTheme,
    onPress,
}) => {
    const isActive = themeName === currentTheme;
    const preview = themePreviews[themeName];

    const CardContent = () => (
        <View style={styles.cardContent}>
            <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: preview.textColor }]}>{preview.day}</Text>
                <Text style={[styles.dateText, { color: preview.textColor }]}>{preview.month}</Text>
            </View>

            <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: isActive ? '#4CAF50' : 'rgba(255,255,255,0.8)' }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onPress();
                }}
            >
                {isActive ? (
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.cardWrapper}>
            {preview.type === 'image' ? (
                <ImageBackground
                    source={preview.source}
                    style={styles.cardContainer}
                    imageStyle={{ borderRadius: 20 }}
                >
                    <View style={styles.overlay} />
                    <CardContent />
                </ImageBackground>
            ) : (
                <View style={[styles.cardContainer, { backgroundColor: preview.colors[0] }]}>
                    <CardContent />
                </View>
            )}
            <Text style={[styles.themeNameText, { color: useTheme().colors.textColor }]}>
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </Text>
        </View>
    );
};

export default function ThemeSelectionScreen() {
    const { themeName, setThemeName, colors } = useTheme();
    const navigation = useNavigation();

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={[styles.headerContainer, { borderBottomColor: colors.dividerLine }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={colors.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.headerText, { color: colors.textColor }]}>Choose Theme</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {Object.keys(themes).map((key) => (
                    <ThemePreviewCard
                        key={key}
                        themeName={key as ThemeName}
                        currentTheme={themeName}
                        onPress={() => setThemeName(key as ThemeName)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    headerText: {
        fontSize: 22,
        fontWeight: "bold",
    },
    scrollContent: {
        padding: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    cardWrapper: {
        width: cardWidth,
        marginBottom: 24,
        alignItems: 'center',
    },
    cardContainer: {
        width: '100%',
        height: cardWidth * 1.7, // Taller cards
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        padding: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cardContent: {
        width: '100%',
        alignItems: 'center',
    },
    timeContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    timeText: {
        fontSize: 36,
        fontWeight: '300',
        letterSpacing: 1,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
    },
    applyButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    themeNameText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "600",
    },
});
