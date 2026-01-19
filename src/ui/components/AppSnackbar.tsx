import { ComponentProps } from 'react';
import { Snackbar } from 'react-native-paper';

export type AppSnackbarProps = ComponentProps<typeof Snackbar>;

export function AppSnackbar(props: AppSnackbarProps) {
  return <Snackbar {...props} />;
}
