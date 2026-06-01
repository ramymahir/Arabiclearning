import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProfilePage } from '@/pages/ProfilePage'
import { HomePage } from '@/pages/HomePage'
import { LessonPage } from '@/pages/LessonPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProfilePage />,
  },
  {
    path: '/home',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/lesson/:id',
    element: <LessonPage />,
  },
])
