import request from "supertest";
import mongoose from "mongoose";
import app from "../../index";
import config from "../../config/config";
import { loginAdmin } from "../../test/apiTest.test";

const { DB_URL } = config;

try {
  mongoose.connect(DB_URL, { autoCreate: true });
} catch (error) {
  console.error(`error in db connection ${error}`);
}

export async function addUser() {
  const adminLogin = await loginAdmin();
  const addUser = await request(app)
    .post("/admin/user/add")
    .set({ Authorization: adminLogin.body?.token })
    .send({
      name: "Test user",
      email: `testuser01${+new Date()}@yopmail.com`,
      password: "Test@123",
      status: 1,
    });
  expect(addUser.statusCode).toBe(200);
  expect(addUser.body?.message).toBe("User added successfully");
  return addUser;
}

describe("Should user routes to be called", () => {
  test("Should able to get user and delete user", async () => {
    const [adminLogin, addUserData] = await Promise.all([loginAdmin(), addUser()]);
    const getUser = await request(app)
      .get(`/admin/user/edit/${addUserData?.body?.data?._id}`)
      .set({ Authorization: adminLogin.body?.token });
    expect(getUser.statusCode).toBe(200);
    expect(getUser.body?.data?.email).toBe(addUserData?.body?.data?.email);
    expect(getUser.body?.data?.name).toBe(addUserData?.body?.data?.name);

    const deleteUser = await request(app)
      .delete("/admin/user/delete")
      .set({ Authorization: adminLogin.body?.token })
      .send({ _id: addUserData?.body?.data?._id });
    expect(deleteUser.statusCode).toBe(200);
    expect(deleteUser.body?.message).toBe("User deleted successfully");
  });
});
