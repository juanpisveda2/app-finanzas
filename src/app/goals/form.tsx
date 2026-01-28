import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  AppButton,
  AppChip,
  AppIcon,
  AppInput,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../ui/components';
import { useGoalsStore } from '../../state/goalsStore';
import { Goal, GoalPriority } from '../../domain/models';
import { createId } from '../../lib/ids';
import { formatDateUI, parseISODate, toISODate } from '../../lib/date';
import { goalFormSchema, GoalFormValues } from '../../domain/validators';
import { useAppTheme } from '../../ui/theme/useAppTheme';
import { getGoalQuickAmountsMap, saveGoalQuickAmounts } from '../../data/storage/goalMetaStorage';

export default function GoalFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { items, load, addGoal, updateGoal, loading } = useGoalsStore();
  const theme = useAppTheme();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [quickAmountsMap, setQuickAmountsMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadQuickAmounts = async () => {
      const map = await getGoalQuickAmountsMap();
      setQuickAmountsMap(map);
    };
    void loadQuickAmounts();
  }, []);

  const goal = useMemo(
    () => items.find((item) => item.id === id),
    [id, items]
  );

  const normalizedNames = useMemo(
    () => items.map((item) => item.name.trim().toLowerCase()).filter(Boolean),
    [items]
  );
  const normalizedOriginal = goal?.name.trim().toLowerCase();

  const schema = useMemo(
    () =>
      goalFormSchema.superRefine((values, ctx) => {
        const nextName = values.name.trim().toLowerCase();
        if (!nextName) {
          return;
        }
        const isDuplicate = normalizedNames.some(
          (name) => name === nextName && name !== normalizedOriginal
        );
        if (isDuplicate) {
          ctx.addIssue({
            code: 'custom',
            message: 'Ya existe una meta con ese nombre',
            path: ['name'],
          });
        }
      }),
    [normalizedNames, normalizedOriginal]
  );

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      targetAmount: undefined,
      targetDate: '',
      currentAmount: 0,
      priority: 'medium',
      quickAmount1: undefined,
      quickAmount2: undefined,
      quickAmount3: undefined,
    },
  });

  useEffect(() => {
    if (!id || !goal) {
      return;
    }
    const quickAmounts = quickAmountsMap[goal.id] ?? [];
    form.reset({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ?? '',
      currentAmount: goal.currentAmount,
      priority: goal.priority,
      quickAmount1: quickAmounts[0],
      quickAmount2: quickAmounts[1],
      quickAmount3: quickAmounts[2],
    });
  }, [form, goal, id, quickAmountsMap]);

  const selectedTargetDate = form.watch('targetDate');
  const selectedPriority = form.watch('priority');
  const priorityOptions: { label: string; value: GoalPriority }[] = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
  ];

  const handleSave = form.handleSubmit(
    async (values) => {
      setBusy(true);
      setError('');
      const nextGoal: Goal = {
        id: id ?? createId('goal'),
        name: values.name,
        targetAmount: values.targetAmount || undefined,
        targetDate: values.targetDate || undefined,
        currentAmount: values.currentAmount,
        priority: values.priority,
      };

      try {
        if (id) {
          await updateGoal(nextGoal);
        } else {
          await addGoal(nextGoal);
        }
        await saveGoalQuickAmounts(nextGoal.id, [
          values.quickAmount1 ?? 0,
          values.quickAmount2 ?? 0,
          values.quickAmount3 ?? 0,
        ]);
        router.back();
      } catch {
        setError('No se pudo guardar la meta.');
      } finally {
        setBusy(false);
      }
    },
    (errors) => {
      const firstError = Object.values(errors)[0];
      if (firstError && 'message' in firstError) {
        setError(String(firstError.message));
      } else {
        setError('Revisa los datos del formulario.');
      }
    }
  );

  if (id && !goal && !loading) {
    return (
      <View style={styles.container}>
        <AppText variant="titleLarge">Meta no encontrada</AppText>
        <AppButton mode="outlined" onPress={() => router.back()}>
          Volver
        </AppButton>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="titleLarge">{id ? 'Editar meta' : 'Nueva meta'}</AppText>

      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <AppInput label="Nombre" value={value} onChangeText={onChange} />
        )}
      />

      <Controller
        control={form.control}
        name="targetAmount"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Monto objetivo (opcional)"
            value={value ? String(value) : ''}
            onChangeText={(text) => onChange(text ? Number(text) : undefined)}
            keyboardType="numeric"
          />
        )}
      />

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <AppText variant="labelLarge">Fecha objetivo</AppText>
          {selectedTargetDate ? (
            <AppButton
              mode="text"
              onPress={() => form.setValue('targetDate', '', { shouldValidate: true })}
            >
              Quitar
            </AppButton>
          ) : null}
        </View>
        <Pressable
          onPress={() => {
            setTempDate(selectedTargetDate ? parseISODate(selectedTargetDate) : new Date());
            setShowDatePicker(true);
          }}
          style={[styles.dateInput, { borderColor: '#ccc' }]}
        >
          <AppText style={styles.dateInputText}>
            {selectedTargetDate ? formatDateUI(selectedTargetDate) : 'Seleccionar fecha'}
          </AppText>
          <AppIcon name="calendar-outline" size={20} />
        </Pressable>
      </View>

      <Controller
        control={form.control}
        name="currentAmount"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Monto actual"
            value={String(value)}
            onChangeText={(text) => onChange(Number(text || 0))}
            keyboardType="numeric"
          />
        )}
      />

      <View style={styles.section}>
        <AppText variant="labelLarge">Prioridad</AppText>
        <View style={styles.row}>
          {priorityOptions.map((option) => (
            <AppChip
              key={option.value}
              selected={selectedPriority === option.value}
              onPress={() => form.setValue('priority', option.value)}
            >
              {option.label}
            </AppChip>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="labelLarge">Montos sugeridos (opcional)</AppText>
        <Controller
          control={form.control}
          name="quickAmount1"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Monto sugerido 1"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={form.control}
          name="quickAmount2"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Monto sugerido 2"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={form.control}
          name="quickAmount3"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Monto sugerido 3"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              keyboardType="numeric"
            />
          )}
        />
      </View>

      <View style={styles.actionsRow}>
        <AppButton mode="outlined" onPress={() => router.back()}>
          Cancelar
        </AppButton>
        <AppButton loading={busy} onPress={handleSave}>
          Guardar
        </AppButton>
      </View>

      <AppModal
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        contentStyle={styles.datePickerModal}
      >
        <View style={[styles.datePickerContainer, { backgroundColor: theme.colors.surface }]}>
          {tempDate && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setTempDate(date);
                }
              }}
              textColor={theme.colors.onSurface}
            />
          )}
          <View style={styles.dateModalActions}>
            <AppButton mode="outlined" onPress={() => setShowDatePicker(false)}>
              Cancelar
            </AppButton>
            <AppButton
              onPress={() => {
                if (tempDate) {
                  form.setValue('targetDate', toISODate(tempDate), { shouldValidate: true });
                }
                setShowDatePicker(false);
              }}
            >
              Confirmar
            </AppButton>
          </View>
        </View>
      </AppModal>

      <AppSnackbar visible={!!error} onDismiss={() => setError('')}>
        {error}
      </AppSnackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateInputText: {
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  datePickerModal: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 300,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
