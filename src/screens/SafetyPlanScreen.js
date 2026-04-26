import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { getSafetyPlan, saveSafetyPlan } from '../storage';

// Sections with type: 'text' | 'contact' | 'professional'
const SECTIONS = [
  {
    key: 'warningSigns',
    type: 'text',
    icon: 'warning',
    iconColor: '#D4823A',
    title: 'Warning Signs',
    description: 'I know I may be in crisis when I notice...',
    placeholder: 'e.g. I start isolating myself',
  },
  {
    key: 'copingStrategies',
    type: 'text',
    icon: 'heart',
    iconColor: '#BC8B7A',
    title: 'Coping Strategies',
    description: 'Things I can do on my own to feel better',
    placeholder: 'e.g. Go for a walk, deep breathing',
  },
  {
    key: 'supportContacts',
    type: 'contact',
    icon: 'people',
    iconColor: '#7BA7BC',
    title: 'People I Can Contact',
    description: 'Friends or family — tap the phone icon to call directly',
  },
  {
    key: 'professionalResources',
    type: 'professional',
    icon: 'medical',
    iconColor: '#A89BC8',
    title: 'Professional Resources',
    description: 'Therapists, doctors, or crisis lines',
  },
  {
    key: 'safeEnvironment',
    type: 'text',
    icon: 'home',
    iconColor: '#7EC8A4',
    title: 'Making My Environment Safe',
    description: 'Steps to reduce risk in my surroundings',
    placeholder: 'e.g. Ask a friend to hold onto medications',
  },
  {
    key: 'reasonsForLiving',
    type: 'text',
    icon: 'star',
    iconColor: '#C8A87E',
    title: 'Reasons for Living',
    description: 'What makes my life worth living',
    placeholder: 'e.g. My dog, music, my best friend',
  },
];

function openCall(number) {
  const digits = number.replace(/\D/g, '');
  Linking.openURL(`tel:${digits}`).catch(() =>
    Alert.alert('Unable to call', `Please dial ${number} manually.`)
  );
}

// ── Contact item display ──────────────────────────────────────────────────────

function ContactItemRow({ item, iconColor, onDelete }) {
  return (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.organization ? (
          <Text style={styles.contactOrg}>{item.organization}</Text>
        ) : null}
        {item.phone ? (
          <Text style={styles.contactPhone}>{item.phone}</Text>
        ) : null}
        {item.address ? (
          <Text style={styles.contactAddress}>{item.address}</Text>
        ) : null}
      </View>
      <View style={styles.contactActions}>
        {item.phone ? (
          <TouchableOpacity
            style={[styles.callIconBtn, { backgroundColor: iconColor + '18' }]}
            onPress={() => openCall(item.phone)}
          >
            <Ionicons name="call" size={18} color={iconColor} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Contact add form ──────────────────────────────────────────────────────────

function ContactForm({ type, onSave, onCancel }) {
  const isProfessional = type === 'professional';
  const [form, setForm] = useState({
    name: '',
    organization: '',
    phone: '',
    address: '',
  });

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter at least a name.');
      return;
    }
    const entry = { name: form.name.trim() };
    if (isProfessional && form.organization.trim()) entry.organization = form.organization.trim();
    if (form.phone.trim()) entry.phone = form.phone.trim();
    if (form.address.trim()) entry.address = form.address.trim();
    onSave(entry);
  };

  return (
    <View style={styles.contactForm}>
      <FormField
        label="Name *"
        value={form.name}
        onChangeText={set('name')}
        placeholder={isProfessional ? 'e.g. Dr. Smith' : 'e.g. Sarah'}
      />
      {isProfessional && (
        <FormField
          label="Organization"
          value={form.organization}
          onChangeText={set('organization')}
          placeholder="e.g. City Mental Health Clinic"
        />
      )}
      <FormField
        label="Phone number"
        value={form.phone}
        onChangeText={set('phone')}
        placeholder="e.g. 555-0100"
        keyboardType="phone-pad"
      />
      <FormField
        label="Address"
        value={form.address}
        onChangeText={set('address')}
        placeholder="e.g. 123 Main St (optional)"
      />
      <View style={styles.addInputBtns}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

// ── Main section card ─────────────────────────────────────────────────────────

function SectionCard({ section, items, onAdd, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [inputText, setInputText] = useState('');
  const isStructured = section.type === 'contact' || section.type === 'professional';

  const handleTextAdd = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAdd(section.key, trimmed);
    setInputText('');
    setAdding(false);
  }, [inputText, onAdd, section.key]);

  const handleContactAdd = useCallback(
    (entry) => {
      onAdd(section.key, entry);
      setAdding(false);
    },
    [onAdd, section.key]
  );

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

          {items.map((item, index) => {
            if (isStructured) {
              return (
                <ContactItemRow
                  key={index}
                  item={item}
                  iconColor={section.iconColor}
                  onDelete={() => handleDelete(index)}
                />
              );
            }
            return (
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
            );
          })}

          {adding ? (
            isStructured ? (
              <ContactForm
                type={section.type}
                onSave={handleContactAdd}
                onCancel={() => setAdding(false)}
              />
            ) : (
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
                    onPress={() => { setAdding(false); setInputText(''); }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleTextAdd}>
                    <Text style={styles.saveBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
              <Ionicons name="add" size={16} color={Colors.sage} />
              <Text style={styles.addBtnText}>
                {isStructured ? 'Add contact' : 'Add item'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SafetyPlanScreen() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    getSafetyPlan().then(setPlan);
  }, []);

  const updatePlan = useCallback(async (newPlan) => {
    setPlan(newPlan);
    await saveSafetyPlan(newPlan);
  }, []);

  const handleAdd = useCallback(
    (key, item) => {
      if (!plan) return;
      updatePlan({ ...plan, [key]: [...plan[key], item] });
    },
    [plan, updatePlan]
  );

  const handleDelete = useCallback(
    (key, index) => {
      if (!plan) return;
      updatePlan({ ...plan, [key]: plan[key].filter((_, i) => i !== index) });
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
            Fill this in while you're feeling stable. When you notice warning signs, work
            through it step by step — coping alone first, then reaching out to contacts, then
            professionals. Tap the green phone icon next to any contact to call them directly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  screenSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  progressCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.sagePale, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  progressText: { flex: 1, fontSize: FontSize.sm, color: Colors.sageDark, fontWeight: '500' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    marginBottom: Spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  cardDesc: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  cardBody: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, fontStyle: 'italic', paddingVertical: Spacing.sm },

  // Text items
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  itemText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 20 },

  // Contact display
  contactCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 1 },
  contactOrg: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 1 },
  contactPhone: { fontSize: FontSize.sm, color: Colors.sage, fontWeight: '600', marginBottom: 1 },
  contactAddress: { fontSize: FontSize.sm, color: Colors.textTertiary },
  contactActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  callIconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Contact form
  contactForm: { paddingTop: Spacing.sm },
  formField: { marginBottom: Spacing.sm },
  formLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  formInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    padding: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary,
    height: 44,
  },

  // Add text item
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: Spacing.sm },
  addBtnText: { fontSize: FontSize.sm, color: Colors.sage, fontWeight: '600' },
  addInputRow: { paddingTop: Spacing.sm },
  addInput: {
    borderWidth: 1.5, borderColor: Colors.sage, borderRadius: Radius.sm,
    padding: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary,
    minHeight: 48, textAlignVertical: 'top',
  },
  addInputBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  cancelBtnText: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.sage, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  saveBtnText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '700' },

  tipCard: { backgroundColor: Colors.sagePale, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md },
  tipTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.sageDark, marginBottom: Spacing.xs },
  tipText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
