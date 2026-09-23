import { useDispatch } from "react-redux";
import { register, login, getMe, logout } from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";


export function useAuth() {


    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await register({ email, username, password })
            return { success: true, data }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                "Registration failed"
            dispatch(setError(message))
            return { success: false, message }
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            return { success: true, data }
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.msg ||
                "Login failed"
            dispatch(setError(message))
            return { success: false, message }
        } finally {
            dispatch(setLoading(false))
        }
    }


    async function handleGetMe() {
        try {
            dispatch(setLoading(true))
            const data = await getMe()
            dispatch(setUser(data.user))
            return { success: true, data }
        } catch (err) {
            // Runs once on app load to check for an existing session — a 401 here
            // just means "not logged in yet", so it should stay silent, not surface
            // as a form error.
            return { success: false }
        } finally {
            dispatch(setLoading(false))
        }
    }


    async function handleLogout() {
        try {
            await logout()
        } catch (err) {
            // even if the network call fails, clear the local session so the
            // user isn't stuck "logged in" on a dead cookie
        } finally {
            dispatch(setUser(null))
        }
    }


    return {
        handleLogin,
        handleGetMe,
        handleRegister,
        handleLogout
    }
}