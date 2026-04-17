import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// IMPORTANT: Change this to your computer's local IP address
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const SERVER_URL = 'http://192.168.0.184:5000';

export default function HomeScreen({ navigation, route }) {
  const { apiKey, email } = route.params;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const showError = (msg) => {
    Alert.alert('Error', msg);
  };

  const handleSelectImage = async () => {
    try {
      setLoading(true);
      setStatus('Opening image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        setLoading(false);
        setStatus('');
        return;
      }

      const asset = result.assets[0];
      setStatus('Processing image...');

      // Use base64 if available, otherwise use URI
      let imageData;
      if (asset.base64) {
        imageData = `data:image/jpeg;base64,${asset.base64}`;
      } else {
        // Need to convert URI to base64 manually
        showError('Please select a smaller image or try again');
        setLoading(false);
        setStatus('');
        return;
      }

      setStatus('Sending to server...');
      
      const response = await fetch(`${SERVER_URL}/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ image: imageData })
      });

      setStatus('Processing response...');

      if (response.ok) {
        const data = await response.json();
        navigation.navigate('Result', { result: data, apiKey, email });
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Server returned an error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showError('Cannot connect to server: ' + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleUseDemo = async () => {
    try {
      setLoading(true);
      setStatus('Loading demo data...');
      
      const response = await fetch(`${SERVER_URL}/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        navigation.navigate('Result', { result: data, apiKey, email });
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Server returned an error');
      }
    } catch (err) {
      showError('Cannot connect to server: ' + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.title}>NSU Audit</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003366" />
            {status ? <Text style={styles.statusText}>{status}</Text> : null}
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>
              Upload your transcript to audit
            </Text>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSelectImage}
            >
              <Text style={styles.buttonText}>Select Image</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleUseDemo}
            >
              <Text style={styles.secondaryButtonText}>Use Demo Data</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('Certificates', { apiKey, email })}
        >
          <Text style={styles.historyButtonText}>Certificates</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('History', { apiKey, email })}
        >
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#003366',
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 14,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#003366',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#003366',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
  },
  historyButton: {
    padding: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#003366',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
});