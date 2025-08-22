import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

export type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
  imagen?: string;
};

const MOCK: Producto[] = [
  { id: '1', nombre: 'Chocolate Cupcake', categoria: 'Cupcake', stock: 12, precio: 25.0, imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80&auto=format&fit=crop' },
  { id: '2', nombre: 'Mexican VIVA Cupcake', categoria: 'Cupcake', stock: 5, precio: 28.0, imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80&auto=format&fit=crop' },
  { id: '3', nombre: 'Chocochips Croissant', categoria: 'Croissant', stock: 9, precio: 22.02, imagen: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80&auto=format&fit=crop' },
  { id: '4', nombre: 'Brown Butter Biscuit', categoria: 'Cookie', stock: 17, precio: 15.5, imagen: 'https://images.unsplash.com/photo-1604908554027-3f3751ce243a?w=1200&q=80&auto=format&fit=crop' },
  { id: '5', nombre: 'Strawberry Cupcake', categoria: 'Cupcake', stock: 8, precio: 26.0, imagen: 'https://images.unsplash.com/photo-1460306855393-0410f61241c7?w=1200&q=80&auto=format&fit=crop' },
];

const MIN_TABLE_W = 900;
const CONTENT_MAX_W = 1000;

export default function TableProductos() {
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
    return MOCK.filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
  }, [query]);

  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar (sin cambios de centrado) */}
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={[styles.toolbar, { width: '100%', maxWidth: MIN_TABLE_W }]}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
            <MaterialCommunityIcons name="magnify" color={colors.text} size={18} style={{ opacity: 0.7 }} />
            <TextInput
              placeholder="Buscar por nombre o categoría"
              placeholderTextColor={dark ? '#94A3B8' : '#94A3B8'}
              value={query}
            onChangeText={setQuery}
            style={{ flex: 1, color: colors.text }}
          />
          </View>
          <Pressable onPress={() => Alert.alert('Filtros', 'Filtros de productos próximamente')} style={[styles.btn, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
            <MaterialCommunityIcons name="tune" color={colors.text} size={18} />
            <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 6 }}>Filtros</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Nuevo producto', 'Acción crear producto')} style={[styles.btnPrimary]}>
            <MaterialCommunityIcons name="plus" color="#fff" size={18} />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Nuevo producto</Text>
          </Pressable>
        </View>
      </View>
      {/* Tabla con scroll horizontal centrada en web */}
      <View style={{ width: '100%', maxWidth: (isWeb || isWide) ? CONTENT_MAX_W : undefined, alignSelf: (isWeb || isWide) ? 'center' : 'stretch' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingLeft: (isWeb || isWide) ? sidePad : 0, paddingRight: (isWeb || isWide) ? sidePad : 0 }}
        >
          <View style={{ minWidth: MIN_TABLE_W, flex: 1 }}>
            {/* Header row */}
            <View style={[styles.row, styles.header, { backgroundColor: dark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}> 
              <View style={[styles.cell, { width: 44 }]}> 
                <MaterialCommunityIcons name="checkbox-blank-outline" color={colors.text} size={20} />
              </View>
              <View style={[styles.cell, { flex: 3, alignItems: 'flex-start' }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Producto</Text>
              </View>
              <View style={[styles.cell, { flex: 2 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Categoría</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Stock</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text numberOfLines={1} style={[styles.headerText, { color: colors.text }]}>Precio</Text>
              </View>
              <View style={[styles.cell, { width: 44 }]} />
            </View>

            {/* List */}
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
                    <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}> 
                      <Image source={{ uri: item.imagen }} style={styles.thumb} contentFit="cover" />
                      <View style={{ marginLeft: 10 }}>
                        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700' }}>{item.nombre}</Text>
                      </View>
                    </View>
                    <View style={[styles.cell, { flex: 2 }]}> 
                      <Text style={{ color: colors.text, opacity: 0.85 }}>{item.categoria}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}> 
                      <Text style={{ color: colors.text }}>{item.stock}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}> 
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{money(item.precio)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    borderBottomWidth: 0,
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
    backgroundColor: '#2563EB',
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
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
});