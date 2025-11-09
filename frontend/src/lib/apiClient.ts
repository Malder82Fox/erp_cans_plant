import { apiClient, type PaginatedResponse } from "./api";

export type UserRole = "user" | "admin" | "root";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  password_change_required: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  email?: string | null;
  role: UserRole;
  password: string;
  must_change_password: boolean;
}

export interface UserUpdateRequest {
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  must_change_password?: boolean;
}

export interface UserResetPasswordRequest {
  temporary_password: string;
  must_change_password: boolean;
}

export interface ListUsersParams {
  role?: UserRole;
  is_active?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface Part {
  id: number;
  part_code: string;
  name: string;
  description?: string | null;
  category_id?: number | null;
  location_id?: number | null;
  vendor_id?: number | null;
  qty_on_hand: string;
  min_stock: string;
  price: string;
  currency: string;
  is_deleted: boolean;
}

export interface PartPayload {
  part_code: string;
  name: string;
  description?: string | null;
  category_id?: number | null;
  location_id?: number | null;
  vendor_id?: number | null;
  qty_on_hand?: number;
  min_stock?: number;
  price?: number;
  currency?: string;
}

export interface PartUpdate extends Omit<PartPayload, "part_code"> {}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
}

export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  user_id: number | null;
  changes: string | null;
}

export interface ListPartsParams {
  q?: string;
  category_id?: number;
  location_id?: number;
  vendor_id?: number;
  low_stock?: boolean;
  sort_field?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export type EquipmentStatus = string | null;

export interface Equipment {
  id: number;
  name: string;
  line: string | null;
  area: string | null;
  status: EquipmentStatus;
}

export interface EquipmentPayload {
  name: string;
  line?: string | null;
  area?: string | null;
  status?: string | null;
}

export interface PMTemplate {
  id: number;
  name: string;
  description: string | null;
  frequency_days: number;
}

export interface PMTemplatePayload {
  name: string;
  description?: string | null;
  frequency_days: number;
}

export interface PMPlan {
  id: number;
  equipment_id: number;
  template_id: number;
  next_due_date: string;
}

export interface PMPlanPayload {
  equipment_id: number;
  template_id: number;
  next_due_date: string;
}

export type WorkOrderStatus = "Open" | "InProgress" | "Done" | "Canceled";
export type WorkOrderType = "PM" | "CM";

export interface WorkOrder {
  id: number;
  equipment_id: number;
  type: WorkOrderType;
  status: WorkOrderStatus;
  summary: string | null;
  downtime_min: string | null;
  due_date: string | null;
  plan_id: number | null;
  completed_at: string | null;
}

export interface WorkOrderPayload {
  equipment_id: number;
  type: WorkOrderType;
  status?: WorkOrderStatus;
  summary?: string | null;
  downtime_min?: number | null;
  due_date?: string | null;
  plan_id?: number | null;
}

export type WorkOrderUpdatePayload = Partial<WorkOrderPayload>;

export interface MaintenanceHistoryRecord {
  id: number;
  work_order_id: number;
  equipment_id: number;
  summary: string;
  downtime_min: string;
  recorded_at: string;
}

export interface GenerateDueResponse {
  created_work_orders: number;
}

export type BatchStatus = "Queued" | "Processed" | "Skipped";
export type OperationType = "inspection" | "cleaning" | "grinding";

export interface Tool {
  id: number;
  name: string;
  tool_type: string;
  bm_no: string | null;
  status: string;
}

export interface ToolPayload {
  name: string;
  tool_type: string;
  bm_no?: string | null;
  status?: string;
}

export type ToolUpdatePayload = Partial<ToolPayload>;

export interface ToolDimension {
  id: number;
  dim_name: string;
  value: string;
}

export interface ToolDimensionChange {
  id: number;
  dim_name: string;
  old_value: string;
  new_value: string;
  changed_at: string;
}

export interface ToolDimensionResponse {
  current: ToolDimension[];
  history: ToolDimensionChange[];
}

export interface BatchItem {
  id: number;
  tool_id: number;
  status: BatchStatus;
}

export interface Batch {
  id: number;
  name: string;
  status: BatchStatus;
  items: BatchItem[];
}

export interface BatchPayload {
  name: string;
  status?: BatchStatus;
  tool_ids?: number[];
}

export type BatchUpdatePayload = Partial<Omit<BatchPayload, "tool_ids">> & { tool_ids?: number[] };

export interface BatchOperationChange {
  dim_name: string;
  new_value: number;
}

export interface BatchOperationRequest {
  op_type: OperationType;
  apply_to_all: boolean;
  changes: Array<{ tool_id?: number; changes: BatchOperationChange[] }>;
}

export interface BatchOperationResult {
  processed: number;
  skipped: number;
}

export interface BatchReport {
  batch_id: number;
  html: string;
}

export async function login(payload: LoginRequest): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>("/auth/login", payload);
  return data;
}

export async function refresh(refresh_token: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>("/auth/refresh", { refresh_token });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.post("/auth/change-password", payload);
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>("/users", { params });
  return data;
}

export async function createUser(payload: UserCreateRequest): Promise<User> {
  const { data } = await apiClient.post<User>("/users", payload);
  return data;
}

