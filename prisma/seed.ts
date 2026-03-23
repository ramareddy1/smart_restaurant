import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data (order matters for FK constraints)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.table.deleteMany();
  await prisma.prepTask.deleteMany();
  await prisma.ingredientAllergen.deleteMany();
  await prisma.allergen.deleteMany();
  await prisma.session.deleteMany();
  await prisma.menuMenuItem.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.restaurant.deleteMany();

  // ─── Restaurant ───────────────────────────

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Bella Vista",
      address: "742 Evergreen Terrace, Springfield, IL 62704",
      phone: "555-0100",
      timezone: "America/Chicago",
    },
  });

  await prisma.restaurantSettings.create({
    data: {
      restaurantId: restaurant.id,
      targetFoodCost: 0.30,
      targetLaborCost: 0.28,
      currency: "USD",
      fiscalYearStart: 1,
    },
  });

  // ─── Staff (5 users — one per role) ───────

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "owner@bellavista.com",
        name: "Maria Santos",
        role: "OWNER",
        pin: "0000",
        restaurantId: restaurant.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "kitchen@bellavista.com",
        name: "James Park",
        role: "KITCHEN_MANAGER",
        pin: "1111",
        restaurantId: restaurant.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "chef@bellavista.com",
        name: "Sophie Laurent",
        role: "HEAD_CHEF",
        pin: "2222",
        restaurantId: restaurant.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "server@bellavista.com",
        name: "Alex Rivera",
        role: "SERVER",
        pin: "3333",
        restaurantId: restaurant.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "host@bellavista.com",
        name: "Taylor Kim",
        role: "HOST",
        pin: "4444",
        restaurantId: restaurant.id,
      },
    }),
  ]);

  console.log(`  Restaurant: ${restaurant.name} (${restaurant.id})`);
  console.log(`  Users: ${users.length} staff members created`);

  // ─── Suppliers ──────────────────────────

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Fresh Farms Co.",
        contactEmail: "orders@freshfarms.com",
        contactPhone: "555-0101",
        address: "123 Farm Road, Countryside, CA 90210",
        notes: "Organic produce specialist. Deliveries Mon/Wed/Fri.",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Ocean Catch Seafood",
        contactEmail: "supply@oceancatch.com",
        contactPhone: "555-0102",
        address: "456 Harbor Drive, Seaside, CA 90211",
        notes: "Premium seafood. Next-day delivery available.",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Valley Meats",
        contactEmail: "info@valleymeats.com",
        contactPhone: "555-0103",
        address: "789 Ranch Blvd, Valley, CA 90212",
        notes: "USDA certified. Bulk discounts on orders over $500.",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Global Pantry Distributors",
        contactEmail: "wholesale@globalpantry.com",
        contactPhone: "555-0104",
        address: "321 Industrial Park, Metro, CA 90213",
        notes: "Dry goods, spices, oils. Weekly deliveries.",
      },
    }),
  ]);

  const [freshFarms, oceanCatch, valleyMeats, globalPantry] = suppliers;

  // ─── Ingredients ────────────────────────

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  const ingredients = await Promise.all([
    // Produce
    prisma.ingredient.create({
      data: { name: "Tomatoes", category: "Produce", unit: "kg", currentStock: 15, parLevel: 10, costPerUnit: 3.50, expirationDate: daysFromNow(5), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Lettuce", category: "Produce", unit: "pieces", currentStock: 8, parLevel: 12, costPerUnit: 2.00, expirationDate: daysFromNow(3), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Onions", category: "Produce", unit: "kg", currentStock: 20, parLevel: 8, costPerUnit: 1.80, expirationDate: daysFromNow(14), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Garlic", category: "Produce", unit: "kg", currentStock: 3, parLevel: 2, costPerUnit: 8.00, expirationDate: daysFromNow(21), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Bell Peppers", category: "Produce", unit: "kg", currentStock: 4, parLevel: 6, costPerUnit: 5.00, expirationDate: daysFromNow(4), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Lemons", category: "Produce", unit: "pieces", currentStock: 25, parLevel: 15, costPerUnit: 0.50, expirationDate: daysFromNow(10), supplierId: freshFarms.id },
    }),
    // Dairy
    prisma.ingredient.create({
      data: { name: "Mozzarella Cheese", category: "Dairy", unit: "kg", currentStock: 5, parLevel: 8, costPerUnit: 12.00, expirationDate: daysFromNow(7), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Heavy Cream", category: "Dairy", unit: "liters", currentStock: 6, parLevel: 5, costPerUnit: 4.50, expirationDate: daysFromNow(5), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Butter", category: "Dairy", unit: "kg", currentStock: 4, parLevel: 3, costPerUnit: 7.00, expirationDate: daysFromNow(30), supplierId: freshFarms.id },
    }),
    prisma.ingredient.create({
      data: { name: "Parmesan Cheese", category: "Dairy", unit: "kg", currentStock: 2, parLevel: 3, costPerUnit: 22.00, expirationDate: daysFromNow(60), supplierId: freshFarms.id },
    }),
    // Meat
    prisma.ingredient.create({
      data: { name: "Chicken Breast", category: "Meat", unit: "kg", currentStock: 10, parLevel: 12, costPerUnit: 9.50, expirationDate: daysFromNow(3), supplierId: valleyMeats.id },
    }),
    prisma.ingredient.create({
      data: { name: "Bacon", category: "Meat", unit: "kg", currentStock: 3, parLevel: 4, costPerUnit: 14.00, expirationDate: daysFromNow(7), supplierId: valleyMeats.id },
    }),
    // Seafood
    prisma.ingredient.create({
      data: { name: "Salmon Fillet", category: "Seafood", unit: "kg", currentStock: 4, parLevel: 5, costPerUnit: 24.00, expirationDate: daysFromNow(2), supplierId: oceanCatch.id },
    }),
    prisma.ingredient.create({
      data: { name: "Shrimp", category: "Seafood", unit: "kg", currentStock: 3, parLevel: 4, costPerUnit: 18.00, expirationDate: daysFromNow(2), supplierId: oceanCatch.id },
    }),
    // Dry Goods
    prisma.ingredient.create({
      data: { name: "Pasta (Spaghetti)", category: "Dry Goods", unit: "kg", currentStock: 15, parLevel: 8, costPerUnit: 2.50, expirationDate: daysFromNow(180), supplierId: globalPantry.id },
    }),
    prisma.ingredient.create({
      data: { name: "Rice", category: "Dry Goods", unit: "kg", currentStock: 25, parLevel: 10, costPerUnit: 2.00, expirationDate: daysFromNow(365), supplierId: globalPantry.id },
    }),
    prisma.ingredient.create({
      data: { name: "All-Purpose Flour", category: "Dry Goods", unit: "kg", currentStock: 12, parLevel: 5, costPerUnit: 1.20, expirationDate: daysFromNow(120), supplierId: globalPantry.id },
    }),
    // Spices
    prisma.ingredient.create({
      data: { name: "Black Pepper", category: "Spices", unit: "g", currentStock: 500, parLevel: 200, costPerUnit: 0.05, expirationDate: daysFromNow(365), supplierId: globalPantry.id },
    }),
    prisma.ingredient.create({
      data: { name: "Oregano", category: "Spices", unit: "g", currentStock: 300, parLevel: 150, costPerUnit: 0.04, expirationDate: daysFromNow(365), supplierId: globalPantry.id },
    }),
    // Oils
    prisma.ingredient.create({
      data: { name: "Olive Oil", category: "Oils & Vinegars", unit: "liters", currentStock: 8, parLevel: 5, costPerUnit: 9.00, expirationDate: daysFromNow(180), supplierId: globalPantry.id },
    }),
    prisma.ingredient.create({
      data: { name: "Balsamic Vinegar", category: "Oils & Vinegars", unit: "liters", currentStock: 2, parLevel: 2, costPerUnit: 12.00, expirationDate: daysFromNow(365), supplierId: globalPantry.id },
    }),
  ]);

  const [
    tomatoes, lettuce, onions, garlic, bellPeppers, lemons,
    mozzarella, heavyCream, butter, parmesan,
    chicken, bacon,
    salmon, shrimp,
    pasta, rice, flour,
    blackPepper, oregano,
    oliveOil, balsamicVinegar,
  ] = ingredients;

  // ─── Recipes ────────────────────────────

  const recipes = await Promise.all([
    prisma.recipe.create({
      data: {
        name: "Classic Margherita Pizza",
        description: "Traditional Neapolitan-style pizza with fresh mozzarella and basil",
        category: "Main Course",
        yieldQuantity: 2,
        yieldUnit: "servings",
        prepTimeMin: 30,
        cookTimeMin: 15,
        difficultyLevel: "Medium",
        instructions: "1. Prepare pizza dough with flour, water, yeast, and olive oil.\n2. Spread crushed tomatoes on dough.\n3. Add fresh mozzarella slices.\n4. Bake at 450°F for 12-15 minutes.\n5. Drizzle with olive oil and season with oregano.",
        ingredients: {
          create: [
            { ingredientId: flour.id, quantity: 0.3, unit: "kg" },
            { ingredientId: tomatoes.id, quantity: 0.2, unit: "kg" },
            { ingredientId: mozzarella.id, quantity: 0.15, unit: "kg" },
            { ingredientId: oliveOil.id, quantity: 0.03, unit: "liters" },
            { ingredientId: oregano.id, quantity: 5, unit: "g" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Grilled Salmon",
        description: "Pan-seared salmon with lemon butter sauce",
        category: "Main Course",
        yieldQuantity: 1,
        yieldUnit: "serving",
        prepTimeMin: 10,
        cookTimeMin: 8,
        difficultyLevel: "Medium",
        instructions: "1. Season salmon with salt, pepper, and lemon juice.\n2. Heat olive oil in pan over medium-high heat.\n3. Sear salmon skin-side down for 4 minutes.\n4. Flip and cook 3 more minutes.\n5. Add butter and lemon juice for sauce.",
        ingredients: {
          create: [
            { ingredientId: salmon.id, quantity: 0.2, unit: "kg" },
            { ingredientId: butter.id, quantity: 0.03, unit: "kg" },
            { ingredientId: lemons.id, quantity: 1, unit: "pieces" },
            { ingredientId: oliveOil.id, quantity: 0.02, unit: "liters" },
            { ingredientId: blackPepper.id, quantity: 3, unit: "g" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with parmesan and homemade dressing",
        category: "Salad",
        yieldQuantity: 2,
        yieldUnit: "servings",
        prepTimeMin: 15,
        cookTimeMin: 0,
        difficultyLevel: "Easy",
        instructions: "1. Wash and chop lettuce.\n2. Make dressing with garlic, lemon, olive oil, and parmesan.\n3. Toss lettuce with dressing.\n4. Top with shaved parmesan and croutons.",
        ingredients: {
          create: [
            { ingredientId: lettuce.id, quantity: 1, unit: "pieces" },
            { ingredientId: parmesan.id, quantity: 0.05, unit: "kg" },
            { ingredientId: garlic.id, quantity: 0.01, unit: "kg" },
            { ingredientId: lemons.id, quantity: 1, unit: "pieces" },
            { ingredientId: oliveOil.id, quantity: 0.04, unit: "liters" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Spaghetti Carbonara",
        description: "Classic Italian pasta with bacon, egg, and parmesan",
        category: "Main Course",
        yieldQuantity: 2,
        yieldUnit: "servings",
        prepTimeMin: 10,
        cookTimeMin: 15,
        difficultyLevel: "Medium",
        instructions: "1. Cook spaghetti al dente.\n2. Fry bacon until crispy.\n3. Mix eggs with parmesan.\n4. Toss hot pasta with bacon.\n5. Add egg mixture off heat, stirring rapidly.\n6. Season with black pepper.",
        ingredients: {
          create: [
            { ingredientId: pasta.id, quantity: 0.25, unit: "kg" },
            { ingredientId: bacon.id, quantity: 0.1, unit: "kg" },
            { ingredientId: parmesan.id, quantity: 0.06, unit: "kg" },
            { ingredientId: blackPepper.id, quantity: 5, unit: "g" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Chicken Alfredo",
        description: "Creamy pasta with grilled chicken breast",
        category: "Main Course",
        yieldQuantity: 2,
        yieldUnit: "servings",
        prepTimeMin: 15,
        cookTimeMin: 20,
        difficultyLevel: "Medium",
        instructions: "1. Grill chicken breast, slice.\n2. Cook pasta al dente.\n3. Make Alfredo sauce with cream, butter, and parmesan.\n4. Combine pasta with sauce and chicken.",
        ingredients: {
          create: [
            { ingredientId: chicken.id, quantity: 0.3, unit: "kg" },
            { ingredientId: pasta.id, quantity: 0.25, unit: "kg" },
            { ingredientId: heavyCream.id, quantity: 0.2, unit: "liters" },
            { ingredientId: butter.id, quantity: 0.03, unit: "kg" },
            { ingredientId: parmesan.id, quantity: 0.05, unit: "kg" },
            { ingredientId: garlic.id, quantity: 0.01, unit: "kg" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Garlic Shrimp",
        description: "Sauteed shrimp in garlic butter sauce",
        category: "Appetizer",
        yieldQuantity: 2,
        yieldUnit: "servings",
        prepTimeMin: 15,
        cookTimeMin: 6,
        difficultyLevel: "Easy",
        instructions: "1. Clean and devein shrimp.\n2. Sauté garlic in butter and olive oil.\n3. Add shrimp, cook 2-3 min per side.\n4. Squeeze lemon juice, season with pepper.",
        ingredients: {
          create: [
            { ingredientId: shrimp.id, quantity: 0.25, unit: "kg" },
            { ingredientId: garlic.id, quantity: 0.02, unit: "kg" },
            { ingredientId: butter.id, quantity: 0.04, unit: "kg" },
            { ingredientId: oliveOil.id, quantity: 0.02, unit: "liters" },
            { ingredientId: lemons.id, quantity: 1, unit: "pieces" },
          ],
        },
      },
    }),
    prisma.recipe.create({
      data: {
        name: "Grilled Chicken Salad",
        description: "Healthy salad with grilled chicken, bell peppers, and balsamic dressing",
        category: "Salad",
        yieldQuantity: 1,
        yieldUnit: "serving",
        prepTimeMin: 20,
        cookTimeMin: 10,
        difficultyLevel: "Easy",
        instructions: "1. Grill chicken breast, slice.\n2. Chop lettuce, bell peppers, onions, tomatoes.\n3. Toss with balsamic vinaigrette.\n4. Top with grilled chicken.",
        ingredients: {
          create: [
            { ingredientId: chicken.id, quantity: 0.15, unit: "kg" },
            { ingredientId: lettuce.id, quantity: 1, unit: "pieces" },
            { ingredientId: bellPeppers.id, quantity: 0.1, unit: "kg" },
            { ingredientId: tomatoes.id, quantity: 0.1, unit: "kg" },
            { ingredientId: onions.id, quantity: 0.05, unit: "kg" },
            { ingredientId: balsamicVinegar.id, quantity: 0.03, unit: "liters" },
            { ingredientId: oliveOil.id, quantity: 0.02, unit: "liters" },
          ],
        },
      },
    }),
  ]);

  // ─── Menu Items ─────────────────────────

  const menuItems = await Promise.all([
    prisma.menuItem.create({ data: { name: "Margherita Pizza", price: 14.99, category: "Mains", recipeId: recipes[0].id } }),
    prisma.menuItem.create({ data: { name: "Grilled Salmon", price: 24.99, category: "Mains", recipeId: recipes[1].id } }),
    prisma.menuItem.create({ data: { name: "Caesar Salad", price: 10.99, category: "Starters", recipeId: recipes[2].id } }),
    prisma.menuItem.create({ data: { name: "Spaghetti Carbonara", price: 16.99, category: "Mains", recipeId: recipes[3].id } }),
    prisma.menuItem.create({ data: { name: "Chicken Alfredo", price: 17.99, category: "Mains", recipeId: recipes[4].id } }),
    prisma.menuItem.create({ data: { name: "Garlic Shrimp", price: 13.99, category: "Starters", recipeId: recipes[5].id } }),
    prisma.menuItem.create({ data: { name: "Grilled Chicken Salad", price: 12.99, category: "Starters", recipeId: recipes[6].id } }),
    prisma.menuItem.create({ data: { name: "Sparkling Water", price: 3.99, category: "Drinks", description: "500ml Pellegrino" } }),
    prisma.menuItem.create({ data: { name: "House Wine (Glass)", price: 8.99, category: "Drinks", description: "Red or White" } }),
    prisma.menuItem.create({ data: { name: "Espresso", price: 3.49, category: "Drinks" } }),
    prisma.menuItem.create({ data: { name: "Tiramisu", price: 9.99, category: "Desserts", description: "Classic Italian dessert" } }),
  ]);

  // ─── Menus ──────────────────────────────

  await prisma.menu.create({
    data: {
      name: "Dinner Menu",
      description: "Full dinner service menu",
      isActive: true,
      items: {
        create: menuItems.map((item) => ({ menuItemId: item.id })),
      },
    },
  });

  await prisma.menu.create({
    data: {
      name: "Lunch Special",
      description: "Weekday lunch specials",
      isActive: true,
      items: {
        create: [
          { menuItemId: menuItems[2].id }, // Caesar Salad
          { menuItemId: menuItems[3].id }, // Carbonara
          { menuItemId: menuItems[6].id }, // Grilled Chicken Salad
          { menuItemId: menuItems[7].id }, // Sparkling Water
          { menuItemId: menuItems[9].id }, // Espresso
        ],
      },
    },
  });

  // ─── Transactions (last 30 days) ────────

  const transactionData: Array<{
    type: "PURCHASE" | "USAGE" | "WASTE";
    ingredientId: string;
    quantity: number;
    unitCost?: number;
    supplierId?: string;
    notes?: string;
    daysAgo: number;
  }> = [
    // Purchases
    { type: "PURCHASE", ingredientId: tomatoes.id, quantity: 20, unitCost: 3.50, supplierId: freshFarms.id, notes: "Weekly order", daysAgo: 28 },
    { type: "PURCHASE", ingredientId: mozzarella.id, quantity: 10, unitCost: 12.00, supplierId: freshFarms.id, notes: "Weekly order", daysAgo: 28 },
    { type: "PURCHASE", ingredientId: chicken.id, quantity: 15, unitCost: 9.50, supplierId: valleyMeats.id, daysAgo: 25 },
    { type: "PURCHASE", ingredientId: salmon.id, quantity: 8, unitCost: 24.00, supplierId: oceanCatch.id, daysAgo: 25 },
    { type: "PURCHASE", ingredientId: pasta.id, quantity: 10, unitCost: 2.50, supplierId: globalPantry.id, daysAgo: 21 },
    { type: "PURCHASE", ingredientId: oliveOil.id, quantity: 5, unitCost: 9.00, supplierId: globalPantry.id, daysAgo: 21 },
    { type: "PURCHASE", ingredientId: heavyCream.id, quantity: 8, unitCost: 4.50, supplierId: freshFarms.id, daysAgo: 14 },
    { type: "PURCHASE", ingredientId: lettuce.id, quantity: 20, unitCost: 2.00, supplierId: freshFarms.id, notes: "Bi-weekly order", daysAgo: 14 },
    { type: "PURCHASE", ingredientId: shrimp.id, quantity: 6, unitCost: 18.00, supplierId: oceanCatch.id, daysAgo: 10 },
    { type: "PURCHASE", ingredientId: bacon.id, quantity: 5, unitCost: 14.00, supplierId: valleyMeats.id, daysAgo: 10 },
    { type: "PURCHASE", ingredientId: tomatoes.id, quantity: 15, unitCost: 3.50, supplierId: freshFarms.id, notes: "Weekly order", daysAgo: 7 },
    { type: "PURCHASE", ingredientId: chicken.id, quantity: 10, unitCost: 9.50, supplierId: valleyMeats.id, daysAgo: 5 },
    { type: "PURCHASE", ingredientId: bellPeppers.id, quantity: 8, unitCost: 5.00, supplierId: freshFarms.id, daysAgo: 5 },
    { type: "PURCHASE", ingredientId: mozzarella.id, quantity: 8, unitCost: 12.00, supplierId: freshFarms.id, daysAgo: 3 },
    // Usage
    { type: "USAGE", ingredientId: tomatoes.id, quantity: 5, daysAgo: 27 },
    { type: "USAGE", ingredientId: mozzarella.id, quantity: 3, daysAgo: 27 },
    { type: "USAGE", ingredientId: chicken.id, quantity: 4, daysAgo: 24 },
    { type: "USAGE", ingredientId: pasta.id, quantity: 3, daysAgo: 22 },
    { type: "USAGE", ingredientId: salmon.id, quantity: 2, daysAgo: 22 },
    { type: "USAGE", ingredientId: tomatoes.id, quantity: 4, daysAgo: 20 },
    { type: "USAGE", ingredientId: lettuce.id, quantity: 5, daysAgo: 15 },
    { type: "USAGE", ingredientId: chicken.id, quantity: 5, daysAgo: 13 },
    { type: "USAGE", ingredientId: shrimp.id, quantity: 2, daysAgo: 9 },
    { type: "USAGE", ingredientId: tomatoes.id, quantity: 6, daysAgo: 8 },
    { type: "USAGE", ingredientId: mozzarella.id, quantity: 4, daysAgo: 6 },
    { type: "USAGE", ingredientId: bacon.id, quantity: 1.5, daysAgo: 6 },
    { type: "USAGE", ingredientId: pasta.id, quantity: 4, daysAgo: 4 },
    { type: "USAGE", ingredientId: chicken.id, quantity: 3, daysAgo: 2 },
    { type: "USAGE", ingredientId: bellPeppers.id, quantity: 3, daysAgo: 1 },
    // Waste
    { type: "WASTE", ingredientId: lettuce.id, quantity: 3, notes: "Wilted, past quality threshold", daysAgo: 12 },
    { type: "WASTE", ingredientId: tomatoes.id, quantity: 2, notes: "Overripe", daysAgo: 10 },
    { type: "WASTE", ingredientId: salmon.id, quantity: 0.5, notes: "Spoiled due to fridge issue", daysAgo: 8 },
    { type: "WASTE", ingredientId: heavyCream.id, quantity: 1, notes: "Expired", daysAgo: 5 },
    { type: "WASTE", ingredientId: bellPeppers.id, quantity: 1, notes: "Damaged in delivery", daysAgo: 3 },
  ];

  for (const tx of transactionData) {
    await prisma.transaction.create({
      data: {
        type: tx.type,
        ingredientId: tx.ingredientId,
        quantity: tx.quantity,
        unitCost: tx.unitCost ?? null,
        totalCost: tx.unitCost ? tx.quantity * tx.unitCost : null,
        supplierId: tx.supplierId ?? null,
        notes: tx.notes ?? null,
        createdAt: new Date(now.getTime() - tx.daysAgo * 86400000),
      },
    });
  }

  // ─── Alerts (seed a few) ────────────────

  await prisma.alert.createMany({
    data: [
      {
        type: "LOW_STOCK",
        severity: "WARNING",
        title: "Low stock: Lettuce",
        message: "Lettuce is at 8 pieces, below par level of 12 pieces.",
        ingredientId: lettuce.id,
      },
      {
        type: "LOW_STOCK",
        severity: "WARNING",
        title: "Low stock: Mozzarella Cheese",
        message: "Mozzarella Cheese is at 5 kg, below par level of 8 kg.",
        ingredientId: mozzarella.id,
      },
      {
        type: "LOW_STOCK",
        severity: "WARNING",
        title: "Low stock: Bell Peppers",
        message: "Bell Peppers is at 4 kg, below par level of 6 kg.",
        ingredientId: bellPeppers.id,
      },
      {
        type: "OVERSTOCK",
        severity: "INFO",
        title: "Overstock: Onions",
        message: "Onions is at 20 kg — more than 2x par level (8 kg). Consider reducing next order.",
        ingredientId: onions.id,
      },
    ],
  });

  // ─── Allergens (14 common) ──────────────

  const allergenNames = [
    "Milk", "Eggs", "Fish", "Crustacean Shellfish", "Tree Nuts",
    "Peanuts", "Wheat", "Soybeans", "Sesame", "Mustard",
    "Celery", "Lupin", "Mollusks", "Sulfites",
  ];

  const allergens = await Promise.all(
    allergenNames.map((name) =>
      prisma.allergen.create({ data: { name } })
    )
  );

  const allergenMap = Object.fromEntries(
    allergens.map((a) => [a.name, a.id])
  );

  // ─── Ingredient ↔ Allergen assignments ──

  const ingredientAllergenData: Array<{ ingredientId: string; allergenNames: string[] }> = [
    { ingredientId: mozzarella.id, allergenNames: ["Milk"] },
    { ingredientId: heavyCream.id, allergenNames: ["Milk"] },
    { ingredientId: butter.id, allergenNames: ["Milk"] },
    { ingredientId: parmesan.id, allergenNames: ["Milk", "Eggs"] },
    { ingredientId: salmon.id, allergenNames: ["Fish"] },
    { ingredientId: shrimp.id, allergenNames: ["Crustacean Shellfish"] },
    { ingredientId: pasta.id, allergenNames: ["Wheat", "Eggs"] },
    { ingredientId: flour.id, allergenNames: ["Wheat"] },
    { ingredientId: bacon.id, allergenNames: ["Sulfites"] },
  ];

  for (const entry of ingredientAllergenData) {
    for (const aName of entry.allergenNames) {
      await prisma.ingredientAllergen.create({
        data: {
          ingredientId: entry.ingredientId,
          allergenId: allergenMap[aName],
        },
      });
    }
  }

  // ─── Prep Tasks (sample for today + tomorrow) ──

  const today = new Date();
  today.setHours(8, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const chef = users[2]; // Sophie Laurent — HEAD_CHEF

  await Promise.all([
    prisma.prepTask.create({
      data: {
        name: "Prep pizza dough (20 portions)",
        recipeId: recipes[0].id,
        assignedToId: chef.id,
        scheduledFor: today,
        estimatedMin: 45,
        status: "COMPLETED",
        completedAt: new Date(today.getTime() + 50 * 60000),
        notes: "Rest dough 2 hours before service",
      },
    }),
    prisma.prepTask.create({
      data: {
        name: "Prep Caesar dressing (2L)",
        recipeId: recipes[2].id,
        assignedToId: chef.id,
        scheduledFor: today,
        estimatedMin: 15,
        status: "IN_PROGRESS",
      },
    }),
    prisma.prepTask.create({
      data: {
        name: "Portion salmon fillets (10 servings)",
        recipeId: recipes[1].id,
        assignedToId: chef.id,
        scheduledFor: today,
        estimatedMin: 20,
        status: "PENDING",
      },
    }),
    prisma.prepTask.create({
      data: {
        name: "Make Alfredo sauce batch",
        recipeId: recipes[4].id,
        assignedToId: chef.id,
        scheduledFor: tomorrow,
        estimatedMin: 25,
        status: "PENDING",
      },
    }),
    prisma.prepTask.create({
      data: {
        name: "Clean and devein shrimp (5kg)",
        recipeId: recipes[5].id,
        scheduledFor: tomorrow,
        estimatedMin: 40,
        status: "PENDING",
        notes: "Double order for weekend rush",
      },
    }),
  ]);

  // ─── Tables (10 restaurant tables) ─────

  const server = users[3]; // Alex Rivera — SERVER

  const tables = await Promise.all([
    prisma.table.create({ data: { number: 1, name: "Window Left", seats: 2, status: "AVAILABLE", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 2, name: "Window Right", seats: 2, status: "AVAILABLE", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 3, name: "Center A", seats: 4, status: "OCCUPIED", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 4, name: "Center B", seats: 4, status: "OCCUPIED", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 5, name: "Center C", seats: 4, status: "AVAILABLE", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 6, name: "Booth 1", seats: 6, status: "AVAILABLE", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 7, name: "Booth 2", seats: 6, status: "RESERVED", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 8, name: "Patio A", seats: 4, status: "AVAILABLE", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 9, name: "Patio B", seats: 4, status: "CLEANING", restaurantId: restaurant.id } }),
    prisma.table.create({ data: { number: 10, name: "Private Room", seats: 8, status: "AVAILABLE", restaurantId: restaurant.id } }),
  ]);

  // ─── Orders & Payments ────────────────

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Order 1: PREPARING (Table 3) — sent to kitchen
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${todayStr}-001`,
      tableId: tables[2].id,
      serverId: server.id,
      status: "PREPARING",
      guestCount: 3,
      subtotal: 52.97,
      tax: 4.50,
      total: 57.47,
      items: {
        create: [
          { menuItemId: menuItems[0].id, quantity: 1, unitPrice: 14.99, status: "PREPARING", specialInstructions: "Extra crispy", sentToKitchenAt: new Date() },
          { menuItemId: menuItems[3].id, quantity: 1, unitPrice: 16.99, status: "PREPARING", sentToKitchenAt: new Date() },
          { menuItemId: menuItems[2].id, quantity: 1, unitPrice: 10.99, status: "READY", sentToKitchenAt: new Date(), readyAt: new Date() },
          { menuItemId: menuItems[7].id, quantity: 2, unitPrice: 3.99, status: "SERVED" },
        ],
      },
    },
  });

  // Order 2: OPEN (Table 4) — not yet sent to kitchen
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${todayStr}-002`,
      tableId: tables[3].id,
      serverId: server.id,
      status: "OPEN",
      guestCount: 2,
      subtotal: 33.98,
      tax: 2.89,
      total: 36.87,
      items: {
        create: [
          { menuItemId: menuItems[1].id, quantity: 1, unitPrice: 24.99, status: "PENDING" },
          { menuItemId: menuItems[8].id, quantity: 1, unitPrice: 8.99, status: "PENDING" },
        ],
      },
    },
  });

  // Order 3: CLOSED (Table 9, now cleaning) — completed earlier today
  const closedAt = new Date(now.getTime() - 2 * 3600000); // 2 hours ago
  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${todayStr}-003`,
      tableId: tables[8].id,
      serverId: server.id,
      status: "CLOSED",
      guestCount: 4,
      subtotal: 82.93,
      tax: 7.05,
      total: 89.98,
      closedAt,
      items: {
        create: [
          { menuItemId: menuItems[5].id, quantity: 1, unitPrice: 13.99, status: "SERVED", sentToKitchenAt: closedAt, readyAt: closedAt },
          { menuItemId: menuItems[4].id, quantity: 2, unitPrice: 17.99, status: "SERVED", sentToKitchenAt: closedAt, readyAt: closedAt },
          { menuItemId: menuItems[6].id, quantity: 1, unitPrice: 12.99, status: "SERVED", sentToKitchenAt: closedAt, readyAt: closedAt },
          { menuItemId: menuItems[10].id, quantity: 2, unitPrice: 9.99, status: "SERVED" },
        ],
      },
    },
  });

  // Payment for closed order (fully paid with tip)
  await prisma.payment.create({
    data: {
      orderId: order3.id,
      method: "CARD",
      amount: 89.98,
      tip: 15.00,
      reference: "****4521",
    },
  });

  // Order 4: Another CLOSED order from earlier
  const closedAt2 = new Date(now.getTime() - 4 * 3600000);
  const order4 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${todayStr}-004`,
      tableId: tables[0].id,
      serverId: server.id,
      status: "CLOSED",
      guestCount: 2,
      subtotal: 41.97,
      tax: 3.57,
      total: 45.54,
      closedAt: closedAt2,
      items: {
        create: [
          { menuItemId: menuItems[3].id, quantity: 1, unitPrice: 16.99, status: "SERVED", sentToKitchenAt: closedAt2, readyAt: closedAt2 },
          { menuItemId: menuItems[2].id, quantity: 1, unitPrice: 10.99, status: "SERVED", sentToKitchenAt: closedAt2, readyAt: closedAt2 },
          { menuItemId: menuItems[9].id, quantity: 2, unitPrice: 3.49, status: "SERVED" },
          { menuItemId: menuItems[10].id, quantity: 1, unitPrice: 9.99, status: "SERVED" },
        ],
      },
    },
  });

  // Split payment for order 4
  await prisma.payment.create({
    data: {
      orderId: order4.id,
      method: "CASH",
      amount: 25.00,
      tip: 5.00,
    },
  });
  await prisma.payment.create({
    data: {
      orderId: order4.id,
      method: "CARD",
      amount: 20.54,
      tip: 5.00,
      reference: "****8832",
    },
  });

  console.log("\nSeed completed successfully!");
  console.log(`  Restaurant: 1 (${restaurant.name})`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Suppliers: ${suppliers.length}`);
  console.log(`  Ingredients: ${ingredients.length}`);
  console.log(`  Recipes: ${recipes.length}`);
  console.log(`  Menu Items: ${menuItems.length}`);
  console.log(`  Transactions: ${transactionData.length}`);
  console.log(`  Alerts: 4`);
  console.log(`  Allergens: ${allergens.length}`);
  console.log(`  Ingredient-Allergen links: ${ingredientAllergenData.reduce((s, e) => s + e.allergenNames.length, 0)}`);
  console.log(`  Prep Tasks: 5`);
  console.log(`  Tables: ${tables.length}`);
  console.log(`  Orders: 4 (2 active, 2 closed)`);
  console.log(`  Payments: 3`);
  console.log("\n  Login credentials:");
  console.log("  owner@bellavista.com (PIN: 0000) — Owner");
  console.log("  kitchen@bellavista.com (PIN: 1111) — Kitchen Manager");
  console.log("  chef@bellavista.com (PIN: 2222) — Head Chef");
  console.log("  server@bellavista.com (PIN: 3333) — Server");
  console.log("  host@bellavista.com (PIN: 4444) — Host");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
