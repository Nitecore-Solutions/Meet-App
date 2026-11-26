import React, { useEffect, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

import { colors } from "../constants/theme";

const ABS_MIN = 18;
const ABS_MAX = 60;
const THUMB = 28;

export function AgeRangeSlider({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const valueRef = useRef({ min, max });
  const startRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const minStart = useRef(min);
  const maxStart = useRef(max);

  useEffect(() => {
    valueRef.current = { min, max };
    onChangeRef.current = onChange;
  }, [min, max, onChange]);

  const clamp = (value: number, lower: number, upper: number) =>
    Math.max(lower, Math.min(upper, value));

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = valueRef.current.min;
      },
      onPanResponderMove: (_event, gesture) => {
        if (widthRef.current <= 0) return;
        const delta = Math.round(
          (gesture.dx / widthRef.current) * (ABS_MAX - ABS_MIN)
        );
        const next = clamp(
          startRef.current + delta,
          ABS_MIN,
          valueRef.current.max - 1
        );
        if (next !== valueRef.current.min) {
          valueRef.current = { ...valueRef.current, min: next };
          onChangeRef.current(next, valueRef.current.max);
        }
      },
    })
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = valueRef.current.max;
      },
      onPanResponderMove: (_event, gesture) => {
        if (widthRef.current <= 0) return;
        const delta = Math.round(
          (gesture.dx / widthRef.current) * (ABS_MAX - ABS_MIN)
        );
        const next = clamp(
          startRef.current + delta,
          valueRef.current.min + 1,
          ABS_MAX
        );
        if (next !== valueRef.current.max) {
          valueRef.current = { ...valueRef.current, max: next };
          onChangeRef.current(valueRef.current.min, next);
        }
      },
    })
  ).current;

  // Keep hold of both values so either thumb can start from the right place.
  minStart.current = min;
  maxStart.current = max;

  const usable = Math.max(0, width - THUMB);
  const minRatio = (min - ABS_MIN) / (ABS_MAX - ABS_MIN);
  const maxRatio = (max - ABS_MIN) / (ABS_MAX - ABS_MIN);

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        widthRef.current = nextWidth;
        setWidth(nextWidth);
      }}
    >
      <View style={styles.track}>
        <View style={styles.trackRail} />
        <View
          style={[
            styles.trackFill,
            {
              left: minRatio * usable + THUMB / 2,
              width: Math.max(0, (maxRatio - minRatio) * usable),
            },
          ]}
        />
        {width > 0 ? (
          <>
            <View
              {...minPan.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel="Minimum age"
              accessibilityValue={{ min: ABS_MIN, max: ABS_MAX, now: min }}
              style={[
                styles.thumb,
                { left: minRatio * usable },
              ]}
            >
              <View style={styles.thumbDot} />
            </View>
            <View
              {...maxPan.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel="Maximum age"
              accessibilityValue={{ min: ABS_MIN, max: ABS_MAX, now: max }}
              style={[
                styles.thumb,
                { left: maxRatio * usable },
              ]}
            >
              <View style={styles.thumbDot} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    justifyContent: "center",
  },
  track: {
    height: 44,
    justifyContent: "center",
  },
  trackRail: {
    position: "absolute",
    left: THUMB / 2,
    right: THUMB / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  trackFill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#281B3C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  thumbDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
});
