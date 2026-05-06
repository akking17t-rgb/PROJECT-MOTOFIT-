import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Star, 
  ArrowRight, 
  User as UserIcon, 
  Menu, 
  X,
  Plus,
  Minus,
  CheckCircle2,
  Bike,
  Car,
  ChevronDown,
  LogOut,
  Mail
} from 'lucide-react';
import { VEHICLES, PRODUCTS, REVIEWS, CATEGORIES } from './constants';
import { VehicleType, VehicleModel, Product, CartItem } from './types';
import { 
  auth, 
  signInWithGoogle, 
  signOut, 
  onAuthStateChanged, 
  FirebaseUser,
  db,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';

// --- Components ---

const Navbar = ({ cartCount, onOpenCart, user, onNavigate, selectedCategory, onSelectCategory, searchQuery, onSearchChange }: { 
  cartCount: number; 
  onOpenCart: () => void; 
  user: FirebaseUser | null; 
  onNavigate: (view: 'catalog' | 'orders') => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 lg:h-20 flex items-center px-4 lg:px-12 justify-between">
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-400">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { onNavigate('catalog'); onSelectCategory(null); }}>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-brand-primary flex items-center justify-center rotate-45 shadow-lg shadow-brand-primary/30">
              <Bike className="-rotate-45 text-white" size={18} />
            </div>
            <span className="font-display font-bold text-lg lg:text-2xl tracking-tighter text-slate-900">MOTOFIT</span>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search parts, brands, or gear..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-full py-2.5 pl-12 pr-6 text-sm font-display font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="lg:hidden text-slate-400 hover:text-slate-900 transition-colors">
            <Search size={22} />
          </button>
          <button onClick={onOpenCart} className="relative text-slate-400 hover:text-slate-900 transition-colors">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-primary text-[10px] flex items-center justify-center font-bold text-white rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <div className="relative">
            <button 
              onClick={() => user ? setUserMenuOpen(!userMenuOpen) : signInWithGoogle()}
              className="text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              {user ? (
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border-2 border-brand-primary/20" />
              ) : (
                <UserIcon size={22} />
              )}
            </button>
            {user && userMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-4 w-48 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-50"
              >
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-400 mb-2">My Account</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { onNavigate('orders'); setUserMenuOpen(false); }} className="text-xs font-bold text-slate-900 hover:text-brand-primary text-left py-1">Orders</button>
                  <button className="text-xs font-bold text-slate-900 hover:text-brand-primary text-left py-1">Garage</button>
                  <hr className="border-slate-50 my-1" />
                  <button onClick={() => signOut()} className="text-xs font-bold text-red-500 hover:text-red-600 text-left py-1 flex items-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 w-full z-[45] bg-white border-b border-slate-100 p-4 lg:hidden"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-display font-bold text-slate-900"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-[110] border-r border-slate-100 lg:hidden flex flex-col pt-20 p-8 shadow-2xl"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 text-slate-300"
              >
                <X size={24} />
              </button>
            <div className="flex flex-col gap-4 text-xs font-display font-medium tracking-widest uppercase overflow-y-auto pb-10 text-slate-600">
                <button 
                  onClick={() => { onSelectCategory(null); setMobileMenuOpen(false); }} 
                  className={`flex items-center justify-between border-b border-slate-50 pb-2 ${!selectedCategory ? 'text-brand-primary' : ''}`}
                >
                  All Products <ChevronRight size={14} />
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.name}
                    onClick={() => { onSelectCategory(cat.name); setMobileMenuOpen(false); }}
                    className={`flex items-center justify-between border-b border-slate-50 pb-2 ${selectedCategory === cat.name ? 'text-brand-primary' : ''}`}
                  >
                    {cat.name} <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const YMMSelector = ({ onFilter }: { onFilter: (type: VehicleType, brand: string | null, model: string | null, year: number | null) => void }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bike');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const availableBrands = Array.from(new Set(VEHICLES.filter(v => v.type === vehicleType).map(v => v.brand)));
  const filteredModels = VEHICLES.filter(v => v.brand === selectedBrand && v.type === vehicleType);
  const selectedModelData = filteredModels.find(m => m.model === selectedModel);
  const availableYears = selectedModelData ? selectedModelData.years : [];

  const handleApply = () => {
    onFilter(vehicleType, selectedBrand, selectedModel, selectedYear);
  };

  const handleReset = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedYear(null);
    onFilter(vehicleType, null, null, null);
  };

  return (
    <div className="bg-white p-6 lg:p-10 border border-slate-100 flex flex-col gap-6 lg:gap-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Vehicle Type Toggle */}
      <div className="flex gap-4">
        {(['Bike', 'Car'] as VehicleType[]).map(type => (
          <button
            key={type}
            onClick={() => {
              setVehicleType(type);
              setSelectedBrand(null);
              setSelectedModel(null);
              setSelectedYear(null);
            }}
            className={`flex-1 py-4 flex items-center justify-center gap-3 font-display font-black tracking-widest uppercase transition-all border rounded-2xl ${
              vehicleType === type 
                ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/30' 
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-slate-900 shadow-sm'
            }`}
          >
            {type === 'Bike' ? <Bike size={20} /> : <Car size={20} />}
            <span className="text-xs lg:text-sm">{type}s</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
        <div className="space-y-3">
          <label className="input-label text-slate-400">01. Select Manufacturer</label>
          <div className="relative group">
            <select 
              value={selectedBrand || ''} 
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedModel(null);
                setSelectedYear(null);
              }}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-display font-bold text-xs uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-12 cursor-pointer group-hover:bg-white"
            >
              <option value="">Select Brand</option>
              {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-brand-primary transition-colors" size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="input-label text-slate-400">02. Select Model</label>
          <div className="relative group">
            <select 
              disabled={!selectedBrand}
              value={selectedModel || ''} 
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setSelectedYear(null);
              }}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-display font-bold text-xs uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-12 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group-hover:enabled:bg-white"
            >
              <option value="">Select Model</option>
              {filteredModels.map(m => <option key={m.id} value={m.model}>{m.model}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-brand-primary transition-colors" size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="input-label text-slate-400">03. Select Year</label>
          <div className="relative group">
            <select 
              disabled={!selectedModel}
              value={selectedYear || ''} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl font-display font-bold text-xs uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-12 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group-hover:enabled:bg-white"
            >
              <option value="">Select Year</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-brand-primary transition-colors" size={16} />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleApply}
            className="flex-1 btn-primary py-4 text-xs uppercase tracking-[0.2em]"
          >
            Identify Correct Gear
          </button>
          <button 
            onClick={handleReset}
            className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center rounded-xl hover:bg-white hover:text-red-500 hover:border-red-500 transition-all shrink-0 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const formatPrice = (price: number) => {
  return `Rs. ${price.toLocaleString()}`;
};

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isVerified: boolean;
  onAddToCart: (p: Product) => void;
}

const ProductCard = ({ product, isVerified, onAddToCart }: ProductCardProps) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
    viewport={{ once: true }}
    className="card-gradient group flex flex-col h-full overflow-hidden transition-all duration-300"
  >
    <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden bg-slate-50">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
      <div className="absolute top-2 lg:top-4 left-2 lg:left-4 flex flex-col gap-2">
        <span className="badge-primary bg-white/90 backdrop-blur-sm border-none shadow-sm">
          {product.category}
        </span>
        {isVerified && (
          <span className="bg-green-500 text-white px-2.5 py-1 text-[9px] font-display font-black tracking-widest uppercase flex items-center gap-1 shadow-sm rounded-full">
            <CheckCircle2 size={10} /> Match
          </span>
        )}
      </div>
      
      {/* Updated Add to Cart Button: Visible on hover with animation */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(product);
        }}
        className="absolute bottom-4 right-4 w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/40 opacity-0 scale-50 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 z-10 hover:bg-slate-900 active:scale-90"
      >
        <Plus size={24} />
      </button>
    </div>
    
    <div className="p-5 lg:p-6 flex flex-col flex-1 bg-white relative">
      <div className="flex items-center gap-1 text-brand-primary mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={10} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} className={i < Math.floor(product.rating) ? '' : 'text-slate-200'} />
        ))}
        <span className="text-[10px] text-slate-400 font-bold ml-1">{product.rating}</span>
      </div>
      
      <h3 className="font-display font-bold text-base lg:text-lg leading-tight mb-2 text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2">
        {product.name}
      </h3>
      
      <p className="text-slate-500 text-[11px] lg:text-xs line-clamp-2 mb-6 leading-relaxed">
        {product.description}
      </p>
      
      <div className="mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">PKR</span>
          <span className="font-display font-black text-xl lg:text-2xl text-slate-900">{product.price.toLocaleString()}</span>
        </div>
        <button 
          onClick={() => onAddToCart(product)}
          className="lg:hidden w-10 h-10 bg-slate-50 text-slate-400 flex items-center justify-center rounded-full active:bg-brand-primary active:text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  </motion.div>
);

