import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { contactsAvailable, pickDeviceContact } from '@/lib/contacts';
import { tapLight } from '@/lib/haptics';
import { radius, space } from '@/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (name: string, source: 'contact' | 'new', contactId?: string) => void;
};

export function AddPersonSheet({ open, onClose, onPick }: Props) {
  const { colors } = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'choose' | 'new'>('choose');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setMode('choose');
    setName('');
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const addNew = () => {
    const next = name.trim();
    if (!next) {
      setError('Give them a name first.');
      return;
    }
    onPick(next, 'new');
    close();
  };

  const addFromContacts = async () => {
    tapLight();
    if (!contactsAvailable()) {
      setMode('new');
      setError('Contacts live on iPhone and Android. Add them by name for now.');
      return;
    }
    try {
      const picked = await pickDeviceContact();
      if (!picked) return;
      onPick(picked.name, 'contact', picked.contactId);
      close();
    } catch {
      setMode('new');
      setError('Could not open contacts. Add them by name instead.');
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          onPress={() => undefined}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.line,
              paddingBottom: Math.max(insets.bottom, space.xl),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          <AppText variant="title">{mode === 'new' ? 'New person' : 'Add person'}</AppText>
          {mode === 'choose' ? (
            <View style={styles.actions}>
              <Button label="From contacts" onPress={addFromContacts} />
              <Button label="New" variant="ghost" onPress={() => setMode('new')} />
            </View>
          ) : (
            <View style={styles.actions}>
              <TextField
                autoFocus
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError('');
                }}
                placeholder="Name"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addNew}
              />
              {error ? (
                <AppText variant="caption" tone="action">
                  {error}
                </AppText>
              ) : null}
              <Button label="Add to circle" onPress={addNew} />
              <Button label="Back" variant="ghost" onPress={() => setMode('choose')} />
            </View>
          )}
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
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.md,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: space.sm,
  },
  actions: {
    gap: space.sm,
    marginTop: space.sm,
  },
});
