from web3.providers.eth_tester import EthereumTesterProvider
import os

from web3 import Web3, HTTPProvider
from dotenv import find_dotenv, load_dotenv

from smart_contract import SmartContract

load_dotenv(find_dotenv())
# web3.py instance: local net
w3 = Web3(EthereumTesterProvider())
# web3.py instance: test net
# net = 'rinkeby'
# infura_key = 'xxxx'
# infura_url = 'https://${rinkeby}.infura.io/v3/${infura_key}'
# w3 = Web3(Web3.HTTPProvider(infura_url))

# set pre-funded account as sender
owner = w3.eth.accounts[0]
manager = w3.eth.accounts[1]
user1 = w3.eth.accounts[2]
user2 = w3.eth.accounts[3]


usdx_file = 'DSToken.sol'
USDx_args = {
    'symbol': '0x5553447800000000000000000000000000000000000000000000000000000000'
}
USDx = SmartContract(w3, usdx_file, *USDx_args.values())
USDx.deploy_contract()

print("before coins:", USDx.contract.functions.balanceOf(owner).call())
# mint coins
tx_hash = USDx.contract.functions.allocateTo(owner, 10**30).transact()
# now wait for transaction to go through
tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
# and try again
print("after coins:", USDx.contract.functions.balanceOf(owner).call())


model_file = 'InterestModel.sol'
model = SmartContract(w3, model_file)
model.deploy_contract()

print('before account is manager: ', model.contract.functions.isManager(manager).call())
new_manager = model.contract.functions.setManager(manager).transact()
print('after account is manager: ', model.contract.functions.isManager(manager).call())

print('before interest rate is: ',
      model.contract.functions.getInterestRate().call())
w3.eth.defaultAccount = manager
# set new interest rate: APR: 8%
tx_hash = model.contract.functions.setInterestRate(
    1000000002440418608258400030).transact()
tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
print('after interest rate is: ',
      model.contract.functions.getInterestRate().call())


usr_file = 'USR.sol'
usdx_args = {
    'name': 'RRR',
    'symbol': 'RRR',
    'decimals': 18,
    'interestModel': model.contract_address,
    'usdx': USDx.contract_address,
    'originationFee': 10**15,  # 0.3%
    'maxDebtAmount': 10**9,
}
usr = SmartContract(w3, usr_file, *usdx_args.values())
usr.deploy_contract()
print('deploy USR: ', usr.contract.name().call())
