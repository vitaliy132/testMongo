const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    try {
      const collection = mongoose.connection.db.collection("books");
      const indexes = await collection.indexes();
      if (indexes.some((index) => index.name === "title_1")) {
        await collection.dropIndex("title_1");
        console.log("✅ Removed unique index on title");
      } else {
        console.log("ℹ️ No unique index on title found, skipping...");
      }
    } catch (error) {
      console.error("❌ Error dropping index:", error.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  cover: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

bookSchema.index({ userId: 1, title: 1 }, { unique: true });

const Book = mongoose.model("Book", bookSchema);

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Unauthorized: Invalid token" });

    req.userId = decoded.userId;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("✅ API is working!");
});

app.post("/register", async (req, res) => {
  const username = req.body.username?.toString().trim();
  if (!username || !/^\S+$/.test(username)) {
    return res.status(400).json({ error: "Username is required and cannot contain spaces" });
  }

  try {
    let user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({ error: "Username already exists" });
    }

    user = new User({ username });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token, userId: user._id, username });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username?.toString().trim();
  if (!username || !/^\S+$/.test(username)) {
    return res.status(400).json({ error: "Username is required and cannot contain spaces" });
  }

  try {
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User does not exist. Please register first." });
    }

    const token = generateToken(user._id);
    res.json({ token, userId: user._id, username });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/books", authenticate, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.userId }).sort({ title: 1 });
    res.json(books);
  } catch (err) {
    console.error("❌ Fetch Books Error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.post("/books", authenticate, async (req, res) => {
  const { title, author, cover } = req.body;
  if (!title || !author || !cover) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingBook = await Book.findOne({ title, userId: req.userId });
    if (existingBook) {
      return res.status(400).json({ error: "You already added this book!" });
    }

    const newBook = new Book({ title, author, cover, userId: req.userId });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error("❌ Add Book Error:", err.message);
    if (err.code === 11000) {
      return res.status(400).json({ error: "You already added this book!" });
    }
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.delete("/books/:id", authenticate, async (req, res) => {
  try {
    const deletedBook = await Book.findById(req.params.id);
    if (!deletedBook) return res.status(404).json({ error: "Book not found" });
    if (deletedBook.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized to delete this book" });
    }

    await deletedBook.deleteOne();
    res.json({ message: "✅ Book deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Book Error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ userId: user._id, username: user.username });
  } catch (err) {
    console.error("❌ Fetch User Error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
