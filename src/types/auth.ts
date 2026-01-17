export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  role: "admin" | "instructor" | "student" | string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
  message: string;
  error: any;
  success: any;
};
