import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/Home';
import { ListsPage } from './pages/Lists';
import { AuthPage } from './pages/Auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/lists',
        element: <ListsPage />,
      },
      {
        path: '/auth',
        element: <AuthPage />,
      },
    ],
  },
]);
