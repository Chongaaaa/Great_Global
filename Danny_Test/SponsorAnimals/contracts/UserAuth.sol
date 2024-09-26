// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct User {
        string name;
        string email;
        address refundAddress;
        uint8 age;
        bytes32 hashedPassword;
        bool isRegistered;
        uint256[] subscribedPackages;
    }

    mapping(string => User) private users;

    string[] public registeredUserEmails; // External array to store all registered users' email
    address[] public adminAddresses; // Array to store all admin addresses

    mapping(address => bool) public admins; // Mapping to keep track of admins
    address public owner; // Contract owner

    string public currentUser; // For other contracts to know who the current user is
    address public currentAdmin; // For other contracts to know who the current admin is

    event UserRegistered(
        address indexed userAddress,
        string _name,
        string email,
        uint8 _age
    );
    event PasswordReset(
        address indexed userAddress,
        bytes32 oldHashedPassword,
        bytes32 newHashedPassword
    );
    event AdminAssigned(address indexed adminAddress);
    event AdminRemoved(address indexed adminAddress);
    event UserLoggedOut(string indexed email);
    event AdminLoggedOut(address indexed adminAddress);

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

    modifier sameAdmin() {
        require(
            msg.sender == currentAdmin,
            "Metamask account and address used to sign in do not match."
        );
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
        uint8 _age,
        string memory _password,
        address _refundAddress
    ) public {
        bool validEmail = true;
        for (uint i = 0; i < registeredUserEmails.length; i++) {
            if (
                keccak256(abi.encodePacked(_email)) ==
                keccak256(abi.encodePacked(registeredUserEmails[i]))
            ) {
                validEmail = false;
            }
            require(validEmail, "Email is already registered by another user.");
        }

        bytes32 hashedPassword = keccak256(abi.encodePacked(_password)); // Hash the password
        users[_email] = User({
            name: _name,
            email: _email,
            age: _age,
            refundAddress: _refundAddress,
            hashedPassword: hashedPassword,
            isRegistered: true,
            subscribedPackages: new uint256[](100)
        });

        // Add the user address to the external registeredUsers array
        registeredUserEmails.push(_email);
        currentUser = _email;

        emit UserRegistered(msg.sender, _name, _email, _age);
    }

    // Admin sign in using just the address
    function adminSignIn(address _adminAddress) public returns (bool) {
        require(admins[_adminAddress], "This address is not an admin.");

        currentAdmin = _adminAddress;
        return true;
    }

    // Admin function to assign a new admin
    function assignAdmin(address _adminAddress) public onlyOwner sameAdmin {
        require(!admins[_adminAddress], "This address is already an admin.");
        admins[_adminAddress] = true;

        adminAddresses.push(_adminAddress);

        emit AdminAssigned(_adminAddress);
    }

    // Admin function to remove an admin
    function removeAdmin(address _adminAddress) public onlyOwner sameAdmin {
        require(admins[_adminAddress], "This address is not an admin.");
        require(_adminAddress != owner, "Owner cannot be removed as admin.");
        admins[_adminAddress] = false;

        for (uint i = 0; i < adminAddresses.length; i++) {
            if (adminAddresses[i] == _adminAddress) {
                adminAddresses[i] = adminAddresses[adminAddresses.length - 1];
                adminAddresses.pop();
                break;
            }
        }

        emit AdminRemoved(_adminAddress);
    }

    // Sign in using email and password
    function signIn(
        string memory _identifier,
        string memory _password
    ) public returns (bool) {
        User memory user = users[_identifier];
        require(user.isRegistered, "User not registered.");
        require(
            user.hashedPassword == keccak256(abi.encodePacked(_password)),
            "Password is incorrect."
        );

        currentUser = _identifier;
        return true;
    }

    // Reset password
    function resetPassword(
        string memory _identifier,
        string memory _newPassword
    ) public {
        require(users[_identifier].isRegistered, "User not registered.");
        bool isValid = keccak256(abi.encodePacked(users[_identifier].email)) ==
            keccak256(abi.encodePacked(_identifier));
        require(isValid, "Invalid email.");

        bytes32 newHashedPassword = keccak256(abi.encodePacked(_newPassword));
        bytes32 oldHashedPassword = users[_identifier].hashedPassword;

        require(
            newHashedPassword != oldHashedPassword,
            "New password cannot be the same as the old password."
        );

        users[_identifier].hashedPassword = newHashedPassword;

        emit PasswordReset(msg.sender, oldHashedPassword, newHashedPassword);
    }

    // Logout for the current user
    function logoutUser() public {
        require(
            bytes(currentUser).length > 0,
            "No user is currently signed in."
        );
        emit UserLoggedOut(currentUser);
        currentUser = ""; // Reset current user
    }

    // Logout for the current admin
    function logoutAdmin() public {
        require(currentAdmin != address(0), "No admin is currently signed in.");
        emit AdminLoggedOut(currentAdmin);
        currentAdmin = address(0); // Reset current admin
    }

    // Function to get all registered user emails
    function getAllRegisteredUsers() public view returns (string[] memory) {
        return registeredUserEmails;
    }

    // Function to get all registered admin addresses
    function getAllAdmins() public view returns (address[] memory) {
        return adminAddresses;
    }

    function getUserAge() public view returns (uint8) {
        require(users[currentUser].isRegistered, "User not registered");
        return users[currentUser].age;
    }

    function getCurrentUser() public view returns (string memory) {
        return (currentUser);
    }

    function getCurrentAdmin() public view returns (address) {
        return (currentAdmin);
    }

    function getRegisteredUserEmails() public view returns (string[] memory) {
        return (registeredUserEmails);
    }

    function getUserRefundAddress(
        string memory _user
    ) public view returns (address) {
        return (users[_user].refundAddress);
    }
}