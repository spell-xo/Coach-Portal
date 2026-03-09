import client from './client';

const BASE_URL = '/superadmin/daw';

export const listDawUsers = (params = {}) => client.get(`${BASE_URL}/users`, { params });
export const grantDawAccess = (data) => client.post(`${BASE_URL}/grant`, data);
export const updateDawAccess = (userId, data) => client.put(`${BASE_URL}/users/${userId}`, data);
export const revokeDawAccess = (userId) => client.delete(`${BASE_URL}/users/${userId}`);
export const getDawUsageStats = () => client.get(`${BASE_URL}/usage`);
export const searchUsers = (search) => client.get('/superadmin/users', { params: { search, limit: 20 } });

export default { listDawUsers, grantDawAccess, updateDawAccess, revokeDawAccess, getDawUsageStats, searchUsers };
