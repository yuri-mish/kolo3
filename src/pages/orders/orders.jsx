import React from "react";
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
// import { useState } from 'react';
// import { Order } from './order';
// import { Popup } from 'devextreme-react';
import { useHistory } from "react-router-dom";


const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};

function filterObj (s){
  console.log(s)
  if (!Array.isArray(s[0])){
    var fld = s[0].split('.')[0]
    return {
        fld:fld,
        expr:s[1],
        val:s[2]}
  }
  var result =[]
  s.forEach(element => {
    var exp = element 
    if (Array.isArray(element)) exp = filterObj(element) 
      else exp = {c:element}
    result.push(exp)
  });
    return result
}

function convertToText(obj) {
  //create an array that will later be joined into a string.
  var string = [];

  //is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (obj === undefined || obj === null)  {
    return String(obj);
  } else if (typeof obj == "object" && obj.join === undefined) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
        string.push(prop + ": " + convertToText(obj[prop]));
    }
    return "{" + string.join(",") + "}";

    //is array
  } else if (typeof obj == "object" && !(obj.join === undefined)) {
    for (prop in obj) {
      string.push(convertToText(obj[prop]));
    }
    return "[" + string.join(",") + "]";

    //is function
  } else if (typeof obj == "function") {
    string.push(obj.toString());

    //all other values can be done with JSON.stringify
  } else {
    string.push(JSON.stringify(obj));
  }

  return string.join(",");
}


const customDataSource = new CustomStore({
  key: "_id",

  update: (dat) => {
    console.log(dat);
  },
  load: (options) => {
    console.log("=Options:" + JSON.stringify(options));
    ///////////////////////////////
    let _filter = "";
    if (options.filter && options.filter.length > 0) {
      console.log('test:',typeof options.filter.join(",")) 
      _filter = " filter:[";
      let ofilt = options.filter;
      var i = 0;
      if (Array.isArray(options.filter[0])) {
        ofilt.forEach((element) => {
          if (Array.isArray(element) && element[2].length > 2)
            _filter +=
              (i > 0 ? `,` : ` `) +
              `{field:"${element[0]}", expr:"${element[1]}", value:"${element[2]}"}`;
          i++;
        });
      } else {
        if (options.filter[2].length > 2)
          _filter += ` {field:"${options.filter[0]}", expr:"${options.filter[1]}", value:"${options.filter[2]}"}`;
      }
      _filter += "] ";
    }
    ///////////////////////////////////////
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

    var q = `{${_qT} buyers_orders(limit:${_limit} ${_search} ${_filter}${_sort}  ${_offset} ${_jsonFilter})
                    { 
                     _id
                     number_doc
                     date
                     doc_amount
                     partner { 
                         _id ref name 
                        } 

                    }
                 }`
  console.log ('=q=:',q)                 
    return fetch("http://localhost:4000/", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        query: q,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      //              mode:"no-cors" ,
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
    return fetch("http://localhost:4000/", {
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

  customDataSource.on("loaded", function (result) {
    if (result.errors) {
      console.log("loaded Some error:", result.errors);
      signOut();
    }
  });

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
      <DataGrid
        id="gridContainer"
        dataSource={customDataSource}
        allowColumnReordering={true}
        showBorders={true}
        allowSorting={true}
        remoteOperations={true}
        height={800}
        

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
            <StateStoring enabled={true} type="localStorage" storageKey="storage" />
            <Selection mode="single" />
            <Scrolling mode="virtual" rowRenderingMode="virtual"  />
            <Paging  pageSize={100} />
            <FilterRow visible={true} />
        {/* <Editing
            mode="batch" 
            allowUpdating={true}
            selectTextOnEditStart={true}
  //          startEditAction={this.state.startEditAction} 

            /> */}
        <Column type="buttons" width={110}>
          <CButton name="_edit" icon="edit" onClick={editIconClick} />
        </Column>

        <Column
          dataField="number_doc"
          caption="Номер"
          dataType="string"
          //format="currency"
          alignment="left"
          //          allowEditing={true}
        />
        <Column
          dataField="date"
          caption="Дата"
          dataType="date"
          //format="currency"
          alignment="left"
        />
        <Column
        allowSorting={false}
          dataField="partner.ref"
          caption="Контрагент"
          dataType="string"
          //format="currency"
          alignment="left"
          calculateDisplayValue={(data) => {
            //                console.log(data) ;
            return data.partner?.name;
          }}>
          <Lookup
            dataSource={lookupDataSource}
            valueExpr="ref"
            displayExpr="name"
            minSearchLength={3}
            searchTimeout={500}></Lookup>
        </Column>

        <Column
        allowSorting={false}
          dataField="doc_amount"
          caption="Сума"
          dataType="number"
          //format="currency"
          alignment="right"

          //          calculateCellValue={(data)=> {console.log(data) ; return data.partner?.name}}
        />
      </DataGrid>
    </div>
  );
};

export default Orders;
