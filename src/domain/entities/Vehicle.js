/**
 * Vehicle Entity
 * Represents a vehicle in the rental inventory
 */
class Vehicle {
  constructor ({ id, plate, model, status, currentRentalId = null }) {
    this.id = id;
    this.plate = plate;
    this.model = model;
    this.status = status; // 'available', 'rented', 'maintenance'
    this.currentRentalId = currentRentalId;
  }

  isAvailable () {
    return this.status === 'available' && !this.currentRentalId;
  }

  markAsRented (rentalId) {
    this.status = 'rented';
    this.currentRentalId = rentalId;
  }

  markAsAvailable () {
    this.status = 'available';
    this.currentRentalId = null;
  }
}

module.exports = Vehicle;
