import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../theme/useAppTheme';

export type AppIconProps = ComponentProps<typeof MaterialCommunityIcons>;

export function AppIcon({ color, size = 22, ...props }: AppIconProps) {
  const theme = useAppTheme();
  return (
    <MaterialCommunityIcons
      size={size}
      color={color ?? theme.colors.primary}
      {...props}
    />
  );
}
