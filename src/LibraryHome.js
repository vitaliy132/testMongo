import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Alert, Form } from "react-bootstrap";
import availableBooks from "./books";

const LibraryHome = () => {
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");

  const fetchBooks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/books", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch {
      setMessage({ type: "danger", text: "Failed to fetch books" });
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchBooks();
  }, [token, fetchBooks]);

  const handleAuth = async (endpoint) => {
    if (!username.trim()) {
      setMessage({ type: "warning", text: "Please enter a username." });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", username);
        setToken(data.token);
        setUserId(data.userId);
        setMessage({ type: "success", text: "Authentication successful!" });

        setTimeout(fetchBooks, 100);
      } else {
        setMessage({ type: "danger", text: data.error || "Authentication failed" });
      }
    } catch {
      setMessage({ type: "danger", text: "Error during authentication" });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken("");
    setUserId("");
    setUsername("");
    setBooks([]);
    window.location.reload();
  };

  const addBook = async (book) => {
    if (!userId) {
      setMessage({ type: "danger", text: "User not authenticated" });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...book, userId }),
      });

      if (res.ok) fetchBooks();
      else setMessage({ type: "danger", text: "Failed to add book" });
    } catch {
      setMessage({ type: "danger", text: "Error adding book" });
    }
  };

  const deleteBook = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) fetchBooks();
      else setMessage({ type: "danger", text: "Failed to delete book" });
    } catch {
      setMessage({ type: "danger", text: "Error deleting book" });
    }
  };

  const filteredAvailableBooks = availableBooks.filter(
    (book) => !books.some((b) => b.title === book.title),
  );

  if (!token) {
    return (
      <Container className="text-center mt-5">
        <h1>📚 Welcome to Your Library</h1>
        {message && <Alert variant={message.type}>{message.text}</Alert>}
        <Form.Control
          className="my-2"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button className="m-2" onClick={() => handleAuth("register")}>
          Register
        </Button>
        <Button className="m-2" onClick={() => handleAuth("login")}>
          Login
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center my-3">
        <h2>Your Library</h2>
        <div>
          <strong>👤 Logged in as: {username}</strong>
        </div>
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>

      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Row>
        {books.length > 0 ? (
          books.map((book) => (
            <Col key={book._id} md={4} className="mb-3">
              <Card>
                <Card.Img variant="top" src={book.cover} />
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <Card.Text>{book.author}</Card.Text>
                  <Button variant="danger" onClick={() => deleteBook(book._id)}>
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <p>No books in your library.</p>
        )}
      </Row>

      <h3>Add a Book</h3>
      <Row>
        {filteredAvailableBooks.map((book) => (
          <Col key={book.title} md={4} className="mb-3">
            <Card>
              <Card.Img variant="top" src={book.cover} />
              <Card.Body>
                <Card.Title>{book.title}</Card.Title>
                <Card.Text>{book.author}</Card.Text>
                <Button variant="primary" onClick={() => addBook(book)}>
                  Add to Library
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default LibraryHome;
