import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
// Import Animated and Easing for animations
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
// SVG components
import { Circle, Svg } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

// --- Responsive Sizing ---
// Get the full width of the device's screen
const { width } = Dimensions.get('window');

// Calculate a smaller size for each circle container to increase negative space.
// Dividing by 4.2 makes them smaller and visually lighter than before.
const ITEM_SIZE = width / 4.2;

// Create an Animated version of the SVG Circle component to allow for animation
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- TypeScript Prop Types ---
// Define the types for the component's props to fix the 'any' type error.
type DailyProgressCircleProps = {
    value: number;
    total?: number; // Make 'total' optional to fix the missing prop error.
    label: string;
    iconName: keyof typeof Ionicons.glyphMap; // Use a more specific type for icon names.
    unit: string;
    size: number;
};

// Define the type for the data object passed to DailySummary.
type DailySummaryData = {
    completionPercent: number;
    tasksDone: number;
    totalTasks: number;
    hoursCompleted: number;
    totalHours: number;
};

const DailyProgressCircle: React.FC<DailyProgressCircleProps> = ({ value, total, label, iconName, unit, size }) => {
    const { colors } = useTheme();

    // --- Animation Setup ---
    // useRef is used to hold the animated value without causing re-renders
    const animatedProgress = useRef(new Animated.Value(0)).current;

    // --- Dynamic Calculations based on the 'size' prop ---
    const radius = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = size * 0.08;
    const innerRadius = radius - strokeWidth / 2;

    // The percentage calculation now correctly handles the optional 'total' prop.
    const percentage = total && total > 0 ? (value / total) * 100 : value;

    // --- Animation Effect ---
    // useEffect triggers the animation when the component mounts or the percentage changes
    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: Math.min(percentage, 100), // Ensure value doesn't exceed 100
            duration: 800, // Animation duration in milliseconds
            easing: Easing.out(Easing.cubic), // A smooth easing function
            useNativeDriver: false, // Must be false for SVG animations
        }).start();
    }, [percentage, animatedProgress]);

    // Interpolate the animated value to calculate the strokeDashoffset
    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0], // Animate from full circumference (empty) to 0 (full)
    });

    return (
        <View style={styles.circleContainer}>
            {/* The main container for the SVG and the content inside it */}
            <View style={{ width: size, height: size }}>
                <Svg height="100%" width="100%" viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Track Circle */}
                    <Circle
                        stroke={colors.modalDayButtonBg}
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Animated Progress Arc with original solid color */}
                    <AnimatedCircle
                        stroke={colors.accentColor} // Reverted to the original solid color
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset} // Use the animated value
                        strokeLinecap="round"
                        transform={`rotate(-90 ${radius} ${radius})`}
                        fill="transparent"
                    />
                </Svg>
                {/* Content (Icon and Text) overlaid on top of the circle */}
                <View style={styles.circleContent}>
                    <Ionicons name={iconName} size={size * 0.2} color={colors.textColor} />
                    <Text style={[styles.circleValue, { color: colors.textColor, fontSize: size * 0.22 }]}>
                        {value}
                        <Text style={[styles.circleUnit, { fontSize: size * 0.14 }]}>{unit}</Text>
                    </Text>
                </View>
            </View>
            <Text style={[styles.circleLabel, { color: colors.textColor, fontSize: size * 0.13, marginTop: size * 0.15 }]}>{label}</Text>
        </View>
    );
};

// Apply the defined type to the 'data' prop.
const DailySummary = ({ data }: { data: DailySummaryData | null }) => {
    if (!data) return null;

    return (
        <View style={styles.summaryContainer}>
            <DailyProgressCircle
                size={ITEM_SIZE}
                value={data.completionPercent}
                label="Completion"
                unit="%"
                iconName="checkmark-done-circle-outline"
            />
            <DailyProgressCircle
                size={ITEM_SIZE}
                value={data.tasksDone}
                total={data.totalTasks}
                label="Tasks Done"
                unit=""
                iconName="list-outline"
            />
            <DailyProgressCircle
                size={ITEM_SIZE}
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
        alignItems: 'flex-start',
        paddingVertical: 20,
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
        fontWeight: 'bold',
        marginTop: 2,
    },
    circleUnit: {
        fontWeight: 'normal',
    },
    circleLabel: {
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default DailySummary;
