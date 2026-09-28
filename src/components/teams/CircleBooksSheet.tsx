import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { catalogMonthly } from '@/data/services';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { circleDeals, fundIdeas, powerSteps } from '@/lib/buying';
import { emptyBooks, parseDollars } from '@/lib/books';
import { createId } from '@/lib/id';
import { tapLight } from '@/lib/haptics';
import { PAYMENT_OPTIONS, venmoTag } from '@/lib/pay';
import { formatRequestOn, intervalCadence, money, shareAmount } from '@/lib/split';
import { fonts, radius, space } from '@/theme';
import type { CircleBooks, CircleBorrow, CircleFund, Team } from '@/types';

type Props = {
  open: boolean;
  team?: Team;
  onClose: () => void;
  onOpenSplit: () => void;
  onChangeBooks: (books: CircleBooks) => void;
};

type Editor =
  | { kind: 'fund'; item: CircleFund; isNew: boolean }
  | { kind: 'borrow'; item: CircleBorrow; isNew: boolean }
  | null;

const blankFund = (): CircleFund => ({
  id: createId('fund'),
  name: '',
  amount: '',
  target: '',
  note: '',
});

const blankBorrow = (): CircleBorrow => ({
  id: createId('borrow'),
  name: '',
  limit: '',
  used: '',
  note: '',
});

