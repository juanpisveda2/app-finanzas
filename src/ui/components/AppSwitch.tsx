import { ComponentProps } from 'react';
import { Switch } from 'react-native';

export type AppSwitchProps = ComponentProps<typeof Switch>;

export function AppSwitch(props: AppSwitchProps) {
  return <Switch {...props} />;
}
