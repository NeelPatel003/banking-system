import {lazy} from "react";

// project import
import Loadable from "components/Loadable";
import Dashboard from "layout/Dashboard";
import UserDetails from "pages/dashboard/UserDetails";
import {Navigate} from "react-router-dom";

const DashboardDefault = Loadable(lazy(() => import("pages/dashboard/index")));

// Authentication function
const isAuthenticated = () => {
  const user = sessionStorage.getItem("userData"); // Assuming you store user data in session storage as 'userData'
  return user !== null;
};

// Route guarding component
const ProtectedRoute = ({children}) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// render - sample page

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: "/",
  element: (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
  children: [
    {
      path: "/",
      element: <DashboardDefault />
    },
    {
      path: "/userDetails/:id",
      element: <UserDetails />
    }
  ]
};

export default MainRoutes;
