import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../context/ThemeContext';

// Reusable Card Components
const Card = ({ children, style = {} }) => {
    const { colors } = useTheme();
    return <View style={[styles.card, { backgroundColor: colors.focusCardBg || '#FFF' }, style]}>{children}</View>;
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
const RankTitle = ({ rank, color }) => (
    <View style={[styles.rankBadge, { backgroundColor: color }]}>
        <Ionicons name="star" size={14} color="#FFF" />
        <Text style={styles.rankText}>{rank}</Text>
    </View>
);
const ProgressBar = ({ progress, color }) => (
    <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
);


const AchievementPath = ({ data, userRank }) => {
    const { colors } = useTheme();
    if (!data) return null;

    const tierColors = {
        beginner: '#C08453', // Soft Bronze
        intermediate: '#A8A8A8', // Soft Silver/Gray
        master: '#D4AF37',   // Soft Gold
    };

    const rankColorMap = {
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

                    {Object.entries(data).map(([tier, achievements]) => (
                        <View key={tier}>
                            <View style={[styles.tierBadge, { backgroundColor: tierColors[tier] }]}>
                                <Text style={styles.tierText}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                            </View>

                            {achievements.map((ach, index) => (
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
                                                size={20} 
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
                                            
                                            {!ach.unlocked && ach.progress !== undefined && (
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
    card: { borderRadius: 24 },
    cardHeader: { padding: 20, paddingBottom: 10 },
    cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardContent: { paddingHorizontal: 20, paddingBottom: 20 },
    cardTitle: { fontSize: 22, fontWeight: '700' },
    cardDescription: { fontSize: 15, marginTop: 4, opacity: 0.7 },
    rankBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18 },
    rankText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },
    
    pathContainer: { position: 'relative' },
    pathLine: { position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, zIndex: 0 },
    
    tierContainer: { },
    tierBadge: { alignSelf: 'flex-start', marginLeft: 50, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 18, marginVertical: 16 },
    tierText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    
    achievementRow: { position: 'relative', justifyContent: 'center' },
    nodeDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 4, position: 'absolute', left: 16, top: 22, zIndex: 1, },
    
    achievementCard: { 
        marginLeft: 50, 
        padding: 16, 
        borderRadius: 18, 
        flexDirection: 'row', 
        alignItems: 'center', 
        minHeight: 70,
        elevation: 3,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // --- THE FIX IS HERE: Added margin to create space between cards ---
        marginBottom: 16,
    },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    achievementTextContainer: { marginLeft: 16, flex: 1 },
    achievementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    achievementName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
    xpText: { fontSize: 14, fontWeight: 'bold' },
    achievementDesc: { fontSize: 13, opacity: 0.8 },
    
    progressWrapper: { marginTop: 8 },
    progressContainer: { height: 8, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 4, width: '100%' },
    progressBar: { height: 8, borderRadius: 4 },
    progressText: { fontSize: 11, opacity: 0.7, alignSelf: 'flex-end', marginTop: 3, fontWeight: '500' },
});

export default AchievementPath;