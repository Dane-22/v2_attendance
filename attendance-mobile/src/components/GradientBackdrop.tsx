import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export const GradientBackdrop = ({ children }: PropsWithChildren) => (
  <View style={styles.root}>
    <View style={styles.orbOne} />
    <View style={styles.orbTwo} />
    <View style={styles.orbThree} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  orbOne: {
    position: 'absolute',
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(78, 205, 196, 0.16)',
  },
  orbTwo: {
    position: 'absolute',
    top: 180,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 184, 108, 0.12)',
  },
  orbThree: {
    position: 'absolute',
    bottom: -40,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(87, 117, 255, 0.12)',
  },
});
