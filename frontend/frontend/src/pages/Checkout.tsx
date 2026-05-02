import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io("http://localhost:8080");

const Checkout: React.FC = () => {
  const [auth] = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]); 
  const [invoiceTotal, setInvoiceTotal] = useState(0); 
  const [invoiceShipping, setInvoiceShipping] = useState(0); 
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [dbOrderId, setDbOrderId] = useState(""); 
  const [showInvoice, setShowInvoice] = useState(false);
  const [loading, setLoading] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    name: auth?.user?.name || "",
    phone: "",
    address: "",
    location: "inside" 
  });

  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cart') || '[]');
    if (data.length === 0 && !showInvoice) {
      navigate('/cart');
    }
    setCartItems(data);
  }, [navigate, showInvoice]);

  const shippingCharge = shippingInfo.location === 'inside' ? 500 : 1000;
  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const grandTotal = subTotal + shippingCharge;

  const isFormValid = 
    shippingInfo.name.trim().length > 0 && 
    shippingInfo.phone.trim().length >= 10 && 
    shippingInfo.address.trim().length > 5 && 
    paymentMethod !== '';

  const handleConfirmOrder = async () => {
    if (!auth?.token) return toast.error("Please login to place an order");

    try {
      setLoading(true);
      const finalCart = cartItems.map(item => ({ ...item, productId: item.productId || item._id }));

      const { data } = await axios.post('http://localhost:8080/api/v1/auth/place-order', {
        cart: finalCart,
        paymentMethod,
        totalAmount: grandTotal,
        shippingAddress: shippingInfo,
        shippingCharge: shippingCharge
      }, {
        headers: { Authorization: auth?.token }
      });

      if (data?.success) {
        
        cartItems.forEach((item) => {
          const newStockCount = Number(item.maxStock) - Number(item.quantity);
          socket.emit("stockUpdate", { 
            variantId: item.variantId, 
            newStock: Math.max(0, newStockCount) 
          });
        });

        setDbOrderId(data.order._id);
        setInvoiceItems([...cartItems]); 
        setInvoiceTotal(grandTotal);
        setInvoiceShipping(shippingCharge);

        localStorage.removeItem('cart');
        setCartItems([]);
        window.dispatchEvent(new Event("cartUpdate")); 
        setShowInvoice(true);
        window.scrollTo(0, 0);
        toast.success("Order Placed Successfully!");
      }
    } catch (error: any) {
      toast.error("Placement Failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_FurnitureHub_${dbOrderId}.pdf`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5">
        {!showInvoice ? (
          <div className="row g-4">
            <div className="col-md-8">
              <div className="card shadow-sm border-0 p-4 rounded-4 mb-4">
                <h4 className="fw-bold mb-4 text-primary border-bottom pb-2">Shipping Address</h4>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="small fw-bold">Receiver's Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={shippingInfo.name} onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})} placeholder=" mujahid" />
                  </div>
                  <div className="col-md-6">
                    <label className="small fw-bold">Phone Number <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} placeholder="017XXXXXXXX" />
                  </div>
                  <div className="col-12">
                    <label className="small fw-bold">Full Delivery Address <span className="text-danger">*</span></label>
                    <textarea className="form-control" rows={2} value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})} placeholder="House, Road, Area..."></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="small fw-bold d-block mb-2">Delivery Location</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="location" id="inside" checked={shippingInfo.location === 'inside'} onChange={() => setShippingInfo({...shippingInfo, location: 'inside'})} />
                        <label className="form-check-label" htmlFor="inside">Inside Dhaka (৳500)</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="location" id="outside" checked={shippingInfo.location === 'outside'} onChange={() => setShippingInfo({...shippingInfo, location: 'outside'})} />
                        <label className="form-check-label" htmlFor="outside">Outside Dhaka (৳1000)</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 p-3 rounded-4">
                <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">Payment Method <span className="text-danger">*</span></h6>
                <div className="list-group list-group-flush">
                {['bkash', 'nagad', 'cod'].map((m) => (
                  <label key={m} className={`list-group-item d-flex align-items-center gap-2 py-2 border rounded-3 mb-1 ${paymentMethod === m ? 'bg-light border-primary' : ''}`} style={{cursor:'pointer', fontSize: '14px'}}>
                    <input className="form-check-input mt-0" type="radio" value={m} checked={paymentMethod === m} onChange={(e)=>setPaymentMethod(e.target.value)} />
                    <span className="text-uppercase fw-bold text-muted">{m === 'cod' ? 'Cash on Delivery' : m}</span>
                  </label>
                ))}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm p-4 border-0 rounded-4 sticky-top" style={{top: '100px'}}>
                <h5 className="fw-bold mb-3 border-bottom pb-2">Order Summary</h5>
                <div className="d-flex justify-content-between mb-2 small">
                  <span>Subtotal:</span>
                  <span>৳{subTotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 small">
                  <span>Delivery Charge:</span>
                  <span className="text-danger">+ ৳{shippingCharge}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between h5 fw-bold text-success">
                  <span>Grand Total:</span>
                  <span>৳{grandTotal}</span>
                </div>
                <div className="mt-4 d-flex flex-column gap-2">
                    {isFormValid ? (
                      <button className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow" onClick={handleConfirmOrder} disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : "CONFIRM ORDER"}
                      </button>
                    ) : (
                      <div className="alert alert-warning small text-center py-2 mb-0">
                        Please complete Address & Payment to Order
                      </div>
                    )}
                    <button className="btn btn-light w-100 py-2 fw-bold rounded-pill border" onClick={() => navigate('/cart')}>
                      BACK TO CART
                    </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row justify-content-center">
            <div className="col-md-10">
              <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                <div ref={invoiceRef} className="p-5 bg-white mx-auto" style={{ width: '100%' }}>
                  <div className="d-flex justify-content-between border-bottom pb-3 mb-4">
                    <h2 className="fw-bold m-0 text-dark">FURNITURE<span className="text-primary">HUB</span></h2>
                    <h4 className="text-muted m-0 fw-bold">INVOICE</h4>
                  </div>
                  <div className="row mb-5 text-start small">
                    <div className="col-6">
                      <p className="mb-0 text-muted text-uppercase fw-bold">Shipping To:</p>
                      <h6 className="fw-bold m-0">{shippingInfo.name}</h6>
                      <p className="mb-0">{shippingInfo.phone} | {shippingInfo.address}</p>
                      <span className="badge bg-light text-dark border mt-1">{shippingInfo.location === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}</span>
                    </div>
                    <div className="col-6 text-end">
                      <p className="mb-0"><strong>Order ID:</strong> #{dbOrderId}</p>
                      <p className="mb-0"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p className="mb-0 text-primary fw-bold"><strong>Status:</strong> {paymentMethod === 'cod' ? 'UNPAID' : 'PAID'}</p>
                    </div>
                  </div>
                  <table className="table table-bordered align-middle small">
                    <thead className="table-dark">
                      <tr><th>Item Description</th><th className="text-center">Price</th><th className="text-center">Qty</th><th className="text-end pe-3">Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, i) => (
                        <tr key={i}>
                          <td><strong>{item.name}</strong><br/><small>{item.color} | {item.material}</small></td>
                          <td className="text-center">৳{item.price}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end pe-3">৳{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="fw-bold">
                      <tr><td colSpan={3} className="text-end">Subtotal:</td><td className="text-end pe-3">৳{invoiceTotal - invoiceShipping}</td></tr>
                      <tr><td colSpan={3} className="text-end text-danger">Shipping Charge:</td><td className="text-end pe-3 text-danger">৳{invoiceShipping}</td></tr>
                      <tr className="bg-light text-success h5"><td colSpan={3} className="text-end">Grand Total:</td><td className="text-end pe-3">৳{invoiceTotal}</td></tr>
                    </tfoot>
                  </table>
                </div>
                <div className="card-footer bg-light p-4 text-center d-flex justify-content-center gap-3">
                    <button className="btn btn-primary px-4 rounded-pill fw-bold shadow" onClick={handleDownloadInvoice}>Download PDF</button>
                    <button className="btn btn-danger px-4 rounded-pill fw-bold" onClick={() => navigate('/')}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout;