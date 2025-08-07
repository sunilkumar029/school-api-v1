import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Define a generic ApiResponse type for consistency
type ApiResponse<T> = T;

// Define a generic ApiError type for consistency
interface ApiError {
  message: string;
  // Add other potential error fields here
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      timeout: 30000, // Increased timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token and base URL
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem("auth_token");
        let baseUrl = await AsyncStorage.getItem("base_url");

        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }

        // Fallback to demo server if no base URL is set
        if (!baseUrl) {
          baseUrl = "https://vai.dev.sms.visionariesai.com"; // Demo server fallback
        }

        if (baseUrl) {
          config.baseURL = baseUrl;
        }

        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error("API Error:", error.response?.data || error.message);

        // Handle authentication errors
        if (error.response?.status === 401) {
          // Clear stored auth data
          await AsyncStorage.multiRemove(["auth_token", "user_data"]);
          // The app will handle redirecting to login through AuthContext
        }

        return Promise.reject(error);
      },
    );
  }

  // Academic Years
  async getAcademicYears(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/academic-years/", { params });
    return response.data;
  }

  async createAcademicYear(data: any): Promise<any> {
    const response = await this.api.post("/api/academic-years/", data);
    return response.data;
  }

  async getAcademicYear(id: number): Promise<any> {
    const response = await this.api.get(`/api/academic-years/${id}/`);
    return response.data;
  }

  async updateAcademicYear(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/academic-years/${id}/`, data);
    return response.data;
  }

  async deleteAcademicYear(id: number): Promise<void> {
    await this.api.delete(`/api/academic-years/${id}/`);
  }

  // Announcements
  async getAnnouncements(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/announcements/", { params });
    return response.data;
  }

  async createAnnouncement(data: any): Promise<any> {
    const response = await this.api.post("/api/announcements/", data);
    return response.data;
  }

  async getAnnouncement(id: number): Promise<any> {
    const response = await this.api.get(`/api/announcements/${id}/`);
    return response.data;
  }

  async updateAnnouncement(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/announcements/${id}/`, data);
    return response.data;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await this.api.delete(`/api/announcements/${id}/`);
  }

  // Attendance
  async getAttendance(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/attendance/", { params });
    return response.data;
  }

  async createAttendance(data: any): Promise<any> {
    const response = await this.api.post("/api/attendance/", data);
    return response.data;
  }

  async getAttendanceReport(): Promise<any> {
    const response = await this.api.get(
      "/api/attendance/attendance-report-student/",
    );
    return response.data;
  }

  async getAttendanceDashboard(): Promise<any> {
    const response = await this.api.get("/api/attendance-dashboard/dashboard/");
    return response.data;
  }

  async getUserAttendanceDashboard(userId: string): Promise<any> {
    const response = await this.api.get(
      `/api/attendance-dashboard/${userId}/user-dashboard/`,
    );
    return response.data;
  }

  // Events
  async getEvents(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/events/", { params });
    return response.data;
  }

  async createEvent(data: any): Promise<any> {
    const response = await this.api.post("/api/events/", data);
    return response.data;
  }

  async getEvent(id: number): Promise<any> {
    const response = await this.api.get(`/api/events/${id}/`);
    return response.data;
  }

  async updateEvent(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/events/${id}/`, data);
    return response.data;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.api.delete(`/api/events/${id}/`);
  }

  // Branches
  async getBranches(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/branches/", { params });
    return response.data;
  }

  async createBranch(data: any): Promise<any> {
    const response = await this.api.post("/api/branches/", data);
    return response.data;
  }

  async getBranch(id: number): Promise<any> {
    const response = await this.api.get(`/api/branches/${id}/`);
    return response.data;
  }

  // Departments
  async getDepartments(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/departments/", { params });
    return response.data;
  }

  async createDepartment(data: any): Promise<any> {
    const response = await this.api.post("/api/departments/", data);
    return response.data;
  }

  async getDepartment(id: number): Promise<any> {
    const response = await this.api.get(`/api/departments/${id}/`);
    return response.data;
  }

  // Chat
  async getChatMessages(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/chat/", { params });
    return response.data;
  }

  async sendChatMessage(data: any): Promise<any> {
    const response = await this.api.post("/api/chat/", data);
    return response.data;
  }

  async getAllReceivedChats(): Promise<any> {
    const response = await this.api.get("/api/chat/all-received-chats/");
    return response.data;
  }

  async getChatWith(): Promise<any> {
    const response = await this.api.get("/api/chat/chat_with/");
    return response.data;
  }

  async markAsRead(data: any): Promise<any> {
    const response = await this.api.post("/api/chat/mark_as_read/", data);
    return response.data;
  }

  async isUserOnline(userId: number): Promise<any> {
    const response = await this.api.get(`/api/chat/is_user_online/${userId}/`);
    return response.data;
  }

  // Documents
  async getDocuments(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/documents/", { params });
    return response.data;
  }

  async createDocument(data: any): Promise<any> {
    const response = await this.api.post("/api/documents/", data);
    return response.data;
  }

  async getDocument(id: number): Promise<any> {
    const response = await this.api.get(`/api/documents/${id}/`);
    return response.data;
  }

  // Amenities
  async getAmenities(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/amenities/", { params });
    return response.data;
  }

  async createAmenity(data: any): Promise<any> {
    const response = await this.api.post("/api/amenities/", data);
    return response.data;
  }

  async getAmenitiesTypes(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/amenities-types/", { params });
    return response.data;
  }

  // Annual Leave Quotas
  async getAnnualLeaveQuotas(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/annual-leave-quotas/", {
      params,
    });
    return response.data;
  }

  async createAnnualLeaveQuota(data: any): Promise<any> {
    const response = await this.api.post("/api/annual-leave-quotas/", data);
    return response.data;
  }

  // Biometric
  async getBiometricData(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/biometric/", { params });
    return response.data;
  }

  async uploadBiometricData(data: any): Promise<any> {
    const response = await this.api.post(
      "/api/biometric/upload-biometric-data/",
      data,
    );
    return response.data;
  }

  async updateBiometricData(data: any): Promise<any> {
    const response = await this.api.patch(
      "/api/biometric/update-biometric-data/",
      data,
    );
    return response.data;
  }

  async deleteBiometricData(data: any): Promise<any> {
    const response = await this.api.post(
      "/api/biometric/delete-biometric-data/",
      data,
    );
    return response.data;
  }

  // Devices
  async getDevices(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/devices/", { params });
    return response.data;
  }

  async getAllDevices(): Promise<any> {
    const response = await this.api.get("/api/devices/all-devices/");
    return response.data;
  }

  async getDeviceReadings(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/device-readings/", { params });
    return response.data;
  }

  async getLiveDeviceReadings(): Promise<any> {
    const response = await this.api.get(
      "/api/device-readings/live-device-readings/",
    );
    return response.data;
  }

  async getAllDeviceReadings(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/all-device-readings/", {
      params,
    });
    return response.data;
  }

  // EMS (Energy Management System)
  async getEmsRooms(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/ems-rooms/", { params });
    return response.data;
  }

  async getRoomData(): Promise<any> {
    const response = await this.api.get("/api/ems-rooms/get-room-data/");
    return response.data;
  }

  async getEmsSchedules(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/ems-schedules/", { params });
    return response.data;
  }

  async createEmsSchedule(data: any): Promise<any> {
    const response = await this.api.post("/api/ems-schedules/", data);
    return response.data;
  }

  async controlNow(data: any): Promise<any> {
    const response = await this.api.post(
      "/api/ems-schedules/control-now/",
      data,
    );
    return response.data;
  }

  // Bulk Operations
  async bulkCreateAttendance(data: any): Promise<any> {
    const response = await this.api.post(
      "/api/bulk-attendance/bulk-create/",
      data,
    );
    return response.data;
  }

  // Availability
  async getAvailablePeriods(): Promise<any> {
    const response = await this.api.get("/api/availability/available-periods/");
    return response.data;
  }

  async getAvailableTeachers(): Promise<any> {
    const response = await this.api.get(
      "/api/availability/available-teachers/",
    );
    return response.data;
  }

  // Designations
  async getDesignations(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/designations/", { params });
    return response.data;
  }

  async createDesignation(data: any): Promise<any> {
    const response = await this.api.post("/api/designations/", data);
    return response.data;
  }

  // Device Registry & Thresholds
  async getDeviceRegistry(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/device-registry/", { params });
    return response.data;
  }

  async getDeviceThresholds(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/device-thresholds/", { params });
    return response.data;
  }

  async checkAlerts(): Promise<any> {
    const response = await this.api.get("/api/device-thresholds/check-alerts/");
    return response.data;
  }

  // Domains
  async getDomains(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/domains/", { params });
    return response.data;
  }

  // Answers (for exams/quizzes)
  async getAnswers(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/answers/", { params });
    return response.data;
  }

  async createAnswer(data: any): Promise<any> {
    const response = await this.api.post("/api/answers/", data);
    return response.data;
  }

  // Users
  async getUsers(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/users/", { params });
    return response.data;
  }

  async createUser(data: any): Promise<any> {
    const response = await this.api.post("/api/users/", data);
    return response.data;
  }

  async getUser(id: number): Promise<any> {
    const response = await this.api.get(`/api/users/${id}/`);
    return response.data;
  }

  async updateUser(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/users/${id}/`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/api/users/${id}/`);
  }

  // Groups
  async getGroups(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/groups/", { params });
    return response.data;
  }

  async createGroup(data: any): Promise<any> {
    const response = await this.api.post("/api/groups/", data);
    return response.data;
  }

  async getGroup(id: number): Promise<any> {
    const response = await this.api.get(`/api/groups/${id}/`);
    return response.data;
  }

  // Timetable/Period Management
  async getPeriods(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/period/", { params });
    return response.data;
  }

  async getTeacherTimetable(params?: any): Promise<any> {
    const response = await this.api.get("/api/period/teacher-timetable/", { params });
    return response.data;
  }

  async getSections(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/sections/", { params });
    return response.data;
  }

  async getAllUsers(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/users/get-all-users/", { params });
    return response.data;
  }

  // Fee Management
  async getFees(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/fees/", { params });
    return response.data;
  }

  async createFee(data: any): Promise<any> {
    const response = await this.api.post("/api/fees/", data);
    return response.data;
  }

  async getFee(id: number): Promise<any> {
    const response = await this.api.get(`/api/fees/${id}/`);
    return response.data;
  }

  async updateFee(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/fees/${id}/`, data);
    return response.data;
  }

  async deleteFee(id: number): Promise<void> {
    await this.api.delete(`/api/fees/${id}/`);
  }

  // Fee Types
  async getFeeTypes(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/fee-types/", { params });
    return response.data;
  }

  async createFeeType(data: any): Promise<any> {
    const response = await this.api.post("/api/fee-types/", data);
    return response.data;
  }

  async getFeeType(id: number): Promise<any> {
    const response = await this.api.get(`/api/fee-types/${id}/`);
    return response.data;
  }

  async updateFeeType(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/fee-types/${id}/`, data);
    return response.data;
  }

  async deleteFeeType(id: number): Promise<void> {
    await this.api.delete(`/api/fee-types/${id}/`);
  }

  // Standards
  async getStandards(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/standards/", { params });
    return response.data;
  }

  async createStandard(data: any): Promise<any> {
    const response = await this.api.post("/api/standards/", data);
    return response.data;
  }

  async getStandard(id: number): Promise<any> {
    const response = await this.api.get(`/api/standards/${id}/`);
    return response.data;
  }

  async updateStandard(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/standards/${id}/`, data);
    return response.data;
  }

  async deleteStandard(id: number): Promise<void> {
    await this.api.delete(`/api/standards/${id}/`);
  }

  // Timetable Period Management
  async createPeriod(data: any): Promise<any> {
    const response = await this.api.post("/api/period/", data);
    return response.data;
  }

  async updatePeriod(id: number, data: any): Promise<any> {
    const response = await this.api.put(`/api/period/${id}/`, data);
    return response.data;
  }

  async deletePeriod(id: number): Promise<void> {
    await this.api.delete(`/api/period/${id}/`);
  }

  // Total Fee Summary
  async getTotalFeeSummary(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/total-fee-summary/", { params });
    return response.data;
  }

  // Fee Summary for specific user
  async getFeeSummary(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/fee-summary/", { params });
    return response.data;
  }

  // Fee Payments
  async getFeePayments(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/fee-payments/", { params });
    return response.data;
  }

  // Fee Dashboard Analytics
  async getFeeDashboardAnalytics(params?: any): Promise<any> {
    const response = await this.api.get("/api/fee-dashboard/fee-overview-analytics/", { params });
    return response.data;
  }

  // Stationery Management
  async getStationaryTypes(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/stationary-types/", { params });
    return response.data;
  }

  async createStationaryType(data: any): Promise<any> {
    const response = await this.api.post("/api/stationary-types/", data);
    return response.data;
  }

  async getStationaryType(id: number): Promise<any> {
    const response = await this.api.get(`/api/stationary-types/${id}/`);
    return response.data;
  }

  async updateStationaryType(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/stationary-types/${id}/`, data);
    return response.data;
  }

  async deleteStationaryType(id: number): Promise<void> {
    await this.api.delete(`/api/stationary-types/${id}/`);
  }

  async getStationary(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/stationary/", { params });
    return response.data;
  }

  async createStationary(data: any): Promise<any> {
    const response = await this.api.post("/api/stationary/", data);
    return response.data;
  }

  async getInventoryTracking(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/inventory-tracking/", { params });
    return response.data;
  }

  async createInventoryTracking(data: any): Promise<any> {
    const response = await this.api.post("/api/inventory-tracking/", data);
    return response.data;
  }

  async updateInventoryTracking(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/inventory-tracking/${id}/`, data);
    return response.data;
  }

  async deleteInventoryTracking(id: number): Promise<void> {
    await this.api.delete(`/api/inventory-tracking/${id}/`);
  }

  // Stationery Fee Management
  async getStationaryFee(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/stationary-fee/", { params });
    return response.data;
  }

  async createStationaryFee(data: any): Promise<any> {
    const response = await this.api.post("/api/stationary-fee/", data);
    return response.data;
  }

  async getStationaryFeeById(id: number): Promise<any> {
    const response = await this.api.get(`/api/stationary-fee/${id}/`);
    return response.data;
  }

  async updateStationaryFee(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/stationary-fee/${id}/`, data);
    return response.data;
  }

  async deleteStationaryFee(id: number): Promise<void> {
    await this.api.delete(`/api/stationary-fee/${id}/`);
  }

  async getStudentDetails(id: number): Promise<any> {
    const response = await this.api.get(`/api/student-details/${id}/`);
    return response.data;
  }

  async updateStudentDetails(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/student-details/${id}/`, data);
    return response.data;
  }

  // Salary Templates Management
  async getSalaryTemplatesGrouped(params?: any): Promise<any> {
    const response = await this.api.get("/api/salary-templates/grouped/", { params });
    return response.data;
  }

  async getSalaryCategories(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/salary-categories/", { params });
    return response.data;
  }

  async createSalaryTemplate(data: any): Promise<any> {
    const response = await this.api.post("/api/salary-templates/", data);
    return response.data;
  }

  async updateSalaryCategory(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/salary-categories/${id}/`, data);
    return response.data;
  }

  async createSalaryCategory(data: any): Promise<any> {
    const response = await this.api.post("/api/salary-categories/", data);
    return response.data;
  }

  async deleteSalaryCategory(id: number): Promise<void> {
    await this.api.delete(`/api/salary-categories/${id}/`);
  }

  async getAllUsersExceptStudents(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/users/get-all-users-expect-students/", { params });
    return response.data;
  }

  // School Expenditure Management
  async getExpenditure(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/expenditure/", { params });
    return response.data;
  }

  async createExpenditure(data: any): Promise<any> {
    const response = await this.api.post("/api/expenditure/", data);
    return response.data;
  }

  async updateExpenditure(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/expenditure/${id}/`, data);
    return response.data;
  }

  async deleteExpenditure(id: number): Promise<void> {
    await this.api.delete(`/api/expenditure/${id}/`);
  }

  // Expenditure Summary
  async getExpenditureSummary(branch: number, academicYear: number): Promise<any> {
    const response = await this.api.get(`/api/expenditure/summary/branch-${branch}/academic-year-${academicYear}/`);
    return response.data;
  }

  // Inventory Management
  async getInventoryList(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/inventory/", { params });
    return response.data;
  }

  async createInventory(data: any): Promise<any> {
    const response = await this.api.post("/api/inventory/", data);
    return response.data;
  }

  async updateInventory(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/inventory/${id}/`, data);
    return response.data;
  }

  async deleteInventory(id: number): Promise<void> {
    await this.api.delete(`/api/inventory/${id}/`);
  }

  async getInventoryTypes(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/inventory-types/", { params });
    return response.data;
  }

  async createInventoryType(data: any): Promise<any> {
    const response = await this.api.post("/api/inventory-types/", data);
    return response.data;
  }

  async getInventoryDashboard(params?: any): Promise<any> {
    const response = await this.api.get("/api/inventory/dashboard/", { params });
    return response.data;
  }

  async getInventoryStatus(params?: any): Promise<any> {
    const response = await this.api.get("/api/inventory/inventory-status/", { params });
    return response.data;
  }

  // Rooms for assignment
  async getRooms(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/stationary-types/", { params });
    return response.data;
  }

  // Exam Timetable
  async getExamTimetable(params: {
    branch?: number;
    academicYear?: number;
    class_standard?: number;
    section?: string;
    exam_type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/exam-timetable/", { params });
    return response.data;
  }

  // Student Marks Table
  async getStudentMarksTable(params: {
    branch?: number;
    academicYear?: number;
    standard?: number;
    section?: string;
    exam_type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/student-marks/", { params });
    return response.data;
  }

  // Student Marks Analytics / Dashboard
  async getStudentMarksAnalytics(params: {
    branch?: number;
    academicYear?: number;
    standard?: number;
    section?: string;
    exam_type?: string;
  }): Promise<any> {
    const response = await this.api.get("/api/student-marks/analytics/", { params });
    return response.data;
  }

  // Tasks Management
  async getTasks(params?: any): Promise<any[]> {
    const response = await this.api.get("/api/tasks_create/", { params });
    return response.data;
  }

  async createTask(data: any): Promise<any> {
    const response = await this.api.post("/api/tasks_create/", data);
    return response.data;
  }

  async getTask(id: number): Promise<any> {
    const response = await this.api.get(`/api/tasks_create/${id}/`);
    return response.data;
  }

  async updateTask(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/tasks_create/${id}/`, data);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await this.api.delete(`/api/tasks_create/${id}/`);
  }

  // Task Submissions
  async getTaskSubmissions(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/task-submissions/", { params });
    return response.data;
  }

  async createTaskSubmission(data: any): Promise<any> {
    const response = await this.api.post("/api/task-submissions/", data);
    return response.data;
  }

  async updateTaskSubmission(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/task-submissions/${id}/`, data);
    return response.data;
  }

  async deleteTaskSubmission(id: number): Promise<void> {
    await this.api.delete(`/api/task-submissions/${id}/`);
  }

  // Leave Management
  async getLeaveRequests(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/leave/", { params });
    return response.data;
  }

  async createLeaveRequest(data: any): Promise<any> {
    const response = await this.api.post("/api/leave/", data);
    return response.data;
  }

  async updateLeaveRequest(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/leave/${id}/`, data);
    return response.data;
  }

  async deleteLeaveRequest(id: number): Promise<void> {
    await this.api.delete(`/api/leave/${id}/`);
  }

  async approveLeaveRequest(id: number, approvalData: any): Promise<any> {
    const response = await this.api.patch(`/api/leave/${id}/approve/`, approvalData);
    return response.data;
  }

  // Leave Quotas
  async getLeaveQuotas(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/leave-quotas/", { params });
    return response.data;
  }

  async createLeaveQuota(data: any): Promise<any> {
    const response = await this.api.post("/api/leave-quotas/", data);
    return response.data;
  }

  async updateLeaveQuota(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/leave-quotas/${id}/`, data);
    return response.data;
  }

  async deleteLeaveQuota(id: number): Promise<void> {
    await this.api.delete(`/api/leave-quotas/${id}/`);
  }

  // Holiday Calendar
  async getHolidays(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/holidays/", { params });
    return response.data;
  }

  async createHoliday(data: any): Promise<any> {
    const response = await this.api.post("/api/holidays/", data);
    return response.data;
  }

  async updateHoliday(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/holidays/${id}/`, data);
    return response.data;
  }

  async deleteHoliday(id: number): Promise<void> {
    await this.api.delete(`/api/holidays/${id}/`);
  }

  // Hostel Management
  async getHostelRooms(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/hostel-rooms/", { params });
    return response.data;
  }

  async getHostelBeds(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/hostel-beds/", { params });
    return response.data;
  }

  async assignBed(bedId: number, data: any): Promise<any> {
    const response = await this.api.post(`/api/hostel-beds/${bedId}/assign_student/`, data);
    return response.data;
  }

  async getHostelVisitors(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/hostel-visitors/", { params });
    return response.data;
  }

  async checkOutVisitor(visitorId: number): Promise<any> {
    const response = await this.api.post(`/api/hostel-visitors/${visitorId}/check_out/`);
    return response.data;
  }

  async getHostelMealPlans(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/hostel-mealplans/", { params });
    return response.data;
  }

  async createMealPlan(data: any): Promise<any> {
    const response = await this.api.post("/api/hostel-mealplans/", data);
    return response.data;
  }

  async updateMealPlan(id: number, data: any): Promise<any> {
    const response = await this.api.patch(`/api/hostel-mealplans/${id}/`, data);
    return response.data;
  }

  async getHostelProducts(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get("/api/hostel-products/", { params });
    return response.data;
  }

  async createHostelProduct(data: any): Promise<any> {
    const response = await this.api.post("/api/hostel-products/", data);
    return response.data;
  }
}

export const apiService = new ApiService();