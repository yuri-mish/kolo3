import  CustomStore  from 'devextreme/data/custom_store';
import { catLoad, handleErrors } from './../../utils/filtfunc';
import { API_HOST } from './../../constants';
const cls_name='noms'
const cls_fields = 'ref name name_full vat_rate'

export const nomsDataSource = new CustomStore({
    key: "ref", 
    byKey: ref => {
      if (!ref) return {ref:ref,name:'',name_full:''}
      const q = `{${cls_name}(ref:"${ref}"){${cls_fields}}}`;
      return fetch(API_HOST, {
        method: "POST",
        body: JSON.stringify({query: q}),
        headers: {"Content-Type":"application/json"},
      })
        .then(handleErrors)
        .then(response => (response.json()))
        .then(response => (response.data[cls_name].length===0)?{ref:ref,name:'',name_full:''}:response.data[cls_name][0])
    },
    load: options => {
      options.userOptions = nomsDataSource.userOptions
      return catLoad(options,cls_name,cls_fields);
    },
  });

  nomsDataSource.userOptions = {}



