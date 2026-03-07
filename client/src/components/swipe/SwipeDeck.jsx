import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

const SWIPE_THRESHOLD = 120;

export default function SwipeDeck({
  items = [],
  renderCard,
  onSwipe,
  currentIndex,
  setCurrentIndex,
}) {
  const activeItems = items.slice(currentIndex);

  const handleDragEnd = (_, info) => {
    const offsetX = info.offset.x;

    if (offsetX > SWIPE_THRESHOLD) {
      onSwipe?.("right", items[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      onSwipe?.("left", items[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (currentIndex >= items.length) {
    return (
      <Box
        sx={{
          mt: 4,
          p: 4,
          textAlign: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          backgroundColor: "#fff",
          maxWidth: 420,
          mx: "auto",
        }}
      >
        <Typography variant="h6">No more cards</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Try changing your filters or check back later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        height: 560,
        mx: "auto",
      }}
    >
      <AnimatePresence>
        {activeItems
          .slice(0, 3)
          .reverse()
          .map((item, index) => {
            const isTop = index === activeItems.slice(0, 3).length - 1;

            return (
              <motion.div
                key={item.id}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={isTop ? handleDragEnd : undefined}
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{
                  scale: isTop ? 1 : 0.96 - (activeItems.slice(0, 3).length - 2 - index) * 0.02,
                  y: isTop ? 0 : (activeItems.slice(0, 3).length - 1 - index) * 10,
                  opacity: 1,
                }}
                exit={{
                  x: 0,
                  opacity: 0,
                  transition: { duration: 0.2 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                  position: "absolute",
                  width: "100%",
                  cursor: isTop ? "grab" : "default",
                }}
              >
                {renderCard(item, isTop)}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </Box>
  );
}