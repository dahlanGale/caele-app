import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

export default function OrdenScreen() {
  const { colors, dark } = useTheme();
  const { width } = useWindowDimensions();

  // Responsive layout breakpoints
  const isWide = width >= 1000; // muestra panel lateral
  const gridCols = width >= 1280 ? 3 : width >= 760 ? 2 : 1;

  // Theming helpers (mejoran contraste de chips y botón Filtros)
  const chipInactiveBg = dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.06)';
  const chipInactiveBorder = dark ? 'rgba(148,163,184,0.35)' : '#E5E7EB';
  const pressedBg = dark ? 'rgba(249,115,22,0.22)' : 'rgba(249,115,22,0.14)';
  // Spacing de chips: menos separación en web, un poco más en móvil
  const chipSpacing = (Platform.OS === 'web' || isWide) ? 8 : 10;

  // UI state
  const [query, setQuery] = useState('');
  const CATEGORIES = ['Signature', 'Croissant', 'Waffle', 'Coffee', 'Ice Cream'] as const;
  type Category = typeof CATEGORIES[number];
  const [category, setCategory] = useState<Category>('Croissant');
  const [cartOpen, setCartOpen] = useState(false);

  type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    pack: string;
    category: Category;
    image: string;
  };

  // Sample products (placeholder images)
  const PRODUCTS: Product[] = [
    {
      id: 'p1',
      title: 'Almond Brown Sugar Croissant',
      description: 'Sweet croissant with topping almonds and brown sugar',
      price: 12.98,
      pack: '3 pcs',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'p2',
      title: 'Smoke Tenderloin Slice Croissant',
      description: 'Plain croissant with smoke tenderloin beef and veggies',
      price: 10.01,
      pack: '2 pcs',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1549934159-9157c3fdaf29?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'p3',
      title: 'Berry Whipped Cream Croissant',
      description: 'Sweet croissant with blueberries and strawberries',
      price: 8.92,
      pack: '3 pcs',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1505826759031-7b68b38ad75b?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'p4',
      title: 'Sweet Granulated Sugar Croissant',
      description: 'Classic croissant dusted with sugar',
      price: 5.58,
      pack: '1 pc',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'p5',
      title: 'Sweet Chocolate Chocochips Croissant',
      description: 'Croissant filled with chocolate and chocochips',
      price: 22.02,
      pack: '2 pcs',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 'p6',
      title: 'Basic Croissant La Ta Dhore',
      description: 'Buttery basic croissant',
      price: 4.75,
      pack: '1 pc',
      category: 'Croissant',
      image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  // Cart state
  type CartState = Record<string, { qty: number; product: Product }>; // by product id
  const [cart, setCart] = useState<CartState>({});

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const item = prev[p.id];
      const nextQty = item ? item.qty + 1 : 1;
      return { ...prev, [p.id]: { product: p, qty: nextQty } };
    });
  };

  const inc = (id: string) => setCart((prev) => ({ ...prev, [id]: { ...prev[id], qty: prev[id].qty + 1 } }));
  const dec = (id: string) =>
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nextQty = Math.max(0, item.qty - 1);
      const copy = { ...prev } as CartState;
      if (nextQty === 0) delete copy[id];
      else copy[id] = { ...item, qty: nextQty };
      return copy;
    });
  const removeItem = (id: string) =>
    setCart((prev) => {
      const copy = { ...prev } as CartState;
      delete copy[id];
      return copy;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => p.category === category && (!q || p.title.toLowerCase().includes(q)));
  }, [PRODUCTS, category, query]);

  const money = (n: number) => `$${n.toFixed(2)}`;

  const { subtotal, discount, tax, total } = useMemo(() => {
    const sub = Object.values(cart).reduce((acc, it) => acc + it.product.price * it.qty, 0);
    const disc = sub > 0 ? 5 : 0; // ejemplo
    const taxRate = 0.06;
    const taxVal = (sub - disc) * taxRate;
    const tot = Math.max(0, sub - disc + taxVal);
    return { subtotal: sub, discount: disc, tax: taxVal, total: tot };
  }, [cart]);

  const itemCount = useMemo(() => Object.values(cart).reduce((acc, it) => acc + it.qty, 0), [cart]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main content wrapper */}
      <View style={[styles.content, { flexDirection: isWide ? 'row' : 'column', gap: isWide ? 24 : 12 }]}>
        {/* Left: products area */}
        <View style={{ flex: 1 }}>
          {/* Greeting and search */}
          <View style={{ marginBottom: 12 }}>
            <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.text} style={{ opacity: 0.7 }} />
              <TextInput
                placeholder="Buscar producto..."
                placeholderTextColor={dark ? '#94A3B8' : '#94A3B8'}
                value={query}
                onChangeText={setQuery}
                style={[styles.input, { color: colors.text }]}
              />
              <Pressable
                onPress={() => Alert.alert('Filtros', 'Aquí puedes abrir filtros avanzados.')}
                android_ripple={{ color: 'rgba(249,115,22,0.2)' }}
                style={({ pressed }) => [
                  styles.filterBtn,
                  {
                    backgroundColor: pressed ? pressedBg : chipInactiveBg,
                    borderColor: chipInactiveBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name="tune" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16, width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 2, paddingHorizontal: 2 }}
          >
            {CATEGORIES.map((c, i) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  hitSlop={8}
                  style={[styles.chip, active && { backgroundColor: '#F97316' }, i < CATEGORIES.length - 1 && { marginRight: chipSpacing }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Product grid */}
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {filtered.map((p) => (
                <View key={p.id} style={{ width: `${100 / gridCols}%`, paddingHorizontal: 8, marginBottom: 16 }}>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                    <Image
                      source={{ uri: p.image }}
                      style={{ width: '100%', height: 140, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <View style={{ marginTop: 10 }}>
                      <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
                      <Text numberOfLines={2} style={{ color: colors.text, opacity: 0.7, marginTop: 4 }}>{p.description}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <View>
                        <Text style={[styles.price, { color: '#F97316' }]}>{money(p.price)}</Text>
                        <Text style={{ color: colors.text, opacity: 0.6, fontSize: 12 }}>{p.pack}</Text>
                      </View>
                      <Pressable onPress={() => addToCart(p)} style={[styles.addBtn, { backgroundColor: dark ? '#F97316' : '#F97316' }]}>
                        <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Right: cart panel sólo en pantallas anchas */}
        {isWide && (
          <View style={[styles.cartContainer, { width: 340 }]}>
            <View style={[styles.cartPanel, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.cartTitle, { color: colors.text }]}>Orden actual</Text>
                <Pressable onPress={() => Alert.alert('Opciones', 'Ajustes del carrito próximamente.')}>
                  <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Items */}
              <View style={{ marginTop: 12 }}>
                {Object.values(cart).length === 0 ? (
                  <Text style={{ color: colors.text, opacity: 0.7 }}>No hay productos en el carrito</Text>
                ) : (
                  Object.values(cart).map(({ product, qty }) => (
                    <View key={product.id} style={[styles.cartItem, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                      <Image source={{ uri: product.image }} style={styles.cartThumb} contentFit="cover" />
                      <View style={{ flex: 1, marginHorizontal: 8 }}>
                        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{product.title}</Text>
                        <Text style={{ color: '#F97316', marginTop: 2 }}>{money(product.price)}</Text>
                      </View>
                      <View style={styles.stepper}>
                        <Pressable onPress={() => dec(product.id)} style={styles.stepBtn}>
                          <MaterialCommunityIcons name="minus" size={16} color="#fff" />
                        </Pressable>
                        <Text style={{ width: 22, textAlign: 'center', color: colors.text }}>{qty}</Text>
                        <Pressable onPress={() => inc(product.id)} style={styles.stepBtn}>
                          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                        </Pressable>
                      </View>
                      <Pressable onPress={() => removeItem(product.id)} style={{ padding: 6, marginLeft: 4 }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={dark ? '#FCA5A5' : '#DC2626'} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              {/* Totals */}
              <View style={[styles.summaryBox, { backgroundColor: dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: dark ? 'rgba(255,255,255,0.06)' : '#E5E7EB' }]}>
                <Row label="Subtotal" value={money(subtotal)} colors={colors} />
                <Row label="Descuento" value={`-${money(discount)}`} colors={colors} />
                <Row label="Impuestos" value={money(tax)} colors={colors} />
                <View style={{ height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', marginVertical: 8 }} />
                <Row label="Total" value={money(total)} bold colors={colors} />
              </View>

              <Pressable
                onPress={() => Alert.alert('Pago', 'Continuar al flujo de pago...')}
                disabled={total <= 0}
                style={[styles.payBtn, { backgroundColor: total > 0 ? '#F97316' : (dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB') }]}
              >
                <Text style={{ color: total > 0 ? '#fff' : (dark ? '#94A3B8' : '#64748B'), fontWeight: '700' }}>Continuar al pago</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Botón flotante y sheet móvil */}
      {!isWide && (
        <>
          <Pressable onPress={() => setCartOpen(true)} style={[styles.fab, { backgroundColor: '#F97316' }]}>
            <MaterialCommunityIcons name="cart" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 8 }}>Ver pedido{itemCount ? ` (${itemCount})` : ''}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: '#fff', fontWeight: '800' }}>{money(total)}</Text>
          </Pressable>

          <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Pressable style={styles.backdrop} onPress={() => setCartOpen(false)} />
              <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                <View style={styles.sheetHandle} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.cartTitle, { color: colors.text }]}>Orden actual</Text>
                  <Pressable onPress={() => setCartOpen(false)}>
                    <MaterialCommunityIcons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>

                {/* Items */}
                <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 16 }}>
                  {Object.values(cart).length === 0 ? (
                    <Text style={{ color: colors.text, opacity: 0.7 }}>No hay productos en el carrito</Text>
                  ) : (
                    Object.values(cart).map(({ product, qty }) => (
                      <View key={product.id} style={[styles.cartItem, { borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                        <Image source={{ uri: product.image }} style={styles.cartThumb} contentFit="cover" />
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{product.title}</Text>
                          <Text style={{ color: '#F97316', marginTop: 2 }}>{money(product.price)}</Text>
                        </View>
                        <View style={styles.stepper}>
                          <Pressable onPress={() => dec(product.id)} style={styles.stepBtn}>
                            <MaterialCommunityIcons name="minus" size={16} color="#fff" />
                          </Pressable>
                          <Text style={{ width: 22, textAlign: 'center', color: colors.text }}>{qty}</Text>
                          <Pressable onPress={() => inc(product.id)} style={styles.stepBtn}>
                            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                          </Pressable>
                        </View>
                        <Pressable onPress={() => removeItem(product.id)} style={{ padding: 6, marginLeft: 4 }}>
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={dark ? '#FCA5A5' : '#DC2626'} />
                        </Pressable>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Totals */}
                <View style={[styles.summaryBox, { backgroundColor: dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: dark ? 'rgba(255,255,255,0.06)' : '#E5E7EB' }]}>
                  <Row label="Subtotal" value={money(subtotal)} colors={colors} />
                  <Row label="Descuento" value={`-${money(discount)}`} colors={colors} />
                  <Row label="Impuestos" value={money(tax)} colors={colors} />
                  <View style={{ height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', marginVertical: 8 }} />
                  <Row label="Total" value={money(total)} bold colors={colors} />
                </View>

                <Pressable
                  onPress={() => Alert.alert('Pago', 'Continuar al flujo de pago...')}
                  disabled={total <= 0}
                  style={[styles.payBtn, { backgroundColor: total > 0 ? '#F97316' : (dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB') }]}
                >
                  <Text style={{ color: total > 0 ? '#fff' : (dark ? '#94A3B8' : '#64748B'), fontWeight: '700' }}>Continuar al pago</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

function Row({ label, value, bold, colors }: { label: string; value: string; bold?: boolean; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
      <Text style={{ color: colors.text, opacity: 0.8 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 2,
  },
  filterBtn: {
    padding: 6,
    borderRadius: 8,
  },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cartContainer: {
    alignSelf: 'stretch',
  },
  cartPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cartThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  payBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 14,
    maxHeight: '75%',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.6)',
    alignSelf: 'center',
    marginBottom: 8,
  },
});
