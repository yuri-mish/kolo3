import CustomStore from "devextreme/data/custom_store";
import { useState } from "react";

import { DropDownBox } from "devextreme-react/drop-down-box";
import { catLoad } from './../../utils/filtfunc';
import { DataGrid, Menu, Popup } from "devextreme-react";
import { Partner } from './../../pages/partner';
import { Column, FilterRow, Paging, Scrolling, Selection } from "devextreme-react/data-grid";
const cls_name = 'partners'
const cls_fields = 'ref name edrpou'

export const partnerDataSource = new CustomStore({
  key: "ref",

  byKey: (ref) => {
    if (!ref) return { ref: ref, name: "" };
    console.log("=2:", ref);
    const q = `{${cls_name} (ref:"${ref}" ) {${cls_fields} } }`;

    return (
      fetch("http://localhost:4000/", {
        method: "POST",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        //        .then(handleErrors)
        .then((response) => response.json())
        .then((response) => {
          const res =
            response.data[cls_name].length === 0
              ? { ref: ref, name: "" }
              : response.data[cls_name][0];
          console.log("=res:", res);
          return res;
        })
    );
  },

  load: (options) => {
    return catLoad(options,cls_name,cls_fields);
    
  },
  insert: (val) => {
    console.log("4:");
    return new Promise((resolve, reject) => {
      resolve([{ text: "Test insert" }]);
    });
  },
  remove: (key) => {
    console.log("5:");
    return new Promise((resolve, reject) => {
      resolve();
    });
  },
  update: (dat, values) => {
    console.log("6:");
    return new Promise((resolve, reject) => {
      resolve([{ text: "Test insert" }]);
    });
  },
});

export const PartnerBox = (props)=>{
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <DropDownBox
    width="100%"
    value={props.value}
    valueExpr="ref"
    deferRendering={false}
    displayExpr="name"
    placeholder="контрагент ..."
    showClearButton={false}
    dataSource={partnerDataSource}
  >
    <Menu
      onItemClick={(e) => {
        if (e.itemData.id === 'open')
          {console.log('=Відкрити=')
          setDialogOpen(!dialogOpen)
          }
        console.log(e);
      }}
      dataSource={[
        {
          text: "Відкрити",
          id:"open"
        },
        {
          text: "Додати",
        },
        {
          text: "Закрити",
          id:"close"
        },
        // {
        //   text: "Інше",
        //   items: [
        //     {
        //       text: " інше 1",
        //     },
        //     {
        //       text: "штше 2",
        //     },
        //   ],
        // },
      ]}></Menu>
    <Popup
        visible={dialogOpen}
        onHiding={()=>{setDialogOpen(!dialogOpen)}}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="-Контрагент-"
        width="80%"
        >

        <Partner _id={props.value}/>

      </Popup>      

    <DataGrid
      remoteOperations={true}
      dataSource={partnerDataSource}
      //      columns={["ref", "name", "edrpou"]}
      hoverStateEnabled={true}
      //selectedRowKeys={this.state.gridBoxValue}
      onSelectionChanged={(e) => {
        if(props.onChange){
          props.onChange(e)
        }
      }}
      height="90%">
      
      <Selection mode="single" />
      <Scrolling mode="virtual" rowRenderingMode="virtual" />
      <Paging enabled={true} pageSize={100} />
      <FilterRow visible={true} />
      <Column dataField="ref" visible={false} />
      <Column dataField="name" caption="Назва" />
      <Column dataField="edrpou" caption="код ЄДРПОУ" />
    </DataGrid>
  </DropDownBox>
  )
}
