import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, Shell } from "./components/Layout";
import { useSession } from "./hooks/useDb";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AspirantDashboard } from "./pages/AspirantDashboard";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RegisterAspirant } from "./pages/RegisterAspirant";
import { StudentDashboard } from "./pages/StudentDashboard";
import { mockDb } from "./services/mockDb";

export const App = () => {
  const { session, setSession } = useSession();
  const refreshSession = () => setSession(mockDb.getSession());

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell session={session} />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login refreshSession={refreshSession} />} />
          <Route path="register" element={<Register />} />
          <Route path="register-aspirant" element={<RegisterAspirant />} />
          <Route element={<ProtectedRoute session={session} role="admin" />}>
            <Route path="admin" element={session ? <AdminDashboard session={session} /> : null} />
          </Route>
          <Route element={<ProtectedRoute session={session} role="student" />}>
            <Route path="dashboard" element={session ? <StudentDashboard session={session} /> : null} />
          </Route>
          <Route element={<ProtectedRoute session={session} role="aspirant" />}>
            <Route path="aspirant" element={session ? <AspirantDashboard session={session} /> : null} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
