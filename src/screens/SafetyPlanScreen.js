import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { getSafetyPlan, saveSafetyPlan } from '../storage';

const SECTIONS = [
  {
    key: 'warningSigns',
    icon: 'warning',
    iconColor: '#D4823A',
    title: 'Warning Signs',
    description: 'I know I may be in crisis when I notice...',
    placeholder: 'e.g. I start isolating myself',
  },
  {
    key: 'copingStrategies',
    icon: 'heart',
    iconColor: '#BC8B7A',
    title: 'Coping Strategies',
    description: 'Things I can do on my own to feel better',
    placeholder: 'e.g. Go for a walk, deep breathing',
  },
  {
    key: 'supportContacts',
    icon: 'people',
    iconColor: '#7BA7BC',
    title: 'People I Can Contact',
    description: 'Friends or family I can reach out to',
    placeholder: 'e.g. Sarah - 555-0100',
  },
  {
    key: 'professionalResources',
    icon: 'medical',
    iconColor: '#A89BC8',
    title: 'Professional Resources',
    description: 'Therapists, doctors, or crisis lines',
    placeholder: 'e.g. My therapist Dr. Smith - 555-0200',
  },
  {
    key: 'safeEnvironment',
    icon: 'home',
    iconColor: '#7EC8A4',
    title: 'Making My Environment Safe',
    description: 'Steps to reduce risk in my surroundings',
    placeholder: 'e.g. Ask a friend to hold onto medications',
  },
  {
    key: 'reasonsForLiving',
    icon: 'star',
    iconColor: '#C8A87E',
    title: 'Reasons for Living',
    description: 'What makes my life worth living',
    placeholder: 'e.g. My dog, music, my best friend',
  },
];

function SectionCard({ section, items, onAdd, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAdd(section.key, trimmed);
    setInputText('');
    setAdding(false);
  }, [inputText, onAdd, section.key]);

  const handleDelete = useCallback(
    (index) => {
      Alert.alert('Remove Item', 'Remove this item from your safety plan?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(section.key, index) },
      ]);
    },
    [onDelete, section.key]
  );

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: section.iconColor + '20' }]}>
          <Ionicons name={section.icon} size={18} color={section.iconColor} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardDesc}>{section.description}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {items.length === 0 && !adding && (
            <Text style={styles.emptyText}>Nothing added yet. Tap + to add.</Text>
          )}

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: section.iconColor }]} />
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => handleDelete(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}

          {adding ? (
            <View style={styles.addInputRow}>
              <TextInput
                style={styles.addInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={section.placeholder}
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                multiline
                returnKeyType="done"
              />
              <View style={styles.addInputBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setAdding(false);
                    setInputText('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                  <Text style={styles.saveBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
              <Ionicons name="add" size={16} color={Colors.sage} />
              <Text style={styles.addBtnText}>Add item</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function SafetyPlanScreen() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    getSafetyPlan().then(setPlan);
  }, []);

  const updatePlan = useCallback(
    async (newPlan) => {
      setPlan(newPlan);
      await saveSafetyPlan(newPlan);
    },
    []
  );

  const handleAdd = useCallback(
    (key, text) => {
      if (!plan) return;
      const updated = { ...plan, [key]: [...plan[key], text] };
      updatePlan(updated);
    },
    [plan, updatePlan]
  );

  const handleDelete = useCallback(
    (key, index) => {
      if (!plan) return;
      const updated = {
        ...plan,
        [key]: plan[key].filter((_, i) => i !== index),
      };
      updatePlan(updated);
    },
    [plan, updatePlan]
  );

  if (!plan) return null;

  const totalItems = SECTIONS.reduce((sum, s) => sum + plan[s.key].length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Safety Plan</Text>
        <Text style={styles.screenSubtitle}>
          Your personal plan for moments of crisis. Only you can see this.
        </Text>

        <View style={styles.progressCard}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.sage} />
          <Text style={styles.progressText}>
            {totalItems === 0
              ? 'Your plan is empty. Start by adding items below.'
              : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your plan`}
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <SectionCard
            key={section.key}
            section={section}
            items={plan[section.key]}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        ))}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 How to use your safety plan</Text>
          <Text style={styles.tipText}>
            Fill in each section while you're feeling stable. When you notice warning signs, open
            this plan and work through it step by step — from coping on your own, to reaching out
            to people you trust, to contacting professionals.
          </Text>
        </View>
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
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.sagePale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.sageDark,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  cardBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.sm,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    color: Colors.sage,
    fontWeight: '600',
  },
  addInputRow: {
    paddingTop: Spacing.sm,
  },
  addInput: {
    borderWidth: 1.5,
    borderColor: Colors.sage,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  addInputBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.sage,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '700',
  },
  tipCard: {
    backgroundColor: Colors.sagePale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  tipTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.sageDark,
    marginBottom: Spacing.xs,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
