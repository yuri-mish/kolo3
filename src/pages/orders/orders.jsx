import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/auth";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";

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

import {convertToText,filterObj} from '../../utils/filtfunc'
import { API_HOST } from './../../constants';
import { PartnerBox, partnerDataSource } from "../../db/ds/dsPartners";


const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};





const customDataSource = new CustomStore({
  key: "_id",

  update: (dat) => {
    console.log(dat);
  },
  load: (options) => {
    console.log("=Options:" + JSON.stringify(options));
    
    const _jsonFilter = options.filter?" jfilt:"+convertToText(filterObj(options.filter)):''
    console.log('_jsonFilter:',_jsonFilter)


    
    let _sort = "";
    if (options.sort) {
      const __sort = options.sort[0] 
      _sort = ` sort:{selector:"${__sort.selector}" desc:"${__sort.desc}"}`;
    } 
 
     let _search = ''
    // let _search =
    //   options.searchOperation && options.searchValue
    //     ? ', nameContaine:"' + options.searchValue + '"'
    //     : "";

    var _offset = "";
    if (options.skip) _offset = ` offset:${options.skip}`;

    var _limit = 50;
    if (options.take) _limit = options.take;

    var _qT = ``;
    if (options.requireTotalCount)
      _qT = `totalcount:buyers_orders (limit:1 ${_search} ${_jsonFilter} totalCount:1)  { totalcount} `;

    var q = `{${_qT} buyers_orders(limit:${_limit} ${_search} ${_sort}  ${_offset} ${_jsonFilter})
                    { 
                     _id
                     number_doc
                     date
                     doc_amount
                     paid
                     shipped
                     note
                     partner { 
                         _id ref name 
                        } 

                    }
                 }`
  console.log ('=q=:',q)                 
   return fetch(API_HOST, {
      method: "POST",
      credentials: "include",
     // credentials: 'same-origin', mode:"no-cors",
      body: JSON.stringify({
        query: q,
      }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
 //                   mode:"no-cors" ,
    })
      .then(handleErrors)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        //               console.log(data.data)
        if (data.errors) {
          return { errors: data.errors[0] };
        }

        return {
          data: data.data.buyers_orders,
          totalCount: options.requireTotalCount
              ? data.data.totalcount[0].totalcount
              : undefined,
          //summary: response.summary,
          //groupCount: response.groupCount
        };
        // return ()
      });
    //.catch(() => { console.log( 'Network error' )});
  },
  // insert: (data) => {
  //   createObject({
  //     variables: { product: { ...data, oid: uuidv4() } },
  //   }).then((xx) => refetch());
  // },
  // update: (key, values) => {
  //   updateObject({
  //     variables: {
  //       product: { ...values },
  //       oid: key,
  //     },
  //   });
  // },
  // remove: (key) => {
  //   deleteObject({
  //     variables: {
  //       oid: key,
  //     },
  //   }).then((xx) => refetch());
  // },
});

