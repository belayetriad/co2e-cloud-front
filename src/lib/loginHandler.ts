import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_API_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "lms_session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { email, password } = req.body;

    const response = await axios.post(`${BACKEND}/auth/login`, {
      email,
      password,
    });

    const token = response.data?.token || response.data?.accessToken;
    if (!token) return res.status(502).json({ message: "Token missing" });

    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 30
      }`
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res
      .status(401)
      .json({ message: err.message || "Invalid credentials" });
  }
}
