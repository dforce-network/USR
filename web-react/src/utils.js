import env from './abi/env';
import moment from 'moment';
import axios from 'axios';

let address_map = env.ADDRESS;
let token_abi = require('./abi/tokensABI.json');
let token_abi_d = require('./abi/tokensABI_d.json');


// *** get balance ***
export const get_balance = async (that) => {
  let my_balance__usdx = await get_my_balance(that.state.contract__usdx, that.state.my_account);
  let my_balance__dusdx__origin = await get_my_balance(that.state.contract__dusdx, that.state.my_account);
  let my_balance__dusdx = await get_my_balance__dusdx(that.state.contract__dusdx, that.state.my_account);
  that.setState({
    my_balance__usdx,
    my_balance__dusdx__origin,
    my_balance__dusdx,
  })
}

// *** utils ***
export const get_nettype = (instance_web3) => {
  return new Promise((resolve, reject) => {
    instance_web3.eth.net.getNetworkType().then(net_type => {
      // console.log(net_type);
      resolve(net_type);
    })
  })
}
export const init_contract = (instance_web3, nettype, token, is_dtoken = false) => {
  return new Promise((resolve, reject) => {
    let contract = new instance_web3.eth.Contract(is_dtoken ? token_abi_d : token_abi, address_map[nettype][token]);
    resolve(contract);
  })
}
export const get_my_account = (instance_web3) => {
  return new Promise((resolve, reject) => {
    instance_web3.givenProvider.enable().then((res_accounts) => {
      if (!res_accounts) { reject('err') };
      // console.log(res_accounts[0]);
      resolve(res_accounts[0]);
    })
  })
}
export const check_approve = (instance_contract, token, my_account, nettype, that_bn) => {
  return new Promise((resolve, reject) => {
    if (!instance_contract) { reject('no contract') }
    instance_contract.methods.allowance(my_account, address_map[nettype][token]).call((err, res_allowance) => {
      resolve(that_bn(res_allowance).gt(that_bn(0)));
    });
  })
}
export const get_my_balance = (contract, account) => {
  return new Promise((resolve, reject) => {
    contract.methods.balanceOf(account).call((err, res_balance) => {
      // console.log(contract, res_balance);
      resolve(res_balance)
    });
  })
}
export const get_my_balance__dusdx = (contract, account) => {
  return new Promise((resolve, reject) => {
    contract.methods.balanceOfUnderlying(account).call((err, res_balance) => {
      // console.log(contract, res_balance);
      resolve(res_balance)
    });
  })
}


// *** change ***
export const mint_change = (that, value, cur_decimals) => {
  var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
  var rega_Z = /[a-z]/g;

  // alert(rega_Z.test(value));
  if (reg.test(value)) {
    return false;
  }
  if (rega_Z.test(value)) {
    return false;
  }

  if (!that.state.is_already) {
    return console.log('not already...');
  }
  if (value.indexOf('.') > 0) {
    var part2 = value.split('.')[1];
    if (part2.length > 6) {
      return console.log('>6');
    }
  }

  that.setState({
    i_mint_max: false,
  })

  var amount_bn;
  var temp_value = value;
  if (temp_value.indexOf('.') > 0) {
    var sub_num = temp_value.length - temp_value.indexOf('.') - 1;
    temp_value = temp_value.substr(0, temp_value.indexOf('.')) + temp_value.substr(value.indexOf('.') + 1);
    amount_bn = that.bn(temp_value).mul(that.bn(10 ** (cur_decimals - sub_num)));
  } else {
    amount_bn = that.bn(value).mul(that.bn(10 ** cur_decimals));
  }

  that.setState({
    value_mint: value,
    value_mint_bn: amount_bn,
    is_btn_disabled_mint: false
  }, () => {
    console.log('send: ', that.state.value_mint_bn.toLocaleString())
    if (amount_bn.gt(that.bn(that.state.my_balance__usdx))) {
      console.log('extends...');
      mint_max(that);
    }
  })
}
export const mint_max = (that) => {
  // console.log(that.state.my_balance_paxg);
  if (!that.state.my_balance__usdx) {
    return console.log('not get my_balance yet');
  }

  if (that.bn(that.state.my_balance__usdx).lte(that.bn(0))) {
    console.log('balance is 0');
    that.setState({
      is_btn_disabled_mint: true
    })
  }

  that.setState({
    i_mint_max: true,
  })

  var amount_bn = that.bn(that.state.my_balance__usdx);

  that.setState({
    value_mint: format_bn(amount_bn, 18, 6),
    value_mint_bn: amount_bn,
  })
}
export const redeem_change = (that, value, cur_decimals) => {
  var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
  var rega_Z = /[a-z]/g;

  // alert(rega_Z.test(value));
  if (reg.test(value)) {
    return false;
  }
  if (rega_Z.test(value)) {
    return false;
  }
  if (!that.state.is_already) {
    return console.log('not already...');
  }
  if (value.indexOf('.') > 0) {
    var part2 = value.split('.')[1];
    if (part2.length > 6) {
      return console.log('>6');
    }
  }

  that.setState({
    i_redeem_max: false,
  })

  var amount_bn;
  var temp_value = value;
  if (temp_value.indexOf('.') > 0) {
    var sub_num = temp_value.length - temp_value.indexOf('.') - 1;
    temp_value = temp_value.substr(0, temp_value.indexOf('.')) + temp_value.substr(value.indexOf('.') + 1);
    amount_bn = that.bn(temp_value).mul(that.bn(10 ** (cur_decimals - sub_num)));
  } else {
    amount_bn = that.bn(value).mul(that.bn(10 ** cur_decimals));
  }

  that.setState({
    value_redeem: value,
    value_redeem_bn: amount_bn,
    is_btn_disabled_redeem: false
  }, () => {
    console.log('redeem: ', that.state.value_redeem_bn.toLocaleString())
    if (amount_bn.gt(that.bn(that.state.my_balance__dusdx))) {
      console.log('extends...');
      redeem_max(that);
    }
  })
}
export const redeem_max = (that) => {
  // console.log(that.state.my_balance_paxg);
  if (!that.state.my_balance__dusdx) {
    return console.log('not get my_balance yet');
  }

  if (that.bn(that.state.my_balance__dusdx).lte(that.bn(0))) {
    console.log('balance is 0');
    that.setState({
      is_btn_disabled_redeem: true
    })
  }

  that.setState({
    i_redeem_max: true,
  })

  var amount_bn = that.bn(that.state.my_balance__dusdx__origin);

  that.setState({
    value_redeem: format_bn(that.state.my_balance__dusdx, 18, 6),
    value_redeem_bn: amount_bn,
  })
}

