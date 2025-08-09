import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import SessionItem, { Session } from './SessionItem';

type Section = { title: string; iconName: string; data: Session[]; };
type TimeBlockCardProps = {
    section: Section;
    onToggle: (item: Session) => Promise<void>;
    onEdit: (item: Session) => void;
    onDelete: (id: string) => void;
};

const TimeBlockCard = ({ section, onToggle, onEdit, onDelete }: TimeBlockCardProps) => {
    const { colors, themeName } = useTheme();
    const isClassicTheme = themeName === 'classic';

    const defaultGradientColors = [colors.timeBlockCardBg, colors.timeBlockCardBg];
    const cardColors = isClassicTheme && colors.timeBlockCardGradients
        ? colors.timeBlockCardGradients[section.title as keyof typeof colors.timeBlockCardGradients]
        : null;

    const cardGradientColors = cardColors?.base || defaultGradientColors;
    const cardTopLeftGradient = cardColors?.topLeft || 'transparent';
    const cardTopRightGradient = cardColors?.topRight || 'transparent';
    const timeBlockIconColor = cardColors?.icon || colors.timeBlockIcon;

    return (
        <View style={[styles.cardContainer, { borderColor: colors.cardBorderColor }]}>
            <LinearGradient
                colors={cardGradientColors}
                style={StyleSheet.absoluteFill}
            />
            <LinearGradient
                colors={[cardTopLeftGradient, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={styles.cornerGradient}
            />
            <LinearGradient
                colors={[cardTopRightGradient, 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={styles.cornerGradient}
            />
            <View style={styles.contentContainer}>
                <View style={styles.timeBlockHeader}>
                    <MaterialIcons name={section.iconName as any} size={22} color={timeBlockIconColor} />
                    <Text style={[styles.timeBlockTitle, { color: colors.timeBlockTitleText }]}>{section.title}</Text>
                </View>
                {section.data.map((item) => (
                    <SessionItem 
                        key={item.id} 
                        item={item} 
                        onToggle={onToggle} 
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                        colors={colors}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 17,
        marginBottom: 7,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
    },
    cornerGradient: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        opacity: 0.4,
    },
    contentContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 2,
        backgroundColor: 'transparent',
    },
    timeBlockHeader:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    timeBlockTitle:{
        fontSize: 20,
        fontWeight:'bold',
        marginLeft: 10,
    },
});

export default TimeBlockCard;