import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { getMoodEntries, saveMoodEntry } from '../storage';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Very Low' },
  { value: 2, emoji: '😟', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const AFFIRMATIONS = [
  'You have survived every difficult day so far.',
  'It\'s okay to take this one moment at a time.',
  'Asking for help is a sign of strength.',
  'Your feelings are valid, whatever they are.',
  'Recovery isn\'t linear — every small step counts.',
  'You matter, and your presence makes a difference.',
  'It\'s okay not to be okay. Be gentle with yourself.',
  'You are worthy of care, rest, and support.',
  'Difficult roads often lead to beautiful destinations.',
  'You don\'t have to face this alone.',
];

const QUICK_TOOLS = [
  { name: 'Breathe', icon: 'leaf', screen: 'Breathe', color: '#7EC8A4', desc: 'Calm your nervous system' },
  { name: 'Safety Plan', icon: 'shield-checkmark', screen: 'Safety Plan', color: '#7BA7BC', desc: 'Your personal action plan' },
  { name: 'Resources', icon: 'call', screen: 'Resources', color: '#BC8B7A', desc: 'Crisis lines & support' },
  { name: 'Journal', icon: 'book', screen: 'Journal', color: '#A89BC8', desc: 'Track your feelings' },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const [todayMood, setTodayMood] = useState(null);
  const [affirmation] = useState(
    () => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
  );

  const loadTodayMood = useCallback(async () => {
    const entries = await getMoodEntries();
    const today = entries.find((e) => e.date === todayKey());
    if (today) setTodayMood(today.value);
  }, []);

  useEffect(() => {
    loadTodayMood();
    const unsubscribe = navigation.addListener('focus', loadTodayMood);
    return unsubscribe;
  }, [loadTodayMood, navigation]);

  const handleMoodSelect = useCallback(async (mood) => {
    if (todayMood !== null) {
      Alert.alert(
        'Update mood?',
        `You already logged ${MOODS[todayMood - 1].label} today. Update to ${mood.label}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            onPress: async () => {
              await saveMoodEntry({ value: mood.value, date: todayKey(), time: new Date().toISOString() });
              setTodayMood(mood.value);
            },
          },
        ]
      );
      return;
    }
    await saveMoodEntry({ value: mood.value, date: todayKey(), time: new Date().toISOString() });
    setTodayMood(mood.value);
  }, [todayMood]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/anchor-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Anchor</Text>
            </View>
          </View>
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={14} color={Colors.sageDark} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        </View>

        {/* Mood Check-In */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {todayMood ? '✓ Today\'s Check-In' : 'How are you feeling right now?'}
          </Text>
          {todayMood && (
            <Text style={styles.todayMoodLabel}>
              You logged: {MOODS[todayMood - 1].emoji} {MOODS[todayMood - 1].label}
            </Text>
          )}
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.moodBtn,
                  todayMood === m.value && styles.moodBtnSelected,
                ]}
                onPress={() => handleMoodSelect(m)}
                activeOpacity={0.75}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, todayMood === m.value && styles.moodLabelSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tools */}
        <Text style={styles.sectionTitle}>Quick Tools</Text>
        <View style={styles.grid}>
          {QUICK_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.name}
              style={styles.toolCard}
              onPress={() => navigation.navigate(tool.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: tool.color + '28' }]}>
                <Ionicons name={tool.icon} size={26} color={tool.color} />
              </View>
              <Text style={styles.toolName}>{tool.name}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Affirmation */}
        <View style={styles.affirmCard}>
          <Text style={styles.affirmLabel}>Today's Reminder</Text>
          <Text style={styles.affirmText}>"{affirmation}"</Text>
        </View>

        {/* Crisis Banner */}
        <TouchableOpacity
          style={styles.crisisBanner}
          onPress={() => navigation.navigate('Resources')}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color={Colors.danger} />
          <Text style={styles.crisisText}>
            In crisis right now? Tap for immediate help
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  brandName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sagePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  offlineText: {
    fontSize: FontSize.xs,
    color: Colors.sageDark,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  todayMoodLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  moodBtn: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginHorizontal: 2,
  },
  moodBtnSelected: {
    backgroundColor: Colors.sagePale,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: Colors.sageDark,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  toolCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  toolName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  affirmCard: {
    backgroundColor: Colors.sage,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  affirmLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  affirmText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  crisisText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '600',
  },
});
