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
        uint256[] subscribedPackages; // Store package IDs the user subscribed to
    }

    struct ApprovalRequest {
        uint256 packageId;
        bool isProcessed;
    }

    struct SubscribedPackage {
        uint256 subscriptionID;
        uint256 packageId;
        uint256 payAmount;
        uint256 payDate;
        bool autoPay;
        bool isActive;
    }

    mapping(address => User) public users; // Maps address to User struct
    mapping(uint256 => InsurancePackage) public insurancePackages; // Maps packageId to InsurancePackage
    mapping(address => mapping(uint256 => SubscribedPackage)) public subscribedPackageIndex; //Maps user address and subscriptionID to a SubscribedPackage, storing subscription details for that user.
    mapping(address => mapping(uint256 => ApprovalRequest)) public approvalRequests; // Map user address and a request ID to an ApprovalRequest, keeping track of pending approval requests
    mapping(address => uint256) public approvalRequestCount; // Tracks how many approval requests each user made, each request has a unique ID for each user.

    address[] public userAddresses; // Array to store all registered user addresses 
    uint256 public packageCount = 0; // Counter for total insurance packages
    uint256 private userCount = 0; // Counter for registered users

    event PackageSubscribed(
        address indexed user,
        uint256 packageId,
        uint256 payAmount,
        uint256 payDate,
        bool autoPay,
        bool isActive
    );
    event ApprovalRequested(address indexed user, uint256 packageId);
    event PackageApproved(address indexed user, uint256 packageId);
    event UserAdded(address indexed user); // Event for registering a user

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;

        // Add dummy data insurance packages during deployment for testing
        addInsurancePackage("Basic Health Package", 18, 60);
        addInsurancePackage("Premium Health Package", 30, 70);
        addInsurancePackage("Senior Health Package", 50, 80);
    }

    // Function to register users
    function registerUser(string memory _name, uint256 _age) public {
        require(users[msg.sender].age == 0, "User already registered");

        User storage user = users[msg.sender];
        user.name = _name;
        user.age = _age;

        // Add the user to the user list if it's their first registration
        userAddresses.push(msg.sender);
        userCount++;

        // Emit event to confirm the user has been added
        emit UserAdded(msg.sender);
    }

    // Admin adds a new insurance package to the system
    function addInsurancePackage(string memory _name, uint256 _minAge, uint256 _maxAge) public onlyAdmin {
        packageCount++; // Increment the package count
        insurancePackages[packageCount] = InsurancePackage({
            packageId: packageCount,
            packageName: _name,
            minAge: _minAge,
            maxAge: _maxAge
        });
    }

    // User subscribes to a package and checks if they qualify based on their details
    function subscribeToPackage(uint256 _packageId) public {
        InsurancePackage memory package = insurancePackages[_packageId];
        User storage user = users[msg.sender];

        // Ensure user is registered
        require(user.age > 0, "You must register first");
        
        // Check if user qualifies based on age
        require(user.age >= package.minAge && user.age <= package.maxAge, "You do not qualify for this package");

        // Check if user is already subscribed to this package
        for (uint256 i = 0; i < user.subscribedPackages.length; i++) {
            require(user.subscribedPackages[i] != _packageId, "You are already subscribed to this package");
        }

        // Create a new approval request for admin approval
        uint256 requestId = approvalRequestCount[msg.sender]++;
        approvalRequests[msg.sender][requestId] = ApprovalRequest(_packageId, false);
        emit ApprovalRequested(msg.sender, _packageId);
    }

    // Admin approves the user subscription and adds the package to the user's subscribed list
    function approvePackageSubscription(
        address _user, 
        uint256 _requestId, 
        uint256 _payAmount
    ) public onlyAdmin {

        // Retrieve the current user
        User storage currUser = users[_user];
        require(currUser.age > 0, "User is not registered");
        
        // Retrieve the approval request
        ApprovalRequest storage request = approvalRequests[_user][_requestId];
        require(!request.isProcessed, "This request has already been processed");
        
        uint256 packageId = request.packageId;

        // Check if the user has already subscribed to this package
        for (uint256 i = 0; i < currUser.subscribedPackages.length; i++) {
            require(
                subscribedPackageIndex[_user][currUser.subscribedPackages[i]].packageId != packageId, 
                "User has already subscribed to this package"
            );
        }

        // Create a new package subscription
        SubscribedPackage memory newSubscription = SubscribedPackage({
            subscriptionID: currUser.subscribedPackages.length,
            packageId: packageId,
            payAmount: _payAmount,
            payDate: block.timestamp, // Use block.timestamp as the payment date
            autoPay: true,
            isActive: true
        });

        // Add the new subscription to the user
        subscribedPackageIndex[_user][currUser.subscribedPackages.length] = newSubscription;

        // Push the new package ID to the user's list of subscribed packages
        currUser.subscribedPackages.push(currUser.subscribedPackages.length);

        // Mark the request as processed
        request.isProcessed = true;

        // Emit the relevant event
        emit PackageApproved(_user, packageId);
        emit PackageSubscribed(_user, packageId, _payAmount, block.timestamp, true, true);
    }

    // Function to get all pending approvals
    function getAllPendingApprovals() public view onlyAdmin returns (address[] memory, uint256[] memory) {
        uint256 totalUnprocessed = 0;

        // First pass: count total unprocessed approvals
        for (uint256 j = 0; j < userAddresses.length; j++) {
            address user = userAddresses[j];
            uint256 totalRequests = approvalRequestCount[user];

            for (uint256 i = 0; i < totalRequests; i++) {
                if (!approvalRequests[user][i].isProcessed) {
                    totalUnprocessed++;
                }
            }
        }

        // Prepare arrays to store results
        address[] memory userArray = new address[](totalUnprocessed);
        uint256[] memory requestIds = new uint256[](totalUnprocessed);
        uint256 index = 0;

        // Second pass: populate arrays with unprocessed approval request details
        for (uint256 j = 0; j < userAddresses.length; j++) {
            address user = userAddresses[j];
            uint256 totalRequests = approvalRequestCount[user];

            for (uint256 i = 0; i < totalRequests; i++) {
                if (!approvalRequests[user][i].isProcessed) {
                    userArray[index] = user;
                    requestIds[index] = i;
                    index++;
                }
            }
        }

        return (userArray, requestIds);
    }

    // Retrieve the user's subscribed packages (list of package IDs)
    function getUserSubscribedPackages(address _user) public view returns (uint256[] memory) {
        return users[_user].subscribedPackages;
    }

    // Retrieve subscribed package details for a user
    function getUserSubscribedPackageDetails(address _user) public view returns (SubscribedPackage[] memory) {
        uint256[] memory subscribedIds = users[_user].subscribedPackages;
        SubscribedPackage[] memory userSubscriptions = new SubscribedPackage[](subscribedIds.length);

        for (uint256 i = 0; i < subscribedIds.length; i++) {
            userSubscriptions[i] = subscribedPackageIndex[_user][subscribedIds[i]];
        }
        return userSubscriptions;
    }

    // Get the total count of registered users
    function getTotalUsers() public view returns (uint256) {
        return userCount;
    }

    // Retrieve all registered users
    function getAllUsers() public view returns (address[] memory) {
        return userAddresses;
    }
}
