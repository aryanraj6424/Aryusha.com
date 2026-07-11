// import axios from "axios";

// /*
// |--------------------------------------------------------------------------
// | Axios Instance
// |--------------------------------------------------------------------------
// */

// const API = axios.create({
//   baseURL: "https://animated-guacamole-7v94r5qxvpvrfpr5w-5000.app.github.dev/api",
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// /*
// |--------------------------------------------------------------------------
// | LOGIN
// |--------------------------------------------------------------------------
// */

// export const loginUser = async (loginData) => {
//   const response = await API.post(
//     "/auth/login",
//     loginData
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | SIGNUP
// |--------------------------------------------------------------------------
// */

// export const signupUser = async (userData) => {
//   const response = await API.post(
//     "/auth/signup",
//     userData
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | FORGOT PASSWORD
// |--------------------------------------------------------------------------
// */

// export const forgotPassword = async (data) => {
//   const response = await API.post(
//     "/auth/forgot-password",
//     data
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | VERIFY OTP
// |--------------------------------------------------------------------------
// */

// export const verifyOtp = async (data) => {
//   const response = await API.post(
//     "/auth/verify-otp",
//     data
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | RESEND OTP
// |--------------------------------------------------------------------------
// */

// export const resendOtp = async (data) => {
//   const response = await API.post(
//     "/auth/resend-otp",
//     data
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | RESET PASSWORD
// |--------------------------------------------------------------------------
// */

// export const resetPassword = async (data) => {
//   const response = await API.post(
//     "/auth/reset-password",
//     data
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | LOGOUT
// |--------------------------------------------------------------------------
// */

// export const logoutUser = async () => {
//   const response = await API.post(
//     "/auth/logout"
//   );

//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | GET CURRENT USER
// |--------------------------------------------------------------------------
// */

// export const getCurrentUser = async () => {
//   const response = await API.get(
//     "/auth/me"
//   );

//   return response.data;
// };

// export default API;



import axios from "axios";

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/

// const API = axios.create({
//   baseURL:
    
//     "http://localhost:3000",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export const loginUser = async (loginData) => {
  const response = await API.post(
    "/auth/login",
    loginData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| SIGNUP
|--------------------------------------------------------------------------
*/

export const signupUser = async (userData) => {
  const response = await API.post(
    "/auth/signup",
    userData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

export const forgotPassword = async (data) => {
  const response = await API.post(
    "/auth/forgot-password",
    data
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
*/

export const verifyOtp = async (data) => {
  const response = await API.post(
    "/auth/verify-otp",
    data
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/

export const resendOtp = async (data) => {
  const response = await API.post(
    "/auth/resend-otp",
    data
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

export const resetPassword = async (data) => {
  const response = await API.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

export const logoutUser = async () => {
  const response = await API.post(
    "/auth/logout"
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

export const getCurrentUser = async () => {
  const response = await API.get(
    "/auth/me"
  );

  return response.data;
};

export default API;