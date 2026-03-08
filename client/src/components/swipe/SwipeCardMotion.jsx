import { motion, useMotionValue, useTransform } from "framer-motion";

export default function SwipeCardMotion({
  item,
  isTop,
  onDragEnd,
  children,
}) {
  const x = useMotionValue(0);

  const backgroundColor = useTransform(
    x,
    [-180, 0, 180],
    ["#fee2e2", "#ffffff", "#dcfce7"]
  );

  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={isTop ? (event, info) => onDragEnd(event, info, item) : undefined}
      style={{
        x,
        rotate,
        backgroundColor,
        position: "absolute",
        width: "100%",
        borderRadius: "24px",
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
      }}
      initial={{ scale: 0.95, y: 12, opacity: 0 }}
      animate={{
        scale: isTop ? 1 : 0.96,
        y: isTop ? 0 : 10,
        opacity: 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}