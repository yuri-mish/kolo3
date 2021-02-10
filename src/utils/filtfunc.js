import { API_HOST } from "./../constants";
import notify from "devextreme/ui/notify";

export const filterObj = s => {
  console.log('filterObj:',s);
  if (!Array.isArray(s[0])) {
    var fld = s[0].split(".")[0];
    return {
      fld: fld,
      expr: s[1],
      val: s[2],
    };
  }
  var result = [];
  s.forEach((element) => {
    var exp = element;
    if (Array.isArray(element)) exp = filterObj(element);
    else exp = { c: element };
    result.push(exp);
  });
  return result;
};

export const convertToText = obj => {
  //create an array that will later be joined into a string.
  var string = [];
  //is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (obj === undefined || obj === null) return String(obj);
  else if (typeof obj == "object" && obj.join === undefined) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
        string.push(prop + ": " + convertToText(obj[prop]));
    }
    return "{" + string.join(",") + "}";
    //is array
  } else if (typeof obj == "object" && !(obj.join === undefined)) {
    for (prop in obj) {
      string.push(convertToText(obj[prop]));
    }
    return "[" + string.join(",") + "]";
    //is function
  } else if (typeof obj == "function") {
    string.push(obj.toString());
    //all other values can be done with JSON.stringify
  } else {
    string.push(JSON.stringify(obj));
  }
  return string.join(",");
};

export const docLoad = async (options,addOptions) => {
const {cls_name,cls_fields}=addOptions
  var filt = options.filter;
  if (options.searchExpr && options.searchValue !== null) {
    filt = [options.searchExpr, options.searchOperation, options.searchValue];
  }
    const _jsonFilter = filt?' jfilt:' + convertToText(filterObj(filt)):'';

  var _offset = '';
  if (options.skip) _offset = ` offset:${options.skip}`;
  
  var _limit = 100;
  if (options.take) _limit = options.take;

  var _userOptions = '';
  if (options.userOptions)
    _userOptions = ' options:' + convertToText(options.userOptions);

  var _qT = '';
  if (options.requireTotalCount)
    _qT = `totalcount:${cls_name}(limit:1 ${_jsonFilter}${_userOptions} totalCount:1){totalcount}`;

  const q = `{${_qT} ${cls_name}(limit:${_limit} ${_jsonFilter}${_offset}${_userOptions}){${cls_fields}}}`;

  console.log(q);

  return fetch(API_HOST, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ query: q }),
    headers: { "Content-Type": "application/json" },
  }).then(handleErrors).then(resp=>(resp.json()))
  .then(resp=>({
      data: resp.data[cls_name],
      totalCount: options.requireTotalCount
        ? resp.data.totalcount[0].totalcount
        : undefined,
  }))
    
  }

export const catLoad =  async (options, cls_name, cls_fields) => {
  
  var filt = options.filter;
  if (options.searchExpr && options.searchValue !== null) {
    filt = [options.searchExpr, options.searchOperation, options.searchValue];
  }
    const _jsonFilter = filt?' jfilt:' + convertToText(filterObj(filt)):'';

  var _offset = '';
  if (options.skip) _offset = ` offset:${options.skip}`;
  
  var _limit = 100;
  if (options.take) _limit = options.take;

  var _userOptions = '';
  if (options.userOptions)
    _userOptions = ' options:' + convertToText(options.userOptions);

  var _qT = '';
  if (options.requireTotalCount)
    _qT = `totalcount:${cls_name}(limit:1 ${_jsonFilter}${_userOptions} totalCount:1){totalcount}`;

  const q = `{${_qT} ${cls_name}(limit:${_limit} ${_jsonFilter}${_offset}${_userOptions}){${cls_fields}}}`;

  console.log(q);

  return fetch(API_HOST, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ query: q }),
    headers: { "Content-Type": "application/json" },
  }).then(handleErrors).then(resp=>(resp.json()))
  .then(resp=>({
      data: resp.data[cls_name],
      totalCount: options.requireTotalCount
        ? resp.data.totalcount[0].totalcount
        : undefined,
  }))
    
};

export const showError = (message) => {
  notify({ message: message, position: { at: "center" } }, "error", 5000);
};
export const showSuccess = (message) => {
  notify({ message: message, position: { at: "center" } }, "success", 5000);
};

export const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};
