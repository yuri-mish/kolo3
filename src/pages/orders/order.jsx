import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { TextBox, DateBox, Menu, Popup } from "devextreme-react";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { locale } from "devextreme/localization";
import moment from "moment";
//import {lodash as _ } from "lodash"
//import Lookup from "devextreme-react/lookup";
//import { RemoteOperations } from "devextreme-react/data-grid";
import { DropDownBox } from "devextreme-react/drop-down-box";
import DataGrid, {
  Selection,
  Paging,
  FilterRow,
  Scrolling,
  Column,
  Editing,
  Lookup,
  Texts,
} from "devextreme-react/data-grid";
import { uuid } from 'uuidv4';

import { partnerDataSource , PartnerBox} from "../../db/ds/dsPartners";
import { nomsDataSource } from "../../db/ds/dsNoms";
import { useParams } from "react-router-dom";
import  notify  from 'devextreme/ui/notify';
import { useHistory } from 'react-router-dom';
import { ChartTitleSubtitle } from "devextreme-react/chart";
import { convertToText } from "../../utils/filtfunc";
import { Partner } from "../partner";

var _ = require('lodash');

export const Order = (props) => {
  const history = useHistory();

  var rowData = {};

  let { id } = useParams();

  const OrderSchema = {
    date: moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss"),
    number_doc: "",
    class_name:"doc.buyers_order",
    partner: { ref: "", name: "" },
    services: [{ nom: { ref: "", name: "" }, price: 0 }],
    doc_amount: 0,
    vat_included:true,
    doc_currency:'',
  };

  const [data, setData] = useState(OrderSchema);

  const [prices, setPrices] = useState();
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    return fetch("http://localhost:4000/", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        query: `{buyers_orders(ref:"${id}",limit:1) {
                    _id
                    doc_amount
                    vat_included
                    number_doc
                    date
                    partner{ref name}
                    organization{ref name}
                    ClientPerson
                    ClientPersonPhone
                    responsible {ref name}
                    note
                    services {
                      nom {
                        _id
                        ref
                        name
                        name_full
                      }
                      row content price quantity amount discount_percent gos_code vin_code vat_rate vat_amount
                    }
                  }
                }`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      //              mode:"no-cors" ,
    })
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        if (data.data.buyers_orders && data.data.buyers_orders.length > 0){
          setData(data.data.buyers_orders[0]);
          loadPrices(data.data.buyers_orders[0].date)
        }
        else {
          loadPrices()
        }
        // return ()
      });
  };

  const loadPrices = async (date)=>{
     
    if (!date) date = moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss")
    const datePatam= `(date:"${date}")`
    return fetch("http://localhost:4000/", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        query: `{prices ${datePatam} { nom price currency vat_included }}`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      //              mode:"no-cors" ,
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log('=prices response:',data);
        var pr = []
        if (data.data.prices && data.data.prices.length > 0){
          pr = data.data.prices
          const vat_included = pr[0].vat_included === 'true'
          const doc_currency = pr[0].currency
          setData((prevState) => ({
            ...prevState,
            vat_included:vat_included,
            doc_currency:doc_currency
          }));
        }
          setPrices(pr);
          return pr
      });
  };

  
  useEffect(() => {
    load();
    loadPrices();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onValueChanged = (param) => {
    setData((prevState) => ({
      ...prevState,
      date: moment(param.value).format("YYYY-MM-DDTHH:mm:ss"),
    }));
  };

  locale("uk"); //!!!!+++
  console.log("=" + data.date);

  const onQuantityChanged = (r) => {
    calcrRow(rowData)

  };

  const calcrRow = (currentRowData) =>{
    var doc_amount=0
    currentRowData.amount = currentRowData.price * currentRowData.quantity;
    if (isNaN(currentRowData.amount)) currentRowData.amount = 0
    if (currentRowData.vat_rate==="НДС20") currentRowData.vat_amount = Math.round(currentRowData.amount/6, -2)
    data.services.forEach(r=>{doc_amount+= (r.row===currentRowData.row)?currentRowData.amount:r.amount})
    setData((prevState) => ({
      ...prevState,
      doc_amount:doc_amount,
      services: prevState.services.map((row) => {
        if (row.row === currentRowData.row) return currentRowData;
        else return row;
      }),
    
    }));
    
  }
  const onchangeNom = async (newData, value, currentRowData)=>{
    console.log('=newData=',newData,'=value=',value,'=currentRowDatar=',currentRowData) 
    var pricerow = prices.find((r)=>{return r.nom === value})
    currentRowData.price = pricerow?pricerow.price:0
    var res = await nomsDataSource.byKey(value)
    if (res) {
      currentRowData.content = res.name_full
      if (res.vat_rate) currentRowData.vat_rate = res.vat_rate
    }
    currentRowData.nom.ref = value

    calcrRow(currentRowData)
    
    console.log('price=',currentRowData.price)
  }

  const onchangeDate = async (param)=>{
    setData((prevState) => ({
      ...prevState,
      date: moment(param.value).format("YYYY-MM-DDTHH:mm:ss"),
    }));
    const newprice = await loadPrices(moment(param.value).format("YYYY-MM-DDTHH:mm:ss"))
    data.services.forEach((row)=>{
      var pricerow = newprice.find((priceRow)=>{return priceRow.nom === row.nom.ref})
      row.price = pricerow?pricerow.price:0
      calcrRow(row)
    })
  }
  const addButtonOptions = {
    icon: "plus",
    onClick: () => {
      var st = data.services.slice();
      console.log("New row:", st);
      st.push({
        row: data.services.length + 1,
        nom: { ref: undefined, name: "<послуга>" },
      });
      setData((prevState) => ({
        ...prevState,
        services: st,
      }));
    },
  };

  const deleteButtonOptions = {
    icon: "minus",
    disabled: false,

    onClick: () => {
      var st = data.services.filter((row) => row.row !== rowData?.row);
      deleteButtonOptions.disabled = st.length === 0;
      //      console.log('delete row:',st)

      setData((prevState) => ({
        ...prevState,
        services: st,
      }));
    },
  };



  const showError = (message)=>{
                    notify({message:message,position: { at: 'center'}}, "error", 5000);
  }

const cellTemplate = (r)=>{
  return (
    
  <DropDownBox
  width="250px"
  value={r.data.value}
  valueExpr="ref"
  deferRendering={false}
  displayExpr="name"
  //              displayExpr={this.gridBox_displayExpr}
  placeholder="послуга ..."
  showClearButton={false}
  dataSource={nomsDataSource}
  dropDownOptions={{width:"888px"}}
  //  onValueChanged={(e) => {

  //    console.log(e);
  //  }}
  //             contentRender={dataGridRender}
>

  <Menu
    onItemClick={(e) => {
      console.log('menu item:',e);
    }}
    dataSource={[
      {
        text: "Вибрати",
      },
      // {
      //   text: "Додати",
      // },
      {
        text: "Закрити",
      },
      {
        text: "Інше",
        items: [
          {
            text: " інше 1",
          },
          {
            text: "штше 2",
          },
        ],
      },
    ]}></Menu>

  <DataGrid
    remoteOperations={true}
    dataSource={nomsDataSource}

    hoverStateEnabled={true}
    
    //selectedRowKeys={this.state.gridBoxValue}
     onSelectionChanged={(e) => {
    //   setData((prevState) => ({
    //     ...prevState,
    //     partner: {
    //       ref: e.selectedRowsData[0].ref,
    //       name: e.selectedRowsData[0].name,
    //     },
    //   }));
    r.data.setValue(e.selectedRowsData[0].ref,e.selectedRowsData[0].name)
    //r.data.row.content = e.selectedRowsData[0].name_full
    console.log('===onSelectionChanged:',e);
    }}
    
    height="90%">
    
    <Selection mode="single" />
    <Scrolling mode="virtual" rowRenderingMode="virtual" />
    <Paging enabled={true} pageSize={200} />
    <FilterRow visible={true} />
    <Column dataField="ref" visible={false} />
    <Column dataField="name" caption="Назва" width="150px"/>
    <Column dataField="name_full" caption="Повна назва"/> 
    
  </DataGrid>
  
</DropDownBox>

  )
}

const changeReq = (e)=>{
  setData((prevState) => ({
      ...prevState,
      [e.element.id]:e.event.target.value
    
    }));
}

  return (
    <div>
      <Menu
        onItemClick={async e => {
          if (e.itemData.id === "ok") {
            var doctosave = _.cloneDeep(data)
            if (id==="new"){
              doctosave._id='doc.buyers_order|'+uuid()
              doctosave.class_name="doc.buyers_order"
            }
            doctosave.partner=doctosave.partner.ref  
            if (doctosave.organization) doctosave.organization=doctosave.organization.ref  
            if (doctosave.responsible) delete doctosave.responsible  

            
            doctosave.services.forEach(r=>{
              return r.nom = r.nom.ref
              })
            const q = JSON.stringify({
              query: `mutation{setBuyersOrder(input:${convertToText(doctosave)}) {
                    _id
                      }}`,
            });

            const response = await fetch("http://localhost:4000/", {
              method: "POST",
              credentials: "include",
              body: q,
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log(response);
            const datar = await response.json();
            console.log(datar);
            if (datar.errors) {
              datar.errors.forEach(err => {
                showError("Помилка запису: " + err.message);
              });
            }
            else { history.goBack(); }
          }
          if (e.itemData.id === "close") {
              history.goBack();
          }
          
        }}
        dataSource={[
          {
            id: "ok",
            text: "Закрити і зберегти",
          },
          { id:"close",
            text: "Закрити",
          },
          { 
            text: "Зберегти", disabled:true
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
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", paddingRight: "1rem" }}>
          <TextBox disabled={true} value="Номер"></TextBox>
          <TextBox readOnly={true} value={data.number_doc} placeholder="номер документа" />
        </div>
        <TextBox value="Дата"></TextBox>
        <DateBox
          id="date"
          type="datetime"
          //        min={this.minDate}
          //                max={this.now}
          //defaultValue ={Date.now()}

          value={
            data.date
            //                        data.date?Date.parse(data.date):Date.now()
          }
          displayFormat={"dd-MM-yyyy HH:mm:ss"}
          useMaskBehavior={true}
          onValueChanged={onchangeDate}
          //                disabledDates={this.getDisabledDates}
        />
      </div>

      <div style={{ display: "flex", paddingTop: "1rem" }}>
        <TextBox value="Контрагент"></TextBox>
        <PartnerBox value={data.partner?.ref} onChange={(e) => {
              setData((prevState) => ({
                ...prevState,
                partner: {
                  ref: e.selectedRowsData[0].ref,
                  name: e.selectedRowsData[0].name,
                },
              }));
            }}/>
      </div> 
      <div style={{ display: "flex" }}>
          <TextBox value="Особа"></TextBox>
          <TextBox  width= "80%" id="ClientPerson" value={data.ClientPerson} placeholder="контактана особа" onChange={changeReq}/>
          <div style={{ display: "flex", paddingRight: "1rem" }}>
          <TextBox value="Телефон"></TextBox>
          <TextBox id="ClientPersonPhone" value={data.ClientPersonPhone} placeholder="контактаний телефон" onChange={changeReq}/>
        </div>
        </div> 

      <div style={{ paddingTop: "1rem" }}>
        <Toolbar>
          <Item
            location="before"
            locateInMenu="auto"
            widget="dxButton"
            options={addButtonOptions}
          />

          <Item text="Add" locateInMenu="always" />
        </Toolbar>
        <DataGrid
          noDataText="Список порожній"
          remoteOperations={false}
          rowAlternationEnabled={true}
          showBorders={true}
//          dataSource={data.services.slice()}
          dataSource={data.services.map((r)=>{return r})}
         
          hoverStateEnabled={true}
          //activeStateEnabled = {true}
          //selectedRowKeys={this.state.gridBoxValue}
          onValueChanged={(e) => {
            console.log("=999=", e);
          }}
          onSelectionChanged={(e) => {
            console.log("=9=", e);
            setData((prevState) => ({
              ...prevState,
              partner: {
                ref: e.selectedRowsData[0].ref,
                name: e.selectedRowsData[0].name,
              },
            }));
          }}
          selectTextOnEditStart={true}
          onInitNewRow={(e) => {
            var st = data.services.slice();
            console.log("New row:", st);
            st.push({
              row: data.services.length + 1,
              nom: { ref: undefined, name: "<послуга>" },
            });
            setData((prevState) => ({
              ...prevState,
              services: st,
            }));
          }}
          onEditorPrepared={(e) => {
            rowData = e.row.data;
            if (e.dataField === "quantity") {
              e.editorElement.onchange = onQuantityChanged;
              console.log(e);
            }
          }}
          onRowRemoved={(e) => {
            console.log("Row remove", e); //+++

            var st = data.services.filter((row) => row.row !== e.data.row);
            var i = 1;
            st.forEach((r) => {
              r.row = i++;
            });
            setData((prevState) => ({
              ...prevState,
              services: st,
            }));
          }}>
          <Editing
            mode="cell"
            allowUpdating={true}
            //allowAdding={true}
            allowDeleting={true}
            useIcons={true}>
            <Texts confirmDeleteMessage="Вилучити?" />
          </Editing>

          <Column
            dataField="nom.ref"
            caption="Номенклатура"
            calculateDisplayValue={(data) => {
              //                console.log(data) ;
              return data.nom?.name;
            }}
            setCellValue={onchangeNom}
            editCellComponent={cellTemplate}
            
            >
            {/* <Lookup
              dataSource={nomsDataSource}
              valueExpr="ref"
              displayExpr="name"
              minSearchLength={3}
              searchTimeout={500}
              > */}
            
              {/* <DataGrid
            remoteOperations={true}
            dataSource={nomsDataSource}
            //      columns={["ref", "name", "edrpou"]}
            hoverStateEnabled={true}
            //selectedRowKeys={this.state.gridBoxValue}
            // onSelectionChanged={(e) => {
            //   setData((prevState) => ({
            //     ...prevState,
            //     partner: {
            //       ref: e.selectedRowsData[0].ref,
            //       name: e.selectedRowsData[0].name,
            //     },
            //   }));
            //   //console.log(e);
            // }}
            height="90%">
            
            <Selection mode="single" />
            <Scrolling mode="virtual" rowRenderingMode="virtual" /> 
            <Paging enabled={true} pageSize={100} />
            <FilterRow visible={true} />
            <Column dataField="ref" visible={false} />
            <Column dataField="name" caption="Назва" />
          </DataGrid> */}

              {/* </Lookup> */}
          </Column>
          <Column dataField="price" caption="Ціна" allowEditing={false} />
          <Column dataField="quantity" caption="Кількість" />
          <Column dataField="discount_percent" caption="%скидки" allowEditing={false}/>
          <Column dataField="amount" caption="Сума" allowEditing={false}/>
        </DataGrid>
      </div>
      <div style={{ display: "flex", paddingRight: "1rem", width: "800" }}>
      <TextBox  width= "20%" value="Коментар"></TextBox>
          <TextBox  width= "80%"  id="note" value={data.note} placeholder="коментар" onChange={changeReq}/>
      </div>
    </div>
  );
};
