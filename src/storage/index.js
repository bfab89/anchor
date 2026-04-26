import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MOOD_ENTRIES: 'anchor_mood_entries',
  JOURNAL_ENTRIES: 'anchor_journal_entries',
  SAFETY_PLAN: 'anchor_safety_plan',
};

export async function getMoodEntries() {
  try {
    const data = await AsyncStorage.getItem(KEYS.MOOD_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveMoodEntry(entry) {
  try {
    const entries = await getMoodEntries();
    const updated = [entry, ...entries].slice(0, 90);
    await AsyncStorage.setItem(KEYS.MOOD_ENTRIES, JSON.stringify(updated));
  } catch {}
}

export async function getJournalEntries() {
  try {
    const data = await AsyncStorage.getItem(KEYS.JOURNAL_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveJournalEntry(entry) {
  try {
    const entries = await getJournalEntries();
    const updated = [entry, ...entries];
    await AsyncStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(updated));
  } catch {}
}

export async function deleteJournalEntry(id) {
  try {
    const entries = await getJournalEntries();
    const updated = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(updated));
  } catch {}
}

const DEFAULT_SAFETY_PLAN = {
  warningSigns: [],
  copingStrategies: [],
  supportContacts: [],
  professionalResources: [],
  safeEnvironment: [],
  reasonsForLiving: [],
};

export async function getSafetyPlan() {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAFETY_PLAN);
    return data ? { ...DEFAULT_SAFETY_PLAN, ...JSON.parse(data) } : { ...DEFAULT_SAFETY_PLAN };
  } catch {
    return { ...DEFAULT_SAFETY_PLAN };
  }
}

export async function saveSafetyPlan(plan) {
  try {
    await AsyncStorage.setItem(KEYS.SAFETY_PLAN, JSON.stringify(plan));
  } catch {}
}
