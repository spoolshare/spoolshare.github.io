import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RouteError } from '@/features/RouteError'

const ExplorePage = lazy(() => import('@/features/explore/ExplorePage'))
const SearchPage = lazy(() => import('@/features/search/SearchPage'))
const MatcherPage = lazy(() => import('@/features/matcher/MatcherPage'))
const MyFilamentsPage = lazy(() => import('@/features/filaments/MyFilamentsPage'))
const FilamentDetailPage = lazy(() => import('@/features/filaments/FilamentDetailPage'))
const RecipeDetailPage = lazy(() => import('@/features/recipe/RecipeDetailPage'))
const MakeModePage = lazy(() => import('@/features/recipe/MakeModePage'))
const ReproducePage = lazy(() => import('@/features/recipe/ReproducePage'))
const ComparePage = lazy(() => import('@/features/compare/ComparePage'))
const CreateRecipePage = lazy(() => import('@/features/create/CreateRecipePage'))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))
const SavedPage = lazy(() => import('@/features/saved/SavedPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'))
const SignInPage = lazy(() => import('@/features/auth/SignInPage'))
const SignUpPage = lazy(() => import('@/features/auth/SignUpPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const MembersPage = lazy(() => import('@/features/admin/MembersPage'))
const ReportsPage = lazy(() => import('@/features/admin/ReportsPage'))
const AboutPage = lazy(() => import('@/features/about/AboutPage'))
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'))

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <ExplorePage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'match', element: <MatcherPage /> },
        { path: 'filaments', element: <MyFilamentsPage /> },
        { path: 'filament/:id', element: <FilamentDetailPage /> },
        { path: 'r/:slug', element: <RecipeDetailPage /> },
        { path: 'r/:slug/make', element: <MakeModePage /> },
        { path: 'r/:slug/reproduce', element: <ReproducePage /> },
        { path: 'compare', element: <ComparePage /> },
        { path: 'create', element: <CreateRecipePage /> },
        { path: 'create/:draftId', element: <CreateRecipePage /> },
        { path: 'u/:username', element: <ProfilePage /> },
        { path: 'saved', element: <SavedPage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        { path: 'signin', element: <SignInPage /> },
        { path: 'signup', element: <SignUpPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'admin/members', element: <MembersPage /> },
        { path: 'admin/reports', element: <ReportsPage /> },
        { path: 'about', element: <AboutPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  // GitHub Pages serves the app from /<repo>/; Vite exposes that as BASE_URL.
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
