import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBranches, useAcademicYears } from "@/hooks/useApi";

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

// Assuming GlobalFiltersContextType is defined elsewhere and includes the properties from GlobalFilters
// For the purpose of this example, let's assume it's the same or compatible.
// If it's different, this part might need adjustment based on the actual definition of GlobalFiltersContextType.
type GlobalFiltersContextType = GlobalFilters & {
  selectedDepartment: number | null;
  setSelectedDepartment: (deptId: number | null) => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
};

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(
  undefined,
);

export const useGlobalFilters = () => {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    // Provide default values if context is not available
    return {
      selectedBranch: 1,
      setSelectedBranch: () => {},
      selectedAcademicYear: 1,
      setSelectedAcademicYear: () => {},
      selectedDepartment: null,
      setSelectedDepartment: () => {},
      selectedDay: '',
      setSelectedDay: () => {},
    };
  }
  return context;
};

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export const GlobalFiltersProvider: React.FC<GlobalFiltersProviderProps> = ({
  children,
}) => {
  const [selectedBranch, setSelectedBranchState] = useState<number>(1); // Default to 1
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<number>(1); // Default to 1
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Fetch branches and academic years
  const { data: branches = [], loading: branchesLoading } = useBranches({
    is_active: true,
  });
  const { data: academicYears = [], loading: academicYearsLoading } =
    useAcademicYears();

  // Load saved filters from AsyncStorage and set defaults if necessary
  useEffect(() => {
    const loadAndSetFilters = async () => {
      try {
        const savedBranch = await AsyncStorage.getItem(
          "global_selected_branch",
        );
        const savedYear = await AsyncStorage.getItem(
          "global_selected_academic_year",
        );

        // Set branch
        if (branches.length > 0) {
          if (savedBranch && branches.some(b => b.id === parseInt(savedBranch))) {
            setSelectedBranchState(parseInt(savedBranch));
          } else {
            const defaultBranch = branches[0].id;
            setSelectedBranchState(defaultBranch);
            await AsyncStorage.setItem("global_selected_branch", defaultBranch.toString());
          }
        } else {
          // If no branches are available, ensure a default is set (though API might return empty)
          setSelectedBranchState(1); // Fallback default
        }

        // Set academic year
        if (academicYears.length > 0) {
          if (savedYear && academicYears.some(y => y.id === parseInt(savedYear))) {
            setSelectedAcademicYearState(parseInt(savedYear));
          } else {
            const defaultYear = academicYears[0].id;
            setSelectedAcademicYearState(defaultYear);
            await AsyncStorage.setItem("global_selected_academic_year", defaultYear.toString());
          }
        } else {
          // If no academic years are available, ensure a default is set
          setSelectedAcademicYearState(1); // Fallback default
        }
      } catch (error) {
        console.error("Error loading or setting filters:", error);
        // Ensure defaults are set even if AsyncStorage fails
        if (branches.length === 0) setSelectedBranchState(1);
        if (academicYears.length === 0) setSelectedAcademicYearState(1);
      }
    };

    loadAndSetFilters();
  }, [branches, academicYears]); // Re-run if branches or academicYears data changes

  const setSelectedBranch = async (branchId: number | null) => {
    const id = branchId || 1;
    setSelectedBranchState(id);
    try {
      await AsyncStorage.setItem("global_selected_branch", id.toString());
    } catch (error) {
      console.error("Error saving selected branch:", error);
    }
  };

  const setSelectedAcademicYear = async (yearId: number | null) => {
    const id = yearId || 1;
    setSelectedAcademicYearState(id);
    try {
      await AsyncStorage.setItem(
        "global_selected_academic_year",
        id.toString(),
      );
    } catch (error) {
      console.error("Error saving selected academic year:", error);
    }
  };

  // Prepare the value to be provided, matching the GlobalFilters interface
  const value: GlobalFiltersContextType = {
    selectedBranch,
    selectedAcademicYear,
    setSelectedBranch: setSelectedBranch, // Pass the state setter functions
    setSelectedAcademicYear: setSelectedAcademicYear,
    branches,
    academicYears,
    branchesLoading,
    academicYearsLoading,
    selectedDepartment,
    setSelectedDepartment,
    selectedDay,
    setSelectedDay,
  };

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
};