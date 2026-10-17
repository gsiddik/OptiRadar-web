import fetchOrThrow from '../../common/util/fetchOrThrow';

// Users and custom roles of the tenant live in OptiNexus; these calls go through OptiRadar's server, which forwards
// them with its own service account on behalf of the signed-in Admin Tenant. The answers are OptiNexus' documents.
const call = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await fetchOrThrow(`/api/access/${path}`, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return text ? JSON.parse(text) : { data: null };
};

export const loadCatalog = async (signal) => (await call('catalog', { signal })).data;

export const loadUsers = async (search, signal) => {
  const query = new URLSearchParams({ perPage: '100' });
  if (search) {
    query.set('search', search);
  }
  return (await call(`users?${query.toString()}`, { signal })).data;
};

export const addUser = async (user) => (await call('users', { method: 'POST', body: user })).data;

export const setUserRoles = async (userId, roleIds) =>
  (await call(`users/${userId}/roles`, { method: 'PUT', body: { role_ids: roleIds } })).data;

export const removeUser = async (userId) => call(`users/${userId}`, { method: 'DELETE' });

export const createRole = async (role) =>
  (await call('roles', { method: 'POST', body: role })).data;

export const updateRole = async (roleId, role) =>
  (await call(`roles/${roleId}`, { method: 'PUT', body: role })).data;

export const deleteRole = async (roleId) => call(`roles/${roleId}`, { method: 'DELETE' });