const FlashSaleMarquee = () => (
  <div className="bg-brand-primary py-3 overflow-hidden whitespace-nowrap flex relative">
    <div className="flex animate-marquee-fast gap-12 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-white font-display font-black text-[10px] lg:text-xs uppercase tracking-[0.4em] flex items-center gap-4">
          <Plus size={14} className="rotate-45" /> 
          FLARE SALE LIVE • UP TO 40% OFF • VERIFIED PARTS • NATIONWIDE COD
        </span>
      ))}
    </div>
  </div>
);

const CartDrawer = ({ isOpen, onClose, items, onUpdateQty, onRemove, user }: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  user: FirebaseUser | null;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: items,
        total: total,
        status: 'Processing',
        shippingAddress: "Default Service Point, Lahore, Punjab, Pakistan", 
        createdAt: serverTimestamp()
      });
      alert('Order Placed Successfully! Your high-performance gear is being prepped.');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[120] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[130] border-l border-slate-100 flex flex-col shadow-2xl"
          >
            <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between">
              <span className="font-display font-bold text-xl uppercase tracking-widest text-slate-900">Cart ({items.length})</span>
              <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-4">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="font-display text-sm tracking-widest uppercase text-slate-400">Empty Cart</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 overflow-hidden flex-shrink-0 rounded-lg">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-xs lg:text-sm truncate mb-1 text-slate-900">{item.name}</h4>
                      <p className="text-brand-primary font-bold text-sm mb-3">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                          <button onClick={() => onUpdateQty(item.id, -1)} className="p-1.5 hover:bg-slate-50 text-slate-400"><Minus size={12} /></button>
                          <span className="w-8 text-center text-[10px] font-bold text-slate-900">{item.quantity}</span>
                          <button onClick={() => onUpdateQty(item.id, 1)} className="p-1.5 hover:bg-slate-50 text-slate-400"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => onRemove(item.id)} className="text-[9px] uppercase font-bold text-slate-300 hover:text-red-500 transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {items.length > 0 && (
              <div className="p-6 lg:p-8 border-t border-slate-100 bg-slate-50">
                <div className="flex justify-between mb-4">
                  <span className="text-slate-400 text-sm font-medium">Estimated Total</span>
                  <span className="font-display font-bold text-xl text-slate-900">{formatPrice(total)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2 group text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Place Secure Order'} 
                  {!isProcessing && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
                <p className="text-[9px] text-slate-400 mt-4 text-center">Fast delivery across Lahore, Karachi, and Islamabad</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
  createdAt: any;
}

const OrdersView = ({ user, onBack }: { user: FirebaseUser; onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
      // Note: Ordering requires an index, so we'll sort client-side for now
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort by date descending
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <div className="section-container min-h-screen">
      <div className="mb-12 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
          <X size={20} />
        </button>
        <div>
          <span className="badge-primary">Account Management</span>
          <h2 className="font-display font-black text-3xl lg:text-5xl uppercase tracking-tighter text-slate-900">Your <span className="text-brand-primary">Orders</span></h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-slate-100 border-t-brand-primary rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border border-slate-100">
           <ShoppingBag size={48} className="mx-auto text-slate-200 mb-6" />
           <p className="font-display font-bold text-slate-400 uppercase tracking-widest text-sm">No orders found yet</p>
           <button onClick={onBack} className="btn-primary mt-8">Start Shopping</button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 p-6 lg:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8 pb-6 border-b border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID: #{order.id.slice(0, 8)}</p>
                  <p className="font-display font-bold text-slate-900">{order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <span className={`font-display font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                      order.status === 'Processing' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
                    <p className="font-display font-black text-xl text-slate-900">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items ({order.items.length})</p>
                    <div className="flex flex-wrap gap-2">
                       {order.items.map(item => (
                         <div key={item.id} className="flex items-center gap-3 bg-slate-50 pr-4 rounded-xl border border-slate-100">
                           <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0">
                              <img src={item.image} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">{item.name}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Qty: {item.quantity}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Address</p>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{order.shippingAddress}</p>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'catalog' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 35;

  const [filter, setFilter] = useState<{ type: VehicleType; brand: string | null; model: string | null; year: number | null }>({
    type: 'Bike',
    brand: null,
    model: null,
    year: null
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Filter products based on search, category, and vehicle filter
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesType = filter.type === 'Universal' || product.type === 'Universal' || product.type === filter.type;
    
    let matchesVehicle = true;
    if (filter.brand) {
      matchesVehicle = product.fitment.brands.includes(filter.brand);
      if (matchesVehicle && filter.model) {
        matchesVehicle = !product.fitment.models || product.fitment.models.includes(filter.model);
        if (matchesVehicle && filter.year) {
          matchesVehicle = !product.fitment.years || product.fitment.years.includes(filter.year);
        }
      }
    }

    return matchesSearch && matchesCategory && matchesType && matchesVehicle;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync user to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter/search change
  }, [searchQuery, selectedCategory, filter]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center"
          >
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               className="w-12 h-12 border-4 border-slate-100 border-t-brand-primary rounded-full mb-4"
             />
             <span className="font-display font-black text-xs uppercase tracking-[0.5em] text-slate-400 animate-pulse">Initializing Gear</span>
          </motion.div>
        )}
      </AnimatePresence>
      <Navbar 
        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)} 
        onOpenCart={() => setCartOpen(true)}
        user={user}
        onNavigate={setCurrentView}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        items={cartItems} 
        onUpdateQty={updateQty}
        onRemove={removeItem}
        user={user}
      />

      <main className="pt-16 lg:pt-20 overflow-x-hidden">
        {currentView === 'orders' && user ? (
          <OrdersView user={user} onBack={() => setCurrentView('catalog')} />
        ) : (
          <>
            {selectedCategory ? (
              <section className="bg-slate-900 pt-20 pb-16 lg:pt-32 lg:pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/10 skew-x-[-15deg] translate-x-1/2" />
                <div className="container mx-auto px-4 lg:px-12 relative z-10">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-brand-primary hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-12"
                  >
                    <ChevronRight size={14} className="rotate-180" /> Back to Store
                  </button>
                  <div className="max-w-4xl">
                    <span className="badge-primary mb-6 bg-brand-primary/20 text-brand-primary border-brand-primary/30">Collections</span>
                    <h1 className="font-display font-black text-6xl lg:text-9xl uppercase tracking-tighter text-white leading-none mb-8">
                      {selectedCategory}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg lg:text-xl leading-relaxed max-w-2xl border-l-2 border-brand-primary pl-8">
                      Elite {selectedCategory.toLowerCase()} solutions curated for performance enthusiasts. 
                      Tested for Pakistan's most challenging roads and terrains.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <FlashSaleMarquee />
                {/* Landing Hero */}
                <section className="relative min-h-[70vh] lg:h-[80vh] flex items-center overflow-hidden bg-white">
                  {/* Subtle Background Decoration */}
                  <div className="absolute top-0 right-0 w-[50%] h-full bg-slate-50 skew-x-[-12deg] translate-x-[20%] z-0" />
                  
                  <div className="container mx-auto px-4 lg:px-12 relative z-10 flex flex-col lg:flex-row items-center gap-16">
                    <motion.div 
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="flex-1 text-center lg:text-left"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full mb-6">
                        <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                        <span className="text-brand-primary font-display font-black uppercase text-[10px] tracking-widest">Global Standards, Local Fitment</span>
                      </div>
                      
                      <h1 className="font-display font-black text-6xl lg:text-9xl leading-[0.85] tracking-tighter mb-8 uppercase text-slate-900">
                        DRIVE<br /><span className="text-brand-primary">LEGENDARY.</span>
                      </h1>
                      
                      <p className="text-slate-500 text-base lg:text-xl mb-12 max-w-xl font-medium leading-relaxed mx-auto lg:mx-0">
                        The ultimate marketplace for verified performance parts. 
                        Whether you ride a <span className="text-slate-900 font-bold">CG 125</span> or drive a <span className="text-slate-900 font-bold">Civic RS</span>, 
                        we ensure precision and reliability in every gear.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                        <button onClick={() => window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' })} className="btn-primary px-12 group">
                          Explore Catalog <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-4 justify-center">
                           <div className="flex -space-x-3">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                                </div>
                              ))}
                              <div className="w-10 h-10 rounded-full border-2 border-white bg-brand-primary flex items-center justify-center text-[10px] text-white font-bold">+50k</div>
                           </div>
                           <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">Satisfied Customers</p>
                              <div className="flex gap-0.5 text-brand-primary"><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /><Star size={8} fill="currentColor" /></div>
                           </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 50 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="flex-1 relative"
                    >
                      <div className="relative z-10 w-full aspect-square max-w-lg mx-auto bg-slate-100 rounded-[2rem] lg:rounded-[4rem] overflow-hidden shadow-2xl shadow-slate-200 rotate-2">
                        <img 
                          src={filter.type === 'Bike' 
                            ? "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200"
                            : "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"
                          } 
                          className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700" 
                          alt="Hero Image" 
                        />
                      </div>
                      {/* Floating Badge */}
                      <div className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 -rotate-3">
                         <p className="text-brand-primary font-black text-3xl mb-1">4.9/5</p>
                         <p className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-400">Rider Approval</p>
                      </div>
                    </motion.div>
                  </div>
                </section>
              </>
            )}

            {/* Categories Section - Only show on landing or prominently top of cat page */}
            <section className="container mx-auto px-4 lg:px-12 py-12 lg:py-20">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="input-label text-slate-400">Premium Catalog</span>
              <h2 className="font-display font-bold text-3xl lg:text-5xl uppercase tracking-tighter text-slate-900">
                Browse <span className="text-brand-primary">Categories</span>
              </h2>
            </div>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary text-[10px] font-display font-bold uppercase tracking-widest rounded-full hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <X size={14} /> Clear Category
              </button>
            )}
          </div>
          
          {/* Desktop/Tablet Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <motion.button 
                key={cat.name}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border transition-all ${
                  selectedCategory === cat.name ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-100'
                }`}
              >
                <img src={cat.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" alt={cat.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 items-start">
                  <span className="text-[8px] text-brand-primary font-display font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">View All</span>
                  <h3 className="font-display font-extrabold text-xs lg:text-sm uppercase tracking-wider text-white text-left leading-tight">{cat.name}</h3>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="sm:hidden flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
            {CATEGORIES.map(cat => (
              <motion.button 
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-shrink-0 w-32 aspect-[4/5] relative overflow-hidden rounded-xl border transition-all ${
                  selectedCategory === cat.name ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-100'
                }`}
              >
                <img src={cat.image} className="w-full h-full object-cover opacity-70" alt={cat.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <h3 className="absolute bottom-3 left-3 right-3 font-display font-bold text-[10px] uppercase tracking-wider text-white text-left leading-tight">{cat.name}</h3>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Dynamic Fitment Search (Pinned) */}
        <section className="container mx-auto px-4 lg:px-12 relative z-30 pb-16 lg:pb-24">
          <div className="max-w-5xl mx-auto">
            <YMMSelector onFilter={(type, brand, model, year) => setFilter({ type, brand, model, year })} />
          </div>
        </section>

        {/* Product Catalog */}
        <section id="catalog" className="bg-slate-50 py-24 lg:py-32 border-y border-slate-100">
          <div className="container mx-auto px-4 lg:px-12 text-center">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 lg:mb-16 gap-8 text-left">
              <div className="space-y-2">
                <span className="input-label text-slate-400">Available Stock</span>
                <h2 className="font-display font-extrabold text-3xl lg:text-5xl uppercase tracking-tighter text-slate-900 flex items-center gap-4">
                  {filter.model ? filter.model : filter.type} <span className="text-slate-200">Catalog</span>
                </h2>
                {selectedCategory && <p className="text-brand-primary font-display font-bold text-[10px] uppercase tracking-[0.2em]">Filtering by: {selectedCategory}</p>}
                {searchQuery && <p className="text-slate-400 font-display font-bold text-[10px] uppercase tracking-[0.2em]">Searching: "{searchQuery}"</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 transition-all text-left">
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isVerified={!!filter.brand && product.fitment.brands.includes(filter.brand)} 
                    onAddToCart={addToCart}
                  />
                ))}
              </AnimatePresence>
            </div>

            {paginatedProducts.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-white"
              >
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mx-auto mb-4 shadow-sm">
                  <Search size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-display uppercase tracking-widest text-sm font-medium">No parts found matching your criteria</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); setFilter({ ...filter, brand: null, model: null, year: null }); }} className="mt-4 text-brand-primary text-xs font-bold uppercase tracking-widest underline underline-offset-4 decoration-2">Clear all filters</button>
              </motion.div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-20 flex items-center justify-center gap-6">
                <button 
                  onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:bg-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 disabled:hover:bg-transparent transition-all shadow-xl shadow-slate-200/20"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
                
                <div className="flex gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' }); }}
                      className={`w-14 h-14 rounded-full font-display font-black text-xs transition-all shadow-lg ${
                        currentPage === page 
                        ? 'bg-brand-primary text-white shadow-brand-primary/30 scale-110' 
                        : 'bg-white border border-slate-100 text-slate-400 hover:border-brand-primary hover:text-brand-primary shadow-slate-200/20'
                      }`}
                    >
                      {page.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:bg-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 disabled:hover:bg-transparent transition-all shadow-xl shadow-slate-200/20"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Trust Markers */}
        <section className="bg-slate-50 py-24 lg:py-40 border-y border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#FF4E00_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
               <span className="badge-primary mb-4">Why MotoFit</span>
               <h2 className="font-display font-black text-4xl lg:text-6xl uppercase tracking-tighter text-slate-900 mb-6">Built for the <span className="text-brand-primary">Elite</span></h2>
               <p className="text-slate-500 font-medium">We deliver more than just parts. We deliver the engineering confidence you need to push your vehicle to its absolute limit.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Verified Fitment', desc: 'Every component is tested against local Pakistani vehicle specifications in our specialized lab.', icon: <CheckCircle2 className="text-brand-primary" size={28} /> },
                { title: 'Nationwide Support', desc: 'Fast, secure shipping across all provinces with live tracking and Cash on Delivery options.', icon: <ShoppingBag className="text-brand-primary" size={28} /> },
                { title: 'Expert Engineering', desc: 'Direct access to our technical team for installation guidance and compatibility checks.', icon: <Star className="text-brand-primary" size={28} /> }
              ].map((item, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-50">
                    {item.icon}
                  </div>
                  <h4 className="font-display font-black text-xl mb-4 uppercase tracking-tight text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-container">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <span className="badge-primary mb-4">Support</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl uppercase tracking-tighter text-slate-900 mb-6">Frequently Asked <span className="text-brand-primary">Questions</span></h2>
              <p className="text-slate-500 font-medium mb-8">Can't find what you're looking for? Contact our specialist team via WhatsApp for instant support.</p>
              <button className="btn-outline w-full lg:w-auto">Contact Specialist</button>
            </div>
            <div className="lg:w-2/3 space-y-6">
              {[
                { q: "How do I know if a part fits my bike?", a: "Use our Fitment Selector tool. Every part marked with a 'Match' badge has been verified for your specific year and model." },
                { q: "What is your delivery timeframe?", a: "Standard delivery takes 2-4 business days for major cities like Lahore, Karachi, and Islamabad." },
                { q: "Do you offer installation services?", a: "We provide detailed installation guides and phone support. For physical installation, we can recommend partner workshops near you." },
                { q: "What is your return policy?", a: "We offer a 7-day no-questions-asked return policy for unused items in their original packaging." }
              ].map((item, i) => (
                <details key={i} className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <summary className="p-6 cursor-pointer flex items-center justify-between list-none font-display font-bold text-slate-900 uppercase tracking-wide text-sm">
                    {item.q}
                    <Plus size={18} className="text-slate-400 group-open:rotate-45 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed font-medium">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="container mx-auto px-4 lg:px-12 pb-24">
           <div className="bg-brand-black rounded-[3rem] p-12 lg:p-24 relative overflow-hidden text-center lg:text-left">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                 <div className="max-w-xl">
                    <h2 className="font-display font-black text-4xl lg:text-7xl uppercase tracking-tighter text-white mb-6">Join the <span className="text-brand-primary underline underline-offset-8">Squad</span></h2>
                    <p className="text-slate-400 font-medium text-lg lg:text-xl">Get exclusive access to early drops, performance tips, and elite community events.</p>
                 </div>
                 <div className="w-full max-w-md">
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                        if (!email) return;
                        try {
                          await addDoc(collection(db, 'newsletter'), {
                            email,
                            createdAt: serverTimestamp()
                          });
                          alert('Welcome to the Squad! Check your email for drops.');
                          (e.target as HTMLFormElement).reset();
                        } catch (error) {
                          handleFirestoreError(error, OperationType.WRITE, 'newsletter');
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-900 rounded-[2rem] border border-slate-800"
                    >
                       <input 
                        name="email"
                        type="email" 
                        required
                        placeholder="Your Rider Email" 
                        className="bg-transparent border-none outline-none text-white px-6 py-4 flex-1 font-display font-bold text-sm tracking-widest placeholder:text-slate-600" 
                      />
                       <button type="submit" className="btn-primary py-4 px-8 text-sm uppercase tracking-widest whitespace-nowrap">Join Now</button>
                    </form>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 text-center">Join 12,000+ Pakistani Riders today.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section-container bg-white">
          <div className="bg-slate-50 rounded-[3rem] p-8 lg:p-20 border border-slate-100 flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/2">
              <span className="badge-primary mb-4">Get in Touch</span>
              <h2 className="font-display font-black text-4xl lg:text-6xl uppercase tracking-tighter text-slate-900 mb-8">
                Need a <span className="text-brand-primary">Custom</span> Quote?
              </h2>
              <p className="text-slate-500 font-medium text-lg mb-12 leading-relaxed">
                Whether you're looking for performance tuning or bulk orders for your fleet, 
                our engineering team is ready to assist.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <Mail className="text-brand-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Us</p>
                    <p className="font-display font-bold text-slate-900">support@motofit.pk</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <CheckCircle2 className="text-brand-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Time</p>
                    <p className="font-display font-bold text-slate-900">Within 24 Business Hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const payload = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message'),
                  };

                  try {
                    const res = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    const result = await res.json();
                    if (res.ok) {
                      alert(result.message);
                      (e.target as HTMLFormElement).reset();
                    } else {
                      alert(result.error?.[0]?.message || 'Something went wrong');
                    }
                  } catch (err) {
                    console.error('Contact form error:', err);
                    alert('Could not connect to the server. Please try again.');
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="input-label">Full Name</label>
                  <input 
                    name="name"
                    required
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-display font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="input-label">Rider Email</label>
                  <input 
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-display font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="input-label">How can we help?</label>
                  <textarea 
                    name="message"
                    required
                    rows={4}
                    placeholder="Describe your vehicle or part inquiry..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-display font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-xs">
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </section>
        </>
      )}
    </main>
        <footer className="bg-white border-t border-slate-100 pt-20 lg:pt-32 pb-12 lg:pb-20">
          <div className="container mx-auto px-4 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 lg:mb-24">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-brand-primary flex items-center justify-center rotate-45 shadow-lg shadow-brand-primary/30">
                    <Bike className="-rotate-45 text-white" size={18} />
                  </div>
                  <span className="font-display font-bold text-xl tracking-tighter text-slate-900">MOTOFIT.PK</span>
                </div>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  The ultimate destination for precision components in Pakistan. Empowering local riders and drivers with 
                  global standards.
                </p>
                <div className="flex gap-4">
                  {['FB', 'IG', 'YT', 'WA'].map(i => (
                    <a key={i} href="#" className="w-10 h-10 border border-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:bg-slate-50 transition-all">{i}</a>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-display font-bold text-xs uppercase tracking-widest mb-8 text-slate-900">Elite Collection</h5>
                <ul className="flex flex-col gap-4 text-sm text-slate-500">
                  {CATEGORIES.slice(0, 4).map(cat => (
                    <li key={cat.name}>
                      <button 
                        onClick={() => { setSelectedCategory(cat.name); window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' }); }}
                        className="hover:text-brand-primary transition-colors text-left"
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-display font-bold text-xs uppercase tracking-widest mb-8 text-slate-900">Locations</h5>
                <ul className="flex flex-col gap-4 text-sm text-slate-500">
                  <li>Main Boulevard, Lahore</li>
                  <li>DHA Phase 6, Karachi</li>
                  <li>I-8 Markaz, Islamabad</li>
                  <li>Clock Tower, Faisalabad</li>
                </ul>
              </div>

              <div>
                <h5 className="font-display font-bold text-xs uppercase tracking-widest mb-8 text-slate-900">Secure Payments</h5>
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Methods accepted:</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] rounded font-bold text-slate-600">Ezypaisa</div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] rounded font-bold text-slate-600">JazzCash</div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] rounded font-bold text-slate-600">COD</div>
                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] rounded font-bold text-slate-600">Bank Transfer</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-12 border-t border-slate-100 flex flex-col lg:flex-row justify-between gap-6">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">© 2024 MOTOFIT PAKISTAN. ALL RIGHTS RESERVED.</span>
              <div className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-brand-primary transition-colors">Term of Sale</a>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}
