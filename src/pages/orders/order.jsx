import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { TextBox, DateBox, Menu } from "devextreme-react";
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
  Texts,
} from "devextreme-react/data-grid";
import { v4 as uuid_v4 } from "uuid";

import { PartnerBox} from "../../db/ds/dsPartners";
import { nomsDataSource } from "../../db/ds/dsNoms";
import { useParams } from "react-router-dom";
import  notify  from 'devextreme/ui/notify';
import { useHistory } from 'react-router-dom';
import { convertToText } from "../../utils/filtfunc";
import { API_HOST } from './../../constants';

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

  const load = () => {
    return fetch(API_HOST, {
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
                      row content price quantity amount discount_percent discount_percent_automatic gos_code vin_code vat_rate vat_amount
                    }
                  }
                }`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        if (data.data.buyers_orders && data.data.buyers_orders.length > 0){
          data.data.buyers_orders[0].services.forEach((r)=>{
              const calcPrice = Math.round(r.amount/r.quantity,-2)
              r.nats = 0; r.spec = 0
              if (calcPrice > r.price)
                         r.nats = calcPrice - r.price
              if (calcPrice < r.price && r.discount_percent_automatic === 0)
                         r.spec = calcPrice           
            })
          setData(data.data.buyers_orders[0]);
          loadPrices(data.data.buyers_orders[0].date)
        }
        else {
          loadPrices()
        }
      });
  };

  const loadPrices = async (date)=>{
     
    if (!date) date = moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss")
    const datePatam= `(date:"${date}")`
    return fetch(API_HOST, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        query: `{prices ${datePatam} { nom price currency vat_included }}`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
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
    nomsDataSource.userOptions.selectServices = true;
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  locale("uk"); //!!!!+++
  console.log("=" + data.date);

  const onQuantityChanged = (r) => {
    calcrRow(rowData)
  };

  const calcrRow = (currentRowData) =>{
    var doc_amount=0
    if (!currentRowData.quantity) 
          currentRowData.quantity=1
    const pr = currentRowData.spec?currentRowData.spec:(currentRowData.price+(currentRowData.nats?currentRowData.nats:0))
    currentRowData.amount = pr * currentRowData.quantity;
    if (isNaN(currentRowData.amount)) currentRowData.amount = 0
    if (currentRowData.vat_rate==="НДС20") currentRowData.vat_amount = Math.round(currentRowData.amount/6, -2)
      else currentRowData.vat_amount=0
    data.services.forEach(r=>{doc_amount+= (r.row===currentRowData.row)?currentRowData.amount:r.amount})
    setData((prevState) => ({
      ...prevState,
      doc_amount:doc_amount,
      services: prevState.services.map((row) => {
          return (row.row === currentRowData.row)?currentRowData:row
      }),
    
    }));
    
  }
  const onchangeNom = async (newData, value, currentRowData)=>{
    //console.log('=newData=',newData,'=value=',value,'=currentRowDatar=',currentRowData) 
    var pricerow = prices.find((r)=>{return r.nom === value})
    currentRowData.price = pricerow?pricerow.price:0
    var res = await nomsDataSource.byKey(value)
    if (res) {
      currentRowData.content = res.name_full
      if (res.vat_rate) currentRowData.vat_rate = res.vat_rate
    }
    currentRowData.nom.ref = value
    currentRowData.amount = 0

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
  //width="200px"
  value={r.data.value}
  valueExpr="ref"
  deferRendering={false}
  displayExpr="name"
  placeholder="послуга ..."
  showClearButton={false}
  dataSource={nomsDataSource}
  dropDownOptions={{width:"800px"}}

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
     onSelectionChanged={(e) => {
      r.data.setValue(e.selectedRowsData[0].ref,e.selectedRowsData[0].name)
  //  console.log('===onSelectionChanged:',e);
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
          switch(e.itemData.id){
           case "ok": {
            var doctosave = _.cloneDeep(data)
            if (id==="new"){
              doctosave._id='doc.buyers_order|'+uuid_v4()
              doctosave.class_name="doc.buyers_order"
            }
            doctosave.partner=doctosave.partner.ref  
            if (doctosave.organization) doctosave.organization=doctosave.organization.ref  
            if (doctosave.responsible) delete doctosave.responsible  
            if (doctosave.number_doc) delete doctosave.number_doc

            doctosave.services.forEach(r=>{
              if (r.spec) delete r.spec
              if (r.nats) delete r.spec
              return r.nom = r.nom.ref
          })
            const q = JSON.stringify({
              query: `mutation{setBuyersOrder(input:${convertToText(doctosave)}) {
                    _id
                      }}`,
            });

            const response = await fetch(API_HOST, {
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
            break
          }
          case "close": {
              history.goBack();
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
          
        }}}
        dataSource={[
          {
            id: "ok",
            text: "Закрити і зберегти",
            icon:"save"
          },
          { id:"close",
            text: "Закрити",
            icon:"close"
          },
          { 
            text: "Зберегти", disabled:true
          },
          { text:"Друк",
            icon:"print",
              items:[
                {
                id:"print",
                text:"Рахунок",
                url:API_HOST+`/printform/${id}/inv`,
                disabled:!data.number_doc,
              },
              {
                id:"print",
                text:"Договір",
                url:API_HOST+`/printform/${id}/dog`,
                disabled:!data.number_doc,
              },
              {
                id:"print",
                text:"Договір сертифікації",
                url:API_HOST+`/printform/${id}/dogs`,
                disabled:false,//!data.number_doc,
              },
              {
                id:"print",
                text:"Договір для Казначейства",
                url:API_HOST+`/printform/${id}/dogk`,
                disabled:!data.number_doc,
              },
        ]
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
          <TextBox readOnly={true} value={data.number_doc} placeholder="...номер документа..." hint="номер документу присвоєний головним офісом"/>
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
          hint="дата документу"
          //                disabledDates={this.getDisabledDates}
        />
      </div>

      <div style={{ display: "flex", paddingTop: "1rem" }}>
        <TextBox value="Контрагент"></TextBox>
        <PartnerBox value={data.partner?.ref} onChange={(e) => {
              setData((prevState) => ({
                ...prevState,
                partner: {
                  ref: e.ref,
                  name: e.name
//                  name: e.selectedRowsData[0].name,
                },
              }));
            }}/>
      </div> 
      <div style={{ display: "flex" }}>
          <TextBox value="Особа"></TextBox>
          <TextBox  width= "80%" id="ClientPerson" value={data.ClientPerson} placeholder="...контактана особа..." onChange={changeReq}/>
          <div style={{ display: "flex", paddingRight: "1rem" }}>
          <TextBox value="Телефон"></TextBox>
          <TextBox id="ClientPersonPhone" value={data.ClientPersonPhone} placeholder="... номер телефон" onChange={changeReq}/>
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
          allowColumnResizing={true}
          columnResizingMode='widget'
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
              return data.nom?.name;
            }}
            setCellValue={onchangeNom}
            editCellComponent={cellTemplate}
            
            >
          </Column>
          <Column dataField="price" caption="Ціна" allowEditing={false} width={100}
            headerCellRender={ (data) =>{ return  <p 
                    //style={{ 'font-size': '16px' }
                    >Ціна<br/>(прайс) </p>;
            }}
          />
          <Column dataField="quantity" caption="Кількість"  width={80}/>
          <Column dataField="spec" caption="СпецЦіна" allowEditing={false} width={100}/>
          <Column dataField="discount_percent_automatic" caption="%скидки" allowEditing={false} width={80} />
           <Column dataField="nats" caption="Націнка" value={100} allowEditing={false} width={80}  /> {/* calculateCellValue={calcNats} */}
          <Column dataField="amount" caption="Сума" allowEditing={false} width={100}/>
          <Column dataField="gos_code" caption="Держ.номер" allowEditing={true}/>
          <Column dataField="vin_code" caption="VIN код" allowEditing={true}/>
        </DataGrid>
      </div>
      <div style={{ display: "flex", paddingRight: "1rem", width: "800" }}>
      <TextBox  width= "20%" value="Коментар"></TextBox>
          <TextBox  width= "80%"  id="note" value={data.note} placeholder="коментар" onChange={changeReq}/>
      </div>
    </div>
  );
};
