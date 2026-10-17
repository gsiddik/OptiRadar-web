import { createSlice } from '@reduxjs/toolkit';

// What the server says the signed-in user may do (central governance). The screen only represents it: every route
// is enforced again on the server.
const { reducer, actions } = createSlice({
  name: 'governance',
  initialState: {
    status: 'idle',
    context: null,
    error: null,
  },
  reducers: {
    loading(state) {
      state.status = 'loading';
    },
    loaded(state, action) {
      state.status = 'ready';
      state.context = action.payload;
      state.error = null;
    },
    failed(state, action) {
      state.status = 'error';
      state.error = action.payload;
    },
    reset() {
      return { status: 'idle', context: null, error: null };
    },
  },
});

export { actions as governanceActions };
export { reducer as governanceReducer };
