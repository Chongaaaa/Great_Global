const AdminInsurancePolicy = artifacts.require("AdminInsurancePolicy");
const UserAuth = artifacts.require("UserAuth");

contract("AdminInsurancePolicy", (accounts) => {
    let adminInsurancePolicy;
    let userAuth;
    let adminAccount = accounts[0];

    before(async () => {
        // Deploy UserAuth contract
        userAuth = await UserAuth.new();

        // Admin Sign-in (Ensure this sets the current admin correctly)
        await userAuth.adminSignIn(adminAccount, { from: adminAccount });

        // Deploy AdminInsurancePolicy contract and pass the address of UserAuth
        adminInsurancePolicy = await AdminInsurancePolicy.new(userAuth.address, { from: adminAccount });
    });

    it("should create a new policy and check if it's active", async () => {
        const policyName = "Health Insurance";
        const premium = web3.utils.toWei("1", "ether");
        const coverageAmount = web3.utils.toWei("10", "ether");
        const ageLimit = 60;
        const isActive = true;

        // Create a new policy
        await adminInsurancePolicy.createPolicy(policyName, premium, coverageAmount, ageLimit, isActive, { from: adminAccount });

        // Fetch the policy details
        const policy = await adminInsurancePolicy.getPolicy(1);
        
        // Assertions to check if the policy was created correctly
        assert.equal(policy[0], policyName, "Policy name should match");
        assert.equal(policy[1], premium, "Premium should match");
        assert.equal(policy[2], coverageAmount, "Coverage amount should match");
        assert.equal(policy[3].toString(), ageLimit.toString(), "Age limit should match");
        assert.equal(policy[4], isActive, "Policy should be active");

        // Check if it's active via availability function
        const isPolicyActive = await adminInsurancePolicy.getPolicyAvailibility(1);
        assert.equal(isPolicyActive, true, "Policy should be active");
    });

    it("should update the existing policy details", async () => {
        const policyId = 0; // Assuming this is the policy ID we just created
        const newPolicyName = "Supreme Health Insurance";
        const newPremium = web3.utils.toWei("1.5", "ether"); // Updated premium
        const newCoverageAmount = web3.utils.toWei("15", "ether"); // Updated coverage amount
        const newAgeLimit = 65; // Updated age limit
        const newIsActive = true; // Still active

        // Update the existing policy
        await adminInsurancePolicy.updatePolicy(policyId, newPolicyName, newPremium, newCoverageAmount, newAgeLimit, newIsActive, { from: adminAccount });

        // Fetch the updated policy details
        const updatedPolicy = await adminInsurancePolicy.getPolicy(policyId);

        // Assertions to check if the policy was updated correctly
        assert.equal(updatedPolicy[0], newPolicyName, "Updated policy name should match");
        assert.equal(updatedPolicy[1], newPremium, "Updated premium should match");
        assert.equal(updatedPolicy[2], newCoverageAmount, "Updated coverage amount should match");
        assert.equal(updatedPolicy[3].toString(), newAgeLimit.toString(), "Updated age limit should match");
        assert.equal(updatedPolicy[4], newIsActive, "Updated policy should be active");
    });
});
