// SPDX-License-Identifier: MIT
//pragma solidity >=0.4.22 <0.8.0;
//pragma solidity ^0.5.0;
pragma solidity ^0.8.0;

contract SponsorAnimals {
    address[8] public adopters;
    string public name;
    address payable public owner;

    constructor() {
        name = "Zoo Negara";
        owner = payable(msg.sender);
    }

    // Adopting a AnimalId
    function adopt(
        uint AnimalId,
        uint animalFee
    ) public payable returns (uint) {
        require(AnimalId >= 0 && AnimalId <= 7);
        adopters[AnimalId] = msg.sender;

        //Require that there is enough Ether in the transaction
        require(msg.value >= animalFee);

        owner.transfer(msg.value);

        return AnimalId;
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[8] memory) {
        return adopters;
    }
}
