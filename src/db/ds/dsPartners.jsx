import CustomStore from "devextreme/data/custom_store";
import { useRef, useState } from "react";

import { DropDownBox } from "devextreme-react/drop-down-box";
import { catLoad } from './../../utils/filtfunc';
import { DataGrid, DropDownBoxButton, Menu, Popup } from "devextreme-react";
import { Partner } from './../../pages/partner';
import { Column, FilterRow, Paging, Scrolling, Selection, StateStoring } from "devextreme-react/data-grid";
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
  
  const ddbox = useRef()  
  const dgrid = useRef()
  const viewButton = {
  icon: 'search',
  type: 'normal',//'default',
  onClick: () => {
    setDialogOpen(true)
    ddbox.current.instance.open()
  }
};

  return (
    <DropDownBox 
    ref = {ddbox}
    width="100%"
    value={props.value}
    valueExpr="ref"
    deferRendering={false}
    displayExpr="name"
    placeholder="контрагент ..."
    showClearButton={false}
    dataSource={partnerDataSource}
    buttons={[ 'dropDown',{name:"search", location:"after",options:viewButton}]}
   

  >
   

   <Menu
      onItemClick={(e) => {
        if (e.itemData.id === 'open')
          {console.log('=Відкрити=')
          setDialogOpen(true)
          }
        if (e.itemData.id ==='close')
        {ddbox.current.instance.close()}  
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
        
       
        onHiding={()=>{setDialogOpen(false)}}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="-Контрагент-"
        width="80%"
        >
       
        <Partner _id={props.value}/>
      </Popup>      
     

    <DataGrid
    ref = {dgrid}
      remoteOperations={true}
      dataSource={partnerDataSource}
      //      columns={["ref", "name", "edrpou"]}
      hoverStateEnabled={true}
      focusedRowEnabled = {true}
      focusedRowKey = {props.value}
      

      onSelectionChanged={(e) => {
        if(props.onChange && e.selectedRowsData.length){
          props.onChange(e)
        }
        
      }}
      height="90%">
      
      {/* <StateStoring enabled={true} type="localStorage" storageKey="storageP" /> */}
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
