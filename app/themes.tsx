import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router"; // 👈 Import useNavigation hook
import React, { useRef } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemeName, themes, useTheme } from "../context/ThemeContext";

// --- Responsive scaling ---
const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
    size + (scale(size) - size) * factor;

const ThemePreviewCard = ({
    themeName,
    currentTheme,
    onPress,
}: {
    themeName: ThemeName;
    currentTheme: ThemeName;
    onPress: () => void;
}) => {
    const colors = themes[themeName];
    const isActive = themeName === currentTheme;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 1.04,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
        }).start();
        onPress();
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    transform: [{ scale: scaleAnim }],
                    shadowColor: colors.accentColor,
                    shadowOpacity: isActive ? 0.25 : 0.1,
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.cardContainer,
                    {
                        borderColor: isActive ? colors.accentColor : "transparent",
                        backgroundColor:
                            colors.themePreviewBg || colors.backgroundColor || "#fff",
                    },
                ]}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Small badge for active theme */}
                {isActive && (
                    <View style={styles.activeBadge}>
                        <Ionicons
                            name="checkmark-circle"
                            size={moderateScale(22)}
                            color={colors.accentColor}
                        />
                    </View>
                )}

                {/* Phone Preview */}
                <View
                    style={[
                        styles.previewPhone,
                        { backgroundColor: colors.backgroundColor },
                    ]}
                >
                    <View
                        style={[
                            styles.previewHeader,
                            { backgroundColor: colors.headerBackground },
                        ]}
                    >
                        <Text
                            style={[
                                styles.previewHeaderText,
                                { color: colors.headerText },
                            ]}
                        >
                            Preview
                        </Text>
                    </View>
                    <View style={styles.previewBody}>
                        <Text
                            style={[styles.previewText, { color: colors.textColor }]}
                        >
                            Hello, World!
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.previewTabBar,
                            { backgroundColor: colors.tabBarColor },
                        ]}
                    >
                        <Ionicons
                            name="home-outline"
                            size={moderateScale(18)}
                            color={colors.accentColor}
                        />
                        <Ionicons
                            name="settings-outline"
                            size={moderateScale(18)}
                            color={colors.tabBarInactiveTintColor}
                        />
                    </View>
                </View>

                {/* Theme Name */}
                <Text
                    style={[
                        styles.themeNameText,
                        { color: colors.textColor, marginTop: verticalScale(10) },
                    ]}
                >
                    {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ThemeSelectionScreen() {
    const { themeName, setThemeName, colors } = useTheme();
    const navigation = useNavigation(); // 👈 Initialize navigation hook

    return (
        <View
            style={[styles.container, { backgroundColor: colors.backgroundColor }]}
        >
            {/* 👈 Add a custom header with a back button */}
            <View style={[styles.headerContainer, { borderBottomColor: colors.dividerLine }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={moderateScale(28)} color={colors.iconColor} />
                </TouchableOpacity>
                <Text style={[styles.headerText, { color: colors.textColor }]}>Choose Theme</Text>
                <View style={{ width: moderateScale(28) }} />
            </View>

            {/* Theme Cards */}
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
        paddingTop: verticalScale(40),
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: scale(15),
        paddingBottom: verticalScale(15),
        borderBottomWidth: 1,
    },
    headerText: {
        fontSize: moderateScale(22),
        fontWeight: "bold",
    },
    scrollContent: {
        padding: scale(15),
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
    },
    cardWrapper: {
        width: "45%",
        aspectRatio: 1 / 1.75,
        marginBottom: verticalScale(20),
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 12,
        elevation: 4,
    },
    cardContainer: {
        flex: 1,
        borderRadius: moderateScale(18),
        borderWidth: 2,
        overflow: "hidden",
        padding: scale(8),
        alignItems: "center",
        justifyContent: "center",
    },
    activeBadge: {
        position: "absolute",
        top: scale(8),
        right: scale(8),
        zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 50,
    },
    previewPhone: {
        width: "100%",
        height: "80%",
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        overflow: "hidden",
    },
    previewHeader: {
        height: "15%",
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
    },
    previewHeaderText: {
        fontSize: moderateScale(12),
        fontWeight: "bold",
    },
    previewBody: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    previewText: {
        fontSize: moderateScale(10),
    },
    previewTabBar: {
        height: "15%",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
    },
    themeNameText: {
        fontSize: moderateScale(16),
        fontWeight: "600",
    },
});