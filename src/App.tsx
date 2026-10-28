import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * Root Application component.
 * Provides the theme context and router to the entire application.
 */
export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
