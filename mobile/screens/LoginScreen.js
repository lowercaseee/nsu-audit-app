import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For physical phone, change to your computer's IP address
const SERVER_URL = 'http://192.168.0.184:5000';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [serverUrl, setServerUrl] = useState(SERVER_URL);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your NSU email');
      return;
    }
    if (!email.endsWith('@northsouth.edu')) {
      Alert.alert('Error', 'Only @northsouth.edu emails are allowed');
      return;
    }

    setLoading(true);
    try {
      // Generate API key and login
      const response = await fetch(`${SERVER_URL}/generate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: email.split('@')[0] })
      });

      if (response.ok) {
        const data = await response.json();
        // Store API key and email
        await AsyncStorage.setItem('apiKey', data.apiKey);
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('loginType', 'email');
        navigation.replace('Home', { apiKey: data.apiKey, email });
      } else {
        Alert.alert('Error', 'Failed to authenticate');
      }
    } catch (err) {
      Alert.alert('Error', 'Cannot connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // For demo, simulate Google login - in production use proper OAuth
      Alert.alert('Google Login', 'Use your browser to login with Google, then copy the token here');
    } catch (err) {
      Alert.alert('Error', 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>NSU Audit</Text>
        <Text style={styles.subtitle}>Student Audit System</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>NSU Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@northsouth.edu"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login with Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Only @northsouth.edu emails allowed
      </Text>
    </View>
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
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  googleButtonText: {
    color: '#1e293b',
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