import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import fetchOrThrow from './fetchOrThrow';
import { useGovernance } from './useGovernance';
import webAddress from './webAddress';

// The other products the signed-in person may open, from OptiNexus through /api/governance/products (the server lists
// only what the organization subscribes to and the person was assigned, never the governance portal, each address with
// the tenant hint). Without central governance the list the identity provider returned at sign-in is used, as before.
// Nothing is listed while the answer is unknown or failed (fail closed); `load(true)` asks OptiNexus again.
export const useProducts = (open) => {
  const governance = useGovernance();
  const legacy = useSelector((state) => state.session.user?.attributes?.optinexusApps);

  const central = governance.ready && governance.governed && governance.kind === 'central';
  const [state, setState] = useState({ status: 'idle', products: [], error: null });

  const load = useCallback(async (fresh) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const response = await fetchOrThrow(`/api/governance/products${fresh ? '?fresh=true' : ''}`);
      const body = await response.json();
      const products = (Array.isArray(body.products) ? body.products : [])
        .filter((product) => !product.current && webAddress(product.url))
        .map((product) => ({ code: product.code, name: product.name, url: product.url }));
      setState({ status: 'ready', products, error: null });
      return products;
    } catch (error) {
      setState({ status: 'error', products: [], error });
      throw error;
    }
  }, []);

  // Every time the switcher is shown, OptiNexus is asked again (the server limits how often it really calls).
  useEffect(() => {
    if (open && central) {
      load(true).catch(() => {});
    }
  }, [open, central, load]);

  if (central) {
    return { available: true, central: true, ...state, load };
  }
  const list = (Array.isArray(legacy) ? legacy : [])
    .filter((app) => {
      const address = webAddress(app.url);
      return address && new URL(address).origin !== window.location.origin;
    })
    .map((app) => ({ code: app.url, name: app.name, url: app.url }));
  return {
    available: governance.ready && !governance.governed && list.length > 0,
    central: false,
    status: 'ready',
    products: list,
    error: null,
    load: async () => list,
  };
};
