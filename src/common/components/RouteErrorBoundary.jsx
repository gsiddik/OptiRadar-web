import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import ErrorScreen from './ErrorScreen';
import { useTranslation } from './LocalizationProvider';
import { classifyRuntimeError, reloadToLatest } from '../util/runtimeError';

// A failing page must not blank the shell around it (socket, session guard, bottom menu) and must not need the person to
// know what to do: it shows what happened and how to continue. Going to another route clears it.
const RouteErrorBoundary = ({ layout = 'route', home = true, children }) => {
  const t = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <ErrorBoundary
      resetKey={pathname}
      fallback={({ error, reference, reset }) => {
        const online = navigator.onLine !== false;
        const kind = classifyRuntimeError(error, online);
        return (
          <ErrorScreen
            kind={kind}
            layout={layout}
            reference={kind === 'error' ? reference : null}
            t={t}
            onRetry={kind === 'error' ? reset : undefined}
            onReload={() => reloadToLatest({ online })}
            onHome={home && pathname !== '/' ? () => navigate('/') : undefined}
          />
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
