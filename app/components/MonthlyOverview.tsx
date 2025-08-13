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

const MonthlyOverview = ({ data }) => {
    const { colors } = useTheme();
    if (!data || data.length === 0) return null;

    const firstDayOfMonth = data[0].fullDate.getDay();
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="calendar-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>Monthly Overview</CardTitle>
                        <CardDescription>A snapshot of your entire month's work.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent>
                <View style={styles.weekDaysContainer}>
                    {weekDays.map((day, index) => <Text key={index} style={[styles.weekDayText, { color: colors.noSessionsSubText }]}>{day}</Text>)}
                </View>
                <View style={styles.heatmapGrid}>
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                        <View key={`empty-${index}`} style={styles.heatmapCell} />
                    ))}
                    {data.map((day) => (
                        <View 
                            key={day.date} 
                            style={[
                                styles.heatmapCell, 
                                { 
                                    backgroundColor: day.hours > 0 ? colors.accentColor : colors.modalDayButtonBg, 
                                    opacity: day.hours > 0 ? 0.2 + (day.hours / 8) * 0.8 : 1
                                }
                            ]} 
                        />
                    ))}
                </View>
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
    weekDaysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 5,
    },
    weekDayText: {
        width: '14.2%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    heatmapCell: {
        width: '13%',
        aspectRatio: 1,
        borderRadius: 4,
        margin: '0.6%',
    },
});

export default MonthlyOverview;
