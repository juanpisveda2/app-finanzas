import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  AppButton,
  AppInput,
  AppListItem,
  AppModal,
  AppText,
} from '../../../ui/components';
import { useGoalsStore } from '../../../state/goalsStore';
import { Goal } from '../../../domain/models';
import { createId } from '../../../lib/ids';
import { formatMoney } from '../../../lib/money';
import { goalFormSchema, GoalFormValues } from '../../../domain/validators';
import { useAppTheme } from '../../../ui/theme/useAppTheme';
import { formatDateUI, parseISODate, toISODate } from '../../../lib/date';

export default function GoalsScreen() {
  const { items, load, addGoal, updateGoal, deleteGoal } = useGoalsStore();
  const theme = useAppTheme();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      targetAmount: undefined,
      targetDate: '',
      currentAmount: 0,
      priority: 'medium',
    },
  });

  useEffect(() => {
    void load();
  }, [load]);
  
  const selectedTargetDate = form.watch('targetDate');

  const openNew = () => {
    setEditing(null);
    form.reset({
      name: '',
      targetAmount: undefined,
      targetDate: '',
      currentAmount: 0,
      priority: 'medium',
    });
    setModalVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    form.reset({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ?? '',
      currentAmount: goal.currentAmount,
      priority: goal.priority,
    });
    setModalVisible(true);
  };

  const handleSave = form.handleSubmit(async (values) => {
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
    setModalVisible(false);
  });

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
        renderItem={({ item }) => (
          <AppListItem
            title={item.name}
            description={
              item.targetAmount
                ? `${formatMoney(item.currentAmount)} / ${formatMoney(item.targetAmount)}`
                : `Actual: ${formatMoney(item.currentAmount)}`
            }
            right={() => (
              <View style={styles.goalActions}>
                <AppButton mode="text" onPress={() => openEdit(item)}>
                  Editar
                </AppButton>
                <AppButton mode="text" onPress={() => deleteGoal(item.id)}>
                  Eliminar
                </AppButton>
              </View>
            )}
          />
        )}
        ListEmptyComponent={<AppText>No hay metas creadas aun.</AppText>}
        contentContainerStyle={styles.list}
      />

      <AppModal
        visible={modalVisible}
        onDismiss={() => {
          setShowDatePicker(false);
          setModalVisible(false);
        }}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">
          {editing ? 'Editar meta' : 'Nueva meta'}
        </AppText>
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
        <Controller
          control={form.control}
          name="targetDate"
          render={() => (
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <AppText variant="labelLarge">Fecha objetivo</AppText>
                <View style={styles.row}>
                  {selectedTargetDate ? (
                    <AppButton
                      mode="text"
                      onPress={() => form.setValue('targetDate', '')}
                    >
                      Quitar
                    </AppButton>
                  ) : null}
                  <AppButton mode="outlined" onPress={() => setShowDatePicker(true)}>
                    {selectedTargetDate
                      ? formatDateUI(selectedTargetDate)
                      : 'Seleccionar fecha'}
                  </AppButton>
                </View>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={
                    selectedTargetDate ? parseISODate(selectedTargetDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (event.type === 'dismissed' || !date) {
                      setShowDatePicker(false);
                      return;
                    }
                    form.setValue('targetDate', toISODate(date));
                    setShowDatePicker(false);
                  }}
                />
              )}
            </View>
          )}
        />
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
        <Controller
          control={form.control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Prioridad (low|medium|high)"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setModalVisible(false)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleSave}>Guardar</AppButton>
        </View>
      </AppModal>
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
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: 8,
    paddingBottom: 40,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 4,
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
