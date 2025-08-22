import { useTheme } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import TableCategorias from '../../components/catalogo/categorias/TableCategorias';
import TableInsumos from '../../components/catalogo/insumos/TableInsumos';
import TableProductos from '../../components/catalogo/productos/TableProductos';

export type CatalogTab = 'Productos' | 'Ingredientes' | 'Categorías' | 'Multivariante';

const CONTENT_MAX_W = 1000;

export default function CatalogoScreen() {
  const { colors, dark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const isWeb = Platform.OS === 'web';

  const TABS: CatalogTab[] = ['Productos', 'Ingredientes', 'Categorías'];
  const [active, setActive] = useState<CatalogTab>('Productos');

  const Content = useMemo(() => {
    switch (active) {
      case 'Productos':
        return <TableProductos />;
      case 'Ingredientes':
        return <TableInsumos />;
      case 'Categorías':
        return <TableCategorias />;
      default:
        return null;
    }
  }, [active]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View
        style={{
          width: '100%',
          maxWidth: isWeb || isWide ? CONTENT_MAX_W : undefined,
          alignSelf: isWeb || isWide ? 'center' : 'stretch',
          alignItems: isWeb || isWide ? 'center' : 'flex-start',
          marginBottom: 10,
        }}
      >
        <Text style={[styles.title, { color: colors.text, textAlign: isWeb || isWide ? 'center' : 'left' }]}>Catálogo</Text>
        <Text style={{ color: colors.text, opacity: 0.75, textAlign: isWeb || isWide ? 'center' : 'left' }}>
          Administra productos, ingredientes y categorías
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ width: '100%', maxWidth: isWeb || isWide ? CONTENT_MAX_W : undefined, alignSelf: isWeb || isWide ? 'center' : 'stretch' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12, width: '100%' }}
          contentContainerStyle={{ alignItems: 'center', justifyContent: isWeb || isWide ? 'center' : 'flex-start', paddingRight: 2, flexGrow: isWeb || isWide ? 1 : 0 }}
        >
          {TABS.map((tab, i) => {
            const activeTab = tab === active;
            return (
              <Pressable
                key={tab}
                onPress={() => setActive(tab)}
                style={[styles.tab, activeTab && { backgroundColor: '#2563EB' }, i < TABS.length - 1 && { marginRight: 10 }]}
              >
                <Text style={{ color: activeTab ? '#fff' : colors.text, fontWeight: '700' }}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Body */}
      <View style={{ flex: 1 }}>{Content}</View>
    </View>
  );
}

const TAB_H = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  tab: {
    height: TAB_H,
    paddingHorizontal: 16,
    borderRadius: TAB_H / 2,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
