import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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


const RoutineBalanceChart = ({ data }) => {
    const { colors } = useTheme();
    if (!data) return null;

    const morningColor = '#F39C12'; // Orange for Morning
    const eveningColor = '#9B59B6'; // Purple for Evening

    return (
        <Card style={{ backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }}>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <Ionicons name="sunny-outline" size={24} color={colors.textColor} />
                    <View style={{ marginLeft: 12 }}>
                        <CardTitle>Routine Balance</CardTitle>
                        <CardDescription>Morning vs. Evening performance.</CardDescription>
                    </View>
                </View>
            </CardHeader>
            <CardContent style={{ paddingVertical: 24, gap: 16 }}>
                 <View style={styles.balanceRow}>
                    <Text style={[styles.balanceLabel, { color: morningColor }]}>Morning</Text>
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.modalDayButtonBg }]}>
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
    },
    cardHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    cardHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardDescription: { fontSize: 14, marginTop: 4 },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    balanceLabel: {
        width: 60,
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarContainer: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
    balanceValue: {
        width: 40,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'right',
    },
});

export default RoutineBalanceChart;
