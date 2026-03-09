import client from './client';

const BASE_URL = '/superadmin/engineering';

export const listRequests = (params = {}) => client.get(BASE_URL, { params });
export const getRequest = (requestId) => client.get(`${BASE_URL}/${requestId}`);
export const getDrillData = (requestId) => client.get(`${BASE_URL}/${requestId}/drill-data`);
export const closeRequest = (requestId, { closed_reason, resolution_notes } = {}) =>
  client.patch(`${BASE_URL}/${requestId}/close`, { closed_reason, resolution_notes });
export const triggerInvestigation = (requestId, { additional_context } = {}) =>
  client.post(`${BASE_URL}/${requestId}/investigate`, additional_context ? { additional_context } : {});
export const generatePatch = (requestId) => client.post(`${BASE_URL}/${requestId}/generate-patch`);
export const testPatch = (requestId) => client.post(`${BASE_URL}/${requestId}/test-patch`);

export default { listRequests, getRequest, getDrillData, closeRequest, triggerInvestigation, generatePatch, testPatch };
