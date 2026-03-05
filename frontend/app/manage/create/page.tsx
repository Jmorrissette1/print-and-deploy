"use client";

import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, apiBaseUrl } from "../../../lib/msal-config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProductPage() {
  const { instance } = useMsal();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "miniatures",
    imageUrl: "",
    inStock: true,
    stock: "",
  });

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
      await instance.acquireTokenRedirect(loginRequest);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) return;

      const body = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        imageUrl: form.imageUrl || undefined,
        inStock: form.inStock,
        stock: form.stock ? parseInt(form.stock) : undefined,
      };

      const response = await fetch(`${apiBaseUrl}/api/armory/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create product");
      }

      router.push("/manage");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-red-800">Add New Product</h1>
        <Link
          href="/manage"
          className="text-gray-500 hover:text-gray-300 transition"
        >
          ← Back to Inventory
        </Link>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 p-4 mb-6">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-red-700 font-semibold mb-2">
            Product Name *
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
            placeholder="e.g. Orc Warboss"
          />
        </div>

        <div>
          <label className="block text-red-700 font-semibold mb-2">
            Description
          </label>
          <textarea
            maxLength={2000}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
            placeholder="Describe the product..."
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-red-700 font-semibold mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              required
              min="0"
              max="99999"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
              placeholder="29.99"
            />
          </div>

          <div>
            <label className="block text-red-700 font-semibold mb-2">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
            >
              <option value="miniatures">Miniatures</option>
              <option value="terrain">Terrain</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-red-700 font-semibold mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-red-700 font-semibold mb-2">
              Image URL
            </label>
            <input
              type="text"
              maxLength={500}
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full bg-black border border-red-950 text-gray-200 px-4 py-3 focus:border-red-700 focus:outline-none"
              placeholder="/products/image.jpg"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="inStock"
            checked={form.inStock}
            onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
            className="w-5 h-5 accent-red-800"
          />
          <label htmlFor="inStock" className="text-gray-300">
            In Stock
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-red-900 hover:bg-red-800 text-white px-8 py-3 font-bold border-2 border-red-800 transition-all disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
          <Link
            href="/manage"
            className="bg-transparent text-gray-400 hover:text-gray-200 px-8 py-3 font-bold border-2 border-gray-700 transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
