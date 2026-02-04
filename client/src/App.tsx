import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import StaffList from "./pages/Staff/StaffList";
import ClientList from "./pages/Clients/ClientList";
import ProjectList from "./pages/Projects/ProjectList";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
    return (
        <>
            <AuthProvider>
                <Router>
                    <ScrollToTop />
                    <Routes>
                        {/* Auth Layout */}
                        <Route path="/signin" element={<SignIn />} />

                        {/* Dashboard Layout - Protected */}
                        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                            <Route index path="/" element={<Home />} />
                            <Route path="/staff" element={<StaffList />} />
                            <Route path="/clients" element={<ClientList />} />
                            <Route path="/projects" element={<ProjectList />} />
                        </Route>

                        {/* Fallback Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </>
    );
}
