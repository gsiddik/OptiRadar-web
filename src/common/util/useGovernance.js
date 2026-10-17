import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { governanceActions } from '../../store';
import fetchOrThrow from './fetchOrThrow';

const maxAgeMs = 300000;

// Loads /api/governance/context for the signed-in user and keeps it fresh (never older than the server's own
// lifetime for it, at most five minutes). Mount once, in the signed-in shell.
export const useGovernanceLoader = () => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.governance.status);
  const context = useSelector((state) => state.governance.context);

  const load = useCallback(async () => {
    dispatch(governanceActions.loading());
    try {
      const response = await fetchOrThrow('/api/governance/context');
      dispatch(governanceActions.loaded(await response.json()));
    } catch (error) {
      dispatch(governanceActions.failed(error));
    }
  }, [dispatch]);

  useEffect(() => {
    if (status === 'idle') {
      load();
    }
  }, [status, load]);

  useEffect(() => {
    if (!context || !context.governed) {
      return undefined;
    }
    const lifetime = context.ttlSeconds > 0 ? context.ttlSeconds * 1000 : maxAgeMs;
    const timer = setTimeout(load, Math.min(lifetime, maxAgeMs));
    return () => clearTimeout(timer);
  }, [context, load]);

  useEffect(() => () => dispatch(governanceActions.reset()), [dispatch]);
};

// { ready, governed, kind, tenantId, can(permission), refresh() }. While central governance is off the screens behave
// as before: `can` is true for everything and `governed` is false.
export const useGovernance = () => {
  const dispatch = useDispatch();
  const { status, context, error } = useSelector((state) => state.governance);

  const governed = Boolean(context && context.governed);
  const permissions = context && context.permissions ? context.permissions : [];
  const kind = context ? context.kind : null;

  return {
    status,
    error,
    ready: status === 'ready',
    governed,
    kind,
    tenantId: context ? context.tenantId : null,
    applicationEntitled: context ? context.applicationEntitled : true,
    expiresAt: context ? context.expiresAt : 0,
    can: (permission) =>
      status === 'ready'
        ? !governed || kind === 'operator' || permissions.includes(permission)
        : true,
    refresh: () => dispatch(governanceActions.reset()),
  };
};

// True only when central governance is on and the user holds the permission (for screens that exist only then).
export const useGovernedCan = (permission) => {
  const governance = useGovernance();
  return governance.ready && governance.governed && governance.can(permission);
};
