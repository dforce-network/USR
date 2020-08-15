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

    def get_contract_interface(self):
        self.contract_name = self.file_name.split('.')[0]
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

        self.abi = compiled_sol['contracts'][self.file_name][self.contract_name]['abi']
        bytecode = compiled_sol['contracts'][self.file_name][self.contract_name]['evm']['bytecode']['object']

        return self.abi, bytecode

    def initialize_contract(self, address, abi):
        # create the contract instance with the newly deployed address
        self.contract = self.w3.eth.contract(
            address=address, abi=abi)

        return self.contract

    def deploy_contract(self):
        abi, bytecode = self.get_contract_interface()
        contract_ = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        acct = self.w3.eth.account.privateKeyToAccount(
            '0x5571743c612dbe11fb0b7f1f21e8cbd26baef7b9593dc9596db30a76ada6d3dd')

        construct_txn = contract_.constructor(*self.args).buildTransaction({
            'from': acct.address,
            'nonce': self.w3.eth.getTransactionCount(acct.address),
            'gas': 6000000,
            'gasPrice': self.w3.toWei('21', 'gwei')
        })

        signed = acct.signTransaction(construct_txn)

        tx_hash = self.w3.eth.sendRawTransaction(signed.rawTransaction)

        # get tx receipt to get contract address
        tx_receipt = self.w3.eth.waitForTransactionReceipt(tx_hash)
        self.contract_address = tx_receipt['contractAddress']
        print(self.contract_name, " Contract Deployed At:", self.contract_address)

        self.initialize_contract(self.contract_address, abi)


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
