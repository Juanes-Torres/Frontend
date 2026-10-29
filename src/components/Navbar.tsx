// Barra superior (Figma: "Barra superior" y "Barra superadmin")
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, empresa, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    void navigate("/login");   // navigate puede devolver una promesa: no hace falta esperarla
  };

  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const esVendedor = usuario?.rol === "VENDEDOR";
  const esSuperadmin = usuario?.rol === "SUPERADMIN";

  return (
    <header className="navbar">
      <div className="navbar-contenido">
        <div className="navbar-marca">
          <Link to="/" className="logo" aria-label="KAIRÓS, ir al catálogo">
            <span className="logo-icono">K</span>
            <span>KAIRÓS</span>
          </Link>

          <nav className="navbar-nav" aria-label="Menú principal">
            {/* El superadmin administra la plataforma: no compra ni vende */}
            {!esSuperadmin && <NavLink to="/" end>Catálogo</NavLink>}
            {usuario && <NavLink to="/perfil">Mi perfil</NavLink>}
            {esAdmin && <NavLink to="/admin/productos">Productos</NavLink>}
            {esAdmin && <NavLink to="/admin/almacenes">Sedes</NavLink>}
            {esAdmin && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
            {(esAdmin || esVendedor) && <NavLink to="/inventario">Inventario</NavLink>}
            {(esAdmin || esVendedor) && <NavLink to="/ventas">Ventas</NavLink>}
            {esSuperadmin && <NavLink to="/superadmin/empresas">Empresas</NavLink>}
          </nav>
        </div>

        <div className="navbar-usuario">
          {usuario ? (
            <>
              <div className="usuario-info">
                <div className="usuario-avatar" aria-hidden="true">
                  {usuario.nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="usuario-datos">
                  <span className="usuario-nombre">{usuario.nombre}</span>
                  {/* Rol y, para los empleados, su empresa: "ADMINISTRADOR · TECNO SAS" */}
                  <span className="usuario-rol">
                    {usuario.rol}{empresa && ` · ${empresa.nombre.toUpperCase()}`}
                  </span>
                </div>
              </div>
              <button className="btn-salir" onClick={salir}>Salir</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ingresar">Ingresar</NavLink>
              <NavLink to="/registro" className="btn-registrarse">Registrarse</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
