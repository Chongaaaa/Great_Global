// Web3 setup
let web3;
let contract;
const contractAddress = "0xD8f8eAd2B7c2BfFf197498A0c8Ea0A7884f7Df76"; // Replace with your deployed contract address
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "insuranceId",
        "type": "uint256"
      }
    ],
    "name": "InsuranceSubscribed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "oldHashedPassword",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "newHashedPassword",
        "type": "bytes32"
      }
    ],
    "name": "PasswordReset",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_age",
        "type": "uint256"
      }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "registeredUsers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "users",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "age",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "hashedPassword",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_email",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_age",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_password",
        "type": "string"
      }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_identifier",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_password",
        "type": "string"
      }
    ],
    "name": "signIn",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_identifier",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_newPassword",
        "type": "string"
      }
    ],
    "name": "resetPassword",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllRegisteredUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
]; // Replace with your contract ABI

// Initialize Web3 and the contract
if (typeof window.ethereum !== "undefined") {
  web3 = new Web3(window.ethereum);
  ethereum.request({ method: "eth_requestAccounts" });
  contract = new web3.eth.Contract(contractABI, contractAddress);
} else {
  alert("Please install MetaMask!");
}

// Register function
async function register() {
  try {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const age = parseInt(document.getElementById("signupAge").value);
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !age || !password) {
      alert("Please enter all required fields.");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    await contract.methods
      .register(name, email, age, password)
      .send({ from: accounts[0] });

    alert("User registered successfully!");
  } catch (error) {
    alert("Failed to register.");
  }
}

// Sign In function (email or name with password)
async function signIn() {
  try {
    const identifier = document.getElementById("signinIdentifier").value; // Can be email or name
    const password = document.getElementById("signinPassword").value;

    if (!identifier || !password) {
      alert("Please enter all required fields.");
      return;
    }
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    await contract.methods
      .signIn(identifier, password)
      .call({ from: accounts[0] });

    alert("Sign in successful!");
  } catch (error) {
    alert("Invalid Name or Password.");
  }
}

// Reset Password function (use email or address)
async function resetPassword() {
  try {
    const identifier = document.getElementById("resetIdentifier").value; // Can be email or address
    const newPassword = document.getElementById("newPassword").value;

    if (!identifier || !newPassword) {
      alert("Please enter all required fields.");
      return;
    }

    // Fetch accounts only if not already connected
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });

    // Send the transaction once, check for connected account and address match
    await contract.methods
      .resetPassword(identifier, newPassword)
      .send({ from: accounts[0] });

    alert("Password reset successfully!");
  } catch (error) {
    console.error("Error resetting password:", error);
    alert("Failed to reset password.");
  }
}
