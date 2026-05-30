import { useRef } from 'react';
import { Animated } from 'react-native';

export const useNavPressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 12,
      }),
    ]).start();
  };

  return { scale, bounce };
};
