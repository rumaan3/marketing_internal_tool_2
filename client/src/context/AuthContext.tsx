import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/axios";

interface User {
    id: string;
    name: string;
    email: string;
    role: "superuser" | "admin" | "staff" | "client";
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                try {
                    const response = await api.get("/auth/me");
                    setUser(response.data.user);
                    setToken(storedToken);
                } catch {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post("/auth/login", { email, password });
            const { token: newToken, user: userData } = response.data;
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser(userData);
        } catch (error: any) {
            const message = error.response?.data?.message || "Login failed. Please try again.";
            throw new Error(message);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token && !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
