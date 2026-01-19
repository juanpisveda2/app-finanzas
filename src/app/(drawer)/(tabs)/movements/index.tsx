import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppButton,
  AppChip,
  AppInput,
  AppListItem,
  AppModal,
  AppText,
} from '../../../../ui/components';
import { useMovementsStore } from '../../../../state/movementsStore';
import { useCategoriesStore } from '../../../../state/categoriesStore';
import { formatMoney } from '../../../../lib/money';
import { useAppTheme } from '../../../../ui/theme/useAppTheme';
import { formatDateUI, formatMonth, shiftMonth } from '../../../../lib/date';

type FilterType = 'all' | 'income' | 'expense';

export default function MovementsScreen() {
  const router = useRouter();
  const { items, selectedMonth, loadMonth, setMonth, deleteMovement } = useMovementsStore();
  const { items: categories, load: loadCategories } = useCategoriesStore();
  const theme = useAppTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    void loadCategories();
    void loadMonth();
  }, [loadCategories, loadMonth]);

  const categoriesMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories]
  );

  const filtered = useMemo(() => {
    return items.filter((movement) => {
      if (filter !== 'all' && movement.type !== filter) {
        return false;
      }
      if (query.trim().length > 0) {
        const text = `${movement.description ?? ''} ${categoriesMap.get(movement.categoryId) ?? ''}`;
        return text.toLowerCase().includes(query.trim().toLowerCase());
      }
      return true;
    });
  }, [items, filter, query, categoriesMap]);

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, -1))}>
          {'<'}
        </AppButton>
        <AppText variant="titleMedium">{formatMonth(selectedMonth)}</AppText>
        <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, 1))}>
          {'>'}
        </AppButton>
      </View>

      <AppInput
        label="Buscar"
        value={query}
        onChangeText={setQuery}
        placeholder="Descripcion o categoria"
      />

      <View style={styles.filters}>
        <AppChip selected={filter === 'all'} onPress={() => setFilter('all')}>
          Todos
        </AppChip>
        <AppChip selected={filter === 'income'} onPress={() => setFilter('income')}>
          Ingresos
        </AppChip>
        <AppChip selected={filter === 'expense'} onPress={() => setFilter('expense')}>
          Gastos
        </AppChip>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <AppText>No hay movimientos para mostrar.</AppText>
          <AppButton onPress={() => router.push('/(drawer)/(tabs)/new')}>
            Agregar movimiento
          </AppButton>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppListItem
              title={item.description || categoriesMap.get(item.categoryId) || 'Movimiento'}
              description={formatDateUI(item.date)}
              right={() => (
                <AppText
                  style={[
                    styles.amount,
                    item.type === 'expense' ? styles.expense : styles.income,
                  ]}
                >
                  {formatMoney(item.amount)}
                </AppText>
              )}
              onPress={() => router.push(`/(drawer)/(tabs)/new?id=${item.id}`)}
              onLongPress={() => setToDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <AppModal
        visible={!!toDelete}
        onDismiss={() => setToDelete(null)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Eliminar movimiento</AppText>
        <AppText>Seguro que deseas eliminar este movimiento?</AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setToDelete(null)}>
            Cancelar
          </AppButton>
          <AppButton
            onPress={async () => {
              if (toDelete) {
                await deleteMovement(toDelete);
              }
              setToDelete(null);
            }}
          >
            Eliminar
          </AppButton>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  amount: {
    marginTop: 8,
  },
  income: {
    color: '#1B5E20',
  },
  expense: {
    color: '#B71C1C',
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
