// Central barrel — import from "@/services/api" continues to work
export { api } from "./api/baseApi";

// Re-export all hooks and types from domain modules
export * from "./api/auth";
export * from "./api/users";
export * from "./api/departments";
export * from "./api/wards";
export * from "./api/teams";
export * from "./api/patients";
export * from "./api/clinical";
export * from "./api/rounds";
export * from "./api/operations";
export * from "./api/hospital";
export * from "./api/onboarding";
export * from "./api/context";
export * from "./api/notifications";
export * from "./api/reports";
export * from "./api/search";
