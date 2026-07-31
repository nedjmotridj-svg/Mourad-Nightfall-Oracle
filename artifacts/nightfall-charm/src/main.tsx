import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { routeTree } from './routeTree.gen';
import { initAudioPrefs } from './lib/audio';
import './styles.css';

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

initAudioPrefs();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
