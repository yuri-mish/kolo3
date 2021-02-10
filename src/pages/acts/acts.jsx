import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/auth";

import DataGrid, {
  Selection,
  Paging,
  FilterRow,
  Scrolling,
  Column,
  Lookup,
  Button as CButton,
  StateStoring,
} from "devextreme-react/data-grid";
import { Menu } from "devextreme-react";

// import { useState, useRef } from 'react';
// import { Order } from './order';
// import { Popup } from 'devextreme-react';
//import { useHistory } from "react-router-dom";


import { API_HOST, uaFilterRowText } from './../../constants';
import { partnerDataSource } from "../../db/ds/dsPartners";

//import { useSubscription, gql} from "@apollo/client";
//import { notify } from 'devextreme/ui/notify';
import { actsDataSource } from './../../db/ds/dsActs';
import { dsBuyersOrdersLookup } from "../../db/ds/dsOrders";



const Acts = (props) => {
  const refGrid = useRef()
  const { signOut } = useAuth(); 
//  const history = useHistory();
  const [currRow,setCurrRow] = useState({ref:''})

//  const sq = gql(`subscription{docChange(input:{username:"${user?user.email:''}"})}`)
//  const  {data: docChange,loading: loading_docChange} = useSubscription(sq);
  
    // useEffect(() => {
    //   refGrid.current.instance.refresh(true)
    //  }, [docChange,loading_docChange]) 

useEffect(() => {
  actsDataSource.on("loaded", result=>{
    if (result.errors) signOut();
  });
  return () => {
      };
}, [])

  const setRow=useCallback((e)=>{
    var r
    if (e.row) r=e.row.data
    if (e.data) r=e.data
     if (r){
       if(!r.ref)
        r.ref = r._id.split('|')[1]
       setCurrRow(r)
     }  
    },[])
    
  // const classes = useStyles();

  //const editIconClick = (e) => {
 //   history.push("/order/" + e.row.key.split("|")[1]);
  //};

  const cellOrderRender = useCallback((cellData)=>{
//       console.log(cellData)
      if (cellData&&cellData.data&&cellData.data.trans&&cellData.data.trans.ref)
        return (<div> <a href={'#/order/'+ cellData.data.trans.ref}>  {cellData.data.trans.caption} </a> </div>)
        else (<div> Документ недоступний </div>)
 },[])


  return (
    <div height="6rem">
    <Menu
    onItemClick={e => {
      switch(e.itemData.id){
      // case "new": { history.push("/order/new");
      //               break
      //             }
      case "print": {
            var windowObjectReference = null;
            var winParam = '';
            windowObjectReference = window.open(e.itemData.url, "printwin",winParam)
            windowObjectReference.focus()
            break
          }
          default:{}
        }
    }}
    dataSource={[
      {
        text: "Додати",
        id:"new",
        disabled:true
      },
      {
        text: "Закрити",
      },
      { text:"Друк",
            icon:"print",
              items:[
                {
                id:"print",
                text:"Акт виконаних робіт",
                url:API_HOST+`/printact/${currRow.ref}/act`,
                disabled:!(currRow.ref&&currRow.number_doc),
              },
        ]
      },  
    ]}></Menu>

      <DataGrid
        id="gridContainer"
        highlightChanges={true}
        
        ref = {refGrid}
        dataSource={actsDataSource}
        allowColumnReordering={true}
        allowColumnResizing={true}
        showBorders={true}
        allowSorting={true}
        remoteOperations={true}
        height={800}
        onRowClick = {setRow}
        >
            <StateStoring enabled={true} type="localStorage" storageKey="acts" /> 
            <Selection mode="single" />
            <Scrolling mode="virtual" rowRenderingMode="virtual"  />
            <Paging  pageSize={100} />
            <FilterRow visible={true} {...uaFilterRowText}/>
        
        {/* <Column type="buttons" width={35}>
          <CButton name="_edit" icon="edit" onClick={editIconClick} />
        </Column> */}

        <Column width={145}
          dataField="number_doc"
          caption="Номер"
          dataType="string"
          alignment="center"
        />
        <Column width={170}
          dataField="date"
          caption="Дата"
          dataType="date"
          format="dd.MM.yyyy HH:mm:ss"
          alignment="center"
        />
        <Column width={400}
        allowSorting={false}
          dataField="partner.ref"
          caption="Контрагент"
          dataType="string"
          alignment="left"
          calculateDisplayValue={data => (data.partner?.name)}>
          <Lookup 
            dataSource={partnerDataSource} allowClearing={true} 
            valueExpr="ref"
            displayExpr="name"
            minSearchLength={3}
            searchTimeout={500}>
          </Lookup>
        </Column>

      

        <Column width={400}
          allowSorting={false}
          dataField="trans.ref"
          caption="Замовлення"
          dataType="string"
          alignment="left" 
          //calculateDisplayValue={data => (data.trans?.number_doc)}
          cellRender={cellOrderRender}
          >

         <Lookup 
            dataSource={dsBuyersOrdersLookup} allowClearing={true} 
            valueExpr="ref"
            displayExpr="number_doc"
//            displayExpr={(data)=>(`${data.number_doc} від ${data.date}`)}
            minSearchLength={3}
            searchTimeout={500}/>
          </Column>

          <Column width={100}
          allowSorting={true}
          dataField="doc_amount"
          caption="Сума"
          dataType="number"
          //format="currency"
          alignment="right"
        />
          <Column 
          allowSorting={false}
          dataField="note"
          caption="Коментар"
          dataType="number"
          alignment="left"
        />
      </DataGrid>
    </div>
  );
};

export default Acts;
