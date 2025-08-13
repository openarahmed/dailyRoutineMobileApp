import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const CIRCLE_RADIUS = 50;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const DailyProgressCircle = ({ value, total, label, iconName, unit }) => {
    const { colors } = useTheme();
    const percentage = total ? (value / total) * 100 : value;
    const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * percentage) / 100;

    return (
        <View style={styles.circleContainer}>
            <View style={{ width: CIRCLE_RADIUS * 2, height: CIRCLE_RADIUS * 2 }}>
                <Svg height="100%" width="100%" viewBox="0 0 100 100">
                    {/* Track Circle */}
                    <Circle
                        stroke={colors.modalDayButtonBg}
                        cx="50"
                        cy="50"
                        r={CIRCLE_RADIUS - 6}
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress Arc */}
                    <Circle
                        stroke={colors.accentColor}
                        cx="50"
                        cy="50"
                        r={CIRCLE_RADIUS - 6}
                        strokeWidth="8"
                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        fill="transparent"
                    />
                </Svg>
                <View style={styles.circleContent}>
                    <Ionicons name={iconName} size={20} color={colors.textColor} />
                    <Text style={[styles.circleValue, { color: colors.textColor }]}>
                        {value}
                        <Text style={styles.circleUnit}>{unit}</Text>
                    </Text>
                </View>
            </View>
            <Text style={[styles.circleLabel, { color: colors.textColor }]}>{label}</Text>
        </View>
    );
};

const DailySummary = ({ data }) => {
    if (!data) return null;

    return (
        <View style={styles.summaryContainer}>
            <DailyProgressCircle
                value={data.completionPercent}
                label="Completion"
                unit="%"
                iconName="checkmark-done-circle-outline"
            />
            <DailyProgressCircle
                value={data.tasksDone}
                total={data.totalTasks}
                label="Tasks Done"
                unit=""
                iconName="list-outline"
            />
            <DailyProgressCircle
                value={data.hoursCompleted}
                total={data.totalHours}
                label="Hours Logged"
                unit="h"
                iconName="timer-outline"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    circleContainer: {
        alignItems: 'center',
    },
    circleContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 2,
    },
    circleUnit: {
        fontSize: 14,
        fontWeight: 'normal',
    },
    circleLabel: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DailySummary;
