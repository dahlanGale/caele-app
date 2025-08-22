import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

export type Categoria = {
  id: string;
  nombre: string;
  productos: number; // cantidad de productos
  activa: boolean;
};

const MOCK: Categoria[] = [
  { id: 'c1', nombre: 'Cupcake', productos: 24, activa: true },
  { id: 'c2', nombre: 'Croissant', productos: 12, activa: true },
  { id: 'c3', nombre: 'Cookie', productos: 9, activa: true },
  { id: 'c4', nombre: 'Bebidas', productos: 7, activa: false },
];

const MIN_TABLE_W = 720;
const CONTENT_MAX_W = 1000; // centrar en web con este ancho máximo

export default function TableCategorias() {
  const { colors, dark } = useTheme();
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const isWeb = Platform.OS === 'web';
  // ancho efectivo del contenedor en web/ancho y padding lateral para centrar la tabla
  const PAGE_PADDING = 16; // mismo padding que en CatalogoScreen.styles.container
  const containerWidth = (isWeb || isWide)
    ? Math.min(width - PAGE_PADDING * 2, CONTENT_MAX_W)
    : width - PAGE_PADDING * 2;
  const sidePad = Math.max(0, (containerWidth - MIN_TABLE_W) / 2);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK.filter((p) => !q || p.nombre.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={{ flex: 1 }}>
      {/* Contenedor centrado en web/ancho */}
      <View style={{ width: '100%', maxWidth: (isWeb || isWide) ? CONTENT_MAX_W : undefined, alignSelf: (isWeb || isWide) ? 'center' : 'stretch' }}>
        {/* Toolbar centrada y alineada con el ancho de la tabla */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.toolbar, { width: '100%', maxWidth: MIN_TABLE_W }]}>
            <View
              style={[
                styles.search,
                { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }
              ]}
            >
              <MaterialCommunityIcons name="magnify" color={colors.text} size={18} style={{ opacity: 0.7 }} />
              <TextInput
                placeholder="Buscar categoría"
                placeholderTextColor={dark ? '#94A3B8' : '#94A3B8'}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: colors.text }}
              />
            </View>
            <Pressable onPress={() => Alert.alert('Nueva categoría', 'Acción crear categoría')} style={[styles.btnPrimary]}>
              <MaterialCommunityIcons name="plus" color="#fff" size={18} />
              <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Nueva categoría</Text>
            </Pressable>
          </View>
        </View>

        {/* Tabla con scroll horizontal, centrada en web */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingLeft: (isWeb || isWide) ? sidePad : 0, paddingRight: (isWeb || isWide) ? sidePad : 0 }}
        >
          <View style={{ minWidth: MIN_TABLE_W, flex: 1 }}>
            {/* Header */}
            <View style={[styles.row, styles.header, { backgroundColor: dark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}> 
              <View style={[styles.cell, { flex: 3 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Nombre</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Productos</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Estado</Text>
              </View>
              <View style={[styles.cell, { width: 44 }]} />
            </View>

            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <View style={[styles.row, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}> 
                  <View style={[styles.cell, { flex: 3 }]}> 
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700' }}>{item.nombre}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}> 
                    <Text style={{ color: colors.text }}>{item.productos}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}> 
                    <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: item.activa ? '#22C55E' : '#F59E0B', marginRight: 6 }} />
                    <Text style={{ color: colors.text, opacity: 0.9 }}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
                  </View>
                  <Pressable onPress={() => Alert.alert('Acciones', `Acciones para ${item.nombre}`)} style={[styles.cell, { width: 44, alignItems: 'center' }]}> 
                    <MaterialCommunityIcons name="dots-vertical" color={colors.text} size={20} />
                  </Pressable>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }} />}
              contentContainerStyle={{ borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', borderRadius: 12, overflow: 'hidden' }}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  search: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  header: {
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerText: {
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
});