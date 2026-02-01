import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subDays } from 'date-fns';

import {
  AppButton,
  AppChip,
  AppIcon,
  AppInput,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../../ui/components';
import { useMovementsStore } from '../../../state/movementsStore';
import { useCategoriesStore } from '../../../state/categoriesStore';
import { createId } from '../../../lib/ids';
import { formatDateUI, monthKey, parseISODate, toISODate } from '../../../lib/date';
import { movementFormSchema, MovementFormInput, MovementFormValues } from '../../../domain/validators';
import { MovementsRepository } from '../../../data/repositories/movementsRepository';
import { Movement, MovementType } from '../../../domain/models';
import { useAppTheme } from '../../../ui/theme/useAppTheme';
import { isCategoryVisibleForMonth } from '../../../domain/rules';

export default function NewMovementScreen() {
  const router = useRouter();
  const {
    id,
    draft: draftParam,
    selectCategoryId: selectCategoryIdParam,
    selectCategoryKind: selectCategoryKindParam,
  } = useLocalSearchParams<{
    id?: string | string[];
    draft?: string | string[];
    selectCategoryId?: string | string[];
    selectCategoryKind?: string | string[];
  }>();
  const { addMovement, updateMovement } = useMovementsStore();
  const { items: categories, load: loadCategories } = useCategoriesStore();
  const theme = useAppTheme();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const form = useForm<MovementFormInput, unknown, MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      date: toISODate(new Date()),
      categoryId: '',
      description: '',
    },
  });

  const { formState } = form;
  const draftAppliedRef = useRef(false);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resetForm = useCallback(() => {
    form.reset({
      type: 'expense',
      amount: '',
      date: toISODate(new Date()),
      categoryId: '',
      description: '',
    });
    setError('');
    setBusy(false);
    setShowCategoryPicker(false);
    setShowDatePicker(false);
    setTempDate(null);
  }, [form]);

  const draft = Array.isArray(draftParam) ? draftParam[0] : draftParam;
  const selectCategoryId = Array.isArray(selectCategoryIdParam)
    ? selectCategoryIdParam[0]
    : selectCategoryIdParam;
  const selectCategoryKind = Array.isArray(selectCategoryKindParam)
    ? selectCategoryKindParam[0]
    : selectCategoryKindParam;

  useFocusEffect(
    useCallback(() => {
      if (!id && !formState.isDirty && !draft && !selectCategoryId) {
        resetForm();
      }
    }, [id, resetForm, formState.isDirty, draft, selectCategoryId])
  );

  useEffect(() => {
    if (id) {
      return;
    }
    if (draft && !draftAppliedRef.current) {
      try {
        const decoded = JSON.parse(decodeURIComponent(draft));
        if (decoded && typeof decoded === 'object') {
          form.reset({
            type: decoded.type ?? 'expense',
            amount: decoded.amount ?? '',
            date: decoded.date ?? toISODate(new Date()),
            categoryId: decoded.categoryId ?? '',
            description: decoded.description ?? '',
          });
          draftAppliedRef.current = true;
        }
      } catch {
        // ignore invalid drafts
      }
    }

    if (selectCategoryId) {
      const kind = selectCategoryKind === 'income' ? 'income' : 'expense';
      form.setValue('type', kind, { shouldDirty: true });
      form.setValue('categoryId', selectCategoryId, { shouldDirty: true });
    }
  }, [draft, form, id, selectCategoryId, selectCategoryKind]);

  useEffect(() => {
    if (!id) {
      return;
    }
    const loadMovement = async () => {
      const movement = await MovementsRepository.getById(id);
      if (!movement) {
        return;
      }
      form.reset({
        type: movement.type,
        amount: String(movement.amount),
        date: movement.date.slice(0, 10),
        categoryId: movement.categoryId,
        description: movement.description ?? '',
      });
    };
    void loadMovement();
  }, [form, id]);

  const selectedType = form.watch('type');
  const selectedCategory = form.watch('categoryId');
  const selectedDate = form.watch('date');

  const selectedCategoryItem = useMemo(
    () => categories.find((item) => item.id === selectedCategory),
    [categories, selectedCategory]
  );

  const categoriesByType = useMemo(
    () => {
      const key = selectedDate ? monthKey(parseISODate(selectedDate)) : '';
      return categories.filter(
        (category) =>
          category.kind === selectedType &&
          isCategoryVisibleForMonth(category, key)
      );
    },
    [categories, selectedType, selectedDate]
  );

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    const matchesType = categoriesByType.some((category) => category.id === selectedCategory);
    if (!matchesType) {
      form.setValue('categoryId', '');
    }
  }, [categoriesByType, form, selectedCategory]);

  const handleSave = form.handleSubmit(
    async (values) => {
      setBusy(true);
      setError('');
      const movement: Movement = {
        id: id ?? createId('mov'),
        type: values.type,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId,
        description: values.description?.trim() || undefined,
        shared: false,
      };

      try {
        if (id) {
          await updateMovement(movement);
        } else {
          await addMovement(movement);
        }
        resetForm();
        router.replace('/(drawer)/(tabs)/dashboard');
      } catch {
        setError('No se pudo guardar el movimiento.');
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

  const handleCancel = () => {
    resetForm();
    router.replace('/(drawer)/(tabs)/dashboard');
  };

  const typeOptions: { label: string; value: MovementType }[] = [
    { label: 'Gasto', value: 'expense' },
    { label: 'Ingreso', value: 'income' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="titleLarge">{id ? 'Editar movimiento' : 'Nuevo movimiento'}</AppText>

      <View style={styles.section}>
        <AppText variant="labelLarge">Tipo</AppText>
        <View style={styles.row}>
          {typeOptions.map((option) => (
            <AppChip
              key={option.value}
              selected={selectedType === option.value}
              onPress={() => form.setValue('type', option.value, { shouldDirty: true })}
            >
              {option.label}
            </AppChip>
          ))}
        </View>
      </View>

      <Controller
        control={form.control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Monto"
            value={String(value)}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        )}
      />

      <View style={styles.section}>
        <AppText variant="labelLarge">Fecha</AppText>
        <Pressable 
          onPress={() => {
            setTempDate(selectedDate ? parseISODate(selectedDate) : new Date());
            setShowDatePicker(true);
          }}
          style={[styles.dateInput, { borderColor: '#ccc' }]}
        >
          <AppText style={styles.dateInputText}>
            {selectedDate ? formatDateUI(selectedDate) : 'Seleccionar fecha'}
          </AppText>
          <AppIcon name="calendar-outline" size={20} />
        </Pressable>
        <View style={styles.quickDateButtons}>
          <AppButton 
            mode="outlined" 
            onPress={() =>
              form.setValue('date', toISODate(new Date()), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={styles.quickButton}
          >
            Hoy
          </AppButton>
          <AppButton 
            mode="outlined" 
            onPress={() =>
              form.setValue('date', toISODate(subDays(new Date(), 1)), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={styles.quickButton}
          >
            Ayer
          </AppButton>
          <AppButton 
            mode="outlined" 
            onPress={() =>
              form.setValue('date', toISODate(subDays(new Date(), 2)), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={styles.quickButton}
          >
            Hace 2 dias
          </AppButton>
        </View>
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
                  form.setValue('date', toISODate(tempDate), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
                setShowDatePicker(false);
              }}
            >
              Confirmar
            </AppButton>
          </View>
        </View>
      </AppModal>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
        <AppText variant="labelLarge">Categoria</AppText>
          <AppButton mode="outlined" onPress={() => setShowCategoryPicker(true)}>
            Elegir
          </AppButton>
        </View>
        {selectedCategory ? (
          <View style={styles.categoryInfo}>
            <AppText>{selectedCategoryItem?.name ?? 'Categoria'}</AppText>
            <AppChip compact>
              {selectedCategoryItem?.nature === 'fixed' ? 'Fijo' : 'Variable'}
            </AppChip>
          </View>
        ) : (
          <AppText style={styles.muted}>Selecciona una categoria</AppText>
        )}
        <View style={styles.createCategoryRow}>
          <AppText style={styles.createCategoryText}>
            ¿Quieres crear una nueva categoria?
          </AppText>
          <AppButton
            mode="text"
            onPress={() => {
              const values = form.getValues();
              const serialized = encodeURIComponent(JSON.stringify(values));
              router.push({
                pathname: '/(drawer)/(tabs)/categories/form',
                params: {
                  returnTo: 'new',
                  draft: serialized,
                  defaultKind: selectedType,
                },
              });
            }}
          >
            Crear categoria
          </AppButton>
        </View>
      </View>

      <Controller
        control={form.control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <AppInput label="Descripcion (opcional)" value={value} onChangeText={onChange} />
        )}
      />

      <View style={styles.footerActions}>
        <AppButton mode="outlined" onPress={handleCancel} disabled={busy}>
          Cancelar
        </AppButton>
        <AppButton loading={busy} onPress={handleSave}>
          Guardar
        </AppButton>
      </View>

      <AppModal
        visible={showCategoryPicker}
        onDismiss={() => setShowCategoryPicker(false)}
        contentStyle={styles.categoryPickerModal}
      >
        <View style={[styles.categoryPickerContainer, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="titleMedium" style={styles.categoryModalTitle}>
            Elegir categoria
          </AppText>
          <ScrollView
            style={styles.categoryModalList}
            contentContainerStyle={styles.categoryModalListContent}
          >
            {categoriesByType.length === 0 ? (
              <AppText style={styles.noCategoriesText}>No hay categorias para este tipo.</AppText>
            ) : (
              categoriesByType.map((category) => (
                <AppButton
                  key={category.id}
                  mode={category.id === selectedCategory ? 'contained' : 'outlined'}
                  onPress={() => {
                    form.setValue('categoryId', category.id, { shouldDirty: true });
                    setShowCategoryPicker(false);
                  }}
                  style={styles.categoryButton}
                >
                  <View style={styles.categoryButtonContent}>
                    <View
                      style={[
                        styles.categoryColorDot,
                        { backgroundColor: category.color ?? theme.colors.primary },
                      ]}
                    />
                    <AppText>{category.name}</AppText>
                  </View>
                </AppButton>
              ))
            )}
          </ScrollView>
          <View style={styles.categoryModalActions}>
            <AppButton mode="outlined" onPress={() => setShowCategoryPicker(false)}>
              Cancelar
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
  muted: {
    opacity: 0.6,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  createCategoryRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  createCategoryText: {
    opacity: 0.7,
    flex: 1,
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
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  quickButton: {
    flexGrow: 1,
    minWidth: 110,
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
  categoryPickerModal: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPickerContainer: {
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: 350,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  categoryModalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryModalList: {
    maxHeight: 360,
    marginBottom: 16,
  },
  categoryModalListContent: {
    gap: 10,
  },
  categoryButton: {
    marginVertical: 4,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noCategoriesText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  categoryModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modal: {
    padding: 20,
    margin: 24,
    borderRadius: 12,
    gap: 12,
  },
  modalList: {
    gap: 8,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
