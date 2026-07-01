import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export type Insumo = {
  id: string;
  nombre: string;
  unidad: 'kg' | 'g' | 'l' | 'ml' | 'pz';
  stock: number;
  costo: number;
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
  const { color, space, radius, font } = useAppTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const isWeb = Platform.OS === 'web';
  const PAGE_PADDING = 16;
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
      <View style={{ width: '100%', maxWidth: (isWeb || isWide) ? CONTENT_MAX_W : undefined, alignSelf: (isWeb || isWide) ? 'center' : 'stretch' }}>
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.toolbar, { width: '100%', maxWidth: MIN_TABLE_W, marginBottom: space[3] }]}>
            <View
              style={[
                styles.search,
                {
                  backgroundColor: color.bgElevated,
                  borderColor: color.border,
                  borderRadius: radius.md,
                  paddingHorizontal: space[3],
                  paddingVertical: space[2],
                  marginRight: space[2],
                  marginBottom: space[2],
                },
              ]}
            >
              <MaterialCommunityIcons name="magnify" color={color.textMuted} size={18} />
              <TextInput
                placeholder="Buscar insumo"
                placeholderTextColor={color.textMuted}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: color.text, marginLeft: space[2] }}
              />
            </View>
            <Pressable
              onPress={() => Alert.alert('Filtros', 'Filtros de insumos próximamente')}
              style={[
                styles.btn,
                {
                  borderColor: color.border,
                  borderRadius: radius.md,
                  paddingHorizontal: space[3],
                  paddingVertical: space[2],
                  marginRight: space[2],
                  marginBottom: space[2],
                },
              ]}
            >
              <MaterialCommunityIcons name="tune" color={color.text} size={18} />
              <Text style={{ color: color.text, fontWeight: font.weight.semibold, marginLeft: space[2], fontSize: font.size.sm }}>
                Filtros
              </Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Nuevo insumo', 'Acción crear insumo')}
              style={[
                styles.btn,
                {
                  backgroundColor: color.accent,
                  borderRadius: radius.md,
                  paddingHorizontal: space[3],
                  paddingVertical: space[2],
                  marginBottom: space[2],
                },
              ]}
            >
              <MaterialCommunityIcons name="plus" color={color.textInverse} size={18} />
              <Text style={{ color: color.textInverse, fontWeight: font.weight.bold, marginLeft: space[2], fontSize: font.size.sm }}>
                Nuevo insumo
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingLeft: (isWeb || isWide) ? sidePad : 0, paddingRight: (isWeb || isWide) ? sidePad : 0 }}
        >
          <View style={{ minWidth: MIN_TABLE_W, flex: 1 }}>
            <View
              style={[
                styles.row,
                styles.header,
                {
                  backgroundColor: color.bgSubtle,
                  borderColor: color.border,
                  borderTopLeftRadius: radius.md,
                  borderTopRightRadius: radius.md,
                },
              ]}
            >
              <View style={[styles.cell, { width: 44 }]}>
                <MaterialCommunityIcons name="checkbox-blank-outline" color={color.text} size={20} />
              </View>
              <View style={[styles.cell, { flex: 3 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Insumo
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Unidad
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Stock
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Costo
                </Text>
              </View>
              <View style={[styles.cell, { width: 44 }]} />
            </View>

            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => {
                const checked = !!selected[item.id];
                return (
                  <View style={[styles.row, { borderColor: color.border }]}>
                    <Pressable onPress={() => toggleSelect(item.id)} style={[styles.cell, { width: 44, alignItems: 'center' }]}>
                      <MaterialCommunityIcons
                        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        color={checked ? color.accent : color.text}
                        size={20}
                      />
                    </Pressable>
                    <View style={[styles.cell, { flex: 3 }]}>
                      <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>
                        {item.nombre}
                      </Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={{ color: color.textMuted }}>{item.unidad}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={{ color: color.text }}>{item.stock}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                      <Text style={{ color: color.text, fontWeight: font.weight.semibold }}>{money(item.costo)}</Text>
                    </View>
                    <Pressable
                      onPress={() => Alert.alert('Acciones', `Acciones para ${item.nombre}`)}
                      style={[styles.cell, { width: 44, alignItems: 'center' }]}
                    >
                      <MaterialCommunityIcons name="dots-vertical" color={color.text} size={20} />
                    </Pressable>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: color.border }} />}
              contentContainerStyle={{
                borderWidth: 1,
                borderColor: color.border,
                borderRadius: radius.md,
                overflow: 'hidden',
              }}
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
  },
  search: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  header: {
    borderWidth: 1,
  },
  headerText: {
    fontWeight: '800',
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
