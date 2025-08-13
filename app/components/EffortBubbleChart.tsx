import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

// Reusable Card Components
const Card = ({ children, style = {} }) => {
    const { colors } = useTheme();
    return <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#18202e', shadowColor: colors.shadowColor || '#000' }, style]}>{children}</View>;
};
const CardHeader = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
const CardContent = ({ children, style }) => <View style={[styles.cardContent, style]}>{children}</View>;
const CardTitle = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardTitle, { color: colors.textColor }]}>{children}</Text>;
};
const CardDescription = ({ children }) => {
    const { colors } = useTheme();
    return <Text style={[styles.cardDescription, { color: colors.noSessionsSubText }]}>{children}</Text>;
};

// Individual Bubble Component
const Bubble = ({ bubbleData }) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: bubbleData.x.value }, { translateY: bubbleData.y.value }],
        };
    });

    return (
        <Animated.View style={[
            styles.bubble,
            {
                width: bubbleData.size,
                height: bubbleData.size,
                borderRadius: bubbleData.size / 2,
                backgroundColor: bubbleData.fill,
            },
            animatedStyle
        ]}>
            <Text style={styles.bubbleText}>{`${bubbleData.name}\n${bubbleData.hours}h`}</Text>
        </Animated.View>
    );
};


const EffortBubbleChart = ({ data }) => {
    const { colors } = useTheme();
    const [bubbles, setBubbles] = useState([]);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (data && data.length > 0 && containerSize.width > 0) {
            const topEffortData = data.sort((a, b) => b.hours - a.hours).slice(0, 5);
            if (topEffortData.length === 0) {
                setBubbles([]);
                return;
            }
            const maxHours = topEffortData[0].hours || 1;

            const initializedBubbles = topEffortData.map(d => {
                const size = 60 + (d.hours / maxHours) * 80;
                return {
                    ...d,
                    size,
                    x: useSharedValue(Math.random() * (containerSize.width - size)),
                    y: useSharedValue(Math.random() * (containerSize.height - size)),
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                };
            });
            setBubbles(initializedBubbles);
        }
    }, [data, containerSize.width, containerSize.height]);

    useEffect(() => {
        if (bubbles.length === 0) return;

        let animationFrameId;
        const animate = () => {
            bubbles.forEach(bubble => {
                let newX = bubble.x.value + bubble.vx;
                let newY = bubble.y.value + bubble.vy;

                if (newX < 0 || newX > containerSize.width - bubble.size) bubble.vx *= -1;
                if (newY < 0 || newY > containerSize.height - bubble.size) bubble.vy *= -1;
                
                newX = Math.max(0, Math.min(newX, containerSize.width - bubble.size));
                newY = Math.max(0, Math.min(newY, containerSize.height - bubble.size));

                bubble.x.value = withTiming(newX, { duration: 16 });
                bubble.y.value = withTiming(newY, { duration: 16 });
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [bubbles]);

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="apps-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>Effort Balance</CardTitle>
                        <CardDescription>Your top 5 focus areas.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent
                style={styles.chartContainer}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    if (containerSize.width !== width || containerSize.height !== height) {
                       setContainerSize({ width, height });
                    }
                }}
            >
                {bubbles.length > 0 ? bubbles.map(bubble => (
                    <Bubble key={bubble.name} bubbleData={bubble} />
                )) : (
                    <View style={styles.placeholder}>
                        <Text style={{color: colors.noSessionsSubText}}>Not enough data for effort balance.</Text>
                    </View>
                )}
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: { borderRadius: 16 },
    cardHeader: { padding: 16 },
    cardHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
    cardContent: { padding: 0, overflow: 'hidden' },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    chartContainer: { height: 250, position: 'relative' },
    bubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    bubbleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default EffortBubbleChart;
