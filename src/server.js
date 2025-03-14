const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: "./.env" });

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  cover: { type: String, required: true },
});

const Book = mongoose.model("Book", bookSchema);

app.get("/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.post("/books", async (req, res) => {
  try {
    const { title, author, cover } = req.body;
    if (!title || !author || !cover) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newBook = new Book({ title, author, cover });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Book already exists in the library" });
    }
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.delete("/books/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "✅ Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
