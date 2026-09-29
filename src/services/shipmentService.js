// Shipment service — lightweight mock abstraction
// Replace with real API calls later; keep same signatures
import shipments from "../data/shipments";

export function getShipments() {
  return shipments;
}

export function getShipmentById(id) {
  return shipments.find((s) => s.id === id) || null;
}

export function getRecentShipments(limit = 5) {
  // Most recent by createdAt descending
  return [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// Dashboard statistics derived from shipments
export function getDashboardStats() {
  const total = shipments.length;
  const pending = shipments.filter((s) => s.status === "Pending").length;
  const assigned = shipments.filter((s) => s.status === "Assigned").length;
  const inTransit = shipments.filter((s) => s.status === "In Transit").length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;
  const cancelled = shipments.filter((s) => s.status === "Cancelled").length;
  const active = assigned + inTransit;
  const totalRevenue = shipments.reduce((sum, s) => sum + s.amount, 0);
  const deliveredRevenue = shipments
    .filter((s) => s.status === "Delivered")
    .reduce((sum, s) => sum + s.amount, 0);

  return {
    total,
    pending,
    assigned,
    inTransit,
    delivered,
    cancelled,
    active,
    totalRevenue,
    deliveredRevenue,
  };
}

// Build timeline events based on shipment status
export function getShipmentTimeline(shipment) {
  const events = [];

  // Shipment created — always
  events.push({
    id: "created",
    title: "Shipment created",
    description: `Created on ${shipment.createdAt} · ${shipment.origin} → ${shipment.destination}`,
    date: shipment.createdAt,
    done: true,
  });

  if (shipment.status === "Cancelled") {
    events.push({
      id: "cancelled",
      title: "Shipment cancelled",
      description: "This shipment was cancelled before dispatch",
      date: shipment.createdAt,
      done: true,
      variant: "cancelled",
    });
    return events;
  }

  if (["Assigned", "In Transit", "Delivered"].includes(shipment.status)) {
    events.push({
      id: "assigned",
      title: "Driver assigned",
      description: shipment.driver
        ? `${shipment.driver} · ${shipment.vehicle || "Vehicle assigned"}`
        : "Awaiting driver assignment",
      date: shipment.pickupDate || shipment.createdAt,
      done: !!shipment.driver,
    });
  } else {
    events.push({
      id: "awaiting",
      title: "Awaiting assignment",
      description: "Shipment is pending driver assignment",
      date: null,
      done: false,
    });
  }

  if (["In Transit", "Delivered"].includes(shipment.status)) {
    events.push({
      id: "pickup",
      title: "Pickup completed",
      description: `Picked up at ${shipment.origin} — ${shipment.pickupDate || shipment.createdAt}`,
      date: shipment.pickupDate,
      done: true,
    });
    events.push({
      id: "transit",
      title: "In transit",
      description: `Current location: ${shipment.currentLocation}`,
      date: shipment.pickupDate,
      done: true,
    });
  }

  if (shipment.status === "Delivered") {
    events.push({
      id: "delivered",
      title: "Delivered",
      description: `Delivered to ${shipment.destination} — ${shipment.actualDeliveryDate}`,
      date: shipment.actualDeliveryDate,
      done: true,
    });
  }

  if (shipment.status === "Assigned") {
    events.push({
      id: "pickup-pending",
      title: "Awaiting pickup",
      description: `Scheduled pickup — ${shipment.pickupDate || shipment.expectedDeliveryDate}`,
      date: shipment.pickupDate,
      done: false,
    });
  }

  if (shipment.status === "Pending") {
    // already has awaiting event
  }

  return events;
}
