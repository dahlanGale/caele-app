import { auth, googleProvider } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';

const GOOGLE_CONFIG = (Constants.expoConfig?.extra?.google ?? {}) as Record<string, string>;
const googleNativeConfigured = !!(GOOGLE_CONFIG.expoClientId || GOOGLE_CONFIG.iosClientId || GOOGLE_CONFIG.androidClientId);

// Completar la sesión del navegador (requerido por AuthSession)
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
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

  // Theme
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const placeholderColor = dark ? '#9CA3AF' : '#9CA3AF';

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
        colors={dark ? ["#0B1220", "#111827"] : ["#CDDDEF", "#FFFFFF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.center}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>¡Bienvenido de nuevo!</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" size={20} style={styles.icon} />
                <TextInput
                  placeholder="Correo electrónico"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" size={20} style={styles.icon} />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.inputControl}
                />
              </View>

              <View style={styles.forgotRow}>
                <Pressable onPress={() => { /* TODO: reset password */ }}>
                  {({ pressed }) => (
                    <Text style={[styles.link, pressed && { opacity: 0.6 }]}>¿Olvidaste tu contraseña?</Text>
                  )}
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={onLogin} disabled={loading} style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}>
                <Text style={styles.primaryBtnText}>{loading ? 'Entrando…' : 'Iniciar sesión'}</Text>
              </Pressable>
              
              <Pressable onPress={() => router.push('/administration/register')} style={({ pressed }) => [
                styles.outlineBtn,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}>
                <Text style={styles.outlineBtnText}>Crear cuenta</Text>
              </Pressable>

              {(Platform.OS === 'web' || googleNativeConfigured) && (
                <>
                  <View style={styles.separatorRow}>
                    <View style={[styles.separator, { backgroundColor: dark ? '#374151' : '#E5E7EB' }]} />
                    <Text style={{ color: dark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}>o</Text>
                    <View style={[styles.separator, { backgroundColor: dark ? '#374151' : '#E5E7EB' }]} />
                  </View>
                  <Pressable onPress={onGoogle} disabled={loading || !request} style={({ pressed }) => [
                    styles.outlineBtn,
                    pressed && styles.btnPressed,
                    loading && styles.btnDisabled,
                  ]}>
                    <MaterialCommunityIcons name="google" size={18} color={dark ? '#F3F4F6' : '#111827'} />
                    <Text style={[styles.outlineBtnText, { marginLeft: 8 }]}>Continuar con Google</Text>
                  </Pressable>
                </>
              )}

              <Text style={styles.helperText}>¿No tienes acceso? Contacta al administrador para obtener credenciales.</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (dark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: dark ? '#0B1220' : '#fff' },
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
    backgroundColor: dark ? '#111827' : '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: dark ? 0.25 : 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
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
    fontSize: 24,
    fontWeight: '700',
    color: dark ? '#F9FAFB' : '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: dark ? '#9CA3AF' : '#6B7280',
    marginTop: 4,
  },
  form: { gap: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dark ? '#374151' : '#E5E7EB',
    borderRadius: 12,
    backgroundColor: dark ? '#0F172A' : '#F9FAFB',
    paddingHorizontal: 12,
  },
  icon: { marginRight: 6, color: dark ? '#9CA3AF' : '#6B7280' },
  inputControl: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: dark ? '#F3F4F6' : '#111827',
  },
  forgotRow: { alignItems: 'flex-end' },
  error: {
    color: '#DC2626',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: '#0000FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: dark ? '#374151' : '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: dark ? '#111827' : '#fff',
  },
  outlineBtnText: {
    color: dark ? '#F3F4F6' : '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
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
    backgroundColor: dark ? '#1F2937' : '#E5E7EB',
  },
  sepText: {
    color: dark ? '#9CA3AF' : '#9CA3AF',
  },
  helperText: {
    marginTop: 8,
    color: dark ? '#9CA3AF' : '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  link: {
    color: dark ? '#60A5FA' : '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
});
