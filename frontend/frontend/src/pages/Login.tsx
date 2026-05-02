import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      const res = await axios.post('http://localhost:8080/api/v1/auth/login', {
        email,
        password,
      });

      if (res && res.data.success) {
        toast.success("Login successful!", { position: "bottom-left" });
        
        
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
        });
        localStorage.setItem("auth", JSON.stringify(res.data));

        
        if (res.data.user.role === 1) {
          navigate("/dashboard/admin");
        } else {
          
          navigate(location.state || "/");
        }
        
      } else {
        toast.error("Invalid email or password", { position: "bottom-left" });
      }
    } catch (error: any) {
      console.log(error);
      toast.error("Something went wrong. Please try again later.", { position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 card shadow p-4 border-0 rounded-4 mt-5">
          <h3 className="text-center mb-4 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>
            User Login
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Email Address</label>
              <input 
                type="email" 
                className="form-control py-2" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Password</label>
              <input 
                type="password" 
                className="form-control py-2" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            {}
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded-3 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted small">
              New here? <Link to="/register" className="text-primary fw-bold text-decoration-none">Register here</Link>
            </p>
            <Link to="/forgot-password" size="small" className="text-muted text-decoration-none x-small">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;