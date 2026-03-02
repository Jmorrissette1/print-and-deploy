"use client";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "../../lib/msal-config";
import Link from "next/link";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };
  
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gradient-to-b from-red-950/20 to-black border border-red-950 p-12 text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-red-800 mb-4">
            Inventory Management
          </h1>
          <p className="text-gray-400 mb-8">
            Sign in with your Microsoft account to manage products.
          </p>
          <button
            onClick={handleLogin}
            className="bg-red-900 hover:bg-red-800 text-white px-8 py-3 font-bold border-2 border-red-800 transition-all"
          >
            Sign In with Microsoft
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-black">
      <header className="border-b-2 border-red-950 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-2xl font-bold text-red-800 tracking-wider">
                PRINT & DEPLOY
              </Link>
              <span className="text-purple-500 text-sm">| INVENTORY MANAGEMENT</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/manage" className="text-red-700 hover:text-red-600 font-semibold transition">
                Products
              </Link>
              <Link href="/manage/create" className="text-red-700 hover:text-red-600 font-semibold transition">
                Add New
              </Link>
              <span className="text-gray-500 text-sm">
                {accounts[0]?.name || accounts[0]?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 text-sm transition"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </main>
  );
}