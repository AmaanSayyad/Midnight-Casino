import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    const savedBalance =
      localStorage.getItem('playTnignt') || localStorage.getItem('userBalance');
    const savedLoading = localStorage.getItem('isLoading');

    let cleanBalance = "0";
    if (savedBalance && !isNaN(savedBalance) && parseFloat(savedBalance) >= 0) {
      cleanBalance = savedBalance;
    } else {
      localStorage.setItem('userBalance', "0");
      localStorage.setItem('playTnignt', "0");
    }

    return {
      userBalance: cleanBalance,
      isLoading: savedLoading === 'true' || false,
    };
  }
  return {
    userBalance: "0",
    isLoading: false,
  };
};

const initialState = loadInitialState();

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setBalance(state, action) {
      const newBalance = action.payload;
      // Ensure balance never goes negative
      if (parseFloat(newBalance) < 0) {
        state.userBalance = "0";
        console.warn('Attempted to set negative balance, setting to 0 instead');
      } else {
        state.userBalance = newBalance;
      }
      // Persist to localStorage (both keys — reconnect must not wipe play chips)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userBalance', state.userBalance);
        localStorage.setItem('playTnignt', state.userBalance);
      }
    },
    addToBalance(state, action) {
      const amountToAdd = parseFloat(action.payload);
      const currentBalance = parseFloat(state.userBalance);
      const newBalance = Math.max(0, currentBalance + amountToAdd).toFixed(5);
      state.userBalance = newBalance;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userBalance', newBalance);
        localStorage.setItem('playTnignt', newBalance);
      }
    },
    subtractFromBalance(state, action) {
      const amountToSubtract = parseFloat(action.payload);
      const currentBalance = parseFloat(state.userBalance);
      const newBalance = Math.max(0, currentBalance - amountToSubtract).toFixed(5);
      state.userBalance = newBalance;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userBalance', newBalance);
        localStorage.setItem('playTnignt', newBalance);
      }
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoading', action.payload.toString());
      }
    },
  },
});

export const { setBalance, addToBalance, subtractFromBalance, setLoading } = balanceSlice.actions;

// Utility functions for localStorage operations
export const loadBalanceFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userBalance') || "0";
  }
  return "0";
};

export const saveBalanceToStorage = (balance) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userBalance', balance);
  }
};

export default balanceSlice.reducer;
