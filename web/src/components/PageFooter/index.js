import React, { Component } from 'react';
import styles from './index.less';
import {
  TwitterCircleFilled
} from '@ant-design/icons';

const iconTwitter = require('@assets/icon_twitter.svg');
const iconTelegram = require('@assets/icon_telegram.svg');
const iconMedium = require('@assets/icon_medium.svg');
const iconReddit = require('@assets/icon_reddit.svg');
const iconDiscord = require('@assets/icon_discord.svg');
const iconLinkedin = require('@assets/icon_linkedin.svg');
const iconYoutube = require('@assets/icon_youtube.svg');

export default class PageFooter extends Component {
  render() {
    return (
      <div className={styles.footer}>
        <section className={styles.footer__link}>
          <h2>Resource</h2>
          <a href="/">GitHub</a>
          <a href="/">FAQ</a>
        </section>

        <section className={styles.footer__community}>
          <h2>Community</h2>
          <div>
            <a href="" target="_blank"><img src={iconTwitter} /></a>
            <a href="" target="_blank"><img src={iconTelegram} /></a>
            <a href="" target="_blank"><img src={iconMedium} /></a>
            <a href="" target="_blank"><img src={iconReddit} /></a>
            <a href="" target="_blank"><img src={iconDiscord} /></a>
            <a href="" target="_blank"><img src={iconLinkedin} /></a>
            <a href="" target="_blank"><img src={iconYoutube} /></a>
          </div>
          <a href="/">English</a>
        </section>

        <section className={styles.footer__email}>
          <h2>Contact</h2>
          <a href="/">contacts@dforce.network</a>
          <a href="/">bd@dforce.network</a>
          <a href="/">tech@dforce.network</a>
        </section>
      </div>
    )
  };
}
