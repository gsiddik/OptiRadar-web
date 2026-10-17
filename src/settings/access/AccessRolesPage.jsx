import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  FormControlLabel,
  FormGroup,
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
import EditIcon from '@mui/icons-material/Edit';
import PageLayout from '../../common/components/PageLayout';
import SettingsMenu from '../components/SettingsMenu';
import StateView, { InlineError } from '../../common/components/StateView';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useRemote from '../../common/util/useRemote';
import useSettingsStyles from '../common/useSettingsStyles';
import AccessGate from './AccessGate';
import { createRole, deleteRole, loadCatalog, updateRole } from './accessApi';

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
  group: {
    marginBottom: theme.spacing(1),
  },
  secondary: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  notice: {
    margin: theme.spacing(2),
  },
}));

const groupName = (capability) =>
  capability ? capability.replace(/^optiradar\./, '').replace(/\./g, ' / ') : '';

const RoleDialog = ({ open, role, permissions, onClose, onDone }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const [name, setName] = useState(role ? role.name : '');
  const [description, setDescription] = useState(role && role.description ? role.description : '');
  const [selected, setSelected] = useState(role ? role.permissions : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const groups = useMemo(() => {
    const result = new Map();
    permissions.forEach((permission) => {
      const key = permission.capability || '';
      result.set(key, [...(result.get(key) || []), permission]);
    });
    return [...result.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const toggle = (key) =>
    setSelected((value) =>
      value.includes(key) ? value.filter((item) => item !== key) : [...value, key],
    );

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        permissions: selected,
      };
      if (role) {
        await updateRole(role.id, body);
      } else {
        await createRole(body);
      }
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{role ? t('accessEditRole') : t('accessAddRole')}</DialogTitle>
      <DialogContent>
        <div className={classes.fields}>
          {error && <InlineError error={error} />}
          <TextField
            label={t('sharedName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            required
          />
          <TextField
            label={t('sharedDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            multiline
          />
          <Typography variant="subtitle2">{t('accessPermissions')}</Typography>
          {groups.length === 0 && (
            <Typography color="textSecondary">{t('accessCatalogEmpty')}</Typography>
          )}
          {groups.map(([capability, items]) => (
            <div key={capability} className={classes.group}>
              <Typography variant="caption" color="textSecondary">
                {groupName(capability)}
              </Typography>
              <FormGroup>
                {items.map((item) => (
                  <FormControlLabel
                    key={item.permission}
                    control={
                      <Checkbox
                        size="small"
                        checked={selected.includes(item.permission)}
                        onChange={() => toggle(item.permission)}
                      />
                    }
                    label={
                      <>
                        {item.name}
                        {item.description && (
                          <Typography variant="caption" color="textSecondary" component="div">
                            {item.description}
                          </Typography>
                        )}
                      </>
                    }
                  />
                ))}
              </FormGroup>
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t('sharedCancel')}
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={busy || !name.trim() || selected.length === 0}
        >
          {t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteRoleDialog = ({ role, onClose, onDone }) => {
  const t = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteRole(role.id);
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(role)} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('accessDeleteRole')}</DialogTitle>
      <DialogContent>
        {role && (
          <DialogContentText component="div">
            <Typography gutterBottom>
              <strong>{role.name}</strong>
            </Typography>
            {t('accessDeleteRoleConfirm')}
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

const RolesTable = () => {
  const { classes } = useStyles();
  const { classes: settings } = useSettingsStyles();
  const t = useTranslation();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState(null);

  const { status, data, error, reload } = useRemote((signal) => loadCatalog(signal), []);

  const finished = (message) => {
    setCreating(false);
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
    if (!data.roles || !data.roles.length) {
      return <StateView state="empty" emptyText={t('accessNoRolesDefined')} />;
    }
    return (
      <Table className={settings.table}>
        <TableHead>
          <TableRow>
            <TableCell>{t('sharedName')}</TableCell>
            <TableCell className={classes.secondary}>{t('sharedDescription')}</TableCell>
            <TableCell>{t('accessPermissions')}</TableCell>
            <TableCell className={settings.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {data.roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                {role.name}
                {role.template && (
                  <Chip size="small" label={t('accessRoleTemplate')} sx={{ ml: 1 }} />
                )}
              </TableCell>
              <TableCell className={classes.secondary}>{role.description}</TableCell>
              <TableCell>{role.permissions.length}</TableCell>
              <TableCell className={settings.columnAction} padding="none">
                {role.editable ? (
                  <>
                    <Tooltip title={t('sharedEdit')}>
                      <IconButton size="small" onClick={() => setEditing(role)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('sharedRemove')}>
                      <IconButton size="small" onClick={() => setRemoving(role)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const permissions = data ? data.delegable_permissions || [] : [];

  return (
    <>
      {notice && (
        <Alert severity="success" className={classes.notice} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      <Typography color="textSecondary" className={classes.notice}>
        {t('accessRolesIntro')}
      </Typography>
      {body()}
      <div className={classes.fab}>
        <Fab
          size="medium"
          color="primary"
          onClick={() => setCreating(true)}
          aria-label={t('accessAddRole')}
        >
          <AddIcon />
        </Fab>
      </div>
      {(creating || editing) && (
        <RoleDialog
          key={editing ? editing.id : 'new'}
          open
          role={editing}
          permissions={permissions}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onDone={() => finished(t('accessRoleSaved'))}
        />
      )}
      <DeleteRoleDialog
        key={removing ? `remove-${removing.id}` : 'none'}
        role={removing}
        onClose={() => setRemoving(null)}
        onDone={() => finished(t('accessRoleDeleted'))}
      />
    </>
  );
};

const AccessRolesPage = () => (
  <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'accessRoles']}>
    <AccessGate>
      <RolesTable />
    </AccessGate>
  </PageLayout>
);

export default AccessRolesPage;
