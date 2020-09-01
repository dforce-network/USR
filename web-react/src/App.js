import React from 'react';
import Web3 from 'web3';
import { Menu, Dropdown, Tabs, Input, Button, Modal } from 'antd';
import History from './component/history';
import ReactEcharts from 'echarts-for-react';
// add i18n.
import { IntlProvider, FormattedMessage } from 'react-intl';
import en_US from './language/en_US.js';
import zh_CN from './language/zh_CN';

import './style/App.scss';
import './style/header.scss';
import './style/main-content.scss';
import 'antd/dist/antd.css';
import tips from './style/tips.scss';

import USDx_logo from './images/USDx.svg';
import logo_xswap from './images/logo-dforce.svg';
import close from './images/close.svg';
import close_new from './images/close-new.svg';
import Twitter from './images/twitter.svg';
import Telegram from './images/telegram.svg';
import Medium from './images/medium.svg';
import Reddit from './images/Reddit.svg';
import Discord from './images/Discord.svg';
import LinkedIn from './images/LinkedIn.svg';
import Youtube from './images/Youtube.svg';
import erweima from './images/erweima.png';
import weixin from './images/weixin.svg';
import arrow_u from './images/up.svg';
import arrow_d from './images/arrow_d.svg';
import no_history from './images/no-history.svg';
import no_support from './images/no_support.svg';

import {
  get_nettype,
  mint_change,
  mint_click,
  get_tokens_status_apy,
  format_bn,
  format_num_to_K,
  redeem_change,
  redeem_click,
  mint_max,
  redeem_max,
  init_metamask_wallet,
  accounts_changed,
  approve_click
} from './utils.js';

const { TabPane } = Tabs;


