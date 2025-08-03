import axios from "axios";

const DEFAULT_BASE_URL = "https://default.dev.sms.visionariesai.com";

export interface ValidateEmailResponse {
  url: string;
  organization_name?: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  email: string;
  username: string | null;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
  role?: string;
}

export const validateEmail = async (
  email: string,
): Promise<ValidateEmailResponse> => {
  try {
    console.log("Validating email with API:", email);
    const response = await axios.post(
      `${DEFAULT_BASE_URL}/api/organisations/validate-email/`,
      {
        email: email.trim().toLowerCase(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    console.log("Email validation response:", response.data);
    console.log("Organization name:", response.data.url);
    return response.data;
  } catch (error) {
    console.error("Email validation error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
        "Organization not found for this email address",
      );
    }
    throw new Error("Network error occurred during email validation");
  }
};

export const loginUser = async (
  baseUrl: string,
  payload: { username: string; password: string },
): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${baseUrl}/api/get-token/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.data) {
      throw new Error("No data found for this user");
    }

    if (!response.data.user_id) {
      throw new Error("Username is invalid");
    }

    if (!response.data.token) {
      throw new Error("Incorrect password");
    }

    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "An error occurred during login"
      );
    }
    throw new Error("Network error occurred during login");
  }
};
