import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../theme';

const EXERCISES = {
  box: {
    key: 'box',
    label: 'Box Breathing',
    description: '4-4-4-4 · Reduces stress and improves focus',
    phases: [
      { name: 'Inhale', duration: 4, toValue: 1 },
      { name: 'Hold', duration: 4, toValue: null },
      { name: 'Exhale', duration: 4, toValue: 0 },
      { name: 'Hold', duration: 4, toValue: null },
    ],
  },
  fourSevenEight: {
    key: 'fourSevenEight',
    label: '4-7-8 Breathing',
    description: '4-7-8 · Promotes calm and sleep',
    phases: [
      { name: 'Inhale', duration: 4, toValue: 1 },
      { name: 'Hold', duration: 7, toValue: null },
      { name: 'Exhale', duration: 8, toValue: 0 },
    ],
  },
};

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: 'SEE',
    icon: '👁',
    color: '#7EC8A4',
    prompt: 'Look around and name 5 things you can see right now.',
    examples: 'A door, a window, a plant, a phone, a cup...',
  },
  {
    count: 4,
    sense: 'TOUCH',
    icon: '🤚',
    color: '#7BA7BC',
    prompt: 'Notice 4 things you can physically feel or touch.',
    examples: 'Your clothes, the chair, the floor, the air...',
  },
  {
    count: 3,
    sense: 'HEAR',
    icon: '👂',
    color: '#A89BC8',
    prompt: 'Listen carefully for 3 sounds around you.',
    examples: 'Traffic, birds, your breathing, appliances...',
  },
  {
    count: 2,
    sense: 'SMELL',
    icon: '👃',
    color: '#BC8B7A',
    prompt: 'Identify 2 things you can smell.',
    examples: 'Air, food, soap, clothing, nature...',
  },
  {
    count: 1,
    sense: 'TASTE',
    icon: '👅',
    color: '#C8A87E',
    prompt: 'Notice 1 taste in your mouth.',
    examples: 'Mint, coffee, water, nothing — just notice.',
  },
];

const CIRCLE_MIN = 100;
const CIRCLE_MAX = 220;

