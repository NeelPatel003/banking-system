import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import {supabase} from "supabaseClient";

export const fetchUsers = createAsyncThunk("user/fetchUsers", async () => {
  const {data, error} = await supabase.from("users").select("*");

  if (error) throw new Error(error.message);
  return data;
});

export const fetchUserById = createAsyncThunk("user/fetchUserById", async (id) => {
  const {data, error} = await supabase.from("users").select("*").eq("id", id).single();

  if (error) throw new Error(error.message);
  return data;
});

export const filterUsers = createAsyncThunk("user/filterUsers", async (searchTerm) => {
  const {data, error} = await supabase.from("users").select("*").ilike("first_name", `%${searchTerm}%`); // Filtering by username (or other fields)

  if (error) throw new Error(error.message);
  return data;
});

export const foundTransfer = createAsyncThunk("user/foundTransfer", async (transferData) => {
  console.log("Transfer Data:", transferData);

  try {
    // Fetch recipient's current balance
    const {data: recipient, error: recipientFetchError} = await supabase
      .from("users")
      .select("account_balance")
      .eq("account_number", transferData.account_number)
      .single();

    if (recipientFetchError || !recipient) {
      console.error("Error fetching recipient balance:", recipientFetchError);
      throw recipientFetchError || new Error("Recipient not found");
    }

    const newRecipientBalance = parseInt(recipient.account_balance) + parseInt(transferData.amount);

    // Update recipient's balance
    const {data: updatedRecipient, error: recipientUpdateError} = await supabase
      .from("users")
      .update({account_balance: newRecipientBalance})
      .eq("account_number", transferData.account_number);

    if (recipientUpdateError) {
      console.error("Error updating recipient balance:", recipientUpdateError);
      throw recipientUpdateError;
    }

    console.log("Recipient balance updated:", updatedRecipient);

    // Fetch sender's current balance
    const {data: sender, error: senderFetchError} = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", transferData.id)
      .single();

    if (senderFetchError || !sender) {
      console.error("Error fetching sender balance:", senderFetchError);
      throw senderFetchError || new Error("Sender not found");
    }

    const newSenderBalance = parseInt(sender.account_balance) - parseInt(transferData.amount);

    // Update sender's balance
    const {data: updatedSender, error: senderUpdateError} = await supabase
      .from("users")
      .update({account_balance: newSenderBalance})
      .eq("id", transferData.id);

    if (senderUpdateError) {
      console.error("Error updating sender balance:", senderUpdateError);
      throw senderUpdateError;
    }

    console.log("Sender balance updated:", updatedSender);

    // Return the updated balances for both users
    toast.success("FOund Transfer Successfully");
    return {updatedRecipient, updatedSender};
  } catch (error) {
    console.error("Error during fund transfer:", error);
    throw error; // Ensure the error is caught by createAsyncThunk
  }
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    user: null,
    loading: false,
    error: null
  },

  extraReducers: (builder) => {
    // For fetching all users (admin)
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // For fetching user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // For filtering users
    builder
      .addCase(filterUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(filterUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(filterUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default userSlice.reducer;
