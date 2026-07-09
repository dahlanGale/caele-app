import { auth } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { useTheme } from '@react-navigation/native';
import { Redirect, router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { signOut } from 'firebase/auth';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTerminal } from '@/src/hooks/useTerminal';
import { useAppTheme } from '@/src/theme/ThemeProvider';


function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const { color } = useAppTheme();
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
        style={{ marginTop: 8, borderTopWidth: 1, borderColor: color.border }}
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
        style={{ marginTop: 8, borderTopWidth: 1, borderColor: color.border }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { colors, dark } = useTheme();
  const { color } = useAppTheme();
  const { terminal, loading: terminalLoading } = useTerminal();

  // Gate: exige registrar la terminal antes de usar la app.
  if (terminalLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }
  if (!terminal) {
    return <Redirect href="/administration/registro-equipo" />;
  }

  const isPOS = terminal.tipoMaquina === 'punto_de_venta';

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
        drawerActiveBackgroundColor: dark ? color.borderSubtle : color.bgSubtle,
        drawerActiveTintColor: colors.text,
        drawerInactiveTintColor: color.textMuted,
        drawerLabelStyle: { fontSize: 15 },
        overlayColor: color.overlay,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="dashboard"
        options={{ title: 'Inicio', drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={c} /> }}
      />
      <Drawer.Screen
        name="catalogo"
        options={{ title: 'Catálogo', drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="tag-multiple-outline" size={size} color={c} /> }}
      />
      <Drawer.Screen
        name="orden"
        options={{ title: 'Orden', drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="cart-outline" size={size} color={c} /> }}
      />
      <Drawer.Screen
        name="mesas"
        options={{ title: 'Mesas', drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="table-furniture" size={size} color={c} /> }}
      />
      <Drawer.Screen
        name="estado-cajon"
        options={{
          title: 'Estado de cajón',
          drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="cash-register" size={size} color={c} />,
          drawerItemStyle: isPOS ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="corte-final"
        options={{
          title: 'Corte final',
          drawerIcon: ({ color: c, size }) => <MaterialCommunityIcons name="file-document-outline" size={size} color={c} />,
          drawerItemStyle: isPOS ? undefined : { display: 'none' },
        }}
      />
    </Drawer>
  );
}
