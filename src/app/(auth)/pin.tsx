import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppInput, AppSnackbar, AppText } from '../../ui/components';
import { useSettingsStore } from '../../state/settingsStore';

const MIN_PIN = 4;
const MAX_PIN = 6;

export default function PinScreen() {
  const pinHash = useSettingsStore((state) => state.pinHash);
  const setPin = useSettingsStore((state) => state.setPin);
  const verifyPin = useSettingsStore((state) => state.verifyPin);

  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isCreating = !pinHash;

  const handleSubmit = async () => {
    setError('');
    if (pin.length < MIN_PIN || pin.length > MAX_PIN) {
      setError(`El PIN debe tener entre ${MIN_PIN} y ${MAX_PIN} digitos`);
      return;
    }
    if (isCreating && pin !== confirmPin) {
      setError('Los PIN no coinciden');
      return;
    }

    setBusy(true);
    if (isCreating) {
      await setPin(pin);
    } else {
      const ok = await verifyPin(pin);
      if (!ok) {
        setError('PIN incorrecto');
      }
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <AppText variant="headlineSmall" style={styles.title}>
          {isCreating ? 'Crear PIN' : 'Ingresar PIN'}
        </AppText>
        <AppText style={styles.subtitle}>
          {isCreating
            ? 'Protege tu app con un PIN de 4 a 6 digitos.'
            : 'Ingresa tu PIN para continuar.'}
        </AppText>
        <AppInput
          label="PIN"
          value={pin}
          onChangeText={setPinValue}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={MAX_PIN}
          style={styles.input}
        />
        {isCreating && (
          <AppInput
            label="Confirmar PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={MAX_PIN}
            style={styles.input}
          />
        )}
        <AppButton loading={busy} onPress={handleSubmit}>
          {isCreating ? 'Guardar PIN' : 'Desbloquear'}
        </AppButton>
      </View>
      <AppSnackbar visible={!!error} onDismiss={() => setError('')}>
        {error}
      </AppSnackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    gap: 12,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
});
