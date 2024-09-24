// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract purchasePackage {
    address public admin;

    struct InsurancePackage {
        uint256 packageId;
        string packageName;
        uint256 minAge;
        uint256 maxAge;
    }

    struct User {
        string name;
        uint256 age;
        uint256[] subscribedPackages; // Store ID packages that the user subscribed
    }

    struct ApprovalRequest {
        address userAddress;
        uint256 packageId;
    }

    mapping(address => User) public users;
    mapping(uint256 => InsurancePackage) public insurancePackages;
    ApprovalRequest[] public pendingApprovals; // Store approval requests

    uint256 public packageCount;

    event PackageSubscribed(address user, uint256 packageId);
    event ApprovalRequested(address user, uint256 packageId);
    event PackageApproved(address user, uint256 packageId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;

        // Add dummy data insurance packages
        addInsurancePackage("Basic Health Package", 18, 60);
        addInsurancePackage("Premium Health Package", 30, 70);
        addInsurancePackage("Senior Health Package", 50, 80);
    }

    //  User subscribe to a package and checks if they qualify based on their details
    function subscribeToPackage(uint256 _packageId) public {
        InsurancePackage memory package = insurancePackages[_packageId];
        User storage user = users[msg.sender];

        // Check if user qualifies based on age
        require(
            user.age >= package.minAge && user.age <= package.maxAge,
            "You does not qualify for this package"
        );

        // Check if user is already subscribed to this package
        for (uint256 i = 0; i < user.subscribedPackages.length; i++) {
            if (user.subscribedPackages[i] == _packageId) {
                revert("You are already subscribed to this package");
            }
        }

        // Send the request for admin approval
        pendingApprovals.push(ApprovalRequest(msg.sender, _packageId));
        emit ApprovalRequested(msg.sender, _packageId);
    }

    //  Admin approves the user subscription and adds the package to the user's subscribed list
    function approvePackageSubscription(
        uint256 _requestIndex
    ) public onlyAdmin {
        // Retrieve the approval request
        ApprovalRequest memory request = pendingApprovals[_requestIndex];
        address userAddress = request.userAddress;
        uint256 packageId = request.packageId;

        User storage user = users[userAddress];

        // Add the package to the user's subscribed packages
        user.subscribedPackages.push(packageId);
        emit PackageApproved(userAddress, packageId);
        emit PackageSubscribed(userAddress, packageId); // Emit an event indicating the user has subscribed

        // Check the package was actually added to the user's subscriptions
        assert(
            user.subscribedPackages[user.subscribedPackages.length - 1] ==
                packageId
        );

        // Remove the request from pending approvals
        _removePendingApproval(_requestIndex);
    }

    //  To remove an approval request after it has been processed
    function _removePendingApproval(uint256 _index) internal {
        require(_index < pendingApprovals.length, "Invalid index");
        pendingApprovals[_index] = pendingApprovals[
            pendingApprovals.length - 1
        ];
        pendingApprovals.pop();
    }

    // Admin can view the number of pending approval requests
    function getPendingApprovalsLength()
        public
        view
        onlyAdmin
        returns (uint256)
    {
        return pendingApprovals.length;
    }

    //  Admin retrieve specific approval request details from user
    function getApprovalRequest(
        uint256 index
    ) public view onlyAdmin returns (address, uint256) {
        require(index < pendingApprovals.length, "Invalid index");
        ApprovalRequest memory request = pendingApprovals[index];
        return (request.userAddress, request.packageId);
    }

    //  Admin adds a new insurance package to the system (test for dummy data for choose insurance package)
    function addInsurancePackage(
        string memory _name,
        uint256 _minAge,
        uint256 _maxAge
    ) public onlyAdmin {
        packageCount++;
        insurancePackages[packageCount] = InsurancePackage({
            packageId: packageCount,
            packageName: _name,
            minAge: _minAge,
            maxAge: _maxAge
        });
    }

    //  Register user details (test for dummy data for user details)
    function registerUser(string memory _name, uint256 _age) public {
        User storage user = users[msg.sender];
        user.name = _name;
        user.age = _age;
    }

    // Retrieve the user's subscribed packages
    function getUserSubscribedPackages(
        address _user
    ) public view returns (uint256[] memory) {
        return users[_user].subscribedPackages;
    }
}
