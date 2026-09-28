// Define qué página se muestra en cada ruta (URL) del frontend
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import RutaProtegida from "./components/RutaProtegida";
import CatalogoPage from "./pages/CatalogoPage";
import LoginPage from "./pages/LoginPage";
import RegistroPage from "./pages/RegistroPage";
import PerfilPage from "./pages/PerfilPage";
import AdminProductosPage from "./pages/AdminProductosPage";
import InventarioPage from "./pages/InventarioPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<CatalogoPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />

            {/* Requieren sesión */}
            <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />

            {/* Requieren un rol específico */}
            <Route
              path="/admin/productos"
              element={<RutaProtegida roles={["ADMINISTRADOR"]}><AdminProductosPage /></RutaProtegida>}
            />
            <Route
              path="/inventario"
              element={<RutaProtegida roles={["ADMINISTRADOR", "VENDEDOR"]}><InventarioPage /></RutaProtegida>}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
