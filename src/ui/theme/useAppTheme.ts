import { useTheme } from 'react-native-paper';

import { AppTheme } from './theme';

export function useAppTheme() {
  return useTheme<AppTheme>();
}
