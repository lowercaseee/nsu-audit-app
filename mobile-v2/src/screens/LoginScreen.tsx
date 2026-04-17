import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { ApiService } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(ApiService.getServerUrl());
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const hasSession = await ApiService.restoreSession();
    if (hasSession) {
      const user = ApiService.getUser();
      if (user) {
        navigation.replace('Home', { user, token: ApiService.getToken()! });
      }
    }
  };

  const testServer = async () => {
    setTestingServer(true);
    setServerStatus('unknown');
    const ok = await ApiService.testConnection();
    setServerStatus(ok ? 'ok' : 'error');
    setTestingServer(false);
  };

  const handleLogin = async () => {
    if (serverStatus === 'error') {
      Alert.alert('Error', 'Cannot connect to server. Please check server URL.');
      return;
    }

    setLoading(true);
    try {
      await ApiService.setServerUrl(serverUrl);
      const result = await ApiService.loginWithGoogle();
      navigation.replace('Home', { user: result.user, token: result.token });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await ApiService.setServerUrl(serverUrl);
      const result = await ApiService.processTranscript();
      navigation.navigate('Result', { result, token: ApiService.getToken() || '', user: ApiService.getUser()! });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Demo failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>NSU Audit</Text>
        <Text style={styles.subtitle}>Student Audit System</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Server URL</Text>
        <View style={styles.serverRow}>
          <TextInput
            style={[styles.input, styles.serverInput]}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.x.x:5000"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity
            style={[styles.testButton, serverStatus === 'ok' && styles.testButtonOk, serverStatus === 'error' && styles.testButtonError]}
            onPress={testServer}
            disabled={testingServer}
          >
            {testingServer ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>
                {serverStatus === 'ok' ? 'OK' : serverStatus === 'error' ? 'Fail' : 'Test'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.demoButton]}
          onPress={handleDemo}
          disabled={loading}
        >
          <Text style={styles.demoButtonText}>Try Demo Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Only @northsouth.edu emails allowed
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 72,
    height: 72,
    backgroundColor: '#003366',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  serverRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serverInput: {
    flex: 1,
    marginBottom: 0,
  },
  testButton: {
    backgroundColor: '#64748b',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
    justifyContent: 'center',
  },
  testButtonOk: {
    backgroundColor: '#22c55e',
  },
  testButtonError: {
    backgroundColor: '#dc2626',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#003366',
  },
  demoButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButtonText: {
    color: '#003366',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
  },
});