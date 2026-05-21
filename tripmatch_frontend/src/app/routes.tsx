import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MyTripsPage from './pages/MyTripsPage';
import TripCreatorPage from './pages/TripCreatorPage';
import TripPlannerPage from './pages/TripPlannerPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';
import PublishRequestPage from './pages/PublishRequestPage';
import MarketplacePage from './pages/MarketplacePage';
import RequestsPage from './pages/RequestsPage';
import OfferCreationPage from './pages/OfferCreationPage';
import OffersInboxPage from './pages/OffersInboxPage';
import OfferDetailsPage from './pages/OfferDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useApp, type UserRole } from './context/AppContext';

function homePathByRole(role: UserRole) {
  return role === 'admin' ? '/app/admin' : '/app/dashboard';
}

function ProtectedLayout() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
}

function PublicAuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { isAuthenticated, user } = useApp();
  if (isAuthenticated) {
    return <Navigate to={homePathByRole(user.role)} replace />;
  }
  return <AuthPage mode={mode} />;
}

function RoleHomeRedirect() {
  const { user } = useApp();
  return <Navigate to={homePathByRole(user.role)} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <PublicAuthPage mode="login" />,
  },
  {
    path: '/register',
    element: <PublicAuthPage mode="register" />,
  },
  {
    path: '/app',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <RoleHomeRedirect />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'trips',
        element: <MyTripsPage />,
      },
      {
        path: 'trips/create',
        element: <TripCreatorPage />,
      },
      {
        path: 'trips/:id/planner',
        element: <TripPlannerPage />,
      },
      {
        path: 'trips/:id/budget',
        element: <BudgetPlannerPage />,
      },
      {
        path: 'trips/:id/publish',
        element: <PublishRequestPage />,
      },
      {
        path: 'requests',
        element: <RequestsPage />,
      },
      {
        path: 'marketplace',
        element: <MarketplacePage />,
      },
      {
        path: 'offers',
        element: <OffersInboxPage />,
      },
      {
        path: 'offers/create/:requestId',
        element: <OfferCreationPage />,
      },
      {
        path: 'offers/:id',
        element: <OfferDetailsPage />,
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
        path: 'admin',
        element: <AdminDashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