export async function updateUser(userId: number, payload: UserUpdateRequest): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${userId}`, payload);
  return data;
}

export async function resetUserPassword(userId: number, payload: UserResetPasswordRequest): Promise<User> {
  const { data } = await apiClient.post<User>(`/users/${userId}/reset-password`, payload);
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}

export async function listParts(params: ListPartsParams): Promise<PaginatedResponse<Part>> {
  const { data } = await apiClient.get<PaginatedResponse<Part>>("/warehouse/parts", { params });
  return data;
}

export async function getPart(partId: number): Promise<Part> {
  const { data } = await apiClient.get<Part>(`/warehouse/parts/${partId}`);
  return data;
}

export async function createPart(payload: PartPayload): Promise<Part> {
  const { data } = await apiClient.post<Part>("/warehouse/parts", payload);
  return data;
}

export async function updatePart(partId: number, payload: PartUpdate): Promise<Part> {
  const { data } = await apiClient.put<Part>(`/warehouse/parts/${partId}`, payload);
  return data;
}

export async function deletePart(partId: number): Promise<void> {
  await apiClient.delete(`/warehouse/parts/${partId}`);
}

export async function importParts(mapping: Record<string, string>, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("upload", file);
  const { data } = await apiClient.post<ImportResult>("/warehouse/parts/import", formData, {
    params: { mapping: JSON.stringify(mapping) },
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function exportParts(params: ListPartsParams): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/warehouse/parts/export", {
    params,
    responseType: "blob"
  });
  return data;
}

export async function listAuditLogs(partId: number): Promise<AuditLogEntry[]> {
  const { data } = await apiClient.get<AuditLogEntry[]>(`/warehouse/parts/${partId}/audit`);
  return data;
}

export async function listEquipment(): Promise<Equipment[]> {
  const { data } = await apiClient.get<Equipment[]>("/maintenance/equipment");
  return data;
}

export async function createEquipment(payload: EquipmentPayload): Promise<Equipment> {
  const { data } = await apiClient.post<Equipment>("/maintenance/equipment", payload);
  return data;
}

export async function listPmTemplates(): Promise<PMTemplate[]> {
  const { data } = await apiClient.get<PMTemplate[]>("/maintenance/pm/templates");
  return data;
}

export async function createPmTemplate(payload: PMTemplatePayload): Promise<PMTemplate> {
  const { data } = await apiClient.post<PMTemplate>("/maintenance/pm/templates", payload);
  return data;
}

export async function listPmPlans(): Promise<PMPlan[]> {
  const { data } = await apiClient.get<PMPlan[]>("/maintenance/pm/plans");
  return data;
}

export async function createPmPlan(payload: PMPlanPayload): Promise<PMPlan> {
  const { data } = await apiClient.post<PMPlan>("/maintenance/pm/plans", payload);
  return data;
}

export async function generateDueWorkOrders(): Promise<GenerateDueResponse> {
  const { data } = await apiClient.post<GenerateDueResponse>("/maintenance/pm/generate-due", {});
  return data;
}

export async function listWorkOrders(): Promise<WorkOrder[]> {
  const { data } = await apiClient.get<WorkOrder[]>("/maintenance/work-orders");
  return data;
}

export async function createWorkOrder(payload: WorkOrderPayload): Promise<WorkOrder> {
  const { data } = await apiClient.post<WorkOrder>("/maintenance/work-orders", payload);
  return data;
}

export async function updateWorkOrder(workOrderId: number, payload: WorkOrderUpdatePayload): Promise<WorkOrder> {
  const { data } = await apiClient.patch<WorkOrder>(`/maintenance/work-orders/${workOrderId}`, payload);
  return data;
}

export async function listMaintenanceHistory(): Promise<MaintenanceHistoryRecord[]> {
  const { data } = await apiClient.get<MaintenanceHistoryRecord[]>("/maintenance/history");
  return data;
}

export async function listTools(): Promise<Tool[]> {
  const { data } = await apiClient.get<Tool[]>("/tooling/tools");
  return data;
}

export async function createTool(payload: ToolPayload): Promise<Tool> {
  const { data } = await apiClient.post<Tool>("/tooling/tools", payload);
  return data;
}

export async function updateTool(toolId: number, payload: ToolUpdatePayload): Promise<Tool> {
  const { data } = await apiClient.patch<Tool>(`/tooling/tools/${toolId}`, payload);
  return data;
}

export async function deleteTool(toolId: number): Promise<void> {
  await apiClient.delete(`/tooling/tools/${toolId}`);
}

export async function getToolDimensions(toolId: number): Promise<ToolDimensionResponse> {
  const { data } = await apiClient.get<ToolDimensionResponse>(`/tooling/tools/${toolId}/dims`);
  return data;
}

export async function listBatches(): Promise<Batch[]> {
  const { data } = await apiClient.get<Batch[]>("/tooling/batches");
  return data;
}

export async function createBatch(payload: BatchPayload): Promise<Batch> {
  const { data } = await apiClient.post<Batch>("/tooling/batches", payload);
  return data;
}

export async function updateBatch(batchId: number, payload: BatchUpdatePayload): Promise<Batch> {
  const { data } = await apiClient.patch<Batch>(`/tooling/batches/${batchId}`, payload);
  return data;
}

export async function runBatchOperation(batchId: number, payload: BatchOperationRequest): Promise<BatchOperationResult> {
  const { data } = await apiClient.post<BatchOperationResult>(`/tooling/batches/${batchId}/operation`, payload);
  return data;
}

export async function getBatchReport(batchId: number): Promise<BatchReport> {
  const { data } = await apiClient.get<BatchReport>(`/tooling/reports/batch/${batchId}`);
  return data;
}
