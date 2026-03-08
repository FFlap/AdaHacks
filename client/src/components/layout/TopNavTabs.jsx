import { Badge, Paper, Tabs, Tab, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/useNotifications.js";

const navItems = [
  { label: "Projects", value: "/projects" },
  { label: "People", value: "/people" },
  { label: "Matches", value: "/notifications" },
  { label: "Profile", value: "/profile" },
];

export default function TopNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

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
        {navItems.map((item) => {
          const isNotificationTab = item.value === "/notifications";
          return (
            <Tab
              key={item.value}
              value={item.value}
              label={
                isNotificationTab && unreadCount > 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.25, pr: 1 }}>
                    <span>{item.label}</span>
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.65rem",
                          height: 18,
                          minWidth: 18,
                          paddingRight: "3px",
                          paddingLeft: "3px"
                        }
                      }}
                    />
                  </Box>
                ) : (
                  item.label
                )
              }
              sx={{
                minHeight: 48,
                borderRadius: "999px",
                fontWeight: 600,
                color: "#152028",
                "&.Mui-selected": {
                  backgroundColor: "#d6e8f5",
                  color: "#152028",
                },
              }}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
}
