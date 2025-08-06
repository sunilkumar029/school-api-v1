import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
}

export const apiService = new ApiService();