import { createSlice } from "@reduxjs/toolkit";

// Agar is browser ne pehle kabhi login kiya tha tabhi backend se get-me pooch ke wait karenge.
// Warna loading shuru se false -> user ko turant /login dikhega.
function hadSession() {
    try {
        return localStorage.getItem("hasSession") === "1"
    } catch {
        return true // localStorage na chale to purana behaviour (safe side)
    }
}

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        loading: hadSession(),
        error: null,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        }
    }
})

export const { setUser, setLoading, setError } = authSlice.actions
export default authSlice.reducer