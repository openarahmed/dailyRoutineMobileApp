import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const [selectedDay, setSelectedDay] = useState(null);

    if (!data || data.length === 0) {
        return null;
    }

    // --- THE FIX: A more robust calculation for cell size to prevent wrapping ---
    const cardPadding = 16; // Padding inside the card
    const screenPadding = 15; // Padding of the ScrollView container
    const totalHorizontalPadding = (cardPadding + screenPadding) * 2;
    const gridWidth = Dimensions.get('window').width - totalHorizontalPadding;
    const cellSize = gridWidth / 7.5; // Divide by a slightly larger number to ensure fit

    const today = new Date();
    const todayDateUTC = today.getUTCDate();
    const firstDayDateObject = new Date(data[0].fullDate);
    const firstDayOfMonth = firstDayDateObject.getUTCDay();
    const isCurrentMonth = firstDayDateObject.getUTCMonth() === today.getUTCMonth() && firstDayDateObject.getUTCFullYear() === today.getUTCFullYear();
    
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handleDayPress = (day) => {
        if (day.hours > 0) {
            setSelectedDay(day);
        } else {
            setSelectedDay(null); // Clear selection for empty days
        }
    };
    
    const formattedDate = selectedDay ? 
        new Date(selectedDay.fullDate).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
        }) : null;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="calendar-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <CardTitle>Monthly Overview</CardTitle>
                        <CardDescription>A snapshot of your entire month's work.</CardDescription>
                    </View>
                </View>
                <View style={styles.tooltipContainer}>
                    <Text style={[styles.tooltipText, { color: colors.textColor }]} numberOfLines={1}>
                        {selectedDay ? `${selectedDay.hours} hours on ${formattedDate}` : 'Select a day to see details'}
                    </Text>
                </View>
            </CardHeader>
            <CardContent>
                <View style={styles.weekDaysContainer}>
                    {weekDays.map((day, index) => <Text key={index} style={[styles.weekDayText, { color: colors.noSessionsSubText }]}>{day}</Text>)}
                </View>
                <View style={styles.heatmapGrid}>
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                        <View key={`empty-${index}`} style={[styles.heatmapCell, { width: cellSize, height: cellSize }]} />
                    ))}
                    {data.map((day) => {
                        const isToday = isCurrentMonth && day.date === todayDateUTC;
                        const maxHours = 8;
                        const intensity = Math.min(day.hours / maxHours, 1);
                        
                        return (
                            <TouchableOpacity
                                key={day.date}
                                activeOpacity={0.7}
                                onPress={() => handleDayPress(day)}
                            >
                                <View 
                                    style={[
                                        styles.heatmapCell, 
                                        { 
                                            width: cellSize,
                                            height: cellSize,
                                            backgroundColor: day.hours > 0 ? colors.accentColor : colors.modalDayButtonBg, 
                                            opacity: day.hours > 0 ? 0.15 + (intensity * 0.85) : 1
                                        },
                                        isToday && { 
                                            borderWidth: 1.5,
                                            borderColor: colors.accentColor,
                                            opacity: 1
                                        }
                                    ]} 
                                />
                            </TouchableOpacity>
                        );
                    })}
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
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
        marginBottom: 8,
    },
    weekDayText: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        flex: 1,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
    },
    heatmapCell: {
        borderRadius: 4,
        margin: 2, // Use a small, fixed margin
    },
    tooltipContainer: {
        height: 20,
        marginTop: 12,
        paddingHorizontal: 16,
    },
    tooltipText: {
        fontSize: 14,
        fontWeight: '600'
    }
});

export default MonthlyOverview;