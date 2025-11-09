import { apiClient } from "./api";
export async function login(payload) {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
}
export async function refresh(refresh_token) {
    const { data } = await apiClient.post("/auth/refresh", { refresh_token });
    return data;
}
export async function logout() {
    await apiClient.post("/auth/logout");
}
export async function changePassword(payload) {
    await apiClient.post("/auth/change-password", payload);
}
export async function getCurrentUser() {
    const { data } = await apiClient.get("/users/me");
    return data;
}
export async function listUsers(params) {
    const { data } = await apiClient.get("/users", { params });
    return data;
}
export async function createUser(payload) {
    const { data } = await apiClient.post("/users", payload);
    return data;
}
export async function updateUser(userId, payload) {
    const { data } = await apiClient.put(`/users/${userId}`, payload);
    return data;
}
export async function resetUserPassword(userId, payload) {
    const { data } = await apiClient.post(`/users/${userId}/reset-password`, payload);
    return data;
}
export async function deleteUser(userId) {
    await apiClient.delete(`/users/${userId}`);
}
export async function listParts(params) {
    const { data } = await apiClient.get("/warehouse/parts", { params });
    return data;
}
export async function getPart(partId) {
    const { data } = await apiClient.get(`/warehouse/parts/${partId}`);
    return data;
}
export async function createPart(payload) {
    const { data } = await apiClient.post("/warehouse/parts", payload);
    return data;
}
export async function updatePart(partId, payload) {
    const { data } = await apiClient.put(`/warehouse/parts/${partId}`, payload);
    return data;
}
export async function deletePart(partId) {
    await apiClient.delete(`/warehouse/parts/${partId}`);
}
export async function importParts(mapping, file) {
    const formData = new FormData();
    formData.append("upload", file);
    const { data } = await apiClient.post("/warehouse/parts/import", formData, {
        params: { mapping: JSON.stringify(mapping) },
        headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
}
export async function exportParts(params) {
    const { data } = await apiClient.get("/warehouse/parts/export", {
        params,
        responseType: "blob"
    });
    return data;
}
export async function listAuditLogs(partId) {
    const { data } = await apiClient.get(`/warehouse/parts/${partId}/audit`);
    return data;
}
export async function listEquipment() {
    const { data } = await apiClient.get("/maintenance/equipment");
    return data;
}
export async function createEquipment(payload) {
    const { data } = await apiClient.post("/maintenance/equipment", payload);
    return data;
}
export async function listPmTemplates() {
    const { data } = await apiClient.get("/maintenance/pm/templates");
    return data;
}
export async function createPmTemplate(payload) {
    const { data } = await apiClient.post("/maintenance/pm/templates", payload);
    return data;
}
export async function listPmPlans() {
    const { data } = await apiClient.get("/maintenance/pm/plans");
    return data;
}
export async function createPmPlan(payload) {
    const { data } = await apiClient.post("/maintenance/pm/plans", payload);
    return data;
}
export async function generateDueWorkOrders() {
    const { data } = await apiClient.post("/maintenance/pm/generate-due", {});
    return data;
}
export async function listWorkOrders() {
    const { data } = await apiClient.get("/maintenance/work-orders");
    return data;
}
export async function createWorkOrder(payload) {
    const { data } = await apiClient.post("/maintenance/work-orders", payload);
    return data;
}
export async function updateWorkOrder(workOrderId, payload) {
    const { data } = await apiClient.patch(`/maintenance/work-orders/${workOrderId}`, payload);
    return data;
}
export async function listMaintenanceHistory() {
    const { data } = await apiClient.get("/maintenance/history");
    return data;
}
export async function listTools() {
    const { data } = await apiClient.get("/tooling/tools");
    return data;
}
export async function createTool(payload) {
    const { data } = await apiClient.post("/tooling/tools", payload);
    return data;
}
export async function updateTool(toolId, payload) {
    const { data } = await apiClient.patch(`/tooling/tools/${toolId}`, payload);
    return data;
}
export async function deleteTool(toolId) {
    await apiClient.delete(`/tooling/tools/${toolId}`);
}
export async function getToolDimensions(toolId) {
    const { data } = await apiClient.get(`/tooling/tools/${toolId}/dims`);
    return data;
}
export async function listBatches() {
    const { data } = await apiClient.get("/tooling/batches");
    return data;
}
export async function createBatch(payload) {
    const { data } = await apiClient.post("/tooling/batches", payload);
    return data;
}
export async function updateBatch(batchId, payload) {
    const { data } = await apiClient.patch(`/tooling/batches/${batchId}`, payload);
    return data;
}
export async function runBatchOperation(batchId, payload) {
    const { data } = await apiClient.post(`/tooling/batches/${batchId}/operation`, payload);
    return data;
}
export async function getBatchReport(batchId) {
    const { data } = await apiClient.get(`/tooling/reports/batch/${batchId}`);
    return data;
}
