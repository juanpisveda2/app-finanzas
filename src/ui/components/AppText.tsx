import { ComponentProps } from 'react';
import { Text } from 'react-native-paper';

export type AppTextProps = ComponentProps<typeof Text>;

export function AppText(props: AppTextProps) {
  return <Text {...props} />;
}
