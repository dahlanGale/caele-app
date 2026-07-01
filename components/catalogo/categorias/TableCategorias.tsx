import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';

export type Categoria = {
  id: string;
  nombre: string;
  productos: number;
  activa: boolean;
};

const MOCK: Categoria[] = [
  { id: 'c1', nombre: 'Cupcake', productos: 24, activa: true },
  { id: 'c2', nombre: 'Croissant', productos: 12, activa: true },
  { id: 'c3', nombre: 'Cookie', productos: 9, activa: true },
  { id: 'c4', nombre: 'Bebidas', productos: 7, activa: false },
];

const MIN_TABLE_W = 720;
const CONTENT_MAX_W = 1000;

export default function TableCategorias() {
  const { color, space, radius, font } = useAppTheme();
  const [query, setQuery] = useState('');
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
                placeholder="Buscar categoría"
                placeholderTextColor={color.textMuted}
                value={query}
                onChangeText={setQuery}
                style={{ flex: 1, color: color.text, marginLeft: space[2] }}
              />
            </View>
            <Pressable
              onPress={() => Alert.alert('Nueva categoría', 'Acción crear categoría')}
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
                Nueva categoría
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
              <View style={[styles.cell, { flex: 3 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Nombre
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Productos
                </Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: color.text, fontSize: font.size.xs }]}>
                  Estado
                </Text>
              </View>
              <View style={[styles.cell, { width: 44 }]} />
            </View>

            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <View style={[styles.row, { borderColor: color.border }]}>
                  <View style={[styles.cell, { flex: 3 }]}>
                    <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>
                      {item.nombre}
                    </Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={{ color: color.text }}>{item.productos}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: item.activa ? color.success : color.warning,
                        marginRight: space[2],
                      }}
                    />
                    <Text style={{ color: color.textMuted }}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
                  </View>
                  <Pressable
                    onPress={() => Alert.alert('Acciones', `Acciones para ${item.nombre}`)}
                    style={[styles.cell, { width: 44, alignItems: 'center' }]}
                  >
                    <MaterialCommunityIcons name="dots-vertical" color={color.text} size={20} />
                  </Pressable>
                </View>
              )}
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
