const PurchasePackage = artifacts.require("PurchasePackage");
const AdminInsurancePolicy = artifacts.require("AdminInsurancePolicy");
const UserAuth = artifacts.require("UserAuth");

contract("PurchasePackage", (accounts) => {
  let purchasePackage;
  let adminInsurancePolicy;
  let userAuth;
  const admin = accounts[0];
  const user = accounts[1];
  const userEmail = "test@example.com";
  const userName = "Test User";
  const userAge = 30;
  const userPassword = "password123";
  const packageId = 0;

  beforeEach(async () => {
    userAuth = await UserAuth.new();
    adminInsurancePolicy = await AdminInsurancePolicy.new(userAuth.address);
    purchasePackage = await PurchasePackage.new(adminInsurancePolicy.address, userAuth.address);

    await userAuth.register(userName, userEmail, userAge, userPassword, user, { from: user });
    await userAuth.adminSignIn(admin, { from: admin });
    await adminInsurancePolicy.createPolicy("Test Policy", 100, 1000, 18, true, { from: admin });
    await userAuth.logoutAdmin({ from: admin });
  });

  describe("Subscribe to a package", () => {
    it("should allow a user to subscribe to a package", async () => {
      await userAuth.signIn(userEmail, userPassword, { from: user });
      await purchasePackage.subscribeToPackage(packageId, { from: user });

      const packages = await purchasePackage.viewPackages({ from: user });
      console.log("Packages returned:", packages);

      // Access the packages correctly
      const approvedPackages = packages[0];
      const cancelledPackages = packages[1];
      const pendingPackages = packages[2];

      assert.equal(pendingPackages.length, 1, "Subscription should be pending");
      assert.equal(pendingPackages[0][1].toString(), packageId.toString(), "Package ID should match"); // Change to string comparison if needed
    });
  });

  describe("Approve a subscription request", () => {
    it("should allow admin to approve a subscription request", async () => {
      await userAuth.signIn(userEmail, userPassword, { from: user });
      await purchasePackage.subscribeToPackage(packageId, { from: user });

      await userAuth.adminSignIn(admin, { from: admin });
      await purchasePackage.approveSubscription(userEmail, packageId, { from: admin });

      await userAuth.signIn(userEmail, userPassword, { from: user });
      const packages = await purchasePackage.viewPackages({ from: user });
      console.log("Packages returned after approval:", packages);

      const approvedPackages = packages[0];
      const cancelledPackages = packages[1];
      const pendingPackages = packages[2];

      assert.equal(approvedPackages.length, 1, "Subscription should be approved");
      assert.equal(approvedPackages[0][1].toString(), packageId.toString(), "Package ID should match");
    });
  });

  describe("View packages", () => {
    it("should allow a user to view their packages", async () => {
      await userAuth.signIn(userEmail, userPassword, { from: user });
      await purchasePackage.subscribeToPackage(packageId, { from: user });

      await userAuth.adminSignIn(admin, { from: admin });
      await purchasePackage.approveSubscription(userEmail, packageId, { from: admin });

      await userAuth.signIn(userEmail, userPassword, { from: user });
      const packages = await purchasePackage.viewPackages({ from: user });
      console.log("All packages returned:", packages);

      const approvedPackages = packages[0];
      const cancelledPackages = packages[1];
      const pendingPackages = packages[2];

      assert.equal(approvedPackages.length, 1, "Should have one approved package");
      assert.equal(cancelledPackages.length, 0, "Should have no cancelled packages");
      assert.equal(pendingPackages.length, 0, "Should have no pending packages");
      assert.equal(approvedPackages[0][1].toString(), packageId.toString(), "Approved package ID should match");
    });
  });
});
