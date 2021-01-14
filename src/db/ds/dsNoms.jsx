import  CustomStore  from 'devextreme/data/custom_store';

import { catLoad } from './../../utils/filtfunc';
import { API_HOST } from './../../constants';
const cls_name='noms'
const cls_fields = 'ref name name_full vat_rate'

export const nomsDataSource = new CustomStore({

    key: "ref", 
    //loadMode:"raw",
    
    byKey: (ref) => {

      if (!ref) return {ref:ref,name:'',name_full:''}
      console.log("=2-Noms=:", ref);
      //var res =  this.load({lookUp:keyf})
      const q = `{${cls_name} (ref:"${ref}" ) { ${cls_fields}} }`;
      
      return fetch(API_HOST, {
        method: "POST",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
//        .then(handleErrors)
        .then((response) => response.json())
        .then((response) => { 
            const res = (response.data[cls_name].length===0)?{ref:ref,name:'',name_full:''}:response.data[cls_name][0]
            console.log("=res:", res);   
            return res
          })
    },


     load: (options) => {
      return catLoad(options,cls_name,cls_fields);
    },
    insert: (val) => {
      console.log("4:");
      return new Promise((resolve, reject) => {
        resolve([{ text: "Test insert" }]);
      })
    },
    remove: (key) => {
      console.log("5:");
      return new Promise((resolve, reject) => {
        resolve();
      })
    },
    update: (dat, values) => {
      console.log("6:");
      return new Promise((resolve, reject) => {
        resolve([{ text: "Test insert" }]);
      })
    },
     
  });



