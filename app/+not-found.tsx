import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Ensure this path is correct

export default function NotFoundScreen() {
    const { colors } = useTheme();

    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
                <Text style={[styles.title, { color: colors.textColor }]}>This screen does not exist.</Text>
                <Link href="/" style={styles.link}>
                    <Text style={[styles.linkText, { color: colors.accentColor }]}>Go to home screen!</Text>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 16,
    },
});
