import { ComponentProps } from 'react';
import { Card } from 'react-native-paper';

export type AppCardProps = ComponentProps<typeof Card>;

export function AppCard(props: AppCardProps) {
  return <Card {...props} />;
}

export const AppCardContent = Card.Content;
export const AppCardTitle = Card.Title;
