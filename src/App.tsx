import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import SellerProducts from "./pages/SellerProducts";
import NotFound from "./pages/NotFound";
import ShopifyProductDetail from "./pages/ShopifyProductDetail";
import CustomerDashboard from "./pages/CustomerDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import WholesalerDashboard from "./pages/WholesalerDashboard";
import RoleSelection from "./pages/RoleSelection";
import { RoleGuard } from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/shopify" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <RoleGuard>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/customer"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/retailer"
              element={
                <RoleGuard allowedRoles={["retailer"]}>
                  <RetailerDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/wholesaler"
              element={
                <RoleGuard allowedRoles={["wholesaler"]}>
                  <WholesalerDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/products"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <Products />
                </RoleGuard>
              }
            />
            <Route
              path="/product/:id"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <ProductDetail />
                </RoleGuard>
              }
            />
            <Route
              path="/shopify/:handle"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <ShopifyProductDetail />
                </RoleGuard>
              }
            />
            <Route
              path="/cart"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <Cart />
                </RoleGuard>
              }
            />
            <Route
              path="/checkout"
              element={
                <RoleGuard allowedRoles={["customer"]}>
                  <Checkout />
                </RoleGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <RoleGuard>
                  <Profile />
                </RoleGuard>
              }
            />
            <Route
              path="/seller/products"
              element={
                <RoleGuard allowedRoles={["retailer", "wholesaler"]}>
                  <SellerProducts />
                </RoleGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
