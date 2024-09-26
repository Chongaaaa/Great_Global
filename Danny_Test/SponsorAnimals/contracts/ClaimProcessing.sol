// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdminInsurancePolicy.sol";
import "./UserAuth.sol";

// import "./PurchasePackage.sol";

contract ClaimProcessing {
    AdminInsurancePolicy public adminContract;
    UserAuth public userAuthContract;
    //PurchasePackage public userPurchasePackageContract;

    struct Claim {
        uint256 amount;
        bool isProcessed;
    }

    mapping(string => mapping(uint256 => Claim)) public claims;
    mapping(string => uint256) public claimCount;

    event ClaimAdded(string user, uint256 claimId, uint256 amount);

    event ClaimProcessed(
        string user,
        uint256 claimId,
        bool claimValid,
        uint256 amount
    );

    event FundsAdded(address admin, uint256 amount);

    //, address _userPurchasePackageAddress
    constructor(address _adminPolicyAddress, address _userAuthAddress) {
        adminContract = AdminInsurancePolicy(_adminPolicyAddress);
        userAuthContract = UserAuth(_userAuthAddress);
        //userPurchasePackageContract = PurchasePackage(_userPurchasePackageAddress);
    }

    modifier sameAdmin() {
        require(
            msg.sender == userAuthContract.getCurrentAdmin(),
            "Metamask account and address used to sign in do not match."
        );
        _;
    }

    function addClaim(uint256 amount) public {
        string memory user = userAuthContract.getCurrentUser();
        uint256 claimId = claimCount[user];
        claims[user][claimId] = Claim(amount, false);
        claimCount[user]++;
        emit ClaimAdded(user, claimId, amount);
    }

    function approveClaim(
        string memory user,
        uint256 claimId,
        bool claimValid
    ) public sameAdmin {
        require(claimId < claimCount[user], "Claim does not exist.");
        require(!claims[user][claimId].isProcessed, "Claim already processed.");

        uint256 amount = claims[user][claimId].amount;

        address refundAddress = userAuthContract.getUserRefundAddress(user);
        require(refundAddress != address(0), "Invalid refund address.");

        if (claimValid) {
            (bool success, ) = refundAddress.call{value: amount}("");
            require(success, "Refund transfer failed.");
        }

        claims[user][claimId].isProcessed = true;
        emit ClaimProcessed(user, claimId, claimValid, amount);
    }

    // Function to get all unprocessed claims for a specific user
    function getUnprocessedClaims(
        string memory user
    ) public view sameAdmin returns (uint256[] memory, uint256[] memory) {
        uint256 unprocessedCount = 0;
        uint256 totalClaims = claimCount[user];

        for (uint256 i = 0; i < totalClaims; i++) {
            if (!claims[user][i].isProcessed) {
                unprocessedCount++;
            }
        }

        uint256[] memory claimIds = new uint256[](unprocessedCount);
        uint256[] memory claimAmount = new uint256[](unprocessedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalClaims; i++) {
            if (!claims[user][i].isProcessed) {
                claimIds[index] = i;
                claimAmount[index] = claims[user][i].amount;
                index++;
            }
        }

        return (claimIds, claimAmount);
    }

    // Function to get all unprocessed claims for all users
    function getAllUnprocessedClaims()
        public
        view
        sameAdmin
        returns (string[] memory, uint256[] memory, uint256[] memory)
    {
        uint256 totalUnprocessed = 0;

        string[] memory users = userAuthContract.getRegisteredUserEmails();

        for (uint256 j = 0; j < users.length; j++) {
            string memory user = users[j];
            uint256 totalClaims = claimCount[user];

            for (uint256 i = 0; i < totalClaims; i++) {
                if (!claims[user][i].isProcessed) {
                    totalUnprocessed++;
                }
            }
        }

        string[] memory userAddresses = new string[](totalUnprocessed);
        uint256[] memory claimIds = new uint256[](totalUnprocessed);
        uint256[] memory claimAmount = new uint256[](totalUnprocessed);
        uint256 index = 0;

        for (uint256 j = 0; j < users.length; j++) {
            string memory user = users[j];
            uint256 totalClaims = claimCount[user];

            for (uint256 i = 0; i < totalClaims; i++) {
                if (!claims[user][i].isProcessed) {
                    userAddresses[index] = user;
                    claimIds[index] = i;
                    claimAmount[index] = claims[user][i].amount;
                    index++;
                }
            }
        }

        return (userAddresses, claimIds, claimAmount);
    }

    function fund() public payable sameAdmin {
        require(msg.value > 0, "Amount must be greater than 0.");
        emit FundsAdded(msg.sender, msg.value);
    }

    receive() external payable {}

    fallback() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
