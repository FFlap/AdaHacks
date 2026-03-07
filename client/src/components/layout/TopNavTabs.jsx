import { Paper, Tabs, Tab } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Projects", value: "/projects" },
  { label: "People", value: "/people" },
  { label: "Notifications", value: "/notifications" },
  { label: "Profile", value: "/profile" },
];

export default function TopNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab =
    navItems.find((item) => location.pathname.startsWith(item.value))?.value ||
    "/projects";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: "999px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        maxWidth: 700,
        mx: "auto",
      }}
    >
      <Tabs
        value={currentTab}
        onChange={(_, value) => navigate(value)}
        variant="fullWidth"
        TabIndicatorProps={{ style: { display: "none" } }}
        sx={{
          minHeight: 48,
        }}
      >
        {navItems.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            label={item.label}
            sx={{
              minHeight: 48,
              borderRadius: "999px",
              fontWeight: 600,
              color: "#374151",
              "&.Mui-selected": {
                backgroundColor: "#eef2ff",
                color: "#4338ca",
              },
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );
}