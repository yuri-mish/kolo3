import CustomStore from "devextreme/data/custom_store";
import { useCallback, useEffect, useRef, useState } from "react";

import { DropDownBox } from "devextreme-react/drop-down-box";
import { catLoad } from './../../utils/filtfunc';
import { DataGrid, DropDownBoxButton, Menu, Popup } from "devextreme-react";
import { Partner } from './../../pages/partner';
import { Column, FilterRow, Paging, Scrolling, Selection, StateStoring } from "devextreme-react/data-grid";
import { v4 as uuid_v4 } from "uuid";

import { API_HOST } from './../../constants';
const cls_name = 'partners'
const cls_fields = 'ref name edrpou id parent is_buyer is_supplier legal_address note name_full individual_legal inn'

export const partnerDataSource = new CustomStore({
  key: "ref",


  byKey: (ref) => {
    if (!ref) return { ref: ref, name: "" };
    console.log("=2:", ref);
    const q = `{${cls_name} (ref:"${ref}" ) {${cls_fields} } }`;

    return (
      fetch(API_HOST, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
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

partnerDataSource.byEdrpou = async (edrpou)=>{
    const options={filter:["edrpou","=",edrpou]}
    const res = await catLoad(options,cls_name,cls_fields);
    if (res.data &&res.data.length>0)
      return res.data[0]
    else return undefined  
}

export const PartnerBox = (props)=>{
  const [dialogOpen, setDialogOpen] = useState(false);
//  const [id, setId] = useState();
  const currentRowData = useRef();
//  console.log('currentRowData',currentRowData.current,'\nid:',id,'value',props.value)
  const ddbox = useRef()  
  const dgrid = useRef()

 const currentRowData_byKeyAsync = async (key)=>{
   var newObj = await partnerDataSource.byKey(key)
   if (!newObj) newObj = {ref:key}
    currentRowData.current = newObj
 }
  useEffect( () => {
    
    if (!currentRowData.current) currentRowData.current = {ref:props.value}
    currentRowData_byKeyAsync(props.value)
    
  //  setId(prev => props.value)
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  const viewButton = {
  icon: 'search',
  type: 'normal',//'default',
  onClick: async () => {
   // setId(id)
    if (!currentRowData.current) {currentRowData.current = await partnerDataSource.byKey(props.value)}
   
    setDialogOpen(true)
    ddbox.current.instance.open()
  }
};

  const selectHandler = (rowData)=>{
    if (props.onChange) props.onChange(rowData)
    ddbox.current.instance.close()
  }

  const clickMenu = useCallback(
    (e) => {
        if (e.itemData.id === 'open') {
          setDialogOpen(true)
          }
        if (e.itemData.id === 'select'){
          selectHandler(currentRowData.current)
          }
        if(e.itemData.id === 'new')  {
         
          currentRowData.current = {ref:uuid_v4()}
          setDialogOpen(true)
        }
        if (e.itemData.id ==='close')
        {ddbox.current.instance.close()}  
        console.log(e);
      },
    [],
  )

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
      onItemClick={clickMenu}
      dataSource={[
        {
          text: "Вибрати",
          id:"select",
          visible: props.onChange !== undefined
        },
        {
          text: "Відкрити",
          id:"open"
        },
        {
          text: "Додати",
          id:"new"
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
        dragEnabled={true}
        closeOnOutsideClick={true}
        showTitle={true}
        title="-Контрагент-"
        width="75%"
        >
        <Partner _id={currentRowData.current?currentRowData.current:props.value}/>
      </Popup>      
     

    <DataGrid
    ref = {dgrid}
      remoteOperations={true}
      dataSource={partnerDataSource}
      onFocusedRowChanged={(e)=>{
                if (e.row) currentRowData.current = e.row.data
                else currentRowData.current = {name:'',ref:''}
     //   console.log(e)
      }}
      hoverStateEnabled={true}
 //     focusedRowEnabled = {true}
      focusedRowKey = {props.value}
      
      onRowDblClick={(e)=>{
        selectHandler(e.data)
      }}
      onSelectionChanged={(e) => {
        if(e.selectedRowsData.length){
          currentRowData.current = e.selectedRowsData[0]
 //         setId(e.selectedRowsData[0].ref)
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
