import { motion, useMotionValue, useTransform } from "framer-motion";

export default function SwipeCardMotion({
  item,
  isTop,
  isExiting,
  onDragEnd,
  onExitComplete,
  swipeDirection,
  swipeLocked,
  stackPosition = 0,
  children,
}) {
  const x = useMotionValue(0);

  const backgroundColor = useTransform(
    x,
    [-180, 0, 180],
    ["#fee2e2", "#ffffff", "#dcfce7"]
  );

  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const exitOffset = swipeDirection === "right" ? 520 : -520;
  const canDrag = isTop && !isExiting && !swipeLocked;

  return (
    <motion.div
      drag={canDrag ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={canDrag ? (event, info) => onDragEnd(event, info, item) : undefined}
      onAnimationComplete={() => {
        if (isExiting) {
          onExitComplete?.(item);
        }
      }}
      style={{
        ...(isExiting ? {} : { x, rotate, backgroundColor }),
        position: "absolute",
        width: "100%",
        borderRadius: "24px",
        zIndex: 10 - stackPosition,
        cursor: canDrag ? "grab" : "default",
        touchAction: "none",
      }}
      initial={{ scale: 0.95, y: 12, opacity: 0 }}
      animate={{
        x: isExiting ? exitOffset : 0,
        rotate: isExiting ? (swipeDirection === "right" ? 14 : -14) : 0,
        scale: isExiting ? 1 : (isTop ? 1 : 0.96),
        y: isExiting ? 0 : (isTop ? 0 : 10),
        opacity: isExiting ? 0 : 1,
      }}
      transition={isExiting
        ? { duration: 0.24, ease: "easeOut" }
        : { type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
