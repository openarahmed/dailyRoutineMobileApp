import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext'; // Apnar theme context er path thik kore niben

const screenWidth = Dimensions.get('window').width;

// CommunityBenchmarking component shudhu data props hishebe ney
export default function CommunityBenchmarking({ data }) {
    const { colors } = useTheme();

    // Jodi data na thake, tahole ekta message dekhano hobe
    if (!data || !data.datasets || data.datasets.length === 0 || data.datasets[0].data.every(d => d === 0)) {
        return (
            <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.title, { color: colors.textColor }]}>Community Benchmarking</Text>
                <Text style={{ color: colors.noSessionsSubText, textAlign: 'center', marginTop: 20, paddingHorizontal: 10 }}>
                    You haven't logged any study sessions yet. Complete a session to see how you compare with the community!
                </Text>
            </View>
        );
    }

    // Chart er jonno configuration object
    const chartConfig = {
        backgroundGradientFrom: colors.cardBackground,
        backgroundGradientTo: colors.cardBackground,
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
        labelColor: (opacity = 1) => colors.textColor,
        barPercentage: 0.7,
        propsForBackgroundLines: {
            strokeWidth: 1,
            stroke: 'rgba(128, 128, 128, 0.2)',
            strokeDasharray: '0',
        },
        decimalPlaces: 1,
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.title, { color: colors.textColor }]}>Daily Study Hours</Text>
            <Text style={[styles.subtitle, { color: colors.noSessionsSubText }]}>
                How your average compares to the community.
            </Text>
            <BarChart
                data={data}
                width={screenWidth - 60} // Total horizontal padding on screen (30) + component padding (30)
                height={220}
                chartConfig={chartConfig}
                withHorizontalLabels={false}
                fromZero
                showValuesOnTopOfBars
                withCustomBarColorFromData
                flatColor
                style={styles.chart}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
    subtitle: {
        fontSize: 14,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    chart: {
        marginTop: 10,
        borderRadius: 12,
    },
});
