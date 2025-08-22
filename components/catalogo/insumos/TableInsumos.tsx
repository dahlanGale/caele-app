import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

export type Insumo = {
  id: string;
  nombre: string;
  unidad: 'kg' | 'g' | 'l' | 'ml' | 'pz';
  stock: number; // en unidad declarada
  costo: number; // costo por unidad
};

const MOCK: Insumo[] = [
  { id: 'i1', nombre: 'Harina de trigo', unidad: 'kg', stock: 18, costo: 1.9 },
  { id: 'i2', nombre: 'Azúcar', unidad: 'kg', stock: 13, costo: 2.2 },
  { id: 'i3', nombre: 'Mantequilla', unidad: 'kg', stock: 6, costo: 4.5 },
  { id: 'i4', nombre: 'Leche', unidad: 'l', stock: 25, costo: 1.1 },
  { id: 'i5', nombre: 'Huevos', unidad: 'pz', stock: 120, costo: 0.24 },
];

const MIN_TABLE_W = 820;
const CONTENT_MAX_W = 1000;

export default function TableInsumos() {
  const { colors, dark } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const isWeb = Platform.OS === 'web';
  const PAGE_PADDING = 16; // debe coincidir con padding del screen
  const containerWidth = (isWeb || isWide)
    ? Math.min(width - PAGE_PADDING * 2, CONTENT_MAX_W)
    : width - PAGE_PADDING * 2;
  const sidePad = Math.max(0, (containerWidth - MIN_TABLE_W) / 2);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK.filter((p) => !q || p.nombre.toLowerCase().includes(q));
  }, [query]);

  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar centrada y alineada con el ancho de la tabla */}
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={[styles.toolbar, { width: '100%', maxWidth: MIN_TABLE_W }]}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
            <MaterialCommunityIcons name="magnify" color={colors.text} size={18} style={{ opacity: 0.7 }} />
            <TextInput
              placeholder="Buscar insumo"
              placeholderTextColor={dark ? '#94A3B8' : '#94A3B8'}
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, color: colors.text }}
            />
          </View>
          <Pressable onPress={() => Alert.alert('Filtros', 'Filtros de insumos próximamente')} style={[styles.btn, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
            <MaterialCommunityIcons name="tune" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6 }}>Filtros</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Nuevo insumo', 'Acción crear insumo')} style={[styles.btnPrimary]}>
            <MaterialCommunityIcons name="plus" color="#fff" size={18} />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Nuevo insumo</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabla con scroll horizontal centrada en web */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: (isWeb || isWide) ? sidePad : 0, paddingRight: (isWeb || isWide) ? sidePad : 0 }}
      >
        <View style={{ minWidth: MIN_TABLE_W, flex: 1 }}>
          {/* Header */}
          <View style={[styles.row, styles.header, { backgroundColor: dark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
            <View style={[styles.cell, { width: 44 }]}>
              <MaterialCommunityIcons name="checkbox-blank-outline" color={colors.text} size={20} />
            </View>
            <View style={[styles.cell, { flex: 3 }]}>
              <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Insumo</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Unidad</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Stock</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Costo</Text>
            </View>
            <View style={[styles.cell, { width: 44 }]} />
          </View>

          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => {
              const checked = !!selected[item.id];
              return (
                <View style={[styles.row, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                  <Pressable onPress={() => toggleSelect(item.id)} style={[styles.cell, { width: 44, alignItems: 'center' }]}>
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      color={checked ? '#2563EB' : colors.text}
                      size={20}
                    />
                  </Pressable>
                  <View style={[styles.cell, { flex: 3 }]}>
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700' }}>{item.nombre}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={{ color: colors.text, opacity: 0.9 }}>{item.unidad}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={{ color: colors.text }}>{item.stock}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{money(item.costo)}</Text>
                  </View>
                  <Pressable onPress={() => Alert.alert('Acciones', `Acciones para ${item.nombre}`)} style={[styles.cell, { width: 44, alignItems: 'center' }]}>
                    <MaterialCommunityIcons name="dots-vertical" color={colors.text} size={20} />
                  </Pressable>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }} />}
            contentContainerStyle={{ borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', borderRadius: 12, overflow: 'hidden' }}
          />
        </View>
      </ScrollView>
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
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
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