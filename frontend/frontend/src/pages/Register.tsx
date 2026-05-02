import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Register = () => {
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      const res = await axios.post('http://localhost:8080/api/v1/auth/register', {
        name,
        email,
        password,
      });

      if (res.data.success) {
        
        toast.success(res.data.message || "Registration successful! Please login.",{position:"bottom-left"});
        navigate("/login");
      } else {
        toast.error(res.data.message || "Registration failed",{position:"bottom-left"});
      }
    } catch (error: any) {
      console.log(error);
      
      toast.error(error.response?.data?.message || "Internal server error. Please try again.",{position:"bottom-left"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 card shadow p-4 border-0 rounded-4">
          <h3 className="text-center mb-4 fw-bold text-uppercase">Sign Up</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold">Full Name</label>
              <input 
                type="text" 
                className="form-control py-2" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            
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
                placeholder="Choose a strong password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-success w-100 py-2 fw-bold shadow-sm"
              disabled={loading}
            >
              {loading ? "Processing..." : "Register Now"}
            </button>
          </form>

          <p className="mt-4 text-center text-muted small">
            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;