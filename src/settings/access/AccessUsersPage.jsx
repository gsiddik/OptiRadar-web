import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PageLayout from '../../common/components/PageLayout';
import SettingsMenu from '../components/SettingsMenu';
import SearchHeader from '../components/SearchHeader';
import StateView, { InlineError } from '../../common/components/StateView';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useRemote from '../../common/util/useRemote';
import useSettingsStyles from '../common/useSettingsStyles';
import AccessGate from './AccessGate';
import RoleChecklist from './RoleChecklist';
import { addUser, loadCatalog, loadUsers, removeUser, setUserRoles } from './accessApi';

const useStyles = makeStyles()((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      bottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(2)})`,
    },
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(1),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  },
  secondary: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  notice: {
    margin: theme.spacing(0, 2, 2),
  },
}));

const AddUserDialog = ({ open, roles, onClose, onDone }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [roleIds, setRoleIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = { email: form.email.trim(), name: form.name.trim(), role_ids: roleIds };
      if (form.password) {
        body.initial_password = form.password;
      }
      const result = await addUser(body);
      setForm({ email: '', name: '', password: '' });
      setRoleIds([]);
      onDone(result);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const valid =
    form.email.includes('@') && form.name.trim() && (!form.password || form.password.length >= 12);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('accessAddUser')}</DialogTitle>
      <DialogContent>
        <div className={classes.fields}>
          {error && <InlineError error={error} />}
          <TextField
            label={t('userEmail')}
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <TextField
            label={t('sharedName')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            label={t('accessInitialPassword')}
            helperText={t('accessInitialPasswordHint')}
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={Boolean(form.password) && form.password.length < 12}
          />
          <Typography variant="subtitle2">{t('accessRoles')}</Typography>
          <RoleChecklist
            roles={roles}
            value={roleIds}
            onChange={setRoleIds}
            emptyText={t('accessNoAssignableRoles')}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t('sharedCancel')}
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy || !valid}>
          {t('sharedAdd')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RolesDialog = ({ user, roles, onClose, onDone }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const [roleIds, setRoleIds] = useState(user ? user.roles.map((role) => role.id) : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await setUserRoles(user.id, roleIds);
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(user)} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('accessEditRoles')}</DialogTitle>
      <DialogContent>
        <div className={classes.fields}>
          {user && (
            <Typography variant="subtitle2">
              {user.name} ({user.email})
            </Typography>
          )}
          {error && <InlineError error={error} />}
          <RoleChecklist
            roles={roles}
            value={roleIds}
            onChange={setRoleIds}
            emptyText={t('accessNoAssignableRoles')}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t('sharedCancel')}
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy}>
          {t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RemoveUserDialog = ({ user, onClose, onDone }) => {
  const t = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeUser(user.id);
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(user)} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('accessRemoveUser')}</DialogTitle>
      <DialogContent>
        {user && (
          <DialogContentText component="div">
            <Typography gutterBottom>
              <strong>{user.name}</strong> ({user.email})
            </Typography>
            {t('accessRemoveConfirm')}
          </DialogContentText>
        )}
        {error && <InlineError error={error} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t('sharedCancel')}
        </Button>
        <Button color="error" variant="contained" onClick={submit} disabled={busy}>
          {t('sharedRemove')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UsersTable = () => {
  const { classes } = useStyles();
  const { classes: settings } = useSettingsStyles();
  const t = useTranslation();

  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState(null);

  const { status, data, error, reload } = useRemote(
    async (signal) => {
      const [users, catalog] = await Promise.all([loadUsers(search, signal), loadCatalog(signal)]);
      return { users, roles: catalog.roles || [] };
    },
    [search],
  );

  const finished = (message) => {
    setAdding(false);
    setEditing(null);
    setRemoving(null);
    setNotice(message);
    reload();
  };

  const body = () => {
    if (status === 'error') {
      return <StateView state="error" error={error} onRetry={reload} />;
    }
    if (!data) {
      return <StateView state="loading" />;
    }
    if (!data.users.length) {
      return (
        <StateView state="empty" emptyText={search ? t('accessNoMatches') : t('accessNoUsers')} />
      );
    }
    return (
      <Table className={settings.table}>
        <TableHead>
          <TableRow>
            <TableCell>{t('sharedName')}</TableCell>
            <TableCell className={classes.secondary}>{t('userEmail')}</TableCell>
            <TableCell>{t('accessRoles')}</TableCell>
            <TableCell className={classes.secondary}>{t('accessStatus')}</TableCell>
            <TableCell className={settings.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.name}
                {user.is_tenant_admin && (
                  <Chip size="small" label={t('accessTenantAdmin')} sx={{ ml: 1 }} />
                )}
                <Typography variant="caption" color="textSecondary" component="div">
                  {user.email}
                </Typography>
              </TableCell>
              <TableCell className={classes.secondary}>{user.email}</TableCell>
              <TableCell>
                <div className={classes.chips}>
                  {user.roles.length ? (
                    user.roles.map((role) => <Chip key={role.id} size="small" label={role.name} />)
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      {t('accessNoRoles')}
                    </Typography>
                  )}
                </div>
              </TableCell>
              <TableCell className={classes.secondary}>
                {user.application_access || user.status}
              </TableCell>
              <TableCell className={settings.columnAction} padding="none">
                <Tooltip title={t('accessEditRoles')}>
                  <IconButton size="small" onClick={() => setEditing(user)}>
                    <ManageAccountsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('accessRemoveUser')}>
                  <IconButton size="small" onClick={() => setRemoving(user)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const roles = data ? data.roles : [];

  return (
    <>
      <SearchHeader keyword={search} setKeyword={setSearch} />
      {notice && (
        <Alert severity="success" className={classes.notice} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {body()}
      <div className={classes.fab}>
        <Fab
          size="medium"
          color="primary"
          onClick={() => setAdding(true)}
          aria-label={t('accessAddUser')}
        >
          <AddIcon />
        </Fab>
      </div>
      <AddUserDialog
        open={adding}
        roles={roles}
        onClose={() => setAdding(false)}
        onDone={(result) =>
          finished(
            result && result.outcome === 'created'
              ? t('accessOutcomeCreated')
              : t(
                  result && result.outcome === 'linked'
                    ? 'accessOutcomeLinked'
                    : 'accessOutcomeExisting',
                ),
          )
        }
      />
      <RolesDialog
        key={editing ? editing.id : 'none'}
        user={editing}
        roles={roles}
        onClose={() => setEditing(null)}
        onDone={() => finished(t('accessRolesSaved'))}
      />
      <RemoveUserDialog
        key={removing ? `remove-${removing.id}` : 'none'}
        user={removing}
        onClose={() => setRemoving(null)}
        onDone={() => finished(t('accessUserRemoved'))}
      />
    </>
  );
};

const AccessUsersPage = () => (
  <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'accessUsers']}>
    <AccessGate>
      <UsersTable />
    </AccessGate>
  </PageLayout>
);

export default AccessUsersPage;
