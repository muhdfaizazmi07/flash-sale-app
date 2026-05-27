let productStock = 50;

let activeReservation = null;

const NETWORK_DELAY = 700;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const inventoryApi = {
  async validateStock(productId, quantity) {
    await wait(NETWORK_DELAY);

    return {
      eligible: productStock >= quantity,
      availableStock: productStock,
    };
  },

  async reserveProduct(productId, quantity) {
    await wait(NETWORK_DELAY);

    // Simulate concurrency issue
    if (productStock < quantity) {
      throw new Error("SOLD_OUT");
    }

    // Reduce stock immediately when hold is created
    productStock -= quantity;

    const expiresAt = Date.now() + 5 * 60 * 1000;

    activeReservation = {
      reservationId: crypto.randomUUID(),
      productId,
      quantity,
      expiresAt,
      status: "RESERVED",
    };

    return activeReservation;
  },

  async submitOrder(reservationId) {
    await wait(NETWORK_DELAY);

    if (!activeReservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }

    if (Date.now() > activeReservation.expiresAt) {
      activeReservation = null;

      throw new Error("RESERVATION_EXPIRED");
    }

    activeReservation.status = "COMPLETED";

    return {
      success: true,
    };
  },

  async releaseReservation(reservationId) {
    await wait(NETWORK_DELAY);

    if (activeReservation) {
      productStock += activeReservation.quantity;

      activeReservation = null;
    }

    return {
      success: true,
    };
  },

  async getReservationStatus() {
    await wait(300);

    if (!activeReservation) {
      return null;
    }

    if (Date.now() > activeReservation.expiresAt) {
      productStock += activeReservation.quantity;

      activeReservation = null;

      return null;
    }

    return activeReservation;
  },
};
