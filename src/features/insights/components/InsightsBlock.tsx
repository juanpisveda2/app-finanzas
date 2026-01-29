import { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

type InsightsBlockProps = PropsWithChildren<{
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function InsightsBlock({ index = 0, style, children }: InsightsBlockProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay: index * 120 }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
