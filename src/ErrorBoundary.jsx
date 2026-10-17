import { useCallback, useEffect, useState } from 'react';
import ErrorBoundary from './common/components/ErrorBoundary';
import ErrorScreen from './common/components/ErrorScreen';
import { loadTranslations, storedLanguage } from './common/components/LocalizationProvider';
import { classifyRuntimeError, reloadToLatest } from './common/util/runtimeError';
import en from './resources/l10n/en.json';

// Shown when the app itself cannot start or a failure got past every screen boundary. The localization may be the thing
// that failed, so the words are loaded here on their own (English when that fails too).
const GlobalFallback = ({ error, reference }) => {
  const [texts, setTexts] = useState(en);

  useEffect(() => {
    // the page loader of index.html must not stay on top of this screen
    const loader = document.querySelector('.loader');
    if (loader) loader.style.display = 'none';
    let active = true;
    loadTranslations(storedLanguage()).then((data) => {
      if (active) setTexts(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const t = useCallback((key) => texts[key] ?? en[key], [texts]);
  const online = navigator.onLine !== false;
  const kind = classifyRuntimeError(error, online);

  return (
    <ErrorScreen
      kind={kind}
      layout="page"
      reference={kind === 'error' ? reference : null}
      t={t}
      onReload={() => reloadToLatest({ online })}
      onHome={() => window.location.assign('/')}
    />
  );
};

const GlobalErrorBoundary = ({ children }) => (
  <ErrorBoundary fallback={(props) => <GlobalFallback {...props} />}>{children}</ErrorBoundary>
);

export default GlobalErrorBoundary;
