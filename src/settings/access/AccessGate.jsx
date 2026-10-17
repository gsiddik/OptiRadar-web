import { useGovernance } from '../../common/util/useGovernance';
import StateView from '../../common/components/StateView';
import ApiError from '../../common/util/ApiError';

const permission = 'optiradar.access.manage';

// The pages for users and roles exist only while OptiNexus governs access, and only for who holds the permission.
// This is a courtesy: the server refuses everything else again.
const AccessGate = ({ children }) => {
  const governance = useGovernance();

  if (governance.status === 'idle' || governance.status === 'loading') {
    return <StateView state="loading" />;
  }
  if (governance.status === 'error') {
    return <StateView state="error" error={governance.error} onRetry={governance.refresh} />;
  }
  if (!governance.governed || !governance.can(permission)) {
    return (
      <StateView
        state="error"
        error={
          new ApiError({ status: 403, code: 'governance_permission_denied', message: permission })
        }
      />
    );
  }
  return children;
};

export default AccessGate;
