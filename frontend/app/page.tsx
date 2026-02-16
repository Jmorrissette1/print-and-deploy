export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Navbar - Darker Red */}
      <header className="border-b-2 border-red-950 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">Logo here</div>
              <div>
                <h1 className="text-3xl font-bold text-red-800 tracking-wider">
                  PRINT AND DEPLOY
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#products"
                className="text-red-700 hover:text-red-600 transition font-semibold"
              >
                Products
              </a>
              <a
                href="#about"
                className="text-red-700 hover:text-red-600 transition font-semibold"
              >
                About
              </a>
              <a
                href="#cart"
                className="text-red-700 hover:text-red-600 transition font-semibold"
              >
                Cart (0)
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>

        <div className="container mx-auto px-4 py-24 text-center relative z-10">
          <div className="mb-8">
            <div className="text-7xl mb-6 text-red-900">⚔️</div>
          </div>
          <h2 className="text-6xl md:text-7xl font-bold text-red-800 mb-6 tracking-tight">
            Forge Your Army
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Premium 3D printed miniatures and terrain for tabletop gaming. From
            the digital forge to your battlefield.
          </p>

          {/* Explore Your Adventure */}
          <div className="flex gap-6 justify-center flex-wrap">
            <a
              href="#products"
              className="bg-red-900 hover:bg-red-800 text-white px-10 py-4 
                       font-bold transition-all 
                       border-2 border-red-800 shadow-lg shadow-red-950/80
                       hover:shadow-red-900/70"
            >
              Browse Products
            </a>

            <a
              href="#about"
              className="bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 px-10 py-4 
                       font-bold transition-all 
                       border-2 border-purple-700 hover:border-purple-600"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
      <section className="bg-black border-y border-red-950">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div
              className="bg-gradient-to-b from-red-950/20 to-black p-8 border border-red-950/70 
                          hover:border-red-800/70 transition-all group"
            >
              <div className="text-5xl mb-6 text-red-800">🎨</div>
              <h3 className="text-2xl font-bold text-red-700 mb-4">
                Premium Quality
              </h3>
              <p className="text-gray-400 leading-relaxed">
                High-detail prints using professional-grade materials. Every
                miniature crafted with precision.
              </p>
            </div>

            {/* Fast Shipping */}
            <div
              className="bg-gradient-to-b from-purple-950/20 to-black p-8 border border-purple-900/50 
                          hover:border-purple-700/70 transition-all group"
            >
              <div className="text-5xl mb-6 text-purple-500">⚡</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-4">
                Fast Shipping
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Most orders ship within 3-5 business days. Get your army
                battle-ready quickly.
              </p>
            </div>

            {/* Battle Ready */}
            <div
              className="bg-gradient-to-b from-red-950/20 to-black p-8 border border-red-950/70 
                          hover:border-red-800/70 transition-all group"
            >
              <div className="text-5xl mb-6 text-red-800">🛡️</div>
              <h3 className="text-2xl font-bold text-red-700 mb-4">
                Battle-Ready
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Designed for durability and tabletop excellence. Built to last
                through countless campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section
        id="products"
        className="bg-gradient-to-b from-black to-purple-950/10 py-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-red-800 mb-6">
              Featured Products
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent mx-auto mb-8"></div>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <div
              className="bg-gradient-to-b from-red-950/10 to-purple-950/10 border-2 border-red-950/70 p-12
                          backdrop-blur-sm"
            >
              <div className="text-6xl mb-6 text-red-900">🚧</div>
              <p className="text-2xl text-red-700 font-bold mb-4">
                COMING SOON
              </p>
              <p className="text-gray-400 text-lg mb-6">
                Product catalog loading...
              </p>
              <p className="text-3xl font-bold text-red-800">MARCH 31, 2026</p>
            </div>
          </div>
        </div>
      </section>
      {/* DM tools */}

      {/* Footer - Darker Red */}
      <footer className="border-t-2 border-red-950 bg-gradient-to-b from-purple-950/10 to-black">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="mb-6">
              <span className="text-4xl text-red-900">⚔️</span>
            </div>
            <p className="text-red-800 font-bold text-xl mb-2">
              PRINT AND DEPLOY
            </p>
            <p className="text-purple-400 text-sm mb-4">
              3D Printed Gaming Miniatures & Terrain
            </p>
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-red-950 to-transparent mx-auto my-6"></div>
            <p className="text-gray-500 text-sm mb-2">
              <span className="text-red-800">Launching:</span> March 31, 2026
            </p>
            <p className="text-gray-500 text-sm mb-6">
              <span className="text-purple-500">Convention:</span> April 25,
              2026
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
