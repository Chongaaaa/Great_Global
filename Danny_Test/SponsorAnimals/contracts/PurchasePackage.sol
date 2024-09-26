// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdminInsurancePolicy.sol"; // Import the AdminInsurancePolicy contract
import "./UserAuth.sol";

contract PurchasePackage {
    AdminInsurancePolicy public adminContract;
    UserAuth public userAuthContract;
    address public admin;

    enum InsuranceStatus {
        Pending,
        Approved,
        Cancelled
    }

    struct Subscription {
        uint256 packageId;
        uint256 payDate;
        InsuranceStatus status;
    }

    struct PackageData {
        string userEmail;
        uint256 packageID;
    }

    mapping(string => mapping(uint256 => Subscription)) public Subscriptions;
    mapping(string => uint256) public subscriptionCount;

    event PackageSubscribed(address indexed user, uint256 packageId);
    event SubscriptionRequested(string indexed user, uint256 packageId);
    event SubscriptionApproved(
        string indexed user,
        uint256 packageId,
        InsuranceStatus status
    );

    constructor(address _adminPolicyAddress, address _userAuthAddress) {
        adminContract = AdminInsurancePolicy(_adminPolicyAddress);
        userAuthContract = UserAuth(_userAuthAddress);
        admin = msg.sender;
    }

    modifier sameAdmin() {
        require(
            msg.sender == userAuthContract.getCurrentAdmin(),
            "Metamask account and address used to sign in do not match."
        );
        _;
    }

    // Function for subscribing to a package (requests admin approval)
    function subscribeToPackage(uint256 _packageId) public {
        string memory user = userAuthContract.getCurrentUser();
        // Fetch the policy details from the AdminInsurancePolicy contract

        bool isActive = adminContract.getPolicyAvailibility(_packageId);

        // Ensure the package is active and the user meets the age limit
        require(isActive, "Package is not active");
        require(
            userAuthContract.getUserAge() > 0,
            "User does not meet the age limit for this package"
        );

        // Check to make sure cannot subscribed redundent packageId
        for (uint256 i = 0; i < subscriptionCount[user]; i++){
            require(Subscriptions[user][i].packageId != _packageId, "You had subscribed the same package or waiting for approved.");
        }

        // Create a subscription request
        Subscriptions[user][subscriptionCount[user]] = Subscription({
            packageId: _packageId,
            payDate: 253393911092, // Impossibly future date
            status: InsuranceStatus.Pending
        });

        subscriptionCount[user]++;

        emit SubscriptionRequested(user, _packageId);
    }

    // Function for admin to approve a subscription request
    function approveSubscription(
        string memory _user,
        uint256 _packageID
    ) public sameAdmin {
        require(
            Subscriptions[_user][_packageID].status == InsuranceStatus.Pending,
            "This request does not exist"
        );

        Subscriptions[_user][_packageID].status = InsuranceStatus.Approved;
        Subscriptions[_user][_packageID].payDate = block.timestamp;

        emit SubscriptionApproved(
            _user,
            _packageID,
            Subscriptions[_user][_packageID].status
        );
    }

    function viewPackages()
        public
        view
        returns (
            PackageData[] memory,
            PackageData[] memory,
            PackageData[] memory
        )
    {
        string memory user = userAuthContract.getCurrentUser();
        uint256 totalSubscriptions = subscriptionCount[user];

        // Initialize counts to keep track of the number of approved, cancelled, and pending packages
        uint256 approvedCount = 0;
        uint256 cancelledCount = 0;
        uint256 pendingCount = 0;

        // First, count the total number of subscriptions in each category
        for (uint256 i = 0; i < totalSubscriptions; i++) {
            Subscription storage subscription = Subscriptions[user][i];

            if (subscription.status == InsuranceStatus.Approved) {
                approvedCount++;
            } else if (subscription.status == InsuranceStatus.Cancelled) {
                cancelledCount++;
            } else if (subscription.status == InsuranceStatus.Pending) {
                pendingCount++;
            }
        }

        // Initialize arrays with the correct sizes
        PackageData[] memory approvedPackages = new PackageData[](
            approvedCount
        );
        PackageData[] memory cancelledPackages = new PackageData[](
            cancelledCount
        );
        PackageData[] memory pendingPackages = new PackageData[](pendingCount);

        // Reset counts to use as indices
        approvedCount = 0;
        cancelledCount = 0;
        pendingCount = 0;

        // Loop through the user's subscriptions and fill the arrays
        for (uint256 i = 0; i < totalSubscriptions; i++) {
            Subscription storage subscription = Subscriptions[user][i];

            if (subscription.status == InsuranceStatus.Approved) {
                approvedPackages[approvedCount] = PackageData({
                    userEmail: user,
                    packageID: subscription.packageId
                });
                approvedCount++;
            } else if (subscription.status == InsuranceStatus.Cancelled) {
                cancelledPackages[cancelledCount] = PackageData({
                    userEmail: user,
                    packageID: subscription.packageId
                });
                cancelledCount++;
            } else if (subscription.status == InsuranceStatus.Pending) {
                pendingPackages[pendingCount] = PackageData({
                    userEmail: user,
                    packageID: subscription.packageId
                });
                pendingCount++;
            }
        }

        return (approvedPackages, cancelledPackages, pendingPackages);
    }

    // Function to get details of a specific package by ID
    function getPackageDetails(
        uint256 _packageId
    ) public view returns (string memory, uint256, uint256, uint256, bool) {
        return adminContract.getPolicy(_packageId); // Fetch package details from AdminInsurancePolicy
    }

    // Function for the admin to view all subscriptions
    function viewAllSubscriptions()
        public
        view
        sameAdmin
        returns (
            PackageData[] memory,
            PackageData[] memory,
            PackageData[] memory
        )
    {
        string[] memory registeredUserEmails = userAuthContract
            .getRegisteredUserEmails();

        uint256 totalSubscriptions;
        uint256 approvedCount = 0;
        uint256 cancelledCount = 0;
        uint256 pendingCount = 0;

        // First, calculate the total count of each category
        for (uint256 i = 0; i < registeredUserEmails.length; i++) {
            string memory currentUser = registeredUserEmails[i];
            totalSubscriptions = subscriptionCount[currentUser];

            for (uint256 j = 0; j < totalSubscriptions; j++) {
                Subscription storage subscription = Subscriptions[currentUser][
                    j
                ];

                if (subscription.status == InsuranceStatus.Approved) {
                    approvedCount++;
                } else if (subscription.status == InsuranceStatus.Cancelled) {
                    cancelledCount++;
                } else if (subscription.status == InsuranceStatus.Pending) {
                    pendingCount++;
                }
            }
        }

        // Now, initialize the arrays with the correct size
        PackageData[] memory approvedPackages = new PackageData[](
            approvedCount
        );
        PackageData[] memory cancelledPackages = new PackageData[](
            cancelledCount
        );
        PackageData[] memory pendingPackages = new PackageData[](pendingCount);

        // Reset counts to use as indices while adding items
        approvedCount = 0;
        cancelledCount = 0;
        pendingCount = 0;

        // Loop through users again and populate the arrays
        for (uint256 i = 0; i < registeredUserEmails.length; i++) {
            string memory currentUser = registeredUserEmails[i];
            totalSubscriptions = subscriptionCount[currentUser];

            for (uint256 j = 0; j < totalSubscriptions; j++) {
                Subscription storage subscription = Subscriptions[currentUser][
                    j
                ];

                if (subscription.status == InsuranceStatus.Approved) {
                    approvedPackages[approvedCount] = PackageData({
                        userEmail: currentUser,
                        packageID: subscription.packageId
                    });
                    approvedCount++;
                } else if (subscription.status == InsuranceStatus.Cancelled) {
                    cancelledPackages[cancelledCount] = PackageData({
                        userEmail: currentUser,
                        packageID: subscription.packageId
                    });
                    cancelledCount++;
                } else if (subscription.status == InsuranceStatus.Pending) {
                    pendingPackages[pendingCount] = PackageData({
                        userEmail: currentUser,
                        packageID: subscription.packageId
                    });
                    pendingCount++;
                }
            }
        }

        return (approvedPackages, cancelledPackages, pendingPackages);
    }
}