import { ComponentProps } from 'react';
import { Chip } from 'react-native-paper';

export type AppChipProps = ComponentProps<typeof Chip>;

export function AppChip(props: AppChipProps) {
  return <Chip {...props} />;
}
