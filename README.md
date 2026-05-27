# Flash Sale Reservation Assessment

This frontend application simulates a high-traffic flash sale reservation flow with temporary inventory holds, countdown expiration, and order submission handling.

The reservation state and expiration timestamp are persisted in localStorage to survive page refreshes or accidental browser closure. To handle race conditions and concurrency, stock validation is performed again during reservation creation so the backend remains the source of truth and prevents overselling scenarios.
