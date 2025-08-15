import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
// Base unit for scaling fonts, padding, and other UI elements.
const FONT_SCALE = width / 100;

// --- TypeScript Prop Types ---
type CardProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

type CardContentProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

type CardTextProps = {
    children: React.ReactNode;
};

// Type for a single day's data object
type DayData = {
    fullDate: string;
    date: number;
    hours: number;
};

// --- Reusable Card Components (Now Type-Safe) ---
const Card: React.FC<CardProps> = ({ children, style = {} }) => {
    const { colors } = useTheme();
    // Fixed the TypeScript error by removing the non-existent 'shadowColor' property.
    return <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#18202e' }, style]}>{children}</View>;
};

const CardHeader: React.FC<CardTextProps> = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
const CardContent: React.FC<CardContentProps> = ({ children, style }) => <View style={[styles.cardContent, style]}>{children}</View>;
const CardTitle: React.FC<CardTextProps> = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardTitle, { color: colors.textColor }]}>{children}</Text>;
};
const CardDescription: React.FC<CardTextProps> = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardDescription, { color: colors.noSessionsSubText }]}>{children}</Text>;
};

// --- Color Helper Function ---
const getColorForHours = (hours: number, maxHours: number, colorPalette: Record<string, string>) => {
    if (hours === 0) return colorPalette.level0;
    const percentage = hours / maxHours;
    if (percentage <= 0.25) return colorPalette.level1;
    if (percentage <= 0.50) return colorPalette.level2;
    if (percentage <= 0.75) return colorPalette.level3;
    return colorPalette.level4;
};

// --- Main Chart Component ---
const MonthlyOverview = ({ data }: { data: DayData[] | null }) => {
    const { colors } = useTheme();
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

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

    const handleDayPress = (day: DayData) => {
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
                    <Ionicons name="calendar-outline" size={FONT_SCALE * 6} color={colors.textColor} />
                    <View style={styles.headerTextContainer}>
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
                                style={styles.touchableCell}
                            >
                                <View
                                    style={[
                                        styles.heatmapCell,
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
        width: width * 0.95, // Card takes up 95% of screen width
        alignSelf: 'center',
        marginTop: 10,
    },
    cardHeader: {
        paddingHorizontal: FONT_SCALE * 4,
        paddingTop: FONT_SCALE * 4,
        paddingBottom: FONT_SCALE * 3,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        marginLeft: FONT_SCALE * 3,
        flex: 1,
    },
    cardContent: {
        paddingHorizontal: FONT_SCALE * 4,
        paddingBottom: FONT_SCALE * 4,
    },
    cardTitle: { fontSize: FONT_SCALE * 4.5, fontWeight: 'bold' },
    cardDescription: { fontSize: FONT_SCALE * 3.5, marginTop: 4, minHeight: FONT_SCALE * 5 },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    touchableCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        padding: FONT_SCALE * 0.5,
    },
    heatmapCell: {
        flex: 1,
        borderRadius: FONT_SCALE,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: FONT_SCALE * 2.5,
    },
    legendText: {
        fontSize: FONT_SCALE * 3,
        marginHorizontal: FONT_SCALE,
    },
    legendCell: {
        width: FONT_SCALE * 3,
        height: FONT_SCALE * 3,
        borderRadius: FONT_SCALE * 0.75,
        marginHorizontal: FONT_SCALE * 0.5,
    }
});

export default MonthlyOverview;
