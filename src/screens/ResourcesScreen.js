import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../theme';

const RESOURCES = [
  {
    category: 'Immediate Crisis — US',
    items: [
      {
        name: '988 Suicide & Crisis Lifeline',
        desc: 'Free, confidential 24/7 support for people in distress. Call or text 988.',
        type: 'call',
        number: '988',
        secondary: { type: 'text', number: '988', label: 'Text 988' },
        color: '#C0392B',
      },
      {
        name: 'Crisis Text Line',
        desc: 'Text HOME to 741741 to reach a trained crisis counselor 24/7.',
        type: 'text',
        number: '741741',
        textBody: 'HOME',
        color: '#7BA7BC',
      },
      {
        name: 'Emergency Services',
        desc: 'If you or someone else is in immediate danger, call 911.',
        type: 'call',
        number: '911',
        color: '#C0392B',
      },
    ],
  },
  {
    category: 'Mental Health Support',
    items: [
      {
        name: 'SAMHSA National Helpline',
        desc: 'Free, confidential treatment referrals 24/7. Mental health and substance use.',
        type: 'call',
        number: '18006624357',
        displayNumber: '1-800-662-4357',
        color: Colors.sage,
      },
      {
        name: 'NAMI Helpline',
        desc: 'National Alliance on Mental Illness — information, referrals, and support.',
        type: 'call',
        number: '18009506264',
        displayNumber: '1-800-950-6264',
        color: '#7EC8A4',
      },
      {
        name: 'Mental Health America',
        desc: 'Text MHA to 741741 to connect with a crisis counselor.',
        type: 'text',
        number: '741741',
        textBody: 'MHA',
        color: '#A89BC8',
      },
    ],
  },
  {
    category: 'Specialized Support',
    items: [
      {
        name: 'The Trevor Project',
        desc: 'Crisis intervention and suicide prevention for LGBTQ+ young people.',
        type: 'call',
        number: '18664887386',
        displayNumber: '1-866-488-7386',
        secondary: { type: 'text', number: '678678', label: 'Text START' },
        color: '#BC8B7A',
      },
      {
        name: 'Veterans Crisis Line',
        desc: 'Call 988 and press 1. Support for veterans, service members, and their families.',
        type: 'call',
        number: '988',
        color: '#7BA7BC',
      },
      {
        name: 'Trans Lifeline',
        desc: 'Peer support from trans people for trans people, 24/7.',
        type: 'call',
        number: '18775658860',
        displayNumber: '1-877-565-8860',
        color: '#A89BC8',
      },
      {
        name: 'RAINN Sexual Assault Hotline',
        desc: 'Free, confidential support from trained staff for sexual assault survivors.',
        type: 'call',
        number: '18006564673',
        displayNumber: '1-800-656-4673',
        color: '#BC8B7A',
      },
      {
        name: 'National DV Hotline',
        desc: 'Domestic violence support available 24/7 — call, text, or chat.',
        type: 'call',
        number: '18007997233',
        displayNumber: '1-800-799-7233',
        secondary: { type: 'text', number: '741741', label: 'Text START' },
        color: '#D4823A',
      },
      {
        name: 'Childhelp National Child Abuse Hotline',
        desc: 'Crisis intervention and support for children and adults concerned about abuse.',
        type: 'call',
        number: '18004224453',
        displayNumber: '1-800-422-4453',
        color: '#C8A87E',
      },
    ],
  },
  {
    category: 'International Resources',
    items: [
      {
        name: 'International Association for Suicide Prevention',
        desc: 'Lists crisis centres in over 50 countries at iasp.info/resources/Crisis_Centres',
        type: 'info',
        color: Colors.sage,
      },
      {
        name: 'Befrienders Worldwide',
        desc: 'Global network of crisis support. Find a centre at befrienders.org',
        type: 'info',
        color: Colors.sageLight,
      },
    ],
  },
];

function openCall(number) {
  Linking.openURL(`tel:${number}`).catch(() =>
    Alert.alert('Unable to call', `Please dial ${number} manually.`)
  );
}

function openText(number, body) {
  const url = body ? `sms:${number}?body=${encodeURIComponent(body)}` : `sms:${number}`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Unable to open messages', `Please text ${body || ''} to ${number} manually.`)
  );
}

function ResourceCard({ item }) {
  const handlePrimary = useCallback(() => {
    if (item.type === 'call') openCall(item.number);
    else if (item.type === 'text') openText(item.number, item.textBody);
  }, [item]);

  const handleSecondary = useCallback(() => {
    if (!item.secondary) return;
    if (item.secondary.type === 'call') openCall(item.secondary.number);
    else if (item.secondary.type === 'text') openText(item.secondary.number, item.secondary.textBody);
  }, [item]);

  return (
    <View style={[styles.resourceCard, { borderLeftColor: item.color }]}>
      <Text style={styles.resourceName}>{item.name}</Text>
      <Text style={styles.resourceDesc}>{item.desc}</Text>

      {item.displayNumber && (
        <Text style={styles.resourceNumber}>{item.displayNumber}</Text>
      )}

      {item.type !== 'info' && (
        <View style={styles.resourceBtns}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: item.color }]}
            onPress={handlePrimary}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.type === 'call' ? 'call' : 'chatbubble-ellipses'}
              size={14}
              color={Colors.white}
            />
            <Text style={styles.actionBtnText}>
              {item.type === 'call'
                ? `Call ${item.displayNumber || item.number}`
                : `Text ${item.number}`}
            </Text>
          </TouchableOpacity>

          {item.secondary && (
            <TouchableOpacity
              style={[styles.actionBtnOutline, { borderColor: item.color }]}
              onPress={handleSecondary}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.secondary.type === 'call' ? 'call-outline' : 'chatbubble-ellipses-outline'}
                size={14}
                color={item.color}
              />
              <Text style={[styles.actionBtnOutlineText, { color: item.color }]}>
                {item.secondary.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function ResourcesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Crisis Resources</Text>
        <Text style={styles.screenSubtitle}>Real help from real people, available 24/7.</Text>

        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.sageDark} />
          <Text style={styles.offlineBannerText}>
            All numbers saved offline — no internet needed. Tap to call or text.
          </Text>
        </View>

        {RESOURCES.map((group) => (
          <View key={group.category} style={styles.group}>
            <Text style={styles.groupTitle}>{group.category}</Text>
            {group.items.map((item) => (
              <ResourceCard key={item.name} item={item} />
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You deserve support. Reaching out is brave, not weak.
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
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.sagePale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.sageDark,
    lineHeight: 18,
  },
  group: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  resourceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  resourceName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  resourceNumber: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resourceBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.round,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '700',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.round,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
