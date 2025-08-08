import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/api/apiService";

export function useAnnouncements(params?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAnnouncements(params);
      setData(response.results || []);
      setHasInitialized(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch announcements",
      );
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    if (!hasInitialized) {
      fetchData();
    }
  }, [fetchData, hasInitialized]);

  return { data, loading, error, refetch: fetchData };
}

export function useEvents(params?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchData = useCallback(
    async (isRetry = false) => {
      // Circuit breaker: stop trying after 3 failures
      if (isBlocked && retryCount >= 3) {
        setError(
          "Events service temporarily unavailable. Please try again later.",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getEvents(params);
        setData(response.results || []);

        setHasInitialized(true);
        setRetryCount(0); // Reset retry count on success
        setIsBlocked(false);
      } catch (err: unknown) {
        let errorMessage = "Failed to fetch events";

        if (err && typeof err === "object") {
          const axiosError = err as any;
          if (axiosError.response) {
            const status = axiosError.response.status;
            if (status === 500) {
              errorMessage =
                "Events service is temporarily down. Please try again later.";
              setIsBlocked(true); // Block further requests on 500 errors
            } else if (status === 502 || status === 503) {
              errorMessage =
                "Server temporarily unavailable. Please try again later.";
            } else if (status === 400) {
              errorMessage = "Invalid request parameters.";
            } else {
              errorMessage = `Server error (${status}). Please try again.`;
            }
          } else if (axiosError.code === "ECONNABORTED") {
            errorMessage = "Request timed out. Please check your connection.";
          } else {
            errorMessage = axiosError.message || "Network error occurred.";
          }
        }

        setError(errorMessage);
        console.error("Error fetching events:", err);

        // Don't increment retry count on 500 errors since we're blocking
        if (!isBlocked) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          if (newRetryCount >= 3) {
            setIsBlocked(true);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [JSON.stringify(params), retryCount, isBlocked],
  );

  useEffect(() => {
    if (!hasInitialized && !isBlocked) {
      fetchData();
    }
  }, [fetchData, hasInitialized, isBlocked]);

  const manualRefetch = useCallback(() => {
    setIsBlocked(false);
    setRetryCount(0);
    setHasInitialized(false);
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch: manualRefetch };
}

// Student Marks Analytics / Dashboard
export function useStudentMarksAnalytics(params?: {
  branch?: number;
  academicYear?: number;
  standard?: number;
  section?: string;
  exam_type?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!params?.branch || !params?.academicYear) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStudentMarksAnalytics(params || {});
      setData(response);
    } catch (err: any) {
      console.error("Student marks analytics fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch student marks analytics",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Student Marks Table
export function useStudentMarksTable(params?: {
  branch?: number;
  academic_year?: number;
  standard?: number;
  section?: string;
  exam_type?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!params?.branch || !params?.academic_year) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStudentMarksTable(params || {});
      setData(response);
    } catch (err: any) {
      console.error("Student marks table fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch student marks table",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Leave Quotas - Fixed to use annual-leave-quotas endpoint
export function useLeaveQuota(params?: {
  branch?: number;
  academic_year?: number;
  employee?: number;
  year?: number;
  leave_type?: number;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAnnualLeaveQuotas(params || {});
      setData(response.results || []);
    } catch (err: any) {
      console.error("Leave quota fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave quota",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Attendance Dashboard
export function useAttendanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAttendanceDashboard();
      setData(response);
    } catch (err: any) {
      console.error("Attendance dashboard fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch attendance dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

export function useAnnualLeaveQuotas(userId?: number) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = userId ? { user: userId } : {};
      const response = await apiService.getAnnualLeaveQuotas(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch leave quotas",
      );
      console.error("Error fetching leave quotas:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAcademicYears(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAcademicYears(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch academic years",
      );
      console.error("Error fetching academic years:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDepartments(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDepartments(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch departments",
      );
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Use JSON.stringify to properly compare params object

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useBranches(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBranches(params);
      setData(response.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch branches");
      console.error("Error fetching branches:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useChatMessages(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getChatMessages(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch chat messages",
      );
      console.error("Error fetching chat messages:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDocuments(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDocuments(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch documents",
      );
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDeviceReadings(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDeviceReadings(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch device readings",
      );
      console.error("Error fetching device readings:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAttendance(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAttendance(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch attendance data",
      );
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAmenities(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAmenities(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch amenities",
      );
      console.error("Error fetching amenities:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDesignations(params?: any) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDesignations(params);
      setData(response.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch designations",
      );
      console.error("Error fetching designations:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // Added JSON.stringify for dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useUsers(params?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchData = useCallback(
    async (isRetry = false) => {
      // Circuit breaker: stop trying after 3 failures
      if (isBlocked && retryCount >= 3) {
        setError("Too many failed attempts. Please try again later.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add required branch parameter if missing
        const requestParams = {
          ...params,
          // Add default branch if not provided and API requires it
          ...(params && !params.branch && { branch: 1 }),
        };

        const response = await apiService.getUsers(requestParams);
        setData(response.results || []);
        setHasInitialized(true);
        setRetryCount(0); // Reset retry count on success
        setIsBlocked(false);
      } catch (err: unknown) {
        let errorMessage = "Failed to fetch users";

        if (err && typeof err === "object") {
          const axiosError = err as any;
          if (axiosError.response) {
            const status = axiosError.response.status;
            const responseData = axiosError.response.data;

            if (
              status === 400 &&
              typeof responseData === "string" &&
              responseData.includes("Branch is required")
            ) {
              errorMessage =
                "Branch selection is required. Please select a branch first.";
            } else {
              errorMessage = `Error ${status}: ${responseData?.message || responseData || "Server Error"}`;
            }
          } else if (axiosError.message) {
            errorMessage = axiosError.message;
          }
        }

        setError(errorMessage);
        console.error("Error fetching users:", err);

        // Increment retry count and set blocked state if too many failures
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        if (newRetryCount >= 3) {
          setIsBlocked(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [JSON.stringify(params), retryCount, isBlocked],
  ); // Added JSON.stringify for params

  useEffect(() => {
    if (!hasInitialized && !isBlocked) {
      fetchData();
    }
  }, [fetchData, hasInitialized, isBlocked]);

  const manualRefetch = useCallback(() => {
    setIsBlocked(false);
    setRetryCount(0);
    setHasInitialized(false);
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch: manualRefetch };
}

export function useGroups(params?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchData = useCallback(
    async (isRetry = false) => {
      // Circuit breaker: stop trying after 3 failures
      if (isBlocked && retryCount >= 3) {
        setError("Too many failed attempts. Please try again later.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getGroups(params);
        setData(response.results || []);
        setHasInitialized(true);
        setRetryCount(0); // Reset retry count on success
        setIsBlocked(false);
      } catch (err: unknown) {
        let errorMessage = "Failed to fetch groups";

        if (err && typeof err === "object") {
          const axiosError = err as any;
          if (axiosError.response) {
            errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.data?.message || axiosError.response.data || "Server Error"}`;
          } else if (axiosError.message) {
            errorMessage = axiosError.message;
          }
        }

        setError(errorMessage);
        console.error("Error fetching groups:", err);

        // Increment retry count and set blocked state if too many failures
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        if (newRetryCount >= 3) {
          setIsBlocked(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [JSON.stringify(params), retryCount, isBlocked],
  ); // Added JSON.stringify for params

  useEffect(() => {
    if (!hasInitialized && !isBlocked) {
      fetchData();
    }
  }, [fetchData, hasInitialized, isBlocked]);

  const manualRefetch = useCallback(() => {
    setIsBlocked(false);
    setRetryCount(0);
    setHasInitialized(false);
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch: manualRefetch };
}

// Timetable hooks
export const usePeriods = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPeriods(params);
      setData(response.results || response);
    } catch (err: any) {
      console.error("Periods fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch periods",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useTeacherTimetable = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTeacherTimetable(params);
      setData(response);
    } catch (err: any) {
      console.error("Teacher timetable fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch teacher timetable",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useSections = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSections(params);
      setData(response.results || response);
    } catch (err: any) {
      console.error("Sections fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch sections",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useAllUsers = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllUsers(params);
      setData(response.results || response);
    } catch (err: any) {
      console.error("All users fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch users",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Fee Management hooks
export const useFees = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFees(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Fees fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch fees",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useFeeTypes = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFeeTypes(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Fee types fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch fee types",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useStandards = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStandards(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Standards fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch standards",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Student Fee Management hooks
export const useTotalFeeSummary = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTotalFeeSummary(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Total fee summary fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch total fee summary",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useFeeSummary = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFeeSummary(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Fee summary fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch fee summary",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useFeePayments = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFeePayments(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Fee payments fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch fee payments",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useFeeDashboardAnalytics = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Don't fetch if required parameters are missing
    if (!params.branch || !params.academic_year) {
      setLoading(false);
      setError("Both 'branch' and 'academic_year' are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFeeDashboardAnalytics(params);
      setData(response);
    } catch (err: any) {
      console.error("Fee dashboard analytics fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch fee dashboard analytics",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Stationery Management hooks
export const useStationaryTypes = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStationaryTypes(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Stationary types fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch stationary types",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useStationary = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStationary(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Stationary fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch stationary",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useStationaryFee = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStationaryFee(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Stationary fee fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch stationary fee",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useStudentDetails = (id: number) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStudentDetails(id);
      setData(response);
    } catch (err: any) {
      console.error("Student details fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch student details",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useInventoryTracking = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventoryTracking(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Inventory tracking fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch inventory tracking",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Salary Templates hooks
export const useSalaryTemplatesGrouped = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSalaryTemplatesGrouped(params);
      setData(response || []);
    } catch (err: any) {
      console.error("Salary templates grouped fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch salary templates",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useSalaryCategories = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSalaryCategories(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Salary categories fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch salary categories",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useAllUsersExceptStudents = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllUsersExceptStudents(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Users fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch users",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Expenditure hooks
export const useExpenditure = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getExpenditure(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Expenditure fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch expenditure",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Expenditure Summary hook
export const useExpenditureSummary = (branch: number, academicYear: number) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getExpenditureSummary(
        branch,
        academicYear,
      );
      setData(response);
    } catch (err: any) {
      console.error("Expenditure summary fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch expenditure summary",
      );
    } finally {
      setLoading(false);
    }
  }, [branch, academicYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Inventory Management hooks
export const useInventoryList = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventoryList(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Inventory list fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch inventory list",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useInventoryTypes = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventoryTypes(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Inventory types fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch inventory types",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useInventoryDashboard = (params: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventoryDashboard(params);
      setData(response);
    } catch (err: any) {
      console.error("Inventory dashboard fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch inventory dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useRooms = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHostelRooms();
      setData(response.results || []);
    } catch (err: any) {
      console.error("Rooms fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch rooms",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hostel Visitors
export const useHostelVisitors = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHostelVisitors(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Hostel visitors fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch visitors",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hostel Meal Plans
export const useHostelMealPlans = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHostelMealPlans();
      setData(response.results || []);
    } catch (err: any) {
      console.error("Hostel meal plans fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch meal plans",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hostel Products
export const useHostelProducts = (params: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHostelProducts(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Hostel products fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch products",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useInventory = (params?: Record<string, any>) => {
  return useApi<any[]>("/inventory/", params);
};

// Generic useApi hook
const useApi = <T>(
  endpoint: string,
  params?: Record<string, any>,
  options: { retryCount?: number; retryDelay?: number } = {},
) => {
  const { retryCount = 3, retryDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetchData = useCallback(async () => {
    let isMounted = true;
    let attempts = 0;

    const attemptFetch = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.api.get(endpoint, { params });
        if (isMounted) {
          setData(response.data.results || response.data);
          setRetryAttempt(0);
        }
      } catch (err: any) {
        attempts++;
        if (isMounted) {
          if (attempts < retryCount) {
            console.warn(
              `API call to ${endpoint} failed, retrying (${attempts}/${retryCount})...`,
            );
            setTimeout(() => {
              if (isMounted) {
                attemptFetch();
              }
            }, retryDelay * attempts);
          } else {
            setError(
              err.response?.data?.message ||
                err.message ||
                `Failed to fetch ${endpoint}`,
            );
            setRetryAttempt(attempts);
            console.error(`API Error after retries for ${endpoint}:`, err);
          }
        }
      } finally {
        if (isMounted && (attempts >= retryCount || !error)) {
          setLoading(false);
        }
      }
    };

    await attemptFetch();

    return () => {
      isMounted = false;
    };
  }, [endpoint, JSON.stringify(params), retryCount, retryDelay]);

  const refetch = useCallback(() => {
    setRetryAttempt(0);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData to re-run when it changes

  return { data, loading, error, refetch, retryAttempt };
};

// Exam-related hooks
export const useExams = (params?: Record<string, any>) => {
  return useApi<any[]>("/api/exams/", params);
};

export const useExamTypes = () => {
  return useApi<any[]>("/api/exam-types/");
};

export const useSubjects = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSubjects(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Subjects fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch subjects",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useClasses = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use standards endpoint since classes endpoint doesn't exist
      const response = await apiService.getStandards(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Classes fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch classes",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useStudentExamMarks = (params?: Record<string, any>) => {
  return useApi<any[]>("/api/student-exam-marks/", params);
};

export const useStudentExamMarksAnalytics = (params?: Record<string, any>) => {
  return useApi<any>("/api/student-exam-marks/exam-analytics/", params);
};

export const useExamScheduleDetails = (scheduleId: number) => {
  return useApi<any>(`/api/exam-schedules/${scheduleId}/get-question-paper/`);
};

// Tasks module hooks
export const useTasks = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    // Circuit breaker: stop trying after 3 failures
    if (retryCount >= 3) {
      setError("Too many failed attempts. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up params - remove invalid status values
      const cleanParams = { ...params };
      if (cleanParams && typeof cleanParams === "object") {
        // Remove problematic parameters
        delete cleanParams.status; // Remove until we know valid values

        // Only include valid branch and academic_year if they exist
        const validParams: any = {};
        if (cleanParams.branch) validParams.branch = cleanParams.branch;
        if (cleanParams.academic_year)
          validParams.academic_year = cleanParams.academic_year;
        if (cleanParams.limit) validParams.limit = cleanParams.limit;

        const response = await apiService.getTasks(validParams);
        setData(response || []);
        setRetryCount(0); // Reset on success
      } else {
        const response = await apiService.getTasks();
        setData(response || []);
        setRetryCount(0);
      }
    } catch (err: any) {
      console.error("Tasks fetch error:", err);

      let errorMessage = "Failed to fetch tasks";
      if (err.response?.status === 500) {
        errorMessage = "Server error. Tasks API may be experiencing issues.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please check your connection.";
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      }

      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params), retryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useTaskSubmissions = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTaskSubmissions(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Task submissions fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch task submissions",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Salary Templates hook
export const useSalaryTemplates = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data for now - replace with actual API call
      const mockData = [
        {
          id: 1,
          name: "Elementary Teacher Template",
          description: "Standard salary template for elementary teachers",
          department: { id: 1, name: "Elementary Education" },
          base_salary: 45000,
          allowances: [
            { id: 1, name: "Teaching Allowance", amount: 5000, type: "fixed" },
            { id: 2, name: "Transport Allowance", amount: 2000, type: "fixed" },
          ],
          deductions: [
            { id: 1, name: "Tax", amount: 10, type: "percentage" },
            { id: 2, name: "Insurance", amount: 500, type: "fixed" },
          ],
          is_active: true,
          created_date: "2024-01-15",
          modified_date: "2024-12-15",
        },
      ];
      setData(mockData);
    } catch (err: any) {
      console.error("Salary templates fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch salary templates",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// School Expenditure hook
export const useSchoolExpenditure = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data for now - replace with actual API call
      const mockData = [
        {
          id: 1,
          category: { id: 1, name: "Infrastructure" },
          description: "Classroom renovation and maintenance",
          amount: 15000,
          expense_date: "2024-12-10",
          status: "approved",
          approved_by: { id: 1, name: "John Admin" },
          approved_date: "2024-12-11",
          payment_method: "Bank Transfer",
          reference_number: "EXP-2024-001",
          receipts: ["receipt1.pdf"],
          branch: { id: 1, name: "Main Campus" },
          created_date: "2024-12-10",
        },
      ];
      setData(mockData);
    } catch (err: any) {
      console.error("School expenditure fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch school expenditure",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Expense Categories hook
export const useExpenseCategories = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data for now - replace with actual API call
      const mockData = [
        { id: 1, name: "Infrastructure" },
        { id: 2, name: "Equipment" },
        { id: 3, name: "Supplies" },
        { id: 4, name: "Utilities" },
        { id: 5, name: "Staff Training" },
      ];
      setData(mockData);
    } catch (err: any) {
      console.error("Expense categories fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch expense categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Student Marks Analytics hook
// export const useStudentMarksAnalytics = (params?: Record<string, any>) => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       // Mock data for now - replace with actual API call
//       const mockData = {
//         subject_wise: [
//           {
//             subject: 'Mathematics',
//             average_marks: 78.5,
//             highest_marks: 98,
//             lowest_marks: 45,
//             pass_percentage: 85.2,
//             students_count: 120
//           },
//           {
//             subject: 'English',
//             average_marks: 82.1,
//             highest_marks: 95,
//             lowest_marks: 52,
//             pass_percentage: 89.7,
//             students_count: 120
//           }
//         ],
//         class_wise: [
//           {
//             class_name: 'Class 10A',
//             average_marks: 80.3,
//             total_students: 30,
//             passed_students: 27,
//             failed_students: 3
//           },
//           {
//             class_name: 'Class 10B',
//             average_marks: 75.8,
//             total_students: 28,
//             passed_students: 24,
//             failed_students: 4
//           }
//         ],
//         overall_stats: {
//           total_students: 120,
//           overall_average: 78.9,
//           overall_pass_percentage: 87.5,
//           grade_distribution: [
//             { grade: 'A', count: 25, percentage: 20.8 },
//             { grade: 'B', count: 35, percentage: 29.2 },
//             { grade: 'C', count: 30, percentage: 25.0 },
//             { grade: 'D', count: 15, percentage: 12.5 },
//             { grade: 'F', count: 15, percentage: 12.5 }
//           ]
//         }
//       };
//       setData(mockData);
//     } catch (err: any) {
//       console.error('Student marks analytics fetch error:', err);
//       setError(err.response?.data?.message || err.message || 'Failed to fetch student marks analytics');
//     } finally {
//       setLoading(false);
//     }
//   }, [JSON.stringify(params)]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const refetch = useCallback(() => {
//     fetchData();
//   }, [fetchData]);

//   return { data, loading, error, refetch };
// };

// Leave Management hooks
export const useLeaveRequests = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean up params - remove invalid status values
      const cleanParams = { ...params };
      if (cleanParams.status === "pending") {
        delete cleanParams.status; // Remove invalid status
      }

      const response = await apiService.getLeaveRequests(cleanParams);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Leave requests fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave requests",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useLeaveQuotasList = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getLeaveQuotas(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Leave quotas fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave quotas",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useHolidays = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHolidays(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Holidays fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch holidays",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Notifications hooks
export const useNotifications = (params?: Record<string, any>) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getNotifications(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error("Notifications fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch notifications",
      );
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useNotificationTypes = () => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getNotificationTypes();
      setData(response || {});
    } catch (err: any) {
      console.error("Notification types fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch notification types",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};