import { IconButton, Paper, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function SwipeActionButtons({ onPass, onLike }) {
  return (
    <Stack
      direction="row"
      spacing={3}
      justifyContent="center"
      alignItems="center"
      sx={{
        mt: 3,
        width: "100%",
        maxWidth: 420,
        mx: "auto",
      }}
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
  );
}