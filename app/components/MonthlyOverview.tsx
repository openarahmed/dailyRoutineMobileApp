import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// Color helper function
const getColorForHours = (hours, maxHours, colorPalette) => {
    if (hours === 0) return colorPalette.level0;
    const percentage = hours / maxHours;
    if (percentage <= 0.25) return colorPalette.level1;
    if (percentage <= 0.50) return colorPalette.level2;
    if (percentage <= 0.75) return colorPalette.level3;
    return colorPalette.level4;
};

const MonthlyOverview = ({ data }) => {
    const { colors } = useTheme();
    const [selectedDay, setSelectedDay] = useState(null);

    const heatmapColors = {
        level0: 'rgba(128, 128, 128, 0.2)',
        level1: '#E0F7FA',
        level2: '#B2EBF2',
        level3: '#4DD0E1',
        level4: '#00ACC1',
    };

    if (!data || data.length === 0) {
        return null;
    }

    const today = new Date();
    const todayDateUTC = today.getUTCDate();
    const firstDayDateObject = new Date(data[0].fullDate);
    const isCurrentMonth = firstDayDateObject.getUTCMonth() === today.getUTCMonth() && firstDayDateObject.getUTCFullYear() === today.getUTCFullYear();

    const handleDayPress = (day) => {
        setSelectedDay(day?.hours > 0 ? day : null);
    };

    const formattedDate = selectedDay ?
        new Date(selectedDay.fullDate).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', timeZone: 'UTC'
        }) : null;

    const maxHours = Math.max(...data.map(d => d.hours), 1);
    
    const totalCells = Math.ceil(data.length / 7) * 7;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="calendar-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <CardTitle>Monthly Overview</CardTitle>
                        <CardDescription>
                          {selectedDay ? `${selectedDay.hours} hours on ${formattedDate}` : "A snapshot of your entire month's work."}
                        </CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent>
                <View style={styles.heatmapGrid}>
                    {Array.from({ length: totalCells }).map((_, index) => {
                        const day = data[index];

                        if (!day) {
                            return <View key={`empty-${index}`} style={styles.touchableCell} />;
                        }

                        const isToday = isCurrentMonth && day.date === todayDateUTC;

                        return (
                            <TouchableOpacity
                                key={day.date}
                                activeOpacity={0.7}
                                onPress={() => handleDayPress(day)}
                                style={styles.touchableCell} // Apply sizing and padding to the touchable area
                            >
                                <View
                                    style={[
                                        styles.heatmapCell, // This now only controls flex and borderRadius
                                        {
                                            backgroundColor: getColorForHours(day.hours, maxHours, heatmapColors),
                                        },
                                        isToday && {
                                            borderWidth: 2,
                                            borderColor: '#FFFFFF',
                                        }
                                    ]}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.legendContainer}>
                    <Text style={[styles.legendText, {color: colors.noSessionsSubText}]}>Less</Text>
                    {[heatmapColors.level1, heatmapColors.level2, heatmapColors.level3, heatmapColors.level4].map((color, index) => (
                        <View key={index} style={[styles.legendCell, { backgroundColor: color }]} />
                    ))}
                    <Text style={[styles.legendText, {color: colors.noSessionsSubText}]}>More</Text>
                </View>
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
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
    cardDescription: { fontSize: 14, marginTop: 4, minHeight: 20 },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    // --- THE FIX IS HERE: New styling strategy ---
    touchableCell: {
        width: `${100 / 7}%`, // Each cell takes up exactly 1/7th of the width
        aspectRatio: 1,      // This makes the cell a perfect square
        padding: 2,          // Inner padding creates the gap between cells
    },
    heatmapCell: {
        flex: 1,             // The colored view fills the padded area
        borderRadius: 4,
    },
    // -----------------------------------------
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    legendText: {
        fontSize: 12,
        marginHorizontal: 4,
    },
    legendCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginHorizontal: 2,
    }
});

export default MonthlyOverview;