
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function HomePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);

      setUser(parsedUser);

      // Auto redirect logged-in user
      navigate("/customer/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100">
      
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-10 items-center">
        
        <div>
          <h2 className="text-5xl font-bold text-gray-800 leading-tight">
            Grocery Shopping <br />
            Made Easy 🛒
          </h2>

          <p className="mt-6 text-lg text-gray-600">
            Shop fresh groceries, daily essentials, and household
            products with fast delivery right to your doorstep.
          </p>

          <div className="mt-8 flex gap-4">
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition"
                >
                  Get Started
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 border border-purple-600 text-purple-600 rounded-2xl font-semibold hover:bg-purple-50 transition"
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition"
              >
                Go To Dashboard
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <img
            src="/basket.png"
            alt="shopping"
            className="w-full max-w-md"
          />
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose QuickCart?
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-3xl shadow-md">
            <h4 className="text-xl font-bold">🚚 Fast Delivery</h4>

            <p className="mt-3 text-gray-600">
              Get your groceries delivered quickly and safely.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-md">
            <h4 className="text-xl font-bold">🥦 Fresh Products</h4>

            <p className="mt-3 text-gray-600">
              Quality fruits, vegetables, and daily essentials.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-md">
            <h4 className="text-xl font-bold">💳 Secure Payments</h4>

            <p className="mt-3 text-gray-600">
              Multiple payment options with secure transactions.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}

