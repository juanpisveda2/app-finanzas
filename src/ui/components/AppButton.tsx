import { ComponentProps } from 'react';
import { Button } from 'react-native-paper';

export type AppButtonProps = ComponentProps<typeof Button>;

export function AppButton({ mode = 'contained', ...props }: AppButtonProps) {
  return <Button mode={mode} {...props} />;
}
