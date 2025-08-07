
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBranches, useAcademicYears } from '@/hooks/useApi';

interface GlobalFilters {
  selectedBranch: number | null;
  selectedAcademicYear: number | null;
  setSelectedBranch: (branchId: number) => void;
  setSelectedAcademicYear: (yearId: number) => void;
  branches: any[];
  academicYears: any[];
  branchesLoading: boolean;
  academicYearsLoading: boolean;
}

const GlobalFiltersContext = createContext<GlobalFilters | undefined>(undefined);

export const useGlobalFilters = () => {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within a GlobalFiltersProvider');
  }
  return context;
};

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export const GlobalFiltersProvider: React.FC<GlobalFiltersProviderProps> = ({ children }) => {
  const [selectedBranch, setSelectedBranchState] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<number | null>(null);

  // Fetch branches and academic years
  const { data: branches = [], loading: branchesLoading } = useBranches({ is_active: true });
  const { data: academicYears = [], loading: academicYearsLoading } = useAcademicYears();

  // Load saved filters from AsyncStorage
  useEffect(() => {
    const loadSavedFilters = async () => {
      try {
        const savedBranch = await AsyncStorage.getItem('global_selected_branch');
        const savedYear = await AsyncStorage.getItem('global_selected_academic_year');
        
        if (savedBranch) {
          setSelectedBranchState(parseInt(savedBranch));
        } else if (branches.length > 0) {
          setSelectedBranchState(branches[0].id);
        }
        
        if (savedYear) {
          setSelectedAcademicYearState(parseInt(savedYear));
        } else if (academicYears.length > 0) {
          setSelectedAcademicYearState(academicYears[0].id);
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
        // Set defaults if loading fails
        if (branches.length > 0) setSelectedBranchState(branches[0].id);
        if (academicYears.length > 0) setSelectedAcademicYearState(academicYears[0].id);
      }
    };

    if (branches.length > 0 || academicYears.length > 0) {
      loadSavedFilters();
    }
  }, [branches, academicYears]);

  const setSelectedBranch = async (branchId: number) => {
    setSelectedBranchState(branchId);
    try {
      await AsyncStorage.setItem('global_selected_branch', branchId.toString());
    } catch (error) {
      console.error('Error saving selected branch:', error);
    }
  };

  const setSelectedAcademicYear = async (yearId: number) => {
    setSelectedAcademicYearState(yearId);
    try {
      await AsyncStorage.setItem('global_selected_academic_year', yearId.toString());
    } catch (error) {
      console.error('Error saving selected academic year:', error);
    }
  };

  const value: GlobalFilters = {
    selectedBranch,
    selectedAcademicYear,
    setSelectedBranch,
    setSelectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading,
  };

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBranches, useAcademicYears } from '@/hooks/useApi';

interface GlobalFiltersContextType {
  selectedBranch: number | null;
  selectedAcademicYear: number | null;
  branches: any[];
  academicYears: any[];
  setSelectedBranch: (branch: number | null) => void;
  setSelectedAcademicYear: (year: number | null) => void;
  loading: boolean;
  error: string | null;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within a GlobalFiltersProvider');
  }
  return context;
}

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export function GlobalFiltersProvider({ children }: GlobalFiltersProviderProps) {
  const [selectedBranch, setSelectedBranchState] = useState<number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<number | null>(null);

  const { data: branches = [], loading: branchesLoading, error: branchesError } = useBranches();
  const { data: academicYears = [], loading: yearsLoading, error: yearsError } = useAcademicYears();

  const loading = branchesLoading || yearsLoading;
  const error = branchesError || yearsError;

  // Load saved filters from storage
  useEffect(() => {
    const loadSavedFilters = async () => {
      try {
        const savedBranch = await AsyncStorage.getItem('selectedBranch');
        const savedYear = await AsyncStorage.getItem('selectedAcademicYear');
        
        if (savedBranch) {
          setSelectedBranchState(parseInt(savedBranch, 10));
        } else if (branches.length > 0) {
          // Set first branch as default
          setSelectedBranchState(branches[0].id);
        }
        
        if (savedYear) {
          setSelectedAcademicYearState(parseInt(savedYear, 10));
        } else if (academicYears.length > 0) {
          // Set current academic year as default
          const currentYear = academicYears.find(year => year.is_current) || academicYears[0];
          setSelectedAcademicYearState(currentYear.id);
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    };

    if (branches.length > 0 || academicYears.length > 0) {
      loadSavedFilters();
    }
  }, [branches, academicYears]);

  const setSelectedBranch = async (branch: number | null) => {
    setSelectedBranchState(branch);
    try {
      if (branch) {
        await AsyncStorage.setItem('selectedBranch', branch.toString());
      } else {
        await AsyncStorage.removeItem('selectedBranch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
    }
  };

  const setSelectedAcademicYear = async (year: number | null) => {
    setSelectedAcademicYearState(year);
    try {
      if (year) {
        await AsyncStorage.setItem('selectedAcademicYear', year.toString());
      } else {
        await AsyncStorage.removeItem('selectedAcademicYear');
      }
    } catch (error) {
      console.error('Error saving academic year:', error);
    }
  };

  const value: GlobalFiltersContextType = {
    selectedBranch,
    selectedAcademicYear,
    branches,
    academicYears,
    setSelectedBranch,
    setSelectedAcademicYear,
    loading,
    error,
  };

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}
