import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Back button that returns to the previous in-app page, or to `fallback` when the
// page was opened directly (fresh tab, reload of a deep link, shared URL) — where
// navigate(-1) would leave the app.
export default function useGoBack() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback((fallback = '/') => {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, location.key]);
}
