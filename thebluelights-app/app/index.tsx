import { useCallback, useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// let DEFAULT_SERVER_IP = '100.106.94.95';
let DEFAULT_SERVER_IP = '100.72.251.34';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_SERVER_IP}:6200`).replace(/\/$/, '');

type StatePayload = {
  state: 'on' | 'off' | boolean;
};

type LightAction = {
  id: string;
  label: string;
  endpoint: string;
  payload: StatePayload;
  accent: string;
};

const LIGHT_ACTIONS: LightAction[] = [
  {
    id: 'all-on',
    label: 'All Lights On',
    endpoint: '/api/lights/apartment',
    payload: { state: 'on' },
    accent: '#f59e0b',
  },
  {
    id: 'all-off',
    label: 'All Lights Off',
    endpoint: '/api/lights/apartment',
    payload: { state: 'off' },
    accent: '#b45309',
  },
  {
    id: 'room-on',
    label: 'My Room On',
    endpoint: '/api/lights/room',
    payload: { state: 'on' },
    accent: '#f59e0b',
  },
  {
    id: 'room-off',
    label: 'My Room Off',
    endpoint: '/api/lights/room',
    payload: { state: 'off' },
    accent: '#b45309',
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
  const [pendingSlider, setPendingSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(50);

  const handlePress = useCallback(
    async (action: LightAction) => {
      if (pendingAction || pendingSlider) {
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

        {
          const desiredState = action.payload.state;
          if (desiredState === 'on' || desiredState === true) {
            setSliderValue(100);
          } else if (desiredState === 'off' || desiredState === false) {
            setSliderValue(0);
          }
        }

      } catch (error) {
        console.error('Failed to update lights', error);
      } finally {
        setPendingAction(null);
      }
    },
    [pendingAction, pendingSlider],
  );

  const handleSliderComplete = useCallback(
    async (value: number) => {
      const level = Math.round(value);

      setSliderValue(level);
      setPendingSlider(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/lights/room`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ level }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(formatErrorMessage(response.status, data));
        }
      } catch (error) {
        console.error('Failed to set room brightness', error);
      } finally {
        setPendingSlider(false);
      }
    },
    [],
  );


  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <ThemedText type="title" style={styles.header}>
          Apt 101 Light Controls
        </ThemedText>
        <View style={styles.grid}>
          {LIGHT_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handlePress(action)}
              disabled={pendingAction !== null || pendingSlider}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: action.accent,
                  shadowColor: action.accent,
                },
                (pendingAction && action.id !== pendingAction) || pendingSlider
                  ? styles.buttonInactive
                  : null,
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
                  <View style={styles.buttonSpinner} pointerEvents="none">
                    <ActivityIndicator color="#ffffff" />
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <ThemedView
          style={styles.sliderCard}
          lightColor="rgba(245, 158, 11, 0.12)"
          darkColor="rgba(245, 158, 11, 0.24)">
          <View style={styles.sliderHeaderRow}>
            <ThemedText type="subtitle" style={styles.sliderTitle}>
              Bedroom brightness
            </ThemedText>
            <View style={styles.sliderHeaderRight}>
              {pendingSlider ? <ActivityIndicator color="#f59e0b" /> : null}
              <View style={styles.sliderValueBadge}>
                <ThemedText
                  lightColor="#ffffff"
                  darkColor="#ffffff"
                  style={styles.sliderValueLabel}>
                  {sliderValue}%
                </ThemedText>
              </View>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={sliderValue}
            onValueChange={(value: number) => {
              setSliderValue(value);
            }}
            onSlidingComplete={handleSliderComplete}
            minimumTrackTintColor="#f59e0b"
            maximumTrackTintColor="rgba(245, 158, 11, 0.3)"
            thumbTintColor="#f59e0b"
            disabled={pendingSlider}
          />
        </ThemedView>
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
    marginBottom: 24,
  },
  sliderCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
    shadowColor: 'rgba(245, 158, 11, 0.4)',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderTitle: {
    fontSize: 20,
  },
  sliderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderValueBadge: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  sliderValueLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpinner: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
});
