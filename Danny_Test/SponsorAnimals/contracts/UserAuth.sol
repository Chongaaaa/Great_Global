// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct User {
        string name;
        string email;
        uint age;
        bytes32 hashedPassword;
        bool isRegistered;
        uint256[] subscribedPackages;
    }

    mapping(address => User) public users;
    mapping(string => address) private emailToAddress;

    address[] public registeredUsers; // External array to store all registered users' addresses
    address[] public adminAddresses; // Array to store all admin addresses

    mapping(address => bool) public admins; // Mapping to keep track of admins
    address public owner; // Contract owner

    event UserRegistered(
        address indexed userAddress,
        string _name,
        string email,
        uint _age
    );
    event PasswordReset(
        address indexed userAddress,
        bytes32 oldHashedPassword,
        bytes32 newHashedPassword
    );
    event InsuranceSubscribed(address indexed userAddress, uint256 insuranceId);
    event AdminAssigned(address indexed adminAddress);
    event AdminRemoved(address indexed adminAddress);

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner can perform this action"
        );
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admins can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender; // Set contract creator as the first admin
        admins[msg.sender] = true;
        adminAddresses.push(msg.sender); // Add owner to adminAddresses array
    }

    // Register a new user with additional attributes and hashed password
    function register(
        string memory _name,
        string memory _email,
        uint _age,
        string memory _password
    ) public {
        require(
            !users[msg.sender].isRegistered,
            "User already registered with this address."
        );
        require(
            emailToAddress[_email] == address(0),
            "Email is already registered by another user."
        ); // Check if email is already used

        bytes32 hashedPassword = keccak256(abi.encodePacked(_password)); // Hash the password
        users[msg.sender] = User({
            name: _name,
            email: _email,
            age: _age,
            hashedPassword: hashedPassword,
            isRegistered: true,
            subscribedPackages: new uint256[](100)
        });

        // Map email to address for easy lookup
        emailToAddress[_email] = msg.sender;

        // Add the user address to the external registeredUsers array
        registeredUsers.push(msg.sender);

        emit UserRegistered(msg.sender, _name, _email, _age);
    }

    // Admin sign in using just the address
    function adminSignIn(address _adminAddress) public view returns (bool) {
        require(admins[_adminAddress], "This address is not an admin."); // Check if the address is an admin

        return true; // Admin sign-in successful
    }

    // Admin function to assign a new admin
    function assignAdmin(address _adminAddress) public onlyOwner {
        require(!admins[_adminAddress], "This address is already an admin.");
        admins[_adminAddress] = true;

        adminAddresses.push(_adminAddress); // Add to adminAddresses array

        emit AdminAssigned(_adminAddress);
    }

    // Admin function to remove an admin
    function removeAdmin(address _adminAddress) public onlyOwner {
        require(admins[_adminAddress], "This address is not an admin.");
        require(_adminAddress != owner, "Owner cannot be removed as admin.");
        admins[_adminAddress] = false;

        // Remove admin from adminAddresses array
        for (uint i = 0; i < adminAddresses.length; i++) {
            if (adminAddresses[i] == _adminAddress) {
                adminAddresses[i] = adminAddresses[adminAddresses.length - 1];
                adminAddresses.pop();
                break;
            }
        }

        emit AdminRemoved(_adminAddress);
    }

    // Sign in using either name or email and password
    function signIn(
        string memory _identifier,
        string memory _password
    ) public view returns (bool) {
        address userAddress = emailToAddress[_identifier];

        User memory user = users[userAddress];
        require(user.isRegistered, "User not registered.");
        require(
            user.hashedPassword == keccak256(abi.encodePacked(_password)),
            "Password is incorrect."
        );

        return true; // Sign in successful
    }

    function resetPassword(
        string memory _identifier,
        string memory _newPassword
    ) public {
        require(users[msg.sender].isRegistered, "User not registered.");

        bool isValid = keccak256(abi.encodePacked(users[msg.sender].email)) ==
            keccak256(abi.encodePacked(_identifier));

        require(isValid, "Invalid email.");

        bytes32 newHashedPassword = keccak256(abi.encodePacked(_newPassword));
        bytes32 oldHashedPassword = users[msg.sender].hashedPassword;

        require(
            newHashedPassword != oldHashedPassword,
            "New password cannot be the same as the old password."
        );

        users[msg.sender].hashedPassword = newHashedPassword;

        emit PasswordReset(msg.sender, oldHashedPassword, newHashedPassword);
    }

    // Function to get all registered user addresses
    function getAllRegisteredUsers() public view returns (address[] memory) {
        return registeredUsers;
    }

    // Function to get all registered user addresses
    function getAllAdmins() public view returns (address[] memory) {
        return adminAddresses;
    }
}
