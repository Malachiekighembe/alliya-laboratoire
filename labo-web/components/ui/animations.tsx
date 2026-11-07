"use client";

import { motion, type MotionProps } from "framer-motion";

export const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay },
});

export const slideUp = (delay = 0, distance = 20) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.1) => ({
  hidden: {},
  show: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerItem = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

export const scaleButton = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
};

export const scaleCard = {
  whileHover: { y: -4 },
  transition: { duration: 0.2 },
};

export type AnimationVariant = MotionProps["variants"];
