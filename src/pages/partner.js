import React, { useEffect, useState } from "react";
import { Button, Form, Popup } from 'devextreme-react';
import { useAuth } from "../contexts/auth";
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { partnerDataSource } from './../db/ds/dsPartners';
import { ButtonItem, ButtonOptions, Item, Label, SimpleItem } from "devextreme-react/form";

export const Partner = (props)=>{
    
//    const history = useHistory()  
    let { id } = useParams();

    
    const setP = async (id)=>{
      const partn = await partnerDataSource.byKey(id).then((data)=>{
      setPartner(data)
      return data 
      
    })   
    return partn
    }

    const [ partner, setPartner ] = useState();
    
     
    useEffect(() => {
      console.log('***')
      setP(props._id);
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props._id]);

  return (
      <div>
        
        <Form
            id="form"
            formData={partner}
            //readOnly={readOnly}
            showColonAfterLabel={true}
            labelLocation={'left'}
//            minColWidth={300}
            colCount={2}
            width={1000}
          >
            <Item dataField="edrpou" editorType="dxNumberBox" editorOptions={{ disabled: false }} />
            <ButtonItem horizontalAlignment="left" buttonOptions = {{text: 'Знайти', type: 'success', useSubmitBehavior: true}}/> 
            <SimpleItem  dataField="name"  caption="rrr" editorOptions={{ disabled: false }} /> 
          </Form>

          
      </div>
    
    )


}

