import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/auth";
//import "devextreme/dist/css/dx.common.css";
//import "devextreme/dist/css/dx.light.css";

import CustomStore from "devextreme/data/custom_store";
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
import { useHistory } from "react-router-dom";

import {catLoad, convertToText,docLoad,filterObj, handleErrors} from '../../utils/filtfunc'
import { API_HOST, uaFilterRowText } from './../../constants';
import { partnerDataSource } from "../../db/ds/dsPartners";

import { useSubscription, gql} from "@apollo/client";
import { notify } from 'devextreme/ui/notify';
import { actsDataSource } from './../../db/ds/dsActs';
import { customDataSource as buyersOrdersDataSource} from "../orders/orders";
import { AutocompleteOTK } from "../../components/otk/AutocompleteOTK";

const cls_name = 'buyers_orders'
const cls_fields = ` ref number_doc `

const bDataSource = new CustomStore({
  key: "ref",
  byKey: ref => {
    if (!ref) return { ref: '', number_doc: '' };
    const q = `{${cls_name} (ref:"${ref}") {${cls_fields}}}`;
    return fetch(API_HOST, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ query: q }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        return response.data[cls_name].length === 0
          ? { ref: '', number_doc: '' }
          : response.data[cls_name][0];
      });
  },
  load: (options) => {
    const addOptions = {cls_name:cls_name,
      cls_fields:cls_fields,
      }
    if (options.filter&&options.filter[0]==='ref') return bDataSource.byKey(options.filter[2])
//    return docLoad(options, addOptions);
    return catLoad(options, cls_name,cls_fields);
  },
});



const showError = (message) => {
  notify({ message: message, position: { at: "center" } }, "error", 5000);
};


const Acts = (props) => {
  const refGrid = useRef()
  const { user, signOut } = useAuth(); 
  const history = useHistory();
  const [currRow,setCurrRow] = useState({ref:''})

//  const sq = gql(`subscription{docChange(input:{username:"${user?user.email:''}"})}`)
//  const  {data: docChange,loading: loading_docChange} = useSubscription(sq);
  
    // useEffect(() => {
    //   refGrid.current.instance.refresh(true)
    //  }, [docChange,loading_docChange]) 

    actsDataSource.on("loaded", result=>{
    if (result.errors) signOut();
  });

  const setRow=(e)=>{
    var r
    if (e.row) r=e.row.data
    if (e.data) r=e.data
    // if (r){
    //   r.ref = r._id.split('|')[1]
       setCurrRow(r)
    // }  

    }
  // const classes = useStyles();

  //const editIconClick = (e) => {
 //   history.push("/order/" + e.row.key.split("|")[1]);
  //};

  const cellOrderRender = useCallback((cellData)=>{
//       console.log(cellData)
       return (<div> <a href={'#/order/'+ cellData.data.trans.ref}>  {cellData.data.trans.caption} </a> </div>
 ); 
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
  //      focusedRowEnabled = {true}

        onRowClick = {setRow}
       // onFocusedRowChanged={setRow}
        //   onEditingStart={this.onEditingStart}
        //   onInitNewRow={this.onInitNewRow}
        //   onRowInserting={this.onRowInserting}
        //   onRowInserted={this.onRowInserted}
        //   onRowUpdating={this.onRowUpdating}
        //   onRowUpdated={this.onRowUpdated}
        //   onRowRemoving={this.onRowRemoving}
        //   onRowRemoved={this.onRowRemoved}
        //   onSaving={this.onSaving}
        //   onSaved={this.onSaved}
        //   onEditCanceling={this.onEditCanceling}
        //   onEditCanceled={this.onEditCanceled}
      >
            {/* <StateStoring enabled={true} type="localStorage" storageKey="acts" /> */}
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
            dataSource={buyersOrdersDataSource} allowClearing={true} 
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