const updateDataToServer = (source, action, address) => {
  let obj = {
    "sources": source,
    "operation": action,
    "platforms": "usr",
    "address": address
  }

  console.log(JSON.stringify(obj));
  axios.post('https://analytics.dforce.network/update', JSON.stringify(obj))
    .then(res => { console.log(res) })
    .catch(error => { console.log(error) })
}

// *** click ***
export const mint_click = (that) => {
  if (!that.state.value_mint_bn) {
    return console.log('input num...');
  }
  if (Number(that.state.value_mint) === 0) {
    return console.log('num 0');
  }
  console.log(that.state.value_mint_bn.toLocaleString());

  let cur_mint_token = that.state.token_name[that.state.cur_index_mint];

  that.setState({
    is_btn_disabled_mint: true,
    is_approving: false
  })

  // alert(that.state.value_mint_bn.toLocaleString())

  that.state.contract__dusdx.methods.mint(that.state.my_account, that.state.value_mint_bn).estimateGas({
    from: that.state.my_account,
  }, (err, gasLimit) => {
    console.log(gasLimit);
    that.state.contract__dusdx.methods.mint(that.state.my_account, that.state.value_mint_bn).send(
      {
        from: that.state.my_account,
        gas: Math.floor(gasLimit * 1.2)
      }, (reject, res_hash) => {
        if (reject) {
          that.setState({
            is_btn_disabled_mint: false
          })
        }
        if (res_hash) {
          console.log(res_hash);
          i_got_hash(
            that,
            'Deposit',
            cur_mint_token,
            that.state.value_mint_bn.toLocaleString(),
            'd' + cur_mint_token,
            '0',
            res_hash,
            'pendding'
          );
          that.setState({
            is_btn_disabled_mint: false,
            value_mint: '',
          })
          updateDataToServer(that.state.source, 'mint', that.state.my_account);
        }
      }
    )
  })
}
export const redeem_click = (that) => {
  if (!that.state.value_redeem_bn) {
    return console.log('input num...');
  }
  if (Number(that.state.value_redeem) === 0) {
    return console.log('num 0');
  }
  console.log(that.state.value_redeem_bn.toLocaleString());
  let cur_redeem_token = that.state.token_d_name[that.state.cur_index_redeem];

  that.setState({
    is_btn_disabled_redeem: true,
  })

  var to_action = 'redeemUnderlying';
  if (that.state.i_redeem_max) {
    to_action = 'redeem';
  }
  console.log(to_action);

  that.state.contract__dusdx.methods[to_action](that.state.my_account, that.state.value_redeem_bn).estimateGas({
    from: that.state.my_account,
  }, (err, gasLimit) => {
    that.state.contract__dusdx.methods[to_action](
      that.state.my_account, that.state.value_redeem_bn
    ).send(
      {
        from: that.state.my_account,
        gas: Math.floor(gasLimit * 1.2)
      }, (reject, res_hash) => {
        if (reject) {
          that.setState({
            is_btn_disabled_redeem: false,
          })
        }
        if (res_hash) {
          console.log(res_hash);
          i_got_hash(
            that,
            'Withdraw',
            cur_redeem_token,
            that.state.value_redeem_bn.toLocaleString(),
            cur_redeem_token.slice(1),
            '0',
            res_hash,
            'pendding'
          );
          that.setState({
            is_btn_disabled_redeem: false,
            value_redeem: '',
          })
          updateDataToServer(that.state.source, 'redeem', that.state.my_account);
        }
      }
    )
  })
}
export const approve_click = (that) => {
  let cur_mint_token = that.state.token_name[that.state.cur_index_mint];
  let max_num = that.bn(2).pow(that.bn(256)).sub(that.bn(1));

  that.setState({
    is_btn_disabled_mint: true,
    is_approving: true
  })

  that.state.contract__usdx.methods.approve(address_map[that.state.net_type]['d' + cur_mint_token], max_num).estimateGas({
    from: that.state.my_account,
  }, (err, gasLimit) => {
    console.log(gasLimit)
    if (gasLimit) {
      that.state.contract__usdx.methods.approve(address_map[that.state.net_type]['d' + cur_mint_token], max_num).send({
        from: that.state.my_account,
        gas: Math.floor(gasLimit * 1.2)
      }, (rej, res_hash) => {
        if (res_hash) {
          console.log('approveing...');
          if (!that.state.value_mint_bn) {
            that.setState({
              is_approve__usdx: true,
              is_btn_disabled_mint: false,
              is_approving: false
            })
            return false
          }
          setTimeout(() => {
            let timer_trigger = setInterval(() => {
              console.log('i am checking approve_click...');
              that.new_web3.eth.getTransactionReceipt(res_hash, (err, data) => {
                console.log(data);
                if (data && data.status === true) {
                  clearInterval(timer_trigger);
                  console.log('mint_click...');
                  that.setState({
                    is_approve__usdx: true,
                    is_approving: false
                  }, () => {
                    mint_click(that);
                  })
                }
                if (data && data.status === false) {
                  clearInterval(timer_trigger);
                  that.setState({
                    is_approve__usdx: false,
                    is_btn_disabled_mint: false,
                    is_approving: false
                  })
                }
              })
            }, 2000);
          }, 1000)
        }
        if (rej) {
          that.setState({
            is_btn_disabled_mint: false,
            is_approving: false
          })
        }
      })
    }
  })
}


