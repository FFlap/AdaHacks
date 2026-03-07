import { Box, Typography } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import SwipeCardMotion from "./SwipeCardMotion";

const SWIPE_THRESHOLD = 120;

export default function SwipeDeck({
  items = [],
  renderCard,
  onSwipe,
  currentIndex,
  setCurrentIndex,
}) {
  const visibleItems = items.slice(currentIndex, currentIndex + 3);

  const handleDragEnd = (_, info, item) => {
    const offsetX = info.offset.x;

    if (offsetX > SWIPE_THRESHOLD) {
      onSwipe?.("right", item);
      setCurrentIndex((prev) => prev + 1);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      onSwipe?.("left", item);
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
        {[...visibleItems].reverse().map((item, reverseIndex) => {
          const isTop = reverseIndex === visibleItems.length - 1;

          return (
            <SwipeCardMotion
              key={item.id}
              item={item}
              isTop={isTop}
              onDragEnd={handleDragEnd}
            >
              {renderCard(item, isTop)}
            </SwipeCardMotion>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}