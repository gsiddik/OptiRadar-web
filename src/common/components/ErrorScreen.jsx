import { Box, Button, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CloudOffIcon from '@mui/icons-material/CloudOff';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(6, 2),
    maxWidth: 560,
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  page: {
    minHeight: '100vh',
    justifyContent: 'center',
  },
  compact: {
    padding: theme.spacing(2),
    flexGrow: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    color: theme.palette.text.secondary,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  reference: {
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    userSelect: 'all',
  },
}));

const icons = { error: ErrorOutlineIcon, stale: SystemUpdateAltIcon, offline: CloudOffIcon };

// The screen for a part of the app that failed: a bug (unexpected, with a reference to quote), an old version of the app
// that cannot load a part of itself (reload), or no connection. It takes its words as a function so it also works where
// the localization is not running. layout: "page" fills the window, "route" fills the content area, "compact" is a
// panel inside a screen that otherwise works.
const ErrorScreen = ({ kind, reference, t, onRetry, onReload, onHome, layout = 'route' }) => {
  const { classes, cx } = useStyles();
  const Icon = icons[kind] || icons.error;
  return (
    <Box
      className={cx(
        classes.root,
        layout === 'page' && classes.page,
        layout === 'compact' && classes.compact,
      )}
      role="alert"
      data-error-kind={kind}
    >
      <Icon className={classes.icon} />
      <Typography variant="h6">{t(`errorScreen_${kind}`)}</Typography>
      <Typography color="textSecondary">{t(`errorScreen_${kind}Detail`)}</Typography>
      {reference && (
        <Typography variant="caption" color="textSecondary">
          {t('stateReference')}: <span className={classes.reference}>{reference}</span>
        </Typography>
      )}
      <div className={classes.actions}>
        {kind === 'error' && onRetry && (
          <Button variant="contained" onClick={onRetry}>
            {t('stateRetry')}
          </Button>
        )}
        {onReload && (
          <Button
            variant={kind === 'error' && onRetry ? 'outlined' : 'contained'}
            onClick={onReload}
          >
            {t('errorScreenReload')}
          </Button>
        )}
        {onHome && (
          <Button variant="outlined" onClick={onHome}>
            {t('errorScreenHome')}
          </Button>
        )}
      </div>
    </Box>
  );
};

export default ErrorScreen;
