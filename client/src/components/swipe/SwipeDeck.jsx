import { useMemo, useState } from "react";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
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
}) {
  const [exitingSwipe, setExitingSwipe] = useState(null);

  const visibleItems = useMemo(() => {
    const nextItems = items.slice(currentIndex, currentIndex + 3);

    if (!exitingSwipe?.item) {
      return nextItems;
    }

    return [
      exitingSwipe.item,
      ...nextItems.filter((item) => item.id !== exitingSwipe.item.id)
    ];
  }, [currentIndex, exitingSwipe, items]);

  const activeTopItem = exitingSwipe?.item ?? items[currentIndex] ?? null;

  const beginSwipe = (direction, item) => {
    if (!item || exitingSwipe) {
      return;
    }

    onSwipe?.(direction, item);
    setExitingSwipe({ direction, item });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleDragEnd = (_, info, item) => {
    const offsetX = info.offset.x;

    if (offsetX > SWIPE_THRESHOLD) {
      beginSwipe("right", item);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      beginSwipe("left", item);
    }
  };

  const handleSwipeExitComplete = (item) => {
    if (exitingSwipe?.item?.id !== item.id) {
      return;
    }

    setExitingSwipe(null);
  };

  const handlePass = () => {
    beginSwipe("left", activeTopItem);
  };

  const handleLike = () => {
    beginSwipe("right", activeTopItem);
  };

  if (currentIndex >= items.length && !exitingSwipe) {
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
      <Box sx={{ position: "relative", width: "100%", height: 535 }}>
        {[...visibleItems].reverse().map((item) => {
          const stackPosition = visibleItems.findIndex((visibleItem) => visibleItem.id === item.id);
          const isExiting = exitingSwipe?.item?.id === item.id;
          const isTop = stackPosition === 0;

          return (
            <SwipeCardMotion
              key={item.id}
              item={item}
              isExiting={isExiting}
              isTop={isTop}
              onDragEnd={handleDragEnd}
              onExitComplete={handleSwipeExitComplete}
              swipeDirection={isExiting ? exitingSwipe.direction : null}
              swipeLocked={Boolean(exitingSwipe)}
              stackPosition={stackPosition}
            >
              {renderCard(item, isTop)}
            </SwipeCardMotion>
          );
        })}
      </Box>

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
            onClick={handlePass}
            disabled={!activeTopItem || Boolean(exitingSwipe)}
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
            onClick={handleLike}
            disabled={!activeTopItem || Boolean(exitingSwipe)}
            sx={{ color: "#152028", "&:hover": { backgroundColor: "#dcfce7" } }}
          >
            <FavoriteIcon />
          </IconButton>
        </Paper>
      </Stack>
    </Box>
  );
}