const lookupDataSource = new CustomStore({
  key: "ref",
  byKey: function (key) {
    //    console.log("2:",this.);
    var res = this.load({ lookUp: key });
    return res.then((dat) => {
      var ob = dat.data?.find((elem) => elem.ref === key);
      return ob;
    });
  },
  paginate: true,
  pageSize: 10,
  //        onModifying:(dat)=>{console.log("2:",dat)},
  load: async (options) => {
    console.log(options);
    if (options.filter) return { data: [] };
    let search = "";
    if (options.searchOperation && options.searchValue)
      search = ', nameContaine:"' + options.searchValue + '"';

    let lookUp = "";
    if (options.lookUp) lookUp = ', lookup:"' + options.lookUp + '"';

    //       console.log(options)
    const q = `{partners (limit:50 ${lookUp} ${search})
                    { 
                     ref 
                     name
                    } 
                 }`;

    //       console.log(q)
    return fetch(API_HOST, {
      method: "POST",
      body: JSON.stringify({ query: q }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(handleErrors)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        //                console.log(data.data.partners)

        return {
          data: data.data.partners,
          //                   totalCount: data.data.partners.length,
        };
      });
  },
});

const Orders = () => {
  const { user, signOut } = useAuth();
  //    const [errorLoading, setDialogOpen] = useState(false);
  const history = useHistory();
  const [currRow,setCurrRow] = useState({ref:''})

useEffect(() => {
  //etCurrRow()
  return () => {
    
  };
}, [])

  customDataSource.on("loaded", function (result) {
    if (result.errors) {
      console.log("loaded Some error:", result.errors);
      signOut();
    }
  });

  const setRow=(e)=>{
    var r
    if (e.row) r=e.row.data

    if (e.data) r=e.data
    
    if (r){
      r.ref = r._id.split('|')[1]
      setCurrRow(r)
    }  

    }
  // const classes = useStyles();

  const editIconClick = (e) => {
    console.log("Edit:", e);
    history.push("/order/" + e.row.key.split("|")[1]);
  };

  //     const sayHelloWorld = ()=> {
  //         //setDialogOpen(!dialogOpen)
  //         history.push('/order/72eae9aa-e11c-11ea-811a-00155da29310');
  // //        alert('Hello world!')
  //     }
  //customDataSource.on('')
  return (
    <div height="5rem">
      {/* <Popup
          visible={dialogOpen}
          onHiding={()=>{setDialogOpen(!dialogOpen)}}
          dragEnabled={false}
          closeOnOutsideClick={true}
          showTitle={true}
          title="Замовлення"
          //width={600}
          width="80%"
          //height={250}
        >
                <Order/>
                </Popup>
          <Button
                text="Click me"
                onClick={sayHelloWorld}
            /> */}
    <Menu
    onItemClick={(e) => {
      console.log('menu item:',e);
      switch(e.itemData.id){
      case "new": { history.push("/order/new");
                    break
                  }
      case "print": {
            var windowObjectReference = null;
            var winParam = '';// `width=${window.screen.width*8/10},left=${window.screen.width/10}`
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
        id:"new"
      },
      {
        text: "Закрити",
      },
      { text:"Друк",
            icon:"print",
              items:[
                {
                id:"print",
                text:"Рахунок",
                url:`https://1cweb.otk.in.ua/otk-base/hs/OTK?doc=buyers_order&ref=${currRow.ref}&rep=inv`,
     //           disabled:!data.number_doc,
              },
              {
                id:"print",
                text:"Договір",
       //         url:`https://1cweb.otk.in.ua/otk-base/hs/OTK?doc=buyers_order&ref=${id}&rep=dog`,
       //         disabled:!data.number_doc,
              },
              {
                id:"print",
                text:"Договір сертифікації",
       //         url:`https://1cweb.otk.in.ua/otk-base/hs/OTK?doc=buyers_order&ref=${id}&rep=dogs`,
                disabled:true,//!data.number_doc,
              },
              {
                id:"print",
                text:"Договір для Казначейства",
         //       url:`https://1cweb.otk.in.ua/otk-base/hs/OTK?doc=buyers_order&ref=${id}&rep=dogk`,
         //       disabled:!data.number_doc,
              },
        ]
      },  
    ]}></Menu>

      <DataGrid
        id="gridContainer"
        dataSource={customDataSource}
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
            <StateStoring enabled={true} type="localStorage" storageKey="orders" />
            <Selection mode="single" />
            <Scrolling mode="virtual" rowRenderingMode="virtual"  />
            <Paging  pageSize={100} />
            <FilterRow visible={true}  />
        {/* <Editing
            mode="batch" 
            allowUpdating={true}
            selectTextOnEditStart={true}
  //          startEditAction={this.state.startEditAction} 

            /> */}
        <Column type="buttons" width={40}>
          <CButton name="_edit" icon="edit" onClick={editIconClick} />
        </Column>

        <Column width={140}
          dataField="number_doc"
       
          caption="Номер"
          dataType="string"
          //format="currency"
          alignment="left"
          //          allowEditing={true}
        />
        <Column width={120}
          dataField="date"
          caption="Дата"
          dataType="date"
          //format="currency"
          alignment="left"
        />
        <Column width={400}
        allowSorting={false}
          dataField="partner.ref"
          caption="Контрагент"
          dataType="string"
          //format="currency"
          alignment="left"
          
          onEditorPreparing  = {(e)=>{
          console.log(e)
        }}

          calculateDisplayValue={(data) => {
            //                console.log(data) ;
            return data.partner?.name;
          }}>
  
          <Lookup 
//            dataSource={lookupDataSource}
            dataSource={partnerDataSource} allowClearing={true} 

            valueExpr="ref"
            displayExpr="name"
            minSearchLength={3}
      
            searchTimeout={500}>
         
            </Lookup>
        </Column>

        <Column width={100}
          allowSorting={false}
          dataField="doc_amount"
          caption="Сума"
          dataType="number"
          //format="currency"
          alignment="right"
        />
        <Column width={100}
          allowSorting={false}
          dataField="shipped"
          caption="Відвантажено"
          dataType="number"
          //format="currency"
          alignment="right"
        />
        <Column width={100}
          allowSorting={false}
          dataField="paid"
          caption="Сплачено"
          dataType="number"
          //format="currency"
          alignment="right"
        />
        <Column 
          allowSorting={false}
          dataField="note"
          caption="Коментар"
          dataType="number"
          //format="currency"
          alignment="left"
        />
      </DataGrid>
    </div>
  );
};

export default Orders;
