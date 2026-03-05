"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, apiBaseUrl } from "../../../../lib/msal-config";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditProductPage() {
  const { instance } = useMsal();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
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

  async function fetchProduct() {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/api/armory/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const product = await response.json();
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        category: product.category || "",
        imageUrl: product.imageUrl || "",
        inStock: product.inStock !== false,
        stock: product.stock?.toString() || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) return;

      const body: Record<string, any> = {};
      if (form.name) body.name = form.name;
      if (form.description !== undefined) body.description = form.description;
      if (form.price) body.price = parseFloat(form.price);
      if (form.imageUrl !== undefined) body.imageUrl = form.imageUrl;
      body.inStock = form.inStock;
      if (form.stock) body.stock = parseInt(form.stock);

      const response = await fetch(`${apiBaseUrl}/api/armory/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update product");
      }

      router.push("/armory");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchProduct();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-red-800 text-xl animate-pulse">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-red-800">Edit Product</h1>
        <Link
          href="/armory"
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

      <div className="bg-purple-950/10 border border-purple-900/30 px-4 py-2 mb-6">
        <p className="text-purple-400 text-sm">
          Category: <span className="font-bold uppercase">{form.category}</span>
          <span className="text-gray-500 ml-2">(cannot be changed)</span>
        </p>
      </div>

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
            />
          </div>

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
            />
          </div>
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
          />
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/armory"
            className="bg-transparent text-gray-400 hover:text-gray-200 px-8 py-3 font-bold border-2 border-gray-700 transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
