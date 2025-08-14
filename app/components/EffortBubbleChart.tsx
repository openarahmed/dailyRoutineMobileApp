import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Reusable Card Components (No changes needed)
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

// Bubble component now only shows hours
const Bubble = ({ bubbleData }) => {
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
            {/* --- CHANGE: Only showing hours now, and bigger font --- */}
            <Text style={styles.bubbleText}>{`${bubbleData.avgHours}h`}</Text>
        </View>
    );
};

const EffortBubbleChart = ({ data }) => {
    const { colors } = useTheme();
    const [bubbles, setBubbles] = useState([]);
    const animationFrameId = useRef(null);
    
    const chartHeight = 250;
    const chartWidth = Dimensions.get('window').width - 32;

    useEffect(() => {
        if (!data || data.length === 0 || chartWidth === 0) {
            setBubbles([]);
            return;
        }

        const topEffortData = data.sort((a, b) => b.hours - a.hours).slice(0, 5);
        if (topEffortData.length === 0) {
            setBubbles([]);
            return;
        }

        const maxHours = topEffortData[0].hours || 1;

        const initializedBubbles = topEffortData.map(d => {
            const size = 60 + (d.hours / maxHours) * 80;
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

    }, [data]);

    useEffect(() => {
        if (bubbles.length === 0) return;
    
        const animate = () => {
            setBubbles(currentBubbles => {
                if(currentBubbles.length === 0) return [];
                
                const newBubbles = currentBubbles.map(b => ({ ...b }));

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
    }, [bubbles.length]);

    return (
        <Card>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="apps-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
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
                        <Text style={{color: colors.noSessionsSubText}}>Not enough data for effort balance.</Text>
                    </View>
                )}
            </CardContent>
            
            {/* --- NEW: Legend Section Added Here --- */}
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
    card: { borderRadius: 16, alignSelf: 'center', marginTop: 10 },
    cardHeader: { padding: 16, paddingBottom: 8 },
    cardHeaderContainer: { flexDirection: 'row', alignItems: 'center' },
    cardContent: { padding: 0, overflow: 'hidden' },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    chartContainer: { position: 'relative' },
    bubble: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    bubbleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16, // Font size increased
        textAlign: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- NEW: Styles for the Legend ---
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 16,
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
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
});

export default EffortBubbleChart;