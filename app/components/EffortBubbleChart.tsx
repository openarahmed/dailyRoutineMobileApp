import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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

// Type for the raw data passed to the chart
type EffortChartData = {
    name: string;
    hours: number;
    fill: string;
};

// Type for the internal state of a bubble, including position and velocity
type BubbleState = {
    name: string;
    fill: string;
    avgHours: number;
    size: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
};

// --- Reusable Card Components (Now Type-Safe) ---
const Card: React.FC<CardProps> = ({ children, style = {} }) => {
    const { colors } = useTheme();
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

// --- Bubble Component ---
const Bubble = ({ bubbleData }: { bubbleData: BubbleState }) => {
    return (
        <View style={[
            styles.bubble,
            {
                width: bubbleData.size,
                height: bubbleData.size,
                borderRadius: bubbleData.size / 2,
                backgroundColor: bubbleData.fill,
                transform: [{ translateX: bubbleData.x }, { translateY: bubbleData.y }],
            }
        ]}>
            <Text style={[styles.bubbleText, { fontSize: bubbleData.size * 0.25 }]}>{`${bubbleData.avgHours}h`}</Text>
        </View>
    );
};

// --- Main Chart Component ---
const EffortBubbleChart = ({ data }: { data: EffortChartData[] | null }) => {
    const { colors } = useTheme();
    const [bubbles, setBubbles] = useState<BubbleState[]>([]);
    const animationFrameId = useRef<number | null>(null);
    
    // --- Responsive Chart Dimensions ---
    const chartWidth = width * 0.9;
    const chartHeight = width * 0.65;

    useEffect(() => {
        if (!data || data.length === 0 || chartWidth === 0) {
            setBubbles([]);
            return;
        }

        const topEffortData = [...data].sort((a, b) => b.hours - a.hours).slice(0, 5);
        if (topEffortData.length === 0) {
            setBubbles([]);
            return;
        }

        const maxHours = topEffortData[0].hours || 1;

        const initializedBubbles: BubbleState[] = topEffortData.map(d => {
            // Bubble size is now responsive
            const size = (FONT_SCALE * 15) + (d.hours / maxHours) * (FONT_SCALE * 20);
            return {
                name: d.name,
                fill: d.fill,
                avgHours: parseFloat((d.hours / 7).toFixed(1)),
                size,
                x: Math.random() * (chartWidth - size),
                y: Math.random() * (chartHeight - size),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
            };
        });
        
        setBubbles(initializedBubbles);

    }, [data, chartWidth, chartHeight]);

    useEffect(() => {
        if (bubbles.length === 0) return;
    
        const animate = () => {
            setBubbles(currentBubbles => {
                if(currentBubbles.length === 0) return [];
                
                const newBubbles = currentBubbles.map(b => ({ ...b }));

                // Collision detection and resolution logic (no changes needed here)
                for (let i = 0; i < newBubbles.length; i++) {
                    for (let j = i + 1; j < newBubbles.length; j++) {
                        const bubble1 = newBubbles[i];
                        const bubble2 = newBubbles[j];
                        const dx = bubble2.x - bubble1.x;
                        const dy = bubble2.y - bubble1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = (bubble1.size + bubble2.size) / 2;

                        if (distance < minDistance) {
                            const angle = Math.atan2(dy, dx);
                            const overlap = minDistance - distance;
                            const resolveX = Math.cos(angle) * (overlap / 2);
                            const resolveY = Math.sin(angle) * (overlap / 2);

                            bubble1.x -= resolveX;
                            bubble1.y -= resolveY;
                            bubble2.x += resolveX;
                            bubble2.y += resolveY;

                            const tempVx = bubble1.vx;
                            const tempVy = bubble1.vy;
                            bubble1.vx = bubble2.vx;
                            bubble1.vy = bubble2.vy;
                            bubble2.vx = tempVx;
                            bubble2.vy = tempVy;
                        }
                    }
                }

                return newBubbles.map(bubble => {
                    let newX = bubble.x + bubble.vx;
                    let newY = bubble.y + bubble.vy;

                    if (newX <= 0 || newX >= chartWidth - bubble.size) bubble.vx *= -1;
                    if (newY <= 0 || newY >= chartHeight - bubble.size) bubble.vy *= -1;
                    
                    bubble.x = Math.max(0, Math.min(newX, chartWidth - bubble.size));
                    bubble.y = Math.max(0, Math.min(newY, chartHeight - bubble.size));

                    return bubble;
                });
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [bubbles.length, chartWidth, chartHeight]);

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="apps-outline" size={FONT_SCALE * 6} color={colors.textColor} />
                    <View style={styles.headerTextContainer}>
                        <CardTitle>Effort Balance</CardTitle>
                        <CardDescription>Your top 5 focus areas (avg daily hours).</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent style={[styles.chartContainer, { width: chartWidth, height: chartHeight }]}>
                {bubbles.length > 0 ? bubbles.map(bubble => (
                    <Bubble key={bubble.name} bubbleData={bubble} />
                )) : (
                    <View style={styles.placeholder}>
                        <Text style={[styles.placeholderText, {color: colors.noSessionsSubText}]}>Not enough data for effort balance.</Text>
                    </View>
                )}
            </CardContent>
            
            {bubbles.length > 0 && (
                <View style={styles.legendContainer}>
                    {bubbles.map(bubble => (
                        <View key={bubble.name} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: bubble.fill }]} />
                            <Text style={[styles.legendText, { color: colors.textColor }]}>{bubble.name}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: { 
        borderRadius: 16, 
        alignSelf: 'center', 
        marginTop: 10,
        width: width * 0.95, // Card takes up 95% of screen width
    },
    cardHeader: { 
        padding: FONT_SCALE * 4, 
        paddingBottom: FONT_SCALE * 2 
    },
    cardHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTextContainer: { marginLeft: FONT_SCALE * 3, flex: 1 },
    cardContent: { padding: 0, overflow: 'hidden', alignSelf: 'center' },
    cardTitle: { fontSize: FONT_SCALE * 4.5, fontWeight: 'bold' },
    cardDescription: { fontSize: FONT_SCALE * 3.5, marginTop: 4 },
    chartContainer: { position: 'relative' },
    bubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: FONT_SCALE * 3.5,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: FONT_SCALE * 2.5,
        paddingHorizontal: FONT_SCALE * 2.5,
        paddingBottom: FONT_SCALE * 4,
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
        marginRight: FONT_SCALE * 1.5,
    },
    legendText: {
        fontSize: FONT_SCALE * 3,
    },
});

export default EffortBubbleChart;
