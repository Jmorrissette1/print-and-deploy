import { CosmosClient } from "@azure/cosmos";

/**
 * Database seeding utility
 * Populates products container with initial test data
 */

const endpoint =
  process.env["COSMOS_ENDPOINT"] ||
  "https://cosmos-printanddeploy-prod.documents.azure.com:443/";
const key = process.env["COSMOS_KEY"] || "";
const databaseId = "printanddeploy";
const containerId = "products";

// Sample product data for testing
const testProducts = [
  {
    id: "prod-001",
    name: "Orc Warboss",
    description:
      "Detailed 3D printed orc warboss miniature for tabletop gaming",
    price: 15.0,
    category: "miniatures",
    inStock: true,
    imageUrl: "/products/orc-warboss.jpg",
    tags: ["orc", "warboss", "miniature", "fantasy"],
    specifications: {
      printTime: "8 hours",
      material: "PLA+",
      scale: "32mm",
      supports: "Yes",
    },
  },
  {
    id: "prod-002",
    name: "Forest Terrain Set",
    description:
      "Collection of 10 modular forest terrain pieces - trees, rocks, and vegetation",
    price: 25.0,
    category: "terrain",
    inStock: true,
    imageUrl: "/products/forest-terrain.jpg",
    tags: ["terrain", "forest", "scenery", "modular"],
    specifications: {
      printTime: "12 hours total",
      material: "PLA",
      pieces: 10,
      baseSize: "Various",
    },
  },
  {
    id: "prod-003",
    name: "Space Marine Captain",
    description:
      "Customizable space marine captain with interchangeable weapon options",
    price: 18.0,
    category: "miniatures",
    inStock: true,
    imageUrl: "/products/space-marine.jpg",
    tags: ["space marine", "sci-fi", "captain", "customizable"],
    specifications: {
      printTime: "10 hours",
      material: "Resin",
      scale: "32mm",
      weaponOptions: "Sword, Bolter, Power Fist",
    },
  },
  {
    id: "prod-004",
    name: "Medieval Tavern",
    description:
      "Complete medieval tavern building with removable roof and detailed interior",
    price: 35.0,
    category: "terrain",
    inStock: true,
    imageUrl: "/products/tavern.jpg",
    tags: ["building", "medieval", "tavern", "modular"],
    specifications: {
      printTime: "24 hours",
      material: "PLA",
      dimensions: "6in x 4in x 4in",
      floors: 2,
    },
  },
  {
    id: "prod-005",
    name: "Dragon Dice Tower",
    description:
      "Dragon-themed dice tower with felt-lined chute for smooth rolling",
    price: 20.0,
    category: "accessories",
    inStock: true,
    imageUrl: "/products/dice-tower.jpg",
    tags: ["dice tower", "dragon", "accessory", "utility"],
    specifications: {
      printTime: "16 hours",
      material: "PLA+",
      height: "8 inches",
      finish: "Hand-painted available",
    },
  },
  {
    id: "prod-006",
    name: "Dungeon Tile Set - Basic",
    description:
      "Starter set of 20 interlocking dungeon floor tiles for custom layouts",
    price: 30.0,
    category: "terrain",
    inStock: true,
    imageUrl: "/products/dungeon-tiles.jpg",
    tags: ["dungeon", "tiles", "modular", "starter"],
    specifications: {
      printTime: "18 hours total",
      material: "PLA",
      pieces: 20,
      tileSize: "2in x 2in",
    },
  },
];

async function seedDatabase() {
  console.log("=== Print and Deploy - Database Seeding ===\n");
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Database: ${databaseId}`);
  console.log(`Container: ${containerId}\n`);

  try {
    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseId);
    const container = database.container(containerId);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of testProducts) {
      try {
        await container.items.create(product);
        console.log(`✓ Created: ${product.name} (${product.id})`);
        created++;
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`- Skipped: ${product.name} (already exists)`);
          skipped++;
        } else {
          console.error(` Error creating ${product.name}:`, error.message);
          errors++;
        }
      }
    }

    console.log("\n=== Seeding Summary ===");
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped} (already existed)`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${testProducts.length} products\n`);

    if (errors > 0) {
      console.error(" Some products failed to seed");
      process.exit(1);
    } else {
      console.log(" Database seeding complete!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n Fatal error:", error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
