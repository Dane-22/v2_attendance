import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type GlassCardProps = PropsWithChildren<ViewProps>;

export const GlassCard = ({ children, style, ...rest }: GlassCardProps) => (
  <View {...rest} style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(10,18,30,0.72)',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
});
