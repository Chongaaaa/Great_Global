// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "UserAuth.sol";

contract AdminInsurancePolicy {
    UserAuth public userAuthContract;

    struct Policy {
        string name;
        uint256 premium;
        uint256 coverageAmount;
        uint256 ageLimit;
        bool isActive;
    }

    //address public admin;
    address public admin;
    mapping(uint256 => Policy) public policies;
    uint256 public policyCount = 0;
    UserAuth public userAuth; // Instance of UserAuth contract

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
    event PolicyArchived(uint256 policyId);

    modifier sameAdmin() {
        require(
            msg.sender == userAuthContract.getCurrentAdmin(),
            "Metamask account and address used to sign in do not match."
        );
        _;
    }

    // Modifier to check if a policy exists
    modifier policyExists(uint256 _policyId) {
        require(_policyId >= 0 && _policyId < policyCount, "Invalid policy ID");
        _;
    }

    // Modifier to check if a policy is active
    modifier policyIsActive(uint256 _policyId) {
        require(policies[_policyId].isActive, "Policy is already archived");
        _;
    }

    // Constructor to initialize the contract's admin
    constructor(address _userAuthAddress) {
        admin = msg.sender; // Initially, the deployer is the admin
        userAuthContract = UserAuth(_userAuthAddress);
    }

    // Function to create a new policy with input validation
    function createPolicy(
        string memory _name,
        uint256 _premium,
        uint256 _coverageAmount,
        uint256 _ageLimit,
        bool _isActive
    ) public sameAdmin {
        require(bytes(_name).length > 0, "Policy name is required");
        require(_premium > 0, "Premium must be greater than 0");
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_ageLimit >= 0, "Age limit must be positive");

        policies[policyCount] = Policy(
            _name,
            _premium,
            _coverageAmount,
            _ageLimit,
            _isActive
        );
        emit PolicyCreated(
            policyCount,
            _name,
            _premium,
            _coverageAmount,
            _ageLimit,
            _isActive
        );
        
        policyCount++;
    }

    // Function to update an existing policy's details with validation
    function updatePolicy(
        uint256 _policyId,
        string memory _name,
        uint256 _premium,
        uint256 _coverageAmount,
        uint256 _ageLimit,
        bool _isActive
    ) public sameAdmin policyExists(_policyId) {
        require(bytes(_name).length > 0, "Policy name is required");
        require(_premium > 0, "Premium must be greater than 0");
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_ageLimit >= 0, "Age limit must be positive");

        Policy storage policy = policies[_policyId];
        policy.name = _name;
        policy.premium = _premium;
        policy.coverageAmount = _coverageAmount;
        policy.ageLimit = _ageLimit;
        policy.isActive = _isActive;

        emit PolicyUpdated(
            _policyId,
            _name,
            _premium,
            _coverageAmount,
            _ageLimit,
            _isActive
        );
    }

    // Function to fetch a policy by its ID
    function getPolicy(
        uint256 _policyId
    ) public view returns (string memory, uint256, uint256, uint256, bool) {
        Policy storage policy = policies[_policyId];
        return (
            policy.name,
            policy.premium,
            policy.coverageAmount,
            policy.ageLimit,
            policy.isActive
        );
    }

    // New function to fetch all active policies
    function getAllActivePolicies() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i <= policyCount; i++) {
            if (policies[i].isActive) {
                activeCount++;
            }
        }

        uint256[] memory activePolicyIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i <= policyCount; i++) {
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
        for (uint256 i = 0; i <= policyCount; i++) {
            if (!policies[i].isActive) {
                archivedCount++;
            }
        }

        uint256[] memory archivedPolicyIds = new uint256[](archivedCount);
        uint256 index = 0;
        for (uint256 i = 0; i <= policyCount; i++) {
            if (!policies[i].isActive) {
                archivedPolicyIds[index] = i;
                index++;
            }
        }
        return archivedPolicyIds;
    }

    function getPolicyAvailibility(
        uint256 _policyId
    ) public view returns (bool isActive) {
        Policy memory policy = policies[_policyId];
        return policy.isActive;
    }
}