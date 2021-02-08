/* eslint-disable react-hooks/exhaustive-deps */
import CustomStore from "devextreme/data/custom_store";
import { useCallback, useEffect, useRef, useState } from "react";

import { DropDownBox } from "devextreme-react/drop-down-box";
import { catLoad, handleErrors, showError } from "./../../utils/filtfunc";
import { DataGrid, Menu, Popup } from "devextreme-react";
import { Partner } from "./../../pages/partner";
import {
  Column,
  FilterRow,
  Paging,
  Scrolling,
  Selection,

} from "devextreme-react/data-grid";
import { v4 as uuid_v4 } from "uuid";

import { API_HOST, uaFilterRowText } from "./../../constants";
import { baseZIndex } from "devextreme/ui/overlay";
const cls_name = "partners";
const cls_fields =
  "ref name edrpou id parent is_buyer is_supplier legal_address note name_full individual_legal inn";

export const partnerDataSource = new CustomStore({
  key: "ref",
  byKey: (ref) => {
    if (!ref) return { ref: ref, name: "" };
    const q = `{${cls_name} (ref:"${ref}" ) {${cls_fields} } }`;
    return fetch(API_HOST, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ query: q }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(handleErrors)
      .then((response) => response.json())
      .then((response) => {
        return response.data[cls_name].length === 0
          ? { ref: ref, name: "" }
          : response.data[cls_name][0];
      });
  },
  load: (options) => {
    if (options.filter&&options.filter[0]==='ref') 
      return partnerDataSource.byKey(options.filter[2])
        return catLoad(options, cls_name, cls_fields);
  },
});

partnerDataSource.byEdrpou = async (edrpou) => {
  const options = { filter: ["edrpou", "=", edrpou] };
  const res = await catLoad(options, cls_name, cls_fields);
  return res.data && res.data.length > 0 ? res.data[0] : undefined;
};

export const PartnerBox = (props) => {
  const [_partner,set_Partner] = useState({ref:''})
  const [dialogOpen, setDialogOpen] = useState(false);
  let currentRowData = useRef().current;
  const ddbox = useRef();
  const dgrid = useRef();
console.log(_partner)
  // const currentRowData_byKeyAsync = async (key) => {
    
  // };

  useEffect(() => {
      if (props.value) set_Partner({ref:props.value})
  }, [props.value])


  //  useEffect(() => {
  //    if (props.value) {
  //      partnerDataSource.byKey(props.value).then(newObj=>{
  //        currentRowData = newObj?newObj:{ ref: props.value };
  //      });
  //    }
  //  }, [props.value])//props.value]);

  const viewButton = {
    icon: "search",
    type: "normal",
    onClick: async () => {
 //     if (!currentRowData)
//      currentRowData = await partnerDataSource.byKey(props.value);
     // partnerDataSource.byKey(props.value).then(resp=>{currentRowData=resp})
      setDialogOpen(true);
   //   ddbox.current.instance.open();
    },
  };

  const selectHandler = useCallback(
    (rowData) => {
      if (props.onChange) props.onChange(rowData);
      ddbox.current.instance.close();
    },
    [props]
  );

  const clickMenu = useCallback(
    (e) => {
      if (e.itemData.id === "open") setDialogOpen(true);
      if (e.itemData.id === "select") {
        if (currentRowData)
          selectHandler(currentRowData)
        else showError('Не вибрано контрагента...')
      }
      if (e.itemData.id === "new") {
        currentRowData = { ref: uuid_v4() };
        setDialogOpen(true);
      }
      if (e.itemData.id === "close") {
        ddbox.current.instance.close();
      }
      console.log(e);
    },
    [selectHandler]
  );

  return (
    <div style={{ display: "flex",width:'100%' }}>
    
    <DropDownBox
      ref={ddbox}
      width="100%"
//      value={props.value}
      value={_partner.ref}
      valueExpr="ref"
      deferRendering={false}
      displayExpr="name"
      placeholder="контрагент ..."
      showClearButton={true}
      dataSource={partnerDataSource}
      buttons={[
        "dropDown","clear",
        { name: "search", location: "after", options: viewButton },
      ]}>
      <Menu
        onItemClick={clickMenu}
        dataSource={[
          {
            text: "Вибрати",
            id: "select",
            visible: props.onChange !== undefined,
          },
          {
            text: "Відкрити",
            id: "open",
          },
          {
            text: "Додати",
            id: "new",
          },
          {
            text: "Закрити",
            id: "close",
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

     

      <DataGrid
        ref={dgrid}
        remoteOperations={true}
        dataSource={partnerDataSource}
        onFocusedRowChanged={(e) => {
          if (e.row) currentRowData = e.row.data;
          else currentRowData = { name: "", ref: "" };
          //        console.log(e)
        }}
        hoverStateEnabled={true}
        //     focusedRowEnabled = {true}
        focusedRowKey={props.value}
        onRowDblClick={(e) => {
          selectHandler(e.data);
        }}
        onSelectionChanged={(e) => {
          if (e.selectedRowsData.length) {
            currentRowData = e.selectedRowsData[0];
            //         setId(e.selectedRowsData[0].ref)
          }
        }}
        height="90%">
        {/* <StateStoring enabled={true} type="localStorage" storageKey="storageP" /> */}
        <Selection mode="single" />
        <Scrolling mode="virtual" rowRenderingMode="virtual" />
        <Paging enabled={true} pageSize={100} />
        <FilterRow visible={true} {...uaFilterRowText} />
        <Column dataField="ref" visible={false} />
        <Column
          dataField="name"
          caption="Назва"
          filterOperations={["contains", "startswith", "endswith"]}
        />
        <Column
          dataField="edrpou"
          caption="код ЄДРПОУ"
          filterOperations={["startswith"]}
        />
      </DataGrid>
    </DropDownBox>
   
   <div style={{zIndex:"2000"}}> <Popup 
        visible={dialogOpen}
        onHiding={() => {
          setDialogOpen(false);
        }}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showTitle={true}
        title="-Контрагент-"
        width="75%">
       <Partner
          _id={currentRowData ? currentRowData : props.value}
        />
      </Popup>
      </div>
    </div>
  );
};