function BreathingExercise({ exerciseKey }) {
  const exercise = EXERCISES[exerciseKey];
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const circleAnim = useRef(new Animated.Value(0)).current;
  const isRunningRef = useRef(false);
  const phaseTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const phaseAnimRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(phaseTimerRef.current);
    clearInterval(countdownTimerRef.current);
    if (phaseAnimRef.current) phaseAnimRef.current.stop();
  }, []);

  const runPhase = useCallback(
    (phaseIndex, currentCycle) => {
      if (!isRunningRef.current) return;

      const phases = exercise.phases;
      const phase = phases[phaseIndex % phases.length];
      const isNewCycle = phaseIndex > 0 && phaseIndex % phases.length === 0;

      setCurrentPhase(phase.name);
      setCountdown(phase.duration);
      if (isNewCycle) setCycleCount((c) => c + 1);

      if (phase.toValue !== null) {
        const anim = Animated.timing(circleAnim, {
          toValue: phase.toValue,
          duration: phase.duration * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        });
        phaseAnimRef.current = anim;
        anim.start();
      }

      let timeLeft = phase.duration;
      countdownTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft > 0 ? timeLeft : 0);
        if (timeLeft <= 0) clearInterval(countdownTimerRef.current);
      }, 1000);

      phaseTimerRef.current = setTimeout(() => {
        clearInterval(countdownTimerRef.current);
        runPhase(phaseIndex + 1, currentCycle);
      }, phase.duration * 1000);
    },
    [exercise, circleAnim]
  );

  const startBreathing = useCallback(() => {
    isRunningRef.current = true;
    setIsRunning(true);
    setCycleCount(1);
    runPhase(0, 1);
  }, [runPhase]);

  const stopBreathing = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    clearTimers();
    setCurrentPhase(null);
    setCountdown(0);
    Animated.spring(circleAnim, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  }, [clearTimers, circleAnim]);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (isRunning) stopBreathing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseKey]);

  const circleSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_MIN, CIRCLE_MAX],
  });

  const circleOpacity = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const phaseColor =
    currentPhase === 'Inhale'
      ? Colors.sage
      : currentPhase === 'Exhale'
      ? '#7BA7BC'
      : Colors.sageLight;

  return (
    <View style={styles.breatheContainer}>
      <Text style={styles.exerciseDesc}>{exercise.description}</Text>

      <View style={styles.circleWrapper}>
        <Animated.View
          style={[
            styles.circleOuter,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 110] }),
              opacity: circleOpacity,
              backgroundColor: isRunning ? phaseColor + '30' : Colors.sagePale,
              borderColor: isRunning ? phaseColor : Colors.sage,
            },
          ]}
        />
        <View style={styles.circleInner}>
          {isRunning && currentPhase ? (
            <>
              <Text style={[styles.phaseName, { color: phaseColor }]}>{currentPhase}</Text>
              <Text style={styles.countdownNum}>{countdown}</Text>
            </>
          ) : (
            <Text style={styles.circleIdle}>⚓</Text>
          )}
        </View>
      </View>

      {cycleCount > 0 && (
        <Text style={styles.cycleCount}>Cycle {cycleCount}</Text>
      )}

      <TouchableOpacity
        style={[styles.startBtn, isRunning && styles.stopBtn]}
        onPress={isRunning ? stopBreathing : startBreathing}
        activeOpacity={0.8}
      >
        <Text style={styles.startBtnText}>{isRunning ? 'Stop' : 'Begin'}</Text>
      </TouchableOpacity>

      <View style={styles.phaseGuide}>
        {exercise.phases.map((p, i) => (
          <View key={i} style={styles.phaseRow}>
            <View
              style={[
                styles.phaseDot,
                currentPhase === p.name && isRunning && { backgroundColor: Colors.sage },
              ]}
            />
            <Text style={styles.phaseGuideText}>
              {p.name} — {p.duration}s
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GroundingExercise() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const current = GROUNDING_STEPS[step];

  const handleNext = useCallback(() => {
    if (step < GROUNDING_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  }, [step]);

  const handleRestart = useCallback(() => {
    setStep(0);
    setDone(false);
  }, []);

  if (done) {
    return (
      <View style={styles.groundingDone}>
        <Text style={styles.groundingDoneEmoji}>🌿</Text>
        <Text style={styles.groundingDoneTitle}>Well done</Text>
        <Text style={styles.groundingDoneText}>
          You've completed the grounding exercise. Take a moment to notice how you feel now.
        </Text>
        <TouchableOpacity style={styles.startBtn} onPress={handleRestart} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>Do it again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.groundingContainer}>
      <View style={styles.stepIndicatorRow}>
        {GROUNDING_STEPS.map((s, i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i === step && { backgroundColor: current.color, width: 24 },
              i < step && { backgroundColor: Colors.sageLight },
            ]}
          />
        ))}
      </View>

      <View style={[styles.groundingCard, { borderLeftColor: current.color }]}>
        <Text style={[styles.groundingSense, { color: current.color }]}>
          {current.icon}  {current.count} things you can {current.sense}
        </Text>
        <Text style={styles.groundingPrompt}>{current.prompt}</Text>
        <Text style={styles.groundingExamples}>{current.examples}</Text>
      </View>

      <View style={styles.groundingDots}>
        {Array.from({ length: current.count }).map((_, i) => (
          <View key={i} style={[styles.countDot, { borderColor: current.color }]} />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: current.color }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.startBtnText}>
          {step < GROUNDING_STEPS.length - 1 ? 'Next Step' : 'Finish'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const TABS = [
  { key: 'box', label: 'Box' },
  { key: 'fourSevenEight', label: '4-7-8' },
  { key: 'grounding', label: '5-4-3-2-1' },
];

export default function BreatheScreen() {
  const [activeTab, setActiveTab] = useState('box');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Breathe & Ground</Text>
        <Text style={styles.screenSubtitle}>
          Slow your nervous system and return to the present moment.
        </Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'box' && <BreathingExercise key="box" exerciseKey="box" />}
        {activeTab === 'fourSevenEight' && (
          <BreathingExercise key="fourSevenEight" exerciseKey="fourSevenEight" />
        )}
        {activeTab === 'grounding' && <GroundingExercise />}
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
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.round,
    padding: 4,
    marginBottom: Spacing.xl,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.round,
  },
  tabActive: {
    backgroundColor: Colors.sage,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabLabelActive: {
    color: Colors.white,
  },
  breatheContainer: {
    alignItems: 'center',
    width: '100%',
  },
  exerciseDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  circleWrapper: {
    width: CIRCLE_MAX + 40,
    height: CIRCLE_MAX + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  circleOuter: {
    position: 'absolute',
    borderWidth: 2,
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIdle: {
    fontSize: 40,
    opacity: 0.5,
  },
  phaseName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  countdownNum: {
    fontSize: FontSize.xxxl,
    fontWeight: '200',
    color: Colors.textPrimary,
  },
  cycleCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  startBtn: {
    backgroundColor: Colors.sage,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.round,
    marginTop: Spacing.md,
    minWidth: 160,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#7BA7BC',
  },
  startBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phaseGuide: {
    marginTop: Spacing.xl,
    gap: 6,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  phaseGuideText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  groundingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  groundingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groundingSense: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  groundingPrompt: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  groundingExamples: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  groundingDots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  countDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  groundingDone: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  groundingDoneEmoji: {
    fontSize: 56,
  },
  groundingDoneTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  groundingDoneText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
