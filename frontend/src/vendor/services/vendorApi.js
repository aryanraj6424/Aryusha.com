import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/vendor`;

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem("vendorToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================
// AUTH API
// ============================================================

export const registerVendor = async (vendorData) => {
  const response = await axios.post(`${API}/auth/register`, vendorData);
  return response.data;
};

export const loginVendor = async (loginData) => {
  const response = await axios.post(`${API}/auth/login`, loginData);
  return response.data;
};

export const getVendorProfile = async () => {
  const response = await axios.get(`${API}/profile`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateVendorProfile = async (profileData) => {
  const response = await axios.put(`${API}/profile`, profileData, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// DASHBOARD API
// ============================================================

export const getDashboardStats = async () => {
  const response = await axios.get(`${API}/dashboard/stats`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getRecentOrders = async () => {
  const response = await axios.get(`${API}/dashboard/recent-orders`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getTopSellingProducts = async () => {
  const response = await axios.get(`${API}/dashboard/top-products`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// PRODUCT API
// ============================================================

export const getVendorProducts = async () => {
  const response = await axios.get(`${API}/product/all`, {
    headers: getAuthHeader()
  });
  return response.data.products;
};

export const getProductById = async (productId) => {
  const response = await axios.get(`${API}/product/${productId}`, {
    headers: getAuthHeader()
  });
  return response.data.product;
};

export const createVendorProduct = async (productData) => {
  const response = await axios.post(`${API}/product/create`, productData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateVendorProduct = async (productId, productData) => {
  const response = await axios.put(`${API}/product/update/${productId}`, productData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteVendorProduct = async (productId) => {
  const response = await axios.delete(`${API}/product/delete/${productId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

/* ============================================================
   LINKED MASTER PRODUCTS API
============================================================ */

export const searchMasterProducts = async (query = "") => {
  const response = await axios.get(`${API}/products/search`, {
    headers: getAuthHeader(),
    params: { query }
  });
  return response.data.products;
};

export const linkMasterProduct = async (data) => {
  const response = await axios.post(`${API}/products`, data, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getMyLinkedProducts = async () => {
  const response = await axios.get(`${API}/products/my-links`, {
    headers: getAuthHeader()
  });
  return response.data.linked;
};

export const updateLinkedProduct = async (linkId, data) => {
  const response = await axios.put(`${API}/products/link/${linkId}`, data, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const unlinkProduct = async (linkId) => {
  const response = await axios.delete(`${API}/products/link/${linkId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

/* ============================================================
   VARIANT API
============================================================ */

export const getVariants = async (productId) => {
  const res = await axios.get(`${API}/product/${productId}/variants`, {
    headers: getAuthHeader()
  });
  return res.data.variants;
};

export const createVariant = async (productId, data) => {
  const res = await axios.post(`${API}/product/${productId}/variants`, data, {
    headers: getAuthHeader()
  });
  return res.data.variant;
};

export const updateVariant = async (variantId, data) => {
  const res = await axios.put(`${API}/product/variant/${variantId}`, data, {
    headers: getAuthHeader()
  });
  return res.data.variant;
};

export const deleteVariant = async (variantId) => {
  const res = await axios.delete(`${API}/product/variant/${variantId}`, {
    headers: getAuthHeader()
  });
  return res.data;
};

/* ============================================================
   CATALOG CASCADE API
============================================================ */

export const getCategories = async () => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
  return res.data.categories;
};

export const getSubCategories = async (categoryId) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/sub-categories/category/${categoryId}`);
  return res.data.subCategories;
};

export const getProductFamilies = async (subCategoryId) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/product-families/sub-category/${subCategoryId}`);
  return res.data.productFamilies;
};


// ============================================================
// ORDER API
// ============================================================

export const getVendorOrders = async (filters = {}) => {
  const response = await axios.get(`${API}/orders`, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await axios.get(`${API}/orders/${orderId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const acceptOrder = async (orderId) => {
  const response = await axios.post(`${API}/orders/${orderId}/accept`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const rejectOrder = async (orderId, reason) => {
  const response = await axios.post(`${API}/orders/${orderId}/reject`, { reason }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.put(`${API}/orders/${orderId}/status`, { status }, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// INVENTORY API
// ============================================================

export const getInventory = async () => {
  const response = await axios.get(`${API}/inventory`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const addStock = async (productId, quantity) => {
  const response = await axios.post(`${API}/inventory/add`, { productId, quantity }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const removeStock = async (productId, quantity) => {
  const response = await axios.post(`${API}/inventory/remove`, { productId, quantity }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getStockHistory = async (productId) => {
  const response = await axios.get(`${API}/inventory/history/${productId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const bulkUpdateStock = async (stockUpdates) => {
  const response = await axios.post(`${API}/inventory/bulk-update`, { stockUpdates }, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// EARNINGS API
// ============================================================

export const getEarningsStats = async (period = "month") => {
  const response = await axios.get(`${API}/earnings/stats`, {
    headers: getAuthHeader(),
    params: { period }
  });
  return response.data;
};

export const getWalletBalance = async () => {
  const response = await axios.get(`${API}/earnings/wallet`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getTransactions = async (filters = {}) => {
  const response = await axios.get(`${API}/earnings/transactions`, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

export const requestWithdrawal = async (withdrawalData) => {
  const response = await axios.post(`${API}/earnings/withdraw`, withdrawalData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getCommissionReport = async (filters = {}) => {
  const response = await axios.get(`${API}/earnings/commission`, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

// ============================================================
// COUPON API
// ============================================================

export const getVendorCoupons = async () => {
  const response = await axios.get(`${API}/coupons`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createCoupon = async (couponData) => {
  const response = await axios.post(`${API}/coupons`, couponData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateCoupon = async (couponId, couponData) => {
  const response = await axios.put(`${API}/coupons/${couponId}`, couponData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteCoupon = async (couponId) => {
  const response = await axios.delete(`${API}/coupons/${couponId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// CUSTOMER API
// ============================================================

export const getVendorCustomers = async (filters = {}) => {
  const response = await axios.get(`${API}/customers`, {
    headers: getAuthHeader(),
    params: filters
  });
  return response.data;
};

export const getCustomerOrders = async (customerId) => {
  const response = await axios.get(`${API}/customers/${customerId}/orders`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// REPORTS API
// ============================================================

export const getSalesReport = async (period = "month") => {
  const response = await axios.get(`${API}/reports/sales`, {
    headers: getAuthHeader(),
    params: { period }
  });
  return response.data;
};

export const getProductReport = async (period = "month") => {
  const response = await axios.get(`${API}/reports/products`, {
    headers: getAuthHeader(),
    params: { period }
  });
  return response.data;
};

export const getAreaReport = async (period = "month") => {
  const response = await axios.get(`${API}/reports/areas`, {
    headers: getAuthHeader(),
    params: { period }
  });
  return response.data;
};

export const exportReport = async (reportType, format = "csv") => {
  const response = await axios.get(`${API}/reports/export`, {
    headers: getAuthHeader(),
    params: { reportType, format },
    responseType: 'blob'
  });
  return response.data;
};

// ============================================================
// SETTINGS API
// ============================================================

export const updateStoreTimings = async (timingsData) => {
  const response = await axios.put(`${API}/settings/timings`, timingsData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await axios.post(`${API}/settings/change-password`, passwordData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const uploadDocument = async (documentType, file) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', documentType);
  
  const response = await axios.post(`${API}/settings/documents`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await axios.get(`${API}/settings/documents`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============================================================
// SUPPORT API
// ============================================================

export const createSupportTicket = async (ticketData) => {
  const response = await axios.post(`${API}/support/tickets`, ticketData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getSupportTickets = async () => {
  const response = await axios.get(`${API}/support/tickets`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getTicketMessages = async (ticketId) => {
  const response = await axios.get(`${API}/support/tickets/${ticketId}/messages`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const sendTicketMessage = async (ticketId, message) => {
  const response = await axios.post(`${API}/support/tickets/${ticketId}/messages`, { message }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getNotifications = async () => {
  const response = await axios.get(`${API}/notifications`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await axios.put(`${API}/notifications/${notificationId}/read`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};