import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ModalRetiroParcial from '@/components/corte/ModalRetiroParcial';
import ModalPago from '@/components/orden/ModalPago';
import { Chip } from '@/src/components/ui';
import { usePyme } from '@/src/context/PymeContext';
import { useCorteActivo } from '@/src/hooks/useCorteActivo';
import { useFirestoreCollection } from '@/src/hooks/useFirestore';
import { useTerminal } from '@/src/hooks/useTerminal';
import { registrarRetiro } from '@/src/services/cortes';
import { articulosCollection, categoriasCollection } from '@/src/services/firestore';
import { crearOrden, generarCodigoVenta, pagarOrden } from '@/src/services/ordenes';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { PaymentData } from '@/src/types';

export default function OrdenScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const { width } = useWindowDimensions();

  const isWide = width >= 1000;
  const chipSpacing = Platform.OS === 'web' || isWide ? 8 : 10;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const { items: rawArticulos, loading: productsLoading } = useFirestoreCollection(articulosCollection);
  const { items: categories, loading: categoriesLoading } = useFirestoreCollection(categoriasCollection);

  const { pyme } = usePyme();
  const { terminal } = useTerminal();
  const { corte } = useCorteActivo(terminal?.id);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.nombre;
    return map;
  }, [categories]);

  const CATEGORIES = useMemo(() => categories.map((c) => c.nombre), [categories]);

  type Product = {
    id: string;
    title: string;
    description: string;
    price: number; // precio efectivo (con descuento), IVA incluido
    pack: string;
    category: string;
    categoryId: string;
    barcode: string;
    image: string;
  };

  const PRODUCTS: Product[] = useMemo(
    () =>
      rawArticulos.map((p) => {
        const descuento = p.descuento ?? 0;
        const price = p.precio * (1 - descuento / 100);
        return {
          id: p.id,
          title: p.nombre,
          description: p.descripcion ?? '',
          price,
          pack: `${p.stock ?? 0} disponible`,
          category: p.categoriaId ? categoryMap[p.categoriaId] ?? 'Sin categoría' : 'Sin categoría',
          categoryId: p.categoriaId ?? '',
          barcode: p.codigoBarras ?? '',
          image: p.imagen ?? '',
        };
      }),
    [rawArticulos, categoryMap]
  );

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
    return PRODUCTS.filter((p) => {
      const matchesCat = category === '' || p.category === category;
      if (!q) return matchesCat;
      // Búsqueda por nombre o por código de barras (escaneo). El código puede
      // coincidir en cualquier categoría.
      const byBarcode = p.barcode && p.barcode.toLowerCase() === q;
      return (matchesCat && p.title.toLowerCase().includes(q)) || byBarcode;
    });
  }, [PRODUCTS, category, query]);

  const money = (n: number) => `$${n.toFixed(2)}`;

  // IVA 16% incluido en el precio.
  const { subtotal, tax, total } = useMemo(() => {
    const tot = Object.values(cart).reduce((acc, it) => acc + it.product.price * it.qty, 0);
    const sub = tot / 1.16;
    return { subtotal: sub, tax: tot - sub, total: tot };
  }, [cart]);

  const itemCount = useMemo(() => Object.values(cart).reduce((acc, it) => acc + it.qty, 0), [cart]);

  const { mesaId, zonaId } = useLocalSearchParams<{ mesaId?: string; zonaId?: string }>();
  const [payOpen, setPayOpen] = useState(false);
  const [retiroOpen, setRetiroOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRetiro, setSavingRetiro] = useState(false);

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

  const handleCobrarPress = () => {
    if (cartItems.length === 0) return;
    if (!corte) {
      Alert.alert('Sin corte abierto', 'Abre un corte de caja en “Estado de cajón” antes de cobrar.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a caja', onPress: () => router.push('/(drawer)/estado-cajon') },
      ]);
      return;
    }
    setCartOpen(false);
    setPayOpen(true);
  };

  const handleConfirmPago = async (pago: PaymentData) => {
    if (!pyme || cartItems.length === 0 || !corte) return;
    setSaving(true);
    try {
      const orden = await crearOrden(pyme.id, zonaId ?? 'mostrador', mesaId ?? 'mostrador', cartItems);
      const codigo = await generarCodigoVenta(pyme.id);
      await pagarOrden(pyme.id, orden.id, {
        pago,
        total: orden.total,
        corteId: corte.id,
        terminalId: terminal?.id,
        codigoVenta: codigo,
        zonaId: mesaId ? zonaId : undefined,
        elementoId: mesaId ? mesaId : undefined,
      });
      setPayOpen(false);
      setCart({});
      Alert.alert('Venta registrada', `${codigo}\nTotal: ${money(orden.total)}\nMétodo: ${pago.metodoPago}${pago.cambio ? `\nCambio: ${money(pago.cambio)}` : ''}`);
      if (mesaId) router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo procesar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRetiro = async (monto: number, motivo: string) => {
    if (!pyme || !corte) return;
    setSavingRetiro(true);
    try {
      await registrarRetiro(pyme.id, corte.id, monto, motivo);
      setRetiroOpen(false);
      Alert.alert('Retiro registrado', `${money(monto)} · ${motivo}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo registrar el retiro');
    } finally {
      setSavingRetiro(false);
    }
  };

  const openRetiro = () => {
    if (!corte) {
      Alert.alert('Sin corte abierto', 'Abre un corte de caja antes de registrar un retiro.');
      return;
    }
    setRetiroOpen(true);
  };

  const CartActions = () => (
    <>
      {!corte && (
        <View style={[styles.corteBanner, { backgroundColor: color.accentSoft, borderRadius: radius.md, padding: space[3], marginTop: space[3] }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={color.accent} />
          <Text style={{ color: color.text, marginLeft: space[2], flex: 1, fontSize: font.size.sm }}>
            No hay corte abierto. Ábrelo en “Estado de cajón”.
          </Text>
        </View>
      )}
      {saving ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: space[3] }} />
      ) : (
        <Pressable
          onPress={handleCobrarPress}
          disabled={total <= 0}
          style={[styles.payBtn, { backgroundColor: total > 0 ? color.accent : color.borderSubtle, borderRadius: radius.md, marginTop: space[3] }]}
        >
          <MaterialCommunityIcons name="cash-register" size={18} color={total > 0 ? color.textInverse : color.textMuted} />
          <Text style={{ color: total > 0 ? color.textInverse : color.textMuted, fontWeight: font.weight.bold, marginLeft: space[2] }}>
            Cobrar {money(total)}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={openRetiro} style={[styles.retiroBtn, { borderColor: color.border, borderRadius: radius.md, marginTop: space[2] }]}>
        <MaterialCommunityIcons name="cash-minus" size={18} color={color.danger} />
        <Text style={{ color: color.text, fontWeight: font.weight.semibold, marginLeft: space[2] }}>Retiro parcial</Text>
      </Pressable>
    </>
  );

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
                { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3] },
              ]}
            >
              <MaterialCommunityIcons name="barcode-scan" size={20} color={color.textMuted} />
              <TextInput
                placeholder="Buscar o escanear código..."
                placeholderTextColor={color.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                style={[styles.input, { color: color.text, fontSize: font.size.base }]}
              />
            </View>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: space[3], width: '100%', flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 2, paddingHorizontal: 2 }}
          >
            <Chip label="Todas" active={category === ''} onPress={() => setCategory('')} style={{ marginRight: chipSpacing }} />
            {CATEGORIES.map((c, i) => (
              <Chip key={c} label={c} active={c === category} onPress={() => setCategory(c)} style={i < CATEGORIES.length - 1 ? { marginRight: chipSpacing } : undefined} />
            ))}
          </ScrollView>

          {/* Product grid */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space[6] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
              {filtered.length === 0 ? (
                <Text style={{ color: color.text, opacity: 0.7, paddingHorizontal: space[2] }}>
                  {rawArticulos.length === 0 ? 'Aún no hay artículos. Regístralos en Catálogo.' : 'No hay artículos en esta categoría'}
                </Text>
              ) : (
                filtered.map((p) => (
                  <View key={p.id} style={{ width: isWide ? 200 : '100%' }}>
                    <View style={[styles.card, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.md, padding: space[3] }]}>
                      <Image
                        source={p.image ? { uri: p.image } : require('@/assets/images/icon.png')}
                        style={{ width: '100%', height: 120, borderRadius: radius.sm, backgroundColor: color.bgSubtle }}
                        contentFit="cover"
                      />
                      <View style={{ marginTop: space[3] }}>
                        <Text numberOfLines={2} style={[styles.cardTitle, { color: color.text, fontSize: font.size.base }]}>{p.title}</Text>
                        <Text numberOfLines={2} style={{ color: color.textMuted, marginTop: space[1], fontSize: font.size.sm }}>{p.description}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[3] }}>
                        <View>
                          <Text style={[styles.price, { color: color.accent, fontSize: font.size.md }]}>{money(p.price)}</Text>
                          <Text style={{ color: color.textMuted, fontSize: font.size.xs }}>{p.pack}</Text>
                        </View>
                        <Pressable onPress={() => addToCart(p)} style={[styles.addBtn, { backgroundColor: color.accent, borderRadius: radius.sm }]}>
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
            <View style={[styles.cartPanel, { backgroundColor: color.bgElevated, borderColor: color.border, borderRadius: radius.lg, padding: space[4] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.cartTitle, { color: color.text, fontSize: font.size.md }]}>Orden actual</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={corte ? 'cash-register' : 'lock-outline'} size={16} color={corte ? color.success : color.textMuted} />
                  <Text style={{ color: corte ? color.success : color.textMuted, fontSize: font.size.xs, marginLeft: 4 }}>
                    {corte ? 'Caja abierta' : 'Caja cerrada'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: space[3] }}>
                {Object.values(cart).length === 0 ? (
                  <Text style={{ color: color.textMuted }}>No hay productos en el carrito</Text>
                ) : (
                  Object.values(cart).map(({ product, qty }) => (
                    <View key={product.id} style={[styles.cartItem, { borderColor: color.border }]}>
                      <Image source={product.image ? { uri: product.image } : require('@/assets/images/icon.png')} style={styles.cartThumb} contentFit="cover" />
                      <View style={{ flex: 1, marginHorizontal: space[2] }}>
                        <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>{product.title}</Text>
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

              <View style={[styles.summaryBox, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md, padding: space[3], marginTop: space[3] }]}>
                <Row label="Subtotal" value={money(subtotal)} color={color.text} />
                <Row label="IVA (16%)" value={money(tax)} color={color.text} />
                <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
                <Row label="Total" value={money(total)} bold color={color.text} />
              </View>

              <CartActions />
            </View>
          </View>
        )}
      </View>

      {/* Mobile FAB and sheet */}
      {!isWide && (
        <>
          <Pressable
            onPress={() => setCartOpen(true)}
            style={[styles.fab, { backgroundColor: color.accent, borderRadius: radius.full, paddingVertical: space[4], paddingHorizontal: space[4], left: space[4], right: space[4], bottom: space[4], ...shadow.md }]}
          >
            <MaterialCommunityIcons name="cart" size={18} color={color.textInverse} />
            <Text style={{ color: color.textInverse, fontWeight: font.weight.black, marginLeft: space[2] }}>Ver pedido{itemCount ? ` (${itemCount})` : ''}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: color.textInverse, fontWeight: font.weight.black }}>{money(total)}</Text>
          </Pressable>

          <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Pressable style={[styles.backdrop, { backgroundColor: color.overlay }]} onPress={() => setCartOpen(false)} />
              <View style={[styles.sheet, { backgroundColor: color.bgElevated, borderColor: color.border, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space[4] }]}>
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
                        <Image source={product.image ? { uri: product.image } : require('@/assets/images/icon.png')} style={styles.cartThumb} contentFit="cover" />
                        <View style={{ flex: 1, marginHorizontal: space[2] }}>
                          <Text numberOfLines={1} style={{ color: color.text, fontWeight: font.weight.semibold }}>{product.title}</Text>
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

                <View style={[styles.summaryBox, { backgroundColor: color.bgSubtle, borderColor: color.border, borderRadius: radius.md, padding: space[3], marginTop: space[3] }]}>
                  <Row label="Subtotal" value={money(subtotal)} color={color.text} />
                  <Row label="IVA (16%)" value={money(tax)} color={color.text} />
                  <View style={{ height: 1, backgroundColor: color.border, marginVertical: space[2] }} />
                  <Row label="Total" value={money(total)} bold color={color.text} />
                </View>

                <CartActions />
              </View>
            </View>
          </Modal>
        </>
      )}

      <ModalPago visible={payOpen} total={total} saving={saving} onClose={() => setPayOpen(false)} onConfirm={handleConfirmPago} />
      <ModalRetiroParcial visible={retiroOpen} saving={savingRetiro} onClose={() => setRetiroOpen(false)} onConfirm={handleConfirmRetiro} />
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
  container: { flex: 1 },
  content: { flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, gap: 8 },
  input: { flex: 1, paddingVertical: 2 },
  card: { borderWidth: 1 },
  cardTitle: { fontWeight: '700' },
  price: { fontWeight: '800' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cartContainer: { alignSelf: 'stretch' },
  cartPanel: { borderWidth: 1 },
  cartTitle: { fontWeight: '800' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  cartThumb: { width: 52, height: 52, borderRadius: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6 },
  stepBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  summaryBox: { borderWidth: 1 },
  payBtn: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  retiroBtn: { paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1 },
  corteBanner: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderWidth: 1, maxHeight: '75%' },
  backdrop: { flex: 1 },
  sheetHandle: { width: 42, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 8 },
});
