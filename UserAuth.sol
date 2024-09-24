// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct User {
        string name;
        string email;
        uint age;
        bytes32 hashedPassword;
        bool isRegistered;
    }

    mapping(address => User) public users;
    mapping(string => address) private emailToAddress;
    mapping(string => address) private nameToAddress;
    
    address[] public registeredUsers; // External array to store all registered users' addresses

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
    event InsuranceSubscribed(
        address indexed userAddress,
        uint256 insuranceId
    );

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
            isRegistered: true
        });

        // Map email and name to address for easy lookup
        emailToAddress[_email] = msg.sender;
        nameToAddress[_name] = msg.sender;

        // Add the user address to the external registeredUsers array
        registeredUsers.push(msg.sender);

        emit UserRegistered(msg.sender, _name, _email, _age);
    }

    // Sign in using either name or email and password
    function signIn(
        string memory _identifier,
        string memory _password
    ) public view returns (bool) {
        address userAddress = emailToAddress[_identifier];
        if (userAddress == address(0)) {
            userAddress = nameToAddress[_identifier];
        }

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

        bool isValid = (keccak256(abi.encodePacked(users[msg.sender].name)) ==
            keccak256(abi.encodePacked(_identifier)) ||
            keccak256(abi.encodePacked(users[msg.sender].email)) ==
            keccak256(abi.encodePacked(_identifier)));

        require(isValid, "Invalid name or email.");

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
}