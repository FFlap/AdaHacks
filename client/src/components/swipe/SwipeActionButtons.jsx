import { IconButton, Paper, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function SwipeActionButtons({ onPass, onLike }) {
  return (
    <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 3 }}>
      <Paper
        elevation={0}
        sx={{ borderRadius: "50%", border: "1px solid #e5e7eb", p: 1 }}
      >
        <IconButton onClick={onPass}>
          <CloseIcon />
        </IconButton>
      </Paper>

      <Paper
        elevation={0}
        sx={{ borderRadius: "50%", border: "1px solid #e5e7eb", p: 1 }}
      >
        <IconButton onClick={onLike} color="primary">
          <FavoriteIcon />
        </IconButton>
      </Paper>
    </Stack>
  );
}