export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      token_name: ['USDx'],
      token_d_name: ['dUSDx'],
      token_d_balance__prev: [0],
      token_logo: [USDx_logo],
      token_decimals: [],
      token_contract: [],
      token_d_contract: [],
      token_is_approve: [],
      token_balance: [],
      token_d_balance: [],
      token_BaseData: [],
      cur_index_mint: 0,
      cur_index_redeem: 0,
      cur_show_data_index: 0,
      token_status: [],
      options: {},
      cur_language: navigator.language.toLowerCase() === 'zh-cn' ? '中文' : 'English',
      showonly: false,
      meun1: true,
      meun2: true,
      meun3: true,
      source: this.handleUrl(),
    }

    this.new_web3 = window.new_web3 = new Web3(Web3.givenProvider || null);
    this.bn = this.new_web3.utils.toBN;
  }


  handleUrl = () => {
    const wallet_list = ['imtoken', 'bitpie', 'mykey', 'dapppocket', 'blocto', 'huobiwallet', 'abcwallet', 'tokenpocket', 'dappbirds', 'mathwallet', 'meetone'];
    let t_url = window.location.href;
    let arr_url = t_url.split('/');
    let source;

    for (let i = 0; i < arr_url.length; i++) {
      if (arr_url[i].toLowerCase().includes('utm_source=')) {
        for (let j = 0; j < wallet_list.length; j++) {
          if (arr_url[i].toLowerCase().includes(wallet_list[j])) {
            return source = wallet_list[j];
          }
        }
      }
    }

    return source = 'web';
  }


  componentDidMount = async () => {
    if (!Web3.givenProvider) {
      return console.log('no web3 provider');
    }

    init_metamask_wallet(this);

    let nettype = await get_nettype(this.new_web3);
    this.setState({
      net_type: nettype,
    }, () => {
      get_tokens_status_apy(this);
    })

    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
      window.ethereum.on("chainChanged", (_chainId) => {
        if (window.sessionStorage.getItem("chainId") !== _chainId) {
          window.sessionStorage.setItem("chainId", _chainId);
          window.location.reload();
        }
      });
    }
  }


  empty_state = (activeKey) => {
    console.log(activeKey)

    this.setState({
      value_mint: '',
      mint_to_receive_bn: '',
      is_btn_disabled_mint: false,
      value_redeem: '',
      redeem_to_receive_bn: '',
      is_btn_disabled_redeem: false
    })
  }




  render() {
    return (
      <IntlProvider locale={'en'} messages={this.state.cur_language === '中文' ? zh_CN : en_US} >
        {/* overlay */}
        <Modal
          visible={this.state.show_overlay}
          onCancel={() => { this.setState({ show_overlay: false }) }}
          footer={false}
        >
          <ReactEcharts option={this.state.options} />
        </Modal>

        {/* menu */}
        <div className={'header'}>
          <a href="/" className={'header__logo'}>
            <img src={logo_xswap} alt="logo" />
          </a>

          <div className={'header__menu'}>
            <Dropdown
              overlay={
                <Menu className={'header__overlay'}>
                  <Menu.Item>
                    <a target="_blank" rel="noopener noreferrer" href="https://usdx.dforce.network/" className={'header__overlay_item'}>
                      <span>USDx</span>
                      <label>
                        <FormattedMessage id='Portal' />
                      </label>
                    </a>
                  </Menu.Item>
                  <Menu.Item>
                    <a target="_blank" rel="noopener noreferrer" href="https://markets.dforce.network/" className={'header__overlay_item'}>
                      <span>
                        <FormattedMessage id='Yield_Markets' />
                      </span>
                      <label>
                        <FormattedMessage id='Yield_Markets_detail' />
                      </label>
                    </a>
                  </Menu.Item>
                  <Menu.Item>
                    <a target="_blank" rel="noopener noreferrer" href="https://goldx.dforce.network/" className={'header__overlay_item'}>
                      <span>
                        <FormattedMessage id='goldx' />
                      </span>
                      <label>
                        <FormattedMessage id='goldx_detail' />
                      </label>
                    </a>
                  </Menu.Item>
                </Menu>
              }
            >
              <span className={'header__menu_item'}>
                <label><FormattedMessage id='dForce_Stablecoin' /></label>
                <img src={arrow_d} alt="down" />
              </span>
            </Dropdown>


            <Dropdown
              overlay={
                <Menu className={'header__overlay'}>
                  <Menu.Item>
                    <a rel="noopener noreferrer" href="https://trade.dforce.network/" className={'header__overlay_item'}>
                      <span>dForce Swap</span>
                      <label>
                        <FormattedMessage id='Instant_Swap_of_Stable_Assets' />
                      </label>
                    </a>
                  </Menu.Item>
                </Menu>
              }
            >
              <span className={'header__menu_item'}>
                <label>
                  <FormattedMessage id='Exchange_Market' />
                </label>
                <img src={arrow_d} alt="down" />
              </span>
            </Dropdown>


            <Dropdown
              overlay={
                <Menu className={'header__overlay'}>
                  <Menu.Item>
                    <a rel="noopener noreferrer" href="https://airdrop.dforce.network/" className={'header__overlay_item'}>
                      <span>Airdrop</span>
                      <label>
                        <FormattedMessage id='DF_token_distribute_system' />
                      </label>
                    </a>
                  </Menu.Item>
                </Menu>
              }
            >
              <span className={'header__menu_item'}>
                <label>
                  <FormattedMessage id='Governance' />
                </label>
                <img src={arrow_d} alt="down" />
              </span>
            </Dropdown>


            {
              this.state.net_type && !(this.state.net_type === 'kovan' || this.state.net_type === 'main') &&
              <a className={'header__menu_wallet header__menu_wallet_notsup'} onClick={() => { return false; }} rel="noopener noreferrer" href='javascript:;'>
                <img src={no_support} alt='' />
                <span>Wrong Network</span>
              </a>
            }

            {
              this.state.net_type && (this.state.net_type === 'kovan' || this.state.net_type === 'main') &&
              <>
                {
                  this.state.my_account &&
                  <a
                    rel="noopener noreferrer"
                    className={'header__menu_wallet'} target="_blank"
                    href={
                      this.state.net_type !== 'rinkeby'
                        ? `https://etherscan.com/address/${this.state.my_account}`
                        : `https://rinkeby.etherscan.io/address/${this.state.my_account}`
                    }
                  >
                    <div>
                      <i style={{
                        backgroundColor:
                          this.state.net_type !== 'rinkeby' ?
                            this.state.net_type !== 'kovan' ? '#29B6AF' : '#7E3AA4'
                            :
                            '#e2bc73'
                      }}></i>
                      {this.state.my_account.slice(0, 4) + '...' + this.state.my_account.slice(-4)}
                    </div>
                  </a>
                }
                {
                  !this.state.my_account &&
                  <a className={'header__menu_wallet'} onClick={() => { this.connect() }} rel="noopener noreferrer" href=''>
                    <FormattedMessage id='connect' />
                  </a>
                }
              </>
            }

            {
              !this.state.net_type &&
              <a className={'header__menu_wallet'} onClick={() => { this.connect() }} rel="noopener noreferrer" href=''>
                <FormattedMessage id='connect' />
              </a>
            }

          </div>
        </div>

        {/* mobile tips */}
        <div className={this.state.showonly ? 'mobile-only' : 'disn'}>
          <div className='wrap-mob'>
            <div className='only-left'>
              <a href="/" className={'header__logo'}>
                <img src={logo_xswap} alt="logo" />
              </a>
              {/* <img src={logo_xswap} alt='' /> */}
            </div>
            <div className='only-right'>
              <img src={close_new} alt='' onClick={() => { this.setState({ showonly: false }) }} />
            </div>
            <div className='clear'></div>
          </div>
          <div className='only-kong'></div>

          <h1 onClick={() => { this.setState({ meun1: !this.state.meun1 }) }}>
            <FormattedMessage id='dForce_Stablecoin' />
            <span>
              <img src={this.state.meun1 ? arrow_u : arrow_d} alt='' />
            </span>
          </h1>
          <div className={this.state.meun1 ? 'meun1' : 'only1px'}>
            <div className='m-item'>
              <a href='https://usdx.dforce.network/' target='_blank' rel="noopener noreferrer">
                <span className='title'>USDx</span>
              </a>
              <span className='details'>
                <FormattedMessage id='Portal' />
              </span>
            </div>
            <div className='m-item'>
              <a href='https://markets.dforce.network/' rel="noopener noreferrer">
                <span className='title'>
                  <FormattedMessage id='Yield_Markets' />
                </span>
              </a>
              <span className='details'>
                <FormattedMessage id='Yield_Markets_detail' />
              </span>
            </div>
            <div className='m-item'>
              <a href='https://goldx.dforce.network/' rel="noopener noreferrer">
                <span className='title'>
                  <FormattedMessage id='goldx' />
                </span>
              </a>
              <span className='details'>
                <FormattedMessage id='goldx_detail' />
              </span>
            </div>
          </div>


          <h1 onClick={() => { this.setState({ meun3: !this.state.meun3 }) }}>
            <FormattedMessage id='Exchange_Market' />
            <span>
              <img src={this.state.meun3 ? arrow_u : arrow_d} alt='' />
            </span>
          </h1>
          <div className={this.state.meun3 ? 'meun1' : 'only1px'}>
            <div className='m-item'>
              <a href='https://trade.dforce.network/' rel="noopener noreferrer">
                <span className='title'>dForce Swap</span>
              </a>
              <span className='details'>
                <FormattedMessage id='Instant_Swap_of_Stable_Assets' />
              </span>
            </div>
          </div>


          <h1 onClick={() => { this.setState({ meun2: !this.state.meun2 }) }}>
            <FormattedMessage id='Governance' />
            <span>
              <img src={this.state.meun2 ? arrow_u : arrow_d} alt='' />
            </span>
          </h1>
          <div className={this.state.meun2 ? 'meun1' : 'only1px'}>
            <div className='m-item'>
              <a href='https://airdrop.dforce.network/' rel="noopener noreferrer">
                <span className='title'>Airdrop</span>
              </a>
              <span className='details'>
                <FormattedMessage id='DF_token_distribute_system' />
              </span>
            </div>
          </div>

        </div>

        <div className="App">
          <div className='wrap-mob'>
            <div className='only-left'>
              {/* <img src={logo_xswap} alt='' /> */}
              <a href="/" className={'header__logo'}>
                <img src={logo_xswap} alt="logo" />
              </a>
            </div>
            <div className='only-right'>
              <img src={close} alt='' onClick={() => { this.setState({ showonly: true }) }} />
            </div>
            <div className='clear'></div>
          </div>

          {/* main content */}
          <div className="main-content">
            <div className="content-left">
              <div className="action">
                <Tabs
                  defaultActiveKey={'1'}
                  tabBarStyle={{ fontSize: '16px' }}
                  onChange={(activeKey) => { this.empty_state(activeKey) }}
                >
                  <TabPane tab={this.state.cur_language === '中文' ? "存入" : "DEPOSIT"} key="1">
                    <div className="choose-token">
                      <div className="choose-token-left">
                        <img className='choose-token-logo' src={this.state.token_logo[0]} alt='' />
                        <span className="cur-choosen-token">USDx</span>
                      </div>
                      <div className="choose-token-right">
                        <span className="span-balance">
                          <FormattedMessage id='balance' />:&nbsp;
                        </span>
                        <span className="span-balance-num">
                          {
                            this.state.my_balance__usdx ?
                              format_num_to_K(format_bn(this.state.my_balance__usdx, 18, 2)) : '...'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <Input
                        placeholder={'Amount'}
                        type='text'
                        value={this.state.value_mint}
                        onChange={(e) => { mint_change(this, e.target.value, 18) }}
                      />
                      <span className="span-max" onClick={() => { mint_max(this) }}>MAX</span>
                    </div>

                    {
                      !Web3.givenProvider &&
                      <div className="btn-wrap btn-wrap-plus">
                        <Button
                          disabled={this.state.is_btn_disabled_mint}
                          className={this.state.is_btn_disabled_mint ? 'btn_disabled' : ''}
                        >
                          <FormattedMessage id='ENABLE' />
                        </Button>
                      </div>
                    }

                    {
                      this.state.show_btn && this.state.is_approve__usdx &&
                      <div className="btn-wrap btn-wrap-plus">
                        <Button
                          disabled={this.state.is_btn_disabled_mint}
                          className={this.state.is_btn_disabled_mint ? 'btn_disabled' : ''}
                          onClick={() => { mint_click(this) }}
                        >
                          {
                            this.state.is_approving ?
                              <FormattedMessage id='Enabling' /> : <FormattedMessage id='DEPOSIT' />
                          }
                        </Button>
                      </div>
                    }
                    {
                      this.state.show_btn && !this.state.is_approve__usdx &&
                      <div className="btn-wrap btn-wrap-plus">
                        <Button
                          disabled={this.state.is_btn_disabled_mint}
                          className={this.state.is_btn_disabled_mint ? 'btn_disabled' : ''}
                          onClick={() => { approve_click(this) }}
                        >
                          {
                            this.state.is_approving ?
                              <FormattedMessage id='Enabling' /> : <FormattedMessage id='ENABLE' />
                          }
                        </Button>
                      </div>
                    }

                  </TabPane>

                  <TabPane tab={this.state.cur_language === '中文' ? "取回" : "WITHDRAW"} key="2">
                    <div className="choose-token">
                      <div className="choose-token-left">
                        <img className='choose-token-logo' src={this.state.token_logo[0]} alt='' />
                        <span className="cur-choosen-token">USDx</span>
                      </div>
                      <div className="choose-token-right">
                        <span className="span-balance">
                          <FormattedMessage id='withdraw_balance' />:&nbsp;
                        </span>
                        <span className="span-balance-num">
                          {
                            this.state.my_balance__dusdx ?
                              format_num_to_K(format_bn(this.state.my_balance__dusdx, 18, 2)) : '...'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="input-wrap">
                      <Input
                        placeholder={'Amount'}
                        type='text'
                        value={this.state.value_redeem}
                        onChange={(e) => { redeem_change(this, e.target.value, 18) }}
                      />
                      <span className="span-max" onClick={() => { redeem_max(this) }}>MAX</span>
                    </div>

                    <div className="btn-wrap btn-wrap-plus">
                      {
                        this.state.show_btn &&
                        <Button
                          disabled={this.state.is_btn_disabled_redeem}
                          className={this.state.is_btn_disabled_redeem ? 'btn_disabled' : ''}
                          onClick={() => { redeem_click(this) }}
                        >
                          <FormattedMessage id='WITHDRAW' />
                        </Button>
                      }
                    </div>
                  </TabPane>
                </Tabs>
              </div>

              <div className="history-wrap history-pc">
                <History
                  account={this.state.my_account}
                  net_type={this.state.net_type}
                  new_web3={this.new_web3}
                  load_new_history={this.state.load_new_history}
                  cur_language={this.state.cur_language}
                  decimals={this.state.token_decimals}
                  token_name={this.state.token_name}
                  token_d_name={this.state.token_d_name}
                />
              </div>
            </div>

            <div className="content-right">

              <div className="token-status">
                <div className="token-status-header">
                  <div className="token-status-header-child">
                    <FormattedMessage id='You_have' />
                    {
                      this.state.my_balance__dusdx ?
                        <span className="account-balance">
                          {
                            format_num_to_K(format_bn(this.state.my_balance__dusdx, 18, 6))
                          }
                        </span> : '...'
                    }
                  &nbsp;
                  {this.state.token_name[this.state.cur_index_redeem]}
                    <FormattedMessage id='brewing' />
                  </div>
                </div>

                <div className="token-status-body">
                  <div className={"token-status-body-item"}>
                    <div className="pool-wrap">
                      <span className="token-title">
                        <FormattedMessage id='Market_Size' />
                      </span>
                      <span className="token-rate">
                        <span style={{ fontWeight: 500 }}>
                          {
                            this.state.total_underlying ?
                              format_num_to_K(this.state.total_underlying.toFixed(2))
                              : '...'
                          }
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className={"token-status-body-item"}>
                    <div className="pool-wrap">
                      <span className="token-title">
                        <FormattedMessage id='APY' />
                      </span>
                      <span className="token-rate">
                        <span style={{ fontWeight: 500 }}>
                          {
                            this.state.token_apy ?
                              format_num_to_K(this.state.token_apy.toFixed(2))
                              : '...'
                          }
                        </span>
                        {this.state.token_apy && '%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {
                !this.state.token_status_is_ready &&
                <div className="nodata-wrap">
                  <img alt='' src={no_history} />
                  <span className="no-data-span">
                    <FormattedMessage id='no_data' />
                  </span>
                </div>
              }

              <div className="echarts-wrap ">
                <ReactEcharts option={this.state.options} />
              </div>

            </div>
          </div>

          <div className="history-wrap history-mob">
            <History
              account={this.state.my_account}
              net_type={this.state.net_type}
              new_web3={this.new_web3}
              load_new_history={this.state.load_new_history}
              cur_language={this.state.cur_language}
              decimals={this.state.token_decimals}
              token_name={this.state.token_name}
              token_d_name={this.state.token_d_name}
            />
          </div>


          {/* foot */}
          <div className="foot">
            <div className="foot-item">
              <div className="foot-item-title">
                <FormattedMessage id='Resource' />
              </div>
              <div className="foot-item-content">
                <a href='https://github.com/dforce-network/USR' target='_blank' rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
              <div className="foot-item-content">
                <a
                  href='https://github.com/dforce-network/USR'
                  target='_blank'
                  rel="noopener noreferrer"
                >
                  FAQ
                </a>
              </div>
            </div>

            <div className="foot-item">
              <div className="foot-item-title">
                <FormattedMessage id='Community' />
              </div>
              <div className="foot-item-content icom-a">
                <a href='https://twitter.com/dForcenet' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Twitter} />
                </a>
                <a href='https://t.me/dforcenet' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Telegram} />
                </a>
                <a href='https://medium.com/dforcenet' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Medium} />
                </a>
                <a href='https://www.reddit.com/r/dForceNetwork' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Reddit} />
                </a>
                <a href='https://discord.gg/Gbtd3MR' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Discord} />
                </a>
                <a href='https://www.linkedin.com/company/dforce-network' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={LinkedIn} />
                </a>
                <a href='https://www.youtube.com/channel/UCM6Vgoc-BhFGG11ZndUr6Ow' target='_blank' rel="noopener noreferrer">
                  <img alt='' src={Youtube} />
                </a>
                {
                  this.state.cur_language === '中文' &&
                  <span className='weixin-img-wrap'>
                    <img alt='' src={weixin} />
                    <img alt='' className='weixin-img' src={erweima} />
                  </span>
                }
              </div>

              <div className='footer-right-fixed'>
                <div className='fixed1'>
                  {
                    this.state.cur_language === '中文' ? '中文简体' : 'English'
                  }
                </div>
                <span className='fixed-img'>
                  <img alt='' src={arrow_u} />
                </span>
                <div className='fixed2'>
                  <ul>
                    <li onClick={() => { this.setState({ cur_language: '中文' }) }}>{'中文简体'}</li>
                    <li onClick={() => { this.setState({ cur_language: 'English' }) }}>{'English'}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="foot-item padding-left20">
              <div className="foot-item-title">
                <FormattedMessage id='Contract_US' />
              </div>
              <div className="foot-item-content">
                support@dforce.network
              </div>
              <div className="foot-item-content">
                bd@dforce.network
              </div>
              <div className="foot-item-content">
                tech@dforce.network
              </div>
            </div>
            <div className="clear"></div>
          </div>

        </div>
      </IntlProvider >
    )
  }
}
