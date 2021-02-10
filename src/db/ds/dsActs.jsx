/* eslint-disable react-hooks/exhaustive-deps */
import CustomStore from "devextreme/data/custom_store";

import { docLoad, handleErrors} from "./../../utils/filtfunc";
import { API_HOST, uaFilterRowText } from "./../../constants";

const cls_name = "servise_selling";
const cls_fields =`ref date number_doc  
  partner {ref name} 
  doc_amount 
  trans {ref number_doc caption date}
  note`;

export const actsDataSource = new CustomStore({
  key: "ref",
  byKey: ref => {
    if (!ref) return { ref: '', date: '',number_doc:'' };
    const q = `{${cls_name} (ref:"${ref}") {${cls_fields}}}`;
    return fetch(API_HOST, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ query: q }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })
      .then(handleErrors)
      .then(response => response.json())
      .then(response => {
        
        return response.data[cls_name].length === 0
          ? { ref: '', name: '' }
          : response.data[cls_name][0];
      });
  },
  load: options => {
    const addOptions = {cls_name:cls_name,
                  cls_fields:cls_fields,
                  caption:'Замовлення',
                  capField:'trans'}
    if (options.filter&&options.filter[0]==='ref') 
      return actsDataSource.byKey(options.filter[2])
    return docLoad(options, addOptions);
  },
});


