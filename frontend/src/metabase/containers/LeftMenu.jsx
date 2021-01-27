
import React, { Component } from "react";
import { GET } from "metabase/lib/api";
import { Link } from "react-router";
import  Menu from 'antd/es/menu';
//import Icon  from 'antd/es/icon';
import Icon from "metabase/components/Icon";
import { connect } from "react-redux";
import "antd/es/menu/style/css";
//import "antd/es/icon/style/css";

 const { SubMenu } = Menu;


@connect(
    ({ currentUser }) => ({ currentUser }),
    null,
  )
export default class LeftMenu extends Component {
    constructor(props, context){
        super(props, context)
        this.state={
            menuItems:[],
            openKeys:[]
        }
    }


    async componentWillMount(){
        const root= GET('/api/collection/root/items')
        const result=await root()
        this.setState({ menuItems:result})
        
        setTimeout(async ()=>{
            await this.loadMenu(result,0)
            this.setState({menuItems:result})
        },500)
    }


    async loadMenu(result,parentId){
        for(const item of result){
            item.parentId=parentId
            if(item.model!=='collection'){
                continue
            }
            const items= GET('/api/collection/:id/items')
            const m=await items({id:item.id});
            if(!item.items){
                item.items=[]
            }
            
            if(m.length>0){
                item.items=item.items.concat(m.sort((a,b)=>{
                    const a_position=a.collection_position || 0;
                    const b_position=b.collection_position || 0;
                    return b_position - a_position
                }))
                await this.loadMenu(item.items,item.id)
            }
        }       
    }

     handleClick=(openKeys)=>{
       this.setState({openKeys:openKeys});
     }

    render() {
        const {currentUser}=this.props
        const {menuItems}=this.state
        
        const renderItem = (items) => {
            if(!items || items.length<=0){
                return;
            }
            return items.map(item=>{
                if(item.model==='collection' || item.model==='dashboard'){
                    if(item.model==='collection'){
                        return (<SubMenu
                                key={item.model+"-"+item.id}
                                title={
                                <span>
                                    <Icon name="all" mr={1}/>
                                    <span style={{fontWeight:600}}>{item.name}</span>
                                </span>
                                    }
                                >
                                { renderItem(item.items)} 
                                </SubMenu>)
                    } else{
                        return (
                        <Menu.Item key={item.model + "-" + item.id}>
                          <Link to={`/view/${item.model}/${item.id}`} style={{display:'flex',alignItems:'center'}}>
                            <Icon name="dashboard" mr={1}/>
                            {currentUser.personal_collection_id === item.id ? "我的" : item.name}
                          </Link>
                        </Menu.Item>
                        )
                    }
                }
            });
        }

        menuItems.push(
            <Menu.Item key={"indicator_definition"}>
                <Link to={`https://schoolpal.yuque.com/docs/share/75a8937c-94d8-4410-9852-091002d47569#NhBs`} target="_blank" style={{display:'flex',alignItems:'center'}}>
                <Icon name="dashboard" mr={1}/>
                指标管理
                </Link>
            </Menu.Item>);
    
       const getOpenKeys =(items, id) =>{
            const list=[]
            const buildParentList=(arr)=>{
                arr.forEach(g =>
                {
                    if(g && (g.model==='collection' || g.model==='dashboard')) {
                       list[g.model+'-'+g.id] ='collection-'+g.parentId	
                    }
                    if (g.items && g.items.length>0){
                        buildParentList(g.items)
                    }
                })
            }

            const parentIds=[]
            function findParent(idx){
                if (list[idx] !== undefined){
                    const pid = list[idx]
                    parentIds.push(pid)
                    console.log(pid)
                    findParent(pid)
                }
            }
            buildParentList(items)
            findParent('dashboard-'+id)
            const result=[]
            parentIds.map(id=>{
                result.push(id)
            })
            return result
       }

        let openKeys=getOpenKeys(menuItems,this.props.params.dashboardId)
        openKeys = [...new Set(openKeys.concat(this.state.openKeys))]
        return (<Menu style={{height:'100%'}}
            selectedKeys={['dashboard-'+this.props.params.dashboardId]}
            openKeys={openKeys}
            onOpenChange={this.handleClick}
            // style={{ width: 250 }}
            mode="inline"
            >
                {renderItem(menuItems)}
            </Menu>
            );
    }
    
}