// init metamask wallet
export const init_metamask_wallet = async (that) => {
  let nettype = await get_nettype(that.new_web3);
  if (!(nettype === 'main' || nettype === 'kovan')) {
    return console.log('wrong net work');
  }
  let my_account = await get_my_account(that.new_web3);

  let contract__usdx = await init_contract(that.new_web3, nettype, 'USDx');
  let contract__dusdx = await init_contract(that.new_web3, nettype, 'dUSDx', true);
  let is_approve__usdx = await check_approve(contract__usdx, 'dUSDx', my_account, nettype, that.bn);

  let my_balance__usdx = await get_my_balance(contract__usdx, my_account);
  let my_balance__dusdx__origin = await get_my_balance(contract__dusdx, my_account);
  let my_balance__dusdx = await get_my_balance__dusdx(contract__dusdx, my_account);

  that.setState({
    net_type: nettype,
    my_account,
    contract__usdx,
    contract__dusdx,
    is_approve__usdx,
    my_balance__usdx,
    my_balance__dusdx__origin,
    my_balance__dusdx,
    is_already: true,
    load_new_history: Math.random(),
    show_btn: true,
  }, () => {
    if (window.ethereum && window.ethereum.on) {
      console.log('register accounts-changed event');
      accounts_changed(that);
    }

    window.timer_5s = setInterval(() => {
      get_balance(that);
      get_tokens_status_apy(that);
    }, 1000 * 5);
  })
}

