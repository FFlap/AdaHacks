import { useState } from 'react';

// Mock data for development
const MOCK_NOTIFICATIONS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: 'current-user-id',
    triggeredByUserId: '550e8400-e29b-41d4-a716-446655440010',
    notificationType: 'profile_liked',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    readAt: null
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: 'current-user-id',
    triggeredByUserId: '550e8400-e29b-41d4-a716-446655440011',
    notificationType: 'project_liked',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    readAt: null
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    userId: 'current-user-id',
    triggeredByUserId: '550e8400-e29b-41d4-a716-446655440012',
    notificationType: 'profile_liked',
    isRead: false,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    readAt: null
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    userId: 'current-user-id',
    triggeredByUserId: '550e8400-e29b-41d4-a716-446655440013',
    notificationType: 'project_liked',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    readAt: null
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    userId: 'current-user-id',
    triggeredByUserId: '550e8400-e29b-41d4-a716-446655440014',
    notificationType: 'profile_liked',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 1800000).toISOString()
  }
];

const MOCK_PROFILES = {
  '550e8400-e29b-41d4-a716-446655440010': {
    id: '550e8400-e29b-41d4-a716-446655440010',
    fullName: 'Alex Johnson',
    bio: 'Full-stack developer passionate about React and Node.js',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    projects: [
      {
        id: 'proj-1',
        name: 'Task Manager App',
        theme: 'Productivity',
        description: 'A collaborative task management application',
        techStack: ['React', 'Firebase']
      }
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/alexjohnson',
      instagram: 'https://instagram.com/alexjohnson',
      github: 'https://github.com/alexjohnson',
      twitter: 'https://twitter.com/alexjohnson'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  '550e8400-e29b-41d4-a716-446655440011': {
    id: '550e8400-e29b-41d4-a716-446655440011',
    fullName: 'Sarah Chen',
    bio: 'UI/UX Designer & Front-end developer',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    skills: ['Figma', 'React', 'CSS', 'Design Systems'],
    projects: [
      {
        id: 'proj-2',
        name: 'Social Media Dashboard',
        theme: 'Social',
        description: 'Track metrics across multiple social platforms',
        techStack: ['React', 'Chart.js', 'Tailwind']
      },
      {
        id: 'proj-3',
        name: 'Portfolio Website',
        theme: 'Personal',
        description: 'Showcase of design and development work',
        techStack: ['Next.js', 'Framer Motion']
      }
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      instagram: 'https://instagram.com/sarahchen',
      dribbble: 'https://dribbble.com/sarahchen'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  '550e8400-e29b-41d4-a716-446655440012': {
    id: '550e8400-e29b-41d4-a716-446655440012',
    fullName: 'Marcus Williams',
    bio: 'Backend engineer & DevOps enthusiast',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    skills: ['Python', 'Docker', 'AWS', 'Kubernetes', 'PostgreSQL'],
    projects: [
      {
        id: 'proj-4',
        name: 'API Gateway',
        theme: 'Backend',
        description: 'Scalable API management system',
        techStack: ['Python', 'FastAPI', 'PostgreSQL']
      }
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/marcuswilliams',
      github: 'https://github.com/marcuswilliams',
      twitter: 'https://twitter.com/marcuswilliams'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  '550e8400-e29b-41d4-a716-446655440013': {
    id: '550e8400-e29b-41d4-a716-446655440013',
    fullName: 'Emma Rodriguez',
    bio: 'Mobile app developer & startup enthusiast',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    skills: ['React Native', 'Swift', 'Firebase', 'Expo'],
    projects: [
      {
        id: 'proj-5',
        name: 'Fitness Tracker Pro',
        theme: 'Health',
        description: 'Cross-platform fitness tracking application',
        techStack: ['React Native', 'Firebase', 'Expo']
      }
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/emmarodriguez',
      instagram: 'https://instagram.com/emmarodriguez',
      github: 'https://github.com/emmarodriguez'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  '550e8400-e29b-41d4-a716-446655440014': {
    id: '550e8400-e29b-41d4-a716-446655440014',
    fullName: 'David Park',
    bio: 'Data scientist & ML engineer',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    skills: ['Python', 'TensorFlow', 'SQL', 'Data Analysis', 'Machine Learning'],
    projects: [
      {
        id: 'proj-6',
        name: 'Predictive Analytics Platform',
        theme: 'Data',
        description: 'Real-time data analysis and prediction platform',
        techStack: ['Python', 'TensorFlow', 'PostgreSQL', 'React']
      }
    ],
    socials: {
      linkedin: 'https://linkedin.com/in/davidpark',
      github: 'https://github.com/davidpark',
      twitter: 'https://twitter.com/davidpark',
      instagram: 'https://instagram.com/davidpark'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(
    MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNotificationResponse = (notificationId, accepted) => {
    if (accepted) {
      // Mark as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else {
      // Delete notification
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    handleNotificationResponse,
    notificationProfiles: MOCK_PROFILES,
    refresh: () => {}
  };
}
