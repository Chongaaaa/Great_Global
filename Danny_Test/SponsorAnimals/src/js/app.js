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
    $(document).on("click", "#addAdminBtn", App.handleAddAdmin);
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

    // Payment Module
    $(document).on("click", "#pAddAdminBtn", App.handlePAddAdmin);
    $(document).on("click", "#registerCustomerBtn", App.handlePRegisterCustomer);
    $(document).on("click", "#approveInsuranceBtn", App.handlePApproveInsurance);
    $(document).on("click", "#manualPayBtn", App.handleManualPayment);
    $(document).on("click", "#addBalanceBtn", App.handleAddBalance);
    $(document).on("click", "#updateAutoPayBtn", App.handleUpdateAutoPay);
    $(document).on("click", "#updatePayDateBtn", App.handleUpdatePayDate);
  },

  // Claim Module
  handleAddAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#adminAddress").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.addAdmin(adminAddress, { from: account });
        alert("Admin added successfully.");
      } catch (err) {
        console.error(err.message);
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
      const [claimIds, claimAmount] = await instance.getUnprocessedClaims(userAddress, {
        from: web3.eth.accounts[0],
      });

      // Clear the div before adding new content
      $("#unprocessedClaims").html("");

      if (claimIds.length === 0) {
        $("#unprocessedClaims").append(`<p>No unprocessed claims found.</p>`);
      } else {
        for (let i = 0; i < claimIds.length; i++) {
          $("#unprocessedClaims").append(
            `<p>Claim ID: ${claimIds[i]} - Claim Amount: ${claimAmount[i] / 1e18} ETH</p>`
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
      const [userAddresses, claimIds, claimAmount] = await instance.getAllUnprocessedClaims({
        from: web3.eth.accounts[0],
      });

      // Clear the div before adding new content
      $("#allUnprocessedClaims").html("");

      if (userAddresses.length === 0) {
        $("#allUnprocessedClaims").append(`<p>No unprocessed claims found.</p>`);
      } else {
        for (let i = 0; i < userAddresses.length; i++) {
          $("#allUnprocessedClaims").append(
            `<p>User: ${userAddresses[i]} - Claim ID: ${claimIds[i]} - Claim Amount: ${claimAmount[i] / 1e18} ETH</p>`
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
    const age = $("#signupAge").val();
    const password = $("#signupPassword").val();
    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.register(name, email, age, password, { from: account });
        alert("User added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleSignin: async function (event) {
    event.preventDefault();

    try {
      console.log(Web3.version);
      const identifier = document.getElementById("signinIdentifier").value; // Can be email or name
      const password = document.getElementById("signinPassword").value;

      if (!identifier || !password) {
        alert("Please enter all required fields.");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      await contract.methods
        .signIn(identifier, password)
        .call({ from: accounts[0] });

      alert("Sign in successful!");
    } catch (error) {
      alert("Invalid Name or Password.");
    }
  },

  handleReset: async function (event) {
    event.preventDefault();

    try {
      const identifier = document.getElementById("resetIdentifier").value; // Can be email or address
      const newPassword = document.getElementById("newPassword").value;

      if (!identifier || !newPassword) {
        alert("Please enter all required fields.");
        return;
      }

      // Fetch accounts only if not already connected
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Send the transaction once, check for connected account and address match
      await contract.methods
        .resetPassword(identifier, newPassword)
        .send({ from: accounts[0] });

      alert("Password reset successfully!");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password.");
    }
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
        alert("Admin added successfully.");
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

  handlePApproveInsurance: async function (event) {
    event.preventDefault();

    const insuranceID = $("#pIinsuranceID").val();
    const payAmount = $("#pPayAmount").val();
    const payDate = $("#pPayDate").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.approveInsurance(account, insuranceID, payAmount, payDate, { from: account });
        alert("Insurance approved successfully.");
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
  },

  handleAddBalance: async function (event) {
    event.preventDefault();

    const amount = $("#addBalanceInput").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.addBalance({ from: account, value: amount * 1e18 });
        alert("Balance added successfully.");
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
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
