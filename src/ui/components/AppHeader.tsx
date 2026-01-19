import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { useAppTheme } from '../theme/useAppTheme';

type AppHeaderProps = PropsWithChildren<{
  title: string;
  onMenuPress?: () => void;
}>;

export function AppHeader({ title, onMenuPress, children }: AppHeaderProps) {
  const theme = useAppTheme();
  const navigation = useNavigation();

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    const parent = navigation.getParent?.();
    const parentState = parent?.getState?.();
    if (parentState?.type === 'drawer' && parent?.dispatch) {
      parent.dispatch(DrawerActions.toggleDrawer());
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.container}>
        <Pressable onPress={handleMenuPress} style={styles.menuButton}>
          <AppIcon name="menu" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <AppText variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {title}
        </AppText>
        <View style={styles.right}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    width: '100%',
    paddingBottom: 0,
  },
  container: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 32,
    alignItems: 'flex-start',
  },
  right: {
    minWidth: 32,
    alignItems: 'flex-end',
  },
});
