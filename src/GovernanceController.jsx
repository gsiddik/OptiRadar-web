import { useEffect } from 'react';
import { useGovernance, useGovernanceLoader } from './common/util/useGovernance';
import { isTenantId, openIdStartUrl, takeTenantHint } from './common/util/tenantHint';

// Keeps what OptiNexus granted the signed-in user fresh (see /api/governance/context). Draws nothing.
//
// Also settles a tenant hint left by another product's switcher: when the person is already signed in, the hint only
// matters if it names another tenant than the one this session belongs to. Then the single sign-on is started once
// for that tenant (a person who clicked "OptiRadar" in tenant B's switcher must not land in tenant A). Whatever the
// outcome, the hint is used up.
const GovernanceController = () => {
  useGovernanceLoader();
  const { status, governed, kind, tenantId } = useGovernance();

  useEffect(() => {
    if (status !== 'ready' && status !== 'error') {
      return;
    }
    const hint = takeTenantHint();
    if (
      hint &&
      status === 'ready' &&
      governed &&
      kind === 'central' &&
      isTenantId(hint) &&
      tenantId &&
      hint !== String(tenantId).toLowerCase()
    ) {
      window.location.assign(openIdStartUrl(hint));
    }
  }, [status, governed, kind, tenantId]);

  return null;
};

export default GovernanceController;
