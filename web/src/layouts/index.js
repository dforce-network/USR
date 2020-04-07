// import i18n from '@services/i18n';
import React, { Component } from 'react';
import styles from './index.less';
import PageHeader from '@components/PageHeader';
import PageFooter from '@components/PageFooter';

class BasicLayout extends Component {
  render() {
    return (
      <div className={styles.usr}>
        <PageHeader />
        {this.props.children}
        <PageFooter />
      </div>
    );
  }
}

export default BasicLayout;
