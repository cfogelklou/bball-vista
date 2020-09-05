import React from 'react';
import { View, Text } from 'react-native';

export type BballProps = {
  placeholder?: string;
};

export const Bball = (props: any | BballProps) => {
  return (
    <View>
      <Text>Bball Scoreboard</Text>
    </View>
  );
};
