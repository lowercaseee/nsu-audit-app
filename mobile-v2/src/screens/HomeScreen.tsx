import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../services/api';

export default function HomeScreen({ navigation, route }: any) {
  const { user, token } = route.params;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        return false;
      }
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return libraryStatus === 'granted';
    }
    return true;
  };

  const handleSelectImage = async (source: 'camera' | 'gallery') => {
    setShowSourcePicker(false);
    setLoading(true);

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Permission is needed to access photos.');
        setLoading(false);
        return;
      }

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
          base64: true,
        });
      }

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const asset = result.assets[0];
      setStatus('Processing image...');

      let imageData;
      if (asset.base64) {
        imageData = `data:image/jpeg;base64,${asset.base64}`;
      } else {
        Alert.alert('Error', 'Please select a smaller image');
        setLoading(false);
        return;
      }

      setStatus('Sending to server...');
      const transcriptResult = await ApiService.processTranscript(imageData);
      navigation.navigate('Result', { result: transcriptResult, token, user });

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process image');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleUseDemo = async () => {
    setLoading(true);
    setStatus('Loading demo data...');

    try {
      const result = await ApiService.processTranscript();
      navigation.navigate('Result', { result, token, user });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load demo');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <View>
            <Text style={styles.title}>NSU Audit</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings', { user, token })}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
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
              onPress={() => setShowSourcePicker(true)}
            >
              <Text style={styles.buttonText}>Capture Transcript</Text>
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
          style={styles.footerButton}
          onPress={() => navigation.navigate('Certificates', { user, token })}
        >
          <Text style={styles.footerButtonText}>Certificates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('History', { user, token })}
        >
          <Text style={styles.footerButtonText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await ApiService.clearSession();
            navigation.replace('Login');
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSourcePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Source</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleSelectImage('camera')}
            >
              <Text style={styles.modalOptionText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleSelectImage('gallery')}
            >
              <Text style={styles.modalOptionText}>🖼 Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowSourcePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#003366',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  settingsIcon: {
    color: '#fff',
    fontSize: 24,
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
  footerButton: {
    padding: 16,
    alignItems: 'center',
  },
  footerButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  modalCancel: {
    backgroundColor: '#fee2e2',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});