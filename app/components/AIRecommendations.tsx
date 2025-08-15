import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Reusable Card Components
const Card = ({ children, style = {} }) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#18202e', shadowColor: colors.shadowColor || '#000' }, style]}>
            {children}
        </View>
    );
};
const CardHeader = ({ children }) => <View style={[styles.cardHeader]}>{children}</View>;
const CardContent = ({ children, style }) => <View style={[styles.cardContent, style]}>{children}</View>;
const CardTitle = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardTitle, { color: colors.textColor }]}>{children}</Text>;
};
const CardDescription = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardDescription, { color: colors.noSessionsSubText }]}>{children}</Text>;
};

const AIRecommendations = ({ data }) => {
    const { colors } = useTheme();
    if (!data || data.length === 0) return null;

    const iconMap = {
        BookOpen: 'book-outline',
        Sunrise: 'sunny-outline',
        Zap: 'flash-outline',
    };

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="bulb-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>AI Recommendations</CardTitle>
                        <CardDescription>Smart suggestions to optimize your routine.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent style={{ gap: 12 }}>
                {data.map((rec, index) => (
                    <View key={index} style={[styles.recommendationItem, { backgroundColor: colors.backgroundColor }]}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.modalDayButtonBg }]}>
                            <Ionicons name={iconMap[rec.icon] || 'help-circle-outline'} size={20} color={colors.accentColor} />
                        </View>
                        <Text style={[styles.recommendationText, { color: colors.textColor }]}>{rec.text}</Text>
                    </View>
                ))}
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
    },
    cardHeader: {
        padding: 16,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
    },
});

export default AIRecommendations;
