import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUserCircle, FaSignOutAlt, FaTachometerAlt, FaHome } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar: React.FC = () => {
  const [auth, setAuth] = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  
  const updateCount = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      const total = cart.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
      setCartCount(total);
    } catch (err) {
      setCartCount(0);
    }
  }, []);

  
  useEffect(() => {
    updateCount();
    
    const handleCartUpdate = () => {
      updateCount();
    };

    window.addEventListener("cartUpdate", handleCartUpdate);
    
    
    return () => {
      window.removeEventListener("cartUpdate", handleCartUpdate);
    };
  }, [updateCount]);

 
  const handleLogout = () => {
    setAuth({ ...auth, user: null, token: "" });
    localStorage.removeItem("auth");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  
  const isAdminPage = location.pathname.startsWith("/dashboard");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top py-2 shadow-sm">
      <div className="container">
        {}
        <Link className="navbar-brand fw-bold fs-3 text-uppercase" to="/">
          Furniture<span className="text-primary">HUB</span>
        </Link>

        {}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link className={`nav-link d-flex align-items-center gap-2 ${location.pathname === '/' ? 'active text-primary' : ''}`} to="/">
                <FaHome /> Home
              </Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3 gap-lg-4">
            {}
            {!isAdminPage && (
              <Link to="/cart" className="text-white position-relative p-2" title="View Cart">
                <FaShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark" 
                        style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {}
            {!auth?.user ? (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-primary rounded-pill px-4 btn-sm fw-bold">
                  Login
                </Link>
              </div>
            ) : (
              
              <div className="d-flex align-items-center gap-3">
                
                {auth?.user?.role === 1 && !isAdminPage && (
                  <Link 
                    to="/dashboard/admin" 
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold d-none d-md-flex align-items-center gap-1"
                  >
                    <FaTachometerAlt /> Dashboard
                  </Link>
                )}

                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light dropdown-toggle rounded-pill px-3 d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-25" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <FaUserCircle size={20} className="text-primary" /> 
                    <span className="d-none d-sm-inline">{auth.user.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2 rounded-3">
                    {auth?.user?.role === 1 && (
                       <li className="d-md-none">
                         <Link className="dropdown-item py-2" to="/dashboard/admin">Dashboard</Link>
                       </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button onClick={handleLogout} className="dropdown-item text-danger py-2 d-flex align-items-center gap-2 rounded">
                        <FaSignOutAlt /> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;