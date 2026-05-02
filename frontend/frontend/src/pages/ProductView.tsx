import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'; 
import { getAllProducts } from '../api/productApi';
import { Product, ProductDetail } from '../types';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io("http://localhost:8080");

const ProductView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const IMG_URL = "http://localhost:8080/uploads/";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    socket.on("newProduct", (newProduct: Product) => {
      setProducts((prev) => [newProduct, ...prev]);
      toast.info("🆕 New Product Added!");
    });

    socket.on("productUpdate", (updatedProduct: Product) => {
      setProducts((prev) => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      setSelectedProduct((prev) => prev?._id === updatedProduct._id ? updatedProduct : prev);
    });

    socket.on("stockUpdate", (data: { variantId: string, newStock: number }) => {
      setProducts((prevProducts) => prevProducts.map(p => ({
          ...p,
          productDetails: p.productDetails.map(detail => 
            detail._id === data.variantId ? { ...detail, quantity: data.newStock } : detail
          )
      })));
      
      setSelectedProduct((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          productDetails: prev.productDetails.map(detail => 
            detail._id === data.variantId ? { ...detail, quantity: data.newStock } : detail
          )
        };
      });
    });

    return () => {
      socket.off("newProduct");
      socket.off("productUpdate");
      socket.off("stockUpdate");
    };
  }, []);

  const addToCart = (product: Product, detail: ProductDetail) => {
    if (!auth?.token) {
      toast.error("Please login to add items to cart!");
      navigate("/login", { state: "/productview" });
      return;
    }

    if (Number(detail.quantity) <= 0) {
      toast.error("Out of stock!");
      return;
    }

    const cartItem = {
      productId: product._id,
      variantId: detail._id, 
      name: product.name,
      price: detail.price,
      color: detail.color,
      material: detail.material,
      quantity: 1, 
      maxStock: detail.quantity, 
      image: product.image
    };

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (existingCart.find((item: any) => item.variantId === detail._id)) {
      toast.info("Already in cart"); return;
    }
    localStorage.setItem('cart', JSON.stringify([...existingCart, cartItem]));
    window.dispatchEvent(new Event("cartUpdate"));
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-grow text-primary"></div></div>;

  return (
    <>
      <Navbar />
      <div className="container my-5">
        <h3 className="mb-4 fw-bold text-dark border-start border-4 border-primary ps-3 text-uppercase">Explore Our Collection</h3>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {products.map((p) => (
            <div className="col" key={p._id}>
              <div className="card h-100 shadow-sm border-0 rounded-3 product-card transition-all">
                <div className="position-relative overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ height: '180px' }}>
                  <img src={`${IMG_URL}${p.image}`} className="img-fluid" alt="" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '10px' }} onError={(e) => { (e.target as any).src = 'https://placehold.co/200x180' }} />
                </div>
                <div className="card-body p-3 text-center">
                  <h6 className="fw-bold mb-2 text-truncate">{p.name}</h6>
                  <p className="h6 fw-bold text-primary mb-3">Tk.{p.productDetails[0]?.price}</p>
                  <button className="btn btn-outline-dark btn-sm w-100 rounded-pill fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#detailModal" onClick={() => setSelectedProduct(p)}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal fade" id="detailModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0"><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div>
              <div className="modal-body p-4">
                {selectedProduct && (
                  <>
                    <div className="text-center mb-4">
                      <img src={`${IMG_URL}${selectedProduct.image}`} className="img-fluid rounded-3 mb-2 shadow-sm" style={{ maxHeight: '120px' }} alt="" />
                      <h5 className="fw-bold mb-0 text-dark">{selectedProduct.name}</h5>
                      <p className="text-muted small">{selectedProduct.category?.name}</p>
                    </div>
                    <table className="table table-sm align-middle text-center small">
                      <thead className="table-light"><tr><th>Color</th><th>Material</th><th>Available</th><th>Price</th><th>Action</th></tr></thead>
                      <tbody>
                        {selectedProduct.productDetails.map((detail, index) => (
                          <tr key={index}>
                            <td><span className="badge bg-light text-dark border">{detail.color}</span></td>
                            <td>{detail.material}</td>
                            <td>{Number(detail.quantity) > 0 ? <FaCheckCircle className="text-success" size={18} /> : <span className="text-danger fw-bold small"><FaExclamationCircle className="me-1" /> STOCK OUT</span>}</td>
                            <td className="fw-bold text-dark">Tk.{detail.price}</td>
                            <td>
                                <button 
                                    onClick={() => addToCart(selectedProduct, detail)} 
                                    className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm fw-bold" 
                                    disabled={Number(detail.quantity) <= 0}
                                    {...(auth?.token ? {"data-bs-dismiss": "modal"} : {})}
                                >
                                    Add to Cart
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
        .transition-all { transition: all 0.3s ease-in-out; }
      `}</style>
    </>
  );
};

export default ProductView;