import { Ionicons } from '@expo/vector-icons';
import React from 'react';
// Import Dimensions to get screen size information
import { Dimensions, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
// Create a base unit for scaling font sizes and spacing, proportional to the screen width.
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

// Define the type for the data object passed to RoutineBalanceChart.
type RoutineBalanceChartData = {
    morning: number;
    evening: number;
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


const RoutineBalanceChart = ({ data }: { data: RoutineBalanceChartData | null }) => {
    const { colors } = useTheme();
    if (!data) return null;

    const morningColor = '#F39C12'; // Orange for Morning
    const eveningColor = '#9B59B6'; // Purple for Evening

    return (
        <Card style={{ backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }}>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    {/* Icon size now scales with the screen */}
                    <Ionicons name="sunny-outline" size={FONT_SCALE * 7.5} color={colors.textColor} />
                    <View style={styles.headerTextContainer}>
                        <CardTitle>Routine Balance</CardTitle>
                        <CardDescription>Morning vs. Evening performance.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent style={styles.chartContent}>
                 <View style={styles.balanceRow}>
                     <Text style={[styles.balanceLabel, { color: morningColor }]}>Morning</Text>
                     <View style={[styles.progressBarContainer, { backgroundColor: colors.modalDayButtonBg }]}>
                         {/* The progress bar width is already a percentage, which is great for responsiveness */}
                         <View style={[styles.progressBar, { width: `${data.morning}%`, backgroundColor: morningColor }]} />
                     </View>
                     <Text style={[styles.balanceValue, { color: colors.textColor }]}>{data.morning}%</Text>
                 </View>
                 <View style={styles.balanceRow}>
                     <Text style={[styles.balanceLabel, { color: eveningColor }]}>Evening</Text>
                     <View style={[styles.progressBarContainer, { backgroundColor: colors.modalDayButtonBg }]}>
                         <View style={[styles.progressBar, { width: `${data.evening}%`, backgroundColor: eveningColor }]} />
                     </View>
                     <Text style={[styles.balanceValue, { color: colors.textColor }]}>{data.evening}%</Text>
                 </View>
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        // Add shadow styles here for consistency, which will apply to all cards
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        // Use responsive padding
        paddingHorizontal: FONT_SCALE * 4,
        paddingTop: FONT_SCALE * 4,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        // Use responsive margin and allow the container to grow
        marginLeft: FONT_SCALE * 3,
        flex: 1, // This allows the text container to take up available space, preventing wrapping
    },
    cardContent: {
        padding: FONT_SCALE * 4,
    },
    chartContent: {
        // Use responsive padding and gap
        paddingVertical: FONT_SCALE * 6,
        gap: FONT_SCALE * 4.5, // Increased gap for more spacing
    },
    // Use responsive font sizes, increased multipliers to make them larger
    cardTitle: { fontSize: FONT_SCALE * 5, fontWeight: 'bold' },
    cardDescription: { fontSize: FONT_SCALE * 3.8, marginTop: 4 },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    balanceLabel: {
        // Use flex instead of fixed width for better adaptability
        flex: 0.3, // Increased flex value to give more space to the label
        fontSize: FONT_SCALE * 3.8,
        fontWeight: '600',
    },
    progressBarContainer: {
        flex: 1,
        // Use responsive height and margin
        height: FONT_SCALE * 2.8,
        borderRadius: FONT_SCALE * 1.4,
        marginHorizontal: FONT_SCALE * 2.5,
    },
    progressBar: {
        height: '100%',
        borderRadius: FONT_SCALE * 1.4,
    },
    balanceValue: {
        // Use flex instead of fixed width
        flex: 0.2, // Adjusted flex for better alignment with larger text
        fontSize: FONT_SCALE * 3.8,
        fontWeight: 'bold',
        textAlign: 'right',
    },
});

export default RoutineBalanceChart;
