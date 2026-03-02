"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl: string;
  tags: string[];
  specifications: {
    printTime?: string;
    material?: string;
    scale?: string;
    pieces?: number;
    height?: string;
    tileSize?: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const fullUrl = "https://func-printanddeploy-prod.azurewebsites.net/api/products";
        
        console.log("Fetching from:", fullUrl);
        
        const response = await fetch(fullUrl);

        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        console.log("Got data:", data);
        
        setProducts(data.products);
      } catch (err) {
        console.error("Full error:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = filter === "all"
    ? products
    : products.filter((p) => p.category === filter);

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  return (
    <main className="min-h-screen bg-black">
      <header className="border-b-2 border-red-950 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-4">
              <div className="text-4xl">⚔️</div>
              <div>
                <h1 className="text-3xl font-bold text-red-800 tracking-wider">
                  PRINT AND DEPLOY
                </h1>
                <p className="text-sm text-purple-400 tracking-widest">
                  3D PRINTED MINIATURES
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-black via-red-950/10 to-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-red-800 mb-4 uppercase tracking-wider">
            The Arsenal
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent mx-auto mb-6"></div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-4 justify-center flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 font-semibold uppercase tracking-wider transition-all border
                ${filter === category
                  ? "bg-red-900 border-red-700 text-white"
                  : "bg-transparent border-red-950 text-red-800 hover:border-red-800"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 text-red-900 animate-pulse">⚙️</div>
            <p className="text-red-800 text-xl uppercase tracking-wider">
              Loading Arsenal...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 text-red-900">⚠️</div>
            <p className="text-red-700 text-xl mb-4">{error}</p>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gradient-to-b from-red-950/10 to-black border border-red-950/50 p-6">
                <h3 className="text-xl font-bold text-red-700 mb-3">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-800">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}