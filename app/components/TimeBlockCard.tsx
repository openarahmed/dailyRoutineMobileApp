// components/TimeBlockCard.js

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { cardColors } from '../constants/cardColors';
import SessionItem from './SessionItem';

// Type Definitions (no change)
type Session = { id: string; title: string; start: string; end:string; completed?: boolean; };
type Section = { title: string; iconName: string; data: Session[]; };
type TimeBlockCardProps = { section: Section; onToggle: (item: Session) => void; onEdit: (item: Session) => void; onDelete: (id: string) => void; };

// প্রতিটি টাইম ব্লকের আইকনের জন্য কালার অবজেক্ট
const timeBlockIconColors: { [key: string]: string } = {
  Morning: '#f1932b',
  Midday: '#1e61ef',
  Evening: '#FD5E53',
  Night: '#D8D8FF',
};

const TimeBlockCard = ({ section, onToggle, onEdit, onDelete }: TimeBlockCardProps) => {
  const colors = cardColors[section.title as keyof typeof cardColors] || cardColors.Morning;
  const iconColor = timeBlockIconColors[section.title as keyof typeof timeBlockIconColors] || '#FFFFFF';

  return (
    <View style={styles.cardContainer}>
      
      {/* লেয়ার ১: বেস গ্রেডিয়েন্ট (নিচের অংশ) */}
      <LinearGradient
        colors={colors.bottom as [string, string]}
        style={StyleSheet.absoluteFill}
      />

      {/* লেয়ার ২: টপ-লেফট কর্নারের আভা */}
      <LinearGradient
        colors={[colors.topLeft, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
        style={styles.cornerGradient}
      />

      {/* লেয়ার ৩: টপ-রাইট কর্নারের আভা */}
      <LinearGradient
        colors={[colors.topRight, 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
        style={styles.cornerGradient}
      />
      
      {/* লেয়ার ৪: মূল কন্টেন্ট */}
      <View style={styles.contentContainer}>
        <View style={styles.timeBlockHeader}>
          <MaterialIcons name={section.iconName as any} size={22} color={iconColor} />
          <Text style={styles.timeBlockTitle}>{section.title}</Text>
        </View>
        {section.data.map((item) => (
          <SessionItem key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cornerGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, 
  },
  contentContainer: {
    padding: 15,
    backgroundColor: 'transparent',
  },
  timeBlockHeader:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:15
  },
  timeBlockTitle:{
    color:'#FFFFFF',
    fontSize:20,
    fontWeight:'bold',
    marginLeft:12
  },
});

export default TimeBlockCard;