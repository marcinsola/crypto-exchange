//SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract Token {
    string public name = "Solski Token";
    string public symbol = "SLK";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    constructor() {
        totalSupply = 1000000 * (10**18);
        balanceOf[msg.sender] = totalSupply;
    }
}
