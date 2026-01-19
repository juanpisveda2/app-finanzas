import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';

import { AppHeader, AppIcon, AppText } from '../../../ui/components';
import { useAppTheme } from '../../../ui/theme/useAppTheme';

function NewTabButton({ onPress }: { onPress?: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} style={styles.newButton}>
      <View style={[styles.newButtonInner, { backgroundColor: theme.colors.primary }]}>
        <AppIcon name="plus" color={theme.colors.onPrimary} size={28} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader title="Finanzas" />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarLabel: ({ children, color }) => (
          <AppText style={{ color, fontSize: 12 }}>{children}</AppText>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <AppIcon name="view-dashboard-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorias',
          tabBarIcon: ({ color }) => <AppIcon name="tag-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Nuevo',
          tabBarButton: (props) => <NewTabButton onPress={props.onPress} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color }) => <AppIcon name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="movements/index"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <AppIcon name="chart-line" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  newButton: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
  },
  newButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
