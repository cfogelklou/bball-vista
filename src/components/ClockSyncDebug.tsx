import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useReceiverClock } from '../common/gameCore/ReceiverClockContext';
import deviceIdentifier from '../common/utils/deviceIdentifier';

/**
 * Debug component to display clock synchronization statistics
 * Useful for testing and monitoring clock sync performance
 */
export const ClockSyncDebug = () => {
  const { getSyncStats } = useReceiverClock();
  const stats = getSyncStats();
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('Loading...');

  // Get current device ID on mount
  React.useEffect(() => {
    deviceIdentifier.getDeviceId().then(setCurrentDeviceId);
  }, []);

  if (stats.sampleCount === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Clock Sync: No data</Text>
        <Text style={styles.deviceInfo}>Device: {currentDeviceId}</Text>
      </View>
    );
  }

  const deviceCount = Object.keys(stats.deviceStats).length;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setShowDeviceDetails(!showDeviceDetails)}
        style={styles.titleContainer}
      >
        <Text style={styles.title}>
          Clock Sync Stats {showDeviceDetails ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.deviceInfo}>This Device: {currentDeviceId}</Text>
      <Text style={styles.stat}>Samples: {stats.sampleCount}</Text>
      <Text style={styles.stat}>Devices: {deviceCount}</Text>
      <Text style={styles.stat}>Avg Diff: {Math.round(stats.averageDifference)}ms</Text>

      {stats.latestDeviceId && (
        <Text style={styles.stat}>
          Latest: {stats.latestDifference ? Math.round(stats.latestDifference) : 'N/A'}ms
          ({stats.latestDeviceId})
        </Text>
      )}

      <Text style={styles.stat}>Std Dev: {Math.round(stats.standardDeviation)}ms</Text>

      {showDeviceDetails && (
        <ScrollView style={styles.deviceList} nestedScrollEnabled>
          <Text style={styles.deviceTitle}>Per-Device Stats:</Text>
          {Object.entries(stats.deviceStats)
            .sort(([,a], [,b]) => b.lastSeen - a.lastSeen) // Sort by most recent
            .map(([deviceId, deviceStats]) => {
              const timeSinceLastSeen = Date.now() - deviceStats.lastSeen;
              const isRecent = timeSinceLastSeen < 30000; // Within 30 seconds

              return (
                <View key={deviceId} style={[styles.deviceStats, isRecent && styles.recentDevice]}>
                  <Text style={styles.deviceId}>{deviceId}</Text>
                  <Text style={styles.deviceStat}>
                    Samples: {deviceStats.sampleCount}
                  </Text>
                  <Text style={styles.deviceStat}>
                    Avg: {Math.round(deviceStats.averageDifference)}ms
                  </Text>
                  <Text style={styles.deviceStat}>
                    Latest: {Math.round(deviceStats.latestDifference)}ms
                  </Text>
                  <Text style={styles.deviceStat}>
                    Std: {Math.round(deviceStats.standardDeviation)}ms
                  </Text>
                  <Text style={styles.lastSeen}>
                    {timeSinceLastSeen < 5000 ? 'Active' :
                     timeSinceLastSeen < 60000 ? `${Math.round(timeSinceLastSeen/1000)}s ago` :
                     `${Math.round(timeSinceLastSeen/60000)}m ago`}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    minWidth: 160,
    maxWidth: 300,
    maxHeight: 400,
  },
  titleContainer: {
    marginBottom: 4,
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stat: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
  deviceInfo: {
    color: 'cyan',
    fontSize: 9,
    marginBottom: 3,
    fontWeight: 'bold',
  },
  deviceList: {
    marginTop: 8,
    maxHeight: 200,
  },
  deviceTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 2,
  },
  deviceStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 4,
    padding: 4,
    borderRadius: 2,
  },
  recentDevice: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  },
  deviceId: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  deviceStat: {
    color: 'white',
    fontSize: 8,
    marginBottom: 1,
  },
  lastSeen: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontStyle: 'italic',
  },
});