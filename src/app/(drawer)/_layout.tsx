import { Pressable, StyleSheet, View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerToggleButton,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';

import { AppIcon, AppText } from '../../ui/components';
import { useAppTheme } from '../../ui/theme/useAppTheme';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={styles.drawerRoot}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
      >
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
          <View>
            <AppText variant="titleMedium">Usuario</AppText>
            <AppText style={styles.profileLink}>Ver perfil</AppText>
          </View>
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerBottom}>
        <Pressable
          onPress={() => {
            props.navigation.closeDrawer();
            router.push('/(drawer)/settings');
          }}
          style={styles.drawerItem}
        >
          <AppIcon name="cog-outline" size={20} color={theme.colors.onSurface} />
          <AppText style={styles.drawerItemText}>Ajustes</AppText>
        </Pressable>
        <AppText style={styles.version}>V1.0.0</AppText>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const theme = useAppTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Finanzas',
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          headerShown: true,
          headerTitle: 'Ajustes',
          headerLeft: () => <DrawerToggleButton tintColor={theme.colors.onSurface} />,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { color: theme.colors.onSurface },
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
  },
  drawerScroll: {
    padding: 20,
    gap: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileLink: {
    opacity: 0.6,
    fontSize: 12,
  },
  drawerBottom: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerItemText: {
    fontSize: 16,
  },
  version: {
    opacity: 0.5,
    fontSize: 12,
  },
});