export const accounts_changed = async (that) => {
  window.ethereum.on('accountsChanged', async (accounts) => {
    let my_account = accounts[0];
    that.setState({
      is_already: false,
      my_account: my_account,
      value_mint: '',
      is_btn_disabled_mint: false,
      value_redeem: '',
      is_btn_disabled_redeem: false
    })
    if (window.timer_5s) {
      clearInterval(window.timer_5s);
    }

    let is_approve__usdx = await check_approve(that.state.contract__usdx, 'dUSDx', my_account, that.state.net_type, that.bn);
    let my_balance__usdx = await get_my_balance(that.state.contract__usdx, my_account);
    let my_balance__dusdx__origin = await get_my_balance(that.state.contract__dusdx, my_account);
    let my_balance__dusdx = await get_my_balance__dusdx(that.state.contract__dusdx, my_account);

    that.setState({
      is_already: true,
      load_new_history: Math.random(),
      is_approve__usdx,
      my_balance__usdx,
      my_balance__dusdx__origin,
      my_balance__dusdx,
      show_btn: true,
    }, () => {
      if (window.timer_5s) {
        console.log('clearInterval(window-timer_5s)');
        clearInterval(window.timer_5s)
      }
      window.timer_5s = setInterval(() => {
        console.log('window-timer_5s......');
        get_balance(that);
        get_tokens_status_apy(that);
      }, 1000 * 5);
    })
  })
}

export const set_show_data = (that) => {
  let temp_data = that.state.token_status;
  // console.log(temp_data)
  let date_arr = [];
  for (let i = 0; i < temp_data.date_list.length; i++) {
    date_arr[i] = moment(temp_data.date_list[i] * 1000).format('YYYY/M/DD');
  }

  that.setState({
    options: {
      grid: {
        left: '5%',
        right: '10%',
        // bottom: '10%',
        containLabel: true
      },
      title: {
        text: ''
      },
      tooltip: {
        trigger: 'axis',
        // borderColor: '#ff0000',
        // animation: false,
        formatter: '{b0} APY:<br /> {c0}%'
      },
      legend: {
        data: []
      },
      xAxis: {
        splitLine: {
          show: false
        },
        type: 'category',
        boundaryGap: false,
        data: date_arr
      },
      yAxis: {
        splitLine: {
          show: false
        },
        axisLabel: {
          formatter: '{value} %',
          // padding: [0,0,0,10]
          width: 50
        },
        // offset: -10
        boundaryGap: true
      },
      series: [{
        name: 'APY',
        type: 'line',
        data: temp_data.apy_list,
        color: '#675CFF',
        smooth: true
      }],
      toolbox: {
        show: true
      }
    }
  })
}

export const get_tokens_status_apy = (that) => {
  let url_apy = env.URL_getBanlanceInfo;

  fetch(url_apy).then(res => res.text())
    .then((data) => {
      if (!(data && Object.keys(data).length > 0)) {
        return console.log('no data return...');
      }

      data = JSON.parse(data);
      // console.log(data)

      that.setState({
        token_apy: data.apy,
        total_underlying: data.total_underlying,
        token_status: data,
        token_status_is_ready: true,
      }, () => {
        set_show_data(that);
      })
    })
    .catch(err => {
      console.log(err)
    })
}

export const format_bn = (numStr, decimals, decimalPlace = decimals) => {
  numStr = numStr.toLocaleString().replace(/,/g, '');
  // decimals = decimals.toString();

  // var str = (10 ** decimals).toLocaleString().replace(/,/g, '').slice(1);
  var str = Number(`1e+${decimals}`).toLocaleString().replace(/,/g, '').slice(1);

  var res = (numStr.length > decimals ?
    numStr.slice(0, numStr.length - decimals) + '.' + numStr.slice(numStr.length - decimals) :
    '0.' + str.slice(0, str.length - numStr.length) + numStr).replace(/(0+)$/g, "");

  res = res.slice(-1) === '.' ? res + '00' : res;

  if (decimalPlace === 0)
    return res.slice(0, res.indexOf('.'));

  var length = res.indexOf('.') + 1 + decimalPlace;
  return res.slice(0, length >= res.length ? res.length : length);
  // return res.slice(-1) == '.' ? res + '00' : res;
}

export const i_got_hash = (that, action, send_token, send_amount, recive_token, recive_amount, hash, status) => {
  let timestamp = new Date().getTime();
  if (window.localStorage) {
    let key = that.state.my_account + '-' + that.state.net_type;
    let historyData = JSON.parse(window.localStorage.getItem(key)) || [];
    historyData.push({
      action: action,
      account: that.state.my_account,
      net_type: that.state.net_type,
      send_token: send_token,
      send_amount: send_amount,
      recive_token: recive_token,
      recive_amount: recive_amount,
      hash: hash,
      timestamp: timestamp,
      status: status
    });
    window.localStorage.setItem(key, JSON.stringify(historyData));
    console.log('got hash && setItem.');

    that.setState({ load_new_history: Math.random() });
  }
}

export const format_num_to_K = (str_num) => {
  var part_a = str_num.split('.')[0];
  var part_b = str_num.split('.')[1];

  var reg = /\d{1,3}(?=(\d{3})+$)/g;
  part_a = (part_a + '').replace(reg, '$&,');

  return part_a + '.' + part_b;
}

