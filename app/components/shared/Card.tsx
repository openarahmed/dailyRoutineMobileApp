import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext'; // Adjust this path if needed

export const Card = ({ children, style }: { children: React.ReactNode, style?: object }) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.card, { backgroundColor: colors.focusCardBg, borderColor: colors.borderColor || '#e5e7eb' }, style]}>
            {children}
        </View>
    );
};

export const CardContent = ({ children, style }: { children: React.ReactNode, style?: object }) => <View style={[styles.cardContent, style]}>{children}</View>;

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        // Adding a subtle shadow for iOS and elevation for Android
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardContent: {
        padding: 16,
    },
});
