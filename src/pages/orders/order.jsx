import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { TextBox, DateBox, Menu } from "devextreme-react";
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { locale } from "devextreme/localization";
import moment from "moment";
//import Lookup from "devextreme-react/lookup";

//import { RemoteOperations } from "devextreme-react/data-grid";
import { DropDownBox} from "devextreme-react/drop-down-box";
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

import { partnerDataSource } from "./db/ds/dsPartners";
import { nomsDataSource } from "./db/ds/dsNoms";
import { useParams } from 'react-router-dom';


export const Order = (props) => {

  var rowData={}

  let { id } = useParams();

  const OrderSchema = {
    date: moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss"),
    number_doc: "",
    partner: { ref: "", name: "" },
    services: [{ nom: { ref: "", name: "" }, price: 0 }],
    doc_amount: 0,
  };

  const [data, setData] = useState(OrderSchema);

  const load = () => {
    return fetch("http://localhost:4000/", {
      method: "POST",
      credentials: 'include',
      body: JSON.stringify({
        query: `{buyers_orders(ref:"${id}",limit:1) {
                    _id
                    doc_amount
                    number_doc
                    date
                    partner{
                        ref
                        name
                    }
                    services {
                      nom {
                        _id
                        ref
                        name
                        name_full
                      }
                      row price quantity amount discount_percent
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
        if (data.data.buyers_orders.length > 0)
          setData(data.data.buyers_orders[0]);
        //totalCount: data.data.buyers_orders.length,
        //summary: response.summary,
        //groupCount: response.groupCount

        // return ()
      });

  };
  useEffect(() => {
    load();
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

  const onQuantityChanged = (r)=>{
    console.log('=99=',r);
    console.log('=00=',rowData);

    rowData.amount = rowData.price*r.srcElement.value;
    setData((prevState) => ({
      ...prevState,
      services: prevState.services.map((row)=>{
                if (row.row===rowData.row)
                  return rowData
                else return row  
                })
      
    }));
    

  }

  const addButtonOptions = {
    icon: 'plus',
    onClick: () => {
 
      var st = data.services.slice() 
      console.log('New row:',st)
      st.push({row:(data.services.length+1),nom:{ref:undefined,name:'<послуга>'}})
      setData((prevState) => ({
      ...prevState,
      services: st
    }))}
  };

  const deleteButtonOptions = {

    icon: 'minus',
    disabled:false,

    onClick: () => {
      
      var st = data.services.filter(row=>row.row !== rowData?.row)
      deleteButtonOptions.disabled = st.length === 0
//      console.log('delete row:',st)
      
      setData((prevState) => ({
      ...prevState,
      services: st 
    }))}
  };
  

  return (
    <div>

<div style={{display:"flex"}}>
           <div style={{display:"flex", paddingRight:"1rem"}}>
           <TextBox value="Номер"></TextBox> 
           <TextBox value={data.number_doc} placeholder="номер документа" />
           </div> 
           <TextBox value="Дата" ></TextBox>
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
              onValueChanged={onValueChanged}
              //                disabledDates={this.getDisabledDates}
            />
            </div>
    


            <div style={{display:"flex", paddingTop:"1rem"}}>
      
            <TextBox value="Контрагент" ></TextBox>
      
            <DropDownBox  width="100%"
              value={data.partner?.ref}
              valueExpr="ref"
              deferRendering={false}
              displayExpr="name"
              //              displayExpr={this.gridBox_displayExpr}
              placeholder="контрагент ..."
              showClearButton={false}
              dataSource={partnerDataSource}
              // onValueChanged={(e) => {

              //   console.log(e);
              // }}
              //             contentRender={dataGridRender}
            >
              <Menu
                onItemClick={(e) => {
                  console.log(e);
                }}
                dataSource={[
                  {
                    text: "Вибрати",
                  },
                  {
                    text: "Додати",
                  },
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
                dataSource={partnerDataSource}
                //      columns={["ref", "name", "edrpou"]}
                hoverStateEnabled={true}
                //selectedRowKeys={this.state.gridBoxValue}
                onSelectionChanged={(e) => {
                  setData((prevState) => ({
                    ...prevState,
                    partner: {
                      ref: e.selectedRowsData[0].ref,
                      name: e.selectedRowsData[0].name,
                    },
                  }));
                  //console.log(e);
                }}
                height="90%">
                <Selection mode="single" />
                <Scrolling mode="infinite" />
                <Paging enabled={true} pageSize={50} />
                <FilterRow visible={true} />
                <Column dataField="ref" visible={false} />
                <Column dataField="name" caption="Назва" />
                <Column dataField="edrpou" caption="код ЄДРПОУ" />
              </DataGrid>
            </DropDownBox>
       </div>           
      
      {/* <TextBox
        value={format(
          data.date ? Date.parse(data.date) : Date.now(),
          "dd-MM-yyyyHH:mm:ss"
        )}
        placeholder="дата документа"
        mask="00-00-0000 00:00:00"
      /> */}
      <div style={{paddingTop:"1rem"}}>
      <Toolbar > 
      <Item 
            location="before"
            locateInMenu="auto"
            widget="dxButton"
            options={addButtonOptions} 
       
            />
         
             <Item text="Add"  locateInMenu="always"/>
       </Toolbar>     
      <DataGrid 
       noDataText="Список порожній"
        remoteOperations={false}
        rowAlternationEnabled={true}
        showBorders={true}
        dataSource={data.services.slice()}
        //      columns={["ref", "name", "edrpou"]}
        hoverStateEnabled={true}
        //activeStateEnabled = {true}
        //selectedRowKeys={this.state.gridBoxValue}
        onValueChanged={(e) => {
          console.log('=999=',e)}}
        onSelectionChanged={(e) => {
          console.log('=9=',e);
          setData((prevState) => ({
            ...prevState,
            partner: {
              ref: e.selectedRowsData[0].ref,
              name: e.selectedRowsData[0].name,
            },
          }))
        }}
          selectTextOnEditStart={true}

          onInitNewRow={e=>{
        
            var st = data.services.slice() 
            console.log('New row:',st)
            st.push({row:(data.services.length+1),nom:{ref:undefined,name:'<послуга>'}})
            setData((prevState) => ({
            ...prevState,
            services: st
            }))
          }}
          onEditorPrepared={(e)=>{
            if (e.dataField === 'quantity') {
                rowData = e.row.data;
                e.editorElement.onchange = onQuantityChanged
                console.log(e)
          }}}
          onRowRemoved={(e)=>{
            console.log('Row remove',e) //+++
            
            var st = data.services.filter(row=>row.row !== e.data.row)
            var i = 1
            st.forEach(r=>{ r.row = i++ })
            setData((prevState) => ({
            ...prevState,
            services: st
            }))

            }}
        >
        <Editing
          mode="cell"
          allowUpdating={true}
          //allowAdding={true}
          allowDeleting={true}
          useIcons={true}
        >
                <Texts  confirmDeleteMessage="Вилучити?"  />

         
        </Editing>
        
        <Column
          dataField="nom.ref"
          caption="Номенклатура"
          calculateDisplayValue={(data) => {
            //                console.log(data) ;
            return data.nom?.name;
          }}>
          <Lookup
            dataSource={nomsDataSource}
            valueExpr="ref"
            displayExpr="name"
            minSearchLength={3}
            searchTimeout={500}></Lookup>
        </Column>
        <Column dataField="price" caption="Ціна" />
        <Column dataField="quantity" caption="Кількість" />
        <Column dataField="discount_percent" caption="%скидки" />
        <Column dataField="amount" caption="Сума" />
      </DataGrid>
      </div>
</div> 
  );
};
