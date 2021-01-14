import React, { useEffect, useState } from "react";
import { Button, Form, Menu, Popup, TextArea } from 'devextreme-react';
import { useAuth } from "../contexts/auth";
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { partnerDataSource } from './../db/ds/dsPartners';
import { GroupItem, ButtonItem, ButtonOptions, Item, Label, SimpleItem } from "devextreme-react/form";
import {
  Validator,
  RequiredRule,
  CompareRule,
  EmailRule,
  PatternRule,
  StringLengthRule,
  RangeRule,
  AsyncRule,
  CustomRule,
} from 'devextreme-react/form';
import { API_HOST } from './../constants';
import { tstJSON } from "../app-info";
import  notify  from 'devextreme/ui/notify';
import { LoadPanel } from 'devextreme-react/load-panel';
import { convertToText } from "../utils/filtfunc";

var _ = require('lodash');

export const Partner = (props)=>{
    
//    const history = useHistory()  
    let { id } = useParams();

    const handleOpenDataBot = (e)=>{
      setloadPanelVisible(true)
      const findVal = (obj, key)=> {
        var seen = new Set, active = [obj];
        while (active.length) {
            var new_active = [], found = [];
            for (var i=0; i<active.length; i++) {
                // eslint-disable-next-line no-loop-func
                Object.keys(active[i]).forEach((k)=>{
                    var x = active[i][k];
                    if (k === key) {
                        found.push(x);
                    } else if (x && typeof x === "object" &&
                               !seen.has(x)) {
                        seen.add(x);
                        new_active.push(x);
                    }
                });
            }
            if (found.length) return found;
            active = new_active;
        }
        return null;
    }

 //     const tJSON = JSON.parse(tstJSON.replace(/\\/g,'\\'))
 //     console.log(findVal(tJSON, 'pdv'))
 //    return ;


      fetch(API_HOST, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          query: `{opendatabot(kod:"${partner.edrpou}")}`,
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
          setloadPanelVisible(false)

           if (data.data.opendatabot && data.data.opendatabot.full_name){
             const botPartner = data.data.opendatabot
             const inn = findVal(botPartner,'pdv')

             setPartner((prevState) => ({
              ...prevState,
              name:botPartner.short_name,
              name_full:botPartner.full_name,
              is_buyer:true,
              individual_legal:'ЮрЛицо',
              inn:inn?inn[0].number:'',
              note:!prevState.note?JSON.stringify(botPartner):prevState.note
            }));

           } 
           else{
              notify({message:'Не знайдено!!!', position:'center center'}, 'error', 2000);
              setPartner({}
              );
  
           }


        });
    };
      
    const setP = async (id)=>{
     const partn = await partnerDataSource.byKey(id).then((data)=>{
      setPartner(data)
      return data 
      
    })   
    return partn
    }

    const [ partner, setPartner ] = useState();
    const [ buttonFEnabled, setButtonFEnabled ] = useState(true);
    const [ loadPanelVisible, setloadPanelVisible ] = useState(false);
    
     
    useEffect(() => {
      setP(props._id.ref);
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props._id]);

  const noteRender = (data)=>{
    return (
      <TextArea spellcheck={false}
         value = {(partner && partner.note)?partner.note:''}
         onValueChanged={(nValue)=>setPartner((prevState) => ({
              ...prevState,
              note:nValue
            }))}
      />
  );

  }
  
  const position = { of: '#form' };
 
  const showError = (message)=>{
    notify({message:message,position: { at: 'center'}}, "error", 5000);
}
  const asyncRule = (value)=>{
      return new Promise((resolve) => {
      resolve((''+value.value).length === 8 ||  (''+value.value).length === 10);
    });
  }


  return (
      <div>
        <LoadPanel
   //       shadingColor="rgba(0,0,0,0.4)"
          position={position}
          message="Завантаження..."
          onHiding={setloadPanelVisible}
          visible={loadPanelVisible}
          showIndicator={true}
   //       shading={this.state.shading}
          showPane={true}
   //       closeOnOutsideClick={this.state.closeOnOutsideClick}
        />
       <Menu
      onItemClick={async (e) => {
        if (e.itemData.id === 'save'){
            var doctosave = _.cloneDeep(partner)
            var ref = doctosave.ref
            if (!doctosave.id || doctosave.id===''){
              doctosave._id='cat.partners|'+ref
              doctosave.class_name="cat.partners"
            }
            // doctosave.partner=doctosave.partner.ref  
            // if (doctosave.organization) doctosave.organization=doctosave.organization.ref  
             if (doctosave.ref) delete doctosave.ref  

            //doctosave.savetime = moment.now()

            
            // doctosave.services.forEach(r=>{
            //   if (r.spec) delete r.spec
            //   if (r.nats) delete r.spec
            //   return r.nom = r.nom.ref
            //   })
            const q = JSON.stringify({
              query: `mutation{setPartner(input:${convertToText(doctosave)}) {
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
            else {
              // history.goBack(); 
              notify({message:"Записано",position: { at: 'center'}}, "success", 5000);
              }
          }
        if (e.itemData.id ==='close'){
        // {ddbox.current.instance.close()}  
        // console.log(e);
      }}
      }
      dataSource={[
        {
          text: "Зберегти",
          id:"save"
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
        <Form
            id="form"
            formData={partner}
            //readOnly={readOnly}
            showColonAfterLabel={true}
            labelLocation={'left'}
//            minColWidth={300}
//            colCount={4}
            width={1000}
          >
         <GroupItem colCount={4} >
            <SimpleItem  dataField="id"  editorOptions={{ disabled: false }}><Label text="Код"/></SimpleItem> 
            <GroupItem colSpan={2}>
              <SimpleItem dataField="edrpou" 
                activeStateEnabled={true} 
                editorOptions={{ disabled: false,}}>
                <Label text="Код ЄДРПОУ"/> 
                <AsyncRule
                  message="Неправильний код"
                  validationCallback={asyncRule} />
              </SimpleItem>
            </GroupItem>
            <ButtonItem horizontalAlignment="left"  > 
                <ButtonOptions   
                  text="Знайти" type="success" disabled={false}
                  onClick={handleOpenDataBot} />
            </ButtonItem>    
            
            </GroupItem>
            <GroupItem colCount={4}>
          <SimpleItem  colSpan={3} dataField="name"  editorOptions={{ disabled: false }}><Label text="Найменування"/></SimpleItem> 
          <SimpleItem  colSpan={1} classname="cb"  editorType="dxCheckBox" dataField="is_buyer"  editorOptions={{ disabled: false }}><Label text="Покупець"/></SimpleItem> 
          </GroupItem>
          <GroupItem colCount={4}>
          <SimpleItem  colSpan={3} dataField="name_full"  editorOptions={{ disabled: false }}><Label text="Найменування повне"/></SimpleItem> 
          <SimpleItem  colSpan={1} editorType="dxCheckBox" dataField="is_supplier"  editorOptions={{ disabled: false }}><Label text="Постачальник"/></SimpleItem> 
          </GroupItem>
          <GroupItem colCount={4}>
          <SimpleItem  colSpan={2}  editorType="dxSelectBox" dataField="individual_legal"  editorOptions={{ disabled: false, items:['ЮрЛицо','ФизЛицо'] }}><Label text="Форма"/></SimpleItem> 
          <SimpleItem  colSpan={1} dataField="inn"  editorOptions={{ disabled: false, mask:'999999999999' }}><Label text="ИНН"/></SimpleItem> 
          </GroupItem>
          <SimpleItem  colSpan={2} dataField="note" render={noteRender} editorOptions={{ disabled: false}}><Label text="Коментар"/></SimpleItem> 
          </Form>
      </div>
    
    )


}

