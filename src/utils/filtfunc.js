import { API_HOST } from './../constants';

export function filterObj (s){
  console.log(s)
  if (!Array.isArray(s[0])){
    var fld = s[0].split('.')[0]
    return {
        fld:fld,
        expr:s[1],
        val:s[2]}
  }
  var result =[]
  s.forEach(element => {
    var exp = element 
    if (Array.isArray(element)) exp = filterObj(element) 
      else exp = {c:element}
    result.push(exp)
  });
    return result
}

export function convertToText(obj) {
  //create an array that will later be joined into a string.
  var string = [];

  //is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (obj === undefined || obj === null)  {
    return String(obj);
  } else if (typeof obj == "object" && obj.join === undefined) {
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
}

const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
};
export const catLoad = (options,cls_name,cls_fields) => {
    // console.log("=Options:" + JSON.stringify(options));

    var filt = options.filter

    if (options.searchExpr && options.searchValue!==null ) {
        filt = [options.searchExpr,options.searchOperation,options.searchValue]
    }
    const _jsonFilter = filt?" jfilt:"+convertToText(filterObj(filt)):''
    //  console.log('_jsonFilter:',_jsonFilter)

    var _offset = "";
    if (options.skip) _offset = ` offset:${options.skip}`;

    var _limit = 100;
    if (options.take) _limit = options.take;

    var _userOptions=''
    if (options.userOptions)
      _userOptions = ' options:'+ convertToText(options.userOptions)

    var _qT = ``;
    if (options.requireTotalCount)
      _qT = `totalcount:${cls_name} (limit:1 ${_jsonFilter}${_userOptions} totalCount:1)  { totalcount} `;

    const q = `{ ${_qT} ${cls_name} (limit:${_limit} ${_jsonFilter}${_offset}${_userOptions}) {${cls_fields}}}`; 

    console.log(q);

    return (
      fetch(API_HOST, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ query: q }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          
          return {
            data: response.data[cls_name],
            totalCount: options.requireTotalCount
              ? response.data.totalcount[0].totalcount
              : undefined,
          };
        })
    );
  }