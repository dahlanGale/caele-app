import { auth } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import FirestoreAdministracion from '../../firebase/FirestoreAdministracion';
import FirestoreUsuarios from '../../firebase/FirestoreUsuarios';

export default function RegisterScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRegister = async () => {
    setError(null);
    if (!email || !password) {
      setError('Completa correo y contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }

      await FirestoreAdministracion.registrarPyme({
        id: cred.user.uid,
        nombre: name.trim(),
        email: email.trim(),
        fechaRegistro: new Date(),
        celular: celular.trim(),
        nombreNegocio: businessName.trim(),
        isAdmin: true,
      });

      await FirestoreUsuarios.registrarUsuario({
        id: cred.user.uid,
        nombre: name.trim(),
        email: email.trim(),
        telefono: celular.trim(),
        rol: 'admin',
        pymeId: cred.user.uid,
      });

      router.replace('/(drawer)/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[color.bgSubtle, color.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.center}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: color.bgElevated,
                borderRadius: radius.lg,
                padding: space[5],
                ...shadow.md,
                borderColor: color.border,
              },
            ]}
          >
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: color.text, fontSize: font.size.xl }]}>
                Crear cuenta
              </Text>
              <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.sm, marginTop: space[1] }]}>
                Regístrate para comenzar
              </Text>
            </View>

            <View style={{ gap: space[3] }}>
              <Input
                icon={<MaterialCommunityIcons name="account-outline" size={20} color={color.textMuted} />}
                placeholder="Nombre (opcional)"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <Input
                icon={<MaterialCommunityIcons name="store-outline" size={20} color={color.textMuted} />}
                placeholder="Nombre del negocio"
                autoCapitalize="words"
                value={businessName}
                onChangeText={setBusinessName}
              />
              <Input
                icon={<MaterialCommunityIcons name="phone-outline" size={20} color={color.textMuted} />}
                placeholder="Número de celular"
                keyboardType="phone-pad"
                value={celular}
                onChangeText={setCelular}
              />
              <Input
                icon={<MaterialCommunityIcons name="email-outline" size={20} color={color.textMuted} />}
                placeholder="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                icon={<MaterialCommunityIcons name="lock-outline" size={20} color={color.textMuted} />}
                placeholder="Contraseña (mín. 6)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Input
                icon={<MaterialCommunityIcons name="lock-outline" size={20} color={color.textMuted} />}
                placeholder="Confirmar contraseña"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              {error ? <Text style={[styles.error, { color: color.danger, fontSize: font.size.sm }]}>{error}</Text> : null}

              <Button
                title={loading ? 'Creando cuenta…' : 'Crear cuenta'}
                onPress={onRegister}
                loading={loading}
              />
              <Button
                title="Ya tengo cuenta"
                variant="outline"
                onPress={() => router.replace('/administration/login')}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
  },
  error: {
    fontWeight: '500',
  },
});
