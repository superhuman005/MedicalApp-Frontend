import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// If the backend ever tells us the token is invalid/expired, clear local auth
// state and send the user back to login instead of leaving them stuck on a
// broken page. We skip this for the login/register calls themselves, since a
// 401 there just means "wrong password", not "your session expired".
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Small helper so callers can write `catch (err) { toast(getErrorMessage(err)) }`
// instead of repeating the same optional-chaining everywhere.
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  return error?.response?.data?.message || error?.message || fallback;
};

export default API;
