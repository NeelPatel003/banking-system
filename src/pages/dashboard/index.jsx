// material-ui
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

// project import
import MainCard from "components/MainCard";
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import {fetchUserById, fetchUsers, filterUsers} from "redux/slices/userSlice";
import OutlinedInput from "@mui/material/OutlinedInput";
import Loader from "components/Loader";
import OrderTable from "pages/dashboard/OrdersTable";
import Button from "@mui/material/Button";
import CreateAccount from "./CreateAccount";

export default function DashboardDefault() {
  const dispatch = useDispatch();
  const sessionData = sessionStorage.getItem("userData"); // Assuming you store user data in session storage as 'userData'
  const parseUserData = JSON.parse(sessionData);
  const {user, users, loading, error} = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (parseUserData?.role === "admin") {
      dispatch(fetchUsers());
    } else {
      dispatch(fetchUserById(parseUserData?.id));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(filterUsers(searchTerm));
  };

  const columns = [
    {
      id: "No",
      align: "left",
      disablePadding: false,
      label: "Sr. No"
    },
    {
      id: "first_name",
      align: "left",
      disablePadding: true,
      label: "First Name"
    },
    {
      id: "last_name",
      align: "left",
      disablePadding: false,
      label: "Last Name"
    },
    {
      id: "email",
      align: "left",
      disablePadding: false,
      label: "Email"
    },
    {
      id: "role",
      align: "left",
      disablePadding: false,
      label: "role"
    },
    {
      id: "account_balance",
      align: "right",
      disablePadding: false,
      label: "Account Balance"
    },
    {
      id: "account_number",
      align: "right",
      disablePadding: false,
      label: "Account Number"
    }
  ];

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      {parseUserData?.role === "admin" ? (
        <Grid item xs={12} sx={{mb: -2.25}} alignItems="right" display="flex">
          <form>
            <OutlinedInput type="text" onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search" />
          </form>
          <Button size="small" onClick={(e) => handleSearch(e)} variant="contained" color="primary">
            Search
          </Button>
        </Grid>
      ) : null}

      {loading && <Loader />}
      {error && <p>Error: {error}</p>}

      <Grid item xs={12} md={7} lg={12}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5">Active Users</Typography>
          </Grid>
          <Grid item />
        </Grid>
        <MainCard sx={{mt: 2}} content={false}>
          <OrderTable data={parseUserData?.role === "admin" ? users : [user]} columns={columns} />
        </MainCard>
      </Grid>
      {parseUserData?.role === "admin" ? (
        <Grid item xs={12} md={7} lg={12}>
          <CreateAccount />
        </Grid>
      ) : null}
    </Grid>
  );
}
