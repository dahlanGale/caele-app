import { auth } from '@/src/lib/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FirestoreAdministracion from '../../firebase/FirestoreAdministracion';

export default function RegisterScreen() {
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
      // 1. Registrar el usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }

      // 2. Registrar la pyme en Firestore (antes de navegar)
      await FirestoreAdministracion.registrarPyme({
        id: cred.user.uid,
        nombre: name.trim(),
        email: email.trim(),
        fechaRegistro: new Date(),
        celular: celular.trim(),
        nombreNegocio: businessName.trim(),
        isAdmin: true,
      });

      // 3. Navegar solo si todo lo anterior tuvo éxito
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
        colors={["#CDDDEF", "#FFFFFF"]}
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
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>Regístrate para comenzar</Text>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Nombre (opcional)"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Nombre del negocio"
                  autoCapitalize="words"
                  value={businessName}
                  onChangeText={setBusinessName}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Número de celular"
                  autoCapitalize="words"
                  value={celular}
                  onChangeText={setCelular}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Correo electrónico"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Contraseña (mín. 6)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.inputControl}
                />
              </View>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                  placeholder="Confirmar contraseña"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                  style={styles.inputControl}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={onRegister} disabled={loading} style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}>
                <Text style={styles.primaryBtnText}>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</Text>
              </Pressable>

              <Pressable onPress={() => router.replace('/administration/login')} style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}>
                <Text style={styles.outlineBtnText}>Ya tengo cuenta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
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
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  icon: { marginRight: 6 },
  inputControl: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
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
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
