import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SwipeCardMotion from "./SwipeCardMotion";

const SWIPE_THRESHOLD = 120;

export default function SwipeDeck({
  items = [],
  renderCard,
  onSwipe,
  currentIndex,
  setCurrentIndex,
  onPass,
  onLike,
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
          border: "1px solid #d6e8f5",
          borderRadius: 4,
          backgroundColor: "#fff",
          maxWidth: 420,
          mx: "auto",
        }}
      >
        <Typography variant="h6">No more cards</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Check Back Later!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", width: "100%" }}>
      {/* Card stack — fixed height so buttons always sit below */}
      <Box sx={{ position: "relative", width: "100%", height: 535 }}>
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

      {/* Buttons — always in normal flow, below the card stack */}
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 3 }}
      >
        <Paper
          elevation={0}
          sx={{ borderRadius: "50%", border: "1px solid #d6e8f5", p: 0.75, backgroundColor: "#fff" }}
        >
          <IconButton
            aria-label="Pass"
            onClick={onPass}
            sx={{ color: "#152028", "&:hover": { backgroundColor: "#fee2e2" } }}
          >
            <CloseIcon />
          </IconButton>
        </Paper>

        <Paper
          elevation={0}
          sx={{ borderRadius: "50%", border: "1px solid #d6e8f5", p: 0.75, backgroundColor: "#fff" }}
        >
          <IconButton
            aria-label="Like"
            onClick={onLike}
            sx={{ color: "#152028", "&:hover": { backgroundColor: "#dcfce7" } }}
          >
            <FavoriteIcon />
          </IconButton>
        </Paper>
      </Stack>
    </Box>
  );
}