export function CircleBooksSheet({ open, team, onClose, onOpenSplit, onChangeBooks }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const books = team?.books ?? emptyBooks();
  const split = team?.split;
  const catalog = catalogMonthly(team?.serviceIds ?? []);
  const total = split?.total !== undefined ? split.total : catalog;
  const share = split ? shareAmount(total, split.ways) : 0;
  const route = PAYMENT_OPTIONS.find((item) => item.id === split?.route)?.label ?? 'None';
  const splitting = split?.mode === 'equal';
  const nextOn = formatRequestOn(split?.nextAt);
  const venmoReady = (team?.members ?? []).filter((person) => venmoTag(person.venmo)).length;
  const venmoTotal = team?.members.length ?? 0;
  const power = powerSteps(team);
  const deals = circleDeals(team);
  const ideas = fundIdeas(team);
  const [editor, setEditor] = useState<Editor>(null);

  useEffect(() => {
    if (!open) setEditor(null);
  }, [open]);

  const saveFund = (item: CircleFund, isNew: boolean) => {
    const next = isNew ? [...books.funds, item] : books.funds.map((row) => (row.id === item.id ? item : row));
    onChangeBooks({ ...books, funds: next });
  };

  const saveBorrow = (item: CircleBorrow, isNew: boolean) => {
    const next = isNew ? [...books.borrow, item] : books.borrow.map((row) => (row.id === item.id ? item : row));
    onChangeBooks({ ...books, borrow: next });
  };

  const removeFund = (id: string) => onChangeBooks({ ...books, funds: books.funds.filter((row) => row.id !== id) });
  const removeBorrow = (id: string) =>
    onChangeBooks({ ...books, borrow: books.borrow.filter((row) => row.id !== id) });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
          <Pressable
            onPress={() => undefined}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.line,
                paddingBottom: Math.max(insets.bottom, space.lg),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.line }]} />
            <View style={styles.head}>
              <AppText variant="title" numberOfLines={1}>
                {team?.name.trim() || 'Power'}
              </AppText>
            </View>
            <View style={styles.totals}>
                {power.map((step) => (
                <Stat key={step.id} label={step.label} value={step.detail} hint={step.done ? 'Ready' : 'Open'} />
              ))}
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.page}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={onOpenSplit}
                accessibilityRole="button"
                accessibilityLabel="Open split"
                style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                <View style={styles.cardCopy}>
                  <AppText variant="overline" tone="muted">
                    Split
                  </AppText>
                  <AppText variant="bodyBold">
                    {splitting ? `${money(share)} each · ${split?.ways ?? 0} ways` : 'Not splitting yet'}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {splitting && split?.route === 'venmo'
                      ? `Venmo · ${venmoReady}/${venmoTotal} connected${nextOn ? ` · next ${nextOn}` : ''}`
                      : splitting
                        ? `${route} · ${intervalCadence(split?.interval ?? 'monthly')}${nextOn ? ` · next ${nextOn}` : ''}`
                        : 'Off'}
                  </AppText>
                </View>
                <Ionicons name="options-outline" size={18} color={colors.muted} />
              </Pressable>

              {deals.length > 0 ? (
                <View style={styles.section}>
                  <AppText variant="overline" tone="muted">
                    Plans
                  </AppText>
                  {deals.map((deal) => (
                    <View
                      key={deal.id}
                      style={[styles.item, { borderColor: colors.line, backgroundColor: colors.background }]}>
                      <View style={styles.itemCopy}>
                        <AppText variant="bodyBold" numberOfLines={1}>
                          {deal.name}
                        </AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={2}>
                          {deal.line}
                        </AppText>
                      </View>
                      {deal.seats > 0 ? <FillBar value={deal.filled} cap={deal.seats} /> : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {ideas.length > 0 ? (
                <View style={styles.wrap}>
                  {ideas.map((idea) => (
                    <Pressable
                      key={`${idea.kind}-${idea.name}`}
                      onPress={() => {
                        tapLight();
                        if (idea.kind === 'fund') {
                          setEditor({
                            kind: 'fund',
                            isNew: true,
                            item: {
                              ...blankFund(),
                              name: idea.name,
                              target: idea.target ?? '',
                              note: idea.note,
                            },
                          });
                          return;
                        }
                        setEditor({
                          kind: 'borrow',
                          isNew: true,
                          item: {
                            ...blankBorrow(),
                            name: idea.name,
                            limit: idea.limit ?? '',
                            note: idea.note,
                          },
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${idea.name}`}
                      style={[styles.idea, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                      <AppText variant="caption" tone="accent">
                        {idea.kind === 'borrow' ? `Card · ${idea.name}` : idea.name}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Section
                label="Funds"
                hint="Pooled cash"
                action="Add"
                onAdd={() => {
                  tapLight();
                  setEditor({ kind: 'fund', item: blankFund(), isNew: true });
                }}>
                {books.funds.length === 0 ? (
                  <AppText variant="caption" tone="muted">
                    Empty
                  </AppText>
                ) : (
                  books.funds.map((item) => {
                    const amount = parseDollars(item.amount);
                    const target = parseDollars(item.target);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          tapLight();
                          setEditor({ kind: 'fund', item, isNew: false });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={item.name || 'Fund'}
                        style={[styles.item, { borderColor: colors.line, backgroundColor: colors.background }]}>
                        <View style={styles.itemCopy}>
                          <AppText variant="bodyBold" numberOfLines={1}>
                            {item.name.trim() || 'Untitled pot'}
                          </AppText>
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            {target > 0 ? `${money(amount)} of ${money(target)}` : amount ? money(amount) : 'No amount'}
                          </AppText>
                        </View>
                        {target > 0 ? (
                          <FillBar value={amount} cap={target} />
                        ) : (
                          <AppText variant="caption" style={styles.mark}>
                            {amount ? money(amount) : '—'}
                          </AppText>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </Section>

              <Section
                label="Borrow"
                hint="Host card"
                action="Add"
                onAdd={() => {
                  tapLight();
                  setEditor({ kind: 'borrow', item: blankBorrow(), isNew: true });
                }}>
                {books.borrow.length === 0 ? (
                  <AppText variant="caption" tone="muted">
                    Empty
                  </AppText>
                ) : (
                  books.borrow.map((item) => {
                    const limit = parseDollars(item.limit);
                    const used = parseDollars(item.used);
                    const open = Math.max(0, limit - used);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          tapLight();
                          setEditor({ kind: 'borrow', item, isNew: false });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={item.name || 'Pooled card'}
                        style={[styles.item, { borderColor: colors.line, backgroundColor: colors.background }]}>
                        <View style={styles.itemCopy}>
                          <AppText variant="bodyBold" numberOfLines={1}>
                            {item.name.trim() || 'Untitled card'}
                          </AppText>
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            {limit ? `${money(used)} of ${money(limit)} used` : 'No limit'}
                          </AppText>
                        </View>
                        <AppText variant="caption" style={styles.mark}>
                          {limit ? money(open) : '—'}
                        </AppText>
                      </Pressable>
                    );
                  })
                )}
              </Section>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
      <BookEditor
        editor={editor}
        onClose={() => setEditor(null)}
        onSaveFund={(item, isNew) => {
          saveFund(item, isNew);
          setEditor(null);
        }}
        onSaveBorrow={(item, isNew) => {
          saveBorrow(item, isNew);
          setEditor(null);
        }}
        onRemoveFund={(id) => {
          removeFund(id);
          setEditor(null);
        }}
        onRemoveBorrow={(id) => {
          removeBorrow(id);
          setEditor(null);
        }}
      />
    </Modal>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
      <AppText variant="bodyBold" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {hint}
      </AppText>
    </View>
  );
}

function FillBar({ value, cap }: { value: number; cap: number }) {
  const { colors } = useResolvedTheme();
  const pct = cap > 0 ? Math.min(1, Math.max(0, value / cap)) : 0;
  return (
    <View style={[styles.bar, { backgroundColor: colors.well }]}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

function Section({
  label,
  hint,
  action,
  onAdd,
  children,
}: {
  label: string;
  hint: string;
  action: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  const { colors } = useResolvedTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionCopy}>
          <AppText variant="overline" tone="muted">
            {label}
          </AppText>
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        </View>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={action}
          style={[styles.add, { borderColor: colors.line }]}>
          <AppText variant="caption" tone="accent">
            {action}
          </AppText>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function BookEditor({
  editor,
  onClose,
  onSaveFund,
  onSaveBorrow,
  onRemoveFund,
  onRemoveBorrow,
}: {
  editor: Editor;
  onClose: () => void;
  onSaveFund: (item: CircleFund, isNew: boolean) => void;
  onSaveBorrow: (item: CircleBorrow, isNew: boolean) => void;
  onRemoveFund: (id: string) => void;
  onRemoveBorrow: (id: string) => void;
}) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const fund = editor?.kind === 'fund' ? editor.item : null;
  const borrow = editor?.kind === 'borrow' ? editor.item : null;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!editor) return;
    if (editor.kind === 'fund') {
      setName(editor.item.name);
      setAmount(editor.item.amount);
      setTarget(editor.item.target);
      setNote(editor.item.note);
      return;
    }
    setName(editor.item.name);
    setLimit(editor.item.limit);
    setUsed(editor.item.used);
    setNote(editor.item.note);
  }, [editor]);

  return (
    <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => undefined}
          style={[
            styles.editor,
            {
              backgroundColor: colors.background,
              borderColor: colors.line,
              paddingBottom: Math.max(insets.bottom, space.xl),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          <AppText variant="overline" tone="accent">
            {editor?.kind === 'borrow' ? 'Borrow' : 'Fund'}
          </AppText>
          <AppText variant="title">{editor?.kind === 'borrow' ? 'Card' : 'Fund'}</AppText>
          <TextField
            compact
            value={name}
            onChangeText={setName}
            placeholder={editor?.kind === 'borrow' ? 'Card name' : 'Pot name'}
            autoCapitalize="words"
          />
          {fund ? (
            <>
              <TextField compact value={amount} onChangeText={setAmount} placeholder="In the pot" keyboardType="decimal-pad" />
              <TextField compact value={target} onChangeText={setTarget} placeholder="Target (optional)" keyboardType="decimal-pad" />
            </>
          ) : (
            <>
              <TextField compact value={limit} onChangeText={setLimit} placeholder="Limit" keyboardType="decimal-pad" />
              <TextField compact value={used} onChangeText={setUsed} placeholder="Used" keyboardType="decimal-pad" />
            </>
          )}
          <TextField compact value={note} onChangeText={setNote} placeholder="Note" />
          <Button
            label="Save"
            onPress={() => {
              if (!editor) return;
              if (editor.kind === 'fund') {
                onSaveFund({ ...editor.item, name: name.trim(), amount: amount.trim(), target: target.trim(), note: note.trim() }, editor.isNew);
                return;
              }
              onSaveBorrow(
                { ...editor.item, name: name.trim(), limit: limit.trim(), used: used.trim(), note: note.trim() },
                editor.isNew,
              );
            }}
          />
          {!editor?.isNew ? (
            <Button
              label="Remove"
              variant="danger"
              onPress={() => {
                if (!editor) return;
                if (editor.kind === 'fund') onRemoveFund(editor.item.id);
                else onRemoveBorrow(editor.item.id);
              }}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 28, 26, 0.46)',
  },
  avoid: {
    width: '100%',
    maxHeight: '92%',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  head: {
    gap: 2,
  },
  totals: {
    flexDirection: 'row',
    gap: space.sm,
  },
  stat: {
    flex: 1,
    gap: 1,
  },
  scroll: {
    maxHeight: 420,
  },
  page: {
    gap: space.lg,
    paddingBottom: space.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  idea: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  section: {
    gap: space.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  add: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 28,
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 52,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  mark: {
    fontFamily: fonts.mono,
    letterSpacing: 0,
  },
  bar: {
    width: 52,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  editor: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.md,
  },
});
