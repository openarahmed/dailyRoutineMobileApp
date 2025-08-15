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

const HabitStreakTracker = ({ data }) => {
    const { colors } = useTheme();
    if (!data || data.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="flame-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>Habit Streaks</CardTitle>
                        <CardDescription>Your current consistency chains.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent>
                {data.map((habit) => (
                    <View key={habit.name} style={[styles.streakItem, { borderBottomColor: colors.dividerLine }]}>
                        <Ionicons name={habit.icon} size={24} color={habit.color} />
                        <Text style={[styles.habitName, { color: colors.textColor }]}>{habit.name}</Text>
                        <View style={styles.streakInfo}>
                            <Text style={[styles.currentStreak, { color: colors.textColor }]}>{habit.current} days</Text>
                            <Text style={[styles.bestStreak, { color: colors.noSessionsSubText }]}>Best: {habit.best}</Text>
                        </View>
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
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    streakItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    habitName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    streakInfo: {
        alignItems: 'flex-end',
    },
    currentStreak: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bestStreak: {
        fontSize: 12,
    },
});

export default HabitStreakTracker;
