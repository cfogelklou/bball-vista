import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface ErrorMessage {
  id: string;
  message: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  source?: string;
}

export interface ErrorOverlayProps {
  errors: ErrorMessage[];
  visible: boolean;
  onDismiss?: () => void;
  maxErrors?: number;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  errors,
  visible,
  onDismiss,
  maxErrors = 10,
}) => {
  if (!visible || errors.length === 0) {
    return null;
  }

  // Show only the most recent errors
  const recentErrors = errors.slice(-maxErrors);

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLevelColor = (level: ErrorMessage['level']): string => {
    switch (level) {
      case 'error':
        return '#ff6b6b';
      case 'warn':
        return '#ffa500';
      case 'info':
        return '#74c0fc';
      case 'debug':
        return '#95a5a6';
      default:
        return '#ffffff';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>System Errors & Logs</Text>
          {onDismiss && (
            <Text 
              style={styles.dismissButton}
              onPress={onDismiss}
            >
              ✕
            </Text>
          )}
        </View>
        
        <ScrollView 
          style={styles.errorList}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          {recentErrors.map((error) => (
            <View key={error.id} style={styles.errorItem}>
              <View style={styles.errorHeader}>
                <Text style={[styles.errorLevel, { color: getLevelColor(error.level) }]}>
                  {error.level.toUpperCase()}
                </Text>
                <Text style={styles.errorTimestamp}>
                  {formatTimestamp(error.timestamp)}
                </Text>
                {error.source && (
                  <Text style={styles.errorSource}>
                    [{error.source}]
                  </Text>
                )}
              </View>
              <Text style={styles.errorMessage}>
                {error.message}
              </Text>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing {recentErrors.length} of {errors.length} messages
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: '90%',
    maxHeight: '80%',
    minWidth: 400,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dismissButton: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  errorList: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  errorItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  errorLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 50,
  },
  errorTimestamp: {
    color: '#cccccc',
    fontSize: 11,
    marginRight: 12,
  },
  errorSource: {
    color: '#aaaaaa',
    fontSize: 11,
    fontStyle: 'italic',
  },
  errorMessage: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  footerText: {
    color: '#aaaaaa',
    fontSize: 12,
  },
});