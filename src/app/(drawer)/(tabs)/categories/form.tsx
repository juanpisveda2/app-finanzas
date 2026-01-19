import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';

import {
  AppButton,
  AppChip,
  AppIcon,
  AppInput,
  AppModal,
  AppSnackbar,
  AppSwitch,
  AppText,
} from '../../../../ui/components';
import { useCategoriesStore } from '../../../../state/categoriesStore';
import { Category } from '../../../../domain/models';
import {
  categoryFormSchema,
  CategoryFormInput,
  CategoryFormValues,
} from '../../../../domain/validators';
import { createId } from '../../../../lib/ids';
import { useAppTheme } from '../../../../ui/theme/useAppTheme';

const colorOptions = [
  '#1E3A5F',
  '#5B8C5A',
  '#C97C5D',
  '#4F6D7A',
  '#B56576',
  '#E09F3E',
  '#2A9D8F',
  '#264653',
];

export default function CategoryFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { items, load, addCategory, updateCategory } = useCategoriesStore();
  const theme = useAppTheme();
  const [showPeriodConfig, setShowPeriodConfig] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showVisibilityDetails, setShowVisibilityDetails] = useState(false);
  const [error, setError] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthPickerTarget, setMonthPickerTarget] = useState<'from' | 'to' | null>(
    null
  );
  const [tempMonthDate, setTempMonthDate] = useState<Date | null>(null);

  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      kind: 'expense',
      nature: 'variable',
      color: colorOptions[0],
      isBasic: false,
      isEnjoyment: false,
      isActive: true,
      activeFrom: '',
      activeTo: '',
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  const editingCategory = useMemo(
    () => items.find((category) => category.id === id),
    [items, id]
  );

  useEffect(() => {
    if (!id || !editingCategory) {
      form.reset({
        name: '',
        kind: 'expense',
        nature: 'variable',
        color: colorOptions[0],
        isBasic: false,
        isEnjoyment: false,
        isActive: true,
        activeFrom: '',
        activeTo: '',
      });
      setShowPeriodConfig(false);
      return;
    }

    form.reset({
      name: editingCategory.name,
      kind: editingCategory.kind,
      nature: editingCategory.nature ?? 'variable',
      color: editingCategory.color ?? colorOptions[0],
      isBasic: editingCategory.isBasic,
      isEnjoyment: editingCategory.isEnjoyment,
      isActive: editingCategory.isActive,
      activeFrom: editingCategory.activeFrom ?? '',
      activeTo: editingCategory.activeTo ?? '',
    });
    setShowPeriodConfig(Boolean(editingCategory.activeFrom || editingCategory.activeTo));
  }, [editingCategory, form, id]);

  const handleSave = form.handleSubmit(
    async (values) => {
      const now = new Date().toISOString();
      const category: Category = {
        id: editingCategory?.id ?? createId('cat'),
        name: values.name.trim(),
        kind: values.kind,
        nature: values.nature,
        color: values.color || undefined,
        isBasic: values.isBasic,
        isEnjoyment: values.isEnjoyment,
        isActive: values.isActive,
        activeFrom: values.activeFrom || undefined,
        activeTo: values.activeTo || undefined,
        createdAt: editingCategory?.createdAt ?? now,
        updatedAt: now,
      };

      if (editingCategory) {
        await updateCategory(category);
      } else {
        await addCategory(category);
      }
      router.back();
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

  const selectedKind = form.watch('kind');
  const isExpense = selectedKind === 'expense';
  const activeFrom = form.watch('activeFrom');
  const activeTo = form.watch('activeTo');

  const openMonthPicker = (target: 'from' | 'to') => {
    const currentValue = target === 'from' ? activeFrom : activeTo;
    setTempMonthDate(
      currentValue ? parse(currentValue as string, 'yyyy-MM', new Date()) : new Date()
    );
    setMonthPickerTarget(target);
    setShowMonthPicker(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="titleLarge">
        {editingCategory ? 'Editar categoria' : 'Nueva categoria'}
      </AppText>

      <View style={styles.section}>
        <AppText variant="labelLarge">Identidad</AppText>
        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <AppInput label="Nombre" value={value} onChangeText={onChange} />
          )}
        />

        <View style={styles.fieldGroup}>
          <AppText variant="labelLarge">Tipo</AppText>
          <View style={styles.row}>
            <AppChip
              selected={selectedKind === 'expense'}
              onPress={() => form.setValue('kind', 'expense')}
            >
              Gasto
            </AppChip>
            <AppChip
              selected={selectedKind === 'income'}
              onPress={() => {
                form.setValue('kind', 'income');
                form.setValue('isBasic', false);
                form.setValue('isEnjoyment', false);
              }}
            >
              Ingreso
            </AppChip>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="labelLarge">Color</AppText>
          <View style={styles.colorRow}>
            {colorOptions.map((color) => (
              <Pressable
                key={color}
                onPress={() => form.setValue('color', color)}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color,
                    borderColor:
                      form.watch('color') === color
                        ? theme.colors.primary
                        : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="labelLarge">Comportamiento financiero</AppText>
        <View style={styles.fieldGroup}>
          <AppText variant="labelLarge">Naturaleza</AppText>
          <View style={styles.row}>
            <AppChip
              selected={form.watch('nature') === 'fixed'}
              onPress={() => form.setValue('nature', 'fixed')}
            >
              Fijo
            </AppChip>
            <AppChip
              selected={form.watch('nature') === 'variable'}
              onPress={() => form.setValue('nature', 'variable')}
            >
              Variable
            </AppChip>
          </View>
        </View>

        {isExpense && (
          <View style={styles.fieldGroup}>
            <Pressable
              onPress={() => setShowExpenseDetails((prev) => !prev)}
              style={[styles.accordionHeader, { borderColor: theme.colors.outline }]}
            >
              <View style={styles.accordionText}>
                <AppText variant="labelLarge">Gasto basico y disfrute</AppText>
              </View>
              <AppIcon
                name={showExpenseDetails ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurface}
              />
            </Pressable>

            {showExpenseDetails && (
              <View style={styles.accordionBody}>
                <View style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <AppText>Gasto basico</AppText>
                    <AppText style={styles.helper}>Necesario para vivir</AppText>
                  </View>
                  <Controller
                    control={form.control}
                    name="isBasic"
                    render={({ field: { onChange, value } }) => (
                      <AppSwitch
                        value={value}
                        onValueChange={(next) => {
                          if (next) {
                            form.setValue('isEnjoyment', false);
                          }
                          onChange(next);
                        }}
                      />
                    )}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <AppText>Disfrute</AppText>
                    <AppText style={styles.helper}>Ocio / gustos</AppText>
                  </View>
                  <Controller
                    control={form.control}
                    name="isEnjoyment"
                    render={({ field: { onChange, value } }) => (
                      <AppSwitch
                        value={value}
                        onValueChange={(next) => {
                          if (next) {
                            form.setValue('isBasic', false);
                          }
                          onChange(next);
                        }}
                      />
                    )}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="labelLarge">Visibilidad</AppText>
        <Pressable
          onPress={() => setShowVisibilityDetails((prev) => !prev)}
          style={[styles.accordionHeader, { borderColor: theme.colors.outline }]}
        >
          <View style={styles.accordionText}>
            <AppText variant="labelLarge">Visibilidad</AppText>
          </View>
          <AppIcon
            name={showVisibilityDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.onSurface}
          />
        </Pressable>

        {showVisibilityDetails && (
          <View style={styles.accordionBody}>
            <View style={styles.switchRow}>
              <AppText>Activa</AppText>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <AppSwitch value={value} onValueChange={onChange} />
                )}
              />
            </View>

            <Pressable
              onPress={() => setShowPeriodConfig((prev) => !prev)}
              style={[styles.accordionHeader, { borderColor: theme.colors.outline }]}
            >
              <View style={styles.accordionText}>
                <AppText variant="labelLarge">Mostrar en un periodo especifico</AppText>
                {(activeFrom || activeTo) && (
                  <AppText style={styles.helper}>
                    {activeFrom ?? '--'} a {activeTo ?? '--'}
                  </AppText>
                )}
              </View>
              <AppIcon
                name={showPeriodConfig ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurface}
              />
            </Pressable>

            {showPeriodConfig && (
              <View style={styles.accordionBody}>
                <View style={styles.fieldGroup}>
                  <AppText variant="labelMedium">Desde (mes-ano)</AppText>
                  <Pressable
                    onPress={() => openMonthPicker('from')}
                    style={[styles.dateInput, { borderColor: theme.colors.outline }]}
                  >
                    <AppText>
                      {activeFrom
                        ? format(
                            parse(activeFrom as string, 'yyyy-MM', new Date()),
                            'MMMM yyyy'
                          )
                        : 'Seleccionar mes inicial'}
                    </AppText>
                    <AppIcon name="calendar-outline" size={18} color={theme.colors.onSurface} />
                  </Pressable>
                </View>

                <View style={styles.fieldGroup}>
                  <AppText variant="labelMedium">Hasta (mes-ano)</AppText>
                  <Pressable
                    onPress={() => openMonthPicker('to')}
                    style={[styles.dateInput, { borderColor: theme.colors.outline }]}
                  >
                    <AppText>
                      {activeTo
                        ? format(
                            parse(activeTo as string, 'yyyy-MM', new Date()),
                            'MMMM yyyy'
                          )
                        : 'Seleccionar mes final'}
                    </AppText>
                    <AppIcon name="calendar-outline" size={18} color={theme.colors.onSurface} />
                  </Pressable>
                </View>

                {(activeFrom || activeTo) && (
                  <AppButton
                    mode="text"
                    onPress={() => {
                      form.setValue('activeFrom', '');
                      form.setValue('activeTo', '');
                    }}
                  >
                    Limpiar periodo
                  </AppButton>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <AppButton mode="outlined" onPress={() => router.back()} style={styles.fullButton}>
          Cancelar
        </AppButton>
        <AppButton onPress={handleSave} style={styles.fullButton}>
          Guardar
        </AppButton>
      </View>

      <AppModal
        visible={showMonthPicker}
        onDismiss={() => setShowMonthPicker(false)}
        contentStyle={styles.datePickerModal}
      >
        <View
          style={[styles.datePickerContainer, { backgroundColor: theme.colors.surface }]}
        >
          {tempMonthDate && (
            <DateTimePicker
              value={tempMonthDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setTempMonthDate(date);
                }
              }}
              textColor={theme.colors.onSurface}
            />
          )}
          <View style={styles.dateModalActions}>
            <AppButton mode="outlined" onPress={() => setShowMonthPicker(false)}>
              Cancelar
            </AppButton>
            <AppButton
              onPress={() => {
                if (tempMonthDate && monthPickerTarget) {
                  const iso = format(tempMonthDate, 'yyyy-MM');
                  form.setValue(
                    monthPickerTarget === 'from' ? 'activeFrom' : 'activeTo',
                    iso
                  );
                }
                setShowMonthPicker(false);
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
    paddingBottom: 120,
  },
  section: {
    gap: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorOption: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  helper: {
    fontSize: 13,
    opacity: 0.6,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  accordionText: {
    flex: 1,
    gap: 2,
  },
  accordionBody: {
    gap: 10,
    paddingTop: 4,
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
  footer: {
    gap: 10,
    paddingTop: 8,
  },
  fullButton: {
    alignSelf: 'stretch',
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
