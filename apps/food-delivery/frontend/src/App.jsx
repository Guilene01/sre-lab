import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import OrderTracking from "./pages/OrderTracking";
import Orders from "./pages/Orders";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantMenu />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </ToastProvider>
  );
}
