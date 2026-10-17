import { useGovernanceLoader } from './common/util/useGovernance';

// Keeps what OptiNexus granted the signed-in user fresh (see /api/governance/context). Draws nothing.
const GovernanceController = () => {
  useGovernanceLoader();
  return null;
};

export default GovernanceController;
