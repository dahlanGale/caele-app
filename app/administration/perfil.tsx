import FireStoreUsuarios from '@/firebase/FirestoreUsuarios';
import { auth } from '@/src/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function PerfilScreen() {
  const { colors } = useTheme();
  const user = auth.currentUser;

  const [name, setName] = useState<string>(user?.displayName ?? '');
  const [email] = useState<string>(user?.email ?? '');
  const [phone, setPhone] = useState<string>('');
  const [initial, setInitial] = useState<{ name: string; email: string; phone: string }>({
    name: user?.displayName ?? '',
    email: user?.email ?? '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => name !== initial.name || phone !== initial.phone, [name, phone, initial]);

  useEffect(() => {
    // Opcional: intenta cargar datos desde Firestore si existen
    const load = async () => {
      try {
        if (!user) return;
        const doc = await FireStoreUsuarios.listarUsuarioPorId(user.uid);
        const telefono = (doc as any)?.telefono ?? (doc as any)?.phone ?? '';
        if (telefono) setPhone(String(telefono));
        setInitial({ name: user.displayName ?? '', email: user.email ?? '', phone: String(telefono ?? '') });
      } catch {
        // si no existe el doc, usamos solo los datos de auth
        setInitial({ name: user?.displayName ?? '', email: user?.email ?? '', phone: '' });
      }
    };
    load();
  }, []);

  const onSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if ((name ?? '').trim() !== (user.displayName ?? '')) {
        await updateProfile(user, { displayName: name.trim() || undefined });
      }
      // Persistir datos adicionales en Firestore (merge)
      await FireStoreUsuarios.registrarUsuario({ id: user.uid, nombre: name.trim(), telefono: phone.trim() });
      setInitial({ name, email, phone });
      Alert.alert('Guardado', 'Se guardaron los cambios correctamente.');
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setName(initial.name);
    setPhone(initial.phone);
  };

  const headerRight = () => (
    <Pressable onPress={() => Alert.alert('Eliminar cuenta', 'Esta acción estará disponible pronto.', [{ text: 'OK' }])}>
      <Text style={{ color: '#EF4444', fontWeight: '600' }}>¿Eliminar cuenta?</Text>
    </Pressable>
  );

  const headerLeft = () => (
    <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Tu perfil', headerRight, headerLeft }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={Platform.select({ ios: '#9CA3AF', android: '#9CA3AF', default: '#9CA3AF' })}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Email (solo lectura) */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
            <TextInput
              value={email}
              editable={false}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, opacity: 0.8 }]}
            />
            <Text style={[styles.help, { color: colors.text, opacity: 0.6 }]}>Todas las notificaciones se enviarán a este correo.</Text>
          </View>

          {/* Teléfono */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Número de teléfono</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. +52 555 555 5555"
              placeholderTextColor={Platform.select({ ios: '#9CA3AF', android: '#9CA3AF', default: '#9CA3AF' })}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={[styles.help, { color: colors.text, opacity: 0.6 }]}>Todas las notificaciones y verificaciones OTP se enviarán a este número.</Text>
          </View>

          {error ? <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text> : null}

          {/* Botones */}
          <View style={styles.actions}>
            <Pressable
              onPress={onSave}
              disabled={!dirty || loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: !dirty || loading ? 0.6 : pressed ? 0.9 : 1, backgroundColor: '#3B82F6' },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Guardar cambios</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.ghostBtn,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.ghostBtnText, { color: colors.text }]}>Cancelar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  help: {
    marginTop: 6,
    fontSize: 12,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ghostBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ghostBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
