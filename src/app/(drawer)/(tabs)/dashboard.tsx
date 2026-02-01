import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppCard,
  AppCardContent,
  AppText,
  AppButton,
  AppListItem,
  AppModal,
  AppIcon,
  AppSnackbar,
} from '../../../ui/components';
import { useMovementsStore } from '../../../state/movementsStore';
import { useCategoriesStore } from '../../../state/categoriesStore';
import { formatDateUI, formatMonth, shiftMonth } from '../../../lib/date';
import { formatMoney } from '../../../lib/money';
import { getMonthTotals, getRecentMovements, getTopExpenseCategory } from '../../../domain/calculations';
import { Movement } from '../../../domain/models';
import { useAppTheme } from '../../../ui/theme/useAppTheme';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { items, selectedMonth, loadMonth, setMonth, deleteMovement } = useMovementsStore();
  const { items: categories, load: loadCategories } = useCategoriesStore();
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [error, setError] = useState('');
  const detailsAnim = useRef(new Animated.Value(0)).current;
  const introAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    void loadCategories();
    void loadMonth();
  }, [loadCategories, loadMonth]);

  const runIntroAnimations = () => {
    introAnims.forEach((anim) => anim.setValue(0));
    Animated.stagger(
      80,
      introAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        })
      )
    ).start();
  };

  useEffect(() => {
    runIntroAnimations();
  }, [introAnims]);

  useEffect(() => {
    runIntroAnimations();
  }, [selectedMonth]);

  const totals = useMemo(() => getMonthTotals(items), [items]);
  const recent = useMemo(() => getRecentMovements(items, 5), [items]);
  const topCategory = useMemo(
    () => getTopExpenseCategory(items, categories),
    [items, categories]
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedMovement?.categoryId),
    [categories, selectedMovement]
  );

  const openDetails = (movement: Movement) => {
    setSelectedMovement(movement);
    detailsAnim.setValue(0);
    setDetailsVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(detailsAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDetails = () => {
    Animated.timing(detailsAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDetailsVisible(false);
        setSelectedMovement(null);
        setBusyDelete(false);
        setConfirmVisible(false);
      }
    });
  };

  const handleEdit = () => {
    if (!selectedMovement) {
      return;
    }
    closeDetails();
    router.push({ pathname: '/(drawer)/(tabs)/new', params: { id: selectedMovement.id } });
  };

  const handleDelete = async () => {
    if (!selectedMovement || busyDelete) {
      return;
    }
    setConfirmVisible(false);
    setBusyDelete(true);
    try {
      await deleteMovement(selectedMovement.id);
      closeDetails();
    } catch {
      setError('No se pudo eliminar el movimiento.');
      setBusyDelete(false);
    }
  };

  const detailsAnimatedStyle = {
    opacity: detailsAnim,
    transform: [
      {
        translateY: detailsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: detailsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const introStyle = (index: number) => ({
    opacity: introAnims[index],
    transform: [
      {
        translateY: introAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={introStyle(0)}>
        <View style={styles.monthRow}>
          <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, -1))}>
            {'<'}
          </AppButton>
          <AppText variant="titleMedium">{formatMonth(selectedMonth)}</AppText>
          <AppButton mode="outlined" onPress={() => setMonth(shiftMonth(selectedMonth, 1))}>
            {'>'}
          </AppButton>
        </View>
      </Animated.View>

      <Animated.View style={introStyle(1)}>
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
      </Animated.View>
      <Animated.View style={introStyle(2)}>
        <AppCard>
          <AppCardContent>
            <AppText variant="labelLarge">Balance</AppText>
            <AppText variant="headlineMedium">{formatMoney(totals.balance)}</AppText>
          </AppCardContent>
        </AppCard>
      </Animated.View>

      <Animated.View style={introStyle(3)}>
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
                onPress={() => openDetails(movement)}
                right={() => (
                  <AppText
                    numberOfLines={1}
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
      </Animated.View>

      <Animated.View style={introStyle(4)}>
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
      </Animated.View>

      <AppModal
        visible={detailsVisible}
        onDismiss={closeDetails}
        contentStyle={styles.detailsModal}
      >
        <Animated.View
          style={[
            styles.detailsCard,
            detailsAnimatedStyle,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.detailsHeader}>
            <View>
              <AppText variant="titleMedium">
                {selectedMovement?.description || 'Movimiento'}
              </AppText>
              <AppText style={styles.detailsDate}>
                {selectedMovement ? formatDateUI(selectedMovement.date) : ''}
              </AppText>
            </View>
            <Pressable
              onPress={closeDetails}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            >
              <AppIcon name="close" size={20} color={theme.colors.onSurface} />
            </Pressable>
          </View>

          <AppText
            variant="headlineSmall"
            numberOfLines={1}
            style={[
              styles.detailsAmount,
              selectedMovement?.type === 'expense' ? styles.expense : styles.income,
            ]}
          >
            {selectedMovement ? formatMoney(selectedMovement.amount) : ''}
          </AppText>

          <View
            style={[
              styles.typePill,
              {
                backgroundColor:
                  selectedMovement?.type === 'expense'
                    ? 'rgba(183, 28, 28, 0.12)'
                    : 'rgba(27, 94, 32, 0.12)',
              },
            ]}
          >
            <AppText style={styles.typePillText}>
              {selectedMovement?.type === 'expense' ? 'Gasto' : 'Ingreso'}
            </AppText>
          </View>

          <View style={styles.detailsMeta}>
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>Categoria</AppText>
              <AppText>{selectedCategory?.name ?? 'Sin categoria'}</AppText>
            </View>
          </View>

          <View style={styles.detailsActions}>
            <AppButton mode="outlined" onPress={handleEdit}>
              Editar
            </AppButton>
            <AppButton
              mode="contained"
              onPress={() => setConfirmVisible(true)}
              loading={busyDelete}
              buttonColor={theme.colors.tertiary}
            >
              Eliminar
            </AppButton>
          </View>
        </Animated.View>
      </AppModal>

      <AppModal
        visible={confirmVisible}
        onDismiss={() => setConfirmVisible(false)}
        contentStyle={styles.confirmModal}
      >
        <View style={[styles.confirmCard, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="titleMedium">Confirmar eliminacion</AppText>
          <AppText style={styles.confirmText}>
            Este movimiento se eliminara de forma permanente.
          </AppText>
          <View style={styles.confirmActions}>
            <AppButton mode="outlined" onPress={() => setConfirmVisible(false)}>
              Cancelar
            </AppButton>
            <AppButton
              mode="contained"
              onPress={handleDelete}
              loading={busyDelete}
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
    fontVariant: ['tabular-nums'],
    minWidth: 120,
    textAlign: 'right',
    flexShrink: 0,
  },
  income: {
    color: '#1B5E20',
  },
  expense: {
    color: '#B71C1C',
  },
  detailsModal: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsDate: {
    opacity: 0.6,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  closePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  detailsAmount: {
    fontVariant: ['tabular-nums'],
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsMeta: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    opacity: 0.6,
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
