const UserAuth = artifacts.require("UserAuth");

contract("UserAuth", (accounts) => {
  let userAuth;

  before(async () => {
    userAuth = await UserAuth.new(); // Deploy the contract before tests
  });

  //Test Casse 1 register new user
  it("should register a new user", async () => {
    const name = "Alice";
    const email = "alice@example.com";
    const password = "password123";
    const age = 25;
    const refundAddress = accounts[1];

    await userAuth.register(name, email, age, password, refundAddress, { from: accounts[1] });
    const currentUser = await userAuth.getCurrentUser.call();

    assert.equal(currentUser, email, "Current user should be Alice");
  });

  //Test Case 2 admin sign in
  it("should allow admin to sign in", async () => {
    const adminAddress = accounts[0]; // Default account is owner and admin
    const result = await userAuth.adminSignIn(adminAddress, { from: adminAddress });

    const currentAdmin = await userAuth.getCurrentAdmin.call();
    assert.equal(currentAdmin, adminAddress, "Current admin should match the signed-in admin address");
  });

  //Test Case 3 Reset password
  it("should allow resetting the password", async () => {
    const email = "alice@example.com";
    const newPassword = "newPassword456";

    await userAuth.resetPassword(email, newPassword, { from: accounts[1] });

    const signInSuccess = await userAuth.signIn.call(email, newPassword, { from: accounts[1] });
    assert.equal(signInSuccess, true, "User should be able to sign in with the new password");
  });

  //Test Case 4 Assign Admin
  it("should allow owner to assign a new admin", async () => {
    const newAdminAddress = accounts[2];

    // Assign new admin (only owner can do this)
    await userAuth.assignAdmin(newAdminAddress, { from: accounts[0] });

    const isAdmin = await userAuth.admins.call(newAdminAddress);
    assert.equal(isAdmin, true, "The new admin address should be assigned as an admin");
  });

  //Test Case 5 Remove Admin
  it("should allow owner to remove an admin", async () => {
    const adminToRemove = accounts[2];
  
    // Remove the admin (since it's already been assigned in the previous test)
    await userAuth.removeAdmin(adminToRemove, { from: accounts[0] });
  
    const isStillAdmin = await userAuth.admins.call(adminToRemove);
    assert.equal(isStillAdmin, false, "The admin address should no longer be an admin");
  });
});
