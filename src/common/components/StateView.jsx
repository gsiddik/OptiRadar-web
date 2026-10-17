import { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Button, CircularProgress, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import InboxIcon from '@mui/icons-material/Inbox';
import LockIcon from '@mui/icons-material/Lock';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useTranslation } from './LocalizationProvider';
import { describeError } from '../util/describeError';

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
  },
  icon: {
    fontSize: 48,
    color: theme.palette.text.secondary,
  },
  reference: {
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    userSelect: 'all',
  },
}));

const icons = {
  empty: InboxIcon,
  forbidden: LockIcon,
  unavailable: CloudOffIcon,
  offline: CloudOffIcon,
};

// One look for every state a data screen can be in: loading, empty, forbidden, unavailable, session ended, offline and
// unexpected error. Errors show a reference (the correlation id) to quote to support.
export const InlineError = ({ error, onRetry }) => {
  const t = useTranslation();
  const info = describeError(error, t);
  const [wait, setWait] = useState(info.retryAfter);

  useEffect(() => {
    setWait(info.retryAfter);
    if (!info.retryAfter) return undefined;
    const timer = setInterval(() => setWait((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [info.retryAfter, error]);

  return (
    <Alert
      severity={info.state === 'forbidden' ? 'warning' : 'error'}
      action={
        onRetry && info.state !== 'forbidden' ? (
          <Button color="inherit" size="small" disabled={wait > 0} onClick={onRetry}>
            {t('stateRetry')}
          </Button>
        ) : null
      }
    >
      <AlertTitle>{info.title}</AlertTitle>
      {info.detail}
      {info.reference && (
        <Typography variant="caption" component="div">
          {t('stateReference')}: <span>{info.reference}</span>
        </Typography>
      )}
    </Alert>
  );
};

const StateView = ({ state, error, onRetry, emptyText, emptyAction }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  if (state === 'loading') {
    return (
      <Box className={classes.root} role="status" aria-live="polite">
        <CircularProgress size={32} />
        <Typography color="textSecondary">{t('sharedLoading')}</Typography>
      </Box>
    );
  }
  if (state === 'empty') {
    const Icon = icons.empty;
    return (
      <Box className={classes.root}>
        <Icon className={classes.icon} />
        <Typography>{emptyText}</Typography>
        {emptyAction}
      </Box>
    );
  }
  const info = describeError(error, t);
  const Icon = icons[info.state] || icons.unavailable;
  return (
    <Box className={classes.root} role="alert">
      <Icon className={classes.icon} />
      <Typography variant="h6">{info.title}</Typography>
      <Typography color="textSecondary">{info.detail}</Typography>
      {info.reference && (
        <Typography variant="caption" color="textSecondary">
          {t('stateReference')}: <span className={classes.reference}>{info.reference}</span>
        </Typography>
      )}
      {onRetry && info.state !== 'forbidden' && (
        <Button variant="outlined" onClick={onRetry}>
          {t('stateRetry')}
        </Button>
      )}
    </Box>
  );
};

export default StateView;
