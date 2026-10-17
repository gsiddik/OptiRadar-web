import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { sessionActions } from '../../store';
import { onSessionEnded, rememberSessionEnded } from '../util/sessionEvents';

// Mounted in the signed-in shell. When a call is answered "not signed in" (the session expired, or the organization
// ended the person's access) the user is cleared; the shell then returns to the login page, which says why.
const SessionGuard = () => {
  const dispatch = useDispatch();

  useEffect(
    () =>
      onSessionEnded((error) => {
        rememberSessionEnded(error.accessRevoked ? error.code : 'expired');
        dispatch(sessionActions.updateUser(null));
      }),
    [dispatch],
  );

  return null;
};

export default SessionGuard;
