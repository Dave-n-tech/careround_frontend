let mockSessionUserId: string | null = "u_cons1";

export function setMockSessionUser(userId: string | null) {
  mockSessionUserId = userId;
}

export function getMockSessionUser() {
  return mockSessionUserId;
}
