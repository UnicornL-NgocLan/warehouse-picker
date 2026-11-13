import jwt from "jsonwebtoken";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 30 days in ms

export const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
}; 

export const attachCookiesToResponse = ({ res, data }) => {
  const accessTokenJWT = createJWT({ payload: data });

  res.cookie("stto", accessTokenJWT, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
    sign: true,
    // sameSite: "none",
  });
};
