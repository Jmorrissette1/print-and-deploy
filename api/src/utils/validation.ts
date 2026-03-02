export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  tags?: string[];
  inStock?: boolean;
  stock?: number;
  specifications?: Record<string, string>;
}

export function validateProductInput(body: any): { valid: boolean; error?: string; data?: ProductInput } {
  if (!body.name || typeof body.name !== "string" || body.name.length > 200) {
    return { valid: false, error: "name is required and must be under 200 characters" };
  }
  if (!body.category || typeof body.category !== "string" || body.category.length > 50) {
    return { valid: false, error: "category is required and must be under 50 characters" };
  }
  if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0 || body.price > 99999)) {
    return { valid: false, error: "price must be a number between 0 and 99999" };
  }
  if (body.description && (typeof body.description !== "string" || body.description.length > 2000)) {
    return { valid: false, error: "description must be under 2000 characters" };
  }
  if (body.imageUrl && (typeof body.imageUrl !== "string" || body.imageUrl.length > 500)) {
    return { valid: false, error: "imageUrl must be under 500 characters" };
  }

  const data: ProductInput = {
    name: body.name.trim(),
    description: body.description?.trim() || "",
    price: body.price || 0,
    category: body.category.trim().toLowerCase(),
    imageUrl: body.imageUrl?.trim(),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 20).map((t: any) => String(t).trim()) : undefined,
    inStock: typeof body.inStock === "boolean" ? body.inStock : true,
    stock: typeof body.stock === "number" ? Math.floor(body.stock) : undefined,
    specifications: body.specifications && typeof body.specifications === "object" && !Array.isArray(body.specifications)
      ? body.specifications
      : undefined,
  };

  return { valid: true, data };
}