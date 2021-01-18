import React, { Component } from "react";
import OrgTree from 'metabase/org_tree';
import { MetabaseApi } from "metabase/services";
import 'metabase/org_tree/org_tree.css';
import { indexOf } from "underscore";
import { connect } from "react-redux";
import { push } from "react-router-redux";

const horizontal = true; // true：横向  false：纵向
const collapsable = true; // true：可折叠 false：不可折叠 
const expandAll = false; // true: 全部展开 false：全部折叠 

@connect((state, props) => {},{
    goDownload:()=> push('/question/1014')
})
export default class MyOrgTreeTBU extends Component {
    constructor(props, context){
        super(props, context)
        this.state={
            data:null,
            date:null,
            parameterValues:null
        }
    }

    componentWillMount(){
        this.getDatas();
    }

    componentDidUpdate(prevProps){
        if(this.props.parameterValues==this.state.parameterValues){
            return
        }
        const {parameters,parameterValues}=this.props;
        this.setState({parameterValues:parameterValues});
        if(parameters && parameterValues){
            let date=null;
            parameters.forEach(p=>{
                if(p.type=='date/month-year'){
                    date=parameterValues[p.id]
                }
            });
            
            if(date){
                const now=new Date();
                const d=new Date(date);
                const nowDay =now.getDay(); //当前天
                const dMonth = d.getMonth(); //当前月 
                const dYear = d.getFullYear(); //当前年 
                const nowMonth = now.getMonth(); //当前月 
                const nowYear = now.getFullYear(); //当前年 
                const monthEndDate = new Date(dYear, dMonth+1, 0);
                let result_date=null;

               
                if(dYear==nowYear && dMonth==nowMonth && nowDay !=1 ){ 
                    //当月 获取前一天数据
                    result_date= this.dateFormat("YYYY-mm-dd HH:MM", new Date(now.getTime() - 24*60*60*1000));
                }
                else{
                    //其他月 前一月最后一天
                    result_date = this.dateFormat("YYYY-mm-dd HH:MM", monthEndDate);
                }
                console.info('result_date',result_date);
                this.getDatas(result_date);
            }
        }
    }

    dateFormat(fmt, date) {
        let ret;
        const opt = {
            "Y+": date.getFullYear().toString(),        // 年
            "m+": (date.getMonth() + 1).toString(),     // 月
            "d+": date.getDate().toString(),            // 日
            "H+": date.getHours().toString(),           // 时
            "M+": date.getMinutes().toString(),         // 分
            "S+": date.getSeconds().toString()          // 秒
        }

        for (let k in opt) {
            ret = new RegExp("(" + k + ")").exec(fmt);
            if (ret) {
                fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
            }
        }
        return fmt;
    }

    getJsonTree(rows,parentId){
         const itemArr=[];
         for(let i=0;i<rows.length;i++){
             const node=rows[i];
             if(node[1]==parentId){
                 const id=node[2];
                 const label=node[3];
                 let dget=node[4];//目标值
                 let actual=node[5];

                 let comlv=0;
                 if(dget == null){
                    dget=''  
                 }
                 
                 if(dget>0){
                    comlv = actual/dget
                 }


                 if(actual == null){
                    actual=''  
                 }

                 switch(id)
                 {
                    case '2007':
                    case '2011':
                    case '2013':
                    case '2016':
                    case '2020':
                        //百分数
                        actual=actual*100
                        dget=dget*100
                        actual=Math.round(actual)
                        dget=Math.round(dget)
                        break;
                    //case '0':
                        //万分
                        //actual=actual*10000
                        //dget=dget*10000
                        //actual=Math.round(actual)
                        //dget=Math.round(dget)
                        //break;
                    case '2009':
                    case '2018':
                    case '2207':
                        //百分数，保留一位小数
                        actual=(actual*100).toFixed(1)
                        dget=(dget*100).toFixed(1)
                        break;
                    case '0':
                        //保留一位小数
                        //actual=actual.toFixed(1)
                        //dget=dget.toFixed(1)
                        break;
                    default:
                        //整数
                        actual=Math.round(actual)
                        dget=Math.round(dget)
                        break;
                 }

                const newNode={id:id,label:label,actual:actual,dget:dget,comlv:Math.round(comlv*100)+"%",expand:true};
                const children=this.getJsonTree(rows,node[2]);
                if(children && children.length>0){
                    newNode.children=children;
                }
                itemArr.push(newNode);
            }
		}
		return itemArr;
    }

   async getDatas(date)  {
        this.leave=0;
        let query=`select a.dis_Id,a.parent_id,a.id,trim(a.kpi_name) as kpi_name,a.kpi_budget,IFNULL(b.kpi_value,0) kpi_value 
        from 
        (select * from dim_tbu_kpi_budget_m where month_Id=month(DATE_ADD(CURDATE(),INTERVAL -1 day) ) and year_id=year(now())) a
        left join 
        (
            select * from dm_tbu_kpi_real_m x
            join (select max(etl_date) date from dm_tbu_kpi_real_m ) c
            on x.etl_date=c.date and day_id= DATE_FORMAT(DATE_ADD(CURDATE(),INTERVAL -1 day),'%Y-%m-01') 
        ) b
        on a.id=b.kpi_Id
        order by a.dis_Id`;
        if(date){
            query=`select a.dis_Id,a.parent_id,a.id,trim(a.kpi_name) as kpi_name,a.kpi_budget,IFNULL(b.kpi_value,0) kpi_value 
            from 
        (select * from dim_tbu_kpi_budget_m where month_Id=month('${date}') and year_id=year('${date}')) a
        left join 
        (
            select * from dm_tbu_kpi_real_m x
            join (select max(etl_date) date from dm_tbu_kpi_real_m ) c
            on x.etl_date=c.date and day_id= DATE_FORMAT(DATE_ADD('${date}',INTERVAL -1 day),'%Y-%m-01') 
        ) b
        on a.id=b.kpi_Id
        order by a.dis_Id`;
        }
    
        const result = await MetabaseApi.dataset({
            database:7,
            type:'native',
            native:{
                query:query,
                'template-tags': {}
            },
            parameters: []
        }); 
        if(result && result.data && result.data.rows){
            const jsonTree=this.getJsonTree(result.data.rows,0);
            (function ps(data, depth) {
                for (let v of data) {
                  if(depth>=2){
                      v.expand=false;
                  }
                  if (Object.prototype.hasOwnProperty.call(v, 'children') && v.children.length) { //v.hasOwnProperty('children')
                    ps(v.children, depth + 1);
                  }
                }
            })(jsonTree, 0);
            this.setState({data:jsonTree[0]});
        }
    }
    
    render(){
        if(this.state.data){
            return(
                <div style={{position:'relative'}}>
                <div style={{position:'absolute',display:'flex',alignItems:'center',justifyContent:'center',top:'-50px',right:'20px',width:'100px',height:'30px',cursor:'pointer',zIndex:'1000',color:'#fff',backgroundColor:'#1890ff'}} onClick={() => this.props.goDownload()}>去下载</div>
                <OrgTree
                data={this.state.data}
                horizontal={horizontal}
                collapsable={collapsable}
                expandAll={expandAll}
            /></div>)
        }else{
            return (<div style={{margin:'20px'}}>没有当前时间数据...</div>)
        }
        
    }  
}