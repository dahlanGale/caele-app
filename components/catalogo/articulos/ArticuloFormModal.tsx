import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Chip } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import type { WithId } from '@/src/services/firestore';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Articulo, Categoria } from '@/src/types';

export type ArticuloFormValues = {
  nombre: string;
  precio: number;
  descuento?: number;
  categoriaId?: string;
  codigoBarras?: string;
  unidadVenta?: string;
  stock?: number;
  imagen?: string;
  descripcion?: string;
};

type Props = {
  visible: boolean;
  initial?: WithId<Articulo> | null;
  categorias: WithId<Categoria>[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: ArticuloFormValues) => void;
  onCreateCategoria?: (nombre: string) => Promise<string>;
};

export default function ArticuloFormModal({ visible, initial, categorias, saving, onClose, onSubmit, onCreateCategoria }: Props) {
  const { color, space, radius, font } = useAppTheme();

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descuento, setDescuento] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [unidadVenta, setUnidadVenta] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [addingCat, setAddingCat] = useState(false);
  const [nuevaCat, setNuevaCat] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setNombre(initial?.nombre ?? '');
    setPrecio(initial?.precio != null ? String(initial.precio) : '');
    setDescuento(initial?.descuento != null ? String(initial.descuento) : '');
    setCategoriaId(initial?.categoriaId);
    setCodigoBarras(initial?.codigoBarras ?? '');
    setUnidadVenta(initial?.unidadVenta ?? '');
    setStock(initial?.stock != null ? String(initial.stock) : '');
    setImagen(initial?.imagen ?? '');
    setDescripcion(initial?.descripcion ?? '');
    setAddingCat(false);
    setNuevaCat('');
  }, [visible, initial]);

  const crearCategoria = async () => {
    if (!onCreateCategoria || !nuevaCat.trim()) return;
    setSavingCat(true);
    try {
      const id = await onCreateCategoria(nuevaCat.trim());
      setCategoriaId(id);
      setNuevaCat('');
      setAddingCat(false);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo crear la categoría.');
    } finally {
      setSavingCat(false);
    }
  };

  const submit = () => {
    setError(null);
    const precioNum = Number(precio);
    if (!nombre.trim()) return setError('El nombre es obligatorio.');
    if (!precio || Number.isNaN(precioNum) || precioNum <= 0) return setError('Escribe un precio válido.');
    const descNum = descuento ? Number(descuento) : 0;
    if (Number.isNaN(descNum) || descNum < 0 || descNum > 100) return setError('El descuento debe ser 0–100.');
    onSubmit({
      nombre: nombre.trim(),
      precio: precioNum,
      descuento: descNum || undefined,
      categoriaId,
      codigoBarras: codigoBarras.trim() || undefined,
      unidadVenta: unidadVenta.trim() || undefined,
      stock: stock ? Number(stock) : undefined,
      imagen: imagen.trim() || undefined,
      descripcion: descripcion.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[styles.backdrop, { backgroundColor: color.overlay }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: color.bgElevated, borderColor: color.border, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: color.textMuted }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingBottom: space[2] }}>
            <Text style={{ color: color.text, fontSize: font.size.md, fontWeight: font.weight.bold }}>
              {initial ? 'Editar artículo' : 'Nuevo artículo'}
            </Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={color.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: space[4], gap: space[3] }} keyboardShouldPersistTaps="handled">
            <Field label="Nombre">
              <Input placeholder="Ej. Coca-Cola 600ml" value={nombre} onChangeText={setNombre} />
            </Field>

            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <Field label="Precio (IVA incl.)">
                  <Input placeholder="0.00" keyboardType="decimal-pad" value={precio} onChangeText={setPrecio}
                    icon={<MaterialCommunityIcons name="currency-usd" size={18} color={color.textMuted} />} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Descuento (%)">
                  <Input placeholder="0" keyboardType="number-pad" value={descuento} onChangeText={setDescuento} />
                </Field>
              </View>
            </View>

            <Field label="Código de barras / UPC">
              <Input placeholder="Escanea o escribe el código" value={codigoBarras} onChangeText={setCodigoBarras}
                autoCapitalize="none"
                icon={<MaterialCommunityIcons name="barcode-scan" size={18} color={color.textMuted} />} />
            </Field>

            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <Field label="Stock">
                  <Input placeholder="0" keyboardType="number-pad" value={stock} onChangeText={setStock} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Unidad">
                  <Input placeholder="pz, kg…" value={unidadVenta} onChangeText={setUnidadVenta} autoCapitalize="none" />
                </Field>
              </View>
            </View>

            <Field label="Categoría">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
                <Chip label="Sin categoría" active={!categoriaId} onPress={() => setCategoriaId(undefined)} style={{ marginRight: space[2] }} />
                {categorias.map((c) => (
                  <Chip key={c.id} label={c.nombre} active={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} style={{ marginRight: space[2] }} />
                ))}
                {onCreateCategoria ? (
                  <Chip label="+ Nueva" active={addingCat} onPress={() => setAddingCat((v) => !v)} />
                ) : null}
              </ScrollView>
              {addingCat && onCreateCategoria ? (
                <View style={{ flexDirection: 'row', gap: space[2], marginTop: space[2], alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Input placeholder="Nombre de la categoría" value={nuevaCat} onChangeText={setNuevaCat} autoFocus />
                  </View>
                  <Pressable
                    onPress={crearCategoria}
                    disabled={savingCat || !nuevaCat.trim()}
                    style={{ backgroundColor: color.accent, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, opacity: savingCat || !nuevaCat.trim() ? 0.6 : 1 }}
                  >
                    <Text style={{ color: color.textInverse, fontWeight: font.weight.bold }}>{savingCat ? '…' : 'Crear'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </Field>

            <Field label="Imagen (URL, opcional)">
              <Input placeholder="https://…" value={imagen} onChangeText={setImagen} autoCapitalize="none"
                icon={<MaterialCommunityIcons name="image-outline" size={18} color={color.textMuted} />} />
            </Field>

            <Field label="Descripción (opcional)">
              <Input placeholder="Notas del artículo" value={descripcion} onChangeText={setDescripcion} />
            </Field>

            {error ? <Text style={{ color: color.danger, fontSize: font.size.sm }}>{error}</Text> : null}

            <Button title={initial ? 'Guardar cambios' : 'Crear artículo'} onPress={submit} loading={saving} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { color, space } = useAppTheme();
  return (
    <View>
      <Text style={{ color: color.textMuted, fontSize: 13, fontWeight: '600', marginBottom: space[1] }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderWidth: 1, maxHeight: '92%', paddingTop: 8 },
  handle: { width: 42, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 8 },
});
