import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { ExplorePage } from '@/pages/ExplorePage';
import { CommunitiesPage } from '@/pages/CommunitiesPage';
import { NetworkPage } from '@/pages/NetworkPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { EventsPage } from '@/pages/EventsPage';
import { NoticeBoardPage } from '@/pages/NoticeBoardPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Campus Connect application router.
 * Defines the shared RootLayout shell and child routes.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'communities',
        element: <CommunitiesPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'notice-board',
        element: <NoticeBoardPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'network',
        element: <NetworkPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
