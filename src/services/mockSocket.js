// Mock WebSocket service for simulating real-time rider location updates

class MockSocketService {
  constructor() {
    this.listeners = {};
    this.intervalId = null;
    this.currentRouteIndex = 0;
    this.route = [];
    this.isActive = false;
  }

  // Connect to mock socket
  connect(orderId) {
    console.log(`Mock Socket: Connected for order ${orderId}`);
    this.isActive = true;
    return this;
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Emit events to listeners
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  // Start simulating rider movement along a route
  startRiderUpdates(route, updateInterval = 2000) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.route = route;
    this.currentRouteIndex = 0;

    // Initial position
    this.emit('rider_location', {
      position: route[0],
      progress: 0,
      timestamp: new Date().toISOString(),
    });

    // Update rider position periodically
    this.intervalId = setInterval(() => {
      if (!this.isActive) {
        this.stopRiderUpdates();
        return;
      }

      this.currentRouteIndex++;

      if (this.currentRouteIndex >= route.length) {
        // Order delivered
        this.emit('order_status', {
          status: 'delivered',
          timestamp: new Date().toISOString(),
        });
        this.stopRiderUpdates();
        return;
      }

      const progress = (this.currentRouteIndex / (route.length - 1)) * 100;
      const position = route[this.currentRouteIndex];

      this.emit('rider_location', {
        position,
        progress,
        timestamp: new Date().toISOString(),
      });

      // Emit order status updates at certain progress points
      if (this.currentRouteIndex === 1) {
        this.emit('order_status', {
          status: 'picked_up',
          message: 'Driver picked up your order',
          timestamp: new Date().toISOString(),
        });
      } else if (progress > 50 && progress < 55) {
        this.emit('order_status', {
          status: 'nearby',
          message: 'Driver is nearby',
          timestamp: new Date().toISOString(),
        });
      }
    }, updateInterval);
  }

  // Stop rider updates
  stopRiderUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Disconnect from mock socket
  disconnect() {
    console.log('Mock Socket: Disconnected');
    this.stopRiderUpdates();
    this.isActive = false;
    this.listeners = {};
  }

  // Calculate ETA based on remaining route points
  calculateETA(currentIndex, totalPoints, avgSpeedKmh = 30) {
    const remainingPoints = totalPoints - currentIndex;
    const avgDistancePerPoint = 0.2; // km
    const remainingDistance = remainingPoints * avgDistancePerPoint;
    const timeInHours = remainingDistance / avgSpeedKmh;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    return timeInMinutes;
  }
}

// Export singleton instance
export const mockSocket = new MockSocketService();

// Generate a route between two points with waypoints
export function generateRoute(start, end, numPoints = 15) {
  const route = [];

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;

    // Linear interpolation with slight random variation for realistic path
    const lat = start.lat + (end.lat - start.lat) * progress + (Math.random() - 0.5) * 0.002;
    const lng = start.lng + (end.lng - start.lng) * progress + (Math.random() - 0.5) * 0.002;

    route.push({ lat, lng });
  }

  return route;
}

// Mock location data for New York City
export const mockLocations = {
  restaurants: [
    { id: 1, name: 'Pizza Palace', lat: 40.7589, lng: -73.9851 },
    { id: 2, name: 'Burger Barn', lat: 40.7614, lng: -73.9776 },
    { id: 3, name: 'Sushi Supreme', lat: 40.7489, lng: -73.9680 },
  ],
  customers: [
    { id: 1, address: '123 Main St', lat: 40.7489, lng: -73.9680 },
    { id: 2, address: '456 Park Ave', lat: 40.7614, lng: -73.9776 },
    { id: 3, address: '789 Broadway', lat: 40.7489, lng: -73.9870 },
  ],
};
