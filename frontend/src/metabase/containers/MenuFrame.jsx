
import React, { Component } from "react";
import LeftMenu from "metabase/containers/LeftMenu";
import Icon from "metabase/components/Icon";
import { Link } from "react-router";

export default class App extends Component {
    render() {
        const {children}=this.props
         return <div className="container">
             <div className="left-menu">
                  <LeftMenu {...this.props}></LeftMenu>
              </div>    
              <div className="main">
                 {children}
              </div>                 
         </div>
    }
}