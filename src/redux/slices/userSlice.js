import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";
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

  const exchangeRateResponse = await axios.get("https://v6.exchangerate-api.com/v6/0d6800639b345e06a3798d4d/latest/USD")

  const conversionRates = exchangeRateResponse?.data?.conversion_rates;
  console.log("conversionRates", conversionRates)

  function convertCurrency(amount, fromCurrency, toCurrency) {
    console.log("amount, fromCurrency, toCurrency", amount, fromCurrency, toCurrency)
    if (fromCurrency === toCurrency) {
      return amount; // No conversion needed
    }
  
    // Get the conversion rate between the two currencies
    const rate = conversionRates[toCurrency] / conversionRates[fromCurrency];
    
    if (!rate) {
      toast.error(`No conversion rate available for ${fromCurrency} to ${toCurrency}`)
      throw new Error(`No conversion rate available for ${fromCurrency} to ${toCurrency}`);
    }
  
    // Apply a 0.01 (1%) spread
    const conversionWithSpread = amount * rate * 0.99; // 0.99 accounts for 1% spread
    console.log("conversionRates", conversionWithSpread)
    return conversionWithSpread;
  }

  try {
    // Fetch recipient's current balance
    const {data: recipient, error: recipientFetchError} = await supabase
      .from("users")
      .select("account_balance")
      .eq("account_number", transferData.account_number)
      .single();

    if (recipientFetchError || !recipient) {
      toast.error("Error fetching recipient balance")
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
      toast.error("Error fetching recipient balance")
      console.error("Error updating recipient balance:", recipientUpdateError);
      throw recipientUpdateError;
    }

    console.log("Recipient balance updated:", updatedRecipient);

    // Fetch sender's current balance
    const {data: sender, error: senderFetchError} = await supabase
      .from("users")
      .select("*")
      .eq("id", transferData.id)
      .single();

    if (senderFetchError || !sender) {
      toast.error("Error fetching sender balance")
      console.error("Error fetching sender balance:", senderFetchError);
      throw senderFetchError || new Error("Sender not found");
    }


     // Determine if a conversion is necessary
     let amountToCredit = parseInt(transferData.amount); // Amount to credit the recipient
     if (sender.currency !== transferData.currency) {
       // Convert the amount with a 1% spread
       amountToCredit = convertCurrency(parseInt(transferData.amount), sender.currency, transferData.currency);
     }

    const newSenderBalance = parseInt(sender.account_balance) - amountToCredit;

    // Update sender's balance
    const {data: updatedSender, error: senderUpdateError} = await supabase
      .from("users")
      .update({account_balance: newSenderBalance})
      .eq("id", transferData.id);

    if (senderUpdateError) {
      toast.error("Error fetching sender balance")
      console.error("Error updating sender balance:", senderUpdateError);
      throw senderUpdateError;
    }

    console.log("Sender balance updated:", updatedSender);

    // Return the updated balances for both users
    toast.success("Found Transfer Successfully");
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
