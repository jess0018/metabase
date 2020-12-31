
import React, { Component } from "react";
import LeftMenu from "metabase/containers/LeftMenu.jsx";

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