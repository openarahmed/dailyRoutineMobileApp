// AIPersonaCoach.tsx (Premium Redesign)

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Types
type CoachSummaryItem = {
  title: string;
  desc: string;
  icon: string;
  gradientColors: string[];
};

type AIPersonaCoachProps = {
  summary: CoachSummaryItem[] | null;
};

type IconProps = { color: string; size: number };

// Icon Map
const iconMap: { [key: string]: React.FC<IconProps> } = {
  trophy: (props) => <MaterialCommunityIcons name="trophy-variant" {...props} />,
  sparkle: (props) => <MaterialCommunityIcons name="creation" {...props} />,
  rocket: (props) => <MaterialCommunityIcons name="rocket-launch" {...props} />,
  error: (props) => <MaterialCommunityIcons name="alert-circle-outline" {...props} />,
};

// Hero Card (Premium)
const HeroInsightCard = ({ item }: { item: CoachSummaryItem }) => {
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: interpolate(scale.value, [0.9, 1], [0.5, 1]),
  }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 80 });
    translateY.value = withSpring(0);
  }, []);

  const IconComponent = iconMap[item.icon] || iconMap.error;

  return (
    <Animated.View style={[styles.heroCardWrapper, animStyle]}>
      <LinearGradient
        colors={item.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <BlurView intensity={30} style={styles.heroOverlay} />
        <View style={styles.heroIcon}>
          <IconComponent color="#fff" size={40} />
        </View>
        <Text style={styles.heroTitle}>{item.title}</Text>
        <Text style={styles.heroDesc}>{item.desc}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Secondary Card (Glassmorphism)
const SecondaryInsightCard = ({
  item,
  index,
}: {
  item: CoachSummaryItem;
  index: number;
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, delay: index * 150 });
    scale.value = withSpring(1, { damping: 15, stiffness: 90, delay: index * 150 });
  }, []);

  const IconComponent = iconMap[item.icon] || iconMap.error;

  return (
    <Animated.View style={[styles.secondaryCardWrapper, animStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.secondaryPressable,
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <BlurView intensity={40} tint={colors.theme === 'dark' ? 'dark' : 'light'} style={styles.secondaryCard}>
          <LinearGradient
            colors={[item.gradientColors[0], item.gradientColors[1] + '99']}
            style={styles.secondaryIcon}
          >
            <IconComponent color="#fff" size={22} />
          </LinearGradient>
          <Text style={[styles.secondaryTitle, { color: colors.textColor }]}>{item.title}</Text>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

// Main Component
const AIPersonaCoach = ({ summary }: AIPersonaCoachProps) => {
  const { colors } = useTheme();

  if (!summary || summary.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: colors.textColor }}>No AI suggestions available yet.</Text>
      </View>
    );
  }

  const [heroInsight, ...otherInsights] = summary;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://placehold.co/100x100/a78bfa/ffffff?text=AI' }}
          style={styles.avatar}
        />
        <View>
          <Text style={[styles.headerTitle, { color: colors.textColor }]}>
            Weekly Insights from Your Coach
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textColor + '99' }]}>
            Your personal AI coach has tips for you
          </Text>
        </View>
      </View>

      {/* Hero Card */}
      {heroInsight && <HeroInsightCard item={heroInsight} />}

      {/* Secondary Cards */}
      {otherInsights.length > 0 && (
        <View>
          <Text style={[styles.subHeader, { color: colors.textColor }]}>More Suggestions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {otherInsights.map((item, index) => (
              <SecondaryInsightCard key={index} item={item} index={index} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  // Hero
  heroCardWrapper: {
    width: '100%',
  },
  heroCard: {
    borderRadius: 28,
    padding: 26,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  // Secondary
  scrollViewContent: {
    paddingHorizontal: 4,
    gap: 14,
  },
  secondaryCardWrapper: {
    borderRadius: 20,
  },
  secondaryPressable: {
    borderRadius: 20,
  },
  secondaryCard: {
    width: width * 0.42,
    height: 160,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  secondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIPersonaCoach;
