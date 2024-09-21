// src/features/user/authSlice.js
import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import {supabase} from "supabaseClient";
import {toast} from "react-toastify";
// Function to generate a random 8-digit account number
const generateAccountNumber = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const signUpUser = createAsyncThunk("auth/signUpUser", async (userData) => {
  const {first_name, last_name, email, password, role, account_balance} = userData;
  const account_number = generateAccountNumber();
  const {data, error} = await supabase.from("users").insert([{first_name, last_name, email, password, role, account_number, account_balance}]);

  if (error) {
    console.log("errr", error);
    toast.error(error.message); // Show failure toast
  }
  return data;
});

export const loginUser = createAsyncThunk("auth/loginUser", async ({email, password}) => {
  console.log("email, password", email, password);
  const {data, error} = await supabase.from("users").select("*").match({email: email, password: password});
  sessionStorage.setItem("userData", JSON.stringify(data[0]));
  if (error || data.length === 0) {
    toast.error("Invalid Credential");
  }
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null
  },
  reducers: {
    logoutUser(state) {
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const {logoutUser} = authSlice.actions;
export default authSlice.reducer;
