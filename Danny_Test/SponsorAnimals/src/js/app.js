App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("ClaimProcessing.json", function (data) {
      var ClaimProcessingArtifact = data;
      App.contracts.ClaimProcessing = TruffleContract(ClaimProcessingArtifact);
      App.contracts.ClaimProcessing.setProvider(App.web3Provider);
    });

    $.getJSON("UserAuth.json", function (data) {
      var UserAuthArtifact = data;
      App.contracts.UserAuth = TruffleContract(UserAuthArtifact);
      App.contracts.UserAuth.setProvider(App.web3Provider);
    });

    $.getJSON("PaymentModule.json", function (data) {
      var PaymentModuleArtifact = data;
      App.contracts.PaymentModule = TruffleContract(PaymentModuleArtifact);
      App.contracts.PaymentModule.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    // Claims Module
    $(document).on("click", "#addUserBtn", App.handleAddUser);
    $(document).on("click", "#addClaimBtn", App.handleAddClaim);
    $(document).on("click", "#approveClaimBtn", App.handleApproveClaim);
    $(document).on("click", "#rejectClaimBtn", App.handleRejectClaim);
    $(document).on(
      "click",
      "#viewUnprocessedClaimsBtn",
      App.handleViewUnprocessedClaims
    );
    $(document).on(
      "click",
      "#viewAllUnprocessedClaimsBtn",
      App.handleViewAllUnprocessedClaims
    );
    $(document).on("click", "#sendFundsBtn", App.handleSendFunds);

    // User Module
    $(document).on("click", "#registerBtn", App.handleRegister);
    $(document).on("click", "#signinBtn", App.handleSignin);
    $(document).on("click", "#resetpwBtn", App.handleReset);
    $(document).on("click", "#addAdminBtn", App.handleAddAdmin);
    $(document).on("click", "#removeAdminBtn", App.handleRemoveAdmin);

    // Payment Module
    $(document).on("click", "#pAddAdminBtn", App.handlePAddAdmin);
    $(document).on("click", "#updatePayDateBtn", App.handleUpdatePayDate);
    $(document).on("click", "#approveInsuranceBtn", App.handlePApproveInsurance);
    $(document).on("click", "#registerCustomerBtn", App.handlePRegisterCustomer);
    $(document).on("click", "#addBalanceBtn", App.handleAddBalance);
    $(document).on("click", "#getCustomerBalanceBtn", App.handleGetCustomerBalance);
    $(document).on("click", "#updateAutoPayBtn", App.handleUpdateAutoPay);
    $(document).on("click", "#cancelInsuranceBtn", App.handleCancelInsurance);
    $(document).on("click", "#manualPayBtn", App.handleManualPayment);
  },

  // Admin Management
  handleAddAdmin: async function (event) {
    event.preventDefault();
  
    const adminAddress = $("#assignAdminAddress").val();

    // Simple Validation Rules
    if (!adminAddress || adminAddress.trim() === "") {
      alert("Please enter your address.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();
  
    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];
  
      try {
        await instance.assignAdmin(adminAddress,{from: account });
        alert("Admin added successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to add admin.");
      }
    });
  },

  handleRemoveAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#removeAdminAddress").val();

    // Simple Validation Rules
    if (!adminAddress || adminAddress.trim() === "") {
      alert("Please enter your address.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.removeAdmin(adminAddress, { from: account });
        alert("Admin removed successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to remove admin.");
      }
    });
  },

  handleAddUser: async function (event) {
    event.preventDefault();

    const userAddress = $("#addUserAddress").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.addUser(userAddress, { from: account });
        alert("User added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleAddClaim: async function (event) {
    event.preventDefault();

    const claimAmount = $("#claimAmount").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.addClaim(claimAmount * 1e18, {
          from: account,
        });
        alert("Claim added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleApproveClaim: async function (event) {
    event.preventDefault();

    const userAddress = $("#approveUserAddress").val();
    const claimId = $("#claimId").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.approveClaim(userAddress, claimId, true, {
          from: account,
        });
        alert("Claim approved.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleRejectClaim: async function (event) {
    event.preventDefault();

    const userAddress = $("#userAddress").val();
    const claimId = $("#claimId").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.approveClaim(userAddress, claimId, false, {
          from: account,
        });
        alert("Claim rejected.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleViewUnprocessedClaims: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.ClaimProcessing.deployed();

    try {
      console.log(Web3.version);
      const userAddress = $("#viewClaimsUserAddress").val();
      const [claimIds, claimAmount] = await instance.getUnprocessedClaims(
        userAddress,
        {
          from: web3.eth.accounts[0],
        }
      );

      // Clear the div before adding new content
      $("#unprocessedClaims").html("");

      if (claimIds.length === 0) {
        $("#unprocessedClaims").append(`<p>No unprocessed claims found.</p>`);
      } else {
        for (let i = 0; i < claimIds.length; i++) {
          $("#unprocessedClaims").append(
            `<p>Claim ID: ${claimIds[i]} - Claim Amount: ${
              claimAmount[i] / 1e18
            } ETH</p>`
          );
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  },

  handleViewAllUnprocessedClaims: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.ClaimProcessing.deployed();

    try {
      console.log(Web3.version);
      const [userAddresses, claimIds, claimAmount] =
        await instance.getAllUnprocessedClaims({
          from: web3.eth.accounts[0],
        });

      // Clear the div before adding new content
      $("#allUnprocessedClaims").html("");

      if (userAddresses.length === 0) {
        $("#allUnprocessedClaims").append(
          `<p>No unprocessed claims found.</p>`
        );
      } else {
        for (let i = 0; i < userAddresses.length; i++) {
          $("#allUnprocessedClaims").append(
            `<p>User: ${userAddresses[i]} - Claim ID: ${
              claimIds[i]
            } - Claim Amount: ${claimAmount[i] / 1e18} ETH</p>`
          );
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  },

  handleSendFunds: async function (event) {
    event.preventDefault();

    const fundAmount = $("#fundAmount").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        var amountInWei = fundAmount * 1e18;
        await instance.fund({
          from: account,
          value: amountInWei,
        });
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  // User Module

  handleRegister: async function (event) {
    event.preventDefault();

    const name = $("#signupName").val();
    const email = $("#signupEmail").val();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const age = $("#signupAge").val();
    const password = $("#signupPassword").val();

    // Simple Validation Rules
    if (!name || name.trim() === "") {
      alert("Please enter your name.");
      return;
    }

    if (!email || email.trim() === "") {
      alert("Please enter your email.");
      return;
    }

    // Basic email validation pattern
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address. (e.g., example@domain.com)");
      return;
    }

    if (!age || isNaN(age)) {
      alert("Please enter a valid age.");
      return;
    }
    if (age < 18) {
      alert("You must be at least 18 years old to register.");
      return;
    }

    if (!password || password.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.register(name, email, age, password, { from: account });
        alert("User registered successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Failed to Register.");
      }
    });
  },

  handleSignin: async function (event) {
    event.preventDefault();

    const identifier = $("#signinIdentifier").val(); // Can be email or name
    const password = $("#signinPassword").val();

    // Validate the identifier (basic check)
    if (!identifier || identifier.trim() === "") {
      alert("Please enter your name or email.");
      return;
    }

    if (!password || password.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.signIn(identifier, password, { from: account });
        alert("Sign In successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Invalid Name or Password.");
      }
    });
  },

  handleReset: async function (event) {
    event.preventDefault();

    const identifier = $("#resetIdentifier").val(); // Can be email or address
    const newPassword = $("#newPassword").val();

    // Validate the identifier (basic check)
    if (!identifier || identifier.trim() === "") {
      alert("Please enter your name or email.");
      return;
    }

    if (!newPassword || newPassword.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.resetPassword(identifier, newPassword, {
          from: account,
        });
        alert("Password reset successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Failed to reset password.");
      }
    });
  },

  // Payment Module

  handlePAddAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#pAdminAddress").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.addAdmin(adminAddress, { from: account });
        console.log(account);
        alert("Admin added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleUpdatePayDate: async function (event) {
    event.preventDefault();

    const customerAddress = $("#payDateCustomerAddress").val();
    const insuranceSubscriptionID = $("#payDateInsuranceID").val();
    const newPayDate = $("#newPayDate").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.updatePayDate(customerAddress, insuranceSubscriptionID, newPayDate, { from: account });
        alert("Pay date updated successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handlePApproveInsurance: async function (event) {
    event.preventDefault();

    const customerAddress = $("#approveInsuranceCustomerAddress").val();
    const insuranceID = $("#pInsuranceID").val();
    const payAmount = Math.max(0, parseInt($("#pPayAmount").val(), 10));
    const payDate = Math.floor(new Date($("#pPayDate").val()).getTime() / 1000); // Convert to seconds
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        // Call with correct arguments
        await instance.approveInsurance(customerAddress, insuranceID, payAmount, payDate, { from: account });
        alert("Insurance approved successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handlePRegisterCustomer: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.registerCustomer({ from: account });
        alert("Customer registered successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleAddBalance: async function (event) {
    event.preventDefault();

    const amount = $("#addBalanceInput").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.addBalance({ from: account, value: amount });
        alert("Balance added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleGetCustomerBalance: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        const balance = await instance.getCustomerBalance({ from: account });
        const displayBalance = balance && balance.toString() !== "0" ? balance.toString() : "0";
        $("#customerBalanceDisplay").text(`Your balance is: ${displayBalance} ETH`);
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleUpdateAutoPay: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#autoPayInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.updateAutoPay(insuranceSubscriptionID, { from: account });
        alert("AutoPay status updated successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleCancelInsurance: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#cancelInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.cancelInsurance(insuranceSubscriptionID, { from: account });
        alert("Insurance subscription cancelled successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleManualPayment: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#manualPayInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.manualPay(insuranceSubscriptionID, { from: account, value: $("#payAmountInput").val() * 1e18 });
        alert("Manual payment completed successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  }
  
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
