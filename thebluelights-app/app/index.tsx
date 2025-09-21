import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://100.72.251.34:6200').replace(/\/$/, '');

type LightAction = {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  payload: Record<string, unknown>;
  accent: string;
  successMessage: string;
};

const LIGHT_ACTIONS: LightAction[] = [
  {
    id: 'all-on',
    label: 'All Lights On',
    description: 'Illuminate every room in the apartment.',
    endpoint: '/api/lights/apartment',
    payload: { state: 'on' },
    accent: '#22c55e',
    successMessage: 'All lights are turning on.',
  },
  {
    id: 'all-off',
    label: 'All Lights Off',
    description: 'Power down the whole apartment instantly.',
    endpoint: '/api/lights/apartment',
    payload: { state: 'off' },
    accent: '#ef4444',
    successMessage: 'All lights are turning off.',
  },
  {
    id: 'room-on',
    label: 'My Room On',
    description: "Light up Charlie's room for work or play.",
    endpoint: '/api/lights/room',
    payload: { state: 'on' },
    accent: '#f59e0b',
    successMessage: 'Your room lights are turning on.',
  },
  {
    id: 'room-off',
    label: 'My Room Off',
    description: 'Dim the room and wind things down.',
    endpoint: '/api/lights/room',
    payload: { state: 'off' },
    accent: '#6366f1',
    successMessage: 'Your room lights are turning off.',
  },
];

const formatErrorMessage = (status: number, body: unknown): string => {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }

  return `Request failed with status ${status}`;
};

export default function HomeScreen() {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handlePress = useCallback(
    async (action: LightAction) => {
      if (pendingAction) {
        return;
      }

      setPendingAction(action.id);
      try {
        const response = await fetch(`${API_BASE_URL}${action.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.payload),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(formatErrorMessage(response.status, data));
        }

        Alert.alert('Lights Updated', action.successMessage);
      } catch (error) {
        console.error('Failed to update lights', error);
        Alert.alert(
          'Unable to update lights',
          error instanceof Error ? error.message : 'Please try again in a moment.',
        );
      } finally {
        setPendingAction(null);
      }
    },
    [pendingAction],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <ThemedText type="title" style={styles.header}>
          Light Controls
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Tap a scene to set the perfect lighting in seconds.
        </ThemedText>

        <View style={styles.grid}>
          {LIGHT_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handlePress(action)}
              disabled={pendingAction !== null}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: action.accent,
                  shadowColor: action.accent,
                },
                pendingAction && action.id !== pendingAction ? styles.buttonInactive : null,
                pendingAction === action.id ? styles.buttonActive : null,
                pressed ? styles.buttonPressed : null,
              ]}>
              <View style={styles.buttonContent}>
                <ThemedText
                  type="subtitle"
                  lightColor="#ffffff"
                  darkColor="#ffffff"
                  style={styles.buttonLabel}>
                  {action.label}
                </ThemedText>

                {pendingAction === action.id ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" />
                    <ThemedText
                      lightColor="rgba(255,255,255,0.9)"
                      darkColor="rgba(255,255,255,0.9)"
                      style={styles.buttonDescription}>
                      Sending command…
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText
                    lightColor="rgba(255,255,255,0.9)"
                    darkColor="rgba(255,255,255,0.9)"
                    style={styles.buttonDescription}>
                    {action.description}
                  </ThemedText>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 28,
    opacity: 0.75,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    minHeight: 150,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonInactive: {
    opacity: 0.45,
  },
  buttonActive: {
    shadowOpacity: 0.5,
    elevation: 8,
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 16,
  },
  buttonLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  buttonDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
