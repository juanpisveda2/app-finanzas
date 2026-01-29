import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';

import { useAppTheme } from '../../../ui/theme/useAppTheme';

type SkeletonBlockProps = {
  height: number;
  width?: number | string;
  radius?: number;
  delay?: number;
};

function SkeletonBlock({ height, width = '100%', radius = 12, delay = 0 }: SkeletonBlockProps) {
  const theme = useAppTheme();
  return (
    <MotiView
      from={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 900, loop: true, delay }}
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    />
  );
}

export function SkeletonInsights() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <SkeletonBlock height={22} width={180} />
        <SkeletonBlock height={36} width={96} radius={18} />
      </View>

      <View style={styles.summaryRow}>
        <SkeletonBlock height={86} width="31%" radius={16} />
        <SkeletonBlock height={86} width="31%" radius={16} delay={120} />
        <SkeletonBlock height={86} width="31%" radius={16} delay={200} />
      </View>

      <View style={styles.block}>
        <SkeletonBlock height={20} width={200} />
        <SkeletonBlock height={210} radius={24} delay={150} />
      </View>

      <View style={styles.block}>
        <SkeletonBlock height={20} width={160} />
        <SkeletonBlock height={70} radius={16} delay={150} />
        <SkeletonBlock height={70} radius={16} delay={230} />
      </View>

      <View style={styles.block}>
        <SkeletonBlock height={20} width={180} />
        <SkeletonBlock height={90} radius={16} delay={180} />
      </View>

      <View style={styles.block}>
        <SkeletonBlock height={20} width={140} />
        <SkeletonBlock height={110} radius={16} delay={200} />
      </View>
    </View>
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
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  block: {
    gap: 12,
  },
  skeleton: {
    overflow: 'hidden',
  },
});
