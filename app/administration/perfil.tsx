import FireStoreUsuarios from '@/firebase/FirestoreUsuarios';
import { auth } from '@/src/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function PerfilScreen() {
  const { color, space, font } = useAppTheme();
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
    const load = async () => {
      try {
        if (!user) return;
        const doc = await FireStoreUsuarios.listarUsuarioPorId(user.uid);
        const telefono = (doc as any)?.telefono ?? (doc as any)?.phone ?? '';
        if (telefono) setPhone(String(telefono));
        setInitial({ name: user.displayName ?? '', email: user.email ?? '', phone: String(telefono ?? '') });
      } catch {
        setInitial({ name: user?.displayName ?? '', email: user?.email ?? '', phone: '' });
      }
    };
    load();
  }, [user?.uid]);

  const onSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if ((name ?? '').trim() !== (user.displayName ?? '')) {
        await updateProfile(user, { displayName: name.trim() || undefined });
      }
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
      <Text style={{ color: color.danger, fontWeight: font.weight.semibold }}>¿Eliminar cuenta?</Text>
    </Pressable>
  );

  const headerLeft = () => (
    <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
      <Ionicons name="chevron-back" size={22} color={color.text} />
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Tu perfil', headerRight, headerLeft }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1, backgroundColor: color.bg }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={[styles.label, { color: color.text, fontSize: font.size.sm, fontWeight: font.weight.semibold, marginBottom: space[2] }]}>
              Nombre
            </Text>
            <Input value={name} onChangeText={setName} placeholder="Tu nombre" autoCapitalize="words" returnKeyType="done" />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: color.text, fontSize: font.size.sm, fontWeight: font.weight.semibold, marginBottom: space[2] }]}>
              Correo electrónico
            </Text>
            <Input value={email} editable={false} style={{ opacity: 0.8 }} />
            <Text style={[styles.help, { color: color.textMuted, fontSize: font.size.sm, marginTop: space[1] }]}>
              Todas las notificaciones se enviarán a este correo.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: color.text, fontSize: font.size.sm, fontWeight: font.weight.semibold, marginBottom: space[2] }]}>
              Número de teléfono
            </Text>
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. +52 555 555 5555"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            <Text style={[styles.help, { color: color.textMuted, fontSize: font.size.sm, marginTop: space[1] }]}>
              Todas las notificaciones y verificaciones OTP se enviarán a este número.
            </Text>
          </View>

          {error ? <Text style={{ color: color.danger, marginBottom: space[2] }}>{error}</Text> : null}

          <View style={[styles.actions, { gap: space[2], marginTop: space[2] }]}>
            <Button title="Guardar cambios" onPress={onSave} loading={loading} disabled={!dirty || loading} />
            <Button title="Cancelar" variant="outline" onPress={onCancel} disabled={loading} />
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
    opacity: 0.9,
  },
  help: {
    marginTop: 6,
  },
  actions: {
    marginTop: 8,
  },
});
