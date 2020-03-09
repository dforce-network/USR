from solc import compile_standard
from dotenv import find_dotenv, load_dotenv
from typing import Any, Tuple
from web3.middleware import geth_poa_middleware
from utils.constant import chain_id

import sys
import os
import time
# import pprint


load_dotenv(find_dotenv())

class ContractAtAddress(object):
    def __init__(self, w3, address, abi):
        self.w3 = w3
        self.contract = self.w3.eth.contract(address=address, abi=abi)

    def get(self, from_account, function_name, *function_args):
        function_method = self.contract.get_function_by_name(function_name)
        return function_method(*function_args).call({'from': from_account})

    def send(self, private_key, function_name, *function_args):
        from_account = self.w3.eth.account.privateKeyToAccount(private_key).address
        function_method = self.contract.get_function_by_name(function_name)
        tx_data = function_method(*function_args).buildTransaction({
            'chainId': chain_id,
            'from': from_account,
            'nonce': self.w3.eth.getTransactionCount(from_account),
            'gas': 6000000,
            'gasPrice': self.w3.toWei('10', 'gwei'),
        })

        signed = self.w3.eth.account.signTransaction(
            tx_data, private_key=private_key)
        tx_hash = self.w3.eth.sendRawTransaction(signed.rawTransaction)
        tx_receipt = self.w3.eth.waitForTransactionReceipt(tx_hash)
        time.sleep(1)


class SmartContract(object):
    # TODO:
    def __init__(self, w3, owner_private_key, file_name, *args):
        self.w3 = w3
        # TODO:
        # self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.file_name = file_name
        self.args = args
        # self.private_key = owner_private_key
        # acct = self.w3.eth.account.privateKeyToAccount(self.private_key)
        # self.account = acct.address
        # print("chain id ", self.w3.eth.chainId)
        self.deploy_contract(owner_private_key)

    def get_contract_interface(self) -> Tuple[str, str]:
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
        # print("self.contract type is ", type(self.contract))
        return self.contract

    def get(self, function_name, *function_args):
        function_method = self.contract.get_function_by_name(function_name)
        return function_method(*function_args).call()

    def send(self, private_key, function_name, *function_args):
        from_account = self.w3.eth.account.privateKeyToAccount(private_key).address
        function_method = self.contract.get_function_by_name(function_name)
        tx_data = function_method(*function_args).buildTransaction({
            'chainId': chain_id,
            'from': from_account,
            'nonce': self.w3.eth.getTransactionCount(from_account),
            'gas': 6000000,
            'gasPrice': self.w3.toWei('10', 'gwei'),
        })

        signed = self.w3.eth.account.signTransaction(
            tx_data, private_key=private_key)
        tx_hash = self.w3.eth.sendRawTransaction(signed.rawTransaction)
        tx_receipt = self.w3.eth.waitForTransactionReceipt(tx_hash)
        time.sleep(1)

    def deploy_contract(self, owner_private_key):
        abi, bytecode = self.get_contract_interface()
        contract_ = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        acct = self.w3.eth.account.privateKeyToAccount(owner_private_key)

        construct_txn = contract_.constructor(*self.args).buildTransaction({
            'chainId': chain_id,
            'from': acct.address,
            'nonce': self.w3.eth.getTransactionCount(acct.address),
            'gas': 6000000,
            'gasPrice': self.w3.toWei('10', 'gwei')
        })

        # signed = acct.signTransaction(construct_txn)
        signed = self.w3.eth.account.signTransaction(
            construct_txn, private_key=owner_private_key)

        tx_hash = self.w3.eth.sendRawTransaction(signed.rawTransaction)

        # get tx receipt to get contract address
        tx_receipt = self.w3.eth.waitForTransactionReceipt(tx_hash)
        self.contract_address = tx_receipt['contractAddress']
        print(self.contract_name, " Contract Deployed At:", self.contract_address)

        self.initialize_contract(self.contract_address, abi)

# TODO:
# if __name__ == '__main__':
#     from web3.providers.eth_tester import EthereumTesterProvider
#     from web3 import Web3

#     w3 = Web3(EthereumTesterProvider())
#     contract_source_path = 'DSToken.sol'
#     args = {
#         'symbol': '0x5553447800000000000000000000000000000000000000000000000000000000'
#     }

#     USDx = SmartContract(w3, contract_source_path, *args.values())
#     USDx.deploy_contract()

#     symbol = USDx.contract.functions.symbol().call()
#     print("token symbol is: ", symbol)
