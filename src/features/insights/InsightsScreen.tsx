import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppCardContent,
  AppListItem,
  AppModal,
  AppText,
} from '../../ui/components';
import { useAppTheme } from '../../ui/theme/useAppTheme';
import { useMovementsStore } from '../../state/movementsStore';
import { useCategoriesStore } from '../../state/categoriesStore';
import { useGoalsStore } from '../../state/goalsStore';
import { formatMoney } from '../../lib/money';
import { formatDateUI, formatMonth, shiftMonth } from '../../lib/date';
import {
  getExpenseBreakdown,
  getFixedExpenseShare,
  getMonthTotals,
} from '../../domain/calculations';
import { DonutCard } from './components/DonutCard';
import { InsightTipCard } from './components/InsightTipCard';
import { InsightsBlock } from './components/InsightsBlock';
import { SkeletonInsights } from './components/SkeletonInsights';
import { MovementsRepository } from '../../data/repositories/movementsRepository';
import { Goal } from '../../domain/models';
import { MotiPressable } from 'moti/interactions';

const PRIORITY_WEIGHT: Record<Goal['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const MIN_LOADING_MS = 480;

export default function InsightsScreen() {
  const theme = useAppTheme();
  const { items, selectedMonth, loadMonth, setMonth, loading } = useMovementsStore();
  const { items: categories, load: loadCategories } = useCategoriesStore();
  const { items: goals, load: loadGoals } = useGoalsStore();
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [previousTotals, setPreviousTotals] = useState<{ income: number; expense: number } | null>(
    null
  );

  useEffect(() => {
    void loadCategories();
    void loadGoals();
    void loadMonth();
  }, [loadCategories, loadGoals, loadMonth]);

  useEffect(() => {
    let isActive = true;
    const loadPreviousMonth = async () => {
      const previousItems = await MovementsRepository.listByMonth(
        shiftMonth(selectedMonth, -1)
      );
      if (!isActive) {
        return;
      }
      const totals = getMonthTotals(previousItems);
      setPreviousTotals({ income: totals.income, expense: totals.expense });
    };
    void loadPreviousMonth();
    return () => {
      isActive = false;
    };
  }, [selectedMonth]);

  const totals = useMemo(() => getMonthTotals(items), [items]);
  const breakdown = useMemo(
    () => getExpenseBreakdown(items, categories),
    [items, categories]
  );
  const fixedShare = useMemo(
    () => getFixedExpenseShare(items, categories),
    [items, categories]
  );

  const monthOptions = useMemo(() => {
    const offsets = [-2, -1, 0, 1, 2];
    return offsets.map((offset) => shiftMonth(selectedMonth, offset));
  }, [selectedMonth]);

  const handleMonthChange = async (date: Date) => {
    setMonthModalVisible(false);
    setMonthLoading(true);
    await Promise.all([setMonth(date), new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS))]);
    setMonthLoading(false);
  };

  const balanceColor = totals.balance >= 0 ? theme.colors.secondary : theme.colors.error;
  const incomeExpenseRatio =
    totals.income > 0 ? Math.min(totals.expense / totals.income, 1) : null;

  const tips = useMemo(() => {
    const values: string[] = [];
    if (breakdown.items.length > 0) {
      const top = breakdown.items
        .filter((item) => !item.isOther)
        .sort((a, b) => b.amount - a.amount)[0];
      if (top) {
        values.push(`${top.label} fue tu mayor gasto (${Math.round(top.percentage * 100)}%).`);
      }
    }

    if (previousTotals) {
      const diff = totals.expense - previousTotals.expense;
      if (diff > 0) {
        values.push(`Este mes gastaste ${formatMoney(diff)} mas que el mes pasado.`);
      } else if (diff < 0) {
        values.push(`Este mes gastaste ${formatMoney(Math.abs(diff))} menos que el mes pasado.`);
      } else {
        values.push('Tus gastos quedaron iguales al mes pasado.');
      }
    } else {
      values.push('Cuando tengas mas datos, vas a poder comparar con el mes pasado.');
    }

    if (fixedShare) {
      values.push(
        `Tus gastos fijos representan el ${Math.round(fixedShare.fixedShare * 100)}% del total.`
      );
      if (totals.income > 0 && fixedShare.fixedTotal > 0) {
        const remaining = totals.income - fixedShare.fixedTotal;
        const remainingText =
          remaining >= 0
            ? `Luego de gastos fijos te quedan ${formatMoney(remaining)}.`
            : `Luego de gastos fijos tu saldo es ${formatMoney(remaining)}.`;
        values.push(remainingText);
      }
    }

    while (values.length < 2) {
      values.push('Suma movimientos para ver mas insights utiles del mes.');
    }

    return values.slice(0, 4);
  }, [breakdown.items, fixedShare, previousTotals, totals.expense, totals.income]);

  const highlightedGoal = useMemo(() => {
    if (goals.length === 0) {
      return null;
    }
    return [...goals].sort((a, b) => {
      const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (byPriority !== 0) {
        return byPriority;
      }
      return (b.targetAmount ?? 0) - (a.targetAmount ?? 0);
    })[0];
  }, [goals]);

  const goalProgress =
    highlightedGoal && highlightedGoal.targetAmount
      ? Math.min(highlightedGoal.currentAmount / highlightedGoal.targetAmount, 1)
      : null;

  if (loading || monthLoading) {
    return <SkeletonInsights />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <AppText variant="titleMedium">Mes: {formatMonth(selectedMonth)}</AppText>
          <AppText style={styles.muted}>Resumen automatico del mes actual.</AppText>
        </View>
        <AppButton mode="outlined" onPress={() => setMonthModalVisible(true)}>
          Cambiar
        </AppButton>
      </View>

      <InsightsBlock index={0}>
        <View style={styles.summaryRow}>
          <MotiPressable
            onPress={() => {}}
            animate={({ pressed }) => ({
              scale: pressed ? 0.98 : 1,
              opacity: pressed ? 0.9 : 1,
            })}
            transition={{ type: 'timing', duration: 120 }}
            style={styles.summaryCard}
          >
            <AppCard style={styles.card}>
              <AppCardContent>
                <AppText variant="labelLarge">Ingresos</AppText>
                <AppText variant="titleLarge">{formatMoney(totals.income)}</AppText>
              </AppCardContent>
            </AppCard>
          </MotiPressable>
          <MotiPressable
            onPress={() => {}}
            animate={({ pressed }) => ({
              scale: pressed ? 0.98 : 1,
              opacity: pressed ? 0.9 : 1,
            })}
            transition={{ type: 'timing', duration: 120 }}
            style={styles.summaryCard}
          >
            <AppCard style={styles.card}>
              <AppCardContent>
                <AppText variant="labelLarge">Gastos</AppText>
                <AppText variant="titleLarge">{formatMoney(totals.expense)}</AppText>
              </AppCardContent>
            </AppCard>
          </MotiPressable>
          <MotiPressable
            onPress={() => {}}
            animate={({ pressed }) => ({
              scale: pressed ? 0.98 : 1,
              opacity: pressed ? 0.9 : 1,
            })}
            transition={{ type: 'timing', duration: 120 }}
            style={styles.summaryCard}
          >
            <AppCard style={styles.card}>
              <AppCardContent>
                <AppText variant="labelLarge">Balance</AppText>
                <AppText variant="titleLarge" style={{ color: balanceColor }}>
                  {formatMoney(totals.balance)}
                </AppText>
              </AppCardContent>
            </AppCard>
          </MotiPressable>
        </View>
      </InsightsBlock>

      <InsightsBlock index={1}>
        <DonutCard title="Gastos por categoria" total={breakdown.total} items={breakdown.items} />
      </InsightsBlock>

      <InsightsBlock index={2}>
        <View style={styles.block}>
          <AppText variant="titleMedium">Insights del mes</AppText>
          <View style={styles.tips}>
            {tips.map((tip, index) => (
              <InsightTipCard key={`${index}-${tip}`} text={tip} />
            ))}
          </View>
        </View>
      </InsightsBlock>

      <InsightsBlock index={3}>
        <AppCard style={styles.card}>
          <AppCardContent style={styles.block}>
            <AppText variant="titleMedium">Ingresos vs gastos</AppText>
            {incomeExpenseRatio === null ? (
              <AppText style={styles.muted}>
                Registra ingresos para ver esta comparativa.
              </AppText>
            ) : (
              <>
                <AppText>
                  Gastos representan el {Math.round(incomeExpenseRatio * 100)}% de tus ingresos.
                </AppText>
                <View style={[styles.bar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${incomeExpenseRatio * 100}%`,
                        backgroundColor: theme.colors.tertiary,
                      },
                    ]}
                  />
                </View>
              </>
            )}
          </AppCardContent>
        </AppCard>
      </InsightsBlock>

      <InsightsBlock index={4}>
        <AppCard style={styles.card}>
          <AppCardContent style={styles.block}>
            <AppText variant="titleMedium">Meta destacada</AppText>
            {highlightedGoal ? (
              <>
                <AppText variant="titleLarge">{highlightedGoal.name}</AppText>
                {highlightedGoal.targetAmount ? (
                  <>
                    <AppText>
                      {Math.round((goalProgress ?? 0) * 100)}% completado
                    </AppText>
                    <View style={[styles.bar, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${(goalProgress ?? 0) * 100}%`,
                            backgroundColor: theme.colors.secondary,
                          },
                        ]}
                      />
                    </View>
                    <AppText>
                      Faltan {formatMoney(
                        Math.max(highlightedGoal.targetAmount - highlightedGoal.currentAmount, 0)
                      )}
                      .
                    </AppText>
                  </>
                ) : (
                  <AppText style={styles.muted}>
                    Defini un monto objetivo para medir el avance.
                  </AppText>
                )}
                {highlightedGoal.targetDate ? (
                  <AppText style={styles.muted}>
                    Objetivo para {formatDateUI(highlightedGoal.targetDate)}.
                  </AppText>
                ) : null}
              </>
            ) : (
              <AppText style={styles.muted}>
                Todavia no hay metas. Podes crear una para seguir tu progreso.
              </AppText>
            )}
          </AppCardContent>
        </AppCard>
      </InsightsBlock>

      <AppModal
        visible={monthModalVisible}
        onDismiss={() => setMonthModalVisible(false)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Seleccionar mes</AppText>
        <View style={styles.monthList}>
          {monthOptions.map((option) => (
            <AppListItem
              key={option.toISOString()}
              title={formatMonth(option)}
              onPress={() => handleMonthChange(option)}
              right={() =>
                option.getMonth() === selectedMonth.getMonth() &&
                option.getFullYear() === selectedMonth.getFullYear() ? (
                  <AppText style={styles.muted}>Actual</AppText>
                ) : null
              }
            />
          ))}
        </View>
        <AppButton mode="outlined" onPress={() => setMonthModalVisible(false)}>
          Cerrar
        </AppButton>
      </AppModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 120,
  },
  card: {
    borderRadius: 18,
  },
  block: {
    gap: 12,
  },
  tips: {
    gap: 10,
  },
  bar: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  muted: {
    opacity: 0.6,
  },
  modal: {
    padding: 20,
    margin: 24,
    borderRadius: 16,
    gap: 12,
  },
  monthList: {
    gap: 4,
  },
});
