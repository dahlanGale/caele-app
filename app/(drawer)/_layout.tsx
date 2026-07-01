import { auth } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { signOut } from 'firebase/auth';
import React from 'react';
import { View } from 'react-native';

function CustomDrawerContent(props: any) {
  const { colors, dark } = useTheme();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={{ flex: 1 }} />
      <DrawerItem
        label="Ajustes"
        labelStyle={{ color: colors.text, fontWeight: '600' }}
        onPress={() => router.push('/administration/ajustes')}
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="cog" size={size} color={color} />
        )}
        style={{ marginTop: 8, borderTopWidth: dark ? 0 : 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }}
      />
      <DrawerItem
        label="Cerrar sesión"
        labelStyle={{ color: colors.text, fontWeight: '600' }}
        onPress={async () => {
          try {
            await signOut(auth);
          } finally {
            router.replace('/administration/login');
          }
        }}
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="logout" size={size} color={colors.text} />
        )}
        style={{ marginTop: 8, borderTopWidth: dark ? 0 : 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { colors, dark } = useTheme();

  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={{
        // Header
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerLeft: (props) => <DrawerToggleButton tintColor={props.tintColor} />,
        // Drawer panel
        drawerStyle: { width: 280 },
        drawerContentStyle: { backgroundColor: colors.card },
        drawerActiveBackgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
        drawerActiveTintColor: colors.text,
        drawerInactiveTintColor: dark ? '#CBD5E1' : '#475569',
        drawerLabelStyle: { fontSize: 15 },
        overlayColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="dashboard" options={{ title: 'Inicio' }} />
      <Drawer.Screen name="catalogo" options={{ title: 'Catálogo' }} />
      <Drawer.Screen name="orden" options={{ title: 'Orden' }} />
      <Drawer.Screen name="mesas" options={{ title: 'Mesas' }} />
    </Drawer>
  );
}
