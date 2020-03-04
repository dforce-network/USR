import sys
import os
import time
import pprint

from solc import compile_standard


class SmartContract:
    # TODO:
    def __init__(self, w3, file_name, *args):
        self.w3 = w3
        self.file_name = file_name
        self.args = args

    def deploy_contract(self):
        contract_name = self.file_name.split('.')[0]
        base_dir = os.getcwd() + '/contracts/'
        actual_path = base_dir + self.file_name

        # compiled source code
        compiled_sol = compile_standard({
            "language": "Solidity",
            "sources": {
                self.file_name: {
                        "urls": [actual_path]
                }
            },
            "settings":
            {
                "outputSelection": {
                    "*": {
                        "*": [
                            "abi", "evm.bytecode", "evm.deployedBytecode"
                        ]
                    }
                }
            },
        }, allow_paths=base_dir)

        abi = compiled_sol['contracts'][self.file_name][contract_name]['abi']
        bytecode = compiled_sol['contracts'][self.file_name][contract_name]['evm']['bytecode']['object']

        # instantiate and deploy contract to blockchain
        deployed_contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        # submit the transaction to deploy the contract
        tx_hash = deployed_contract.constructor(
            *self.args).transact({'gas': 600000})

        # get tx receipt to get contract address
        tx_receipt = self.w3.eth.waitForTransactionReceipt(tx_hash)
        self.contract_address = tx_receipt['contractAddress']
        print(contract_name, " Contract Deployed At:", self.contract_address)

        # create the contract instance with the newly deployed address
        self.contract = self.w3.eth.contract(
            address=self.contract_address, abi=abi)

        # return contract


if __name__ == '__main__':
    from web3.providers.eth_tester import EthereumTesterProvider
    from web3 import Web3

    w3 = Web3(EthereumTesterProvider())
    contract_source_path = 'DSToken.sol'
    args = {
        'symbol': '0x5553447800000000000000000000000000000000000000000000000000000000'
    }

    USDx = SmartContract(w3, contract_source_path, *args.values())
    USDx.deploy_contract()

    symbol = USDx.contract.functions.symbol().call()
    print("token symbol is: ", symbol)
