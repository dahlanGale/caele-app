import { auth, googleProvider } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { Input } from '@/src/components/ui/Input';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const GOOGLE_CONFIG = (Constants.expoConfig?.extra?.google ?? {}) as Record<string, string>;
const googleNativeConfigured = !!(GOOGLE_CONFIG.expoClientId || GOOGLE_CONFIG.iosClientId || GOOGLE_CONFIG.androidClientId);

// Completar la sesión del navegador (requerido por AuthSession)
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { color, space, radius, font, shadow } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, , promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.expoClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
  });

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(drawer)/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: popup nativo de Firebase
        await signInWithPopup(auth, googleProvider);
      } else {
        if (!googleNativeConfigured) {
          throw new Error('El inicio de sesión con Google no está configurado para esta plataforma.');
        }
        // iOS/Android: usar AuthSession para obtener el idToken y autenticar en Firebase
        const result = await promptAsync();
        if (result.type !== 'success') {
          throw new Error('Inicio de sesión cancelado');
        }
        const idToken = result.authentication?.idToken;
        if (!idToken) throw new Error('No se obtuvo idToken de Google');
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
      router.replace('/(drawer)/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo iniciar sesión con Google');
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
                ¡Bienvenido de nuevo!
              </Text>
              <Text style={[styles.subtitle, { color: color.textMuted, fontSize: font.size.sm, marginTop: space[1] }]}>
                Inicia sesión para continuar
              </Text>
            </View>

            <View style={{ gap: space[3] }}>
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
                placeholder="Contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={styles.forgotRow}>
                <Pressable onPress={() => { /* TODO: reset password */ }}>
                  {({ pressed }) => (
                    <Text style={[styles.link, { color: color.textMuted }, pressed && { opacity: 0.6 }]}>
                      ¿Olvidaste tu contraseña?
                    </Text>
                  )}
                </Pressable>
              </View>

              {error ? <Text style={[styles.error, { color: color.danger, fontSize: font.size.sm }]}>{error}</Text> : null}

              <Button title={loading ? 'Entrando…' : 'Iniciar sesión'} onPress={onLogin} loading={loading} />
              <Button
                title="Crear cuenta"
                variant="outline"
                onPress={() => router.push('/administration/register')}
                disabled={loading}
              />

              {(Platform.OS === 'web' || googleNativeConfigured) && (
                <>
                  <View style={styles.separatorRow}>
                    <View style={[styles.separator, { backgroundColor: color.border }]} />
                    <Text style={{ color: color.textMuted, fontSize: font.size.sm }}>o</Text>
                    <View style={[styles.separator, { backgroundColor: color.border }]} />
                  </View>
                  <Button
                    title="Continuar con Google"
                    variant="outline"
                    onPress={onGoogle}
                    disabled={loading || !request}
                    icon={<MaterialCommunityIcons name="google" size={18} color={color.text} />}
                  />
                </>
              )}

              <Text style={[styles.helperText, { color: color.textMuted, fontSize: font.size.sm, marginTop: space[2] }]}>
                ¿No tienes acceso? Contacta al administrador para obtener credenciales.
              </Text>
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
  forgotRow: { alignItems: 'flex-end' },
  link: {
    fontWeight: '500',
  },
  error: {
    fontWeight: '500',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  separator: {
    flex: 1,
    height: 1,
  },
  helperText: {
    textAlign: 'center',
  },
});
