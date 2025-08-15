import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
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

type RankTitleProps = {
    rank: string;
    color: string;
};

type ProgressBarProps = {
    progress: number;
    color: string;
};

type Achievement = {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    points?: number;
    progress?: number;
    goal?: number;
};

type AchievementData = {
    beginner: Achievement[];
    intermediate: Achievement[];
    master: Achievement[];
};

// --- Reusable Card Components (Now Type-Safe) ---
const Card: React.FC<CardProps> = ({ children, style = {} }) => {
    const { colors } = useTheme();
    return <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#FFF' }, style]}>{children}</View>;
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
const RankTitle: React.FC<RankTitleProps> = ({ rank, color }) => (
    <View style={[styles.rankBadge, { backgroundColor: color }]}>
        <Ionicons name="star" size={FONT_SCALE * 3.5} color="#FFF" />
        <Text style={styles.rankText}>{rank}</Text>
    </View>
);
const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color }) => (
    <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
);

const AchievementPath = ({ data, userRank }: { data: AchievementData | null, userRank: string | null }) => {
    const { colors } = useTheme();
    if (!data) return null;

    const tierColors = {
        beginner: '#C08453',
        intermediate: '#A8A8A8',
        master: '#D4AF37',
    };

    const rankColorMap: { [key: string]: string } = {
        Beginner: tierColors.beginner,
        Intermediate: tierColors.intermediate,
        Master: tierColors.master,
        Newcomer: colors.dividerLine,
    };

    const neutralLineColor = 'rgba(128, 128, 128, 0.3)';

    return (
        <Card style={{ backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }}>
            <CardHeader>
                <View style={styles.cardHeaderContainer}>
                    <View style={{flex: 1}}>
                        <CardTitle>Path of Progress</CardTitle>
                        <CardDescription>Your journey to self-mastery.</CardDescription>
                    </View>
                    {userRank && <RankTitle rank={userRank} color={rankColorMap[userRank]} />}
                </View>
            </CardHeader>
            <CardContent>
                <View style={styles.pathContainer}>
                    <View style={[styles.pathLine, {backgroundColor: neutralLineColor}]} />

                    {(Object.keys(data) as Array<keyof AchievementData>).map((tier) => (
                        <View key={tier}>
                            <View style={[styles.tierBadge, { backgroundColor: tierColors[tier] }]}>
                                <Text style={styles.tierText}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                            </View>

                            {data[tier].map((ach, index) => (
                                <Animatable.View 
                                    animation="fadeInUp" 
                                    duration={600} 
                                    delay={index * 100}
                                    key={ach.id} 
                                    style={styles.achievementRow}
                                >
                                    <View style={[styles.nodeDot, { backgroundColor: ach.unlocked ? tierColors[tier] : neutralLineColor, borderColor: colors.focusCardBg }]} />
                                    
                                    <View style={[styles.achievementCard, { backgroundColor: colors.backgroundColor, shadowColor: colors.shadowColor }]}>
                                        <View style={[styles.iconContainer, { backgroundColor: ach.unlocked ? tierColors[tier] : neutralLineColor }]}>
                                            <Ionicons 
                                                name={ach.unlocked ? 'checkmark' : 'lock-closed'} 
                                                size={FONT_SCALE * 5} 
                                                color={'#FFF'} 
                                            />
                                        </View>
                                        <View style={styles.achievementTextContainer}>
                                            <View style={styles.achievementHeader}>
                                                <Text style={[styles.achievementName, { color: colors.textColor }]}>{ach.name}</Text>
                                                {ach.unlocked && (
                                                    <Text style={[styles.xpText, { color: tierColors[tier] }]}>+{ach.points} XP</Text>
                                                )}
                                            </View>
                                            
                                            <Text style={[styles.achievementDesc, { color: colors.noSessionsSubText }]}>
                                                {ach.unlocked ? 'Completed!' : ach.description}
                                            </Text>
                                            
                                            {!ach.unlocked && ach.progress !== undefined && ach.goal !== undefined && (
                                                <View style={styles.progressWrapper}>
                                                    <ProgressBar progress={(ach.progress / ach.goal) * 100} color={tierColors[tier]} />
                                                    <Text style={styles.progressText}>{ach.progress} / {ach.goal}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </Animatable.View>
                            ))}
                        </View>
                    ))}
                </View>
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: { 
        borderRadius: FONT_SCALE * 6,
        width: '100%',
    },
    cardHeader: { 
        padding: FONT_SCALE * 5, 
        paddingBottom: FONT_SCALE * 2.5 
    },
    cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardContent: { 
        paddingHorizontal: FONT_SCALE * 2, // Reduced horizontal padding
        paddingBottom: FONT_SCALE * 5 
    },
    cardTitle: { 
        fontSize: FONT_SCALE * 5.5, 
        fontWeight: '700' 
    },
    cardDescription: { 
        fontSize: FONT_SCALE * 3.8, 
        marginTop: FONT_SCALE, 
        opacity: 0.7 
    },
    rankBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: FONT_SCALE * 2, 
        paddingHorizontal: FONT_SCALE * 3.5, 
        borderRadius: FONT_SCALE * 4.5 
    },
    rankText: { 
        color: '#FFF', 
        fontWeight: 'bold', 
        marginLeft: FONT_SCALE * 1.5 
    },
    pathContainer: { 
        position: 'relative',
    },
    pathLine: { 
        position: 'absolute', 
        left: FONT_SCALE * 6, // Position line from the left
        top: 0, 
        bottom: 0, 
        width: 2, 
        zIndex: 0 
    },
    tierBadge: { 
        alignSelf: 'flex-start',
        marginLeft: FONT_SCALE * 12, // Indent the badge
        paddingVertical: FONT_SCALE * 1.5, 
        paddingHorizontal: FONT_SCALE * 4, 
        borderRadius: FONT_SCALE * 4.5, 
        marginVertical: FONT_SCALE * 4 
    },
    tierText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: FONT_SCALE * 3.5 
    },
    achievementRow: { 
        position: 'relative', 
        justifyContent: 'center' 
    },
    nodeDot: { 
        width: FONT_SCALE * 4.5, 
        height: FONT_SCALE * 4.5, 
        borderRadius: FONT_SCALE * 2.25, 
        borderWidth: FONT_SCALE, 
        position: 'absolute', 
        left: FONT_SCALE * 6 - (FONT_SCALE * 4.5 / 2), // Center the dot on the line
        top: FONT_SCALE * 5.5, 
        zIndex: 1, 
    },
    achievementCard: { 
        marginLeft: FONT_SCALE * 12, // Indent the card to align with badge
        padding: FONT_SCALE * 4, 
        borderRadius: FONT_SCALE * 4.5, 
        flexDirection: 'row', 
        alignItems: 'center', 
        minHeight: FONT_SCALE * 17.5,
        elevation: 3,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: FONT_SCALE * 4,
    },
    iconContainer: { 
        width: FONT_SCALE * 10, 
        height: FONT_SCALE * 10, 
        borderRadius: FONT_SCALE * 5, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    achievementTextContainer: { 
        marginLeft: FONT_SCALE * 4, 
        flex: 1 
    },
    achievementHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: FONT_SCALE * 0.5 
    },
    achievementName: { 
        fontSize: FONT_SCALE * 4, 
        fontWeight: '600', 
        flexShrink: 1 
    },
    xpText: { 
        fontSize: FONT_SCALE * 3.5, 
        fontWeight: 'bold' 
    },
    achievementDesc: { 
        fontSize: FONT_SCALE * 3.3, 
        opacity: 0.8 
    },
    progressWrapper: { 
        marginTop: FONT_SCALE * 2 
    },
    progressContainer: { 
        height: FONT_SCALE * 2, 
        backgroundColor: 'rgba(128,128,128,0.2)', 
        borderRadius: FONT_SCALE, 
        width: '100%' 
    },
    progressBar: { 
        height: '100%', 
        borderRadius: FONT_SCALE 
    },
    progressText: { 
        fontSize: FONT_SCALE * 2.8, 
        opacity: 0.7, 
        alignSelf: 'flex-end', 
        marginTop: FONT_SCALE * 0.75, 
        fontWeight: '500' 
    },
});

export default AchievementPath;
