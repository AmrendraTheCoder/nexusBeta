// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChimeraDelegate
 * @notice Batch execution contract for executing multiple actions in a single transaction
 * @dev Used by the D8N Engine to execute workflows with multiple steps atomically
 */
contract ChimeraDelegate {
    /// @notice Action structure for batch execution
    struct Action {
        address to;      // Target contract address
        uint256 value;   // ETH value to send
        bytes data;      // Calldata for the function call
    }

    /// @notice Event emitted when a batch is executed
    event BatchExecuted(address indexed executor, uint256 actionCount);

    /// @notice Event emitted for each action in the batch
    event ActionExecuted(address indexed to, uint256 value, bool success);

    /**
     * @notice Execute multiple actions in a single transaction
     * @param actions Array of actions to execute
     * @dev All actions must succeed or the entire transaction reverts
     */
    function executeBatch(Action[] calldata actions) external payable {
        require(actions.length > 0, "ChimeraDelegate: No actions provided");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < actions.length; i++) {
            totalValue += actions[i].value;
        }
        require(msg.value >= totalValue, "ChimeraDelegate: Insufficient ETH sent");

        // Execute each action
        for (uint256 i = 0; i < actions.length; i++) {
            Action calldata action = actions[i];
            
            (bool success, bytes memory returnData) = action.to.call{value: action.value}(action.data);
            
            if (!success) {
                // If the call failed, revert with the error message
                if (returnData.length > 0) {
                    assembly {
                        let returnDataSize := mload(returnData)
                        revert(add(32, returnData), returnDataSize)
                    }
                } else {
                    revert("ChimeraDelegate: Action failed");
                }
            }

            emit ActionExecuted(action.to, action.value, success);
        }

        emit BatchExecuted(msg.sender, actions.length);

        // Refund excess ETH
        if (msg.value > totalValue) {
            (bool refunded, ) = msg.sender.call{value: msg.value - totalValue}("");
            require(refunded, "ChimeraDelegate: Refund failed");
        }
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}

    /**
     * @notice Fallback function
     */
    fallback() external payable {}
}
