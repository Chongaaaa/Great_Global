// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ClaimProcessing {
    address public owner;
    address[] public admins;
    address[] public users;

    struct Claim {
        uint256 amount;
        bool isProcessed;
    }

    mapping(address => mapping(uint256 => Claim)) public claims;
    mapping(address => uint256) public claimCount;

    event ClaimProcessed(
        address indexed user,
        uint256 indexed claimId,
        bool claimValid,
        uint256 amount
    );

    event Debug(string message, address user, uint256 claimId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyAdmins() {
        bool isAdmin = false;
        for (uint256 i = 0; i < admins.length; i++) {
            if (msg.sender == admins[i]) {
                isAdmin = true;
                break;
            }
        }
        require(
            isAdmin || msg.sender == owner,
            "Only an admin or the owner can perform this action"
        );
        _;
    }

    modifier onlyUsers() {
        bool isUser = false;
        for (uint256 i = 0; i < users.length; i++) {
            if (msg.sender == users[i]) {
                isUser = true;
                break;
            }
        }
        require(isUser, "Only registered users can perform this action");
        _;
    }

    constructor() payable {
        owner = msg.sender;
    }

    function addAdmin(address _admin) public onlyOwner {
        bool adminExists = false;
        for (uint256 i = 0; i < admins.length; i++) {
            if (_admin == admins[i]) {
                adminExists = true;
            }
            require(!adminExists, "Admin already exists");
        }
        admins.push(_admin);
    }

    function removeAdmin(address _admin) public onlyOwner {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == _admin) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                break;
            }
        }
    }

    function addUser(address _user) public onlyAdmins {
        bool userExists = false;
        for (uint256 i = 0; i < users.length; i++) {
            if (_user == users[i]) {
                userExists = true;
            }
            require(!userExists, "User already exists");
        }
        users.push(_user);
    }

    function addClaim(uint256 amount) public onlyUsers {
        address user = msg.sender;
        uint256 claimId = claimCount[user];
        amount = amount; // convert eth to wei
        claims[user][claimId] = Claim(amount, false);
        claimCount[user]++;
    }

    function approveClaim(
        address user,
        uint256 claimId,
        bool claimValid
    ) public onlyAdmins {
        require(claimId < claimCount[user], "Claim does not exist.");
        require(!claims[user][claimId].isProcessed, "Claim already processed.");

        uint256 amount = claims[user][claimId].amount;

        emit Debug("Claim not processed", user, claimId, amount);
        if (claimValid) {
            (bool success, ) = user.call{value: amount}("");
            require(success, "Refund transfer failed.");
        }

        claims[user][claimId].isProcessed = true;
        emit ClaimProcessed(user, claimId, claimValid, amount);
    }

    // Function to get all unprocessed claims for a specific user
    function getUnprocessedClaims(
        address user
    ) public view returns (uint256[] memory) {
        uint256 unprocessedCount = 0;
        uint256 totalClaims = claimCount[user];

        for (uint256 i = 0; i < totalClaims; i++) {
            if (!claims[user][i].isProcessed) {
                unprocessedCount++;
            }
        }

        uint256[] memory unprocessedClaims = new uint256[](unprocessedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalClaims; i++) {
            if (!claims[user][i].isProcessed) {
                unprocessedClaims[index] = i;
                index++;
            }
        }

        return unprocessedClaims;
    }

    // Function to get all unprocessed claims for all users
    function getAllUnprocessedClaims()
        public
        view
        onlyAdmins
        returns (address[] memory, uint256[] memory, uint256[] memory)
    {
        uint256 totalUnprocessed = 0;

        for (uint256 j = 0; j < users.length; j++) {
            address user = users[j];
            uint256 totalClaims = claimCount[user];

            for (uint256 i = 0; i < totalClaims; i++) {
                if (!claims[user][i].isProcessed) {
                    totalUnprocessed++;
                }
            }
        }

        address[] memory userAddresses = new address[](totalUnprocessed);
        uint256[] memory claimIds = new uint256[](totalUnprocessed);
        uint256[] memory claimAmount = new uint256[](totalUnprocessed);
        uint256 index = 0;

        for (uint256 j = 0; j < users.length; j++) {
            address user = users[j];
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

    function fund() public payable onlyAdmins {
        require(msg.value > 0, "Amount must be greater than 0.");
    }

    receive() external payable {}

    fallback() external payable {}

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
