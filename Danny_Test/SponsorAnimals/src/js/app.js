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

    return App.bindEvents();
  },

  bindEvents: function () {
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
  },

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
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
