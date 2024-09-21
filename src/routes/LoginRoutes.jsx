import {lazy} from "react";

// project import
import Loadable from "components/Loadable";
import MinimalLayout from "layout/MinimalLayout";
import {Navigate} from "react-router-dom";

// render - login
const AuthLogin = Loadable(lazy(() => import("pages/authentication/login")));
const AuthRegister = Loadable(lazy(() => import("pages/authentication/register")));

// ==============================|| AUTH ROUTING ||============================== //

// Authentication function
const isAuthenticated = () => {
  const user = sessionStorage.getItem("userData"); // Assuming you store user data in session storage as 'userData'
  return user === null;
};

const ProtectedRoute = ({children}) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

const LoginRoutes = {
  path: "/",
  element: (
    <ProtectedRoute>
      <MinimalLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: "/login",
      element: <AuthLogin />
    },
    {
      path: "/register",
      element: <AuthRegister />
    }
  ]
};

export default LoginRoutes;
