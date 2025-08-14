import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Home } from './pages/Home'
import { Lobby } from './pages/Lobby'
import { Game } from './pages/Game'
import { Results } from './pages/Results'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/lobby/:code',
    element: <Lobby />,
  },
  {
    path: '/game/:code',
    element: <Game />,
  },
  {
    path: '/results/:code',
    element: <Results />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}