import { PropsWithChildren, useMemo } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { useSettingsStore } from '../../state/settingsStore';
import { createAppTheme } from './theme';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const darkMode = useSettingsStore((state) => state.settings.darkMode);
  const theme = useMemo(() => createAppTheme(darkMode), [darkMode]);

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
