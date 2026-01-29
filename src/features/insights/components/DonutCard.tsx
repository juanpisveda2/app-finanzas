import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Svg, G, Path } from 'react-native-svg';
import { arc, pie, PieArcDatum } from 'd3-shape';
import { AnimatePresence, MotiView } from 'moti';

import { AppCard, AppCardContent, AppText } from '../../../ui/components';
import { formatMoney } from '../../../lib/money';
import { useAppTheme } from '../../../ui/theme/useAppTheme';
import { ExpenseCategorySlice } from '../../../domain/calculations';

type DonutCardProps = {
  title: string;
  total: number;
  items: ExpenseCategorySlice[];
};

export function DonutCard({ title, total, items }: DonutCardProps) {
  const theme = useAppTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const size = 200;
  const radius = size / 2;
  const innerRadius = radius * 0.62;
  const outerRadius = radius * 0.92;

  const slices = useMemo(() => {
    if (items.length === 0) {
      return [];
    }
    return pie<ExpenseCategorySlice>()
      .value((item) => item.amount)
      .sort(null)(items);
  }, [items]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const renderSlice = (slice: PieArcDatum<ExpenseCategorySlice>) => {
    const isSelected = slice.data.id === selectedId;
    const arcGen = arc<PieArcDatum<ExpenseCategorySlice>>()
      .innerRadius(innerRadius)
      .outerRadius(isSelected ? outerRadius + 8 : outerRadius)
      .cornerRadius(10)
      .padAngle(0.02);
    const path = arcGen(slice);
    if (!path) {
      return null;
    }
    return (
      <Path
        key={slice.data.id}
        d={path}
        fill={slice.data.color}
        opacity={selectedId && !isSelected ? 0.35 : 1}
        onPress={() => {
          setSelectedId((current) => (current === slice.data.id ? null : slice.data.id));
        }}
      />
    );
  };

  return (
    <AppCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <AppCardContent>
        <AppText variant="titleMedium">{title}</AppText>

        {items.length === 0 ? (
          <AppText style={styles.muted}>Aun no hay gastos para este mes.</AppText>
        ) : (
          <View style={styles.chartArea}>
            <Pressable
              style={StyleSheet.absoluteFill}
              pointerEvents={selected ? 'auto' : 'none'}
              onPress={() => setSelectedId(null)}
            />
            <View style={styles.chartWrap} pointerEvents="box-none">
              <Svg width={size} height={size}>
                <G x={radius} y={radius}>
                  {slices.map(renderSlice)}
                </G>
              </Svg>

              <View style={[styles.centerLabel, { backgroundColor: theme.colors.surface }]}>
                <AppText variant="labelLarge">Total</AppText>
                <AppText variant="titleMedium">{formatMoney(total)}</AppText>
              </View>

              <AnimatePresence>
                {selected ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'timing', duration: 180 }}
                    style={[styles.tooltip, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <AppText variant="labelLarge">{selected.label}</AppText>
                    <AppText variant="titleMedium">{formatMoney(selected.amount)}</AppText>
                    <AppText style={styles.muted}>
                      {Math.round(selected.percentage * 100)}% del total
                    </AppText>
                  </MotiView>
                ) : null}
              </AnimatePresence>
            </View>

            <View style={styles.list}>
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={(event) => {
                      event.stopPropagation();
                      setSelectedId((current) => (current === item.id ? null : item.id));
                    }}
                    style={[
                      styles.listItem,
                      isSelected && {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: theme.colors.outline,
                      },
                    ]}
                  >
                    <View style={styles.listLeft}>
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <AppText>{item.label}</AppText>
                    </View>
                    <View style={styles.listRight}>
                      <AppText>{formatMoney(item.amount)}</AppText>
                      <AppText style={styles.muted}>
                        {Math.round(item.percentage * 100)}%
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </AppCardContent>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
  },
  muted: {
    opacity: 0.6,
  },
  chartArea: {
    marginTop: 12,
    gap: 16,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: -12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  list: {
    gap: 8,
  },
  listItem: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  listRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
