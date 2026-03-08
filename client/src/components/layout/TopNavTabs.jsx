import { useEffect, useEffectEvent, useState } from "react";
import { Badge, Paper, Tabs, Tab, Box, Tooltip } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { getMe } from "../../lib/api.js";
import { useAuth } from "../../context/useAuth.js";
import { useNotifications } from "../../context/useNotifications.js";

const navItems = [
  { label: "Projects", value: "/projects" },
  { label: "People", value: "/people" },
  { label: "Matches", value: "/notifications" },
  { label: "Chat", value: "/chat" },
  { label: "Hacks", value: "/hacks" },
  { label: "Profile", value: "/profile" },
];

const profileLockedTabs = new Set(["/projects", "/people", "/notifications", "/chat", "/hacks"]);
const lockedTabMessage = "Add your name, at least one Tech stack & frameworks entry, and at least one contact method in Profile to unlock this tab.";

function hasProfileAccessRequirements(profile) {
  const hasName = Boolean(profile?.fullName?.trim());
  const hasSkill = Array.isArray(profile?.skills) && profile.skills.length > 0;
  const hasContactMethod = Object.values(profile?.contactLinks ?? {}).some((value) => (
    typeof value === "string" && value.trim()
  ));

  return hasName && hasSkill && hasContactMethod;
}

export default function TopNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const [hasUnlockedTabs, setHasUnlockedTabs] = useState(null);

  const currentTab =
    navItems.find((item) => location.pathname.startsWith(item.value))?.value ||
    "/projects";

  const loadProfileState = useEffectEvent(async () => {
    if (!session?.access_token) {
      setHasUnlockedTabs(null);
      return;
    }

    try {
      const response = await getMe(session.access_token);
      setHasUnlockedTabs(hasProfileAccessRequirements(response.profile));
    } catch {
      setHasUnlockedTabs(null);
    }
  });

  useEffect(() => {
    loadProfileState();
  }, [session?.access_token]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleProfileUpdated = (event) => {
      setHasUnlockedTabs(hasProfileAccessRequirements(event.detail));
    };

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  function handleTabChange(_event, value) {
    if (profileLockedTabs.has(value) && hasUnlockedTabs === false) {
      return;
    }

    navigate(value);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: "999px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        maxWidth: 860,
        mx: "auto",
      }}
    >
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        TabIndicatorProps={{ style: { display: "none" } }}
        sx={{
          minHeight: 48,
        }}
      >
        {navItems.map((item) => {
          const isNotificationTab = item.value === "/notifications";
          const isLocked = profileLockedTabs.has(item.value) && hasUnlockedTabs === false;
          const tabLabel = isNotificationTab && unreadCount > 0 ? (
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
          );

          return (
            <Tab
              key={item.value}
              value={item.value}
              aria-disabled={isLocked ? "true" : undefined}
              label={
                <Tooltip
                  title={isLocked ? lockedTabMessage : ""}
                  placement="bottom"
                  arrow
                  disableFocusListener={!isLocked}
                  disableHoverListener={!isLocked}
                  disableTouchListener={!isLocked}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%"
                    }}
                  >
                    {tabLabel}
                  </Box>
                </Tooltip>
              }
              onClick={(event) => {
                if (isLocked) {
                  event.preventDefault();
                }
              }}
              sx={{
                minHeight: 48,
                borderRadius: "999px",
                fontWeight: 600,
                color: "#152028",
                opacity: isLocked ? 0.45 : 1,
                cursor: isLocked ? "not-allowed" : "pointer",
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
