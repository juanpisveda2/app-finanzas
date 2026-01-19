import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppCard, AppCardContent, AppText, AppButton, AppListItem } from '../../../ui/components';
import { useMovementsStore } from '../../../state/movementsStore';
import { useCategoriesStore } from '../../../state/categoriesStore';
import { formatDateUI, formatMonth, shiftMonth } from '../../../lib/date';
import { formatMoney } from '../../../lib/money';
import { getMonthTotals, getRecentMovements, getTopExpenseCategory } from '../../../domain/calculations';

export default function DashboardScreen() {
  const { items, selectedMonth, loadMonth, setMonth } = useMovementsStore();
  const { items: categories, load: loadCategories } = useCategoriesStore();

  useEffect(() => {
    void loadCategories();
    void loadMonth();
  }, [loadCategories, loadMonth]);

  const totals = useMemo(() => getMonthTotals(items), [items]);
  const recent = useMemo(() => getRecentMovements(items, 5), [items]);
  const topCategory = useMemo(
    () => getTopExpenseCategory(items, categories),
    [items, categories]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.monthRow}>
        <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, -1))}>
          {'<'}
        </AppButton>
        <AppText variant="titleMedium">{formatMonth(selectedMonth)}</AppText>
        <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, 1))}>
          {'>'}
        </AppButton>
      </View>

      <View style={styles.cardsRow}>
        <AppCard style={styles.card}>
          <AppCardContent>
            <AppText variant="labelLarge">Ingresos</AppText>
            <AppText variant="titleLarge">{formatMoney(totals.income)}</AppText>
          </AppCardContent>
        </AppCard>
        <AppCard style={styles.card}>
          <AppCardContent>
            <AppText variant="labelLarge">Gastos</AppText>
            <AppText variant="titleLarge">{formatMoney(totals.expense)}</AppText>
          </AppCardContent>
        </AppCard>
      </View>
      <AppCard>
        <AppCardContent>
          <AppText variant="labelLarge">Balance</AppText>
          <AppText variant="headlineMedium">{formatMoney(totals.balance)}</AppText>
        </AppCardContent>
      </AppCard>

      <View style={styles.section}>
        <AppText variant="titleMedium">Movimientos recientes</AppText>
        {recent.length === 0 ? (
          <AppText style={styles.muted}>Todavia no hay movimientos este mes.</AppText>
        ) : (
          recent.map((movement) => (
            <AppListItem
              key={movement.id}
              title={movement.description || 'Sin descripcion'}
              description={formatDateUI(movement.date)}
              right={() => (
                <AppText
                  style={[
                    styles.amount,
                    movement.type === 'expense' ? styles.expense : styles.income,
                  ]}
                >
                  {formatMoney(movement.amount)}
                </AppText>
              )}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="titleMedium">Insight del mes</AppText>
        {topCategory ? (
          <AppText>
            Mayor gasto en {topCategory.category.name}:{' '}
            {formatMoney(topCategory.total)}
          </AppText>
        ) : (
          <AppText style={styles.muted}>Sin datos suficientes todavia.</AppText>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
  },
  section: {
    gap: 8,
  },
  muted: {
    opacity: 0.6,
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
});
