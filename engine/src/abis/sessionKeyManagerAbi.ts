export const sessionKeyManagerAbi = [
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "ECDSAInvalidSignatureS",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requested",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "remaining",
        "type": "uint256"
      }
    ],
    "name": "ExceedsMaxValue",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "selector",
        "type": "bytes4"
      }
    ],
    "name": "FunctionNotAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotSessionKeyOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionKeyAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionKeyExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionKeyNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionKeyNotYetValid",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sessionKey",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "validUntil",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxValue",
        "type": "uint256"
      }
    ],
    "name": "SessionKeyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sessionKey",
        "type": "address"
      }
    ],
    "name": "SessionKeyRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sessionKey",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes4",
        "name": "functionSelector",
        "type": "bytes4"
      }
    ],
    "name": "SessionKeyUsed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "validUntil",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxValue",
        "type": "uint256"
      },
      {
        "internalType": "bytes4[]",
        "name": "allowedFunctions",
        "type": "bytes4[]"
      }
    ],
    "name": "createSessionKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "executeWithSessionKey",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      }
    ],
    "name": "getRemainingValue",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      }
    ],
    "name": "getSessionKeyDetails",
    "outputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "validAfter",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "validUntil",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "spentValue",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getSessionKeys",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      }
    ],
    "name": "isSessionKeyValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "ownerSessionKeys",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sessionKeyAddress",
        "type": "address"
      }
    ],
    "name": "revokeSessionKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "sessionKeys",
    "outputs": [
      {
        "internalType": "address",
        "name": "key",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "validAfter",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "validUntil",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "spentValue",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;
