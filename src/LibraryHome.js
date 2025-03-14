import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import availableBooks from "./books";

const LibraryHome = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = () => {
    fetch("http://localhost:5000/books")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBooks(data);
        } else {
          setError("Invalid response format");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch books");
        setLoading(false);
      });
  };

  const addBook = (book) => {
    fetch("http://localhost:5000/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage({ type: "danger", text: data.error });
        } else {
          setMessage({ type: "success", text: "Book added successfully!" });
          fetchBooks();
        }
      })
      .catch(() => setMessage({ type: "danger", text: "Error adding book" }));
  };

  const deleteBook = (id) => {
    fetch(`http://localhost:5000/books/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setMessage({ type: "success", text: "Book removed from library!" });
        fetchBooks();
      })
      .catch(() => setMessage({ type: "danger", text: "Error deleting book" }));
  };

  if (loading) return <p className="text-center mt-4">Loading books...</p>;
  if (error) return <p className="text-center text-danger">{error}</p>;

  const filteredAvailableBooks = availableBooks.filter(
    (book) => !books.some((b) => b.title === book.title),
  );

  return (
    <Container className="text-center mt-5">
      <h1 className="mb-4 text-primary">📚 Welcome to Your Library</h1>

      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Row className="mt-4">
        <h3 className="w-100">Library Collection</h3>
        {books.length === 0 ? (
          <p className="w-100 text-muted">No books in your library.</p>
        ) : (
          books.map((book) => (
            <Col key={book._id} md={4} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Img
                  variant="top"
                  src={book.cover}
                  alt={book.title}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <Card.Text className="text-muted">By {book.author}</Card.Text>
                  <Button variant="danger" size="sm" onClick={() => deleteBook(book._id)}>
                    🗑 Remove from Library
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <hr className="my-5" />

      <Row className="mt-4">
        <h3 className="w-100">Available Books to Add</h3>
        {filteredAvailableBooks.length === 0 ? (
          <p className="w-100 text-muted">All books are already in your library.</p>
        ) : (
          filteredAvailableBooks.map((book, index) => (
            <Col key={index} md={4} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Img
                  variant="top"
                  src={book.cover}
                  alt={book.title}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <Card.Text className="text-muted">By {book.author}</Card.Text>
                  <Button variant="success" size="sm" onClick={() => addBook(book)}>
                    ➕ Add to Library
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default LibraryHome;
