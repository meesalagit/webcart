import { db } from "../server/db";
import { users, products, transactions, paymentMethods, conversations, messages, reports } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in order of dependencies)
  console.log("Clearing existing data...");
  await db.delete(transactions);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(reports);
  await db.delete(paymentMethods);
  await db.delete(products);
  await db.delete(users);

  // Create test users
  console.log("Creating test users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const [adminUser] = await db.insert(users).values({
    email: "admin@university.edu",
    password: hashedPassword,
    firstName: "Admin",
    lastName: "User",
    university: "university",
    role: "admin",
    isVerified: true,
  }).returning();

  const [student1] = await db.insert(users).values({
    email: "sarah@stanford.edu",
    password: hashedPassword,
    firstName: "Sarah",
    lastName: "Chen",
    university: "stanford",
    role: "student",
    isVerified: true,
  }).returning();

  const [student2] = await db.insert(users).values({
    email: "mike@mit.edu",
    password: hashedPassword,
    firstName: "Mike",
    lastName: "Johnson",
    university: "mit",
    role: "student",
    isVerified: true,
  }).returning();

  const [student3] = await db.insert(users).values({
    email: "emma@berkeley.edu",
    password: hashedPassword,
    firstName: "Emma",
    lastName: "Wilson",
    university: "berkeley",
    role: "student",
    isVerified: true,
  }).returning();

  console.log("Creating sample products...");

  // Textbooks
  await db.insert(products).values([
    {
      userId: student1.id,
      title: "Introduction to Algorithms (4th Edition)",
      description: "Comprehensive guide to algorithms. Great condition, barely used. Includes practice problems and solutions.",
      price: "45.00",
      category: "textbooks",
      condition: "like-new",
      location: "Stanford Campus",
      imageUrl: "/attached_assets/generated_images/computer_science_algorithms_textbook.png",
      status: "available",
    },
    {
      userId: student2.id,
      title: "Biology Textbook",
      description: "Standard textbook for BIO 101. Some highlighting but all pages intact.",
      price: "35.00",
      category: "textbooks",
      condition: "good",
      location: "MIT Campus",
      imageUrl: "/attached_assets/generated_images/biology_textbook_on_wooden_library_table.png",
      status: "available",
    },
    {
      userId: student3.id,
      title: "Engineering Fundamentals",
      description: "Great for intro engineering courses. Clean copy with no writing.",
      price: "50.00",
      category: "textbooks",
      condition: "like-new",
      location: "Berkeley",
      imageUrl: "/attached_assets/generated_images/engineering_textbook_on_desk.png",
      status: "available",
    },
  ]);

  // Electronics
  await db.insert(products).values([
    {
      userId: student1.id,
      title: "Gaming Laptop with RGB Keyboard",
      description: "High performance gaming laptop. Excellent condition, includes charger.",
      price: "750.00",
      category: "electronics",
      condition: "like-new",
      location: "Stanford Campus",
      imageUrl: "/attached_assets/generated_images/gaming_laptop_with_rgb_keyboard.png",
      status: "available",
    },
    {
      userId: student2.id,
      title: "Smartwatch - Latest Model",
      description: "Perfect for fitness tracking and notifications. Barely used.",
      price: "200.00",
      category: "electronics",
      condition: "like-new",
      location: "MIT Campus",
      imageUrl: "/attached_assets/generated_images/smartwatch_on_wrist.png",
      status: "available",
    },
    {
      userId: student3.id,
      title: "Modern Desk Lamp",
      description: "LED desk lamp with adjustable brightness. Great for studying.",
      price: "35.00",
      category: "electronics",
      condition: "like-new",
      location: "Berkeley",
      imageUrl: "/attached_assets/generated_images/modern_desk_lamp.png",
      status: "available",
    },
  ]);

  // Clothing
  await db.insert(products).values([
    {
      userId: student1.id,
      title: "University Hoodie (M)",
      description: "Grey university hoodie, size medium. Super comfortable.",
      price: "40.00",
      category: "clothing",
      condition: "good",
      location: "Stanford Campus",
      imageUrl: "/attached_assets/generated_images/grey_university_hoodie.png",
      status: "available",
    },
    {
      userId: student2.id,
      title: "Vintage Denim Jacket",
      description: "Classic vintage denim jacket. Great for layering!",
      price: "60.00",
      category: "clothing",
      condition: "good",
      location: "MIT Campus",
      imageUrl: "/attached_assets/generated_images/vintage_denim_jacket_on_hanger.png",
      status: "available",
    },
    {
      userId: student3.id,
      title: "Vintage Sneakers",
      description: "Retro sneakers in great condition. Size 10.",
      price: "45.00",
      category: "clothing",
      condition: "good",
      location: "Berkeley",
      imageUrl: "/attached_assets/generated_images/vintage_sneakers.png",
      status: "available",
    },
  ]);

  // Furniture
  await db.insert(products).values([
    {
      userId: student1.id,
      title: "Comfortable Bean Bag Chair",
      description: "Perfect for dorm room or study corner. Very comfortable.",
      price: "80.00",
      category: "furniture",
      condition: "good",
      location: "Stanford Campus",
      imageUrl: "/attached_assets/generated_images/comfortable_bean_bag_chair.png",
      status: "available",
    },
    {
      userId: student2.id,
      title: "Modern Minimal Backpack",
      description: "Stylish backpack with laptop compartment. Fits 15\" laptops.",
      price: "50.00",
      category: "furniture",
      condition: "like-new",
      location: "MIT Campus",
      imageUrl: "/attached_assets/generated_images/modern_minimal_backpack_product_shot.png",
      status: "available",
    },
  ]);

  // Sports equipment
  await db.insert(products).values([
    {
      userId: student1.id,
      title: "Basketball",
      description: "Official size basketball. Great condition for pickup games.",
      price: "25.00",
      category: "sports",
      condition: "good",
      location: "Stanford Campus",
      imageUrl: "/attached_assets/generated_images/basketball_on_court.png",
      status: "available",
    },
    {
      userId: student2.id,
      title: "Tennis Racket with Balls",
      description: "Quality tennis racket with 3 tennis balls. Perfect for beginners.",
      price: "45.00",
      category: "sports",
      condition: "good",
      location: "MIT Campus",
      imageUrl: "/attached_assets/generated_images/tennis_racket_and_balls_on_court.png",
      status: "available",
    },
    {
      userId: student3.id,
      title: "Yoga Mat + Water Bottle",
      description: "Premium yoga mat with matching water bottle. Lightly used.",
      price: "30.00",
      category: "sports",
      condition: "like-new",
      location: "Berkeley",
      imageUrl: "/attached_assets/generated_images/yoga_mat_and_water_bottle.png",
      status: "available",
    },
  ]);

  // Create some sample products that will be marked as sold for transactions
  console.log("Creating sold products for transactions...");
  const [soldProduct1] = await db.insert(products).values({
    userId: student1.id,
    title: "Calculus Textbook",
    description: "Calculus 3rd edition textbook. Great condition.",
    price: "55.00",
    category: "textbooks",
    condition: "good",
    location: "Stanford Campus",
    status: "sold",
  }).returning();

  const [soldProduct2] = await db.insert(products).values({
    userId: student2.id,
    title: "Wireless Headphones",
    description: "Premium wireless headphones with noise cancellation.",
    price: "120.00",
    category: "electronics",
    condition: "like-new",
    location: "MIT Campus",
    status: "sold",
  }).returning();

  const [soldProduct3] = await db.insert(products).values({
    userId: student3.id,
    title: "Study Desk",
    description: "Compact study desk perfect for dorm rooms.",
    price: "85.00",
    category: "furniture",
    condition: "good",
    location: "Berkeley",
    status: "sold",
  }).returning();

  // Create demo transactions
  console.log("Creating demo transactions...");
  await db.insert(transactions).values([
    {
      buyerId: student2.id,
      sellerId: student1.id,
      productId: soldProduct1.id,
      amount: "55.00",
      status: "completed",
    },
    {
      buyerId: student3.id,
      sellerId: student2.id,
      productId: soldProduct2.id,
      amount: "120.00",
      status: "completed",
    },
    {
      buyerId: student1.id,
      sellerId: student3.id,
      productId: soldProduct3.id,
      amount: "85.00",
      status: "completed",
    },
    {
      buyerId: student1.id,
      sellerId: student2.id,
      productId: soldProduct2.id,
      amount: "120.00",
      status: "refunded",
    },
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("Admin: admin@university.edu / password123");
  console.log("Student 1: sarah@stanford.edu / password123");
  console.log("Student 2: mike@mit.edu / password123");
  console.log("Student 3: emma@berkeley.edu / password123");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
