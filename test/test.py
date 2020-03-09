from web3 import Web3, HTTPProvider
from dotenv import find_dotenv, load_dotenv

from smart_contract import ContractAtAddress, SmartContract
from utils.constant import BASE, MAX_VALUE

import os
import time

load_dotenv(find_dotenv())

# web3.py instance: test net
# infura_url = 'https://${rinkeby}.infura.io/v3/${infura_key}'
w3 = Web3(Web3.HTTPProvider('HTTP://127.0.0.1:7545'))


# TODO: get account address
owner_private_key = os.environ.get("OWNER_PRIVATE_KEY")
manager_private_key = os.environ.get("MANAGER_PRIVATE_KEY")
user1_private_key = os.environ.get("USER1_PRIVATE_KEY")
user2_private_key = os.environ.get("USER2_PRIVATE_KEY")

owner_account = w3.eth.account.privateKeyToAccount(owner_private_key).address
manager_account = w3.eth.account.privateKeyToAccount(manager_private_key).address
user1_account = w3.eth.account.privateKeyToAccount(user1_private_key).address
user2_account = w3.eth.account.privateKeyToAccount(user2_private_key).address

usdx_file = 'DSToken.sol'
USDx_args = {
    'symbol': '0x5553447800000000000000000000000000000000000000000000000000000000'
}
USDx = SmartContract(w3, owner_private_key, usdx_file, *USDx_args.values())

print("before coins:", USDx.get('balanceOf', *[owner_account]))
USDx.send(owner_private_key, 'allocateTo', *[owner_account, 10 ** 30])
# and try again
print("after coins:", USDx.get('balanceOf', *[owner_account]))


model_file = 'InterestModel.sol'
model = SmartContract(w3, owner_private_key, model_file)

print('before account is manager: ', model.get('isManager', *[manager_account]))
model.send(owner_private_key, 'setManager', *[manager_account])
print('after account is manager: ', model.get('isManager', *[manager_account]))

print('before interest rate is: ', model.get('getInterestRate'))
# set new interest rate: APR: 7.5%
model.send(manager_private_key, 'setInterestRate', *[1000000002440418608258400030])
print('after interest rate is: ', model.get('getInterestRate'))


# w3.eth.defaultAccount = owner
usr_file = 'USR.sol'
usr_args = {
    'name': 'RRR',
    'symbol': 'RRR',
    'decimals': 18,
    'interestModel': model.contract_address,
    'usdx': USDx.contract_address,
    'originationFee': 10**15,  # 0.3%
    'maxDebtAmount': 10**27,
}
usr = SmartContract(w3, owner_private_key, usr_file, *usr_args.values())
print('USR contract name: ', usr.get('name'))


proxy_file = 'USRProxy.sol'
proxy_args = {
    'implementation': usr.contract_address,
}
proxy = SmartContract(w3, owner_private_key, proxy_file, *proxy_args.values())
print('before proxy contract admin: ', proxy.get('admin'))
logicProxy = ContractAtAddress(w3, proxy.contract_address, usr.abi)
logicProxy.send(manager_private_key, 'initialize', *usr_args.values())
print('call proxy name: ', logicProxy.get(manager_account, 'name'))

# facut USDx to user1
print("before faucet, user1 balance: ", USDx.get('balanceOf', *[user1_account]))
USDx.send(user1_private_key, 'allocateTo', *[user1_account, 1000 * BASE])
print("after faucet, user1 balance: ", USDx.get('balanceOf', *[user1_account]))

print("before approve, allowance is: ", USDx.get('allowance', *[user1_account, proxy.contract_address]))
USDx.send(user1_private_key, 'approve', *[proxy.contract_address, MAX_VALUE])
print("after approve, allowance is: ", USDx.get('allowance', *[user1_account, proxy.contract_address]))

print("you are going to deposit 100 USDx")
logicProxy.send(user1_private_key, 'mint', *[user1_account, 100 * BASE])
print("after deposit, user1 usdx balance: ", USDx.get('balanceOf', *[user1_account]))
print("after deposit, user1 usr balance: ", logicProxy.get(user1_account, 'balanceOf', *[user1_account]))

logicProxy.send(user1_private_key, 'withdraw', *[user1_account, 50 * BASE])
# time.sleep(2)
print("after withdraw, user1 usdx balance: ", USDx.get('balanceOf', *[user1_account]))
usr_remained = logicProxy.get(user1_account, 'balanceOf', *[user1_account])
print("after withdraw, user1 usr balance: ", usr_remained)


# time.sleep(2)
logicProxy.send(user1_private_key, 'burn', *[user1_account, usr_remained])
print("after burn, user1 usdx balance: ", USDx.get('balanceOf', *[user1_account]))
print("after burn, user1 usr balance: ", logicProxy.get(user1_account, 'balanceOf', *[user1_account]))
