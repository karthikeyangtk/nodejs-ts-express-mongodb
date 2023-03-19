import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import config from "../config/config";

const { DB_URL } = config;

beforeAll(async () => {
  try {
    await mongoose.connect(DB_URL, { autoCreate: true });
  } catch (error) {
    console.error(`error in db connextion ${error}`);
  }
});

/* Closing database connection after each test. */
afterAll(async () => {
  await mongoose.connection.close();
});

const user = {
  name: "Admin",
  email: "admintest@yopmail.com",
  password: "TestAdmin@123",
};

/* Login user */
export async function loginAdmin() {
  return await request(app)
    .post("/admin/sign")
    .send({ email: user.email, password: user.password });
}

/* Add default admin */
export async function addDefaultAdmin() {
  return await request(app).post("/admin/add/default/admin");
}

describe("Check API", () => {
  test("Should admin to be login", async () => {
    const adminLogin = await loginAdmin();
    if (adminLogin.body?.message === "Invalid password") {
      await addDefaultAdmin();
      const adminLogin = await loginAdmin();
      expect(adminLogin.body?.message).toBe("Login successfully");
    } else {
      expect(adminLogin.body?.message).toBe("Login successfully");
    }
  });

  test("Should logout API should be called", async () => {
    const adminLogin = await loginAdmin();
    const adminSignOut = await request(app)
      .post("/admin/signOut")
      .set({ Authorization: adminLogin.body?.token });
    expect(adminSignOut.body?.message).toBe("Signed out successfully");
  });
});
