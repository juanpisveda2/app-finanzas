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
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  const expenseItems = useMemo(
    () => sortedItems.filter((category) => category.kind === 'expense'),
    [sortedItems]
  );
  const incomeItems = useMemo(
    () => sortedItems.filter((category) => category.kind === 'income'),
    [sortedItems]
  );
  const visibleItems = activeTab === 'expense' ? expenseItems : incomeItems;

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
          <View style={styles.tabs}>
            <AppButton
              mode={activeTab === 'expense' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('expense')}
              style={styles.tabButton}
            >
              Gastos
            </AppButton>
            <AppButton
              mode={activeTab === 'income' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('income')}
              style={styles.tabButton}
            >
              Ingresos
            </AppButton>
          </View>

          {visibleItems.length === 0 ? (
            <AppText style={styles.muted}>
              {activeTab === 'expense'
                ? 'Sin categorias de gastos.'
                : 'Sin categorias de ingresos.'}
            </AppText>
          ) : (
            visibleItems.map((category) => (
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
                      <AppChip compact>
                        {category.kind === 'expense' ? 'Gasto' : 'Ingreso'}
                      </AppChip>
                      <AppChip compact>
                        {category.nature === 'fixed' ? 'Fijo' : 'Variable'}
                      </AppChip>
                      {category.kind === 'expense' && category.isBasic && (
                        <AppChip compact>Basica</AppChip>
                      )}
                      {category.kind === 'expense' && category.isEnjoyment && (
                        <AppChip compact>Disfrute</AppChip>
                      )}
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
            ))
          )}
        </View>
      )}

      <AppModal
        visible={!!pendingDelete}
        onDismiss={() => setPendingDelete(null)}
        contentStyle={styles.confirmModal}
      >
        <View style={[styles.confirmCard, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="titleMedium">Eliminar categoria</AppText>
          <AppText style={styles.confirmText}>
            Esta categoria se eliminara de forma permanente.
          </AppText>
          <View style={styles.confirmActions}>
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
              buttonColor={theme.colors.tertiary}
            >
              Eliminar
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
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
  confirmModal: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  confirmText: {
    opacity: 0.7,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
});
