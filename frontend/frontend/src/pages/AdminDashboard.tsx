import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getAllProducts } from '../api/productApi';
import axios from 'axios';
import { Product } from '../types';
import {
  FaBox, FaPlusCircle, FaTags,
  FaShoppingCart, FaTrash, FaEdit, FaEye, FaBell, FaChartBar, FaSearch, FaPrint, FaMapMarkerAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { useReactToPrint } from 'react-to-print';

const socket = io("http://localhost:8080");

const AdminDashboard: React.FC = () => {
  const [auth] = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'recent-order' | 'category' | 'product' | 'all-order' | 'report'>('recent-order');

  // --- Product States ---
  const [pid, setPid] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [manufactureDate, setManufactureDate] = useState(new Date().toISOString().split('T')[0]);
  const [productDetails, setProductDetails] = useState<any[]>([
    { material: "", dimensions: "", color: "", price: 0, quantity: 0 }
  ]);

  // --- UI & Modal States ---
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [selectedStockView, setSelectedStockView] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>({ totalSales: 0, totalItems: 0, details: [] });

  const IMG_URL = "http://localhost:8080/uploads/";
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Delivery_Address_Slip`,
  });

  const loadData = async () => {
    if (!auth?.token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: auth.token } };
      const [productRes, catRes, orderRes] = await Promise.all([
        getAllProducts(),
        axios.get('http://localhost:8080/api/v1/category/get-category'),
        axios.get('http://localhost:8080/api/v1/auth/all-orders', config)
      ]);
      setProducts(productRes);
      if (catRes.data.success) setCategories(catRes.data.category);
      setOrders(Array.isArray(orderRes.data) ? orderRes.data : orderRes.data.orders || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    socket.on("newOrder", (newOrder) => {
      
      setOrders((prev) => [newOrder, ...prev]);
      toast.info("🔔 New Order Received!");
    });

    socket.on("stockUpdate", (data: { variantId: string, newStock: number }) => {
      setProducts((prevProducts) => {
        return prevProducts.map(p => {
          const updatedDetails = p.productDetails.map(detail =>
            detail._id === data.variantId ? { ...detail, quantity: data.newStock } : detail
          );
          return { ...p, productDetails: updatedDetails };
        });
      });
    });

    return () => {
      socket.off("newOrder");
      socket.off("stockUpdate");
    };
  }, [auth?.token]);

  
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    return orderDate === today;
  });

  const generateReport = () => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    const filtered = orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end; });
    let sales = 0; let items = 0; const map: any = {};
    filtered.forEach(o => {
      sales += o.totalAmount || 0;
      o.products.forEach((p: any) => {
        items += p.quantity;
        const key = `${p.name}-${p.color}`;
        if (!map[key]) map[key] = { name: p.name, color: p.color, qty: 0, price: p.price };
        map[key].qty += p.quantity;
      });
    });
    setReportData({ totalSales: sales, totalItems: items, details: Object.values(map) });
  };


  useEffect(() => {
    if (activeTab === 'report' || activeTab === 'recent-order') {
      generateReport();
    }
  }, [activeTab, orders, startDate, endDate]);


  const handleAddVariant = () => {
    setProductDetails([...productDetails, { material: "", dimensions: "", color: "", price: 0, quantity: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    const list = [...productDetails];
    list.splice(index, 1);
    setProductDetails(list);
  };

  const handleDetailChange = (index: number, field: string, value: any) => {
    setProductDetails(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const handleEditClick = (p: any) => {
    setPid(p._id); setName(p.name); setCategory(p.category?._id || "");
    setManufactureDate(p.manufactureDate ? p.manufactureDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setProductDetails(p.productDetails.map((d: any) => ({ ...d })));
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name); formData.append("category", category); formData.append("manufactureDate", manufactureDate);
      if (image) formData.append("image", image);
      formData.append("productDetails", JSON.stringify(productDetails));
      const config = { headers: { Authorization: auth?.token, "Content-Type": "multipart/form-data" } };

      if (pid) {
        await axios.put(`http://localhost:8080/api/v1/product/update-product/${pid}`, formData, config);
        toast.success("Product Updated");
      } else {
        await axios.post('http://localhost:8080/api/v1/product/create-product', formData, config);
        toast.success("Product Created");
      }
      loadData(); resetProductForm();
    } catch (error) { toast.error("Operation Failed"); }
  };

  const resetProductForm = () => {
    setPid(""); setName(""); setCategory(""); setImage(null);
    setProductDetails([{ material: "", dimensions: "", color: "", price: 0, quantity: 0 }]);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/v1/product/delete-product/${id}`, { headers: { Authorization: auth?.token } });
      loadData();
    } catch (error) { toast.error("Delete failed"); }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: auth?.token } };
      if (isEditingCategory) {
        await axios.put(`http://localhost:8080/api/v1/category/update-category/${editCategoryId}`, { name: newCategoryName }, config);
        toast.success("Category Updated");
      } else {
        await axios.post('http://localhost:8080/api/v1/category/create-category', { name: newCategoryName }, config);
        toast.success("Category Created");
      }
      setNewCategoryName(""); setIsEditingCategory(false); loadData();
    } catch (error) { toast.error("Category Action Failed"); }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid m-0 p-4 bg-light min-vh-100">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 sticky-top" style={{ top: '80px' }}>
              <div className="bg-dark text-white p-4 text-center"><h5 className="mb-0 fw-bold">ADMIN PANEL</h5></div>
              <div className="list-group list-group-flush fw-bold">
                <button onClick={() => setActiveTab('recent-order')} className={`list-group-item list-group-item-action py-3 d-flex align-items-center gap-2 ${activeTab === 'recent-order' ? 'active bg-primary text-white' : ''}`}><FaBell /> Today's Order</button>
                <button onClick={() => setActiveTab('category')} className={`list-group-item list-group-item-action py-3 d-flex align-items-center gap-2 ${activeTab === 'category' ? 'active bg-primary text-white' : ''}`}><FaTags /> Category</button>
                <button onClick={() => setActiveTab('product')} className={`list-group-item list-group-item-action py-3 d-flex align-items-center gap-2 ${activeTab === 'product' ? 'active bg-primary text-white' : ''}`}><FaBox /> Product</button>
                <button onClick={() => setActiveTab('all-order')} className={`list-group-item list-group-item-action py-3 d-flex align-items-center gap-2 ${activeTab === 'all-order' ? 'active bg-primary text-white' : ''}`}><FaShoppingCart /> All Order</button>
                <button onClick={() => setActiveTab('report')} className={`list-group-item list-group-item-action py-3 d-flex align-items-center gap-2 ${activeTab === 'report' ? 'active bg-primary text-white' : ''}`}><FaChartBar /> Report</button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-md-9">
            <div className="card shadow-sm border-0 p-4 rounded-4 bg-white min-vh-50">

              {/* Today's Orders (Filtering for Today Only) */}
              {activeTab === 'recent-order' && (
                <div>
                  <h2 className="fw-bold mb-4 border-bottom pb-2 text-dark"><FaBell className="text-warning me-2" /> Today's Orders</h2>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle border text-center">
                      <thead className="table-dark">
                        <tr><th>#</th><th>Customer</th><th>Time</th><th>Address</th><th>Method</th><th>Items</th><th>Amount</th></tr>
                      </thead>
                      <tbody>
                        {todayOrders.length > 0 ? todayOrders.map((order, i) => (
                          <tr key={order._id}>
                            <td>{i + 1}</td>
                            <td className="fw-bold">{order?.buyer?.name || "Guest"}</td>
                            <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              {order.shippingAddress ? (
                                <button className="btn btn-sm btn-outline-primary fw-bold" data-bs-toggle="modal" data-bs-target="#addressModal" onClick={() => setSelectedAddress({ ...order.shippingAddress, orderId: order._id, date: order.createdAt })}>
                                  <FaMapMarkerAlt className="me-1" /> View
                                </button>
                              ) : <span className="text-muted small">N/A</span>}
                            </td>
                            <td><span className="badge bg-info text-dark">{order.paymentMethod}</span></td>
                            <td>{order?.products?.length}</td>
                            <td className="fw-bold text-success">৳{order.totalAmount}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={7} className="py-4 text-muted">No orders received yet today.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Category Section */}
              {activeTab === 'category' && (
                <div>
                  <h2 className="fw-bold mb-4 text-dark"><FaTags className="text-primary" /> Category Management</h2>
                  <form onSubmit={handleCategorySubmit} className="mb-4 d-flex gap-2 p-3 bg-light rounded shadow-sm">
                    <input type="text" className="form-control" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                    <button type="submit" className={`btn ${isEditingCategory ? 'btn-info' : 'btn-success'} fw-bold px-4`}>{isEditingCategory ? "Update" : "Add"}</button>
                  </form>
                  <table className="table table-bordered text-center align-middle">
                    <thead className="table-light"><tr><th>Name</th><th>Action</th></tr></thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c._id}><td className="fw-bold">{c.name}</td><td><button className="btn btn-sm btn-info text-white me-2" onClick={() => { setIsEditingCategory(true); setEditCategoryId(c._id); setNewCategoryName(c.name); }}><FaEdit /></button><button className="btn btn-sm btn-danger" onClick={() => deleteCategory(c._id)}><FaTrash /></button></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Product Section */}
              {activeTab === 'product' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4"><h2 className="fw-bold text-dark"><FaBox className="text-primary" /> Product List</h2><button className="btn btn-primary rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#productModal" onClick={resetProductForm}><FaPlusCircle className="me-2" /> Add New</button></div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle text-center border">
                      <thead className="table-light"><tr><th>Img</th><th>Name</th><th>Stock</th><th>Action</th></tr></thead>
                      <tbody>
                        {products.map((p) => {
                          const hasZeroStock = p.productDetails.some(d => Number(d.quantity) <= 0);
                          return (
                            <tr key={p._id}>
                              <td><img src={`${IMG_URL}${p.image}`} width="45" height="45" className="rounded border shadow-sm" alt="img" /></td>
                              <td className="fw-bold">{p.name}</td>
                              <td>
                                <button className={`btn btn-sm border shadow-sm ${hasZeroStock ? 'btn-danger text-white' : 'btn-light'}`} data-bs-toggle="modal" data-bs-target="#stockViewModal" onClick={() => setSelectedStockView(p.productDetails)}>
                                  <FaEye /> {hasZeroStock ? "Stock Out!" : "View"}
                                </button>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-info text-white me-2" data-bs-toggle="modal" data-bs-target="#productModal" onClick={() => handleEditClick(p)}><FaEdit /></button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(p._id)}><FaTrash /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* All Orders History */}
              {activeTab === 'all-order' && (
                <div>
                  <h2 className="fw-bold mb-4 text-dark"><FaShoppingCart className="text-success me-2" /> All Order History</h2>
                  <div className="accordion" id="ordersAccordion">
                    {orders.map((order, index) => (
                      <div className="accordion-item mb-3 border rounded shadow-sm" key={order._id}>
                        <h2 className="accordion-header"><button className="accordion-button collapsed bg-white" type="button" data-bs-toggle="collapse" data-bs-target={`#order${index}`}><div className="d-flex justify-content-between w-100 align-items-center pe-3"><span><strong>Order #{orders.length - index}</strong> | {new Date(order.createdAt).toLocaleString()}</span><span className="badge bg-success">৳{order.totalAmount}</span></div></button></h2>
                        <div id={`order${index}`} className="accordion-collapse collapse" data-bs-parent="#ordersAccordion"><div className="accordion-body"><p className="small mb-3 text-muted"><strong>Buyer:</strong> {order?.buyer?.name} | <strong>Payment:</strong> {order.paymentMethod}</p><table className="table table-sm table-bordered text-center align-middle"><thead className="table-light"><tr><th>Product</th><th>Color</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>{order?.products?.map((item: any, i: number) => (<tr key={i}><td className="fw-bold">{item.name}</td><td>{item.color}</td><td>{item.quantity}</td><td>৳{item.price}</td><td className="fw-bold">৳{item.price * item.quantity}</td></tr>))}</tbody></table></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Section */}
              {activeTab === 'report' && (
                <div>
                  <h2 className="fw-bold mb-4 text-dark"><FaChartBar className="text-danger me-2" /> Sales Aggregation Report</h2>
                  <div className="row g-3 mb-4 p-3 bg-light rounded shadow-sm border">
                    <div className="col-md-4"><label className="fw-bold small">Start Date</label><input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                    <div className="col-md-4"><label className="fw-bold small">End Date</label><input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                    <div className="col-md-4 d-flex align-items-end"><button className="btn btn-dark w-100 fw-bold" onClick={generateReport}><FaSearch className="me-2" /> Filter Report</button></div>
                  </div>
                  <div className="row mb-4"><div className="col-md-6"><div className="card bg-primary text-white p-3 shadow-sm border-0 text-center"><h6 className="text-uppercase small">Total Sales</h6><h2 className="fw-bold mb-0">৳{reportData.totalSales}</h2></div></div><div className="col-md-6"><div className="card bg-success text-white p-3 shadow-sm border-0 text-center"><h6 className="text-uppercase small">Units Sold</h6><h2 className="fw-bold mb-0">{reportData.totalItems}</h2></div></div></div>
                  <div className="table-responsive shadow-sm rounded"><table className="table table-bordered text-center align-middle bg-white mb-0"><thead className="table-dark"><tr><th>Name</th><th>Color</th><th>Sold Qty</th><th>Earnings</th></tr></thead><tbody>{reportData.details.map((item: any, i: number) => (<tr key={i}><td>{item.name}</td><td>{item.color}</td><td className="fw-bold">{item.qty}</td><td className="text-success fw-bold">৳{item.qty * item.price}</td></tr>))}</tbody></table></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Delivery Address Modal --- */}
      <div className="modal fade" id="addressModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-primary text-white border-0"><h5 className="modal-title fw-bold"><FaMapMarkerAlt className="me-2" /> Delivery Label</h5><button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div className="modal-body p-0">
              <div ref={printRef} className="p-4 bg-white text-dark">
                <div className="border-bottom pb-2 mb-4 text-center"><h3>FURNITURE HUB</h3><small>Customer Address Slip</small></div>
                {selectedAddress ? (
                  <div className="text-start">
                    <p><strong>Receiver:</strong> {selectedAddress.name}</p>
                    <p><strong>Phone:</strong> {selectedAddress.phone}</p>
                    <p><strong>Address:</strong> {selectedAddress.address}</p>
                    <hr />
                    <span className="badge bg-dark">Location: {selectedAddress.location}</span>
                  </div>
                ) : <p className="text-center py-4">No address found.</p>}
              </div>
            </div>
            <div className="modal-footer bg-light border-0">
              <button className="btn btn-dark rounded-pill px-4 fw-bold" onClick={() => handlePrint()}><FaPrint className="me-2" /> Print Label</button>
              <button className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Stock View Modal --- */}
      <div className="modal fade" id="stockViewModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 p-4 rounded-4 shadow">
            <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">Inventory Stock</h5>
            <table className="table table-sm border text-center align-middle">
              <thead className="table-light"><tr><th>Material</th><th>Dim.</th><th>Color</th><th>Stock</th></tr></thead>
              <tbody>
                {selectedStockView.map((v, i) => (
                  <tr key={i} className={v.quantity <= 0 ? 'table-danger' : ''}>
                    <td>{v.material}</td><td>{v.dimensions}</td><td>{v.color}</td><td className={`fw-bold ${v.quantity <= 0 ? 'text-danger' : ''}`}>{v.quantity <= 0 ? 'OUT' : v.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Product Modal --- */}
      <div className="modal fade" id="productModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <form onSubmit={handleCreateOrUpdateProduct}>
              <div className={`modal-header border-0 ${pid ? 'bg-info' : 'bg-dark'} text-white p-4`}><h5 className="modal-title fw-bold">{pid ? "Update Product" : "Create Product"}</h5><button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
              <div className="modal-body p-4">
                <div className="row mb-4">
                  <div className="col-md-4 mb-3"><label className="small fw-bold">Name</label><input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                  <div className="col-md-4 mb-3"><label className="small fw-bold">Category</label><select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required><option value="">Select Category</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                  <div className="col-md-4 mb-3"><label className="small fw-bold">Image</label><input type="file" className="form-control" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} /></div>
                </div>
                {productDetails.map((detail, index) => (
                  <div className="row g-2 mb-3 bg-light p-3 rounded border align-items-center" key={index}>
                    <div className="col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Material" value={detail.material} onChange={(e) => handleDetailChange(index, 'material', e.target.value)} /></div>
                    <div className="col-md-3"><input type="text" className="form-control form-control-sm" placeholder="Dimensions" value={detail.dimensions} onChange={(e) => handleDetailChange(index, 'dimensions', e.target.value)} /></div>
                    <div className="col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Color" value={detail.color} onChange={(e) => handleDetailChange(index, 'color', e.target.value)} /></div>
                    <div className="col-md-2"><input type="number" className="form-control form-control-sm" placeholder="Price" value={detail.price} onChange={(e) => handleDetailChange(index, 'price', parseInt(e.target.value))} /></div>
                    <div className="col-md-2"><input type="number" className="form-control form-control-sm" placeholder="Stock" value={detail.quantity} onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value))} /></div>
                    <div className="col-md-1"><button type="button" className="btn btn-sm btn-danger w-100" onClick={() => handleRemoveVariant(index)}><FaTrash /></button></div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={handleAddVariant}>+ Add Variant</button>
              </div>
              <div className="modal-footer border-0 p-4 pt-0"><button type="submit" className="btn btn-success px-5 fw-bold" data-bs-dismiss="modal">Save Changes</button></div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;