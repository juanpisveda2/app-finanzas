import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  AppButton,
  AppInput,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../ui/components';
import { useAppTheme } from '../../ui/theme/useAppTheme';
import { goalFormSchema, GoalFormValues } from '../../domain/validators';
import { formatDateUI, parseISODate, toISODate } from '../../lib/date';

type GoalFormModalProps = {
  visible: boolean;
  title: string;
  initialValues: GoalFormValues;
  existingNames: string[];
  originalName?: string;
  onDismiss: () => void;
  onSubmit: (values: GoalFormValues) => Promise<void> | void;
};

export function GoalFormModal({
  visible,
  title,
  initialValues,
  existingNames,
  originalName,
  onDismiss,
  onSubmit,
}: GoalFormModalProps) {
  const theme = useAppTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const defaultValues = useMemo(() => initialValues, [initialValues]);

  const normalizedNames = useMemo(
    () => existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
    [existingNames]
  );
  const normalizedOriginal = originalName?.trim().toLowerCase();

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
    defaultValues,
  });

  useEffect(() => {
    if (visible) {
      setError('');
      form.reset(defaultValues);
    }
  }, [defaultValues, form, visible]);

  const selectedTargetDate = form.watch('targetDate');

  return (
    <AppModal
      visible={visible}
      onDismiss={() => {
        setShowDatePicker(false);
        onDismiss();
      }}
      contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
    >
      <AppText variant="titleMedium">{title}</AppText>
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
                  <AppButton mode="text" onPress={() => form.setValue('targetDate', '')}>
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
      <View style={styles.modalActions}>
        <AppButton mode="outlined" onPress={onDismiss}>
          Cancelar
        </AppButton>
        <AppButton
          onPress={form.handleSubmit(
            async (values) => {
              setError('');
              await onSubmit(values);
            },
            (errors) => {
              const firstError = Object.values(errors)[0];
              if (firstError && 'message' in firstError) {
                setError(String(firstError.message));
              } else {
                setError('Revisa los datos del formulario.');
              }
            }
          )}
        >
          Guardar
        </AppButton>
      </View>
      <AppSnackbar visible={!!error} onDismiss={() => setError('')}>
        {error}
      </AppSnackbar>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: 20,
    margin: 24,
    borderRadius: 12,
    gap: 12,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
