"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, apiBaseUrl } from "../../lib/msal-config";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock?: boolean;
  stock?: number;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export default function ManagePage() {
  const { instance } = useMsal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getToken() {
    const account = instance.getActiveAccount();
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch {
      const response = await instance.acquireTokenRedirect(loginRequest);
      return null;
    }
  }

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/api/manage/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      setProducts(data.products);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/api/manage/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Delete failed");
        return;
      }

      fetchProducts();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-red-800">Product Inventory</h1>
        <Link
          href="/manage/create"
          className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 font-bold border-2 border-red-800 transition-all"
        >
          + Add Product
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-red-800 text-xl animate-pulse">
            Loading inventory...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800 p-4 mb-6">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchProducts}
            className="text-red-700 underline mt-2"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-xl mb-4">No products yet</p>
          <Link href="/manage/create" className="text-red-700 underline">
            Add your first product
          </Link>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-red-950">
                <th className="text-left py-3 px-4 text-red-700 font-bold">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-red-700 font-bold">
                  Category
                </th>
                <th className="text-right py-3 px-4 text-red-700 font-bold">
                  Price
                </th>
                <th className="text-center py-3 px-4 text-red-700 font-bold">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-red-700 font-bold">
                  Last Updated
                </th>
                <th className="text-right py-3 px-4 text-red-700 font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-red-950/30 hover:bg-red-950/10 transition"
                >
                  <td className="py-3 px-4">
                    <p className="text-gray-200 font-semibold">
                      {product.name}
                    </p>
                    <p className="text-gray-500 text-sm truncate max-w-xs">
                      {product.description}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-purple-400 text-sm uppercase">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-gray-200 font-bold">
                      ${product.price?.toFixed(2) || "0.00"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        product.inStock !== false
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {product.inStock !== false ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-500 text-sm">
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {product.updatedBy || ""}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-3 justify-end">
                      <Link
                        href={`/manage/edit/${product.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-400 text-sm font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
