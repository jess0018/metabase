/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import title from "metabase/hoc/Title";
import { t } from "ttag";
import Dashboard from "metabase/dashboard/components/Dashboard.jsx";

import { fetchDatabaseMetadata } from "metabase/redux/metadata";
import { setErrorPage } from "metabase/redux/app";
import EmptyState from "metabase/components/EmptyState";
import Link from "metabase/components/Link";
import RetinaImage from "react-retina-image";
import * as Urls from "metabase/lib/urls";


import {
  getIsEditing,
  getIsEditingParameter,
  getIsDirty,
  getDashboardComplete,
  getCardList,
  getRevisions,
  getCardData,
  getSlowCards,
  getEditingParameter,
  getParameters,
  getParameterValues,
} from "../selectors";
import { getDatabases, getMetadata } from "metabase/selectors/metadata";
import { getUserIsAdmin,getUser } from "metabase/selectors/user";

import * as dashboardActions from "../dashboard";
import { parseHashOptions } from "metabase/lib/browser";

import Dashboards from "metabase/entities/dashboards";

const mapStateToProps = (state, props) => {
  return {
    dashboardId: getUser(state).home_dashboardid || props.params.dashboardId,

    isAdmin: getUserIsAdmin(state, props),
    isEditing: getIsEditing(state, props),
    isEditingParameter: getIsEditingParameter(state, props),
    isDirty: getIsDirty(state, props),
    dashboard: getDashboardComplete(state, props),
    cards: getCardList(state, props),
    revisions: getRevisions(state, props),
    dashcardData: getCardData(state, props),
    slowCards: getSlowCards(state, props),
    databases: getDatabases(state, props),
    editingParameter: getEditingParameter(state, props),
    parameters: getParameters(state, props),
    parameterValues: getParameterValues(state, props),
    metadata: getMetadata(state),
  };
};

const mapDispatchToProps = {
  ...dashboardActions,
  archiveDashboard: id => Dashboards.actions.setArchived({ id }, true),
  fetchDatabaseMetadata,
  setErrorPage,
  onChangeLocation: push,
  goCatalog:()=> push('/manager')
  
};

type DashboardAppState = {
  addCardOnLoad: number | null,
};

@connect(
  mapStateToProps,
  mapDispatchToProps
)
@title(({ dashboard }) => dashboard && dashboard.name)
// NOTE: should use DashboardControls and DashboardData HoCs here?
export default class DashboardApp extends Component {
  state: DashboardAppState = {
    addCardOnLoad: null,
  };

  componentWillMount() {
    const options = parseHashOptions(window.location.hash);
    if (options.add) {
      this.setState({ addCardOnLoad: parseInt(options.add) });
    }
  }


  render() {
    
    const IsPc=!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if(!this.props.dashboardId || this.props.dashboardId<=0){
      return (
        <div>
        <EmptyState
          title={'您可以进入看板页面设置你专属的首页'}
          illustrationElement={
            <RetinaImage
              src="app/img/collection-empty-state.png"
              className="block ml-auto mr-auto"
            />
          }
        />
        {IsPc?'':<div style={{position:'fixed',display:'flex',alignItems:'center',justifyContent:'center',bottom:'20px',right:'20px',width:'50px',height:'50px',borderRadius:'50%',cursor:'pointer',zIndex:'1000',color:'#fff',backgroundColor:'#1890ff'}} onClick={() => this.props.goCatalog()}>目录</div>}
        </div>
      )
    }else{
    return (
      <div>
        <Dashboard addCardOnLoad={this.state.addCardOnLoad} {...this.props} />
        {/* For rendering modal urls */}
        {this.props.children}
        {IsPc?'':<div style={{position:'fixed',display:'flex',alignItems:'center',justifyContent:'center',bottom:'20px',right:'20px',width:'50px',height:'50px',borderRadius:'50%',cursor:'pointer',zIndex:'1000',color:'#fff',backgroundColor:'#1890ff'}} onClick={() => this.props.goCatalog()}>目录</div>}
      </div>
    );
    }
  }
}
