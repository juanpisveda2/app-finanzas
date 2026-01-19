import { ComponentProps } from 'react';
import { TextInput } from 'react-native-paper';

export type AppInputProps = ComponentProps<typeof TextInput>;

export function AppInput(props: AppInputProps) {
  return <TextInput mode="outlined" {...props} />;
}
