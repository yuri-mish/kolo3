/* eslint-disable react-hooks/exhaustive-deps */
import CustomStore from "devextreme/data/custom_store";
import { docLoad, handleErrors} from "./../../utils/filtfunc";
import { API_HOST} from "./../../constants";
var uniqBy = require('lodash/uniqBy');
var orderBy = require('lodash/orderBy');


const cls_name = 'buyers_orders'
const cls_fields = ` _id ref number_doc date caption doc_amount paid shipped note 
  partner {_id ref name} `

export const dsBuyersOrders = new CustomStore({
  key: "ref",
  byKey: ref => {
    if (!ref) return { ref: '', number_doc: '' };
    const q = `{${cls_name} (ref:"${ref}") {
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
      }}}`;
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
          ? { ref: '', number_doc: '' }
          : response.data[cls_name][0];
      });
  },
  load: (options) => {
    const addOptions = options.addOptions||{
      cls_name:cls_name,
      cls_fields:cls_fields,
      }
    if (options.filter&&options.filter[0]==='ref') return dsBuyersOrders.byKey(options.filter[2])
    return docLoad(options, addOptions);
//    return catLoad(options, cls_name,cls_fields);
  },
});

export const dsBuyersOrdersLookup = new CustomStore({
  key:"ref",
  byKey: ref=>(dsBuyersOrders.byKey(ref)),
  load: (options) => {
    options.addOptions = {
      cls_name:cls_name,
      cls_fields: ` ref number_doc date`,
      }
    return dsBuyersOrders.load(options).then(data=>{return orderBy(uniqBy(data.data,"number_doc"),['number_doc'],['asc'])})
   }
})

