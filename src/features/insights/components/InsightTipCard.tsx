import { StyleSheet } from 'react-native';
import { MotiPressable } from 'moti/interactions';

import { AppCard, AppCardContent, AppText } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme/useAppTheme';

type InsightTipCardProps = {
  text: string;
};

export function InsightTipCard({ text }: InsightTipCardProps) {
  const theme = useAppTheme();
  return (
    <MotiPressable
      onPress={() => {}}
      animate={({ pressed }) => ({
        scale: pressed ? 0.98 : 1,
        opacity: pressed ? 0.9 : 1,
      })}
      transition={{ type: 'timing', duration: 120 }}
    >
      <AppCard style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <AppCardContent>
          <AppText variant="bodyMedium">{text}</AppText>
        </AppCardContent>
      </AppCard>
    </MotiPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
});
