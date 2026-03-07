import { useState } from "react";
import { Box, Typography } from "@mui/material";
import SwipeDeck from "../components/swipe/SwipeDeck";
import ProjectSwipeCard from "../components/swipe/ProjectSwipeCard";
import SwipeActionButtons from "../components/swipe/SwipeActionButtons";
import mockProjects from "../data/mockProjects";
import AppShell from "../components/layout/AppShell.jsx";
export default function ProjectsPage() {
  const [projects] = useState(mockProjects);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction, item) => {
    console.log("Swiped:", direction, item);
  };

  const handleOpenSummary = (project) => {
    console.log("Open summary for:", project);
  };

  const handlePass = () => {
    if (currentIndex < projects.length) {
      handleSwipe("left", projects[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleLike = () => {
    if (currentIndex < projects.length) {
      handleSwipe("right", projects[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <AppShell>
    <Box sx={{ p: 4 }}>

      <Typography variant="h4" align="center" sx={{ mb: 1 }}>
        Projects
      </Typography>
      <Typography align="center" color="text.secondary" sx={{ mb: 4 }}>
        Swipe through projects to find something to join.
      </Typography>
      <SwipeDeck
        items={projects}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        onSwipe={handleSwipe}
        renderCard={(project) => (
          <ProjectSwipeCard
            project={project}
            onOpenSummary={handleOpenSummary}
          />
        )}
      />

      <SwipeActionButtons onPass={handlePass} onLike={handleLike} />
    </Box>
    </AppShell>
  );
}