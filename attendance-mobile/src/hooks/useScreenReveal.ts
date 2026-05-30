import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useScreenReveal = (itemCount = 0) => {
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslateY = useRef(new Animated.Value(20)).current;
  const itemAnimations = useMemo(
    () =>
      Array.from({ length: itemCount }, () => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(18),
      })),
    [itemCount]
  );

  useEffect(() => {
    const container = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const items = Animated.stagger(
      70,
      itemAnimations.map((item) =>
        Animated.parallel([
          Animated.timing(item.opacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(item.translateY, {
            toValue: 0,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.sequence([container, items]).start();

    return () => {
      containerOpacity.stopAnimation();
      containerTranslateY.stopAnimation();
      itemAnimations.forEach((item) => {
        item.opacity.stopAnimation();
        item.translateY.stopAnimation();
      });
    };
  }, [containerOpacity, containerTranslateY, itemAnimations]);

  return {
    containerStyle: {
      opacity: containerOpacity,
      transform: [{ translateY: containerTranslateY }],
    },
    itemStyle: (index: number) => ({
      opacity: itemAnimations[index]?.opacity ?? 1,
      transform: [{ translateY: itemAnimations[index]?.translateY ?? 0 }],
    }),
  };
};
