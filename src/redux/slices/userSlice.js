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
      .select("*")
      .eq("account_number", transferData.account_number)
      .single();

    if (recipientFetchError || !recipient) {
      toast.error("Error fetching recipient balance+++")
      console.error("Error fetching recipient balance:", recipientFetchError);
      throw recipientFetchError || new Error("Recipient not Funds");
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
      throw senderFetchError || new Error("Sender not Funds");
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


      // Record the transaction for the recipient (Credit)
    const { data: recipientTransaction, error: recipientTransactionError } = await supabase
    .from("transaction_history")
    .insert({
      mainId: recipient.id,
      sender_id: sender.id,
      recipient_id: recipient.id,
      amount: `${amountToCredit}`,  // Use "+" for credits
      currency: transferData.currency,
      transaction_type: 'credit',
      description: `Funds received from ${sender.account_number}`,
      total_balance: newRecipientBalance, // Store recipient's total balance
      timestamp: new Date().toISOString(),
    });

  if (recipientTransactionError) {
    console.error("Error recording recipient transaction:", recipientTransactionError);
    throw recipientTransactionError;
  }

  // Record the transaction for the sender (Debit)
  const { data: senderTransaction, error: senderTransactionError } = await supabase
    .from("transaction_history")
    .insert({
      mainId: sender.id,
      sender_id: sender.id,
      recipient_id: recipient.id,
      amount: `${transferData.amount}`,  // Use "-" for debits
      currency: transferData.currency,
      transaction_type: 'debit',
      description: `Funds sent to ${recipient.account_number}`,
      total_balance: newSenderBalance,  // Store sender's total balance
      timestamp: new Date().toISOString(),
    });

  if (senderTransactionError) {
    console.error("Error recording sender transaction:", senderTransactionError);
    throw senderTransactionError;
  }

  toast.success("Funds Transfer Successfully");
  return { updatedRecipient, updatedSender, recipientTransaction, senderTransaction };

  } catch (error) {
    console.error("Error during fund transfer:", error);
    throw error; // Ensure the error is caught by createAsyncThunk
  }
});


export const fetchUserTransactionHistory = createAsyncThunk(
  "user/fetchUserTransactionHistory",
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("transaction_history")
        .select("*")
        .or(`mainId.eq.${userId}`)
        .order('timestamp', { ascending: false }) // Fetch in descending order of time

      if (error) {
        console.error("Error fetching transaction history:", error);
        return rejectWithValue(error.message);
      }

      // Ensure unique transactions by checking role
      const filteredData = data.map(transaction => {
        if (transaction.sender_id === userId) {
          return {
            ...transaction,
            transaction_type: "debit",
            amount: `-${transaction.amount}` // Debit transaction, show as negative
          };
        } else if (transaction.recipient_id === userId) {
          return {
            ...transaction,
            transaction_type: "credit",
            amount: `+${transaction.amount}` // Credit transaction, show as positive
          };
        }
        return transaction;
      });

      return filteredData; // Return the processed data
    } catch (error) {
      console.error("Error in transaction history thunk:", error);
      return rejectWithValue(error.message);
    }
  }
);


const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    user: null,
    transactionHistory: [],
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


      // For fetchUserTransactionHistory

      builder
      .addCase(fetchUserTransactionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionHistory = action.payload;
      })
      .addCase(fetchUserTransactionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  }
});

export default userSlice.reducer;
