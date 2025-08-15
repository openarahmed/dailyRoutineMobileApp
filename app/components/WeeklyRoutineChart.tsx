import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Line, Rect, Svg, Text as SvgText } from 'react-native-svg';
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

// Define a comprehensive type for the chart data prop.
type WeeklyChartData = {
    labels: string[];
    legend: string[];
    data: number[][];
    barColors: string[];
};

// --- Reusable Card Components (Now Type-Safe) ---
const Card: React.FC<CardProps> = ({ children, style = {} }) => {
    const { colors } = useTheme();
    // Fixed the TypeScript error by removing the non-existent 'shadowColor' property.
    return (
        <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#18202e' }, style]}>
            {children}
        </View>
    );
};

const CardHeader: React.FC<CardTextProps> = ({ children }) => <View style={[styles.cardHeader]}>{children}</View>;

const CardContent: React.FC<CardContentProps> = ({ children, style }) => <View style={[styles.cardContent, style]}>{children}</View>;

const CardTitle: React.FC<CardTextProps> = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardTitle, { color: colors.textColor }]}>{children}</Text>;
};

const CardDescription: React.FC<CardTextProps> = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardDescription, { color: colors.noSessionsSubText }]}>{children}</Text>;
};

const WeeklyRoutineChart = ({ data }: { data: WeeklyChartData | null }) => {
    const { colors } = useTheme();

    // --- Responsive Chart Dimensions ---
    const chartWidth = width * 0.9; // Chart takes up 90% of screen width
    const chartHeight = width * 0.6; // Height is proportional to width
    const padding = { top: FONT_SCALE * 5, right: FONT_SCALE * 5, bottom: FONT_SCALE * 12, left: FONT_SCALE * 8 };

    const chartDataToDisplay = data && data.labels && data.labels.length > 0 ? data : { labels: [], legend: [], data: [], barColors: [] };
    
    const totalHours = chartDataToDisplay.data.flat().reduce((sum, value) => sum + value, 0);

    const yMax = Math.max(8, ...chartDataToDisplay.data.flat()) + 2;
    const chartAreaHeight = chartHeight - padding.top - padding.bottom;
    const barWidth = chartDataToDisplay.labels.length > 0 ? ((chartWidth - padding.left - padding.right) / chartDataToDisplay.labels.length) * 0.6 : 0;
    const barMargin = chartDataToDisplay.labels.length > 0 ? ((chartWidth - padding.left - padding.right) / chartDataToDisplay.labels.length) * 0.2 : 0;

    const xPoint = (index: number) => padding.left + (index * (barWidth + barMargin * 2)) + barMargin;
    const yPoint = (value: number) => chartHeight - padding.bottom - (value / yMax) * chartAreaHeight;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="bar-chart-outline" size={FONT_SCALE * 6} color={colors.textColor} />
                    <View style={styles.headerTextContainer}>
                        <CardTitle>Weekly Routine Breakdown</CardTitle>
                        <CardDescription>How you've invested your time.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent>
                {totalHours > 0 ? (
                    <Svg width={chartWidth} height={chartHeight}>
                        {/* Y-Axis Labels and Grid Lines */}
                        {[0, Math.round(yMax/4), Math.round(yMax/2), Math.round(yMax*3/4), Math.round(yMax)].map(value => (
                            <React.Fragment key={value}>
                                <SvgText
                                    x={padding.left - 10}
                                    y={yPoint(value) + 4}
                                    fill={colors.noSessionsSubText}
                                    fontSize={FONT_SCALE * 3}
                                    textAnchor="end"
                                >
                                    {value}
                                </SvgText>
                                <Line
                                    x1={padding.left}
                                    y1={yPoint(value)}
                                    x2={chartWidth - padding.right}
                                    y2={yPoint(value)}
                                    stroke={colors.dividerLine}
                                    strokeWidth="0.5"
                                />
                            </React.Fragment>
                        ))}

                        {/* X-Axis Labels */}
                        {chartDataToDisplay.labels.map((label, index) => (
                            <SvgText
                                key={index}
                                x={xPoint(index) + barWidth / 2}
                                y={chartHeight - padding.bottom + FONT_SCALE * 5}
                                fill={colors.noSessionsSubText}
                                fontSize={FONT_SCALE * 3}
                                textAnchor="middle"
                            >
                                {label}
                            </SvgText>
                        ))}

                        {/* Stacked Bars */}
                        {chartDataToDisplay.data.map((dayData, dayIndex) => {
                            let cumulativeHeight = 0;
                            return dayData.map((value, catIndex) => {
                                if (value === 0) return null;
                                
                                const barHeight = (value / yMax) * chartAreaHeight;
                                const y = chartHeight - padding.bottom - barHeight - cumulativeHeight;
                                cumulativeHeight += barHeight;
                                
                                return (
                                    <Rect
                                        key={`${dayIndex}-${catIndex}`}
                                        x={xPoint(dayIndex)}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        fill={chartDataToDisplay.barColors[catIndex]}
                                        rx={FONT_SCALE * 0.5} // Subtle rounded corners
                                        ry={FONT_SCALE * 0.5}
                                    />
                                );
                            });
                        })}
                    </Svg>
                ) : (
                    <View style={[styles.noDataContainer, { height: chartHeight }]}>
                        <Text style={[styles.noDataText, { color: colors.noSessionsSubText }]}>
                            No activity recorded for the past week. Complete some tasks to see your progress!
                        </Text>
                    </View>
                )}

                {/* Custom Legend */}
                {totalHours > 0 && (
                    <View style={styles.legendContainer}>
                        {chartDataToDisplay.legend.map((item, index) => (
                            <View key={item} style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: chartDataToDisplay.barColors[index] }]} />
                                <Text style={[styles.legendText, { color: colors.textColor }]}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        padding: FONT_SCALE * 4,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        marginLeft: FONT_SCALE * 3,
    },
    cardContent: {
        alignItems: 'center',
    },
    cardTitle: { fontSize: FONT_SCALE * 4.5, fontWeight: 'bold' },
    cardDescription: { fontSize: FONT_SCALE * 3.5, marginTop: 4 },
    noDataContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: FONT_SCALE * 5,
    },
    noDataText: {
        fontSize: FONT_SCALE * 3.5,
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: FONT_SCALE * 2.5,
        paddingHorizontal: FONT_SCALE * 2.5,
        paddingBottom: FONT_SCALE * 2.5,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: FONT_SCALE * 2,
        marginBottom: FONT_SCALE * 1.25,
    },
    legendColor: {
        width: FONT_SCALE * 2.5,
        height: FONT_SCALE * 2.5,
        borderRadius: FONT_SCALE * 1.25,
        marginRight: FONT_SCALE * 1.25,
    },
    legendText: {
        fontSize: FONT_SCALE * 3,
    },
});

export default WeeklyRoutineChart;
