import React from "react";
import { useCallback, useEffect, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import {
  saveReservation,
  getReservation,
  clearReservation,
} from "../utils/storage";
import { useReservationTimer } from "../hooks/useReservationTimer";

export default function ProductReservation() {
  const [quantity, setQuantity] = useState(1);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stock, setStock] = useState(50); // This will be current available stock from db

  useEffect(() => {
    const savedReservation = getReservation();

    if (!savedReservation) {
      return;
    }

    if (Date.now() > savedReservation.expiresAt) {
      clearReservation();
      return;
    }

    setReservation(savedReservation);
  }, []);

  useEffect(() => {
    if (!reservation) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const latest = await inventoryApi.getReservationStatus();

        if (!latest) {
          setMessage("Reservation expired or released.");
          setReservation(null);
          clearReservation();
          return;
        }

        setReservation(latest);
        saveReservation(latest);
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [reservation]);

  const handleExpire = useCallback(async () => {
    if (!reservation) {
      return;
    }

    await inventoryApi.releaseReservation(reservation.reservationId);
    setStock((prev) => prev + reservation.quantity);
    setMessage("Reservation expired. Stock released.");
    setReservation(null);
    clearReservation();
  }, [reservation]);

  const timer = useReservationTimer(reservation?.expiresAt, handleExpire);

  const handleReserve = async () => {
    if (loading || reservation) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const validation = await inventoryApi.validateStock(
        "product-1",
        quantity
      );

      if (!validation.eligible) {
        setMessage("Product is sold out.");
        return;
      }

      const result = await inventoryApi.reserveProduct(
        "product-1",
        Number(quantity)
      );

      setReservation(result);

      setStock((prev) => prev - Number(quantity));

      saveReservation(result);

      setMessage("Reservation successful.");
    } catch (error) {
      if (error.message === "SOLD_OUT") {
        setMessage(
          "Reservation failed because another user bought the stock first."
        );
      } else {
        setMessage("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!reservation || loading) {
      return;
    }

    setLoading(true);

    try {
      await inventoryApi.submitOrder(reservation.reservationId);

      setMessage("Order submitted successfully.");

      clearReservation();
      setReservation(null);
    } catch (error) {
      if (error.message === "RESERVATION_EXPIRED") {
        setMessage("Reservation expired before checkout.");
      } else {
        setMessage("Unable to complete order.");
      }

      clearReservation();
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation || loading) {
      return;
    }

    setLoading(true);

    try {
      await inventoryApi.releaseReservation(reservation.reservationId);

      setStock((prev) => prev + reservation.quantity);

      setMessage("Reservation released.");

      clearReservation();
      setReservation(null);
    } catch (error) {
      setMessage("Failed to release reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="product-card">
        <div className="badge">FLASH SALE</div>

        <img
          className="product-image"
          src="https://atmos-kl.com/cdn/shop/files/IU1055-100-01.jpg?v=1773048272&width=1445"
          alt="Product"
        />

        <h1>Nike Air Max 90 "Infrared"</h1>

        <p className="description">Limited-time exclusive sneaker deal.</p>

        <div className="price-row">
          <span className="sale-price">RM399</span>

          <span className="old-price">RM699</span>
        </div>

        <div className="stock">
          Remaining Stock: <strong>{stock}</strong>
        </div>

        <div className="field">
          <label>Quantity</label>

          <input
            type="number"
            min="1"
            value={quantity}
            disabled={!!reservation}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                setQuantity("");
                return;
              }

              if (Number(value) < 1) {
                return;
              }

              setMessage("");
              setQuantity(value);
            }}
          />
        </div>

        {!reservation && (
          <button
            className="reserve-btn"
            onClick={handleReserve}
            disabled={loading || quantity == ""}
          >
            {loading ? "Processing..." : "Reserve Now"}
          </button>
        )}

        {reservation && (
          <div className="reservation-box">
            <div className="timer-box">Reservation Expires In: {timer}</div>

            <div className="success-text">Product Reserved Successfully</div>

            <div className="reservation-details">
              <p>Quantity Reserved: {reservation.quantity}</p>

              <small>Reservation ID: {reservation.reservationId}</small>
            </div>

            <div className="action-buttons">
              <button
                className="submit-btn"
                onClick={handleSubmitOrder}
                disabled={loading}
              >
                Submit Order
              </button>

              <button
                className="cancel-btn"
                onClick={handleCancelReservation}
                disabled={loading}
              >
                Release
              </button>
            </div>
          </div>
        )}

        {message && <div className="message-box">{message}</div>}
      </div>
    </div>
  );
}
