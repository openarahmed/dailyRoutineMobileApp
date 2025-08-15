import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Defs, LinearGradient, Path, Stop, Svg, Text as SvgText } from 'react-native-svg';
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

const PeakTimeEnergy = ({ data }) => {
    const { colors } = useTheme();
    const chartWidth = Dimensions.get('window').width - 94; // Card padding included
    const chartHeight = 180;
    const padding = { top: 20, right: 10, bottom: 30, left: 10 };

    if (!data || data.length === 0) {
        return <Card><CardContent style={{ height: 250, justifyContent: 'center', alignItems: 'center' }}><Text style={{color: colors.noSessionsSubText}}>Not enough data for energy analysis.</Text></CardContent></Card>;
    }

    const yMax = 100;
    const chartAreaHeight = chartHeight - padding.top - padding.bottom;
    const xPoint = (index) => padding.left + (index * (chartWidth - padding.left - padding.right)) / (data.length - 1);
    const yPoint = (value) => chartHeight - padding.bottom - (value / yMax) * chartAreaHeight;

    const path = data.map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${xPoint(index)} ${yPoint(point.energy)}`;
    }).join(' ');

    const areaPath = `${path} L ${xPoint(data.length - 1)} ${chartHeight - padding.bottom} L ${xPoint(0)} ${chartHeight - padding.bottom} Z`;

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="flash-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>Peak Time & Energy</CardTitle>
                        <CardDescription>AI predicts your most productive hours.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                            <Stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </LinearGradient>
                    </Defs>
                    <Path d={areaPath} fill="url(#gradient)" />
                    <Path d={path} fill="none" stroke="#10b981" strokeWidth="2" />
                    {data.map((point, index) => (
                        <SvgText
                            key={index}
                            x={xPoint(index)}
                            y={chartHeight - padding.bottom + 15}
                            fill={colors.noSessionsSubText}
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {point.time}
                        </SvgText>
                    ))}
                </Svg>
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
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
});

export default PeakTimeEnergy;
