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

  const fetchData = useCallback(async (isRetry = false) => {
    // Circuit breaker: stop trying after 3 failures
    if (isBlocked && retryCount >= 3) {
      setError("Too many failed attempts. Please try again later.");
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

      if (err && typeof err === 'object') {
        const axiosError = err as any;
        if (axiosError.response) {
          const status = axiosError.response.status;
          if (status === 502) {
            errorMessage = "Server temporarily unavailable. Please try again later.";
          } else {
            errorMessage = `Error ${status}: ${axiosError.response.data?.message || axiosError.response.data || 'Server Error'}`;
          }
        } else if (axiosError.message) {
          if (axiosError.message.includes('timeout')) {
            errorMessage = "Request timed out. Please check your connection and try again.";
          } else {
            errorMessage = axiosError.message;
          }
        }
      }

      setError(errorMessage);
      console.error("Error fetching events:", err);

      // Increment retry count and set blocked state if too many failures
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      if (newRetryCount >= 3) {
        setIsBlocked(true);
      }
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params), retryCount, isBlocked]); // Added JSON.stringify for params

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
    } catch (err: unknown) {
      let errorMessage = "Failed to fetch attendance data";

      if (err && typeof err === 'object') {
        const axiosError = err as any;
        if (axiosError.response) {
          errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.data?.message || axiosError.response.data || 'Server Error'}`;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      setError(errorMessage);
      console.error("Error fetching attendance dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useLeaveQuotas(userId?: number) {
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

  const fetchData = useCallback(async (isRetry = false) => {
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
        ...(params && !params.branch && { branch: 1 })
      };

      const response = await apiService.getUsers(requestParams);
      setData(response.results || []);
      setHasInitialized(true);
      setRetryCount(0); // Reset retry count on success
      setIsBlocked(false);
    } catch (err: unknown) {
      let errorMessage = "Failed to fetch users";

      if (err && typeof err === 'object') {
        const axiosError = err as any;
        if (axiosError.response) {
          const status = axiosError.response.status;
          const responseData = axiosError.response.data;

          if (status === 400 && typeof responseData === 'string' && responseData.includes('Branch is required')) {
            errorMessage = "Branch selection is required. Please select a branch first.";
          } else {
            errorMessage = `Error ${status}: ${responseData?.message || responseData || 'Server Error'}`;
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
  }, [JSON.stringify(params), retryCount, isBlocked]); // Added JSON.stringify for params

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

  const fetchData = useCallback(async (isRetry = false) => {
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

      if (err && typeof err === 'object') {
        const axiosError = err as any;
        if (axiosError.response) {
          errorMessage = `Error ${axiosError.response.status}: ${axiosError.response.data?.message || axiosError.response.data || 'Server Error'}`;
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
  }, [JSON.stringify(params), retryCount, isBlocked]); // Added JSON.stringify for params

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
      console.error('Periods fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch periods');
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
      console.error('Teacher timetable fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch teacher timetable');
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
      console.error('Sections fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch sections');
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
      console.error('All users fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
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
      console.error('Fees fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch fees');
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
      console.error('Fee types fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch fee types');
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
      console.error('Standards fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch standards');
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
      console.error('Total fee summary fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch total fee summary');
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
      console.error('Fee summary fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch fee summary');
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
      console.error('Fee payments fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch fee payments');
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
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFeeDashboardAnalytics(params);
      setData(response);
    } catch (err: any) {
      console.error('Fee dashboard analytics fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch fee dashboard analytics');
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
      console.error('Stationary types fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch stationary types');
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
      console.error('Stationary fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch stationary');
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
      console.error('Stationary fee fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch stationary fee');
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
      console.error('Student details fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch student details');
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
      console.error('Inventory tracking fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory tracking');
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
      console.error('Salary templates fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch salary templates');
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
      console.error('Salary categories fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch salary categories');
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
      console.error('Users fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
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
      console.error('Expenditure fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch expenditure');
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
      const response = await apiService.getExpenditureSummary(branch, academicYear);
      setData(response);
    } catch (err: any) {
      console.error('Expenditure summary fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch expenditure summary');
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
      console.error('Inventory list fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory list');
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
      console.error('Inventory types fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory types');
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
      console.error('Inventory dashboard fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory dashboard');
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
      const response = await apiService.getRooms(params);
      setData(response.results || []);
    } catch (err: any) {
      console.error('Rooms fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms');
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
  return useApi<any[]>('/inventory/', params);
};

// Exam-related hooks
export const useExams = (params?: Record<string, any>) => {
  return useApi<any[]>('/exams/', params);
};

export const useExamTypes = () => {
  return useApi<any[]>('/exam-types/');
};

export const useStudentExamMarks = (params?: Record<string, any>) => {
  return useApi<any[]>('/student-exam-marks/', params);
};

export const useStudentExamMarksAnalytics = (params?: Record<string, any>) => {
  return useApi<any>('/student-exam-marks/exam-analytics/', params);
};

export const useExamScheduleDetails = (scheduleId: number) => {
  return useApi<any>(`/exam-schedules/${scheduleId}/get-question-paper/`);
};