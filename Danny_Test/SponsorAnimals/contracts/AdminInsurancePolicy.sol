// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AdminInsurancePolicy {
    struct Policy {
        string name;
        uint256 premium;
        uint256 coverageAmount;
        uint256 ageLimit;
        bool isActive;
    }

    address public admin;
    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;

    // Events
    event PolicyCreated(
        uint256 policyId,
        string name,
        uint256 premium,
        uint256 coverageAmount,
        uint256 ageLimit,
        bool isActive
    );

    event PolicyUpdated(
        uint256 policyId,
        string name,
        uint256 premium,
        uint256 coverageAmount,
        uint256 ageLimit,
        bool isActive
    );

    // Modifier to restrict actions to only the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Constructor to initialize the contract's admin
    constructor() {
        admin = msg.sender;
    }

    // Function to create a new policy
    function createPolicy(
        string memory _name,
        uint256 _premium,
        uint256 _coverageAmount,
        uint256 _ageLimit,
        bool _isActive
    ) public onlyAdmin {
        require(bytes(_name).length > 0, "Policy name is required");
        require(_premium > 0, "Premium must be greater than 0");
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_ageLimit >= 0, "Age limit must be positive");

        policyCount++;
        policies[policyCount] = Policy(_name, _premium, _coverageAmount, _ageLimit, _isActive);
        emit PolicyCreated(policyCount, _name, _premium, _coverageAmount, _ageLimit, _isActive);
    }

    // Function to update an existing policy's details
    function updatePolicy(
        uint256 _policyId,
        string memory _name,
        uint256 _premium,
        uint256 _coverageAmount,
        uint256 _ageLimit,
        bool _isActive
    ) public onlyAdmin {
        // Ensure the policy ID is valid by checking if it exists
        require(_policyId > 0 && _policyId <= policyCount, "Policy ID does not exist");
        Policy storage policy = policies[_policyId];
        policy.name = _name;
        policy.premium = _premium;
        policy.coverageAmount = _coverageAmount;
        policy.ageLimit = _ageLimit;
        policy.isActive = _isActive;

        emit PolicyUpdated(_policyId, _name, _premium, _coverageAmount, _ageLimit, _isActive);
    }

    // Function to fetch a policy by its ID
    function getPolicy(uint256 _policyId)
        public
        view
        returns (string memory, uint256, uint256, uint256, bool)
    {
        Policy storage policy = policies[_policyId];
        return (policy.name, policy.premium, policy.coverageAmount, policy.ageLimit, policy.isActive);
    }

    // New function to fetch all active policies
    function getAllActivePolicies() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].isActive) {
                activeCount++;
            }
        }

        uint256[] memory activePolicyIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].isActive) {
                activePolicyIds[index] = i;
                index++;
            }
        }
        return activePolicyIds;
    }

     // New function to fetch all archived policies (inactive)
    function getAllArchivedPolicies() public view returns (uint256[] memory) {
        uint256 archivedCount = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (!policies[i].isActive) {
                archivedCount++;
            }
        }

        uint256[] memory archivedPolicyIds = new uint256[](archivedCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (!policies[i].isActive) {
                archivedPolicyIds[index] = i;
                index++;
            }
        }
        return archivedPolicyIds;
    }
}
