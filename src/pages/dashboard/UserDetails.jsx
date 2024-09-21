// material-ui
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";

// project import
import MainCard from "components/MainCard";
import {useDispatch, useSelector} from "react-redux";
import {useEffect} from "react";
import {fetchUserById, foundTransfer} from "redux/slices/userSlice";
import Loader from "components/Loader";
import OrderTable from "pages/dashboard/OrdersTable";
import {useParams} from "react-router-dom";
import AnimateButton from "components/@extended/AnimateButton";

// third party
import * as Yup from "yup";
import {Formik} from "formik";
import {MenuItem, Select} from "@mui/material";

export default function UserDetails() {
  const dispatch = useDispatch();
  const {id} = useParams();
  console.log("id", id);
  const {user, loading, error} = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUserById(id));
  }, [dispatch, id]);

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

      {loading && <Loader />}
      {error && <p>Error: {error}</p>}

      <Grid item xs={12} md={7} lg={8}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5">Users</Typography>
          </Grid>
          <Grid item />
        </Grid>
        <MainCard sx={{mt: 2}} content={false}>
          <OrderTable data={[user]} columns={columns} />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={7} lg={4}>
        <Grid spacing={3}>
          <Formik
            initialValues={{
              account_number: "",
              amount: "",
              currency: ""
            }}
            validationSchema={Yup.object().shape({
              account_number: Yup.string().max(8).required("Recipient Account Number"),
              amount: Yup.string().max(9).required("Amount is required")
            })}
            onSubmit={async (data) => {
              const params = {
                ...data,
                id: id
              };
              await dispatch(foundTransfer(params));
              await dispatch(fetchUserById(id));
            }}
          >
            {({errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values}) => (
              <form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="account_number-login">Recipient Account Number</InputLabel>
                      <OutlinedInput
                        id="account_number-login"
                        type="number"
                        value={values.account_number}
                        name="account_number"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Recipient Account Number"
                        fullWidth
                        error={Boolean(touched.account_number && errors.account_number)}
                      />
                    </Stack>
                    {touched.account_number && errors.account_number && (
                      <FormHelperText error id="standard-weight-helper-text-email-login">
                        {errors.account_number}
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="amount-login">Amount</InputLabel>
                      <OutlinedInput
                        fullWidth
                        error={Boolean(touched.amount && errors.amount)}
                        id="amount-login"
                        type={"text"}
                        value={values.amount}
                        name="amount"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Enter Amount"
                      />
                    </Stack>
                    {touched.amount && errors.amount && (
                      <FormHelperText error id="standard-weight-helper-text-password-login">
                        {errors.amount}
                      </FormHelperText>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="amount-login">Currency</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        onBlur={handleBlur}
                        value={values.currency}
                        label="Currency"
                        name="currency"
                        onChange={handleChange}
                        placeholder="Select Currency"
                      >
                        <MenuItem value={"USD"}>USD</MenuItem>
                        <MenuItem value={"GBP"}>GBP</MenuItem>
                        <MenuItem value={"EUR"}>EUR</MenuItem>
                      </Select>
                    </Stack>
                    {touched.currency && errors.currency && (
                      <FormHelperText error id="standard-weight-helper-text-password-login">
                        {errors.currency}
                      </FormHelperText>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <AnimateButton>
                      <Button
                        disableElevation
                        disabled={isSubmitting}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                      >
                        Transfer
                      </Button>
                    </AnimateButton>
                  </Grid>
                </Grid>
              </form>
            )}
          </Formik>
        </Grid>
      </Grid>
    </Grid>
  );
}
