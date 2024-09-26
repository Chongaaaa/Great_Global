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
        const policy = await adminInsurancePolicy.getPolicy(0); // Note: Changed to 0 as policies likely start from index 0
        
        // Log policy details for debugging
        console.log("Retrieved policy:", policy);

        // Assertions to check if the policy was created correctly
        assert.equal(policy[0], policyName, "Policy name should match");
        assert.equal(policy[1].toString(), premium.toString(), "Premium should match");
        assert.equal(policy[2].toString(), coverageAmount.toString(), "Coverage amount should match");
        assert.equal(policy[3].toString(), ageLimit.toString(), "Age limit should match");
        assert.equal(policy[4], isActive, "Policy should be active");

        // Check if it's active via availability function
        const isPolicyActive = await adminInsurancePolicy.getPolicyAvailibility(0);
        assert.equal(isPolicyActive, true, "Policy should be active");
    });

    it("should update the existing policy details", async () => {
        const policyId = 0; // First policy has index 0
        const newPolicyName = "Updated Health Insurance";
        const newPremium = web3.utils.toWei("1.5", "ether");
        const newCoverageAmount = web3.utils.toWei("15", "ether");
        const newAgeLimit = 65;
        const newIsActive = true;

        // Update the existing policy
        await adminInsurancePolicy.updatePolicy(policyId, newPolicyName, newPremium, newCoverageAmount, newAgeLimit, newIsActive, { from: adminAccount });

        // Fetch the updated policy details
        const updatedPolicy = await adminInsurancePolicy.getPolicy(policyId);

        // Log updated policy details for debugging
        console.log("Updated policy:", updatedPolicy);

        // Assertions to check if the policy was updated correctly
        assert.equal(updatedPolicy[0], newPolicyName, "Updated policy name should match");
        assert.equal(updatedPolicy[1].toString(), newPremium.toString(), "Updated premium should match");
        assert.equal(updatedPolicy[2].toString(), newCoverageAmount.toString(), "Updated coverage amount should match");
        assert.equal(updatedPolicy[3].toString(), newAgeLimit.toString(), "Updated age limit should match");
        assert.equal(updatedPolicy[4], newIsActive, "Updated policy should be active");
    });
});