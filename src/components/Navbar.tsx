import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, empresa, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login");
  };

  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const esVendedor = usuario?.rol === "VENDEDOR";
  const esSuperadmin = usuario?.rol === "SUPERADMIN";

  return (
    <header className="navbar">
      <div className="navbar-contenido">

        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icono">K</span>
          <span>KAIRÓS</span>
        </Link>

        {/* Navegación */}
        <nav className="navbar-nav">
          <NavLink to="/" end>
            Catálogo
          </NavLink>

          {usuario && (
            <NavLink to="/perfil">
              Mi perfil
            </NavLink>
          )}

          {esAdmin && (
            <NavLink to="/admin/productos">
              Productos
            </NavLink>
          )}

          {esAdmin && (
            <NavLink to="/admin/almacenes">
              Sedes
            </NavLink>
          )}

          {esAdmin && (
            <NavLink to="/admin/usuarios">
              Usuarios
            </NavLink>
          )}

          {(esAdmin || esVendedor) && (
            <NavLink to="/inventario">
              Inventario
            </NavLink>
          )}

          {(esAdmin || esVendedor) && (
            <NavLink to="/ventas">
              Ventas
            </NavLink>
          )}

          {esSuperadmin && (
            <NavLink to="/superadmin/empresas">
              Empresas
            </NavLink>
          )}
        </nav>

        {/* Usuario */}
        <div className="navbar-usuario">
          {usuario ? (
            <>
              <div className="usuario-info">
                <div className="usuario-avatar">
                  {usuario.nombre?.charAt(0).toUpperCase()}
                </div>

                <div className="usuario-datos">
                  <span className="usuario-nombre">
                    {usuario.nombre}
                  </span>

                  <span className="etiqueta">
                    {usuario.rol}
                  </span>

                  {empresa && (
                    <span className="texto-ayuda">
                      {empresa.nombre}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="btn-salir"
                onClick={salir}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ingresar">
                Ingresar
              </NavLink>

              <NavLink to="/registro" className="btn-registrarse">
                Registrarse
              </NavLink>
            </>
          )}
        </div>

      </div>
    </header>
  );
}