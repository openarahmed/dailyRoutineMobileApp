import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Line, Rect, Svg, Text as SvgText } from 'react-native-svg';
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

const WeeklyRoutineChart = ({ data }) => {
    const { colors } = useTheme();
    const chartWidth = Dimensions.get('window').width - 62;
    const chartHeight = 220;
    const padding = { top: 20, right: 20, bottom: 50, left: 30 };

    const chartDataToDisplay = data && data.labels && data.labels.length > 0 ? data : { labels: [], legend: [], data: [], barColors: [] };
    
    const totalHours = chartDataToDisplay.data.flat().reduce((sum, value) => sum + value, 0);

    const yMax = Math.max(8, ...chartDataToDisplay.data.flat()) + 2; // Make Y-axis dynamic but with a minimum of 8
    const chartAreaHeight = chartHeight - padding.top - padding.bottom;
    const barWidth = chartDataToDisplay.labels.length > 0 ? ((chartWidth - padding.left - padding.right) / chartDataToDisplay.labels.length) * 0.6 : 0;
    const barMargin = chartDataToDisplay.labels.length > 0 ? ((chartWidth - padding.left - padding.right) / chartDataToDisplay.labels.length) * 0.2 : 0;

    const xPoint = (index) => padding.left + (index * (barWidth + barMargin * 2)) + barMargin;
    const yPoint = (value) => chartHeight - padding.bottom - (value / yMax) * chartAreaHeight;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="bar-chart-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
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
                                    fontSize="12"
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
                                y={chartHeight - padding.bottom + 20}
                                fill={colors.noSessionsSubText}
                                fontSize="12"
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
                                        // *** THE FIX IS HERE: rx and ry are set to 0 to remove rounded corners ***
                                        rx={0}
                                        ry={0}
                                    />
                                );
                            });
                        })}
                    </Svg>
                ) : (
                    <View style={{ height: chartHeight, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                        <Text style={{ color: colors.noSessionsSubText, fontSize: 14, textAlign: 'center' }}>
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
    },
    cardHeader: {
        padding: 16,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 10, // Added padding at the bottom
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        marginBottom: 5,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 12,
    },
});

export default WeeklyRoutineChart;