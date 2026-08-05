# API Specifications (Server Actions Contracts) - FoodOps Phase 2

FoodOps communicates via Next.js Server Actions, which enforce JWT session boundaries and serialize results.

---

## 1. Authentication Interface

### 1.1 `registerDonor(formData: RegisterDonorInput)`
- **Role Requirement:** None (Public Registration)
- **Input Object:**
  ```typescript
  interface RegisterDonorInput {
    email: string;
    password?: string;
    phoneNumber: string;
    organizationName: string;
    organizationType: string; // "RESTAURANT" | "SUPERMARKET" | "CATERER" | "INDIVIDUAL"
    contactPerson: string;
    address: string;
    latitude: string | number;
    longitude: string | number;
  }
  ```
- **Return Envelope:**
  ```typescript
  { success: boolean; role?: "DONOR"; error?: string }
  ```

### 1.2 `registerNGO(formData: RegisterNGOInput)`
- **Role Requirement:** None (Public Registration)
- **Status Outcome:** NGO profile starts as `PENDING_VERIFICATION`.
- **Input Object:**
  ```typescript
  interface RegisterNGOInput {
    email: string;
    password?: string;
    phoneNumber: string;
    organizationName: string;
    registrationNumber?: string; // FSSAI number
    baseAddress: string;
    baseLatitude: string | number;
    baseLongitude: string | number;
    serviceRadiusKm?: string | number;
    availability?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    acceptedFoodTypes?: string | string[];
    contactPerson: string;
    contactPhone: string;
  }
  ```
- **Return Envelope:**
  ```typescript
  { success: boolean; role?: "NGO"; error?: string }
  ```

---

## 2. Donations Interface

### 2.1 `createDonation(formData: CreateDonationInput)`
- **Role Requirement:** `DONOR`
- **Input Object:**
  ```typescript
  interface CreateDonationInput {
    title: string;
    description: string;
    foodCategory: string; // "grains" | "vegetables" | "fruits" | "dairy" | "meat" | "bakery" | "mixed"
    vegNonVegMixed: string; // "VEG" | "NON_VEG" | "MIXED"
    quantity: string;
    quantityUnit: string;
    estimatedServings?: string | number | null;
    preparationTime?: string | Date | null;
    pickupAvailableAt: string | Date;
    pickupDeadlineAt: string | Date;
    pickupAddress: string;
    pickupLatitude: string | number;
    pickupLongitude: string | number;
    specialNotes?: string | null;
  }
  ```
- **Return Envelope:**
  ```typescript
  { success: boolean; donationId?: string; error?: string }
  ```

### 2.2 `acceptDonation(donationId: string)`
- **Role Requirement:** `NGO` (Must have `VERIFIED` status)
- **Mechanism:** Interactive lock transaction prevents concurrent claims.
- **Return Envelope:**
  ```typescript
  { success: boolean; donation?: Donation; error?: string }
  ```

### 2.3 `updateAssignmentStatus(assignmentId: string, action: string)`
- **Role Requirement:** `VOLUNTEER` or `NGO`
- **Actions Permitted:**
  - `START_PICKUP`: Changes donation to `PICKUP_IN_PROGRESS`.
  - `ARRIVE_AT_DONOR`: Logs transit timestamp.
  - `CONFIRM_PICKUP`: Changes donation to `PICKED_UP`.
  - `START_DELIVERY`: Changes donation to `DELIVERY_IN_PROGRESS`.
  - `CONFIRM_DELIVERY`: Closes task as `COMPLETED`, logs carbon/water impact indicators.
- **Return Envelope:**
  ```typescript
  { success: boolean; status?: string; error?: string }
  ```
