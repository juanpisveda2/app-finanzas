import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppButton,
  AppCard,
  AppCardContent,
  AppChip,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../../../ui/components';
import { useCategoriesStore } from '../../../../state/categoriesStore';
import { Category } from '../../../../domain/models';
import { useAppTheme } from '../../../../ui/theme/useAppTheme';

export default function CategoriesScreen() {
  const router = useRouter();
  const { items, load, deleteCategory } = useCategoriesStore();
  const theme = useAppTheme();
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AppText variant="titleLarge">Categorias</AppText>
        <AppButton onPress={() => router.push('/(drawer)/(tabs)/categories/form')}>
          Nueva categoria
        </AppButton>
      </View>

      {sortedItems.length === 0 ? (
        <View style={styles.empty}>
          <AppText>Todavia no tenes categorias</AppText>
          <AppButton mode="outlined" onPress={() => router.push('/(drawer)/(tabs)/categories/form')}>
            Crear primera categoria
          </AppButton>
        </View>
      ) : (
        <View style={styles.list}>
          {sortedItems.map((category) => (
            <AppCard key={category.id} style={styles.card}>
              <AppCardContent>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: category.color ?? theme.colors.primary },
                      ]}
                    />
                    <AppText variant="titleMedium">{category.name}</AppText>
                  </View>
                  <View style={styles.row}>
                    <AppChip compact>{category.kind === 'expense' ? 'Gasto' : 'Ingreso'}</AppChip>
                    <AppChip compact>
                      {category.nature === 'fixed' ? 'Fijo' : 'Variable'}
                    </AppChip>
                    {category.isBasic && <AppChip compact>Basica</AppChip>}
                    {category.isEnjoyment && <AppChip compact>Disfrute</AppChip>}
                    <AppChip compact>
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </AppChip>
                  </View>
                </View>
                {(category.activeFrom || category.activeTo) && (
                  <AppText style={styles.muted}>
                    Visible: {category.activeFrom ?? '--'} a {category.activeTo ?? '--'}
                  </AppText>
                )}
                <View style={styles.actions}>
                  <AppButton
                    mode="text"
                    onPress={() =>
                      router.push({
                        pathname: '/(drawer)/(tabs)/categories/form',
                        params: { id: category.id },
                      })
                    }
                  >
                    Editar
                  </AppButton>
                  <AppButton mode="text" onPress={() => setPendingDelete(category)}>
                    Eliminar
                  </AppButton>
                </View>
              </AppCardContent>
            </AppCard>
          ))}
        </View>
      )}

      <AppModal
        visible={!!pendingDelete}
        onDismiss={() => setPendingDelete(null)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Eliminar categoria</AppText>
        <AppText>Seguro que deseas eliminar esta categoria?</AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setPendingDelete(null)}>
            Cancelar
          </AppButton>
          <AppButton
            onPress={async () => {
              if (pendingDelete) {
                await deleteCategory(pendingDelete.id);
              }
              setPendingDelete(null);
            }}
          >
            Eliminar
          </AppButton>
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
  },
  cardHeader: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  muted: {
    opacity: 0.6,
  },
  modal: {
    padding: 20,
    margin: 24,
    borderRadius: 12,
    gap: 12,
    maxHeight: '90%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
