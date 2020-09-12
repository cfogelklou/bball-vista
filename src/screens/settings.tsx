import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  Text,
  TouchableOpacity,
  Button,
} from 'react-native';
import { Navigator } from '../abstractions/nav';
import { Themes } from '../themes/themes';
import { BballGameState, BballLogic } from '../bball_logic';
import deepEqual from 'deep-equal';

const nav = Navigator;

export type BballProps = {
  placeholder?: string;
};

type BballState = {
  longPressCount: number;
  shotClockPressedIn: number;
  gameState: BballGameState;
};

export const Settings = (props: any) => {
  const { navigation } = props;
  const dim = Dimensions.get('window');
  const [minutes, setMinutes] = useState(10);

  return (
    <View style={[styles.container, { width: dim.width, height: dim.height }]}>
      <View style={styles.field}>
        <Text style={styles.text}>Minutes per period:</Text>
        <Button
          title={'-1'}
          onPress={() => {
            setMinutes(Math.max(1, minutes - 1));
          }}
        ></Button>
        <TextInput
          style={styles.textEntry}
          defaultValue={minutes.toString()}
          value={minutes.toString()}
          onChangeText={(str: string) => {
            console.log('b4:', str);
            if (str.length === 0) {
              console.log('a:', 'nada');
              setMinutes(10);
            } else {
              const newMinutes = Number.parseFloat(str);
              let m = Math.max(0, newMinutes);
              m = m >= 0 && m <= 30 ? m : 10;
              setMinutes(m);
              console.log('a:', m);
            }
          }}
        ></TextInput>
        <Button
          title={'+1'}
          onPress={() => {
            setMinutes(Math.min(30, minutes + 1));
          }}
        ></Button>
        <View style={styles.flex8} />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const bb = BballLogic.getInst();
          if (minutes > 0) {
            bb.newGame(minutes);

            nav.navigate('bball');
          }
        }}
      >
        <View style={styles.flex8} />
        <Text style={styles.buttontext}>Go to game</Text>
        <View style={styles.flex8} />
      </TouchableOpacity>
    </View>
  );
};

const debugBorders = {
  borderWidth: 1,
  borderColor: 'red',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Themes.colors.almost_black,
  },
  field: {
    margin: 10,
    padding: 10,
    flexDirection: 'row',
  },
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: 'grey',
    flexDirection: 'row',
    borderRadius: 10,
  },
  text: {
    flex: 1,
    backgroundColor: Themes.colors.almost_black,
    margin: 10,

    color: 'white',
  },
  buttontext: {
    flex: 1,

    margin: 10,

    color: 'white',
  },
  textEntry: {
    flex: 1,
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
    backgroundColor: Themes.colors.almost_black,
    textAlign: 'center',

    margin: 10,
    color: 'white',
  },
  flex8: {
    flex: 6,
  },
});
