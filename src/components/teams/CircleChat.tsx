import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText } from '@/components/ui/AppText';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { tapLight } from '@/lib/haptics';
import { formatRequestOn } from '@/lib/split';
import { fonts, layout, radius, space } from '@/theme';
import type { CircleMessage } from '@/types';

type Props = {
  title: string;
  messages: CircleMessage[];
  onSend: (text: string) => void;
};

export function CircleChat({ title, messages, onSend }: Props) {
  const { colors } = useResolvedTheme();
  const [draft, setDraft] = useState('');
  const thread = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => thread.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    tapLight();
    onSend(text);
    setDraft('');
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.row}>
        <AppText variant="overline" tone="muted" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <ScrollView
        ref={thread}
        style={styles.thread}
        contentContainerStyle={styles.threadBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <AppText variant="caption" tone="muted">
            No messages yet.
          </AppText>
        ) : (
          messages.map((item) => (
            <View key={item.id} style={styles.msg}>
              <AppText variant="overline" tone="muted">
                {item.author} · {formatRequestOn(item.at) ?? ''}
              </AppText>
              <AppText variant="caption">{item.text}</AppText>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.compose}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={colors.muted}
          onSubmitEditing={send}
          returnKeyType="send"
          style={[
            styles.field,
            { color: colors.text, borderColor: colors.line, backgroundColor: colors.well },
          ]}
        />
        <Pressable
          onPress={send}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={[styles.send, { backgroundColor: colors.accent }]}>
          <Ionicons name="send" size={13} color={colors.background} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: layout.infoDock,
    borderTopWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: 6,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  title: {
    flexShrink: 1,
    textAlign: 'right',
  },
  thread: {
    flex: 1,
  },
  threadBody: {
    gap: 6,
    paddingTop: 2,
  },
  msg: {
    gap: 1,
  },
  compose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  field: {
    flex: 1,
    minWidth: 0,
    height: 32,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  send: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
