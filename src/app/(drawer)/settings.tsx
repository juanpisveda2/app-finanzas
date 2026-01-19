import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppInput,
  AppModal,
  AppSnackbar,
  AppSwitch,
  AppText,
} from '../../ui/components';
import { useSettingsStore } from '../../state/settingsStore';
import { resetDatabase } from '../../data/db/sqlite';
import { useCategoriesStore } from '../../state/categoriesStore';
import { useMovementsStore } from '../../state/movementsStore';
import { useGoalsStore } from '../../state/goalsStore';
import { useAppTheme } from '../../ui/theme/useAppTheme';

const MIN_PIN = 4;
const MAX_PIN = 6;

export default function SettingsScreen() {
  const { settings, toggleDarkMode, pinHash, verifyPin, setPin } = useSettingsStore();
  const { load: loadCategories } = useCategoriesStore();
  const { loadMonth } = useMovementsStore();
  const { load: loadGoals } = useGoalsStore();
  const theme = useAppTheme();

  const [pinModal, setPinModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleChangePin = async () => {
    setError('');
    if (newPin.length < MIN_PIN || newPin.length > MAX_PIN) {
      setError(`El PIN debe tener entre ${MIN_PIN} y ${MAX_PIN} digitos`);
      return;
    }
    if (newPin !== confirmPin) {
      setError('Los PIN no coinciden');
      return;
    }
    if (pinHash) {
      const ok = await verifyPin(currentPin);
      if (!ok) {
        setError('PIN actual incorrecto');
        return;
      }
    }
    await setPin(newPin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinModal(false);
  };

  const handleReset = async () => {
    await resetDatabase();
    await Promise.all([loadCategories(), loadMonth(), loadGoals()]);
    setResetModal(false);
  };

  return (
    <View style={styles.container}>
      <AppText variant="titleLarge">Ajustes</AppText>

      <View style={styles.rowBetween}>
        <AppText>Modo oscuro</AppText>
        <AppSwitch value={settings.darkMode} onValueChange={toggleDarkMode} />
      </View>

      <AppButton mode="outlined" onPress={() => setPinModal(true)}>
        Cambiar PIN
      </AppButton>

      <AppButton mode="outlined" onPress={() => setResetModal(true)}>
        Resetear datos
      </AppButton>

      <AppModal
        visible={pinModal}
        onDismiss={() => setPinModal(false)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Cambiar PIN</AppText>
        {pinHash && (
          <AppInput
            label="PIN actual"
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="number-pad"
            secureTextEntry
          />
        )}
        <AppInput
          label="Nuevo PIN"
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          secureTextEntry
        />
        <AppInput
          label="Confirmar nuevo PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
        />
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setPinModal(false)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleChangePin}>Guardar</AppButton>
        </View>
      </AppModal>

      <AppModal
        visible={resetModal}
        onDismiss={() => setResetModal(false)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Resetear datos</AppText>
        <AppText>Esto eliminara movimientos, metas y categorias.</AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setResetModal(false)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleReset}>Confirmar</AppButton>
        </View>
      </AppModal>

      <AppSnackbar visible={!!error} onDismiss={() => setError('')}>
        {error}
      </AppSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modal: {
    padding: 20,
    margin: 24,
    borderRadius: 12,
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
