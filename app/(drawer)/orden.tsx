import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Chip } from '@/src/components/ui';
import { usePyme } from '@/src/context/PymeContext';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { categoriasCollection, productosCollection } from '@/src/services/firestore';
import { crearOrden, pagarOrden } from '@/src/services/ordenes';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function OrdenScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const { width } = useWindowDimensions();

  const isWide = width >= 1000;
  const gridCols = width >= 1280 ? 3 : width >= 760 ? 2 : 1;
  const chipSpacing = Platform.OS === 'web' || isWide ? 8 : 10;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const { items: rawProducts, loading: productsLoading } = useFirestoreCollection(productosCollection);
  const { items: categories, loading: categoriesLoading } = useFirestoreCollection(categoriasCollection);

  const CATEGORIES = useMemo(() => categories.map((c) => c.nombre), [categories]);

  type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    pack: string;
    category: string;
    image: string;
  };

  const PRODUCTS: Product[] = useMemo(
    () =>
      rawProducts.map((p) => ({
        id: p.id,
        title: p.nombre,
        description: p.descripcion ?? '',
        price: p.precio,
        pack: `${p.stock ?? 1} disponible`,
        category: p.categoriaId ?? 'Sin categoría',
        image: p.imagen ?? '',
      })),
    [rawProducts]
  );

  useEffect(() => {
    if (categoriesLoading) return;
    const firstWithItems = CATEGORIES.find((c) => PRODUCTS.some((p) => p.category === c));
    if (firstWithItems && firstWithItems !== category) {
      setCategory(firstWithItems);
    } else if (!category && CATEGORIES.length > 0) {
      setCategory(CATEGORIES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CATEGORIES, productsLoading, categoriesLoading]);

  type CartState = Record<string, { qty: number; product: Product }>;
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
    const disc = sub > 0 ? 5 : 0;
    const taxRate = 0.06;
    const taxVal = (sub - disc) * taxRate;
    const tot = Math.max(0, sub - disc + taxVal);
    return { subtotal: sub, discount: disc, tax: taxVal, total: tot };
  }, [cart]);

  const itemCount = useMemo(() => Object.values(cart).reduce((acc, it) => acc + it.qty, 0), [cart]);

  const { mesaId, zonaId } = useLocalSearchParams<{ mesaId?: string; zonaId?: string }>();
  const { pyme } = usePyme();
  const [ordenId, setOrdenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cartItems = useMemo(
    () =>
      Object.values(cart).map(({ product, qty }) => ({
        productoId: product.id,
        nombre: product.title,
        cantidad: qty,
        precioUnitario: product.price,
      })),
    [cart]
  );

  const handleSaveOrder = async () => {
    if (!pyme || cartItems.length === 0) return;
    setSaving(true);
    try {
      const orden = await crearOrden(pyme.id, zonaId ?? 'mostrador', mesaId ?? 'mostrador', cartItems);
      setOrdenId(orden.id);
      Alert.alert('Orden guardada', `Total: ${money(orden.total)}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la orden');
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async () => {
    if (!pyme || !ordenId) return;
    setSaving(true);
    try {
      await pagarOrden(pyme.id, ordenId, zonaId ?? 'mostrador', mesaId ?? 'mostrador');
      Alert.alert('Pago completado', 'La orden fue pagada y la mesa liberada.');
      setCart({});
      setOrdenId(null);
      if (mesaId) router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo procesar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: color.bg, padding: space[4] }]}>
      <View style={[styles.content, { flexDirection: isWide ? 'row' : 'column', gap: isWide ? space[6] : space[3] }]}>
        {/* Left: products area */}
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={{ marginBottom: space[3] }}>
            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: color.bgElevated,
                  borderColor: color.border,
                  borderRadius: radius.md,
                  paddingHorizontal: space[3],
                  paddingVertical: space[3],
                },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={color.textMuted} />
              <TextInput
                placeholder="Buscar producto..."
                placeholderTextColor={color.textMuted}
                value={query}
                onChangeText={setQuery}
                style={[styles.input, { color: color.text, fontSize: font.size.base }]}
              />
              <Pressable
                onPress={() => Alert.alert('Filtros', 'Aquí puedes abrir filtros avanzados.')}
                android_ripple={{ color: color.accentSoft }}
                style={({ pressed }) => [
                  styles.filterBtn,
                  {
                    backgroundColor: pressed ? color.accentSoft : color.bgSubtle,
                    borderColor: color.border,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <MaterialCommunityIcons name="tune" size={20} color={color.text} />
              </Pressable>
            </View>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: space[4], width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 2, paddingHorizontal: 2 }}
          >
            {CATEGORIES.map((c, i) => (
              <Chip
                key={c}
                label={c}
                active={c === category}
                onPress={() => setCategory(c)}
                style={i < CATEGORIES.length - 1 ? { marginRight: chipSpacing } : undefined}
              />
            ))}
          </ScrollView>

          {/* Product grid */}
          <ScrollView contentContainerStyle={{ paddingBottom: space[6] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space[2] }}>
              {filtered.length === 0 ? (
                <Text style={{ color: color.text, opacity: 0.7, paddingHorizontal: space[2] }}>
                  No hay productos en esta categoría
                </Text>
              ) : (
                filtered.map((p) => (
                  <View key={p.id} style={{ width: `${100 / gridCols}%`, paddingHorizontal: space[2], marginBottom: space[4] }}>
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: color.bgElevated,
                          borderColor: color.border,
                          borderRadius: radius.md,
                          padding: space[3],
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: p.image }}
                        style={{ width: '100%', height: 140, borderRadius: radius.sm }}
                        contentFit="cover"
                      />
                      <View style={{ marginTop: space[3] }}>
                        <Text numberOfLines={2} style={[styles.cardTitle, { color: color.text, fontSize: font.size.base }]}>
                          {p.title}
                        </Text>
                        <Text numberOfLines={2} style={{ color: color.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
                          {p.description}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[3] }}>
                        <View>
                          <Text style={[styles.price, { color: color.accent, fontSize: font.size.md }]}>{money(p.price)}</Text>
                          <Text style={{ color: color.textMuted, fontSize: font.size.xs }}>{p.pack}</Text>
                        </View>
                        <Pressable
                          onPress={() => addToCart(p)}
                          style={[styles.addBtn, { backgroundColor: color.accent, borderRadius: radius.sm }]}
                        >
                          <MaterialCommunityIcons name="cart-plus" size={18} color={color.textInverse} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* Right: cart panel wide */}
        {isWide && (
          <View style={[styles.cartContainer, { width: 340 }]}>
            <View
              style={[
                styles.cartPanel,
                {
                  backgroundColor: color.bgElevated,
                  borderColor: color.border,
                  borderRadius: radius.lg,
                  padding: space[4],
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.cartTitle, { color: color.text, fontSize: font.size.md }]}>Orden actual</Text>
                <Pressable onPress={() => Alert.alert('Opciones', 'Ajustes del carrito próximamente.')}>
                  <MaterialCommunityIcons name="cog-outline" size={20} color={color.text} />
                </Pressable>
              </View>

              <View style={{ marginTop: space[3] }}>
                {Object.values(cart).length === 0 ? (
                  <Text style={{ color: color.textMuted }}>No hay productos en el carrito</Text>
                ) : (
                  Object.values(cart).map(({ product, qty }) => (
                    <View
                      key={product.id}
                      style={[styles.cartItem, { borderColor: color.border }]}
                    >
                      <Image source={{ uri: product.image }} style={styles.cartThumb} contentFit="cover" />
                      <View style={{ flex: 1, marginHorizontal: space[2] }}>
                        <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>
                          {product.title}
                        </Text>
                        <Text style={{ color: color.accent, marginTop: 2 }}>{money(product.price)}</Text>
                      </View>
                      <View style={[styles.stepper, { backgroundColor: color.accent, borderRadius: radius.full }]}>
                        <Pressable onPress={() => dec(product.id)} style={styles.stepBtn}>
                          <MaterialCommunityIcons name="minus" size={16} color={color.textInverse} />
                        </Pressable>
                        <Text style={{ width: 22, textAlign: 'center', color: color.textInverse }}>{qty}</Text>
                        <Pressable onPress={() => inc(product.id)} style={styles.stepBtn}>
                          <MaterialCommunityIcons name="plus" size={16} color={color.textInverse} />
                        </Pressable>
                      </View>
                      <Pressable onPress={() => removeItem(product.id)} style={{ padding: 6, marginLeft: 4 }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={color.danger} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              <View
                style={[
                  styles.summaryBox,
                  {
                    backgroundColor: color.bgSubtle,
                    borderColor: color.border,
                    borderRadius: radius.md,
                    padding: space[3],
                    marginTop: space[3],
                  },
                ]}
              >
                <Row label="Subtotal" value={money(subtotal)} color={color.text} />
                <Row label="Descuento" value={`-${money(discount)}`} color={color.text} />
                <Row label="Impuestos" value={money(tax)} color={color.text} />
                <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
                <Row label="Total" value={money(total)} bold color={color.text} />
              </View>

              {saving ? (
                <ActivityIndicator color={color.accent} style={{ marginTop: space[3] }} />
              ) : (
                <Pressable
                  onPress={ordenId ? handlePay : handleSaveOrder}
                  disabled={total <= 0 || saving}
                  style={[
                    styles.payBtn,
                    {
                      backgroundColor: total > 0 ? color.accent : color.borderSubtle,
                      borderRadius: radius.md,
                      marginTop: space[3],
                    },
                  ]}
                >
                  <Text style={{ color: total > 0 ? color.textInverse : color.textMuted, fontWeight: font.weight.bold }}>
                    {ordenId ? 'Pagar' : 'Guardar orden'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Mobile FAB and sheet */}
      {!isWide && (
        <>
          <Pressable
            onPress={() => setCartOpen(true)}
            style={[
              styles.fab,
              {
                backgroundColor: color.accent,
                borderRadius: radius.full,
                paddingVertical: space[4],
                paddingHorizontal: space[4],
                left: space[4],
                right: space[4],
                bottom: space[4],
                ...shadow.md,
              },
            ]}
          >
            <MaterialCommunityIcons name="cart" size={18} color={color.textInverse} />
            <Text style={{ color: color.textInverse, fontWeight: font.weight.black, marginLeft: space[2] }}>
              Ver pedido{itemCount ? ` (${itemCount})` : ''}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: color.textInverse, fontWeight: font.weight.black }}>{money(total)}</Text>
          </Pressable>

          <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Pressable style={[styles.backdrop, { backgroundColor: color.overlay }]} onPress={() => setCartOpen(false)} />
              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: color.bgElevated,
                    borderColor: color.border,
                    borderTopLeftRadius: radius.lg,
                    borderTopRightRadius: radius.lg,
                    padding: space[4],
                  },
                ]}
              >
                <View style={[styles.sheetHandle, { backgroundColor: color.textMuted }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.cartTitle, { color: color.text, fontSize: font.size.md }]}>Orden actual</Text>
                  <Pressable onPress={() => setCartOpen(false)}>
                    <MaterialCommunityIcons name="close" size={22} color={color.text} />
                  </Pressable>
                </View>

                <ScrollView style={{ marginTop: space[3] }} contentContainerStyle={{ paddingBottom: space[4] }}>
                  {Object.values(cart).length === 0 ? (
                    <Text style={{ color: color.textMuted }}>No hay productos en el carrito</Text>
                  ) : (
                    Object.values(cart).map(({ product, qty }) => (
                      <View key={product.id} style={[styles.cartItem, { borderColor: color.border }]}>
                        <Image source={{ uri: product.image }} style={styles.cartThumb} contentFit="cover" />
                        <View style={{ flex: 1, marginHorizontal: space[2] }}>
                          <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>
                            {product.title}
                          </Text>
                          <Text style={{ color: color.accent, marginTop: 2 }}>{money(product.price)}</Text>
                        </View>
                        <View style={[styles.stepper, { backgroundColor: color.accent, borderRadius: radius.full }]}>
                          <Pressable onPress={() => dec(product.id)} style={styles.stepBtn}>
                            <MaterialCommunityIcons name="minus" size={16} color={color.textInverse} />
                          </Pressable>
                          <Text style={{ width: 22, textAlign: 'center', color: color.textInverse }}>{qty}</Text>
                          <Pressable onPress={() => inc(product.id)} style={styles.stepBtn}>
                            <MaterialCommunityIcons name="plus" size={16} color={color.textInverse} />
                          </Pressable>
                        </View>
                        <Pressable onPress={() => removeItem(product.id)} style={{ padding: 6, marginLeft: 4 }}>
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={color.danger} />
                        </Pressable>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View
                  style={[
                    styles.summaryBox,
                    {
                      backgroundColor: color.bgSubtle,
                      borderColor: color.border,
                      borderRadius: radius.md,
                      padding: space[3],
                      marginTop: space[3],
                    },
                  ]}
                >
                  <Row label="Subtotal" value={money(subtotal)} color={color.text} />
                  <Row label="Descuento" value={`-${money(discount)}`} color={color.text} />
                  <Row label="Impuestos" value={money(tax)} color={color.text} />
                  <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
                  <Row label="Total" value={money(total)} bold color={color.text} />
                </View>

                {saving ? (
                  <ActivityIndicator color={color.accent} style={{ marginTop: space[3] }} />
                ) : (
                  <Pressable
                    onPress={ordenId ? handlePay : handleSaveOrder}
                    disabled={total <= 0 || saving}
                    style={[
                      styles.payBtn,
                      {
                        backgroundColor: total > 0 ? color.accent : color.borderSubtle,
                        borderRadius: radius.md,
                        marginTop: space[3],
                      },
                    ]}
                  >
                    <Text style={{ color: total > 0 ? color.textInverse : color.textMuted, fontWeight: font.weight.bold }}>
                      {ordenId ? 'Pagar' : 'Guardar orden'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
      <Text style={{ color, opacity: 0.8 }}>{label}</Text>
      <Text style={{ color, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 2,
  },
  filterBtn: {
    padding: 6,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: '700',
  },
  price: {
    fontWeight: '800',
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cartContainer: {
    alignSelf: 'stretch',
  },
  cartPanel: {
    borderWidth: 1,
  },
  cartTitle: {
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
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  summaryBox: {
    borderWidth: 1,
  },
  payBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    maxHeight: '75%',
  },
  backdrop: {
    flex: 1,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
