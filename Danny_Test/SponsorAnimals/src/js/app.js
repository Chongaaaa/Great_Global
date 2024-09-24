App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load animals.
    $.getJSON("../Animals.json", function (data) {
      var animalsRow = $("#animalsRow");
      var animalsTemplate = $("#animalsTemplate");

      for (i = 0; i < data.length; i++) {
        animalsTemplate.find(".panel-title").text(data[i].name);
        animalsTemplate.find("img").attr("src", data[i].picture);
        animalsTemplate.find(".animals-id").text(data[i].id);
        animalsTemplate.find(".animals-name").text(data[i].name);
        animalsTemplate.find(".animals-age").text(data[i].age);
        animalsTemplate.find(".animals-fee").text(data[i].fee);
        animalsTemplate.find(".animals-location").text(data[i].location);
        animalsTemplate.find(".btn-adopt").attr("data-id", data[i].id);

        animalsRow.append(animalsTemplate.html());
      }
    });

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
    $.getJSON("SponsorAnimals.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted animals
      return App.markAdopted();
    });

    $.getJSON("ClaimProcessing.json", function (data) {
      var ClaimProcessingArtifact = data;
      App.contracts.ClaimProcessing = TruffleContract(ClaimProcessingArtifact);
      App.contracts.ClaimProcessing.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleAdopt);

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
    $(document).on("click", "#sendFundsBtn", App.handleSendFunds);
  },

  markAdopted: function () {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function (instance) {
        adoptionInstance = instance;

        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        for (i = 0; i < adopters.length; i++) {
          if (adopters[i] !== "0x0000000000000000000000000000000000000000") {
            $(".panel-animals")
              .eq(i)
              .find("button")
              .text("Success")
              .attr("disabled", true);
            // $('.panel-pet').eq(i).find('.btn-address').text(adopters[i]);
            $(".panel-animals")
              .eq(i)
              .find(".sponsor-address")
              .text(adopters[i]);
          }
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var animalId = parseInt($(event.target).data("id"));
    var animalFee = parseInt($(event.target).data("fee"));
    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;

          // Execute adopt as a transaction by sending account
          return adoptionInstance.adopt(animalId, animalFee, {
            from: account,
            value: 5000000000000000000n,
          });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
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

    const userAddress = $("#userAddress").val();
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

    const userAddress = $("#userAddress").val();
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
      const [userAddresses, claimIds] = await instance.getAllUnprocessedClaims({
        from: web3.eth.accounts[0],
      });

      // Clear the div before adding new content
      $("#allUnprocessedClaims").html("");

      for (let i = 0; i < userAddresses.length; i++) {
        $("#allUnprocessedClaims").append(
          `<p>User: ${userAddresses[i]} - Claim ID: ${claimIds[i]}</p>`
        );
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
