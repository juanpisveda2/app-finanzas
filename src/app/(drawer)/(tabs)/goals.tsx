import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  AppButton,
  AppCard,
  AppCardContent,
  AppChip,
  AppInput,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../../ui/components';
import { useGoalsStore } from '../../../state/goalsStore';
import { Goal, GoalContribution } from '../../../domain/models';
import { createId } from '../../../lib/ids';
import { formatMoney } from '../../../lib/money';
import { GoalFormValues } from '../../../domain/validators';
import { formatDateUI, parseISODate, toISODate } from '../../../lib/date';
import { GoalFormModal } from '../../../features/goals/GoalFormModal';
import { useAppTheme } from '../../../ui/theme/useAppTheme';
import {
  addGoalContribution,
  deleteGoalContributionsByGoalId,
  getGoalQuickAmountsMap,
  getLastGoalContributionMap,
  saveGoalQuickAmounts,
} from '../../../data/storage/goalMetaStorage';

export default function GoalsScreen() {
  const { items, load, addGoal, updateGoal, deleteGoal } = useGoalsStore();
  const router = useRouter();
  const theme = useAppTheme();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quickAmountsMap, setQuickAmountsMap] = useState<Record<string, number[]>>({});
  const [lastContributionMap, setLastContributionMap] = useState<
    Record<string, GoalContribution>
  >({});
  const [snackbar, setSnackbar] = useState('');
  const [customGoal, setCustomGoal] = useState<Goal | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customDate, setCustomDate] = useState(toISODate(new Date()));
  const [customNote, setCustomNote] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const DEFAULT_QUICK_AMOUNTS = useMemo(() => [1000, 2000, 5000], []);

  const defaultFormValues: GoalFormValues = useMemo(
    () => ({
      name: '',
      targetAmount: undefined,
      targetDate: '',
      currentAmount: 0,
      priority: 'medium',
      quickAmount1: undefined,
      quickAmount2: undefined,
      quickAmount3: undefined,
    }),
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refreshGoalMeta = useCallback(async () => {
    const [quickMap, lastMap] = await Promise.all([
      getGoalQuickAmountsMap(),
      getLastGoalContributionMap(),
    ]);
    setQuickAmountsMap(quickMap);
    setLastContributionMap(lastMap);
  }, []);

  useEffect(() => {
    void refreshGoalMeta();
  }, [refreshGoalMeta]);

  useFocusEffect(
    useCallback(() => {
      void refreshGoalMeta();
    }, [refreshGoalMeta])
  );

  const openNew = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setModalVisible(true);
  };

  const openCustomAmount = (goal: Goal) => {
    setCustomGoal(goal);
    setCustomAmount('');
    setCustomDate(toISODate(new Date()));
    setCustomNote('');
  };

  const isDuplicateName = useCallback(
    (name: string, originalName?: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized) {
        return false;
      }
      const normalizedOriginal = originalName?.trim().toLowerCase();
      return items.some((item) => {
        const itemName = item.name.trim().toLowerCase();
        if (normalizedOriginal && itemName === normalizedOriginal) {
          return false;
        }
        return itemName === normalized;
      });
    },
    [items]
  );

  const handleSave = async (values: GoalFormValues) => {
    if (isDuplicateName(values.name, editing?.name)) {
      setSnackbar('Ya existe una meta con ese nombre');
      return;
    }
    const goal: Goal = {
      id: editing?.id ?? createId('goal'),
      name: values.name,
      targetAmount: values.targetAmount || undefined,
      targetDate: values.targetDate || undefined,
      currentAmount: values.currentAmount,
      priority: values.priority,
    };
    if (editing) {
      await updateGoal(goal);
    } else {
      await addGoal(goal);
    }
    await saveGoalQuickAmounts(goal.id, [
      values.quickAmount1 ?? 0,
      values.quickAmount2 ?? 0,
      values.quickAmount3 ?? 0,
    ]);
    await refreshGoalMeta();
    setModalVisible(false);
  };

  const handleQuickContribution = async (goal: Goal, amount: number) => {
    await addGoalContribution({
      goalId: goal.id,
      amount,
      date: toISODate(new Date()),
      note: null,
    });
    await updateGoal({
      ...goal,
      currentAmount: goal.currentAmount + amount,
    });
    await refreshGoalMeta();
    setSnackbar(`Aporte agregado: +${formatMoney(amount)}`);
  };

  const handleCustomContribution = async () => {
    if (!customGoal) {
      return;
    }
    const amount = Number(customAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSnackbar('Ingresa un monto valido.');
      return;
    }
    await addGoalContribution({
      goalId: customGoal.id,
      amount,
      date: customDate,
      note: customNote.trim() ? customNote.trim() : null,
    });
    await updateGoal({
      ...customGoal,
      currentAmount: customGoal.currentAmount + amount,
    });
    await refreshGoalMeta();
    setSnackbar(`Aporte agregado: +${formatMoney(amount)}`);
    setCustomGoal(null);
  };

  const buildFormValues = (goal?: Goal | null): GoalFormValues => {
    if (!goal) {
      return defaultFormValues;
    }
    const quickAmounts = quickAmountsMap[goal.id] ?? [];
    return {
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ?? '',
      currentAmount: goal.currentAmount,
      priority: goal.priority,
      quickAmount1: quickAmounts[0],
      quickAmount2: quickAmounts[1],
      quickAmount3: quickAmounts[2],
    };
  };

  const getStatusLabel = (goal: Goal) => {
    if (goal.targetAmount && goal.currentAmount >= goal.targetAmount) {
      return 'Cumplida';
    }
    if (goal.targetDate) {
      const daysLeft = differenceInCalendarDays(
        parseISODate(goal.targetDate),
        new Date()
      );
      if (daysLeft < 0) {
        return 'Pausada';
      }
    }
    return 'Activa';
  };

  const getProgressPercent = (goal: Goal) => {
    if (!goal.targetAmount || goal.targetAmount <= 0) {
      return 0;
    }
    if (goal.currentAmount >= goal.targetAmount) {
      return 100;
    }
    const raw = goal.currentAmount / goal.targetAmount;
    const safe = Math.min(raw, 0.999);
    return Math.max(0, Math.floor(safe * 100));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="titleLarge">Metas</AppText>
        <AppButton mode="outlined" onPress={openNew}>
          Nueva meta
        </AppButton>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const progressPercent = getProgressPercent(item);
          const progressLabel = item.targetAmount
            ? `${formatMoney(item.currentAmount)} / ${formatMoney(item.targetAmount)}`
            : `Ahorrado: ${formatMoney(item.currentAmount)}`;
          const hasCustomQuickAmounts = Object.prototype.hasOwnProperty.call(
            quickAmountsMap,
            item.id
          );
          const quickAmounts = hasCustomQuickAmounts
            ? quickAmountsMap[item.id] ?? []
            : DEFAULT_QUICK_AMOUNTS;
          const lastContribution = lastContributionMap[item.id];
          const showLastContribution =
            !!lastContribution &&
            !quickAmounts.some((amount) => amount === lastContribution.amount);
          return (
            <AppCard
              onPress={() => router.push(`/goals/${item.id}`)}
              style={styles.card}
            >
              <AppCardContent>
                <View style={styles.cardHeader}>
                  <AppText variant="titleMedium">{item.name}</AppText>
                  <AppText variant="labelMedium">{getStatusLabel(item)}</AppText>
                </View>
                <AppText>{progressLabel}</AppText>
                {item.targetAmount ? (
                  <View style={styles.progressWrap}>
                    <View
                      style={[
                        styles.progressTrack,
                        { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor: theme.colors.secondary,
                          },
                        ]}
                      />
                    </View>
                    <AppText variant="labelSmall">{progressPercent}%</AppText>
                  </View>
                ) : null}
                {item.targetDate ? (
                  <AppText variant="labelSmall">
                    Fecha objetivo: {formatDateUI(item.targetDate)}
                  </AppText>
                ) : null}
                <View style={styles.quickSection}>
                  <AppText variant="labelLarge">Aporte rapido</AppText>
                  <View style={styles.quickPrimaryRow}>
                    {showLastContribution ? (
                      <AppChip
                        key={`${item.id}-${lastContribution.id}`}
                        onPress={() =>
                          handleQuickContribution(item, lastContribution.amount)
                        }
                        style={[
                          styles.chip,
                          styles.repeatChip,
                          { backgroundColor: theme.colors.primaryContainer },
                        ]}
                        textStyle={{ color: theme.colors.onPrimaryContainer }}
                      >
                        Repetir {formatMoney(lastContribution.amount)}
                      </AppChip>
                    ) : null}
                    <AppChip onPress={() => openCustomAmount(item)} style={styles.chip}>
                      Otro monto
                    </AppChip>
                  </View>
                  <View style={styles.quickSecondaryRow}>
                    {quickAmounts
                      .filter((value) => value > 0)
                      .map((amount, index) => (
                        <AppChip
                          key={`${item.id}-quick-${index}-${amount}`}
                          onPress={() => handleQuickContribution(item, amount)}
                          style={styles.chip}
                        >
                          +{formatMoney(amount)}
                        </AppChip>
                      ))}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <AppButton mode="text" onPress={() => openEdit(item)}>
                    Editar
                  </AppButton>
                  <AppButton mode="text" onPress={() => setDeleteTarget(item)}>
                    Eliminar
                  </AppButton>
                </View>
              </AppCardContent>
            </AppCard>
          );
        }}
        ListEmptyComponent={<AppText>No hay metas creadas aun.</AppText>}
        contentContainerStyle={styles.list}
      />

      <GoalFormModal
        visible={modalVisible}
        title={editing ? 'Editar meta' : 'Nueva meta'}
        initialValues={buildFormValues(editing)}
        existingNames={items.map((goal) => goal.name)}
        originalName={editing?.name}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleSave}
      />

      <AppModal
        visible={!!customGoal}
        onDismiss={() => {
          setShowCustomDatePicker(false);
          setCustomGoal(null);
        }}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Agregar aporte</AppText>
        <AppInput
          label="Monto"
          value={customAmount}
          onChangeText={setCustomAmount}
          keyboardType="numeric"
        />
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText variant="labelLarge">Fecha</AppText>
            <AppButton mode="outlined" onPress={() => setShowCustomDatePicker(true)}>
              {customDate ? formatDateUI(customDate) : 'Seleccionar fecha'}
            </AppButton>
          </View>
          {showCustomDatePicker && (
            <DateTimePicker
              value={customDate ? parseISODate(customDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                if (event.type === 'dismissed' || !date) {
                  setShowCustomDatePicker(false);
                  return;
                }
                setCustomDate(toISODate(date));
                setShowCustomDatePicker(false);
              }}
            />
          )}
        </View>
        <AppInput
          label="Nota (opcional)"
          value={customNote}
          onChangeText={setCustomNote}
          multiline
        />
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setCustomGoal(null)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleCustomContribution}>Agregar</AppButton>
        </View>
      </AppModal>

      <AppModal
        visible={!!deleteTarget}
        onDismiss={() => setDeleteTarget(null)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Eliminar meta</AppText>
        <AppText>
          Eliminar la meta "{deleteTarget?.name}"? Esta accion no se puede deshacer.
        </AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setDeleteTarget(null)}>
            Cancelar
          </AppButton>
          <AppButton
            onPress={async () => {
              if (!deleteTarget) {
                return;
              }
              await deleteGoal(deleteTarget.id);
              await deleteGoalContributionsByGoalId(deleteTarget.id);
              setDeleteTarget(null);
              await refreshGoalMeta();
            }}
          >
            Eliminar
          </AppButton>
        </View>
      </AppModal>

      <AppSnackbar visible={!!snackbar} onDismiss={() => setSnackbar('')}>
        {snackbar}
      </AppSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    gap: 8,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressWrap: {
    marginTop: 6,
    gap: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#D4D4D8',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#22C55E',
  },
  quickSection: {
    marginTop: 12,
    gap: 8,
  },
  quickPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 4,
  },
  repeatChip: {
    borderWidth: 1,
  },
  cardActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  section: {
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
