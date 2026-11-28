import { createBrowserRouter, Navigate } from 'react-router-dom';
import { authGuardLoader } from './routes';
import { AppLayout } from '../components/pages/AppLayout';
import { ArchivePage } from '../components/pages/ArchivePage';
import { CalendarPage } from '../components/pages/CalendarPage';
import { InboxPage } from '../components/pages/InboxPage';
import { LoginPage } from '../components/pages/LoginPage';
import { PipelinePage } from '../components/pages/PipelinePage';
import { TripDetailPage } from '../components/pages/TripDetailPage';

/**
 * The app's routes: the login page, and the signed-in pages under `/app`
 * (pipeline, inbox, calendar, archive and a trip's detail), which
 * `authGuardLoader` protects. `/` and `/app` both redirect to the pipeline.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/pipeline" replace />
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    loader: authGuardLoader,
    children: [
      {
        index: true,
        element: <Navigate to="pipeline" replace />
      },
      {
        path: 'pipeline',
        element: <PipelinePage />
      },
      {
        path: 'inbox',
        element: <InboxPage />
      },
      {
        path: 'calendar',
        element: <CalendarPage />
      },
      {
        path: 'archive',
        element: <ArchivePage />
      },
      {
        path: 'trip/:tripId',
        element: <TripDetailPage />
      }
    ]
  }
]);
