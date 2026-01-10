// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleTest {
    uint256 public value = 42;
    
    function getValue() public view returns (uint256) {
        return value;
    }
}
