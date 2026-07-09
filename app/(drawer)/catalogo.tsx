import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/src/components/ui';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import TableArticulos from '../../components/catalogo/articulos/TableArticulos';
import TableCategorias from '../../components/catalogo/categorias/TableCategorias';
import TableInsumos from '../../components/catalogo/insumos/TableInsumos';

export type CatalogTab = 'Artículos' | 'Ingredientes' | 'Categorías';

const CONTENT_MAX_W = 1000;

export default function CatalogoScreen() {
  const { color, space, font } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const isWeb = Platform.OS === 'web';

  const TABS: CatalogTab[] = ['Artículos', 'Ingredientes', 'Categorías'];
  const [active, setActive] = useState<CatalogTab>('Artículos');
  const chipSpacing = isWeb || isWide ? 8 : 10;

  const Content = useMemo(() => {
    switch (active) {
      case 'Artículos':
        return <TableArticulos />;
      case 'Ingredientes':
        return <TableInsumos />;
      case 'Categorías':
        return <TableCategorias />;
      default:
        return null;
    }
  }, [active]);

  return (
    <View style={[styles.container, { backgroundColor: color.bg, padding: space[4] }]}>
      {/* Header */}
      <View
        style={{
          width: '100%',
          maxWidth: isWeb || isWide ? CONTENT_MAX_W : undefined,
          alignSelf: isWeb || isWide ? 'center' : 'stretch',
          alignItems: isWeb || isWide ? 'center' : 'flex-start',
          marginBottom: space[3],
        }}
      >
        <Text style={[styles.title, { color: color.text, fontSize: font.size.lg, textAlign: isWeb || isWide ? 'center' : 'left' }]}>
          Catálogo
        </Text>
        <Text style={{ color: color.textMuted, fontSize: font.size.sm, textAlign: isWeb || isWide ? 'center' : 'left' }}>
          Administra artículos, ingredientes y categorías
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ width: '100%', maxWidth: isWeb || isWide ? CONTENT_MAX_W : undefined, alignSelf: isWeb || isWide ? 'center' : 'stretch' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: space[3], width: '100%' }}
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: isWeb || isWide ? 'center' : 'flex-start',
            paddingRight: 2,
            flexGrow: isWeb || isWide ? 1 : 0,
          }}
        >
          {TABS.map((tab, i) => (
            <Chip
              key={tab}
              label={tab}
              active={tab === active}
              onPress={() => setActive(tab)}
              style={i < TABS.length - 1 ? { marginRight: chipSpacing } : undefined}
            />
          ))}
        </ScrollView>
      </View>

      {/* Body */}
      <View style={{ flex: 1 }}>{Content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
});
