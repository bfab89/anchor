import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, getMoodEntries } from '../storage';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const MOODS = [
  { value: 1, emoji: '😔', label: 'Very Low', color: '#BC8B7A' },
  { value: 2, emoji: '😟', label: 'Low', color: '#C8A87E' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#A89BC8' },
  { value: 4, emoji: '🙂', label: 'Good', color: '#7BA7BC' },
  { value: 5, emoji: '😊', label: 'Great', color: '#7EC8A4' },
];

const FEELINGS = [
  'Anxious', 'Sad', 'Angry', 'Hopeless', 'Overwhelmed',
  'Numb', 'Confused', 'Lonely', 'Scared', 'Frustrated',
  'Grateful', 'Hopeful', 'Calm', 'Content', 'Proud',
  'Loved', 'Tired', 'Relieved', 'Curious', 'Strong',
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MoodPicker({ value, onChange }) {
  return (
    <View style={styles.moodRow}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.value}
          style={[styles.moodBtn, value === m.value && { backgroundColor: m.color + '22', borderColor: m.color, borderWidth: 2 }]}
          onPress={() => onChange(m.value)}
          activeOpacity={0.8}
        >
          <Text style={styles.moodEmoji}>{m.emoji}</Text>
          <Text style={[styles.moodLabel, value === m.value && { color: m.color, fontWeight: '700' }]}>
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FeelingsSelector({ selected, onToggle }) {
  return (
    <View style={styles.feelingGrid}>
      {FEELINGS.map((f) => {
        const isSelected = selected.includes(f);
        return (
          <TouchableOpacity
            key={f}
            style={[styles.feelingTag, isSelected && styles.feelingTagSelected]}
            onPress={() => onToggle(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.feelingText, isSelected && styles.feelingTextSelected]}>{f}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function NewEntryModal({ visible, onClose, onSave, targetDate = null }) {
  const [mood, setMood] = useState(3);
  const [feelings, setFeelings] = useState([]);
  const [otherFeeling, setOtherFeeling] = useState('');
  const [note, setNote] = useState('');

  const resetForm = useCallback(() => {
    setMood(3);
    setFeelings([]);
    setOtherFeeling('');
    setNote('');
  }, []);

  const handleSave = useCallback(() => {
    const createdAt = targetDate
      ? `${targetDate}T12:00:00.000Z`
      : new Date().toISOString();
    const entry = {
      id: Date.now().toString(),
      createdAt,
      mood,
      feelings,
      otherFeeling: otherFeeling.trim(),
      note: note.trim(),
    };
    onSave(entry);
    resetForm();
  }, [mood, feelings, otherFeeling, note, onSave, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const toggleFeeling = useCallback((f) => {
    setFeelings((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {targetDate ? formatDate(`${targetDate}T12:00:00.000Z`) : 'New Entry'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>How are you feeling?</Text>
            <MoodPicker value={mood} onChange={setMood} />

            <Text style={styles.fieldLabel}>Select all that apply</Text>
            <FeelingsSelector selected={feelings} onToggle={toggleFeeling} />

            <Text style={styles.fieldLabel}>Other (write your own)</Text>
            <TextInput
              style={styles.otherInput}
              value={otherFeeling}
              onChangeText={setOtherFeeling}
              placeholder="e.g. Nostalgic, Restless, Numb..."
              placeholderTextColor={Colors.textTertiary}
              maxLength={40}
            />

            <Text style={styles.fieldLabel}>Write about it (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="What's on your mind? There's no right or wrong thing to say..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed" size={13} color={Colors.textTertiary} />
              <Text style={styles.privacyText}>
                Stored only on this device. Never shared.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS.find((m) => m.value === entry.mood) || MOODS[2];

  const handleLongPress = useCallback(() => {
    Alert.alert('Delete Entry', 'Permanently remove this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
    ]);
  }, [entry.id, onDelete]);

  return (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => setExpanded((e) => !e)}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.entryHeader}>
        <View style={[styles.moodBadge, { backgroundColor: mood.color + '20' }]}>
          <Text style={styles.entryMoodEmoji}>{mood.emoji}</Text>
          <Text style={[styles.entryMoodLabel, { color: mood.color }]}>{mood.label}</Text>
        </View>
        <View style={styles.entryMeta}>
          <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
          <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textTertiary}
        />
      </View>

      {(entry.feelings.length > 0 || entry.otherFeeling) && (
        <View style={styles.entryFeelings}>
          {entry.feelings.slice(0, expanded ? undefined : 3).map((f) => (
            <View key={f} style={styles.feelingTagSmall}>
              <Text style={styles.feelingTagSmallText}>{f}</Text>
            </View>
          ))}
          {!expanded && entry.feelings.length > 3 && (
            <Text style={styles.moreText}>+{entry.feelings.length - 3}</Text>
          )}
          {entry.otherFeeling ? (
            <View style={[styles.feelingTagSmall, styles.feelingTagOther]}>
              <Text style={styles.feelingTagSmallText}>{entry.otherFeeling}</Text>
            </View>
          ) : null}
        </View>
      )}

      {entry.note ? (
        <Text style={styles.entryNote} numberOfLines={expanded ? undefined : 2}>
          {entry.note}
        </Text>
      ) : null}

      {!expanded && <Text style={styles.tapHint}>Tap to expand · Long-press to delete</Text>}
    </TouchableOpacity>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarView({ moodByDate, journalByDate, selectedDate, onSelectDate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const pad = (n) => String(n).padStart(2, '0');
  const ds = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const canGoNext = new Date(year, month + 1, 1) <= new Date();

  return (
    <View style={styles.calendar}>
      <View style={styles.calMonthRow}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.calMonthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity
          onPress={() => canGoNext && setViewDate(new Date(year, month + 1, 1))}
          style={styles.calNavBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? Colors.textPrimary : Colors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.calDayLabels}>
        {DAY_LABELS.map((d) => <Text key={d} style={styles.calDayLabel}>{d}</Text>)}
      </View>

      <View style={styles.calGrid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={styles.calCell} />;
          const dateStr = ds(day);
          const mood = moodByDate[dateStr];
          const hasJournal = !!journalByDate[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.calCell, isSelected && styles.calCellSelected, isToday && styles.calCellToday]}
              onPress={() => onSelectDate(isSelected ? null : dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.calDayNum, isSelected && styles.calDayNumSelected, isToday && !isSelected && styles.calDayNumToday]}>
                {day}
              </Text>
              <View style={styles.calDots}>
                {mood ? <View style={[styles.calDot, { backgroundColor: MOODS[mood - 1].color }]} /> : null}
                {hasJournal ? <View style={[styles.calDot, { backgroundColor: Colors.sageLight }]} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.calLegend}>
        <View style={styles.calLegendItem}>
          <View style={[styles.calDot, { backgroundColor: '#7EC8A4' }]} />
          <Text style={styles.calLegendText}>Mood check-in</Text>
        </View>
        <View style={styles.calLegendItem}>
          <View style={[styles.calDot, { backgroundColor: Colors.sageLight }]} />
          <Text style={styles.calLegendText}>Journal entry</Text>
        </View>
      </View>
    </View>
  );
}

function DayPanel({ dateStr, moodByDate, journalByDate, onAddEntry, onDeleteEntry }) {
  const mood = moodByDate[dateStr] ? MOODS[moodByDate[dateStr] - 1] : null;
  const dayEntries = journalByDate[dateStr] || [];
  const label = formatDate(`${dateStr}T12:00:00.000Z`);

  return (
    <View style={styles.dayPanel}>
      <Text style={styles.dayPanelTitle}>{label}</Text>

      <View style={styles.dayPanelMood}>
        <Ionicons name="sunny-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.dayPanelMoodLabel}>
          {mood ? `${mood.emoji} ${mood.label}` : 'No mood check-in'}
        </Text>
      </View>

      {dayEntries.length > 0 && dayEntries.map((e) => (
        <View key={e.id} style={styles.dayPanelEntry}>
          <Text style={styles.dayPanelEntryText} numberOfLines={2}>{e.note || e.feelings.join(', ') || 'Entry'}</Text>
          <TouchableOpacity onPress={() => onDeleteEntry(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.dayPanelAddBtn} onPress={onAddEntry} activeOpacity={0.8}>
        <Ionicons name="add" size={16} color={Colors.sage} />
        <Text style={styles.dayPanelAddText}>Write entry for this day</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalTargetDate, setModalTargetDate] = useState(null);

  const loadEntries = useCallback(async () => {
    const [journal, mood] = await Promise.all([getJournalEntries(), getMoodEntries()]);
    setEntries(journal);
    setMoodEntries(mood);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const moodByDate = useMemo(() => {
    const map = {};
    moodEntries.forEach((e) => { map[e.date] = e.value; });
    return map;
  }, [moodEntries]);

  const journalByDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const d = e.createdAt.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [entries]);

  const handleSave = useCallback(async (entry) => {
    await saveJournalEntry(entry);
    setEntries((prev) => [entry, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setShowModal(false);
    setModalTargetDate(null);
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const openModalForDate = useCallback((dateStr) => {
    setModalTargetDate(dateStr);
    setShowModal(true);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Journal</Text>
          <Text style={styles.screenSubtitle}>
            {entries.length === 0 ? 'Your private mood log' : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* View toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, view === 'list' && styles.viewToggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Ionicons name="list" size={16} color={view === 'list' ? Colors.white : Colors.textTertiary} />
          <Text style={[styles.viewToggleText, view === 'list' && styles.viewToggleTextActive]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, view === 'calendar' && styles.viewToggleBtnActive]}
          onPress={() => setView('calendar')}
        >
          <Ionicons name="calendar" size={16} color={view === 'calendar' ? Colors.white : Colors.textTertiary} />
          <Text style={[styles.viewToggleText, view === 'calendar' && styles.viewToggleTextActive]}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {view === 'calendar' ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <CalendarView
            moodByDate={moodByDate}
            journalByDate={journalByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {selectedDate && (
            <DayPanel
              dateStr={selectedDate}
              moodByDate={moodByDate}
              journalByDate={journalByDate}
              onAddEntry={() => openModalForDate(selectedDate)}
              onDeleteEntry={handleDelete}
            />
          )}
        </ScrollView>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📔</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyText}>
            Writing about your feelings — even just a few words — can help you understand
            and process them.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Write your first entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard entry={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NewEntryModal
        visible={showModal}
        onClose={() => { setShowModal(false); setModalTargetDate(null); }}
        onSave={handleSave}
        targetDate={modalTargetDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.round,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  viewToggleBtnActive: { backgroundColor: Colors.sage },
  viewToggleText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textTertiary },
  viewToggleTextActive: { color: Colors.white },
  // Calendar
  calendar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  calMonthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  calNavBtn: { padding: 4 },
  calMonthLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  calDayLabels: { flexDirection: 'row', marginBottom: 4 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 5, borderRadius: 6 },
  calCellToday: { backgroundColor: Colors.sagePale },
  calCellSelected: { backgroundColor: Colors.sage },
  calDayNum: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  calDayNumToday: { color: Colors.sageDark, fontWeight: '700' },
  calDayNumSelected: { color: Colors.white, fontWeight: '700' },
  calDots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  calDot: { width: 5, height: 5, borderRadius: 3 },
  calLegend: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, justifyContent: 'center' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLegendText: { fontSize: 11, color: Colors.textTertiary },
  // Day panel
  dayPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sage,
  },
  dayPanelTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  dayPanelMood: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  dayPanelMoodLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dayPanelEntry: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  dayPanelEntryText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  dayPanelAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  dayPanelAddText: { fontSize: FontSize.sm, color: Colors.sage, fontWeight: '600' },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyBtn: {
    backgroundColor: Colors.sage,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.round,
  },
  emptyBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  entryMoodEmoji: {
    fontSize: 16,
  },
  entryMoodLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  entryMeta: {
    flex: 1,
  },
  entryDate: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  entryTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  entryFeelings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  feelingTagSmall: {
    backgroundColor: Colors.sagePale,
    borderRadius: Radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  feelingTagSmallText: {
    fontSize: 11,
    color: Colors.sageDark,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
    color: Colors.textTertiary,
    alignSelf: 'center',
  },
  entryNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  // Modal
  modalSafe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCancel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  modalSave: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.sage,
  },
  modalBody: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  feelingTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feelingTagSelected: {
    backgroundColor: Colors.sagePale,
    borderColor: Colors.sage,
  },
  feelingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  feelingTextSelected: {
    color: Colors.sageDark,
    fontWeight: '600',
  },
  feelingTagOther: {
    backgroundColor: Colors.border,
  },
  otherInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: 44,
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 120,
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    justifyContent: 'center',
  },
  privacyText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
