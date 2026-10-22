import {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  LinearTransition,
  type WithSpringConfig,
} from 'react-native-reanimated';

// §1 motion tokens + §5 shared springs. Every animation in the app pulls its timing from here.
export const dur = { fast: 200, base: 300, slow: 500 } as const;

export const ease = Easing.bezier(0.25, 0.8, 0.25, 1);
export const easeFn = Easing.bezierFn(0.25, 0.8, 0.25, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeOutFn = Easing.bezierFn(0.16, 1, 0.3, 1);

export const spring: WithSpringConfig = { stiffness: 450, damping: 28, mass: 0.9 };
export const softSpring: WithSpringConfig = { stiffness: 300, damping: 24, mass: 1 };
export const pushSpring: WithSpringConfig = { stiffness: 350, damping: 30, mass: 1 };
export const switchSpring: WithSpringConfig = { stiffness: 550, damping: 28, mass: 0.8 };
export const bouncySpring: WithSpringConfig = { stiffness: 500, damping: 20, mass: 0.8 };

// Reduced motion collapses every movement to a 150 ms opacity fade.
export const reducedEnter = FadeIn.duration(dur.fast);
export const reducedExit = FadeOut.duration(dur.fast);

// Inset group rows: opacity 0 → 1, y 8 → 0, staggered 40 ms.
export const rowEntering = (index: number, reduced: boolean) =>
  reduced
    ? reducedEnter
    : new Keyframe({
        0: { opacity: 0, transform: [{ translateY: 8 }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: easeOutFn },
      })
        .duration(dur.base)
        .delay(Math.min(index, 12) * 40);

export const rowExiting = (reduced: boolean) => (reduced ? reducedExit : FadeOut.duration(200));

// Siblings reflow when a row collapses (spring 300 / 30).
export const rowLayout = LinearTransition.springify().stiffness(300).damping(30);

// Fade up used by empty/error states and hero blocks.
export const fadeUp = (delay: number, reduced: boolean, distance = 10) =>
  reduced
    ? reducedEnter
    : new Keyframe({
        0: { opacity: 0, transform: [{ translateY: distance }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: easeOutFn },
      })
        .duration(350)
        .delay(delay);

export const popIn = (from: number, duration: number, delay: number, reduced: boolean) =>
  reduced
    ? reducedEnter
    : new Keyframe({
        0: { opacity: 0, transform: [{ scale: from }] },
        100: { opacity: 1, transform: [{ scale: 1 }], easing: easeFn },
      })
        .duration(duration)
        .delay(delay);
