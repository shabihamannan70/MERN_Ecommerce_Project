import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const socket = io("http://localhost:8080");

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const IMG_URL = "http://localhost:8080/uploads/";

  
  const loadCart = () => {
    const data = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(data);
  };

  useEffect(() => {
    loadCart();

    
    socket.on("productUpdate", (updatedProduct: any) => {
      setCartItems((prevItems) => {
        const updatedCart = prevItems.map(item => {
          if (item.productId === updatedProduct._id) {
            return { ...item, name: updatedProduct.name, image: updatedProduct.image };
          }
          return item;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    });

   
    socket.on("stockUpdate", (data: { variantId: string, newStock: number }) => {
      setCartItems((prevItems) => {
        const updatedCart = prevItems.map(item => {
          if (item.variantId === data.variantId) {
            const updatedStock = Number(data.newStock);
            let currentQty = item.quantity;

           
            if (item.quantity > updatedStock) {
              currentQty = updatedStock > 0 ? updatedStock : 0;
              toast.warn(`Stock updated for ${item.name}!`, { toastId: data.variantId });
            }
            return { ...item, maxStock: updatedStock, quantity: currentQty };
          }
          return item;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return [...updatedCart];
      });
    });

    
    socket.on("cartClear", (data: { buyerId: string }) => {
      if (auth?.user?._id === data.buyerId) {
        localStorage.removeItem('cart');
        setCartItems([]);
        window.dispatchEvent(new Event("cartUpdate"));
      }
    });

    
    window.addEventListener("cartUpdate", loadCart);
    
    return () => {
      socket.off("stockUpdate");
      socket.off("productUpdate");
      socket.off("cartClear");
      window.removeEventListener("cartUpdate", loadCart);
    };
  }, [auth?.user?._id]);

  
  const updateQuantity = (index: number, action: 'increase' | 'decrease') => {
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    const limit = Number(item.maxStock);

    if (action === 'increase') {
      if (item.quantity < limit) {
        item.quantity += 1;
      } else {
        toast.error(`Limit reached! Only ${limit} available.`);
        return;
      }
    } else if (action === 'decrease' && item.quantity > 1) {
      item.quantity -= 1;
    }

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  
  const removeItem = (index: number) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const handleCheckout = () => {
    if (!auth?.token) {
      navigate("/login", { state: "/cart" });
      return;
    }
   
    if (cartItems.some(item => Number(item.maxStock) <= 0)) {
      toast.error("Please remove out-of-stock items first!");
      return;
    }
    navigate('/checkout');
  };

  
  const totalQuantity = cartItems.reduce((acc, item) => item.maxStock > 0 ? acc + item.quantity : acc, 0);
  const totalPrice = cartItems.reduce((acc, item) => item.maxStock > 0 ? acc + (item.price * item.quantity) : acc, 0);

  
  const isOutOfStockInCart = cartItems.length > 0 && cartItems.some(item => Number(item.maxStock) <= 0);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4 fw-bold text-uppercase border-bottom pb-2">Shopping Cart</h3>
        {cartItems.length === 0 ? (
          <div className="text-center py-5 border rounded-4 bg-light shadow-sm">
            <h5 className="text-muted">Your cart is empty!</h5>
            <button className="btn btn-primary mt-3 px-4 rounded-pill" onClick={() => navigate('/')}>Shop Now</button>
          </div>
        ) : (
          <div className="row g-4 mb-5">
            <div className="col-md-8">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <table className="table align-middle text-center mb-0">
                  <thead className="table-dark">
                    <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => {
                      const isOutOfStock = Number(item.maxStock) <= 0;
                      return (
                        <tr key={index} className={isOutOfStock ? "table-danger" : ""}>
                          <td className="text-start ps-3">
                            <img src={`${IMG_URL}${item.image}`} width="40" height="40" className="rounded me-2 border shadow-sm" alt="" onError={(e) => (e.target as any).src='https://placehold.co/40'} />
                            <span className="small fw-bold">{item.name} ({item.color})</span>
                          </td>
                          <td>৳{item.price}</td>
                          <td>
                            {!isOutOfStock ? (
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <button className="btn btn-sm btn-outline-secondary" style={{width:'30px'}} onClick={() => updateQuantity(index, 'decrease')}>-</button>
                                <span className="fw-bold" style={{minWidth:'20px'}}>{item.quantity}</span>
                                <button className="btn btn-sm btn-outline-secondary" style={{width:'30px'}} onClick={() => updateQuantity(index, 'increase')}>+</button>
                              </div>
                            ) : (
                              <span className="badge bg-danger">STOCK OUT</span>
                            )}
                          </td>
                          <td className="fw-bold">৳{!isOutOfStock ? item.price * item.quantity : 0}</td>
                          <td><button className="btn btn-sm text-danger" onClick={() => removeItem(index)}><FaTrash className="mb-1"/></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {}
            <div className="col-md-4">
              <div className="card shadow-sm p-4 border-0 rounded-4 sticky-top" style={{top:'100px'}}>
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">Order Summary</h5>
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Total Items:</span>
                  <span className="fw-bold">{totalQuantity} Units</span>
                </div>

                <div className="mb-3">
                  <span className="text-muted small">Price Breakdown:</span>
                  <div className="mt-1" style={{maxHeight: '120px', overflowY: 'auto'}}>
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between small border-bottom py-1">
                        <span className="text-truncate" style={{maxWidth: '150px'}}>{item.name}</span>
                        <span className={Number(item.maxStock) <= 0 ? 'text-danger fw-bold' : ''}>
                           {Number(item.maxStock) <= 0 ? 'Sold Out' : `৳${item.price} x ${item.quantity}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between h4 fw-bold">
                  <span>Grand Total:</span>
                  <span className="text-success">৳{totalPrice}</span>
                </div>

                <div className="d-flex flex-column gap-2 mt-3">
                  {}
                  <button 
                    className={`btn py-2 fw-bold rounded-pill shadow-sm ${isOutOfStockInCart ? 'btn-danger' : 'btn-primary'}`}
                    onClick={handleCheckout}
                    disabled={isOutOfStockInCart}
                  >
                    {isOutOfStockInCart ? "STOCK OUT - REMOVE ITEMS" : "PROCEED TO CHECKOUT"}
                  </button>

                  <button className="btn btn-outline-dark py-2 fw-bold rounded-pill shadow-sm" onClick={() => navigate('/')}>
                    CONTINUE SHOPPING
                  </button>
                </div>
                {isOutOfStockInCart && (
                  <p className="small text-danger mt-2 text-center">Some items are sold out. Remove them to proceed.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};


const FaTrash = ({className}: any) => <span className={className}>🗑️</span>;

export default Cart;