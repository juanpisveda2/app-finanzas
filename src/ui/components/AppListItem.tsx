import { ComponentProps } from 'react';
import { List } from 'react-native-paper';

export type AppListItemProps = ComponentProps<typeof List.Item>;

export function AppListItem(props: AppListItemProps) {
  return <List.Item {...props} />;
}
