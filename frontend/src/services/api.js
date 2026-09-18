import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject dynamic current role headers
apiClient.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem("flyyy_active_role") || "ADMIN";
  const currentUserId = localStorage.getItem("flyyy_active_userid") || `${currentRole.toLowerCase()}_agent`;

  config.headers["X-User-Role"] = currentRole;
  config.headers["X-User-Id"] = currentUserId;
  return config;
});

export const api = {
  // Overview Topology Stats
  getOverviewStats: () => apiClient.get("/overview/stats"),

  // Batch
  runBatch: (batchSize = 100, mode = "upsert") => apiClient.post("/batch/run", { batch_size: batchSize, mode }),
  getBatchStatus: (batchId) => apiClient.get(`/batch/${batchId}`),
  listBatches: (limit = 20) => apiClient.get(`/batch?limit=${limit}`),

  // Discovery
  discoverFields: (sampleSize = 50) => apiClient.post(`/discover?sample_size=${sampleSize}`),

  // Policies
  getPolicies: () => apiClient.get("/policies"),
  updatePolicies: (rules) => apiClient.put("/policies", { rules }),

  // Protection Testing
  testProtectValue: (value, fieldType, action) =>
    apiClient.post("/protect", { value, field_type: fieldType, action }),

  // Protected Customers
  listCustomers: (limit = 50, offset = 0, search = "") =>
    apiClient.get(`/customers?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`),
  getCustomer: (customerId) => apiClient.get(`/customers/${customerId}`),
  exportProtectedCsvUrl: () => `${API_BASE_URL}/customers/export/csv`,

  // Marketing Gateway
  sendMarketingEmail: (recipient, campaignId = "CMP-1001", templateId = "WELCOME_OFFER") =>
    apiClient.post("/actions/send-email", { recipient, campaign_id: campaignId, template_id: templateId }),

  // Bounce Webhook Callback
  sendBounceWebhook: (email, event = "BOUNCE", reason = "MAILBOX_NOT_FOUND") =>
    apiClient.post("/webhooks/email", { email, event, reason }),
  listBounces: () => apiClient.get("/bounces"),

  // Controlled Reveal
  controlledReveal: (subjectId, field, purpose, reference) =>
    apiClient.post("/reveal", {
      subject_id: subjectId,
      field,
      purpose,
      reference,
    }),

  // Audit
  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.actor) params.append("actor", filters.actor);
    if (filters.action) params.append("action", filters.action);
    if (filters.role) params.append("role", filters.role);
    if (filters.result) params.append("result", filters.result);
    params.append("limit", filters.limit || "100");
    return apiClient.get(`/audit?${params.toString()}`);
  },

  // Security Posture
  getSecurityPosture: () => apiClient.get("/security/posture"),

  // Mailbox
  getMailbox: () => apiClient.get("/mailbox"),

  // Source Data
  listSourceCustomers: (limit = 50) => apiClient.get(`/source/customers?limit=${limit}`),
  seedSourceData: () => apiClient.post("/source/seed"),
  uploadSourceCsv: (formData) =>
    apiClient.post("/source/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
