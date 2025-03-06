// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/Home';
import { ListsPage } from './pages/Lists';
import { AuthPage } from './pages/Auth';
import { List } from './pages/List';
import { Profile } from './pages/Profile';
import { Battle } from './pages/Battle';
import { NotFound } from './pages/NotFound';

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
        path: '/list',
        element: <ListsPage />,
      },
      {
        path: '/auth',
        element: <AuthPage />,
      },
      {
        path: '/list/:listId',
        element: <List />,
      },
      {
        path: '/list/:listId/battle',
        element: <Battle />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
