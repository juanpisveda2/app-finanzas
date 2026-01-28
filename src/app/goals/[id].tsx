import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { differenceInCalendarDays } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  AppButton,
  AppCard,
  AppCardContent,
  AppIcon,
  AppListItem,
  AppModal,
  AppSnackbar,
  AppText,
} from '../../ui/components';
import { useGoalsStore } from '../../state/goalsStore';
import { GoalContribution } from '../../domain/models';
import { formatMoney } from '../../lib/money';
import { formatDateUI, parseISODate } from '../../lib/date';
import {
  deleteGoalContribution,
  deleteGoalContributionsByGoalId,
  listGoalContributions,
} from '../../data/storage/goalMetaStorage';
import { useAppTheme } from '../../ui/theme/useAppTheme';

export default function GoalDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const goalId = params.id;
  const { items, load, updateGoal, deleteGoal } = useGoalsStore();
  const theme = useAppTheme();

  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteContributionTarget, setDeleteContributionTarget] =
    useState<GoalContribution | null>(null);
  const [snackbar, setSnackbar] = useState('');

  const goal = useMemo(
    () => items.find((item) => item.id === goalId),
    [goalId, items]
  );

  const loadContributions = useCallback(async () => {
    if (!goalId) {
      return;
    }
    const items = await listGoalContributions(goalId);
    const sorted = [...items].sort((a, b) => {
      const dateA = parseISODate(a.date).getTime();
      const dateB = parseISODate(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setContributions(sorted);
  }, [goalId]);

  useEffect(() => {
    if (!goal) {
      void load();
    }
  }, [goal, load]);

  useEffect(() => {
    void loadContributions();
  }, [loadContributions]);

  const handleDeleteGoal = async () => {
    if (!goal) {
      return;
    }
    await deleteGoal(goal.id);
    await deleteGoalContributionsByGoalId(goal.id);
    setDeleteModalVisible(false);
    router.back();
  };

  const handleDeleteContribution = async () => {
    if (!goal || !deleteContributionTarget) {
      return;
    }
    await deleteGoalContribution(deleteContributionTarget.id);
    await updateGoal({
      ...goal,
      currentAmount: Math.max(goal.currentAmount - deleteContributionTarget.amount, 0),
    });
    setDeleteContributionTarget(null);
    setSnackbar('Aporte eliminado');
    await loadContributions();
  };

  const renderPlan = () => {
    if (!goal?.targetAmount || !goal.targetDate) {
      return null;
    }
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    if (remaining <= 0) {
      return (
        <AppCard style={styles.planCard}>
          <AppCardContent>
            <AppText variant="titleMedium">Plan sugerido</AppText>
            <AppText>¡Meta cumplida! 🎉</AppText>
          </AppCardContent>
        </AppCard>
      );
    }
    const daysLeft = differenceInCalendarDays(
      parseISODate(goal.targetDate),
      new Date()
    );
    if (daysLeft <= 0) {
      return (
        <AppCard style={styles.planCard}>
          <AppCardContent>
            <AppText variant="titleMedium">Plan sugerido</AppText>
            <AppText>
              La fecha objetivo ya pasó. Ajustá la fecha o el objetivo.
            </AppText>
          </AppCardContent>
        </AppCard>
      );
    }
    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    const perWeek = Math.ceil(remaining / weeksLeft);
    const perDay = Math.ceil(remaining / daysLeft);
    return (
      <AppCard style={styles.planCard}>
        <AppCardContent style={styles.planContent}>
          <AppText variant="titleMedium">Plan sugerido</AppText>
          <AppText>Por semana: {formatMoney(perWeek)}</AppText>
          <AppText>Por día: {formatMoney(perDay)}</AppText>
          <AppText>
            Si aportás {formatMoney(perWeek)} por semana, llegás el{' '}
            {formatDateUI(goal.targetDate)}.
          </AppText>
        </AppCardContent>
      </AppCard>
    );
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <AppIcon name="arrow-left" size={22} />
            </Pressable>
            <AppText variant="titleMedium">Detalle de meta</AppText>
          </View>
        </SafeAreaView>
        <AppText>Meta no encontrada.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-left" size={22} />
          </Pressable>
          <AppText variant="titleMedium">Detalle de meta</AppText>
        </View>
      </SafeAreaView>

      <View style={styles.actionsRow}>
        <AppButton
          mode="text"
          onPress={() => router.push({ pathname: '/goals/form', params: { id: goal.id } })}
        >
          Editar meta
        </AppButton>
        <AppButton mode="text" onPress={() => setDeleteModalVisible(true)}>
          Eliminar meta
        </AppButton>
      </View>

      <AppCard style={styles.summaryCard}>
        <AppCardContent style={styles.summaryContent}>
          <AppText variant="labelLarge">{goal.name}</AppText>
          <AppText variant="headlineMedium">
            {formatMoney(goal.currentAmount)}
          </AppText>
          <AppText>Total aportado</AppText>
        </AppCardContent>
      </AppCard>

      {renderPlan()}

      <View style={styles.sectionHeader}>
        <AppText variant="titleMedium">Aportes</AppText>
      </View>
      <FlatList
        data={contributions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppListItem
            title={`+${formatMoney(item.amount)}`}
            description={formatDateUI(item.date)}
            right={() => (
              <AppButton mode="text" onPress={() => setDeleteContributionTarget(item)}>
                Eliminar
              </AppButton>
            )}
          />
        )}
        ListEmptyComponent={<AppText>No hay aportes todavia.</AppText>}
        contentContainerStyle={styles.list}
      />

      <AppModal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Eliminar meta</AppText>
        <AppText>Esta accion no se puede deshacer.</AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setDeleteModalVisible(false)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleDeleteGoal}>Eliminar</AppButton>
        </View>
      </AppModal>

      <AppModal
        visible={!!deleteContributionTarget}
        onDismiss={() => setDeleteContributionTarget(null)}
        contentStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <AppText variant="titleMedium">Eliminar aporte</AppText>
        <AppText>Esta accion no se puede deshacer.</AppText>
        <View style={styles.modalActions}>
          <AppButton mode="outlined" onPress={() => setDeleteContributionTarget(null)}>
            Cancelar
          </AppButton>
          <AppButton onPress={handleDeleteContribution}>Eliminar</AppButton>
        </View>
      </AppModal>

      <AppSnackbar visible={!!snackbar} onDismiss={() => setSnackbar('')}>
        {snackbar}
      </AppSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  safe: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  summaryCard: {
    borderRadius: 16,
  },
  summaryContent: {
    gap: 6,
  },
  planCard: {
    borderRadius: 16,
  },
  planContent: {
    gap: 6,
  },
  sectionHeader: {
    marginTop: 8,
  },
  list: {
    gap: 8,
    paddingBottom: 40,
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
